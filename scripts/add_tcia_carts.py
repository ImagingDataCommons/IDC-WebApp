import copy
import requests
import os
import re
import logging
import json
from idc import secret_settings, settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "idc.settings")
import django
django.setup()

from idc.models import SharedCart
from idc_collections.models import ImagingDataCommonsVersion
from solr_helpers import query_solr_and_format_result

logger = logging.getLogger(__name__)

manifest_src = "https://www.cancerimagingarchive.net/wp-content/uploads/"
manifest_list = [
    "ACRIN-6698-Primary-Analysis-Subgroup-manifest.tcia", "ACRIN-6698-Test-retest-set_20210506.tcia",
    "BMMR2-Training-set_20210506.tcia", "BMMR2-Testing-set_20210506.tcia", "BSC-DBT-Train-manifest.tcia",
    "BSC-DBT-Validation-manifest.tcia", "BSC-DBT-Test-manifest.tcia", "CPTAC-RareKidney_v14_20250707.tcia",
    "LIDC-IDRI-StandardizedRepresentation-March2020-manifest.tcia", "TCGA-BRCA_SR.tcia", "ISPY1_SR.tcia",
    "BREAST-DIAGNOSIS_SR.tcia", "Breast-MRI-NACT-Pilot_SR.tcia", "BreastAndFGT_MRI_SEG_only_20220609.tcia",
    "ISPY2-Cohort1-inclu-ACRIN6698-full-manifest.tcia", "LDCT-and-Projection-data-Phantom-April-6-2020.tcia",
    "Pseudo-Phi-DICOM-Evaluation-dataset-April-7-2021.tcia",
    "Pseudo-PHI-DICOM-De-id-Evaluation-dataset-April-7-2021.tcia", "qin-dce-mri-challenge_Matlab.tcia",
    "QIN-Multi-site-Lung-SEG-Only-minus-Stanford.tcia", "QIN-Multi-site-Lung-CTs-and-SEG-minus-Stanford.tcia",
    "RIDER-Lung-CT-RTSTRUCTS-DICOM-SEGS-Leonard-Wee-Feb-10-2020.tcia"
]

PART_TEMPLATE = {
    "not": [],
    "id": [],
    "filt": [
        [0]
    ],
    "null": False
}

CART_HIST_TEMPLATE  = {
    "filter": {},
    "selections": [
        # {
        #     "added": true,
        #     "sel": ["acrin_6698", "ACRIN-6698-102212", "1.3.6.1.4.1.14519.5.2.1.7695.4164.181609193230590889657798213902", "1.3.6.1.4.1.14519.5.2.1.7695.4164.844690293418405195408929852593"]
        # }
    ],
    "partitions": [
        # ["acrin_6698"],
        # ["acrin_6698", "ACRIN-6698-102212"],
        # ["acrin_6698", "ACRIN-6698-102212", "1.3.6.1.4.1.14519.5.2.1.7695.4164.181609193230590889657798213902"],
        # ["acrin_6698", "ACRIN-6698-102212", "1.3.6.1.4.1.14519.5.2.1.7695.4164.181609193230590889657798213902", "1.3.6.1.4.1.14519.5.2.1.7695.4164.101836283294115825849413469418"],
    ]
}


CART_TEMPLATE = {
	"cart_type": "manifest",
    "partitions": [],
    "filtergrp_list": [{}],
    "cart_hist": [
    ],
    "proj_in_cart": {
#        "acrin_6698": {
#            "cases": 1,
#            "studies": 1,
#            "series": 7
    }
}

# -> Call Solr for stat block
# -> make cart def

carts = []

try:
    for manifest in manifest_list:
        series_ids = []
        cart = copy.deepcopy(CART_TEMPLATE)
        manifest_res = requests.get(manifest_src + manifest, stream=True)
        if manifest_res.status_code != 200:
            raise Exception(f"Saw {manifest_res.status_code} response code for manifest {manifest}--cancelling!")
        for line in manifest_res.iter_lines():
            line = line.decode("utf-8")
            if re.match(r'^[^\d]',line):
                continue
            else:
                if len(line) > 1:
                    series_ids.append(line)
        if len(series_ids) and len(series_ids) <= 64000:
            print(f"Pulling IDC v24 for {manifest}...")
            res = query_solr_and_format_result({
                'collection': 'dicom_derived_series_v24',
                'fields': ['collection_id', 'PatientID','StudyInstanceUID','SeriesInstanceUID'],
                'fqs': ["{!terms f=SeriesInstanceUID}"+f"{','.join(series_ids)}"],
                'sort': "collection_id asc, PatientID asc, StudyInstanceUID asc, SeriesInstanceUID asc",
                'facets': {
                    'cases_per_collec': {'type': 'terms', 'field': 'collection_id', 'limit': -1,
                       'facet': {'unique_count': 'unique(PatientID)'}},
                    'studies_per_collec': {'type': 'terms', 'field': 'collection_id', 'limit': -1,
                        'facet': {'unique_count': 'unique(StudyInstanceUID)'}},
                    'series_per_collec':{'type': 'terms', 'field': 'collection_id', 'limit': -1,
                        'facet': {'unique_count': 'unique(SeriesInstanceUID)'}}
                },
                'counts_only': False,
                'limit': 64000
            })
            if not res['numFound']:
                logger.warning(f"No results returned for {manifest}--skipping!")
            else:
                print(f"{res['numFound']} series identified for {manifest}")
                if res['numFound'] != len(series_ids):
                    print(f"[WARNING] COUNT MISMATCH in {manifest}, expected {len(series_ids)}, saw {res['numFound']}")
                    with open(f"{manifest}_mismatch.txt", "a") as f:
                        f.write(f"TCIA manifest count: {len(series_ids)},IDC v24 series IDs: {res['numFound']}\n")
                        f.write("TCIA series IDs from manifest:\n")
                        f.write("\n".join(series_ids))
                        f.write("\n")
                        f.write("IDC series found in v24:\n")
                        f.write("\n".join([x['SeriesInstanceUID'] for x in res['docs']]))
                curr_collex = None
                curr_case = None
                curr_study = None
                cart_hist = copy.deepcopy(CART_HIST_TEMPLATE)
                for series in res['docs']:
                    series['collection_id'] = series['collection_id'][0]
                    if series['collection_id'] != curr_collex:
                        curr_collex = series['collection_id']
                        cart_hist['partitions'].append([curr_collex])
                    if series['PatientID'] != curr_case:
                        curr_case = series['PatientID']
                        cart_hist['partitions'].append([curr_collex, curr_case])
                    if series['StudyInstanceUID'] != curr_study:
                        curr_study = series['StudyInstanceUID']
                        cart_hist['partitions'].append([curr_collex, curr_case, curr_study])
                    part = copy.deepcopy(PART_TEMPLATE)
                    ids = [series['collection_id'],series['PatientID'],series['StudyInstanceUID'],series['SeriesInstanceUID']]
                    part['id'] = ids
                    cart['partitions'].append(part)
                    cart_hist['partitions'].append(ids)
                    cart_hist['selections'].append({"added": True, "sel": ids})
                cart['cart_hist'].append(cart_hist)

                cart['proj_in_cart'] = {}
                for facet_name, facet in res['facets'].items():
                    for proj, count in facet.items():
                        if proj not in cart['proj_in_cart']:
                            cart['proj_in_cart'][proj] = {}
                        cat = facet_name.split("_")[0]
                        cart['proj_in_cart'][proj][cat] = count
                new_cart = SharedCart.objects.create(
                    source_ip="10.0.0.2", series_ids=";".join(series_ids),
                    definition=json.dumps(cart),
                    idc_version=ImagingDataCommonsVersion.objects.get(active=True), cart_id=manifest.split(".")[0]
                )
        else:
            raise Exception(f"No series IDs found!" if not len(series_ids) else "Greater than 64k series IDs seen--skipping!")
except Exception as e:
    logger.exception(e)
    logger.error(e)

