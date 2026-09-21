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
    "CBIS-DDSM-All-doiJNLP-zzWs5zfZ.tcia",
    "CMB-AML_v09_20260702.tcia", "CMB-BRCA_v06_20260702.tcia", "CMB-CRC_v11_20260702.tcia", "CMB-GEC_v09_20260702.tcia",
    "CMB-LCA_v12_20260702.tcia", "CMB-MEL_v12_20260702.tcia", "CMB-MML_v11_20260702.tcia", "CMB-OV_v04_20260702.tcia",
    "CMB-PCA_v12_20260702.tcia", "TCIA-CPTAC-CCRCC_v11_20230818.tcia",
    "CPTAC-HNSCC_Tumor-Annotations-manifest_10-21-2025.tcia",
    "doiJNLP-J4OtCtbF.tcia", "doiJNLP-ISPY1-full-09-26-2016.tcia", "TCIA_BREAST-DIAGNOSIS_06-22-2015.tcia",
    "TCIA_TCGA-BRCA_09-16-2015.tcia", "EA1141_v02_20260519.tcia", "EAY131-DA-RAD_v01_20260216.tcia",
    "ISPY1-Tumor-SEG-Radiomics.tcia", "LDCT-and-Projection-data_v07_20260520_Liver.tcia",
    "MRI-DIR-06-30-2018-doiJNLP-1UmgA3nc.tcia",
    "High-Resolution-Prostate-Segmentations-for-the-ProstateX-Challenge-NBIA-manifest_20200917.tcia",
    "ProstateX-Zone-Segmentations-manifest_20201125.tcia", "QIN-SARCOMA_2014-09-04.tcia",
    "Standardization-in-Quatitative-Imaging-DICOM-Segs-3-Subjects-DRO-Toolkit-10-Subjects-QIN.tcia",
    "Standardization-in-Quantitative-Imaging-DICOM-CTs-3-Subjects-DRO-Toolkit-10-Subjects-QIN.tcia",
    "manifest-20230519_CC3-NC.tcia", "TCGA-BLCA-August-30-2019-NBIA-manifest.tcia",
    "TCIA_TCGA-BRCA_09-16-2015.tcia", "TCIA_TCGA-CESC_09-16-2015.tcia", "TCIA_TCGA-COAD_09-16-2015.tcia",
    "TCIA_TCGA-ESCA-09-16-2015.tcia", "TCIA_TCGA-KIRC_09-16-2015.tcia", "doiJNLP-TCGA-LIHC-01-30-2017.tcia",
    "doiJNLP-TCGA-LUAD-01-30-2017.tcia", "doiJNLP-TCGA-LUSC-01-30-2017.tcia", "TCIA_TCGA-OV_09-16-2015.tcia",
    "doiJNLP-Pz8ET39p.tcia", "TCIA_TCGA-READ_09-16-2015.tcia", "TCIA_TCGA-SARC_09-16-2015.tcia",
    "TCIA_TCGA-STAD_09-16-2015.tcia", "TCIA_TCGA-UCEC-2018-10-24.tcia", "Vestibular-Schwannoma-MC-RC_v2_20260604.tcia"
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
                    source_ip="10.0.0.3", series_ids=";".join(series_ids),
                    definition=json.dumps(cart),
                    idc_version=ImagingDataCommonsVersion.objects.get(active=True), cart_id=manifest.split(".")[0]
                )
        else:
            raise Exception(f"No series IDs found!" if not len(series_ids) else "Greater than 64k series IDs seen--skipping!")
except Exception as e:
    logger.exception(e)
    logger.error(e)

