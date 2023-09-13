SELECT 
    pivot.PatientID,
    pivot.BodyPartExamined,
    pivot.SeriesInstanceUID,
    pivot.SliceThickness,
    pivot.SeriesNumber,
    pivot.SeriesDescription,
    pivot.StudyInstanceUID,
    pivot.StudyDescription,
    pivot.StudyDate,
    pivot.SOPInstanceUID,
    pivot.Modality,
    pivot.SOPClassUID,
    pivot.collection_id,
    pivot.AnatomicRegionSequence,
    pivot.FrameOfReferenceUID,
    pivot.crdc_study_uuid,
    pivot.crdc_series_uuid,
    pivot.crdc_instance_uuid,
    pivot.Program,
    pivot.tcia_tumorLocation,
    pivot.source_DOI,
    pivot.tcia_species,
    pivot.license_short_name,
    pivot.Manufacturer,
    pivot.ManufacturerModelName,
    pivot.instance_size,
    pivot.analysis_results_id,
    pivot.SamplesPerPixel,
    Apparent_Diffusion_Coefficient,
    Internal_structure,
    Sphericity,
    Calcification,
    Lobular_Pattern,
    Spiculation,
    Margin,
    Texture,
    Subtlety_score,
    Malignancy,
    Volume,
    Diameter,
    Surface_area_of_mesh,
    Sphericity_quant,
    Volume_of_Mesh,
    illuminationType,
    primaryAnatomicStructure,
	ObjectiveLensPower,
	min_PixelSpacing,
	max_TotalPixelMatrixColumns,
	max_TotalPixelMatrixRows,  
    SegmentedPropertyCategoryCodeSequence,
    SegmentedPropertyTypeCodeSequence,
    SegmentNumber,
    SegmentAlgorithmType,
    AdditionalPatientHistory,
    Allergies,
    ImageType,
    LastMenstrualDate,
    MedicalAlerts,
    EthnicGroup,
    Occupation,
    PatientAge,
    PatientSex,
    PatientComments,
    PatientSize,
    PatientWeight,
    PregnancyStatus,
    ReasonForStudy,
    RequestedProcedureComments,
    SmokingStatus,
    SeriesDate,
    pivot.access,
    pivot.gcs_url,
    pivot.aws_url,
    pivot.gcs_bucket,
    pivot.aws_bucket
FROM `idc-pdp-staging.{dataset}.dicom_derived_all` pivot
JOIN `idc-pdp-staging.{dataset}.dicom_all` dicom_all
    ON pivot.SOPInstanceUID = dicom_all.SOPInstanceUID
;