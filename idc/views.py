###
# Copyright 2015-2025, Institute for Systems Biology
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###

from builtins import str
import time
import json
from json.decoder import JSONDecodeError
import logging
import sys
import datetime
import re
import copy
from xmlrpc.client import boolean

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import never_cache, cache_page
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib import messages
from django.utils.html import escape
from django.utils.encoding import uri_to_iri

from google_helpers.stackdriver import StackDriverLogger
from cohorts.models import Cohort, Cohort_Perms

from idc_collections.models import Program, DataSource, Collection, ImagingDataCommonsVersion, Attribute, Attribute_Tooltips, DataSetType, Citation
from idc_collections.collex_metadata_utils import (build_explorer_context, get_collex_metadata, create_file_manifest,
                                                   get_cart_data_serieslvl, get_cart_data_studylvl,
                                                   get_table_data_with_cart_data, cart_manifest)
from allauth.socialaccount.models import SocialAccount
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.signals import user_login_failed
from django.dispatch import receiver
from idc.models import User_Data
from solr_helpers import build_solr_query, query_solr_and_format_result

from idc.settings import MAX_FILE_LIST_REQUEST

debug = settings.DEBUG
logger = logging.getLogger(__name__)

BQ_ATTEMPT_MAX = 10
WEBAPP_LOGIN_LOG_NAME = settings.WEBAPP_LOGIN_LOG_NAME


# The site's homepage
@cache_page(60 * 5)
def landing_page(request):
    collex = Collection.objects.filter(active=True, subject_count__gt=6,
                                       collection_type=Collection.ORIGINAL_COLLEX, species='Human',
                                       access="Public").values()
    idc_info = ImagingDataCommonsVersion.objects.get(active=True)

    sapien_counts = {}

    changes = {
        'Head': 'Head and Neck',
        'Head-Neck': 'Head and Neck',
        'Head-and-Neck': 'Head and Neck',
        'Colon': 'Colorectal',
        'Rectum': 'Colorectal',
        "Marrow, Blood": "Blood",
        "Marrow and Blood": "Blood",
        "Testicles": "Testis",
        "Adrenal Glands": "Adrenal Gland",
        "Adrenal": "Adrenal Gland",
        "Lymph Node": "Lymph Nodes",
        "Bone Marrow": "Blood"
    }

    skip = [
        'Extremities',
        'Abdomen, Mediastinum',
        'Abdomen, Pelvis',
        'Abdomen',
        'Ear',
        'Pelvis, Prostate, Anus',
        "Intraocular",
        "Mesothelium",
        "Chest-Abdomen-Pelvis, Leg, TSpine",
        "Abdomen, Arm, Bladder, Chest, Head-Neck, Kidney, Leg, Retroperitoneum, Stomach, Uterus",
        "Blood, Bone",
        "Esophagus, Lung, Pancreas, Thymus",
        "Esophagus, Head-Neck, Lung, Pancreas, Rectum, Thymus",
        "Arm, Bladder, Buttock, Colon, Liver, Myometrium, Pancreas, Rectum, Shoulder, Scapula"
    ]

    for collection in collex:
        loc = collection['location']
        if re.search(r'[Pp]hantom',loc) or re.search('[Vv]arious',loc) or loc in skip:
            continue
        if collection['location'] in changes:
            loc = changes[collection['location']]
        if loc not in sapien_counts:
            sapien_counts[loc] = 0
        sapien_counts[loc] += collection['subject_count']

    ex_tooltips = {
        '1.3.6.1.4.1.14519.5.2.1.6279.6001.224985459390356936417021464571': '<p>Patient ID: LIDC-IDRI-0834</p><p>Modality: CT</p>',
        '1.3.6.1.4.1.14519.5.2.1.1706.4001.149500105036523046215258942545': '<p>Patient ID: TCGA-02-0006</p><p>Modality: MR</p>',
        '1.3.6.1.4.1.14519.5.2.1.2744.7002.950936925946327395356711739684': '<p>Patient ID: QIN-HEADNECK-01-0228</p><p>Modality: PET</p>'
    }

    return render(request, 'idc/landing.html', {
        'request': request,
        'case_counts': [{'site': x, 'cases': sapien_counts[x], 'fileCount': 0} for x in sapien_counts.keys()],
        'example_tooltips': ex_tooltips,
        'idc_info': idc_info
    })


# Displays the privacy policy
def privacy_policy(request):
    return render(request, 'idc/privacy.html', {'request': request, })


# Displays the page of collaborators
def collaborators(request):
    return render(request, 'idc/collaborators.html', {'request': request, })


# News page (loads from Discourse)
def news_page(request):
    return render(request, 'idc/news.html')


# User details page
@login_required
def user_detail(request, user_id):
    if debug: logger.debug('Called ' + sys._getframe().f_code.co_name)

    if int(request.user.id) == int(user_id):

        user = User.objects.get(id=user_id)
        try:
            social_account = SocialAccount.objects.get(user_id=user_id, provider='google')
        except Exception as e:
            # This is a local account
            social_account = None
        user_details = {
            'date_joined':  user.date_joined,
            'email':        user.email,
            'id':           user.id,
            'last_login':   user.last_login
        }

        if social_account:
            user_details['extra_data'] = social_account.extra_data if social_account else None
            user_details['first_name'] = user.first_name
            user_details['last_name'] = user.last_name
        else:
            user_details['username'] = user.username

        return render(request, 'idc/user_detail.html',
                      {'request': request,
                       'user': user,
                       'user_details': user_details,
                       'unconnected_local_account': bool(social_account is None),
                       'social_account': bool(social_account is not None)
                       })
    else:
        return render(request, '403.html')


# Callback method for logs of failed logins
@receiver(user_login_failed)
def user_login_failed_callback(sender, credentials, **kwargs):
    try:
        # Write log entry
        st_logger = StackDriverLogger.build_from_django_settings()
        log_name = WEBAPP_LOGIN_LOG_NAME
        st_logger.write_text_log_entry(
            log_name,
            '[WEBAPP LOGIN] Login FAILED for: {credentials}'.format(credentials=credentials)
        )
    except Exception as e:
        logger.exception(e)


# Extended login view so we can track user logins, redirects to data exploration page
def extended_login_view(request):
    try:
        # Write log entry
        st_logger = StackDriverLogger.build_from_django_settings()
        log_name = WEBAPP_LOGIN_LOG_NAME
        user = User.objects.get(id=request.user.id)
        st_logger.write_text_log_entry(
            log_name,
            "[WEBAPP LOGIN] User {} logged in to the web application at {}".format(user.email,
                                                                             datetime.datetime.utcnow())
        )

    except Exception as e:
        logger.exception(e)

    return redirect(reverse('explore_data'))


# Health check callback
#
# Because the match for vm_ is always done regardless of its presence in the URL
# we must always provide an argument slot for it
def health_check(request, match):
    return HttpResponse('')


# Quota page for the viewer
def quota_page(request):
    return render(request, 'idc/quota.html', {'request': request, 'quota': settings.IMG_QUOTA})


@login_required
def save_ui_hist(request):
    status = 200
    try:
        req = request.GET if request.method == 'GET' else request.POST
        hist = req['his']
        try:
            user_data = User_Data.objects.get(user_id=request.user.id)
            user_data.history = hist
            user_data.save()

        except ObjectDoesNotExist:
            user_data_dict = {'user_id': request.user.id, "history": hist}
            User_Data.objects.update_or_create(**user_data_dict)
    except Exception as e:
        logger.error("[ERROR] While trying to save the user's UI preferences:")
        logger.exception(e)
        status = 500

    return JsonResponse({}, status=status)


# returns various metadata mappings for selected projects used in calculating cart selection
# counts 'on the fly' client side
def studymp(request):
    response = {}
    status = 200
    sources = ImagingDataCommonsVersion.objects.get(active=True).get_data_sources(
            active=True, source_type=DataSource.SOLR,
            aggregate_level="StudyInstanceUID"
        )
    data_types = [DataSetType.IMAGE_DATA, DataSetType.ANCILLARY_DATA, DataSetType.DERIVED_DATA]
    data_sets = DataSetType.objects.filter(data_type__in=data_types)
    aggregate_level='StudyInstanceUID'
    versions=[]
    versions = ImagingDataCommonsVersion.objects.filter(
        version_number__in=versions
    ).get_data_versions(active=True) if len(versions) else ImagingDataCommonsVersion.objects.filter(
        active=True
    ).get_data_versions(active=True)
    aux_sources = data_sets.get_data_sources().filter(
        source_type=DataSource.SOLR,
        aggregate_level__in=["case_barcode", "sample_barcode", aggregate_level],
        id__in=versions.get_data_sources().filter(source_type=DataSource.SOLR).values_list("id", flat=True)
    ).distinct()

    try:
       req = request.GET if request.method == 'GET' else request.POST
       filters = json.loads(req.get('filters', '{}'))

       mxSeries = int(req.get('mxseries'))
       mxStudies= int(req.get('mxstudies'))
       limit = int(req.get('limit', mxStudies))
       offset = int(req.get('offset',0))

       casestudymp = dict()
       studymp = dict()
       projstudymp = dict()

       idsEx = get_collex_metadata(
            filters, ['collection_id', 'PatientID','StudyInstanceUID', 'SeriesInstanceUID'], record_limit=limit,
            sources=sources, offset=offset, records_only=True, custom_facets={}, aux_sources=aux_sources,
            collapse_on='StudyInstanceUID', counts_only=False, filtered_needed=False,
            raw_format=True, default_facets=False, sort=None
        )

       logger.debug("[STATUS] records pulled: {}".format(len(idsEx['docs'])))

       for doc in idsEx['docs']:
          proj=doc['collection_id'][0]
          patientid=doc['PatientID']
          studyid= doc['StudyInstanceUID']
          cnt = len(doc['SeriesInstanceUID'])

          if not patientid in casestudymp:
              casestudymp[patientid]={}
          if not proj in projstudymp:
              projstudymp[proj] = {}
          studymp[studyid]={}
          studymp[studyid]['cnt'] = cnt
          studymp[studyid]['proj'] = proj
          studymp[studyid]['PatientID'] = patientid
          studymp[studyid]['val'] = []
          projstudymp[proj][studyid] = cnt
          casestudymp[patientid][studyid] = cnt

       response["studymp"] = studymp
       response['casestudymp'] = casestudymp
       response['projstudymp'] = projstudymp

    except Exception as e:
        logger.error("[ERROR] While attempting to get studymp:")
        logger.exception(e)
        messages.error(
           request,
           "Encountered an error when attempting to get the studymp - please contact the administrator."
        )
        status = 400

    return JsonResponse(response, status=status)


def populate_tables(request):
    response = {}
    status = 200

    try:
        req = request.GET if request.method == 'GET' else request.POST
        path_arr = [nstr for nstr in request.path.split('/') if nstr]
        table_type = path_arr[len(path_arr)-1]
        table_search = req.get("table_search", "false").lower() == 'true'
        fields = None
        collapse_on = None
        filters = json.loads(req.get('filters', '{}'))

        filtergrp_list = json.loads(req.get('filtergrp_list', '{}'))
        partitions = json.loads(req.get('partitions', '{}'))

        offset = int(req.get('offset', '0'))
        limit = int(req.get('limit', '500'))
        serieslimit = int(req.get('serieslimit', '500'))
        studylimit = int(req.get('studylimit', '500'))
        if limit > settings.MAX_SOLR_RECORD_REQUEST:
            logger.warning("[WARNING] Attempt to request more than MAX_SOLR_RECORD_REQUEST! ({})".format(limit))
            limit = settings.MAX_SOLR_RECORD_REQUEST
        sort = req.get('sort', 'PatientID')
        sortdir = req.get('sortdir', 'asc')

        [cnt, tableRes]=get_table_data_with_cart_data(table_type, sort, sortdir, filters, filtergrp_list, partitions, limit, offset, table_search)

        response["res"] = tableRes
        response["cnt"] = cnt
        response["diff"] = []
    except Exception as e:
        logger.error("[ERROR] While attempting to populate the table:")
        logger.exception(e)
        messages.error(
           request,
           "Encountered an error when attempting to populate the page - please contact the administrator."
        )
        status = 400

    return JsonResponse(response, status=status)


def get_citations(request):
    resp = { 'message': 'error', 'citations': None}
    try:
        req = request.GET if request.method == 'GET' else request.POST
        if request.method == 'GET':
            dois = [uri_to_iri(x) for x in req.getlist("doi", [])]
        else:
            body_unicode = request.body.decode('utf-8')
            body = json.loads(body_unicode)
            dois = body.get("doi", [])
        cites = Citation.objects.filter(doi__in=dois)
        resp['citations'] = {x.doi: x.cite for x in cites}
        code = 200
    except Exception as e:
        logger.error("[ERROR] While fetching citations: ")
        logger.exception(e)
        resp['message'] = "There was an error while attempting to fetch these citations."
        code = 500
    return JsonResponse(resp, status=code)


# Data exploration and cohort creation page
def explore_data_page(request, filter_path=False, path_filters=None):
    context = {'request': request}
    is_json = False
    wcohort = False
    status = 200

    if not request.session.exists(request.session.session_key):
        request.session.create()

    try:
        req = request.GET if request.method == 'GET' else request.POST
        is_dicofdic = (req.get('is_dicofdic', "False").lower() == "true")
        source = req.get('data_source_type', DataSource.SOLR)
        versions = json.loads(req.get('versions', '[]'))
        filters = json.loads(req.get('filters', '{}'))
        with_stats = (req.get('with_stats', 'true').lower() == "true")
        disk_size = (req.get('disk_size', 'False').lower() == "true")

        fields = json.loads(req.get('fields', '[]'))
        order_docs = json.loads(req.get('order_docs', '[]'))
        counts_only = (req.get('counts_only', "true").lower() == "true")
        with_related = (req.get('with_clinical', "True").lower() == "true")
        with_derived = (req.get('with_derived', "True").lower() == "true")
        collapse_on = req.get('collapse_on', 'SeriesInstanceUID')
        if len(Attribute.objects.filter(name=collapse_on)) <= 0:
            logger.error("[ERROR] Attempt to collapse on an invalid field: {}".format(collapse_on))
            collapse_on='SeriesInstanceUID'
        is_json = (req.get('is_json', "False").lower() == "true")
        uniques = json.loads(req.get('uniques', '[]'))
        totals = json.loads(req.get('totals', '[]'))

        cohort_id = int(req.get('cohort_id', '-1'))

        cohort_filters = {}
        if cohort_id > 0:
            cohort = Cohort.objects.get(id=cohort_id, active=True)
            cohort.perm = cohort.get_perm(request)
            if cohort.perm:
                wcohort = True
                cohort_filters_dict = cohort.get_filters_as_dict()
                cohort_filters_list = cohort_filters_dict[0]['filters']
                for cohort in cohort_filters_list:
                    cohort_filters[cohort['name']] = cohort['values']
        if filter_path and is_json:
            filters = path_filters

        if wcohort and is_json:
            filters = cohort_filters

        versions = ImagingDataCommonsVersion.objects.filter(
            version_number__in=versions
        ).get_data_versions(active=True) if len(versions) else ImagingDataCommonsVersion.objects.filter(
            active=True
        ).get_data_versions(active=True)

        context = build_explorer_context(
            is_dicofdic, source, versions, filters, fields, order_docs, counts_only, with_related, with_derived,
            collapse_on, is_json, uniques=uniques, totals=totals, with_stats=with_stats, disk_size=disk_size
        )

        if not('totals' in context):
          context['totals']={}
        if not('PatientID' in context['totals']):
          context['totals']['PatientID']=0
        if not ('StudyInstanceUID' in context['totals']):
          context['totals']['StudyInstanceUID'] = 0
        if not ('SeriesInstanceUID' in context['totals']):
          context['totals']['SeriesInstanceUID'] = 0
        if not ('file_parts_count' in context['totals']):
          context['totals']['file_parts_count'] = 1
        if not ('display_file_parts_count' in context['totals']):
          context['totals']['display_file_parts_count'] = 1
        if not ('disk_size' in context['totals']):
          context['totals']['disk_size'] = '0.0 GB'

        if not is_json:
            # These are filters to be loaded *after* a page render

            if wcohort:
                context['filters_for_load'] = cohort_filters_dict
            elif filter_path:
                context['filters_for_load'] = path_filters
            else:
                filters_for_load = req.get('filters_for_load', None)
                if filters_for_load:
                    raw_filters_for_load = filters_for_load
                    filters_for_load = json.loads(filters_for_load)
                    denylist = re.compile(settings.DENYLIST_RE, re.UNICODE).search(raw_filters_for_load)
                    attr_disallow = re.compile(settings.ATTRIBUTE_DISALLOW_RE, re.UNICODE).search("_".join(filters_for_load.keys()))
                    if denylist or attr_disallow:
                        if denylist:
                            logger.error("[ERROR] Saw possible attack in filters_for_load:")
                        else:
                            logger.warning("[WARNING] Saw bad filter names in filters_for_load:")
                        logger.warning(raw_filters_for_load)
                        filters_for_load = {}
                        messages.error(
                            request,
                            "There was a problem with some of your filters - please ensure they're properly formatted."
                        )
                        status = 400
                else:
                    filters_for_load = None
                context['filters_for_load'] = filters_for_load
            context['hist'] = ''
            try:
                user_data = User_Data.objects.get(user_id=request.user.id)
                context['history'] = json.loads(user_data.history)
            except ObjectDoesNotExist:
                pass

    except JSONDecodeError as e:
        logger.error("[ERROR] While attempting to load the search page:")
        logger.error("Invalid JSON format received.")
        logger.exception(e)
        messages.error(
            request,
            "The filters supplied contained invalid JSON."
        )
        status = 400
    except Exception as e:
        logger.error("[ERROR] While attempting to load the search page:")
        logger.exception(e)
        messages.error(
            request,
            "Encountered an error when attempting to load the page - please contact the administrator."
        )
        status = 500

    if is_json:
        # In the case of is_json=True, the 'context' is simply attr_by_source
        return JsonResponse(context, status=status)

    try:
        return render(request, 'idc/explore.html', context)
    except Exception as e:
        logger.error("[ERROR] While attempting to render the search page:")
        logger.exception(e)

    return redirect(reverse('landing_page'))


def explorer_manifest(request):
    try:
        req = request.GET if request.method == 'GET' else request.POST
        if req.get('manifest-type', 'file-manifest') == 'bq-manifest' :
            messages.error(request, "BigQuery export requires a cohort! Please save your filters as a cohort.")
            return JsonResponse({'msg': 'BigQuery export requires a cohort.'}, status=400)
        return create_file_manifest(request)
    except Exception as e:
        logger.error("[ERROR] While attempt to create a manifest:")
        logger.exception(e)
    return redirect(reverse('cart'))


# Given a set of filters in a GET request, parse the filter set out into a filter set recognized
# by the explore_data_page method and forward it on to that view, returning its response.
def parse_explore_filters(request):
    try:
        if not request.GET or request.method != 'GET':
            raise Exception("This call only supports GET!")
        raw_filters = {x: request.GET.getlist(x) for x in request.GET.keys()}
        filters = {}
        filter_ops = {}
        for x in raw_filters:
            if re.search('_op', x):
                filter_ops[x[:x.rfind('_')]] = raw_filters[x][0]
            else:
                filters[x] = raw_filters[x]
        # determine if any of the filters are misnamed
        filter_name_map = {(x[:x.rfind('_')] if re.search('_[gl]te?|_e?btwe?', x) else x): x for x in filters.keys()}
        attr_names = filter_name_map.keys()
        attrs = Attribute.objects.filter(name__in=attr_names)
        attr_map = {x.name: {"id": x.id, "filter": filter_name_map[x.name]} for x in attrs}
        not_found = [x for x in attr_names if x not in attr_map.keys()]
        denylist = re.compile(settings.DENYLIST_RE, re.UNICODE).search(str(filters))
        attr_disallow = re.compile(settings.ATTRIBUTE_DISALLOW_RE, re.UNICODE).search("_".join(filters.keys()))
        if denylist or attr_disallow:
            if denylist:
                logger.error("[ERROR] Saw possible attack attempt!")
            else: 
                logger.warning("[WARNING] Saw bad filters in filters_for_load:")
            logger.warning(str(filters))
            messages.error(
                request,
                "There was a problem with some of your filters - please ensure they're properly formatted."
            )
        else:
            if len(not_found) > 0:
                not_rec = "{}".format("; ".join(not_found))
                logger.warning("[WARNING] Saw invalid filters while parsing explore/filters call:")
                logger.warning(not_rec)
                messages.warning(request, "The following attribute names are not recognized: {}".format(escape(not_rec)))
            else:
                if len(attrs) > 0:
                    filters = [{
                        "id": attr_map[x]['id'],
                        "values": filters[attr_map[x]['filter']],
                        "op": filter_ops.get(x, 'OR')
                    } for x in attr_map]
                    return explore_data_page(request, filter_path=True, path_filters=[{"filters": filters}])

    except Exception as e:
        logger.error("[ERROR] While parsing filters for the explorer page:")
        logger.exception(e)

    return redirect(reverse('explore_data'))


# Callback for recording the user's agreement to the warning popup
def warn_page(request):
    request.session['seenWarning'] = True;
    return JsonResponse({'warning_status': 'SEEN'}, status=200)


# About page
@cache_page(60 * 15)
def about_page(request):
    return render(request, 'idc/about.html', {'request': request})


def cart_page(request):
    context = {'request': request}

    if not request.session.exists(request.session.session_key):
        request.session.create()

    try:
        req = request.GET if request.method == 'GET' else request.POST
        carthist = json.loads(req.get('carthist', '{}'))
        mxseries = req.get('mxseries',0)
        mxstudies = req.get('mxstudies',0)
        stats = req.get('stats', '')

        context['carthist'] = carthist
        context['mxseries'] = mxseries
        context['mxstudies'] = mxstudies
        context['stats'] = stats

    except Exception as e:
        logger.error("[ERROR] While loading cart_page:")
        logger.exception(e)

    return render(request, 'collections/cart_list.html', context)


def cart_data(request):
    status = 200
    response = {}
    field_list = ['collection_id', 'PatientID', 'StudyInstanceUID', 'SeriesInstanceUID', 'aws_bucket', "source_DOI"]
    try:
        req = request.GET if request.method == 'GET' else request.POST
        filtergrp_list = json.loads(req.get('filtergrp_list', '{}'))
        aggregate_level = req.get('aggregate_level', 'StudyInstanceUID')
        results_level = req.get('results_level', 'StudyInstanceUID')
        dois_only = bool(req.get('dois_only', 'false').lower() == 'true')

        partitions = json.loads(req.get('partitions', '{}'))

        limit = min(int(req.get('limit', 500)),500)
        offset = int(req.get('offset', 0))
        length = int(req.get('length', 100))
        mxseries = int(req.get('mxseries',1000))

        if len(partitions) <= 0 or aggregate_level not in ['SeriesInstanceUID', 'StudyInstanceUID']:
            response['numFound'] = 0
            response['docs'] = []
        else:
            if aggregate_level == 'StudyInstanceUID':
                response = get_cart_data_studylvl(
                    filtergrp_list, partitions, limit, offset, length, mxseries, with_records=(not dois_only),
                    results_lvl=results_level, dois_only=dois_only
                )
            elif aggregate_level == 'SeriesInstanceUID':
                response = get_cart_data_serieslvl(
                    filtergrp_list, partitions, field_list if not dois_only else None, limit, offset,
                    with_records=(not dois_only), dois_only=dois_only
                )
        if dois_only:
            response = {'dois': response['dois']}
    except Exception as e:
        logger.error("[ERROR] While loading cart:")
        logger.exception(e)
        status = 400

    return JsonResponse(response, status=status)


def get_series(request, collection_id=None, patient_id=None, study_uid=None):
    status = 200
    response = {"result": []}
    try:
        fields = ["collection_id", "PatientID", "StudyInstanceUID", "Modality", "crdc_series_uuid", "SeriesInstanceUID", "aws_bucket", "instance_size"]
        result = {}
        if not collection_id:
            # This is a request for filters and/or a cart
            body_unicode = request.body.decode('utf-8')
            body = json.loads(body_unicode)
            partitions = body.get("partitions", {})
            filtergrp_list = body.get("filtergrp_list", {})
            if not(len(partitions) or len(filtergrp_list)):
                raise Exception("You can only request series IDs based on a filter, collection ID, Patient ID, or study ID!")
            if len(partitions):
                result = cart_manifest(filtergrp_list, partitions, 0, fields, MAX_FILE_LIST_REQUEST)
            else:
                source = ImagingDataCommonsVersion.objects.get(active=True).get_data_sources(
                    active=True, source_type=DataSource.SOLR,
                    aggregate_level="SeriesInstanceUID"
                ).first()
                filter_query = build_solr_query(
                    { w: v for x in filtergrp_list for w, v in list(x.items())},
                    with_tags_for_ex=False,
                    search_child_records_by=None, solr_default_op='AND'
                )
                result = query_solr_and_format_result(
                    {
                        "collection": source.name,
                        "fields": fields,
                        "query_string": None,
                        "fqs": [filter_query['full_query_str']],
                        "facets": {'instance_size': 'sum(instance_size)'}, "sort": None, "counts_only": False, "limit": MAX_FILE_LIST_REQUEST,
                        "totals": ['SeriesInstanceUID', 'collection_id', 'PatientID', 'StudyInstanceUID']
                    },
                    normalize_facets=False
                )
        else:
            source = ImagingDataCommonsVersion.objects.get(active=True).get_data_sources(
                active=True, source_type=DataSource.SOLR,
                aggregate_level="SeriesInstanceUID"
            ).first()
            filters = {
                "collection_id": [collection_id]
            }
            if patient_id:
                filters['PatientID'] = [patient_id]
            if study_uid:
                filters["StudyInstanceUID"] = [study_uid]
            filter_query = build_solr_query(
                filters,
                with_tags_for_ex=False,
                search_child_records_by=None, solr_default_op='AND'
            )
            result = query_solr_and_format_result(
                {
                    "collection": source.name,
                    "fields": fields,
                    "query_string": None,
                    "fqs": [filter_query['full_query_str']],
                    "facets": None, "sort": None, "counts_only": False, "limit": MAX_FILE_LIST_REQUEST
                }
            )

        for doc in result['docs']:
            response['result'].append({
                "series_id": doc['SeriesInstanceUID'],
                "crdc_series_id": doc['crdc_series_uuid'],
                "bucket": doc['aws_bucket'][0],
                "series_size": doc['instance_size'][0],
                "modality": doc['Modality'][0],
                "study_id": doc['StudyInstanceUID'],
                "patient_id": doc["PatientID"],
                "collection_id": doc['collection_id'][0]
            })
        if 'facets' in result:
            response['download_stats'] = {
                'series_count': result['facets']['total_SeriesInstanceUID'],
                'study_count': result['facets']['total_StudyInstanceUID'],
                'collection_count': result['facets']['total_collection_id'],
                'case_count': result['facets']['total_PatientID'],
                'queue_byte_size': result['facets']['instance_size'],
            }

    except Exception as e:
        logger.error("[ERROR] While fetching series per study ID:")
        logger.exception(e)
        response['message'] = "Error while retrieving series IDs"
        status = 400

    return JsonResponse(response, status=status)


# User dashboard, where saved cohorts (and, in the future, uploaded/indexed data) are listed
@login_required
def dashboard_page(request):
    context = {'request': request}

    try:
        # Cohort List
        cohort_perms = list(set(Cohort_Perms.objects.filter(user=request.user).values_list('cohort', flat=True)))
        # TODO: Add in 'date created' and sort on that
        context['cohorts'] = Cohort.objects.filter(id__in=cohort_perms, active=True).order_by('-name')

    except Exception as e:
        logger.error("[ERROR] While attempting to load the dashboard:")
        logger.exception(e)

    return render(request, 'idc/dashboard.html', context)
