BIGQUERY_CONFIG = {
    "gencode_reference_table_id": "isb-cgc:genome_reference.GENCODE_v19",
    "tables": [
        {
            "genomic_build": "hg19",
            "value_field": "segment_mean",
            "table_id": "isb-cgc:TCGA_hg19_data_v0.Copy_Number_Segment_Masked",
            "gene_label_field": "Hugo_Symbol",
            "internal_table_id": "cnvr_masked_hg19",
            "program": "tcga"
        },
        {
            "genomic_build": "hg38",
            "value_field": "segment_mean",
            "table_id": "isb-cgc:TCGA_hg38_data_v0.Copy_Number_Segment_Masked",
            "gene_label_field": "Hugo_Symbol",
            "internal_table_id": "cnvr_masked_hg38",
            "program": "tcga"
        }
    ]
}
