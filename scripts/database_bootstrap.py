###
# Copyright 2015-2020, Institute for Systems Biology
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

from __future__ import print_function

from builtins import str
from builtins import object
import datetime
import logging
import traceback
import os
import re
import csv
from argparse import ArgumentParser
import sys
import time
from copy import deepcopy
from itertools import combinations, product

from idc import secret_settings, settings

PREFORMATTED_CLIN_ATTR = []

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "idc.settings")

import django
django.setup()

from idc_collections.models import Program, Collection, Attribute, Attribute_Ranges, \
    Attribute_Display_Values, DataSource, DataSourceJoin, DataVersion, DataSetType, \
    Attribute_Set_Type, Attribute_Display_Category

from django.contrib.auth.models import User
idc_superuser = User.objects.get(username="idc")

logger = logging.getLogger('main_logger')


def new_attribute(name, displ_name, type, display_default, cross_collex=False, units=None):
    return {
                'name': name,
                "display_name": displ_name,
                "type": type,
                'units': units,
                'cross_collex': cross_collex,
                'solr_collex': [],
                'bq_tables': [],
                'set_types': [],
                'display': display_default,
                'categories': []
            }


def add_data_sets(sets_set):
    for dss in sets_set:
        try:
            obj, created = DataSetType.objects.update_or_create(name=dss['name'], data_type=dss['data_type'], set_type=dss['set_type'])

            print("Data Set Type created:")
            print(obj)
        except Exception as e:
            logger.error("[ERROR] Data Version {} may not have been added!".format(dss['name']))
            logger.exception(e)


def add_data_versions(dv_set):
    for dv in dv_set:
        try:
            obj, created = DataVersion.objects.update_or_create(name=dv['name'], version=dv['ver'])

            progs = Program.objects.filter(name__in=dv['progs'])
            ver_to_prog = []

            for prog in progs:
                ver_to_prog.append(DataVersion.programs.through(dataversion_id=obj.id, program_id=prog.id))

            DataVersion.programs.through.objects.bulk_create(ver_to_prog)

            print("Data Version created:")
            print(obj)
        except Exception as e:
            logger.error("[ERROR] Data Version {} may not have been added!".format(dv['name']))
            logger.exception(e)


def add_programs(program_set):
    for prog in program_set:
        try:
            obj, created = Program.objects.update_or_create(
                short_name=prog['short_name'], name=prog['full_name'], is_public=prog['public'],
                owner=User.objects.get(email=prog['owner']) if 'owner' in prog else idc_superuser)

            print("Program created:")
            print(obj)
        except Exception as e:
            logger.error("[ERROR] Program {} may not have been added!".format(prog['short_name']))
            logger.exception(e)

def add_data_source(source_set, versions, programs, data_sets, source_type):
    for source in source_set:
        try:
            obj, created = DataSource.objects.update_or_create(
                name=source,
                count_col="case_barcode" if "tcga" in source else "PatientID",
                source_type=source_type
            )

            progs = Program.objects.filter(name__in=programs)
            src_to_prog = []
            for prog in progs:
                src_to_prog.append(DataSource.programs.through(datasource_id=obj.id, program_id=prog.id))
            DataSource.programs.through.objects.bulk_create(src_to_prog)

            data_versions = DataVersion.objects.filter(name__in=versions)
            versions_to_source = []
            for dv in data_versions:
                versions_to_source.append(DataSource.versions.through(dataversion_id=dv.id, datasource_id=obj.id))
            DataSource.versions.through.objects.bulk_create(versions_to_source)

            datasets = DataSetType.objects.filter(name__in=data_sets)
            datasets_to_source = []
            for data_set in datasets:
                datasets_to_source.append(DataSource.data_sets.through(datasource_id=obj.id, datasettype_id=data_set.id))
            DataSource.data_sets.through.objects.bulk_create(datasets_to_source)

            print("DataSource entry created: {}".format(source))
        except Exception as e:
            logger.error("[ERROR] DataSource {} may not have been added!".format(source))
            logger.exception(e)

def add_source_joins(froms, from_col, tos=None, to_col=None):
    src_joins = []

    if not tos and not to_col:
        joins = combinations(froms, 2)
        for join in joins:
            for from_join in DataSource.objects.filter(name=join[0]):
                for to_join in DataSource.objects.filter(name=join[1]):
                    src_joins.append(DataSourceJoin(
                        from_src=from_join,
                        to_src=to_join,
                        from_src_col=from_col,
                        to_src_col=from_col)
                    )
    else:
        joins = product(froms,tos)
        for join in joins:
            for from_join in DataSource.objects.filter(name=join[0]):
                for to_join in DataSource.objects.filter(name=join[1]):
                    src_joins.append(DataSourceJoin(
                        from_src=from_join,
                        to_src=to_join,
                        from_src_col=from_col,
                        to_src_col=to_col)
                    )

    if len(src_joins):
        DataSourceJoin.objects.bulk_create(src_joins)

def add_collections(collection_set):
    collex_list = []
    try:
        for collex in collection_set:

            collex_list.append(
                Collection(
                    short_name=collex['short_name'], name=collex['full_name'], description=collex['description'],
                    is_public=collex['public'],
                    owner=User.objects.get(email=collex['owner']) if 'owner' in collex else idc_superuser
                )
            )

        Collection.objects.bulk_create(collex_list)

        for collex in collection_set:
            obj = Collection.objects.get(
                short_name=collex['short_name'], name=collex['full_name'], is_public=collex['public'],
                owner=User.objects.get(email=collex['owner']) if 'owner' in collex else idc_superuser
            )

            if len(collex.get('progs',[])):
                progs = Program.objects.filter(
                    short_name__in=collex['progs'], owner=collex['owner'] if 'owner' in collex else idc_superuser,
                    active=True)
                collex_to_prog = []
                for prog in progs:
                    collex_to_prog.append(Collection.program.through(collection_id=obj.id, program_id=prog.id))
                Collection.program.through.objects.bulk_create(collex_to_prog)

            if len(collex.get('data_versions',[])):
                collex_to_dv = []
                data_versions = DataVersion.objects.filter(name__in=collex['data_versions'])
                for dv in data_versions:
                    collex_to_dv.append(Collection.data_versions.through(collection_id=obj.id, dataversion_id=dv.id))

                Collection.data_versions.through.objects.bulk_create(collex_to_dv)

    except Exception as e:
        logger.error("[ERROR] Collection {} may not have been added!".format(collex['short_name']))
        logger.exception(e)


def add_attributes(attr_set):
    for attr in attr_set:
        try:
            obj, created = Attribute.objects.update_or_create(
                name=attr['name'], display_name=attr['display_name'], data_type=attr['type'],
                preformatted_values=True if 'preformatted_values' in attr else False,
                is_cross_collex=True if 'cross_collex' in attr else False,
                default_ui_display=attr['display'],
                units=attr.get('units',None)
            )
            if 'range' in attr:
                if len(attr['range']):
                    for attr_range in attr['range']:
                        Attribute_Ranges.objects.update_or_create(
                            **attr_range, attribute=obj
                        )
                else:
                    Attribute_Ranges.objects.update_or_create(
                        attribute=obj
                    )
            if len(attr.get('display_vals',[])):
                for dv in attr['display_vals']:
                    Attribute_Display_Values.objects.update_or_create(
                        raw_value=dv['raw_value'], display_value=dv['display_value'], attribute=obj
                    )
            if len(attr.get('solr_collex',[])):
                for sc in DataSource.objects.filter(name__in=attr['solr_collex']):
                    obj.data_sources.add(sc)
            if len(attr.get('bq_tables',[])):
                for bqt in DataSource.objects.filter(name__in=attr['bq_tables']):
                    obj.data_sources.add(bqt)
            if len(attr.get('set_types',[])):
                for set_type in DataSetType.objects.filter(data_type__in=attr['set_types']):
                    Attribute_Set_Type.objects.update_or_create(
                        datasettype=set_type, attribute=obj
                    )
            if len(attr.get('categories',[])):
                for cat in attr['categories']:
                    Attribute_Display_Category.objects.update_or_create(
                        category=cat['name'], category_display_name=cat['display_name'], attribute=obj
                    )

        except Exception as e:
            logger.error("[ERROR] Attribute {} may not have been added!".format(attr['name']))
            logger.exception(e)


def main():

    try:
        add_programs([{
            "full_name": "The Cancer Genome Atlas",
            "short_name": "TCGA",
            "public": True
        },
        {
            "full_name": "Quantitative Imagine Network",
            "short_name": "QIN",
            "public": True
        },
        {
            "full_name": "I-SPY TRIAL",
            "short_name": "ISPY1",
            "public": True
        },
        {
            "full_name": "Non-Small-Cell Lung Carcinoma Radiomics",
            "short_name": "NSCLC",
            "public": True
        },
        {
            "full_name": "Lung Image Database Consortium",
            "short_name": "LIDC",
            "public": True
        }])

        add_data_sets([
            {'name': 'IDC Source Data', 'data_type': 'I', 'set_type': 'O'},
            {'name': 'Clinical, Biospecimen, and Mutation Data', 'data_type': 'A', 'set_type': 'C'},
            {'name': 'Derived Data', 'data_type': 'D', 'set_type': 'R'}
        ])

        add_data_versions([
            {"name": "GDC Data Release 9", "ver": "r9", "progs":["TCGA"]},
            {"name": "TCIA Image Data", "ver": "1","progs":["TCGA", "NSCLC", "ISPY1", "QIN", "LIDC"]},
            {"name": "TCIA Derived Data", "ver": "1", "progs":["LIDC"]},
        ])

        add_data_source(['dicom_derived_all'], ["TCIA Image Data", "TCIA Derived Data"],["TCGA", "NSCLC", "ISPY1", "QIN", "LIDC"], ["IDC Source Data", "Derived Data"], DataSource.SOLR)
        add_data_source(['tcga_clin', 'tcga_bios'], ["GDC Data Release 9"],["TCGA"], ["Clinical, Biospecimen, and Mutation Data"], DataSource.SOLR)

        add_data_source(["idc-dev.metadata.dicom_mvp"], ["TCIA Image Data"],["TCGA", "NSCLC", "ISPY1", "QIN", "LIDC"], ["IDC Source Data"], DataSource.BIGQUERY)
        add_data_source(['isb-cgc.TCGA_bioclin_v0.Biospecimen', 'isb-cgc.TCGA_bioclin_v0.Clinical'], ["GDC Data Release 9"],["TCGA"], ["Clinical, Biospecimen, and Mutation Data"], DataSource.BIGQUERY)
        add_data_source(["idc-dev.metadata.segmentations"], ["TCIA Derived Data"],["LIDC"], ["Derived Data"], DataSource.BIGQUERY)
        add_data_source(["idc-dev.metadata.qualitative_measurements"], ["TCIA Derived Data"],["LIDC"], ["Derived Data"], DataSource.BIGQUERY)
        add_data_source(["idc-dev.metadata.quantitative_measurements"], ["TCIA Derived Data"],["LIDC"], ["Derived Data"], DataSource.BIGQUERY)

        add_source_joins(["tcga_clin", "tcga_bios"], "case_barcode")
        add_source_joins(
            ["dicom_derived_all"],
            "PatientID",
            ["tcga_clin", "tcga_bios"], "case_barcode"
        )

        add_source_joins(["idc-dev.metadata.dicom_mvp", "idc-dev.metadata.segmentations", "idc-dev.metadata.qualitative_measurements", "idc-dev.metadata.quantitative_measurements"], "SOPInstanceUID")
        add_source_joins(["isb-cgc.TCGA_bioclin_v0.Clinical", "isb-cgc.TCGA_bioclin_v0.Biospecimen"], "case_barcode")
        add_source_joins(
            ["idc-dev.metadata.dicom_mvp", "idc-dev.metadata.segmentations", "idc-dev.metadata.qualitative_measurements", "idc-dev.metadata.quantitative_measurements"],
            "PatientID",
            ["isb-cgc.TCGA_bioclin_v0.Clinical", "isb-cgc.TCGA_bioclin_v0.Biospecimen"], "case_barcode"
        )

        all_attrs = {}

        collection_file = open("tcia_collex.csv", "r")
        line_reader = collection_file.readlines()
        collection_set = []

        for line in line_reader:
            line = line.strip()
            line_split = line.split(",")
            collex = {
                "id": line_split[0],
                "short_name": line_split[1], "full_name": line_split[2], "public": True,
                "description": line_split[3], "program": line_split[4],
                "data_versions": [{"ver": "r9", "name": "GDC Data Release 9"},
                                  {"ver": "1", "name": "TCIA Image Data"}]
            }
            if 'lidc' in line_split[0]:
                collex['data_versions'].append({"ver": "1", "name": "TCIA Derived Data"})
            if 'tcga' in line_split[0]:
                collex['progs'] = ["TCGA"]
            collection_set.append(collex)

        add_collections(collection_set)

        collection_file.close()

        attr_vals_file = open("display_vals.csv", "r")
        line_reader = attr_vals_file.readlines()
        display_vals = {}

        for line in line_reader:
            line = line.strip()
            line_split = line.split(",")
            if line_split[0] not in display_vals:
                display_vals[line_split[0]] = {}
                if line_split[1] == 'NULL':
                    display_vals[line_split[0]]['preformatted_values'] = True
                else:
                    display_vals[line_split[0]]['vals'] = [{'raw_value': line_split[1], 'display_value': line_split[2]}]
            else:
                display_vals[line_split[0]]['vals'].append({'raw_value': line_split[1], 'display_value': line_split[2]})

        attr_vals_file.close()

        attr_file = open("tcga_clin.csv", "r")
        line_reader = attr_file.readlines()
        clin_table_attr = []
        for line in line_reader:
            line = line.strip()
            clin_table_attr.append(line)

        attr_file.close()

        attr_file = open("tcga_bios.csv", "r")
        line_reader = attr_file.readlines()
        bios_table_attr = []
        for line in line_reader:
            line = line.strip()
            bios_table_attr.append(line)

        attr_file.close()

        attr_file = open("tcga_attributes.csv", "r")
        line_reader = attr_file.readlines()
        attr_set = []

        for line in line_reader:
            line = line.strip()
            line_split = line.split(",")

            if line_split[0] not in all_attrs:
                all_attrs[line_split[0]] = new_attribute(
                    line_split[0],
                    line_split[0].replace("_", " ").title() if re.search(r'_', line_split[1]) else line_split[1],
                    Attribute.CATEGORICAL if line_split[2] == 'CATEGORICAL STRING' else Attribute.STRING if line_split[2] == "STRING" else Attribute.CONTINUOUS_NUMERIC,
                    True if line_split[-1] == 'True' else False
                )

            attr = all_attrs[line_split[0]]

            attr['set_types'].append(DataSetType.ANCILLARY_DATA)

            if attr['name'] in clin_table_attr:
                attr['solr_collex'].append('tcga_clin')
                attr['bq_tables'].append('isb-cgc.TCGA_bioclin_v0.Clinical')

            if attr['name'] in bios_table_attr:
                attr['solr_collex'].append('tcga_bios')
                attr['bq_tables'].append('isb-cgc.TCGA_bioclin_v0.Biospecimen')

            if attr['name'] in display_vals:
                if 'preformatted_values' in display_vals[attr['name']]:
                    attr['preformatted_values'] = True
                else:
                    attr['display_vals'] = display_vals[attr['name']]['vals']

            if attr['name'] == 'bmi':
                attr['range'] = [
                    {'label': 'underweight', 'first': "*", "last": "18.5", "gap": "0", "include_lower": True, "include_upper": False, 'type': 'F'},
                    {'label': 'obese', 'first': "30", "last": "*", "gap": "0", "include_lower": True,
                     "include_upper": True, 'type': 'F'},
                    {'label': 'normal weight', 'first': "18.5", "last": "25", "gap": "0", "include_lower": True,
                     "include_upper": False, 'type': 'F'},
                    {'label': 'overweight', 'first': "25", "last": "30", "gap": "0", "include_lower": True,
                     "include_upper": False, 'type': 'F'}
                ]
            elif attr['type'] == Attribute.CONTINUOUS_NUMERIC:
                attr['range'] = []

            attr_set.append(attr)

        attr_file.close()

        attr_file = open("tcia_attr.csv", "r")
        line_reader = attr_file.readlines()

        for line in line_reader:
            line = line.strip()
            line_split = line.split(",")

            if line_split[0] not in all_attrs:
                all_attrs[line_split[0]] = new_attribute(
                    line_split[0],
                    line_split[0].replace("_", " ").title() if re.search(r'_', line_split[1]) else line_split[1],
                    Attribute.CATEGORICAL if line_split[2] == 'CATEGORICAL STRING' else Attribute.STRING if line_split[2] == "STRING" else Attribute.CONTINUOUS_NUMERIC,
                    True if line_split[-1] == 'True' else False,
                    True
                )

            attr = all_attrs[line_split[0]]

            attr['solr_collex'].append('dicom_derived_all')
            attr['bq_tables'].append('idc-dev.metadata.dicom_mvp')

            attr['set_types'].append(DataSetType.IMAGE_DATA)

            if attr['name'] in display_vals:
                if 'preformatted_values' in display_vals[attr['name']]:
                    attr['preformatted_values'] = True
                else:
                    attr['display_vals'] = display_vals[attr['name']]['vals']

            attr_set.append(attr)

        attr_file.close()

        attr_file = open("segs_attr.csv", "r")
        line_reader = attr_file.readlines()

        for line in line_reader:
            line = line.strip()
            line_split = line.split(",")

            if line_split[0] not in all_attrs:
                all_attrs[line_split[0]] = new_attribute(
                    line_split[0],
                    line_split[0].replace("_", " ").title() if re.search(r'_', line_split[1]) else line_split[1],
                    Attribute.CATEGORICAL if line_split[2] == 'CATEGORICAL STRING' else Attribute.STRING if line_split[2] == "STRING" else Attribute.CONTINUOUS_NUMERIC,
                    True if line_split[-1] == 'True' else False,
                    True
                )

            attr = all_attrs[line_split[0]]

            if attr['type'] == Attribute.CONTINUOUS_NUMERIC:
                attr['range'] = []

            attr['solr_collex'].append('dicom_derived_all')
            attr['bq_tables'].append('idc-dev.metadata.segmentations')

            attr['set_types'].append(DataSetType.DERIVED_DATA)

            attr['categories'].append({'name': 'segmentation', 'display_name': 'Segmentation'})

            if attr['name'] in display_vals:
                if 'preformatted_values' in display_vals[attr['name']]:
                    attr['preformatted_values'] = True
                else:
                    attr['display_vals'] = display_vals[attr['name']]['vals']

            attr_set.append(attr)

        attr_file = open("quants_attr.csv", "r")
        line_reader = attr_file.readlines()

        for line in line_reader:
            line = line.strip()
            line_split = line.split(",")

            if line_split[0] not in all_attrs:
                all_attrs[line_split[0]] = new_attribute(
                    line_split[0],
                    line_split[0].replace("_", " ").title() if re.search(r'_', line_split[1]) else line_split[1],
                    Attribute.CATEGORICAL if line_split[2] == 'CATEGORICAL STRING' else Attribute.STRING if line_split[2] == "STRING" else Attribute.CONTINUOUS_NUMERIC,
                    True if line_split[3] == 'True' else False,
                    True,
                    line_split[-1]
                )

            attr = all_attrs[line_split[0]]

            if attr['type'] == Attribute.CONTINUOUS_NUMERIC:
                attr['range'] = []

            attr['solr_collex'].append('dicom_derived_all')
            attr['bq_tables'].append('idc-dev.metadata.quantitative_measurements')

            attr['set_types'].append(DataSetType.DERIVED_DATA)

            attr['categories'].append({'name': 'quantitative', 'display_name': 'Quantitative Analysis'})

            if attr['name'] in display_vals:
                if 'preformatted_values' in display_vals[attr['name']]:
                    attr['preformatted_values'] = True
                else:
                    attr['display_vals'] = display_vals[attr['name']]['vals']

            attr_set.append(attr)

        attr_file = open("quals_attr.csv", "r")
        line_reader = attr_file.readlines()

        for line in line_reader:
            line = line.strip()
            line_split = line.split(",")

            if line_split[0] not in all_attrs:
                all_attrs[line_split[0]] = new_attribute(
                    line_split[0],
                    line_split[0].replace("_", " ").title() if re.search(r'_', line_split[1]) else line_split[1],
                    Attribute.CATEGORICAL if line_split[2] == 'CATEGORICAL STRING' else Attribute.STRING if line_split[2] == "STRING" else Attribute.CONTINUOUS_NUMERIC,
                    True if line_split[-1] == 'True' else False,
                    True
                )

            attr = all_attrs[line_split[0]]

            if attr['type'] == Attribute.CONTINUOUS_NUMERIC:
                attr['range'] = []

            attr['solr_collex'].append('dicom_derived_all')
            attr['bq_tables'].append('idc-dev.metadata.qualitative_measurements')

            attr['categories'].append({'name': 'qualitative', 'display_name': 'Qualitative Analysis'})

            attr['set_types'].append(DataSetType.DERIVED_DATA)

            if attr['name'] in display_vals:
                if 'preformatted_values' in display_vals[attr['name']]:
                    attr['preformatted_values'] = True
                else:
                    attr['display_vals'] = display_vals[attr['name']]['vals']

            attr_set.append(attr)

        add_attributes(attr_set)

    except Exception as e:
        logging.exception(e)


if __name__ == "__main__":
    main()
