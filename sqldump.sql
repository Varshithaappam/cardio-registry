-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: care_registry
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cabg_discharge_outcomes`
--

DROP TABLE IF EXISTS `cabg_discharge_outcomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabg_discharge_outcomes` (
  `discharge_outcome_id` int NOT NULL AUTO_INCREMENT,
  `cabg_id` int NOT NULL,
  `mortality` enum('Yes','No') DEFAULT 'No',
  `discharge_status` enum('Alive','Dead') DEFAULT NULL,
  `status_30_days` enum('Alive','Dead','Unknown') DEFAULT NULL,
  `operative_death` enum('Yes','No') DEFAULT 'No',
  `mortality_date` date DEFAULT NULL,
  `death_location_or_initial_surgery` enum('Yes','No') DEFAULT 'No',
  `death_location_hospital` enum('Yes','No') DEFAULT 'No',
  `death_location_home` enum('Yes','No') DEFAULT 'No',
  `death_location_other_care_facility` enum('Yes','No') DEFAULT 'No',
  `death_location_or_reoperation` enum('Yes','No') DEFAULT 'No',
  `death_cause_cardiac` enum('Yes','No') DEFAULT 'No',
  `death_cause_neurologic` enum('Yes','No') DEFAULT 'No',
  `death_cause_renal` enum('Yes','No') DEFAULT 'No',
  `death_cause_vascular` enum('Yes','No') DEFAULT 'No',
  `death_cause_infection` enum('Yes','No') DEFAULT 'No',
  `death_cause_pulmonary` enum('Yes','No') DEFAULT 'No',
  `death_cause_valvular` enum('Yes','No') DEFAULT 'No',
  `death_cause_unknown` enum('Yes','No') DEFAULT 'No',
  `death_cause_other` enum('Yes','No') DEFAULT 'No',
  `death_cause_other_details` varchar(255) DEFAULT NULL,
  `adp_inhibitors` enum('Yes','No') DEFAULT 'No',
  `antiarrhythmics` enum('Yes','No') DEFAULT 'No',
  `antiarrhythmic_amiodarone` enum('Yes','No') DEFAULT 'No',
  `antiarrhythmic_other` enum('Yes','No') DEFAULT 'No',
  `antiarrhythmic_other_details` varchar(255) DEFAULT NULL,
  `aspirin` enum('Yes','No') DEFAULT 'No',
  `ace_inhibitors` enum('Yes','No') DEFAULT 'No',
  `beta_blockers` enum('Yes','No') DEFAULT 'No',
  `lipid_lowering` enum('Yes','No') DEFAULT 'No',
  `lipid_lowering_statin` enum('Yes','No') DEFAULT 'No',
  `lipid_lowering_non_statin` enum('Yes','No') DEFAULT 'No',
  `coumadin` enum('Yes','No') DEFAULT 'No',
  `discharge_home` enum('Yes','No') DEFAULT 'No',
  `discharge_extended_care_tcu` enum('Yes','No') DEFAULT 'No',
  `discharge_other_hospital` enum('Yes','No') DEFAULT 'No',
  `discharge_nursing_home` enum('Yes','No') DEFAULT 'No',
  `discharge_other` enum('Yes','No') DEFAULT 'No',
  `discharge_other_details` varchar(255) DEFAULT NULL,
  `cardiac_rehabilitation_referral` enum('Yes','No','Not Applicable') DEFAULT NULL,
  `smoking_cessation_counseling` enum('Yes','No','Not Applicable') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`discharge_outcome_id`),
  KEY `fk_cabg_discharge_outcomes` (`cabg_id`),
  CONSTRAINT `fk_cabg_discharge_outcomes` FOREIGN KEY (`cabg_id`) REFERENCES `cabg_registry` (`cabg_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabg_discharge_outcomes`
--

LOCK TABLES `cabg_discharge_outcomes` WRITE;
/*!40000 ALTER TABLE `cabg_discharge_outcomes` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabg_discharge_outcomes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabg_operative_details`
--

DROP TABLE IF EXISTS `cabg_operative_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabg_operative_details` (
  `operative_id` int NOT NULL AUTO_INCREMENT,
  `cabg_id` int NOT NULL,
  `surgeon_name` varchar(150) DEFAULT NULL,
  `surgeon_id` varchar(50) DEFAULT NULL,
  `procedure_status` enum('Elective','Urgent','Emergent','Salvage') DEFAULT NULL,
  `urgent_reason_ami` enum('Yes','No') DEFAULT 'No',
  `urgent_reason_iabp` enum('Yes','No') DEFAULT 'No',
  `urgent_reason_worsening_chf` enum('Yes','No') DEFAULT 'No',
  `urgent_reason_anatomy` enum('Yes','No') DEFAULT 'No',
  `urgent_reason_usa_rest_angina` enum('Yes','No') DEFAULT 'No',
  `urgent_reason_valve_dysfunction` enum('Yes','No') DEFAULT 'No',
  `urgent_reason_aortic_dissection` enum('Yes','No') DEFAULT 'No',
  `urgent_reason_angiographic_accident` enum('Yes','No') DEFAULT 'No',
  `emergent_reason_shock_with_support` enum('Yes','No') DEFAULT 'No',
  `emergent_reason_shock_without_support` enum('Yes','No') DEFAULT 'No',
  `emergent_reason_pulmonary_edema` enum('Yes','No') DEFAULT 'No',
  `emergent_reason_acute_mi` enum('Yes','No') DEFAULT 'No',
  `emergent_reason_ongoing_ischemia` enum('Yes','No') DEFAULT 'No',
  `emergent_reason_valve_dysfunction` enum('Yes','No') DEFAULT 'No',
  `emergent_reason_aortic_dissection` enum('Yes','No') DEFAULT 'No',
  `emergent_reason_angiographic_accident` enum('Yes','No') DEFAULT 'No',
  `robotic_assisted` enum('Yes','No') DEFAULT 'No',
  `coronary_bypass` enum('Yes','No') DEFAULT 'No',
  `valve_surgery` enum('Yes','No') DEFAULT 'No',
  `ventricular_assist_device` enum('Yes','No') DEFAULT 'No',
  `other_cardiac_procedure` enum('Yes','No') DEFAULT 'No',
  `other_non_cardiac_procedure` enum('Yes','No') DEFAULT 'No',
  `skin_incision_start` time DEFAULT NULL,
  `skin_incision_stop` time DEFAULT NULL,
  `cpb_utilization` enum('None','Combination','Full') DEFAULT NULL,
  `combination_plan` enum('Planned','Unplanned') DEFAULT NULL,
  `unplanned_reason_exposure_visualization` enum('Yes','No') DEFAULT 'No',
  `unplanned_reason_bleeding` enum('Yes','No') DEFAULT 'No',
  `unplanned_reason_diffuse_distal_vessel_disease` enum('Yes','No') DEFAULT 'No',
  `unplanned_reason_hemodynamic_instability` enum('Yes','No') DEFAULT 'No',
  `unplanned_reason_conduit_quality_trauma` enum('Yes','No') DEFAULT 'No',
  `unplanned_reason_other` enum('Yes','No') DEFAULT 'No',
  `unplanned_reason_other_details` varchar(255) DEFAULT NULL,
  `perfusion_time_minutes` smallint unsigned DEFAULT NULL,
  `cannulation_method` enum('Aorta and Fem/Jug Vein','Fem Art and Fem/Jug Vein','Aorta and Atrial/Caval','Fem Art and Atrial/Caval','Other') DEFAULT NULL,
  `cannulation_other_details` varchar(255) DEFAULT NULL,
  `aortic_occlusion_none` enum('Yes','No') DEFAULT 'No',
  `aortic_crossclamp` enum('Yes','No') DEFAULT 'No',
  `balloon_occlusion` enum('Yes','No') DEFAULT 'No',
  `partial_crossclamp` enum('Yes','No') DEFAULT 'No',
  `cross_clamp_time_minutes` smallint unsigned DEFAULT NULL,
  `cardioplegia` enum('Yes','No') DEFAULT 'No',
  `iabp_used` enum('Yes','No') DEFAULT 'No',
  `iabp_inserted_when` enum('Preoperatively','Intraoperatively','Postoperatively') DEFAULT NULL,
  `iabp_indication_hemodynamic_instability` enum('Yes','No') DEFAULT 'No',
  `iabp_indication_ptca_support` enum('Yes','No') DEFAULT 'No',
  `iabp_indication_unstable_angina` enum('Yes','No') DEFAULT 'No',
  `iabp_indication_cpb_wean` enum('Yes','No') DEFAULT 'No',
  `iabp_indication_prophylactic` enum('Yes','No') DEFAULT 'No',
  `intraop_blood_products` enum('Yes','No') DEFAULT 'No',
  `rbc_units` smallint unsigned DEFAULT NULL,
  `fresh_frozen_plasma_units` smallint unsigned DEFAULT NULL,
  `cryoprecipitate_units` smallint unsigned DEFAULT NULL,
  `platelet_units` smallint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`operative_id`),
  KEY `fk_cabg_operative_details` (`cabg_id`),
  CONSTRAINT `fk_cabg_operative_details` FOREIGN KEY (`cabg_id`) REFERENCES `cabg_registry` (`cabg_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabg_operative_details`
--

LOCK TABLES `cabg_operative_details` WRITE;
/*!40000 ALTER TABLE `cabg_operative_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabg_operative_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabg_patient_details`
--

DROP TABLE IF EXISTS `cabg_patient_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabg_patient_details` (
  `patient_details_id` int NOT NULL AUTO_INCREMENT,
  `cabg_id` int NOT NULL,
  `race` varchar(50) DEFAULT NULL,
  `referring_cardiologist` varchar(150) DEFAULT NULL,
  `referring_physician` varchar(150) DEFAULT NULL,
  `hospital_name` varchar(150) DEFAULT NULL,
  `hospital_zip` varchar(15) DEFAULT NULL,
  `hospital_state` varchar(50) DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  `surgery_date` date DEFAULT NULL,
  `discharge_date` date DEFAULT NULL,
  `icu_visit` enum('Yes','No') DEFAULT 'No',
  `initial_icu_hours` decimal(6,2) DEFAULT NULL,
  `icu_readmission` enum('Yes','No') DEFAULT 'No',
  `additional_icu_hours` decimal(6,2) DEFAULT NULL,
  `total_icu_hours` decimal(6,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_details_id`),
  KEY `fk_cabg_patient_details` (`cabg_id`),
  CONSTRAINT `fk_cabg_patient_details` FOREIGN KEY (`cabg_id`) REFERENCES `cabg_registry` (`cabg_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabg_patient_details`
--

LOCK TABLES `cabg_patient_details` WRITE;
/*!40000 ALTER TABLE `cabg_patient_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabg_patient_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabg_postoperative_outcomes`
--

DROP TABLE IF EXISTS `cabg_postoperative_outcomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabg_postoperative_outcomes` (
  `postoperative_outcome_id` int NOT NULL AUTO_INCREMENT,
  `cabg_id` int NOT NULL,
  `blood_products_used` enum('Yes','No') DEFAULT 'No',
  `postoperative_rbc_units` smallint unsigned DEFAULT '0',
  `postoperative_ffp_units` smallint unsigned DEFAULT '0',
  `postoperative_cryoprecipitate_units` smallint unsigned DEFAULT '0',
  `postoperative_platelet_units` smallint unsigned DEFAULT '0',
  `extubated_in_or` enum('Yes','No') DEFAULT 'No',
  `initial_hours_ventilated_postop` smallint unsigned DEFAULT '0',
  `reintubated_during_hospital_stay` enum('Yes','No') DEFAULT 'No',
  `additional_hours_ventilated_postop` smallint unsigned DEFAULT '0',
  `total_hours_ventilated_postop` smallint unsigned DEFAULT '0',
  `in_hospital_complications` enum('Yes','No') DEFAULT 'No',
  `reoperation_bleeding_tamponade` enum('Yes','No') DEFAULT 'No',
  `reoperation_valvular_dysfunction` enum('Yes','No') DEFAULT 'No',
  `reoperation_graft_occlusion` enum('Yes','No') DEFAULT 'No',
  `reoperation_other_cardiac_problem` enum('Yes','No') DEFAULT 'No',
  `reoperation_other_non_cardiac_problem` enum('Yes','No') DEFAULT 'No',
  `perioperative_mi` enum('Yes','No') DEFAULT 'No',
  `deep_sternal_infection` enum('Yes','No') DEFAULT 'No',
  `thoracotomy_infection` enum('Yes','No') DEFAULT 'No',
  `leg_infection` enum('Yes','No') DEFAULT 'No',
  `septicemia` enum('Yes','No') DEFAULT 'No',
  `postoperative_stroke_gt_72hrs` enum('Yes','No') DEFAULT 'No',
  `transient_neurologic_deficit` enum('Yes','No') DEFAULT 'No',
  `coma_gt_24hrs` enum('Yes','No') DEFAULT 'No',
  `prolonged_ventilation` enum('Yes','No') DEFAULT 'No',
  `pulmonary_embolism` enum('Yes','No') DEFAULT 'No',
  `pneumonia` enum('Yes','No') DEFAULT 'No',
  `renal_failure` enum('Yes','No') DEFAULT 'No',
  `dialysis_newly_required` enum('Yes','No') DEFAULT 'No',
  `iliac_femoral_dissection` enum('Yes','No') DEFAULT 'No',
  `acute_limb_ischemia` enum('Yes','No') DEFAULT 'No',
  `heart_block` enum('Yes','No') DEFAULT 'No',
  `cardiac_arrest` enum('Yes','No') DEFAULT 'No',
  `anticoagulant_complication` enum('Yes','No') DEFAULT 'No',
  `tamponade` enum('Yes','No') DEFAULT 'No',
  `gastrointestinal_complication` enum('Yes','No') DEFAULT 'No',
  `multi_system_failure` enum('Yes','No') DEFAULT 'No',
  `atrial_fibrillation` enum('Yes','No') DEFAULT 'No',
  `aortic_dissection` enum('Yes','No') DEFAULT 'No',
  `other_complication` enum('Yes','No') DEFAULT 'No',
  `other_complication_details` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`postoperative_outcome_id`),
  KEY `fk_cabg_postoperative_outcomes` (`cabg_id`),
  CONSTRAINT `fk_cabg_postoperative_outcomes` FOREIGN KEY (`cabg_id`) REFERENCES `cabg_registry` (`cabg_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabg_postoperative_outcomes`
--

LOCK TABLES `cabg_postoperative_outcomes` WRITE;
/*!40000 ALTER TABLE `cabg_postoperative_outcomes` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabg_postoperative_outcomes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabg_preoperative_assessment`
--

DROP TABLE IF EXISTS `cabg_preoperative_assessment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabg_preoperative_assessment` (
  `preop_assessment_id` int NOT NULL AUTO_INCREMENT,
  `cabg_id` int NOT NULL,
  `myocardial_infarction` enum('Yes','No') DEFAULT 'No',
  `mi_when` enum('<=6 Hours','>6 Hours but <24 Hours','1-7 Days','8-21 Days','>21 Days') DEFAULT NULL,
  `congestive_heart_failure` enum('Yes','No') DEFAULT 'No',
  `angina` enum('Yes','No') DEFAULT 'No',
  `angina_type` enum('Stable','Unstable') DEFAULT NULL,
  `cardiogenic_shock` enum('Yes','No') DEFAULT 'No',
  `cardiogenic_shock_type` enum('Refractory Shock','Hemodynamic Instability') DEFAULT NULL,
  `resuscitation` enum('Yes','No') DEFAULT 'No',
  `arrhythmia` enum('Yes','No') DEFAULT 'No',
  `arrhythmia_sustained_vt_vf` enum('Yes','No') DEFAULT 'No',
  `arrhythmia_heart_block` enum('Yes','No') DEFAULT 'No',
  `arrhythmia_af_flutter` enum('Yes','No') DEFAULT 'No',
  `arrhythmia_none` enum('Yes','No') DEFAULT 'No',
  `nyha_class` enum('I','II','III','IV') DEFAULT NULL,
  `beta_blockers` enum('Yes','No') DEFAULT 'No',
  `ace_inhibitors` enum('Yes','No') DEFAULT 'No',
  `iv_nitrates` enum('Yes','No') DEFAULT 'No',
  `anticoagulants` enum('Yes','No') DEFAULT 'No',
  `anticoagulant_heparin_unfractionated` enum('Yes','No') DEFAULT 'No',
  `anticoagulant_heparin_low_molecular` enum('Yes','No') DEFAULT 'No',
  `anticoagulant_thrombin_inhibitors` enum('Yes','No') DEFAULT 'No',
  `coumadin` enum('Yes','No') DEFAULT 'No',
  `inotropes` enum('Yes','No') DEFAULT 'No',
  `steroids` enum('Yes','No') DEFAULT 'No',
  `aspirin` enum('Yes','No') DEFAULT 'No',
  `lipid_lowering` enum('Yes','No') DEFAULT 'No',
  `lipid_lowering_statin` enum('Yes','No') DEFAULT 'No',
  `lipid_lowering_non_statin` enum('Yes','No') DEFAULT 'No',
  `adp_inhibitors` enum('Yes','No') DEFAULT 'No',
  `gp2b3a_inhibitor` enum('Yes','No') DEFAULT 'No',
  `gp2b3a_abciximab` enum('Yes','No') DEFAULT 'No',
  `gp2b3a_eptifibatide` enum('Yes','No') DEFAULT 'No',
  `gp2b3a_tirofiban` enum('Yes','No') DEFAULT 'No',
  `diseased_vessels` enum('None','One','Two','Three') DEFAULT NULL,
  `left_main_disease_50` enum('Yes','No') DEFAULT 'No',
  `ejection_fraction_done` enum('Yes','No') DEFAULT 'No',
  `ejection_fraction` decimal(5,2) DEFAULT NULL,
  `ef_method` enum('LV Gram','Radionucleotide','Estimate','ECHO') DEFAULT NULL,
  `pulmonary_artery_pressure_done` enum('Yes','No') DEFAULT 'No',
  `pulmonary_artery_mean_pressure` decimal(6,2) DEFAULT NULL,
  `aortic_stenosis` enum('Yes','No') DEFAULT 'No',
  `aortic_gradient` decimal(6,2) DEFAULT NULL,
  `mitral_stenosis` enum('Yes','No') DEFAULT 'No',
  `tricuspid_stenosis` enum('Yes','No') DEFAULT 'No',
  `pulmonic_stenosis` enum('Yes','No') DEFAULT 'No',
  `aortic_insufficiency` enum('None','Trivial','Mild','Moderate','Severe') DEFAULT NULL,
  `mitral_insufficiency` enum('None','Trivial','Mild','Moderate','Severe') DEFAULT NULL,
  `tricuspid_insufficiency` enum('None','Trivial','Mild','Moderate','Severe') DEFAULT NULL,
  `pulmonic_insufficiency` enum('None','Trivial','Mild','Moderate','Severe') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`preop_assessment_id`),
  KEY `fk_cabg_preop_assessment` (`cabg_id`),
  CONSTRAINT `fk_cabg_preop_assessment` FOREIGN KEY (`cabg_id`) REFERENCES `cabg_registry` (`cabg_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabg_preoperative_assessment`
--

LOCK TABLES `cabg_preoperative_assessment` WRITE;
/*!40000 ALTER TABLE `cabg_preoperative_assessment` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabg_preoperative_assessment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabg_readmission`
--

DROP TABLE IF EXISTS `cabg_readmission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabg_readmission` (
  `readmission_id` int NOT NULL AUTO_INCREMENT,
  `cabg_id` int NOT NULL,
  `readmitted` enum('Yes','No') DEFAULT 'No',
  `reason_anticoagulation_complication_valvular` enum('Yes','No') DEFAULT 'No',
  `reason_anticoagulation_complication_pharmacological` enum('Yes','No') DEFAULT 'No',
  `reason_arrhythmias_heart_block` enum('Yes','No') DEFAULT 'No',
  `reason_congestive_heart_failure` enum('Yes','No') DEFAULT 'No',
  `reason_myocardial_infarction_recurrent_angina` enum('Yes','No') DEFAULT 'No',
  `reason_pericardial_effusion_tamponade` enum('Yes','No') DEFAULT 'No',
  `reason_pneumonia_other_respiratory_complication` enum('Yes','No') DEFAULT 'No',
  `reason_coronary_artery_dysfunction` enum('Yes','No') DEFAULT 'No',
  `reason_valve_dysfunction` enum('Yes','No') DEFAULT 'No',
  `reason_infection_deep_sternum` enum('Yes','No') DEFAULT 'No',
  `reason_infection_conduit_harvest_site` enum('Yes','No') DEFAULT 'No',
  `reason_renal_failure` enum('Yes','No') DEFAULT 'No',
  `reason_tia` enum('Yes','No') DEFAULT 'No',
  `reason_permanent_cva` enum('Yes','No') DEFAULT 'No',
  `reason_acute_vascular_complication` enum('Yes','No') DEFAULT 'No',
  `reason_subacute_endocarditis` enum('Yes','No') DEFAULT 'No',
  `reason_vad_complication` enum('Yes','No') DEFAULT 'No',
  `reason_other_related_readmission` enum('Yes','No') DEFAULT 'No',
  `reason_other_related_details` varchar(255) DEFAULT NULL,
  `reason_other_nonrelated_readmission` enum('Yes','No') DEFAULT 'No',
  `reason_other_nonrelated_details` varchar(255) DEFAULT NULL,
  `procedure_or_for_bleeding` enum('Yes','No') DEFAULT 'No',
  `procedure_pacemaker_insertion_aicd` enum('Yes','No') DEFAULT 'No',
  `procedure_pci` enum('Yes','No') DEFAULT 'No',
  `procedure_pericardiotomy_pericardiocentesis` enum('Yes','No') DEFAULT 'No',
  `procedure_or_for_coronary_arteries` enum('Yes','No') DEFAULT 'No',
  `procedure_or_for_valve` enum('Yes','No') DEFAULT 'No',
  `procedure_or_for_sternal_debridement_muscle_flap` enum('Yes','No') DEFAULT 'No',
  `procedure_dialysis` enum('Yes','No') DEFAULT 'No',
  `procedure_or_for_vascular` enum('Yes','No') DEFAULT 'No',
  `procedure_no_procedure_performed` enum('Yes','No') DEFAULT 'No',
  `procedure_other` enum('Yes','No') DEFAULT 'No',
  `procedure_other_details` varchar(255) DEFAULT NULL,
  `procedure_unknown` enum('Yes','No') DEFAULT 'No',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`readmission_id`),
  KEY `fk_cabg_readmission` (`cabg_id`),
  CONSTRAINT `fk_cabg_readmission` FOREIGN KEY (`cabg_id`) REFERENCES `cabg_registry` (`cabg_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabg_readmission`
--

LOCK TABLES `cabg_readmission` WRITE;
/*!40000 ALTER TABLE `cabg_readmission` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabg_readmission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabg_registry`
--

DROP TABLE IF EXISTS `cabg_registry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabg_registry` (
  `cabg_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `participant_id` varchar(20) NOT NULL,
  `record_id` varchar(20) NOT NULL,
  `cost_link` varchar(30) DEFAULT NULL,
  `sts_trial_link_number` varchar(30) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cabg_id`),
  UNIQUE KEY `uq_cabg_participant` (`participant_id`),
  UNIQUE KEY `uq_cabg_record` (`record_id`),
  KEY `fk_cabg_patient` (`patient_id`),
  CONSTRAINT `fk_cabg_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabg_registry`
--

LOCK TABLES `cabg_registry` WRITE;
/*!40000 ALTER TABLE `cabg_registry` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabg_registry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabg_risk_assessment`
--

DROP TABLE IF EXISTS `cabg_risk_assessment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabg_risk_assessment` (
  `risk_assessment_id` int NOT NULL AUTO_INCREMENT,
  `cabg_id` int NOT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(5,2) DEFAULT NULL,
  `smoker` enum('Yes','No') DEFAULT 'No',
  `current_smoker` enum('Yes','No') DEFAULT 'No',
  `family_history_cad` enum('Yes','No') DEFAULT 'No',
  `diabetes` enum('Yes','No') DEFAULT 'No',
  `diabetes_control` enum('None','Diet','Oral','Insulin') DEFAULT NULL,
  `dyslipidemia` enum('Yes','No') DEFAULT 'No',
  `last_creatinine_preop` decimal(5,2) DEFAULT NULL,
  `renal_failure` enum('Yes','No') DEFAULT 'No',
  `dialysis` enum('Yes','No') DEFAULT 'No',
  `hypertension` enum('Yes','No') DEFAULT 'No',
  `cerebrovascular_accident` enum('Yes','No') DEFAULT 'No',
  `cva_when` enum('Recent <=2 Weeks','Remote >2 Weeks') DEFAULT NULL,
  `infectious_endocarditis` enum('Yes','No') DEFAULT 'No',
  `infectious_endocarditis_type` enum('Treated','Active') DEFAULT NULL,
  `chronic_lung_disease` enum('None','Mild','Moderate','Severe') DEFAULT NULL,
  `immunosuppressive_therapy` enum('Yes','No') DEFAULT 'No',
  `peripheral_vascular_disease` enum('Yes','No') DEFAULT 'No',
  `cerebrovascular_disease` enum('Yes','No') DEFAULT 'No',
  `cerebrovascular_disease_type` enum('Coma','CVA','RIND','TIA','Non Invasive >75%','Prior Carotid Surgery') DEFAULT NULL,
  `incidence` enum('First CV Surgery','First Re-op CV Surgery','Second Re-op CV Surgery','Third Re-op CV Surgery','Fourth or More Re-op Surgery') DEFAULT NULL,
  `previous_cv_interventions` enum('Yes','No') DEFAULT 'No',
  `previous_cabg` enum('Yes','No') DEFAULT 'No',
  `previous_valve` enum('Yes','No') DEFAULT 'No',
  `previous_other_cardiac_intrapericardial` enum('Yes','No') DEFAULT 'No',
  `previous_aicd` enum('Yes','No') DEFAULT 'No',
  `previous_pacemaker` enum('Yes','No') DEFAULT 'No',
  `previous_pacemaker_type` enum('Biventricular','Univentricular') DEFAULT NULL,
  `previous_pci` enum('Yes','No') DEFAULT 'No',
  `previous_pci_interval` enum('<=6 Hours','>6 Hours') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`risk_assessment_id`),
  KEY `fk_cabg_risk_assessment` (`cabg_id`),
  CONSTRAINT `fk_cabg_risk_assessment` FOREIGN KEY (`cabg_id`) REFERENCES `cabg_registry` (`cabg_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabg_risk_assessment`
--

LOCK TABLES `cabg_risk_assessment` WRITE;
/*!40000 ALTER TABLE `cabg_risk_assessment` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabg_risk_assessment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabg_surgical_procedures`
--

DROP TABLE IF EXISTS `cabg_surgical_procedures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabg_surgical_procedures` (
  `surgical_procedure_id` int NOT NULL AUTO_INCREMENT,
  `cabg_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `num_distal_anast_arterial` smallint unsigned DEFAULT '0',
  `num_distal_anast_venous` smallint unsigned DEFAULT '0',
  `anastomotic_device_used` enum('Yes','No') DEFAULT 'No',
  `anastomotic_device_glue` enum('Yes','No') DEFAULT 'No',
  `anastomotic_device_magnets` enum('Yes','No') DEFAULT 'No',
  `anastomotic_device_clips` enum('Yes','No') DEFAULT 'No',
  `anastomotic_device_staples` enum('Yes','No') DEFAULT 'No',
  `anastomotic_device_other` enum('Yes','No') DEFAULT 'No',
  `anastomotic_device_other_details` varchar(255) DEFAULT NULL,
  `ima_left` enum('Yes','No') DEFAULT 'No',
  `ima_right` enum('Yes','No') DEFAULT 'No',
  `ima_both_imas` enum('Yes','No') DEFAULT 'No',
  `ima_none` enum('Yes','No') DEFAULT 'No',
  `ima_harvest_technique` enum('Direct Vision','Thoracoscopy','Combination','Robotic Assisted') DEFAULT NULL,
  `num_ima_distal_anastomoses` smallint unsigned DEFAULT '0',
  `radial_left` enum('Yes','No') DEFAULT 'No',
  `radial_right` enum('Yes','No') DEFAULT 'No',
  `radial_both_radials` enum('Yes','No') DEFAULT 'No',
  `radial_none` enum('Yes','No') DEFAULT 'No',
  `num_radial_distal_anastomoses` smallint unsigned DEFAULT '0',
  `num_gastro_epiploic_distal_anastomoses` smallint unsigned DEFAULT '0',
  `num_other_arterial_distal_anastomoses` smallint unsigned DEFAULT '0',
  `aortic_none` enum('Yes','No') DEFAULT 'No',
  `aortic_replacement` enum('Yes','No') DEFAULT 'No',
  `aortic_repair_reconstruction` enum('Yes','No') DEFAULT 'No',
  `aortic_root_recon_valve_conduit` enum('Yes','No') DEFAULT 'No',
  `aortic_replacement_aortic_graft_conduit` enum('Yes','No') DEFAULT 'No',
  `aortic_root_recon_valve_sparing` enum('Yes','No') DEFAULT 'No',
  `aortic_resuspension_w_replacement_asc_aorta` enum('Yes','No') DEFAULT 'No',
  `aortic_resuspension_wo_replacement_asc_aorta` enum('Yes','No') DEFAULT 'No',
  `aortic_resection_sub_aortic_stenosis` enum('Yes','No') DEFAULT 'No',
  `aortic_annular_enlargement` enum('Yes','No') DEFAULT 'No',
  `mitral_none` enum('Yes','No') DEFAULT 'No',
  `mitral_annuloplasty_only` enum('Yes','No') DEFAULT 'No',
  `mitral_replacement` enum('Yes','No') DEFAULT 'No',
  `mitral_reconstruction_w_annuloplasty` enum('Yes','No') DEFAULT 'No',
  `mitral_reconstruction_wout_annuloplasty` enum('Yes','No') DEFAULT 'No',
  `tricuspid_none` enum('Yes','No') DEFAULT 'No',
  `tricuspid_annuloplasty_only` enum('Yes','No') DEFAULT 'No',
  `tricuspid_replacement` enum('Yes','No') DEFAULT 'No',
  `tricuspid_reconstruction_w_annuloplasty` enum('Yes','No') DEFAULT 'No',
  `tricuspid_reconstruction_wout_annuloplasty` enum('Yes','No') DEFAULT 'No',
  `tricuspid_valvectomy` enum('Yes','No') DEFAULT 'No',
  `pulmonic_none` enum('Yes','No') DEFAULT 'No',
  `pulmonic_replacement` enum('Yes','No') DEFAULT 'No',
  `pulmonic_reconstruction` enum('Yes','No') DEFAULT 'No',
  `aortic_imp_mech` enum('Yes','No') DEFAULT 'No',
  `aortic_imp_bio` enum('Yes','No') DEFAULT 'No',
  `aortic_imp_homo` enum('Yes','No') DEFAULT 'No',
  `aortic_imp_auto` enum('Yes','No') DEFAULT 'No',
  `aortic_imp_ring` enum('Yes','No') DEFAULT 'No',
  `aortic_imp_band` enum('Yes','No') DEFAULT 'No',
  `aortic_implant_code` varchar(255) DEFAULT NULL,
  `aortic_size` decimal(5,2) DEFAULT NULL,
  `mitral_imp_mech` enum('Yes','No') DEFAULT 'No',
  `mitral_imp_bio` enum('Yes','No') DEFAULT 'No',
  `mitral_imp_homo` enum('Yes','No') DEFAULT 'No',
  `mitral_imp_auto` enum('Yes','No') DEFAULT 'No',
  `mitral_imp_ring` enum('Yes','No') DEFAULT 'No',
  `mitral_imp_band` enum('Yes','No') DEFAULT 'No',
  `mitral_implant_code` varchar(255) DEFAULT NULL,
  `mitral_size` decimal(5,2) DEFAULT NULL,
  `tricuspid_imp_mech` enum('Yes','No') DEFAULT 'No',
  `tricuspid_imp_bio` enum('Yes','No') DEFAULT 'No',
  `tricuspid_imp_homo` enum('Yes','No') DEFAULT 'No',
  `tricuspid_imp_auto` enum('Yes','No') DEFAULT 'No',
  `tricuspid_imp_ring` enum('Yes','No') DEFAULT 'No',
  `tricuspid_imp_band` enum('Yes','No') DEFAULT 'No',
  `tricuspid_implant_code` varchar(255) DEFAULT NULL,
  `tricuspid_size` decimal(5,2) DEFAULT NULL,
  `pulmonic_imp_mech` enum('Yes','No') DEFAULT 'No',
  `pulmonic_imp_bio` enum('Yes','No') DEFAULT 'No',
  `pulmonic_imp_homo` enum('Yes','No') DEFAULT 'No',
  `pulmonic_imp_auto` enum('Yes','No') DEFAULT 'No',
  `pulmonic_imp_ring` enum('Yes','No') DEFAULT 'No',
  `pulmonic_imp_band` enum('Yes','No') DEFAULT 'No',
  `pulmonic_implant_code` varchar(255) DEFAULT NULL,
  `pulmonic_size` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`surgical_procedure_id`),
  KEY `fk_cabg_surgical_procedures` (`cabg_id`),
  CONSTRAINT `fk_cabg_surgical_procedures` FOREIGN KEY (`cabg_id`) REFERENCES `cabg_registry` (`cabg_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabg_surgical_procedures`
--

LOCK TABLES `cabg_surgical_procedures` WRITE;
/*!40000 ALTER TABLE `cabg_surgical_procedures` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabg_surgical_procedures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabg_vad_other_procedures`
--

DROP TABLE IF EXISTS `cabg_vad_other_procedures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabg_vad_other_procedures` (
  `vad_other_procedure_id` int NOT NULL AUTO_INCREMENT,
  `cabg_id` int NOT NULL,
  `previous_vad` enum('Yes','No') DEFAULT 'No',
  `vad_indication` enum('Bridge to Transplant','Bridge to Recovery','Destination','Separation from CPB','Device Malfunction') DEFAULT NULL,
  `intubated_pre_vad` enum('Yes','No') DEFAULT 'No',
  `pcwp` decimal(6,2) DEFAULT NULL,
  `cvp` decimal(6,2) DEFAULT NULL,
  `pvr` decimal(6,2) DEFAULT NULL,
  `cardiac_index` decimal(6,2) DEFAULT NULL,
  `rv_function` enum('Normal','Mildly Impaired','Moderately Impaired','Severely Impaired') DEFAULT NULL,
  `rv_function_method` enum('Pre-op ECHO','Intra-op VAD TEE') DEFAULT NULL,
  `vo2_max` decimal(6,2) DEFAULT NULL,
  `peak_vo2` decimal(6,2) DEFAULT NULL,
  `initial_implant_type` enum('RVAD','LVAD','BiVAD') DEFAULT NULL,
  `initial_product_type` varchar(150) DEFAULT NULL,
  `initial_implant_date` date DEFAULT NULL,
  `initial_explant` enum('Yes','No') DEFAULT 'No',
  `initial_explant_date` date DEFAULT NULL,
  `initial_explant_reason` enum('Cardiac Transplant','Recovery','Device Transfer','Device Related Infection','Device Malfunction') DEFAULT NULL,
  `initial_cardiac_transplant` enum('Yes','No') DEFAULT 'No',
  `initial_transplant_date` date DEFAULT NULL,
  `lvad_inflow` enum('LA','LV') DEFAULT NULL,
  `rvad_inflow` enum('RA','RV') DEFAULT NULL,
  `implant1_type` enum('RVAD','LVAD','BiVAD') DEFAULT NULL,
  `implant1_product_type` varchar(150) DEFAULT NULL,
  `implant1_implant_date` date DEFAULT NULL,
  `implant1_explant` enum('Yes','No') DEFAULT 'No',
  `implant1_explant_date` date DEFAULT NULL,
  `implant1_explant_reason` enum('Cardiac Transplant','Recovery','Device Transfer','Device Related Infection','Device Malfunction') DEFAULT NULL,
  `implant1_cardiac_transplant` enum('Yes','No') DEFAULT 'No',
  `implant1_transplant_date` date DEFAULT NULL,
  `implant2_type` enum('RVAD','LVAD','BiVAD') DEFAULT NULL,
  `implant2_product_type` varchar(150) DEFAULT NULL,
  `implant2_implant_date` date DEFAULT NULL,
  `implant2_explant` enum('Yes','No') DEFAULT 'No',
  `implant2_explant_date` date DEFAULT NULL,
  `implant2_explant_reason` enum('Cardiac Transplant','Recovery','Device Transfer','Device Related Infection','Device Malfunction') DEFAULT NULL,
  `implant2_cardiac_transplant` enum('Yes','No') DEFAULT 'No',
  `implant2_transplant_date` date DEFAULT NULL,
  `vad_intracranial_bleed` enum('Yes','No') DEFAULT 'No',
  `vad_embolic_stroke` enum('Yes','No') DEFAULT 'No',
  `vad_driveline_infection` enum('Yes','No') DEFAULT 'No',
  `vad_pump_pocket_infection` enum('Yes','No') DEFAULT 'No',
  `vad_endocarditis` enum('Yes','No') DEFAULT 'No',
  `vad_device_malfunction` enum('Yes','No') DEFAULT 'No',
  `vad_status` enum('Discharged with VAD','Discharged without VAD') DEFAULT NULL,
  `left_ventricular_aneurysm_repair` enum('Yes','No') DEFAULT 'No',
  `ventricular_septal_defect_repair` enum('Yes','No') DEFAULT 'No',
  `atrial_septal_defect_repair` enum('Yes','No') DEFAULT 'No',
  `batista` enum('Yes','No') DEFAULT 'No',
  `surgical_ventricular_restoration` enum('Yes','No') DEFAULT 'No',
  `congenital_defect_repair` enum('Yes','No') DEFAULT 'No',
  `transmyocardial_laser_revascularization` enum('Yes','No') DEFAULT 'No',
  `cardiac_trauma` enum('Yes','No') DEFAULT 'No',
  `cardiac_transplant` enum('Yes','No') DEFAULT 'No',
  `arrhythmia_correction` enum('None','Permanent Pacemaker','CRT','AICD','AICD with CRT') DEFAULT NULL,
  `arrhythmia_lead_placement` enum('Epicardial','Endocardial') DEFAULT NULL,
  `af_surgery` enum('None','Standard Surgical Maze','Other Surgical Ablative Procedure','Combination') DEFAULT NULL,
  `af_energy_source` enum('Unipolar Radiofrequency','Bipolar Radiofrequency','Microwave','Cryothermy','Other','Combination') DEFAULT NULL,
  `aortic_aneurysm` enum('Yes','No') DEFAULT 'No',
  `ascending_aorta` enum('Yes','No') DEFAULT 'No',
  `aortic_arch` enum('Yes','No') DEFAULT 'No',
  `descending_aorta` enum('Yes','No') DEFAULT 'No',
  `thoracoabdominal_aorta` enum('Yes','No') DEFAULT 'No',
  `other_aortic_procedure` enum('Yes','No') DEFAULT 'No',
  `other_aortic_procedure_details` varchar(255) DEFAULT NULL,
  `carotid_endarterectomy` enum('Yes','No') DEFAULT 'No',
  `other_vascular` enum('Yes','No') DEFAULT 'No',
  `other_vascular_details` varchar(255) DEFAULT NULL,
  `other_thoracic` enum('Yes','No') DEFAULT 'No',
  `other_thoracic_details` varchar(255) DEFAULT NULL,
  `other_non_cardiac` enum('Yes','No') DEFAULT 'No',
  `other_non_cardiac_details` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`vad_other_procedure_id`),
  KEY `fk_cabg_vad_other_procedures` (`cabg_id`),
  CONSTRAINT `fk_cabg_vad_other_procedures` FOREIGN KEY (`cabg_id`) REFERENCES `cabg_registry` (`cabg_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabg_vad_other_procedures`
--

LOCK TABLES `cabg_vad_other_procedures` WRITE;
/*!40000 ALTER TABLE `cabg_vad_other_procedures` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabg_vad_other_procedures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_administrative`
--

DROP TABLE IF EXISTS `hf_administrative`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_administrative` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `assessed_by` varchar(100) DEFAULT NULL,
  `assessment_date` date DEFAULT NULL,
  `care_mr_no` varchar(30) NOT NULL,
  `visit_type` enum('Inpatient','Outpatient','Home') NOT NULL,
  `address` text,
  `education_level` enum('Primary','Secondary','Graduate','Post Graduate','None') DEFAULT NULL,
  `monthly_income` decimal(10,2) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `caregiver_name` varchar(150) DEFAULT NULL,
  `caregiver_relationship` varchar(50) DEFAULT NULL,
  `caregiver_phone` varchar(15) DEFAULT NULL,
  `insurance_mode` enum('Private Insurance','Government Reimbursement','Arogyasree','Direct') DEFAULT NULL,
  `visit_date` date NOT NULL,
  `discharge_date` date DEFAULT NULL,
  `treating_cardiologist` varchar(100) DEFAULT NULL,
  `referring_doctor` varchar(100) DEFAULT NULL,
  `referred_from` varchar(100) DEFAULT NULL,
  `present_diagnosis` text,
  `myocardial_ischemia` enum('Yes','No') DEFAULT 'No',
  `atrial_fibrillation` enum('Yes','No') DEFAULT 'No',
  `bradyarrhythmia` enum('Yes','No') DEFAULT 'No',
  `ventricular_tachycardia` enum('Yes','No') DEFAULT 'No',
  `uncontrolled_hypertension` enum('Yes','No') DEFAULT 'No',
  `infection` enum('Yes','No') DEFAULT 'No',
  `renal_failure` enum('Yes','No') DEFAULT 'No',
  `anaemia` enum('Yes','No') DEFAULT 'No',
  `medication_non_adherence` enum('Yes','No') DEFAULT 'No',
  `excessive_salt_intake` enum('Yes','No') DEFAULT 'No',
  `excessive_water_ingestion` enum('Yes','No') DEFAULT 'No',
  `progressive_worsening` enum('Yes','No') DEFAULT 'No',
  `precipitating_other` varchar(255) DEFAULT NULL,
  `other_admission_reason` text,
  `hospitalization_days` smallint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin_id`),
  KEY `fk_hf_admin` (`hf_id`),
  CONSTRAINT `fk_hf_admin` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_administrative`
--

LOCK TABLES `hf_administrative` WRITE;
/*!40000 ALTER TABLE `hf_administrative` DISABLE KEYS */;
INSERT INTO `hf_administrative` VALUES (1,1,NULL,'2026-07-18','Unknown','Outpatient',NULL,'Primary',10000.00,'farmer','supriya','wife','9876543210','Arogyasree','2026-07-18',NULL,'Dr. K. Sridhar','Dr. Ananth Rao',NULL,'community clinic','No','No','No','No','No','No','No','No','No','No','No','No','hi','trauma',7,'2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,NULL,'2026-07-18','Unknown','Outpatient',NULL,'Graduate',70000.00,'','','','','Private Insurance','2026-07-18',NULL,'Dr. K. Sridhar','Dr. Ananth Rao',NULL,'','No','No','No','No','No','No','No','No','No','No','No','No',NULL,NULL,NULL,'2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,NULL,'1987-07-19','Unknown','Inpatient',NULL,'Post Graduate',78000.00,'Retired','','wife','9876543210','Government Reimbursement','1987-07-19','2000-05-10','Dr. K. Sridhar','Dr. Ananth Rao',NULL,'community clinic','No','No','Yes','No','No','Yes','No','No','No','No','No','No','Excessive water ingestion','trauma',3,'2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,NULL,'2002-07-19','Unknown','Home','Address','Graduate',70000.00,'farmer','supriya','wife','9876543210','Arogyasree','2002-07-19','2015-02-12','Dr. K. Sridhar','Dr. Ananth Rao',NULL,'Present Diagnosis\n','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Other Precipitating Factor','If admission for reasons other than heart failure, please specify reason(s):',5,'2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,NULL,'2026-07-20','Unknown','Outpatient','Carrington NC 27601','Primary',10000.00,'farmer','supriya','wife','9876543210','Arogyasree','2026-07-20','2026-07-09','Dr. G. Sundararaman','Dr. Rajesh Iyer',NULL,'community clinic','No','No','No','No','No','No','No','No','No','No','No','No',NULL,NULL,NULL,'2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,NULL,'2026-07-20','Unknown','Outpatient','','Graduate',NULL,'','','','','Private Insurance','2026-07-20',NULL,'Dr. K. Sridhar','Dr. Ananth Rao',NULL,'','No','No','No','No','No','No','No','No','No','No','No','No',NULL,NULL,NULL,'2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,NULL,'2026-07-20','Unknown','Outpatient','address-2','Primary',10000.00,'farmer','','','','Government Reimbursement','2026-07-20',NULL,'Dr. K. Sridhar','Dr. Ananth Rao',NULL,'','No','No','No','No','No','No','No','No','No','No','No','No',NULL,NULL,NULL,'2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,NULL,'2026-07-20','Unknown','Outpatient','ABC','Primary',10000.00,'','','','','Arogyasree','2026-07-20',NULL,'Dr. K. Sridhar','Dr. Ananth Rao','community clinic','','No','No','No','No','No','No','No','No','No','No','No','No',NULL,NULL,NULL,'2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,NULL,'2026-07-20','Unknown','Outpatient','cdefdsg','Primary',NULL,'','','','','Government Reimbursement','2026-07-20',NULL,'Dr. K. Sridhar','Dr. Ananth Rao','community clinic','','No','No','No','No','No','No','No','No','No','No','No','No',NULL,NULL,NULL,'2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,NULL,'2026-07-20','Unknown','Outpatient','uytgh','Graduate',NULL,'','','','','Government Reimbursement','2026-07-20',NULL,'Dr. K. Sridhar','Dr. Ananth Rao','community clinic','','No','No','No','No','No','No','No','No','No','No','No','No',NULL,NULL,NULL,'2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,NULL,'2026-07-20','Unknown','Outpatient','abcdefghijklmnopqrstuvwxyz','Graduate',NULL,'','','','','Direct','2026-07-20',NULL,'Dr. K. Sridhar','Dr. Ananth Rao','community clinic','','No','No','No','No','No','No','No','No','No','No','No','No',NULL,NULL,NULL,'2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,NULL,'2026-07-20','Unknown','Outpatient','bvfgtr','Primary',10000.00,'farmer','supriya','wife','9876543210','Private Insurance','2026-07-20',NULL,'Dr. K. Sridhar','Dr. Ananth Rao','community clinic','','No','No','No','No','Yes','No','Yes','Yes','No','Yes','No','No',NULL,NULL,NULL,'2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,NULL,'2026-07-20','Unknown','Outpatient','abcdefgh','Graduate',10000.00,'farmer','supriya','wife','9876543210','Government Reimbursement','2026-07-20','2026-06-30','Dr. K. Sridhar','Dr. Ananth Rao','community clinic','Present Diagnosis\n','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Other Precipitating Factor','If admission for reasons other than heart failure, please specify reason(s):',4,'2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,NULL,'2026-07-20','Unknown','Outpatient','','Primary',0.00,'','','','','Private Insurance','2026-07-20',NULL,'Dr. K. Sridhar','Dr. Ananth Rao','community clinic','','No','No','No','No','No','No','No','No','No','No','No','No',NULL,NULL,NULL,'2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_administrative` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_advanced_investigations`
--

DROP TABLE IF EXISTS `hf_advanced_investigations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_advanced_investigations` (
  `advanced_investigation_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `holter_test_date` date DEFAULT NULL,
  `ventricular_arrhythmia_no` enum('Yes','No') DEFAULT 'No',
  `ventricular_arrhythmia_yes` enum('Yes','No') DEFAULT 'No',
  `ventricular_arrhythmia_complex_vpc` enum('Yes','No') DEFAULT 'No',
  `ventricular_arrhythmia_nsvt` enum('Yes','No') DEFAULT 'No',
  `ventricular_arrhythmia_vt` enum('Yes','No') DEFAULT 'No',
  `atrial_arrhythmia_none` enum('Yes','No') DEFAULT 'No',
  `atrial_arrhythmia_apcs` enum('Yes','No') DEFAULT 'No',
  `atrial_arrhythmia_af` enum('Yes','No') DEFAULT 'No',
  `ventricular_pvc` varchar(100) DEFAULT NULL,
  `heart_rate_variability` varchar(255) DEFAULT NULL,
  `stress_test_done` enum('Yes','No') DEFAULT 'No',
  `stress_test_date` date DEFAULT NULL,
  `stress_test_not_done` enum('Yes','No') DEFAULT 'No',
  `stress_mets_achieved` decimal(5,2) DEFAULT NULL,
  `stress_target_heart_rate_achieved` varchar(100) DEFAULT NULL,
  `stress_ischemic_changes_yes` enum('Yes','No') DEFAULT 'No',
  `stress_ischemic_changes_no` enum('Yes','No') DEFAULT 'No',
  `stress_arrhythmias_yes` enum('Yes','No') DEFAULT 'No',
  `stress_arrhythmias_no` enum('Yes','No') DEFAULT 'No',
  `mri_test_date` date DEFAULT NULL,
  `mri_lvef` decimal(5,2) DEFAULT NULL,
  `mri_scar_present` enum('Yes','No') DEFAULT 'No',
  `mri_scar_absent` enum('Yes','No') DEFAULT 'No',
  `pet_test_date` date DEFAULT NULL,
  `six_minute_walk_done` enum('Yes','No') DEFAULT 'No',
  `six_minute_walk_date` date DEFAULT NULL,
  `six_minute_walk_distance` decimal(8,2) DEFAULT NULL,
  `six_minute_walk_heart_rate_recovery` varchar(100) DEFAULT NULL,
  `six_minute_walk_not_done` enum('Yes','No') DEFAULT 'No',
  `six_minute_walk_reason` text,
  `anaerobic_threshold_test_date` date DEFAULT NULL,
  `angiogram_done` enum('Yes','No') DEFAULT 'No',
  `angiogram_test_date` date DEFAULT NULL,
  `angiogram_normal` enum('Yes','No') DEFAULT 'No',
  `angiogram_one_vessel_disease` enum('Yes','No') DEFAULT 'No',
  `angiogram_two_vessel_disease` enum('Yes','No') DEFAULT 'No',
  `angiogram_three_vessel_disease` enum('Yes','No') DEFAULT 'No',
  `angiogram_lmca` enum('Yes','No') DEFAULT 'No',
  `angiogram_not_done` enum('Yes','No') DEFAULT 'No',
  `biopsy_done` enum('Yes','No') DEFAULT 'No',
  `biopsy_test_date` date DEFAULT NULL,
  `biopsy_not_done` enum('Yes','No') DEFAULT 'No',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`advanced_investigation_id`),
  KEY `fk_hf_advanced_investigations` (`hf_id`),
  CONSTRAINT `fk_hf_advanced_investigations` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_advanced_investigations`
--

LOCK TABLES `hf_advanced_investigations` WRITE;
/*!40000 ALTER TABLE `hf_advanced_investigations` DISABLE KEYS */;
INSERT INTO `hf_advanced_investigations` VALUES (1,1,NULL,'No','No','No','No','No','No','No','No','1',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,NULL,'No','No',NULL,'No',NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,'No','No','No','No','No','No','No',NULL,'No','2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,NULL,'No','No','No','No','No','No','No','No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,NULL,'No','No',NULL,'No',NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,'No','No','No','No','No','No','No',NULL,'No','2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,'2001-11-11','No','No','No','No','No','No','No','No','1','hello','Yes','2001-11-11','No',0.00,'Anterior','Yes','No','No','Yes','2001-11-11',0.00,'No','No','2001-11-11','Yes','2001-11-11',0.00,'Anterior','No',NULL,'2001-11-11','Yes','2001-11-11','No','No','No','No','No','No','Yes','2001-11-11','No','2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,NULL,'No','No','Yes','No','No','Yes','No','No','Yes','5:9','Yes',NULL,'No',0.00,'5:9','Yes','No','No','Yes',NULL,0.00,'Yes','No',NULL,'Yes',NULL,0.00,'5:9','No',NULL,NULL,'Yes',NULL,'No','No','No','No','No','No','No',NULL,'No','2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,'2026-07-17','No','No','Yes','No','No','No','Yes','No','Yes','456','Yes','2026-06-28','No',45.00,'34','No','Yes','Yes','No','2026-07-15',13.00,'No','Yes',NULL,'Yes','2026-06-30',13.00,'15','No',NULL,'2026-07-08','Yes','2026-06-30','No','No','No','No','No','No','Yes','2026-07-02','No','2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,NULL,'No','No','No','No','No','No','No','No','No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,NULL,'No','No',NULL,'No',NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,'No','No','No','No','No','No','No',NULL,'No','2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,NULL,'No','No','No','No','No','No','No','No','No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,NULL,'No','No',NULL,'No',NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,'No','No','No','No','No','No','No',NULL,'No','2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,NULL,'No','No','No','No','No','No','No','No','No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,NULL,'No','No',NULL,'No',NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,'No','No','No','No','No','No','No',NULL,'No','2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,NULL,'No','No','No','No','No','No','No','No','No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,NULL,'No','No',NULL,'No',NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,'No','No','No','No','No','No','No',NULL,'No','2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,NULL,'No','No','No','No','No','No','No','No','No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,NULL,'No','No',NULL,'No',NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,'No','No','No','No','No','No','No',NULL,'No','2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,NULL,'No','Yes','No','No','No','No','Yes','No','No',NULL,'No',NULL,'Yes',NULL,NULL,'No','No','No','No',NULL,NULL,'No','Yes',NULL,'No',NULL,NULL,NULL,'No',NULL,NULL,'Yes',NULL,'No','No','Yes','No','No','No','No',NULL,'Yes','2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,NULL,'No','No','No','No','No','No','No','No','No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,NULL,'No','No',NULL,'No',NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,'No','No','No','No','No','No','No',NULL,'No','2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,NULL,'No','Yes','No','No','No','No','Yes','No','No','6','Yes','2026-07-08','No',98.00,'99','Yes','No','No','Yes','2026-07-09',45.00,'No','Yes','2026-07-09','Yes','2026-07-08',34.00,'56','No',NULL,'2026-06-30','Yes','2026-07-02','No','Yes','No','No','No','No','Yes','2026-07-16','No','2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,NULL,'No','No','No','No','No','No','No','No','No',NULL,'No',NULL,'Yes',NULL,NULL,'No','No','No','No',NULL,NULL,'No','No',NULL,'No',NULL,NULL,NULL,'No',NULL,NULL,'No',NULL,'No','No','No','No','No','No','Yes',NULL,'No','2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_advanced_investigations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_cardiac_investigations`
--

DROP TABLE IF EXISTS `hf_cardiac_investigations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_cardiac_investigations` (
  `cardiac_investigation_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `ecg_test_date` date DEFAULT NULL,
  `ecg_qrs_duration` decimal(5,2) DEFAULT NULL,
  `ecg_rhythm_sinus` enum('Yes','No') DEFAULT 'No',
  `ecg_rhythm_af` enum('Yes','No') DEFAULT 'No',
  `ecg_rhythm_other` enum('Yes','No') DEFAULT 'No',
  `ecg_rhythm_other_details` varchar(255) DEFAULT NULL,
  `ecg_av_normal` enum('Yes','No') DEFAULT 'No',
  `ecg_av_first_degree_block` enum('Yes','No') DEFAULT 'No',
  `ecg_av_second_degree_block` enum('Yes','No') DEFAULT 'No',
  `ecg_av_third_degree_block` enum('Yes','No') DEFAULT 'No',
  `ecg_qwaves_yes` enum('Yes','No') DEFAULT 'No',
  `ecg_qwaves_none` enum('Yes','No') DEFAULT 'No',
  `ecg_qwave_leads` varchar(100) DEFAULT NULL,
  `ecg_lbbb` enum('Yes','No') DEFAULT 'No',
  `ecg_rbbb` enum('Yes','No') DEFAULT 'No',
  `ecg_block_other` enum('Yes','No') DEFAULT 'No',
  `ecg_block_other_details` varchar(255) DEFAULT NULL,
  `ecg_apc` enum('Yes','No') DEFAULT 'No',
  `ecg_vpc` enum('Yes','No') DEFAULT 'No',
  `ecg_extra_beats_none` enum('Yes','No') DEFAULT 'No',
  `ecg_qt` decimal(6,2) DEFAULT NULL,
  `ecg_qtc` decimal(6,2) DEFAULT NULL,
  `chest_xray_test_date` date DEFAULT NULL,
  `cardiothoracic_ratio` decimal(5,2) DEFAULT NULL,
  `chest_pvh` enum('Yes','No') DEFAULT 'No',
  `chest_pulmonary_edema` enum('Yes','No') DEFAULT 'No',
  `chest_pleural_effusion` enum('Yes','No') DEFAULT 'No',
  `chest_other` enum('Yes','No') DEFAULT 'No',
  `chest_other_details` varchar(255) DEFAULT NULL,
  `echo_test_date` date DEFAULT NULL,
  `echo_ef` decimal(5,2) DEFAULT NULL,
  `echo_ea_ratio` decimal(5,2) DEFAULT NULL,
  `echo_ee_ratio` decimal(5,2) DEFAULT NULL,
  `echo_deceleration_time` decimal(6,2) DEFAULT NULL,
  `echo_rv_tapsv` decimal(6,2) DEFAULT NULL,
  `echo_left_atrium_dimension` varchar(100) DEFAULT NULL,
  `echo_left_ventricle_systole` varchar(100) DEFAULT NULL,
  `echo_left_ventricle_diastole` varchar(100) DEFAULT NULL,
  `mitral_regurgitation_none` enum('Yes','No') DEFAULT 'No',
  `mitral_regurgitation_1plus` enum('Yes','No') DEFAULT 'No',
  `mitral_regurgitation_2plus` enum('Yes','No') DEFAULT 'No',
  `mitral_regurgitation_3plus` enum('Yes','No') DEFAULT 'No',
  `mitral_regurgitation_4plus` enum('Yes','No') DEFAULT 'No',
  `other_valves` varchar(255) DEFAULT NULL,
  `rv_systolic_pressure` varchar(100) DEFAULT NULL,
  `rv_function_normal` enum('Yes','No') DEFAULT 'No',
  `rv_function_impaired` enum('Yes','No') DEFAULT 'No',
  `rwmi_none` enum('Yes','No') DEFAULT 'No',
  `rwmi_global` enum('Yes','No') DEFAULT 'No',
  `rwmi_anterior` enum('Yes','No') DEFAULT 'No',
  `rwmi_lateral` enum('Yes','No') DEFAULT 'No',
  `rwmi_inferior` enum('Yes','No') DEFAULT 'No',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cardiac_investigation_id`),
  KEY `fk_hf_cardiac_investigations` (`hf_id`),
  CONSTRAINT `fk_hf_cardiac_investigations` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_cardiac_investigations`
--

LOCK TABLES `hf_cardiac_investigations` WRITE;
/*!40000 ALTER TABLE `hf_cardiac_investigations` DISABLE KEYS */;
INSERT INTO `hf_cardiac_investigations` VALUES (1,1,NULL,NULL,'No','No','No',NULL,'No','No','No','No','No','No',NULL,'No','No','No','community clinic','No','No','No',NULL,NULL,NULL,NULL,'No','Yes','Yes','No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1',NULL,'No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,NULL,NULL,'No','No','No',NULL,'No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','No',NULL,NULL,NULL,NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,'2002-06-19',5.00,'No','No','No',NULL,'No','No','No','No','Yes','No','Excessive water ingestion','No','No','No','Excessive water ingestion','No','No','No',0.00,0.00,'2003-02-19',0.00,'Yes','Yes','Yes','Yes','CT',NULL,0.00,0.00,0.00,0.00,0.00,'1','1','1','No','No','No','No','No','hello','hello','No','Yes','No','No','No','No','No','2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,NULL,5.00,'No','No','Yes','Others (Specify separate medical histories)','No','No','No','No','Yes','No','Others (Specify separate medical histories)','No','No','No','Others (Specify separate medical histories)','No','No','No',0.00,0.00,NULL,0.00,'Yes','Yes','Yes','Yes','Others (Specify separate medical histories)',NULL,0.00,0.00,0.00,0.00,0.00,'Yes','Yes','Yes','No','No','No','No','No','5:9','5:9','Yes','No','No','No','No','No','No','2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,'2026-06-30',0.00,'No','No','No',NULL,'No','No','No','No','Yes','No','stroke','Yes','No','No',NULL,'No','No','No',11.00,12.00,NULL,0.00,'Yes','Yes','Yes','No',NULL,'2026-07-16',11.00,13.00,16.00,13.00,15.00,'Yes','Yes','Yes','No','No','No','No','No','67','45','No','Yes','No','No','No','No','No','2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,NULL,NULL,'No','No','No',NULL,'No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','No',NULL,NULL,NULL,NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,NULL,NULL,'No','No','No',NULL,'No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','No',NULL,NULL,NULL,NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,NULL,NULL,'No','No','No',NULL,'No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','No',NULL,NULL,NULL,NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,NULL,NULL,'No','No','No',NULL,'No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','No',NULL,NULL,NULL,NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,NULL,NULL,'No','No','No',NULL,'No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','No',NULL,NULL,NULL,NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,NULL,5.00,'Yes','No','No',NULL,'No','No','Yes','No','Yes','No','stroke','No','No','No',NULL,'No','No','No',420.00,480.00,NULL,0.52,'No','No','No','No',NULL,NULL,55.00,1.20,8.00,180.00,20.00,'No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,NULL,NULL,'No','No','No',NULL,'No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','No',NULL,NULL,NULL,NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,'2026-06-25',5.00,'Yes','No','No',NULL,'No','No','Yes','No','Yes','No','stroke','No','No','No',NULL,'No','No','No',0.52,0.30,'2026-07-15',0.53,'Yes','Yes','Yes','Yes','Final Clinical Notes / Summary',NULL,11.00,12.00,14.00,15.00,13.00,'Yes','Yes','Yes','No','No','No','No','No','Final Clinical Notes / Summary','Final Clinical Notes / Summary','No','Yes','No','No','No','No','No','2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,NULL,NULL,'No','No','No',NULL,'No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','No',NULL,NULL,NULL,NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_cardiac_investigations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_device_therapy`
--

DROP TABLE IF EXISTS `hf_device_therapy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_device_therapy` (
  `device_therapy_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `current_device_none` enum('Yes','No') DEFAULT 'No',
  `current_device_yes` enum('Yes','No') DEFAULT 'No',
  `current_crt_p` enum('Yes','No') DEFAULT 'No',
  `current_crt_d` enum('Yes','No') DEFAULT 'No',
  `current_icd_sc` enum('Yes','No') DEFAULT 'No',
  `current_icd_dc` enum('Yes','No') DEFAULT 'No',
  `current_dual_chamber_pacemaker` enum('Yes','No') DEFAULT 'No',
  `current_single_chamber_pacemaker` enum('Yes','No') DEFAULT 'No',
  `current_device_other` enum('Yes','No') DEFAULT 'No',
  `current_device_other_name` varchar(100) DEFAULT NULL,
  `current_device_brand` varchar(100) DEFAULT NULL,
  `eligible_no` enum('Yes','No') DEFAULT 'No',
  `eligible_yes` enum('Yes','No') DEFAULT 'No',
  `eligible_crt_p` enum('Yes','No') DEFAULT 'No',
  `eligible_crt_d` enum('Yes','No') DEFAULT 'No',
  `eligible_icd_sc` enum('Yes','No') DEFAULT 'No',
  `eligible_icd_dc` enum('Yes','No') DEFAULT 'No',
  `eligible_dual_chamber_pacemaker` enum('Yes','No') DEFAULT 'No',
  `eligible_single_chamber_pacemaker` enum('Yes','No') DEFAULT 'No',
  `eligible_other` enum('Yes','No') DEFAULT 'No',
  `eligible_other_name` varchar(100) DEFAULT NULL,
  `eligible_device_brand` varchar(100) DEFAULT NULL,
  `patient_acceptance_yes` enum('Yes','No') DEFAULT 'No',
  `patient_acceptance_no` enum('Yes','No') DEFAULT 'No',
  `patient_acceptance_reason` text,
  `implant_date` date DEFAULT NULL,
  `icd_shock` enum('Yes','No') DEFAULT 'No',
  `number_of_shocks` smallint unsigned DEFAULT NULL,
  `appropriate_shocks` smallint unsigned DEFAULT NULL,
  `inappropriate_shocks` smallint unsigned DEFAULT NULL,
  `cause_of_shocks` text,
  `atp` enum('Yes','No') DEFAULT 'No',
  `atp_times` smallint unsigned DEFAULT NULL,
  `atp_success_always` enum('Yes','No') DEFAULT 'No',
  `atp_success_most_times` enum('Yes','No') DEFAULT 'No',
  `atp_success_sometimes` enum('Yes','No') DEFAULT 'No',
  `atp_success_not_successful` enum('Yes','No') DEFAULT 'No',
  `biv_pacing_percent` decimal(5,2) DEFAULT NULL,
  `afib_burden` varchar(100) DEFAULT NULL,
  `nsvt_episodes` smallint unsigned DEFAULT NULL,
  `svt_episodes` smallint unsigned DEFAULT NULL,
  `device_volume_alert` text,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`device_therapy_id`),
  KEY `fk_hf_device_therapy` (`hf_id`),
  CONSTRAINT `fk_hf_device_therapy` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_device_therapy`
--

LOCK TABLES `hf_device_therapy` WRITE;
/*!40000 ALTER TABLE `hf_device_therapy` DISABLE KEYS */;
INSERT INTO `hf_device_therapy` VALUES (1,1,'No','No','No','No','No','No','No','No','No',NULL,NULL,'Yes','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,'No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','hello','hello','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','hello','hello','No','Yes','hello','2001-11-11','Yes',5,5,4,'hello','Yes',8,'No','Yes','No','No',98.00,'2',32,23,'hello','hello','2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,'Yes','No','No','No','No','No','No','No','No',NULL,NULL,'Yes','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,'2001-11-11','Yes',5,5,5,'5:9','Yes',4,'No','Yes','No','No',98.00,'4',5,5,'5:9','5:9','2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No','No','No','No','No','No','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,'No','Yes','Yes','Yes','No','No','No','No','Yes','Final Clinical Notes / Summary',NULL,'No','Yes','Yes','No','No','No','No','No','Yes','Final Clinical Notes / Summary','Final Clinical Notes / Summary','No','Yes','Final Clinical Notes / Summary\n','2026-07-02','Yes',5,5,5,'bg','Yes',3,'No','Yes','No','No',98.00,'4',5,4,'Final Clinical Notes / Summary','Final Clinical Notes / Summary\n','2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,'No','Yes','No','No','No','Yes','No','No','No',NULL,NULL,'No','Yes','No','No','No','No','Yes','No','No',NULL,NULL,'No','No',NULL,NULL,'No',NULL,NULL,NULL,NULL,'No',NULL,'No','No','No','No',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_device_therapy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_final_clinical_assessment`
--

DROP TABLE IF EXISTS `hf_final_clinical_assessment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_final_clinical_assessment` (
  `final_assessment_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `hfref` enum('Yes','No') DEFAULT 'No',
  `hfpef` enum('Yes','No') DEFAULT 'No',
  `etiology_ischemic` enum('Yes','No') DEFAULT 'No',
  `etiology_toxic` enum('Yes','No') DEFAULT 'No',
  `etiology_idiopathic` enum('Yes','No') DEFAULT 'No',
  `etiology_hypertrophic` enum('Yes','No') DEFAULT 'No',
  `etiology_restrictive` enum('Yes','No') DEFAULT 'No',
  `etiology_valvular_rheumatic` enum('Yes','No') DEFAULT 'No',
  `etiology_hypertensive` enum('Yes','No') DEFAULT 'No',
  `etiology_tachycardia_induced` enum('Yes','No') DEFAULT 'No',
  `etiology_metabolic_disease` enum('Yes','No') DEFAULT 'No',
  `etiology_hiv_viral_cardiomyopathy` enum('Yes','No') DEFAULT 'No',
  `etiology_inflammatory_cardiomyopathy` enum('Yes','No') DEFAULT 'No',
  `etiology_reduced_ef_previous_mi` enum('Yes','No') DEFAULT 'No',
  `etiology_pregnancy` enum('Yes','No') DEFAULT 'No',
  `etiology_thyroid_disease` enum('Yes','No') DEFAULT 'No',
  `etiology_pheochromocytoma` enum('Yes','No') DEFAULT 'No',
  `etiology_chronic_renal_disease` enum('Yes','No') DEFAULT 'No',
  `etiology_cor_pulmonale_copd` enum('Yes','No') DEFAULT 'No',
  `etiology_pulmonary_hypertension` enum('Yes','No') DEFAULT 'No',
  `etiology_other` enum('Yes','No') DEFAULT 'No',
  `etiology_other_details` varchar(255) DEFAULT NULL,
  `cad` enum('Yes','No') DEFAULT 'No',
  `renal_failure` enum('Yes','No') DEFAULT 'No',
  `diabetes_mellitus` enum('Yes','No') DEFAULT 'No',
  `hypertension` enum('Yes','No') DEFAULT 'No',
  `valvular_disease` enum('Yes','No') DEFAULT 'No',
  `asthma` enum('Yes','No') DEFAULT 'No',
  `copd` enum('Yes','No') DEFAULT 'No',
  `osa` enum('Yes','No') DEFAULT 'No',
  `anemia` enum('Yes','No') DEFAULT 'No',
  `cva` enum('Yes','No') DEFAULT 'No',
  `severe_musculoskeletal_disease` enum('Yes','No') DEFAULT 'No',
  `cancer` enum('Yes','No') DEFAULT 'No',
  `apd` enum('Yes','No') DEFAULT 'No',
  `bleeding_diathesis` enum('Yes','No') DEFAULT 'No',
  `pvd` enum('Yes','No') DEFAULT 'No',
  `comorbidity_other` enum('Yes','No') DEFAULT 'No',
  `comorbidity_other_details` varchar(255) DEFAULT NULL,
  `smoking` enum('Yes','No') DEFAULT 'No',
  `alcohol` enum('Yes','No') DEFAULT 'No',
  `risk_factor_other` enum('Yes','No') DEFAULT 'No',
  `risk_factor_other_details` varchar(255) DEFAULT NULL,
  `stage_a` enum('Yes','No') DEFAULT 'No',
  `stage_b` enum('Yes','No') DEFAULT 'No',
  `stage_c` enum('Yes','No') DEFAULT 'No',
  `stage_d` enum('Yes','No') DEFAULT 'No',
  `nyha_class_1` enum('Yes','No') DEFAULT 'No',
  `nyha_class_2` enum('Yes','No') DEFAULT 'No',
  `nyha_class_3` enum('Yes','No') DEFAULT 'No',
  `nyha_class_4` enum('Yes','No') DEFAULT 'No',
  `af_permanent` enum('Yes','No') DEFAULT 'No',
  `af_paroxysmal` enum('Yes','No') DEFAULT 'No',
  `af_persistent` enum('Yes','No') DEFAULT 'No',
  `af_nsr` enum('Yes','No') DEFAULT 'No',
  `mace_hospitalization` enum('Yes','No') DEFAULT 'No',
  `mace_stroke` enum('Yes','No') DEFAULT 'No',
  `mace_major_bleed` enum('Yes','No') DEFAULT 'No',
  `mace_severe_arrhythmia` enum('Yes','No') DEFAULT 'No',
  `mace_major_procedure` enum('Yes','No') DEFAULT 'No',
  `mace_other` enum('Yes','No') DEFAULT 'No',
  `mace_other_details` varchar(255) DEFAULT NULL,
  `mace_death` enum('Yes','No') DEFAULT 'No',
  `death_date` date DEFAULT NULL,
  `death_home` enum('Yes','No') DEFAULT 'No',
  `death_hospital` enum('Yes','No') DEFAULT 'No',
  `death_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `hosp_note` varchar(255) DEFAULT NULL,
  `stroke_note` varchar(255) DEFAULT NULL,
  `bleed_note` varchar(255) DEFAULT NULL,
  `arrhythmia_note` varchar(255) DEFAULT NULL,
  `procedure_note` varchar(255) DEFAULT NULL,
  `other_note` varchar(255) DEFAULT NULL,
  `death_note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`final_assessment_id`),
  KEY `fk_hf_final_assessment` (`hf_id`),
  CONSTRAINT `fk_hf_final_assessment` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_final_clinical_assessment`
--

LOCK TABLES `hf_final_clinical_assessment` WRITE;
/*!40000 ALTER TABLE `hf_final_clinical_assessment` DISABLE KEYS */;
INSERT INTO `hf_final_clinical_assessment` VALUES (1,1,'No','No','No','Yes','No','No','Yes','No','No','Yes','No','No','No','No','No','No','No','Yes','No','Yes','No',NULL,'No','No','No','No','No','No','No','No','Yes','No','Yes','No','Yes','No','No','No',NULL,'No','No','Yes','community clinic','No','No','Yes','No','No','No','No','No','No','Yes','No','No','No','No','Yes','No','Yes','No',NULL,'Yes','2023-05-24','Yes','No','community clinic','2026-07-18 17:56:04','2026-07-18 17:56:04',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,2,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','Yes','No','No','No','No','No','No','No','No','Yes','No','No','No','No','No','No',NULL,'No',NULL,'No','No',NULL,'2026-07-18 18:00:42','2026-07-18 18:00:42',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,3,'No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','No',NULL,'Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Excessive water ingestion','Yes','Yes','Yes','Excessive water ingestion','No','No','Yes','No','No','No','No','No','Yes','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Excessive water ingestion','Yes','2004-12-14','Yes','No','Excessive water ingestion','2026-07-19 11:39:04','2026-07-19 11:39:04',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,4,'Yes','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Others (Specify separate medical histories)','Yes','No','Yes','Yes','Yes','Yes','Yes','Yes','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Others (Specify separate medical histories)','Yes','Yes','Yes','Others (Specify separate medical histories)','No','No','Yes','No','Yes','Yes','No','No','No','Yes','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Others (Specify separate medical histories)','Yes',NULL,'Yes','No','Others (Specify separate medical histories)','2026-07-19 12:57:17','2026-07-19 12:57:17',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,6,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','Yes','No','Yes','Yes','No','No','No','No','No','Yes','No','No','No','No','No','No',NULL,'Yes','2026-07-31','Yes','No','stroke','2026-07-20 02:22:41','2026-07-20 02:22:41',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,7,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','Yes','No','Yes','Yes','No','No','No','No','No','Yes','No','No','No','No','No','No',NULL,'No',NULL,'No','No',NULL,'2026-07-20 03:32:52','2026-07-20 03:32:52',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,8,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','Yes','No','Yes','Yes','No','No','No','No','No','Yes','No','No','No','No','No','No',NULL,'No',NULL,'No','No',NULL,'2026-07-20 03:34:30','2026-07-20 03:34:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,9,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','Yes','No','No','Yes','No','No','No','No','No','Yes','No','No','No','No','No','No',NULL,'No',NULL,'No','No',NULL,'2026-07-20 04:05:33','2026-07-20 04:05:33',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,10,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','Yes','No','No','Yes','No','No','No','No','No','Yes','No','No','No','No','No','No',NULL,'No',NULL,'No','No',NULL,'2026-07-20 04:08:52','2026-07-20 04:08:52',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,11,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','Yes','No','No','No','No','No','No','Yes','No','No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','Yes','No','No','Yes','No','No','No','No','No','Yes','No','No','No','No','No','No',NULL,'No',NULL,'No','No',NULL,'2026-07-20 04:13:55','2026-07-20 04:13:55',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(11,12,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','Yes','No','No','Yes','No','No','No','Yes','No','No','Yes','No','No','No','No',NULL,'No','No','No',NULL,'No','No','Yes','No','No','Yes','No','No','No','No','No','Yes','No','No','No','No','No','No',NULL,'No',NULL,'No','No',NULL,'2026-07-20 04:23:59','2026-07-20 04:23:59',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(12,13,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','Yes','No','No','Yes','No','No','No','No','No','Yes','No','No','No','No','No','No',NULL,'No',NULL,'No','No',NULL,'2026-07-20 06:23:15','2026-07-20 06:23:15',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(13,14,'No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Present Diagnosis','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Present Diagnosis','Yes','Yes','Yes','Present Diagnosis','No','No','Yes','No','No','Yes','No','No','Yes','No','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Present Diagnosis','Yes','2026-07-18','Yes','No','stroke','2026-07-20 06:49:20','2026-07-20 06:49:20',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(14,15,'No','No','No','No','No','No','Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No',NULL,'No','No','Yes','No','No','Yes','No','No','No','No','No','Yes','No','No','No','No','No','No',NULL,'No',NULL,'No','No',NULL,'2026-07-20 08:05:35','2026-07-20 08:05:35',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `hf_final_clinical_assessment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_initial_assessment`
--

DROP TABLE IF EXISTS `hf_initial_assessment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_initial_assessment` (
  `assessment_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `assessed_by` varchar(100) DEFAULT NULL,
  `assessment_date` date DEFAULT NULL,
  `previous_diagnosis` text,
  `history_cabg` enum('Yes','No') DEFAULT 'No',
  `history_ptca` enum('Yes','No') DEFAULT 'No',
  `history_stroke` enum('Yes','No') DEFAULT 'No',
  `history_major_bleed` enum('Yes','No') DEFAULT 'No',
  `history_thrombolysis` enum('Yes','No') DEFAULT 'No',
  `history_past_mi` enum('Yes','No') DEFAULT 'No',
  `past_mi_years_ago` smallint unsigned DEFAULT NULL,
  `past_mi_location` varchar(100) DEFAULT NULL,
  `history_other` text,
  `previous_hf_hospitalization` enum('Yes','No') DEFAULT 'No',
  `recent_hospitalization_dates` text,
  `recent_hospitalization_reasons` text,
  `documented_vt_vf` enum('Yes','No') DEFAULT 'No',
  `documented_pvcs` enum('Yes','No') DEFAULT 'No',
  `complaints_syncope_presyncope` enum('Yes','No') DEFAULT 'No',
  `pvc_count` smallint unsigned DEFAULT NULL,
  `pvc_frequency` varchar(100) DEFAULT NULL,
  `documented_nsvt` enum('Yes','No') DEFAULT 'No',
  `nsvt_frequency` varchar(100) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `unable_to_weigh` enum('Yes','No') DEFAULT 'No',
  `unable_to_weigh_reason` varchar(255) DEFAULT NULL,
  `height` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(5,2) DEFAULT NULL,
  `heart_rate` smallint unsigned DEFAULT NULL,
  `heart_rate_regular` enum('Yes','No') DEFAULT 'No',
  `heart_rate_irregular` enum('Yes','No') DEFAULT 'No',
  `respiratory_rate` smallint unsigned DEFAULT NULL,
  `oxygen_saturation` decimal(5,2) DEFAULT NULL,
  `systolic_bp_sitting` smallint unsigned DEFAULT NULL,
  `diastolic_bp_sitting` smallint unsigned DEFAULT NULL,
  `systolic_bp_standing` smallint unsigned DEFAULT NULL,
  `diastolic_bp_standing` smallint unsigned DEFAULT NULL,
  `mental_status_alert_oriented` enum('Yes','No') DEFAULT 'No',
  `mental_status_confused` enum('Yes','No') DEFAULT 'No',
  `mental_status_drowsy` enum('Yes','No') DEFAULT 'No',
  `dyspnea_at_rest` enum('Yes','No') DEFAULT 'No',
  `dyspnea_with_exertion` enum('Yes','No') DEFAULT 'No',
  `fatigue` enum('Yes','No') DEFAULT 'No',
  `orthopnea` enum('Yes','No') DEFAULT 'No',
  `loss_of_appetite_bloating` enum('Yes','No') DEFAULT 'No',
  `decreased_exercise_tolerance` enum('Yes','No') DEFAULT 'No',
  `weight_gain` enum('Yes','No') DEFAULT 'No',
  `weight_loss` enum('Yes','No') DEFAULT 'No',
  `syncope` enum('Yes','No') DEFAULT 'No',
  `pnd` enum('Yes','No') DEFAULT 'No',
  `muscle_cramps` enum('Yes','No') DEFAULT 'No',
  `wheeze` enum('Yes','No') DEFAULT 'No',
  `giddiness` enum('Yes','No') DEFAULT 'No',
  `symptom_other` enum('Yes','No') DEFAULT 'No',
  `symptom_other_details` varchar(255) DEFAULT NULL,
  `peripheral_edema` enum('Yes','No') DEFAULT 'No',
  `ascites` enum('Yes','No') DEFAULT 'No',
  `rales` enum('Yes','No') DEFAULT 'No',
  `jugular_venous_pressure` enum('Yes','No') DEFAULT 'No',
  `hepatomegaly` enum('Yes','No') DEFAULT 'No',
  `clinical_sign_other` enum('Yes','No') DEFAULT 'No',
  `clinical_sign_other_details` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`assessment_id`),
  KEY `fk_hf_initial_assessment` (`hf_id`),
  CONSTRAINT `fk_hf_initial_assessment` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_initial_assessment`
--

LOCK TABLES `hf_initial_assessment` WRITE;
/*!40000 ALTER TABLE `hf_initial_assessment` DISABLE KEYS */;
INSERT INTO `hf_initial_assessment` VALUES (1,1,NULL,'2026-07-18','diagonisis','Yes','No','Yes','No','No','Yes',4,'inferior','PVD','Yes','feb 2020','decompensated HF','Yes','No','No',NULL,NULL,'Yes','4',70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','Yes','No','Yes','No','Yes','No','No','No','No','No','Yes','No','No',NULL,'Yes','No','No','Yes','Yes','No',NULL,'2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,NULL,'2026-07-18',NULL,'No','No','No','No','No','No',NULL,NULL,NULL,'No',NULL,NULL,'No','No','No',NULL,NULL,'No',NULL,70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No',NULL,'2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,NULL,'1987-07-19','Excessive water ingestion','Yes','Yes','Yes','Yes','Yes','Yes',5,'inferior','PVD','Yes','feb 2020','decompensated HF','Yes','Yes','Yes',2,'bigrmmy','Yes','4',70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'No','Yes','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','sympton','Yes','Yes','Yes','Yes','Yes','Yes','cold','2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,NULL,'2002-07-19','Previous Diagnosis','Yes','Yes','Yes','Yes','Yes','Yes',5,'inferior','Others (Specify separate medical histories)','Yes','feb 2020','decompensated HF','Yes','Yes','Yes',3,'bigrmmy','Yes','4',70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','sympton','Yes','Yes','Yes','Yes','Yes','Yes','cold','2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,NULL,'2026-07-20',NULL,'No','No','No','No','No','No',NULL,NULL,NULL,'No',NULL,NULL,'No','No','No',NULL,NULL,'No',NULL,70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No',NULL,'2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,NULL,'2026-07-20',NULL,'No','No','No','No','No','No',NULL,NULL,NULL,'No',NULL,NULL,'No','No','No',NULL,NULL,'No',NULL,70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No',NULL,'2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,NULL,'2026-07-20',NULL,'No','No','No','No','No','No',NULL,NULL,NULL,'No',NULL,NULL,'No','No','No',NULL,NULL,'No',NULL,70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No',NULL,'2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,NULL,'2026-07-20',NULL,'No','No','No','No','No','No',NULL,NULL,NULL,'No',NULL,NULL,'No','No','No',NULL,NULL,'No',NULL,70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No',NULL,'2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,NULL,'2026-07-20',NULL,'No','No','No','No','No','No',NULL,NULL,NULL,'No',NULL,NULL,'No','No','No',NULL,NULL,'No',NULL,70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No',NULL,'2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,NULL,'2026-07-20',NULL,'No','No','No','No','No','No',NULL,NULL,NULL,'No',NULL,NULL,'No','No','No',NULL,NULL,'No',NULL,70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No',NULL,'2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,NULL,'2026-07-20',NULL,'No','No','No','No','No','No',NULL,NULL,NULL,'No',NULL,NULL,'No','No','No',NULL,NULL,'No',NULL,70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No',NULL,'2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,NULL,'2026-07-20',NULL,'No','No','No','No','No','No',NULL,NULL,NULL,'No',NULL,NULL,'No','No','No',NULL,NULL,'No',NULL,70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No',NULL,'2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,NULL,'2026-07-20','Previous Diagnosis','Yes','Yes','Yes','Yes','Yes','Yes',8,'inferior','Others (Specify separate medical histories)','Yes','feb 2020','decompensated HF','Yes','Yes','Yes',6,'bigrmmy','Yes','4',70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','sympton','Yes','Yes','Yes','Yes','Yes','Yes','cold','2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,NULL,'2026-07-20',NULL,'No','No','No','No','No','No',NULL,NULL,NULL,'No',NULL,NULL,'No','No','No',NULL,NULL,'No',NULL,70.00,'No',NULL,170.00,24.20,72,'Yes','No',18,98.00,120,80,115,76,'Yes','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No','No',NULL,'No','No','No','No','No','No',NULL,'2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_initial_assessment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_lab_tests`
--

DROP TABLE IF EXISTS `hf_lab_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_lab_tests` (
  `lab_test_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `pneumococcal_vaccination` enum('Yes','No') DEFAULT 'No',
  `pneumococcal_vaccination_date` date DEFAULT NULL,
  `influenza_vaccination` enum('Yes','No') DEFAULT 'No',
  `influenza_vaccination_date` date DEFAULT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `potassium_result` varchar(50) DEFAULT NULL,
  `potassium_date` date DEFAULT NULL,
  `creatinine_result` varchar(50) DEFAULT NULL,
  `creatinine_date` date DEFAULT NULL,
  `hb_result` varchar(50) DEFAULT NULL,
  `hb_date` date DEFAULT NULL,
  `calcium_result` varchar(50) DEFAULT NULL,
  `calcium_date` date DEFAULT NULL,
  `bun_result` varchar(50) DEFAULT NULL,
  `bun_date` date DEFAULT NULL,
  `glucose_result` varchar(50) DEFAULT NULL,
  `glucose_date` date DEFAULT NULL,
  `hba1c_result` varchar(50) DEFAULT NULL,
  `hba1c_date` date DEFAULT NULL,
  `magnesium_result` varchar(50) DEFAULT NULL,
  `magnesium_date` date DEFAULT NULL,
  `sodium_result` varchar(50) DEFAULT NULL,
  `sodium_date` date DEFAULT NULL,
  `tsh_result` varchar(50) DEFAULT NULL,
  `tsh_date` date DEFAULT NULL,
  `t3_result` varchar(50) DEFAULT NULL,
  `t3_date` date DEFAULT NULL,
  `t4_result` varchar(50) DEFAULT NULL,
  `t4_date` date DEFAULT NULL,
  `bnp_result` varchar(50) DEFAULT NULL,
  `bnp_date` date DEFAULT NULL,
  `nt_pro_bnp_result` varchar(50) DEFAULT NULL,
  `nt_pro_bnp_date` date DEFAULT NULL,
  `ldl_result` varchar(50) DEFAULT NULL,
  `ldl_date` date DEFAULT NULL,
  `inr_result` varchar(50) DEFAULT NULL,
  `inr_date` date DEFAULT NULL,
  `st2_result` varchar(50) DEFAULT NULL,
  `st2_date` date DEFAULT NULL,
  `other_lab_test_name` varchar(100) DEFAULT NULL,
  `other_lab_test_result` varchar(50) DEFAULT NULL,
  `other_lab_test_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`lab_test_id`),
  KEY `fk_hf_lab_tests` (`hf_id`),
  CONSTRAINT `fk_hf_lab_tests` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_lab_tests`
--

LOCK TABLES `hf_lab_tests` WRITE;
/*!40000 ALTER TABLE `hf_lab_tests` DISABLE KEYS */;
INSERT INTO `hf_lab_tests` VALUES (1,1,'No',NULL,'No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6.7',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,'No',NULL,'No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,'No','2001-11-11','No','2001-11-11',NULL,'4.5',NULL,'4.5','2002-06-19','4.5',NULL,'4.5',NULL,'4.5',NULL,'4.5',NULL,'4.5',NULL,'4.5',NULL,'4.5',NULL,'4.5',NULL,'4.5',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'4.5',NULL,NULL,NULL,NULL,'4.55555',NULL,'2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,'Yes',NULL,'Yes',NULL,'B+','5:9',NULL,'5:9',NULL,'5:9',NULL,'5:9',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'5:9',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'5:9',NULL,NULL,NULL,NULL,'2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,'Yes','2026-07-09','Yes','2026-07-07','AB-','4.8','2026-06-29','6.3','2026-06-28',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'hy','3.2','2026-07-01','2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,'No',NULL,'No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,'No',NULL,'No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,'No',NULL,'No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,'No',NULL,'No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,'No',NULL,'No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,'No',NULL,'No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,'No',NULL,'No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,'Yes','2026-07-09','Yes','2026-07-10','AB+','5.6','2026-07-07',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,'No',NULL,'No',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_lab_tests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_medical_therapy_part1`
--

DROP TABLE IF EXISTS `hf_medical_therapy_part1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_medical_therapy_part1` (
  `therapy_part1_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `recommended_consults` text,
  `drug_intolerance_contraindications` text,
  `carvedilol` enum('Yes','No') DEFAULT 'No',
  `carvedilol_dose` varchar(100) DEFAULT NULL,
  `bisoprolol` enum('Yes','No') DEFAULT 'No',
  `bisoprolol_dose` varchar(100) DEFAULT NULL,
  `metoprolol_succinate` enum('Yes','No') DEFAULT 'No',
  `metoprolol_succinate_dose` varchar(100) DEFAULT NULL,
  `nebivolol` enum('Yes','No') DEFAULT 'No',
  `nebivolol_dose` varchar(100) DEFAULT NULL,
  `beta_blocker_other` enum('Yes','No') DEFAULT 'No',
  `beta_blocker_other_name` varchar(100) DEFAULT NULL,
  `beta_blocker_other_dose` varchar(100) DEFAULT NULL,
  `beta_not_used_bradycardia` enum('Yes','No') DEFAULT 'No',
  `beta_not_used_heart_blocks` enum('Yes','No') DEFAULT 'No',
  `beta_not_used_copd_asthma` enum('Yes','No') DEFAULT 'No',
  `beta_not_used_hypotension` enum('Yes','No') DEFAULT 'No',
  `beta_not_used_other` enum('Yes','No') DEFAULT 'No',
  `beta_not_used_other_reason` varchar(255) DEFAULT NULL,
  `enalapril` enum('Yes','No') DEFAULT 'No',
  `enalapril_dose` varchar(100) DEFAULT NULL,
  `ramipril` enum('Yes','No') DEFAULT 'No',
  `ramipril_dose` varchar(100) DEFAULT NULL,
  `lisinopril` enum('Yes','No') DEFAULT 'No',
  `lisinopril_dose` varchar(100) DEFAULT NULL,
  `perindopril` enum('Yes','No') DEFAULT 'No',
  `perindopril_dose` varchar(100) DEFAULT NULL,
  `ace_other` enum('Yes','No') DEFAULT 'No',
  `ace_other_name` varchar(100) DEFAULT NULL,
  `ace_other_dose` varchar(100) DEFAULT NULL,
  `ace_not_used_elevated_creatinine` enum('Yes','No') DEFAULT 'No',
  `ace_not_used_hyperkalemia` enum('Yes','No') DEFAULT 'No',
  `ace_not_used_cough` enum('Yes','No') DEFAULT 'No',
  `ace_not_used_hypotension` enum('Yes','No') DEFAULT 'No',
  `ace_not_used_other` enum('Yes','No') DEFAULT 'No',
  `ace_not_used_other_reason` varchar(255) DEFAULT NULL,
  `valsartan` enum('Yes','No') DEFAULT 'No',
  `valsartan_dose` varchar(100) DEFAULT NULL,
  `losartan` enum('Yes','No') DEFAULT 'No',
  `losartan_dose` varchar(100) DEFAULT NULL,
  `telmisartan` enum('Yes','No') DEFAULT 'No',
  `telmisartan_dose` varchar(100) DEFAULT NULL,
  `olmesartan` enum('Yes','No') DEFAULT 'No',
  `olmesartan_dose` varchar(100) DEFAULT NULL,
  `arb_other` enum('Yes','No') DEFAULT 'No',
  `arb_other_name` varchar(100) DEFAULT NULL,
  `arb_other_dose` varchar(100) DEFAULT NULL,
  `arb_not_used_elevated_creatinine` enum('Yes','No') DEFAULT 'No',
  `arb_not_used_hyperkalemia` enum('Yes','No') DEFAULT 'No',
  `arb_not_used_hypotension` enum('Yes','No') DEFAULT 'No',
  `arb_not_used_other` enum('Yes','No') DEFAULT 'No',
  `arb_not_used_other_reason` varchar(255) DEFAULT NULL,
  `spironolactone` enum('Yes','No') DEFAULT 'No',
  `spironolactone_dose` varchar(100) DEFAULT NULL,
  `eplerenone` enum('Yes','No') DEFAULT 'No',
  `eplerenone_dose` varchar(100) DEFAULT NULL,
  `aldosterone_not_used_hyperkalemia` enum('Yes','No') DEFAULT 'No',
  `aldosterone_not_used_hyponatremia` enum('Yes','No') DEFAULT 'No',
  `aldosterone_not_used_elevated_creatinine` enum('Yes','No') DEFAULT 'No',
  `aldosterone_not_used_other` enum('Yes','No') DEFAULT 'No',
  `aldosterone_not_used_other_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`therapy_part1_id`),
  KEY `fk_hf_medical_therapy_part1` (`hf_id`),
  CONSTRAINT `fk_hf_medical_therapy_part1` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_medical_therapy_part1`
--

LOCK TABLES `hf_medical_therapy_part1` WRITE;
/*!40000 ALTER TABLE `hf_medical_therapy_part1` DISABLE KEYS */;
INSERT INTO `hf_medical_therapy_part1` VALUES (1,1,'community clinic','community clinic','No',NULL,'Yes',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'Yes','6.9','No',NULL,NULL,'No','No','Yes','No','No',NULL,'No',NULL,'No',NULL,'Yes','4.5','No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,'4.5','4.5','Yes','6','Yes','4','Yes','5','No',NULL,'No',NULL,NULL,'Yes','Yes','Yes','Yes','Yes','4.5','Yes','5','Yes','6','Yes','7','Yes',NULL,'Yes','Varshitha Appam','4','Yes','No','No','No','No',NULL,'Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes','Varshitha Appam','4','Yes','Yes','Yes','Yes','hello','Yes','4','Yes','5','Yes','Yes','Yes','Yes','hello','2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,'5:9','5:9','Yes','5:9','Yes','5:9','Yes','5:9','Yes','5:9','Yes','5:9','5:9','Yes','Yes','Yes','Yes','Yes','5:9','Yes',NULL,'Yes','5:9','Yes','5:9','Yes',NULL,'Yes','5:9','5:9','Yes','Yes','Yes','Yes','Yes','5:9','Yes','5:9','Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes','5:9',NULL,'Yes','Yes','Yes','Yes','5:9','Yes','5:9','Yes',NULL,'Yes','Yes','Yes','Yes','5:9','2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,'Final Clinical Notes / Summary','Final Clinical Notes / Summary','Yes','7','Yes','6','Yes','5','Yes','8','Yes','Final Clinical Notes / Summary','7','Yes','Yes','No','No','No',NULL,'Yes','5','No',NULL,'No',NULL,'No',NULL,'Yes','Final Clinical Notes / Summary','4','Yes','No','No','No','Yes','Final Clinical Notes / Summary','Yes','5','No',NULL,'No',NULL,'No',NULL,'Yes','Final Clinical Notes / Summary','4','No','Yes','No','Yes','Final Clinical Notes / Summary','Yes','4','Yes',NULL,'Yes','No','No','Yes','Final Clinical Notes / Summary','2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No',NULL,'No',NULL,'No',NULL,'No','No','No','No',NULL,'2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_medical_therapy_part1` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_medical_therapy_part2`
--

DROP TABLE IF EXISTS `hf_medical_therapy_part2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_medical_therapy_part2` (
  `therapy_part2_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `hydralazine` enum('Yes','No') DEFAULT 'No',
  `hydralazine_name` varchar(100) DEFAULT NULL,
  `hydralazine_dose` varchar(100) DEFAULT NULL,
  `nitrate_1` enum('Yes','No') DEFAULT 'No',
  `nitrate_1_name` varchar(100) DEFAULT NULL,
  `nitrate_1_dose` varchar(100) DEFAULT NULL,
  `nitrate_2` enum('Yes','No') DEFAULT 'No',
  `nitrate_2_name` varchar(100) DEFAULT NULL,
  `nitrate_2_dose` varchar(100) DEFAULT NULL,
  `warfarin` enum('Yes','No') DEFAULT 'No',
  `warfarin_inr` varchar(20) DEFAULT NULL,
  `warfarin_target_inr` varchar(20) DEFAULT NULL,
  `vitamin_k_inhibitor` enum('Yes','No') DEFAULT 'No',
  `vitamin_k_inhibitor_name` varchar(100) DEFAULT NULL,
  `vitamin_k_inhibitor_dose` varchar(100) DEFAULT NULL,
  `noac` enum('Yes','No') DEFAULT 'No',
  `noac_name` varchar(100) DEFAULT NULL,
  `noac_dose` varchar(100) DEFAULT NULL,
  `acitrom` enum('Yes','No') DEFAULT 'No',
  `acitrom_dose` varchar(100) DEFAULT NULL,
  `ufh` enum('Yes','No') DEFAULT 'No',
  `ufh_dose` varchar(100) DEFAULT NULL,
  `lmwh` enum('Yes','No') DEFAULT 'No',
  `lmwh_dose` varchar(100) DEFAULT NULL,
  `aspirin` enum('Yes','No') DEFAULT 'No',
  `aspirin_dose` varchar(100) DEFAULT NULL,
  `clopidogrel` enum('Yes','No') DEFAULT 'No',
  `clopidogrel_dose` varchar(100) DEFAULT NULL,
  `prasugrel` enum('Yes','No') DEFAULT 'No',
  `prasugrel_dose` varchar(100) DEFAULT NULL,
  `ticagrelor` enum('Yes','No') DEFAULT 'No',
  `ticagrelor_dose` varchar(100) DEFAULT NULL,
  `amiodarone` enum('Yes','No') DEFAULT 'No',
  `amiodarone_dose` varchar(100) DEFAULT NULL,
  `antiarrhythmic_other` enum('Yes','No') DEFAULT 'No',
  `antiarrhythmic_other_name` varchar(100) DEFAULT NULL,
  `antiarrhythmic_other_dose` varchar(100) DEFAULT NULL,
  `furosemide` enum('Yes','No') DEFAULT 'No',
  `furosemide_dose` varchar(100) DEFAULT NULL,
  `torsemide` enum('Yes','No') DEFAULT 'No',
  `torsemide_dose` varchar(100) DEFAULT NULL,
  `metolazone` enum('Yes','No') DEFAULT 'No',
  `metolazone_dose` varchar(100) DEFAULT NULL,
  `diuretic_other` enum('Yes','No') DEFAULT 'No',
  `diuretic_other_name` varchar(100) DEFAULT NULL,
  `diuretic_other_dose` varchar(100) DEFAULT NULL,
  `diuretic_not_used_hyponatremia` enum('Yes','No') DEFAULT 'No',
  `diuretic_not_used_hypokalemia` enum('Yes','No') DEFAULT 'No',
  `diuretic_not_used_worsening_renal_failure` enum('Yes','No') DEFAULT 'No',
  `diuretic_not_used_hypotension` enum('Yes','No') DEFAULT 'No',
  `diuretic_not_used_other` enum('Yes','No') DEFAULT 'No',
  `diuretic_not_used_other_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`therapy_part2_id`),
  KEY `fk_hf_medical_therapy_part2` (`hf_id`),
  CONSTRAINT `fk_hf_medical_therapy_part2` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_medical_therapy_part2`
--

LOCK TABLES `hf_medical_therapy_part2` WRITE;
/*!40000 ALTER TABLE `hf_medical_therapy_part2` DISABLE KEYS */;
INSERT INTO `hf_medical_therapy_part2` VALUES (1,1,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'Yes','4','No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,'Yes','hello','5','Yes','hello','5','Yes','hello','6','Yes','34','35','Yes','hello','5','Yes',NULL,NULL,'Yes',NULL,'No',NULL,'No',NULL,'Yes',NULL,'Yes','76','Yes',NULL,'Yes',NULL,'Yes','4','Yes','hello','5','Yes','e','Yes',NULL,'Yes',NULL,'Yes','hello','5','Yes','Yes','Yes','Yes','Yes','hello','2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,'Yes','5:9','5:9','Yes','5:9','5:9:9','No',NULL,NULL,'Yes','5:9','5:9','Yes','5:9','5:9','Yes',NULL,NULL,'Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes','5:9','Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes','5:9','Yes','5:9','5:9','Yes','5:9','Yes',NULL,'Yes',NULL,'Yes','5:9','v','Yes','Yes','Yes','Yes','Yes','5:9','2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,'Yes','Final Clinical Notes / Summary','4','No',NULL,NULL,'No',NULL,NULL,'Yes','134','160','No',NULL,NULL,'No',NULL,NULL,'No',NULL,'Yes','5','No',NULL,'Yes',NULL,'No',NULL,'No',NULL,'No',NULL,'Yes','5','No',NULL,NULL,'Yes','6','No',NULL,'No',NULL,'No',NULL,NULL,'Yes','No','No','No','No',NULL,'2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'Yes','7','No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No','No','No','No','No',NULL,'2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_medical_therapy_part2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_medical_therapy_part3`
--

DROP TABLE IF EXISTS `hf_medical_therapy_part3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_medical_therapy_part3` (
  `therapy_part3_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `digoxin` enum('Yes','No') DEFAULT 'No',
  `digoxin_name` varchar(100) DEFAULT NULL,
  `digoxin_dose` varchar(100) DEFAULT NULL,
  `ivabradine` enum('Yes','No') DEFAULT 'No',
  `ivabradine_dose` varchar(100) DEFAULT NULL,
  `atorvastatin` enum('Yes','No') DEFAULT 'No',
  `atorvastatin_dose` varchar(100) DEFAULT NULL,
  `simvastatin` enum('Yes','No') DEFAULT 'No',
  `simvastatin_dose` varchar(100) DEFAULT NULL,
  `rosuvastatin` enum('Yes','No') DEFAULT 'No',
  `rosuvastatin_dose` varchar(100) DEFAULT NULL,
  `sulfonylureas` enum('Yes','No') DEFAULT 'No',
  `sulfonylureas_dose` varchar(100) DEFAULT NULL,
  `metformin` enum('Yes','No') DEFAULT 'No',
  `metformin_dose` varchar(100) DEFAULT NULL,
  `glitazone` enum('Yes','No') DEFAULT 'No',
  `glitazone_dose` varchar(100) DEFAULT NULL,
  `gliptin` enum('Yes','No') DEFAULT 'No',
  `gliptin_dose` varchar(100) DEFAULT NULL,
  `acarbose_derivative` enum('Yes','No') DEFAULT 'No',
  `acarbose_derivative_dose` varchar(100) DEFAULT NULL,
  `human_insulin` enum('Yes','No') DEFAULT 'No',
  `human_insulin_dose` varchar(100) DEFAULT NULL,
  `synthetic_insulin` enum('Yes','No') DEFAULT 'No',
  `synthetic_insulin_dose` varchar(100) DEFAULT NULL,
  `antihypertensive` enum('Yes','No') DEFAULT 'No',
  `antihypertensive_name` varchar(100) DEFAULT NULL,
  `antihypertensive_dose` varchar(100) DEFAULT NULL,
  `thyroxine` enum('Yes','No') DEFAULT 'No',
  `thyroxine_dose` varchar(100) DEFAULT NULL,
  `other_medication_1` enum('Yes','No') DEFAULT 'No',
  `other_medication_1_name` varchar(100) DEFAULT NULL,
  `other_medication_1_dose` varchar(100) DEFAULT NULL,
  `other_medication_2` enum('Yes','No') DEFAULT 'No',
  `other_medication_2_name` varchar(100) DEFAULT NULL,
  `other_medication_2_dose` varchar(100) DEFAULT NULL,
  `other_medication_3` enum('Yes','No') DEFAULT 'No',
  `other_medication_3_name` varchar(100) DEFAULT NULL,
  `other_medication_3_dose` varchar(100) DEFAULT NULL,
  `other_medication_4` enum('Yes','No') DEFAULT 'No',
  `other_medication_4_name` varchar(100) DEFAULT NULL,
  `other_medication_4_dose` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`therapy_part3_id`),
  KEY `fk_hf_medical_therapy_part3` (`hf_id`),
  CONSTRAINT `fk_hf_medical_therapy_part3` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_medical_therapy_part3`
--

LOCK TABLES `hf_medical_therapy_part3` WRITE;
/*!40000 ALTER TABLE `hf_medical_therapy_part3` DISABLE KEYS */;
INSERT INTO `hf_medical_therapy_part3` VALUES (1,1,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,'Yes','hello','4','Yes','6','Yes','9','Yes','8','Yes',NULL,'Yes','4','Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes','hello','e','Yes','e','Yes','hello','e','Yes',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,'Yes','5:9','v5:9','Yes','5:9','Yes','5:9','Yes',NULL,'Yes',NULL,'Yes','5:9','Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes','5:9','5:9','Yes','5:9','Yes','5:9','5:9','No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,'Yes','Final Clinical Notes / Summary','4','Yes','7','Yes','9','No',NULL,'No',NULL,'Yes','2','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'Yes','Final Clinical Notes / Summary','4','No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,'No',NULL,NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,NULL,'No',NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'No',NULL,NULL,'2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_medical_therapy_part3` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_patient_education`
--

DROP TABLE IF EXISTS `hf_patient_education`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_patient_education` (
  `patient_education_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `diet_2000mg_salt_restriction` enum('Yes','No') DEFAULT 'No',
  `exercise_activity_promoted` enum('Yes','No') DEFAULT 'No',
  `daily_weight_monitoring` enum('Yes','No') DEFAULT 'No',
  `disease_process_explained` enum('Yes','No') DEFAULT 'No',
  `smoking_cessation` enum('Yes','No') DEFAULT 'No',
  `alcohol_cessation` enum('Yes','No') DEFAULT 'No',
  `medication_compliance` enum('Yes','No') DEFAULT 'No',
  `worsened_symptoms_education` enum('Yes','No') DEFAULT 'No',
  `device_therapy_education` enum('Yes','No') DEFAULT 'No',
  `education_other` enum('Yes','No') DEFAULT 'No',
  `education_other_details` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_education_id`),
  KEY `fk_hf_patient_education` (`hf_id`),
  CONSTRAINT `fk_hf_patient_education` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_patient_education`
--

LOCK TABLES `hf_patient_education` WRITE;
/*!40000 ALTER TABLE `hf_patient_education` DISABLE KEYS */;
INSERT INTO `hf_patient_education` VALUES (1,1,'No','No','No','No','Yes','No','No','No','No','No',NULL,'2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,'No','No','No','No','No','No','No','No','No','No',NULL,'2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,'Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','hello','2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,'Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','Yes','5:9','2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,'No','No','No','No','No','No','No','No','No','No',NULL,'2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,'No','No','No','No','No','No','No','No','No','No',NULL,'2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,'No','No','No','No','No','No','No','No','No','No',NULL,'2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,'No','No','No','No','No','No','No','No','No','No',NULL,'2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,'No','No','No','No','No','No','No','No','No','No',NULL,'2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,'No','No','No','No','No','No','No','No','No','No',NULL,'2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,'No','No','No','No','No','No','No','No','No','No',NULL,'2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,'No','No','No','No','No','No','No','No','No','No',NULL,'2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,'Yes','No','Yes','No','No','Yes','No','No','No','Yes','Final Clinical Notes / Summary','2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,'No','No','No','No','No','No','No','No','No','Yes','mnm','2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_patient_education` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_recommendations`
--

DROP TABLE IF EXISTS `hf_recommendations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_recommendations` (
  `recommendation_id` int NOT NULL AUTO_INCREMENT,
  `hf_id` int NOT NULL,
  `fluid_and_diet` enum('Yes','No') DEFAULT 'No',
  `fluid_and_diet_details` text,
  `exercise` enum('Yes','No') DEFAULT 'No',
  `exercise_details` text,
  `yoga` enum('Yes','No') DEFAULT 'No',
  `yoga_details` text,
  `smoking_cessation` enum('Yes','No') DEFAULT 'No',
  `smoking_cessation_details` text,
  `stress_management` enum('Yes','No') DEFAULT 'No',
  `stress_management_details` text,
  `drugs` enum('Yes','No') DEFAULT 'No',
  `drugs_details` text,
  `investigations` enum('Yes','No') DEFAULT 'No',
  `investigations_details` text,
  `procedures` enum('Yes','No') DEFAULT 'No',
  `procedures_details` text,
  `other_recommendation` enum('Yes','No') DEFAULT 'No',
  `other_recommendation_details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`recommendation_id`),
  KEY `fk_hf_recommendations` (`hf_id`),
  CONSTRAINT `fk_hf_recommendations` FOREIGN KEY (`hf_id`) REFERENCES `hf_registry` (`hf_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_recommendations`
--

LOCK TABLES `hf_recommendations` WRITE;
/*!40000 ALTER TABLE `hf_recommendations` DISABLE KEYS */;
INSERT INTO `hf_recommendations` VALUES (1,1,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-18 17:56:04','2026-07-18 17:56:04'),(2,2,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-18 18:00:42','2026-07-18 18:00:42'),(3,3,'Yes','hello','Yes',NULL,'Yes','hello','Yes',NULL,'Yes',NULL,'Yes','hello','Yes',NULL,'Yes',NULL,'Yes',NULL,'2026-07-19 11:39:04','2026-07-19 11:39:04'),(4,4,'Yes','5:9','Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes',NULL,'Yes','5:9','Yes',NULL,'Yes',NULL,'Yes','5:9','2026-07-19 12:57:17','2026-07-19 12:57:17'),(5,6,'Yes','hello','Yes',NULL,'Yes',NULL,'Yes','hello','Yes','hello','Yes','hello','Yes',NULL,'Yes',NULL,'Yes','hello','2026-07-20 02:22:41','2026-07-20 02:22:41'),(6,7,'Yes',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-20 03:32:52','2026-07-20 03:32:52'),(7,8,'No',NULL,'Yes',NULL,'No',NULL,'Yes','oogo','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-20 03:34:30','2026-07-20 03:34:30'),(8,9,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-20 04:05:33','2026-07-20 04:05:33'),(9,10,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-20 04:08:52','2026-07-20 04:08:52'),(10,11,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-20 04:13:55','2026-07-20 04:13:55'),(11,12,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-20 04:23:59','2026-07-20 04:23:59'),(12,13,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-20 06:23:15','2026-07-20 06:23:15'),(13,14,'Yes','Final Clinical Notes / Summary\n','No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-20 06:49:20','2026-07-20 06:49:20'),(14,15,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'No',NULL,'2026-07-20 08:05:35','2026-07-20 08:05:35');
/*!40000 ALTER TABLE `hf_recommendations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hf_registry`
--

DROP TABLE IF EXISTS `hf_registry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hf_registry` (
  `hf_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `hf_registry_no` varchar(30) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('draft','final') DEFAULT NULL,
  PRIMARY KEY (`hf_id`),
  UNIQUE KEY `hf_registry_no` (`hf_registry_no`),
  KEY `fk_hf_patient` (`patient_id`),
  CONSTRAINT `fk_hf_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hf_registry`
--

LOCK TABLES `hf_registry` WRITE;
/*!40000 ALTER TABLE `hf_registry` DISABLE KEYS */;
INSERT INTO `hf_registry` VALUES (1,5,'HF00001','2026-07-18 17:56:04','2026-07-20 06:13:08','final'),(2,5,'HF00002','2026-07-18 18:00:42','2026-07-20 06:13:08','final'),(3,7,'HF00003','2026-07-19 11:39:04','2026-07-20 06:13:08','final'),(4,6,'HF00004','2026-07-19 12:57:17','2026-07-20 06:13:08','final'),(6,4,'HF00006','2026-07-20 02:22:41','2026-07-20 06:13:08','final'),(7,1,'HF00007','2026-07-20 03:32:52','2026-07-20 06:13:08','final'),(8,1,'HF00008','2026-07-20 03:34:30','2026-07-20 06:13:08','final'),(9,2,'HF00009','2026-07-20 04:05:33','2026-07-20 06:13:08','final'),(10,2,'HF00010','2026-07-20 04:08:52','2026-07-20 06:13:08','final'),(11,2,'HF00011','2026-07-20 04:13:55','2026-07-20 06:13:08','final'),(12,7,'HF00012','2026-07-20 04:23:59','2026-07-20 06:13:08','final'),(13,1,'HF00013','2026-07-20 06:23:15','2026-07-20 06:23:15','draft'),(14,3,'HF00014','2026-07-20 06:49:20','2026-07-20 06:49:20',NULL),(15,5,'HF00015','2026-07-20 08:05:35','2026-07-20 08:05:35',NULL);
/*!40000 ALTER TABLE `hf_registry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nstemi_administrative`
--

DROP TABLE IF EXISTS `nstemi_administrative`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nstemi_administrative` (
  `administrative_id` int NOT NULL AUTO_INCREMENT,
  `nstemi_id` int NOT NULL,
  `hypertension` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `diabetes` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `smoking` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `renal_failure` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `copd` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `cva` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `prior_acs` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `prior_ptca` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `prior_cabg` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `other_background` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`administrative_id`),
  KEY `fk_nstemi_administrative` (`nstemi_id`),
  CONSTRAINT `fk_nstemi_administrative` FOREIGN KEY (`nstemi_id`) REFERENCES `nstemi_registry` (`nstemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nstemi_administrative`
--

LOCK TABLES `nstemi_administrative` WRITE;
/*!40000 ALTER TABLE `nstemi_administrative` DISABLE KEYS */;
/*!40000 ALTER TABLE `nstemi_administrative` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nstemi_appropriateness`
--

DROP TABLE IF EXISTS `nstemi_appropriateness`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nstemi_appropriateness` (
  `appropriateness_id` int NOT NULL AUTO_INCREMENT,
  `nstemi_id` int NOT NULL,
  `iccu_admission` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `iccu_transfer_out` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `thrombolysis_indication` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `ptca_indication` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `invasive_monitoring` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `iabp_indication` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `invasive_ventilation` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `dialysis_indication` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `other_procedure_name` varchar(100) DEFAULT NULL,
  `other_procedure_appropriateness` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `cardiac_enzymes` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `bnp` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `crp` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `lipid_profile` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `bedside_echo` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `chest_xray` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `beta_blockers` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `aspirin` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `clopidogrel` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `ace_inhibitor` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `arb` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `statin` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `diuretic` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `lanoxin` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `anticoagulant` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `amiodarone` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `other_drug_name` varchar(100) DEFAULT NULL,
  `other_drug_appropriateness` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`appropriateness_id`),
  KEY `fk_nstemi_appropriateness` (`nstemi_id`),
  CONSTRAINT `fk_nstemi_appropriateness` FOREIGN KEY (`nstemi_id`) REFERENCES `nstemi_registry` (`nstemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nstemi_appropriateness`
--

LOCK TABLES `nstemi_appropriateness` WRITE;
/*!40000 ALTER TABLE `nstemi_appropriateness` DISABLE KEYS */;
/*!40000 ALTER TABLE `nstemi_appropriateness` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nstemi_clinical_assessment`
--

DROP TABLE IF EXISTS `nstemi_clinical_assessment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nstemi_clinical_assessment` (
  `clinical_assessment_id` int NOT NULL AUTO_INCREMENT,
  `nstemi_id` int NOT NULL,
  `typical_angina` enum('Yes','No') DEFAULT 'No',
  `atypical_chest_pain` enum('Yes','No') DEFAULT 'No',
  `breathlessness` enum('Yes','No') DEFAULT 'No',
  `syncope_presyncope` enum('Yes','No') DEFAULT 'No',
  `pulse_rate` smallint unsigned DEFAULT NULL,
  `systolic_bp` smallint unsigned DEFAULT NULL,
  `diastolic_bp` smallint unsigned DEFAULT NULL,
  `age_gt_75` enum('Yes','No') DEFAULT 'No',
  `age_65_to_74` enum('Yes','No') DEFAULT 'No',
  `history_dm_htn_angina` enum('Yes','No') DEFAULT 'No',
  `sbp_lt_100` enum('Yes','No') DEFAULT 'No',
  `heart_rate_gt_100` enum('Yes','No') DEFAULT 'No',
  `killip_class_ii_to_iv` enum('Yes','No') DEFAULT 'No',
  `anterior_mi_or_lbbb` enum('Yes','No') DEFAULT 'No',
  `weight_lt_67kg` enum('Yes','No') DEFAULT 'No',
  `reperfusion_gt_4hrs` enum('Yes','No') DEFAULT 'No',
  `chd_risk_factors_ge_3` enum('Yes','No') DEFAULT 'No',
  `prior_coronary_stenosis_gt_50` enum('Yes','No') DEFAULT 'No',
  `st_deviation_at_admission` enum('Yes','No') DEFAULT 'No',
  `anginal_episodes_ge_2_last_24hrs` enum('Yes','No') DEFAULT 'No',
  `elevated_serum_cardiac_markers` enum('Yes','No') DEFAULT 'No',
  `timi_total_score` tinyint unsigned DEFAULT NULL,
  `lvf` enum('Yes','No') DEFAULT 'No',
  `vt_vf` enum('Yes','No') DEFAULT 'No',
  `bbb_chb` enum('Yes','No') DEFAULT 'No',
  `elevated_bnp` enum('Yes','No') DEFAULT 'No',
  `elevated_crp` enum('Yes','No') DEFAULT 'No',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`clinical_assessment_id`),
  KEY `fk_nstemi_clinical_assessment` (`nstemi_id`),
  CONSTRAINT `fk_nstemi_clinical_assessment` FOREIGN KEY (`nstemi_id`) REFERENCES `nstemi_registry` (`nstemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nstemi_clinical_assessment`
--

LOCK TABLES `nstemi_clinical_assessment` WRITE;
/*!40000 ALTER TABLE `nstemi_clinical_assessment` DISABLE KEYS */;
/*!40000 ALTER TABLE `nstemi_clinical_assessment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nstemi_diagnostics`
--

DROP TABLE IF EXISTS `nstemi_diagnostics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nstemi_diagnostics` (
  `diagnostic_id` int NOT NULL AUTO_INCREMENT,
  `nstemi_id` int NOT NULL,
  `bedside_echo` enum('Yes','No') DEFAULT 'No',
  `departmental_echo` enum('Yes','No') DEFAULT 'No',
  `stress_testing` enum('Yes','No') DEFAULT 'No',
  `lipid_profile` enum('Yes','No') DEFAULT 'No',
  `bnp` enum('Yes','No') DEFAULT 'No',
  `crp` enum('Yes','No') DEFAULT 'No',
  `troponin_test` enum('Yes','No') DEFAULT 'No',
  `cpk_ckmb` enum('Yes','No') DEFAULT 'No',
  `rft` enum('Yes','No') DEFAULT 'No',
  `lft` enum('Yes','No') DEFAULT 'No',
  `electrolytes` enum('Yes','No') DEFAULT 'No',
  `hemogram` enum('Yes','No') DEFAULT 'No',
  `cxr` enum('Yes','No') DEFAULT 'No',
  `diagnostic_other` varchar(255) DEFAULT NULL,
  `ecg_heart_rate` smallint unsigned DEFAULT NULL,
  `av_block_none` enum('Yes','No') DEFAULT 'No',
  `av_block_first_degree` enum('Yes','No') DEFAULT 'No',
  `av_block_second_degree` enum('Yes','No') DEFAULT 'No',
  `av_block_chb` enum('Yes','No') DEFAULT 'No',
  `bbb_none` enum('Yes','No') DEFAULT 'No',
  `bbb_rbbb` enum('Yes','No') DEFAULT 'No',
  `bbb_lbbb` enum('Yes','No') DEFAULT 'No',
  `bbb_indeterminate` enum('Yes','No') DEFAULT 'No',
  `qwaves_none` enum('Yes','No') DEFAULT 'No',
  `qwaves_inferior` enum('Yes','No') DEFAULT 'No',
  `qwaves_anteroseptal` enum('Yes','No') DEFAULT 'No',
  `qwaves_anterior` enum('Yes','No') DEFAULT 'No',
  `qwaves_anterolateral` enum('Yes','No') DEFAULT 'No',
  `qwaves_lateral` enum('Yes','No') DEFAULT 'No',
  `st_depression_none` enum('Yes','No') DEFAULT 'No',
  `st_depression_inferior` enum('Yes','No') DEFAULT 'No',
  `st_depression_anteroseptal` enum('Yes','No') DEFAULT 'No',
  `st_depression_anterior` enum('Yes','No') DEFAULT 'No',
  `st_depression_anterolateral` enum('Yes','No') DEFAULT 'No',
  `st_depression_lateral` enum('Yes','No') DEFAULT 'No',
  `t_inversion_none` enum('Yes','No') DEFAULT 'No',
  `t_inversion_inferior` enum('Yes','No') DEFAULT 'No',
  `t_inversion_anteroseptal` enum('Yes','No') DEFAULT 'No',
  `t_inversion_anterior` enum('Yes','No') DEFAULT 'No',
  `t_inversion_anterolateral` enum('Yes','No') DEFAULT 'No',
  `t_inversion_lateral` enum('Yes','No') DEFAULT 'No',
  `rhythm_nsr` enum('Yes','No') DEFAULT 'No',
  `rhythm_af` enum('Yes','No') DEFAULT 'No',
  `rhythm_svt` enum('Yes','No') DEFAULT 'No',
  `rhythm_vt` enum('Yes','No') DEFAULT 'No',
  `rhythm_vf` enum('Yes','No') DEFAULT 'No',
  `ecg_other` text,
  `echo_ef` decimal(5,2) DEFAULT NULL,
  `lv_function_normal` enum('Yes','No') DEFAULT 'No',
  `lv_function_mild_lvd` enum('Yes','No') DEFAULT 'No',
  `lv_function_moderate_lvd` enum('Yes','No') DEFAULT 'No',
  `lv_function_severe_lvd` enum('Yes','No') DEFAULT 'No',
  `rwma_lad` enum('Yes','No') DEFAULT 'No',
  `rwma_rca` enum('Yes','No') DEFAULT 'No',
  `rwma_lcx` enum('Yes','No') DEFAULT 'No',
  `mr_none` enum('Yes','No') DEFAULT 'No',
  `mr_mild` enum('Yes','No') DEFAULT 'No',
  `mr_moderate` enum('Yes','No') DEFAULT 'No',
  `mr_severe` enum('Yes','No') DEFAULT 'No',
  `echo_e` decimal(6,2) DEFAULT NULL,
  `echo_a` decimal(6,2) DEFAULT NULL,
  `echo_dt` decimal(6,2) DEFAULT NULL,
  `echo_e_prime` decimal(6,2) DEFAULT NULL,
  `echo_tapsv` decimal(6,2) DEFAULT NULL,
  `echo_other` text,
  `hemoglobin` decimal(5,2) DEFAULT NULL,
  `creatinine` decimal(6,2) DEFAULT NULL,
  `troponin_i` varchar(50) DEFAULT NULL,
  `cpk` varchar(50) DEFAULT NULL,
  `ck_mb` varchar(50) DEFAULT NULL,
  `sodium` decimal(5,2) DEFAULT NULL,
  `potassium` decimal(5,2) DEFAULT NULL,
  `rbs_admission` decimal(6,2) DEFAULT NULL,
  `angiogram_done` enum('Yes','No') DEFAULT 'No',
  `angiogram_normal` enum('Yes','No') DEFAULT 'No',
  `angiogram_1vd` enum('Yes','No') DEFAULT 'No',
  `angiogram_2vd` enum('Yes','No') DEFAULT 'No',
  `angiogram_3vd` enum('Yes','No') DEFAULT 'No',
  `angiogram_lmca` enum('Yes','No') DEFAULT 'No',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`diagnostic_id`),
  KEY `fk_nstemi_diagnostics` (`nstemi_id`),
  CONSTRAINT `fk_nstemi_diagnostics` FOREIGN KEY (`nstemi_id`) REFERENCES `nstemi_registry` (`nstemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nstemi_diagnostics`
--

LOCK TABLES `nstemi_diagnostics` WRITE;
/*!40000 ALTER TABLE `nstemi_diagnostics` DISABLE KEYS */;
/*!40000 ALTER TABLE `nstemi_diagnostics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nstemi_followup`
--

DROP TABLE IF EXISTS `nstemi_followup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nstemi_followup` (
  `followup_id` int NOT NULL AUTO_INCREMENT,
  `nstemi_id` int NOT NULL,
  `followup_month` enum('1 Month','3 Months','6 Months','12 Months') NOT NULL,
  `followup_date` date DEFAULT NULL,
  `angina` varchar(100) DEFAULT NULL,
  `functional_class` varchar(50) DEFAULT NULL,
  `number_of_antianginals` smallint unsigned DEFAULT NULL,
  `dual_antiplatelets` enum('Yes','No') DEFAULT 'No',
  `statins` enum('Yes','No') DEFAULT 'No',
  `beta_blocker` enum('Yes','No') DEFAULT 'No',
  `acei_arb` enum('Yes','No') DEFAULT 'No',
  `aldosterone_antagonist` enum('Yes','No') DEFAULT 'No',
  `acs_hospitalization` enum('Yes','No') DEFAULT 'No',
  `ptca` enum('Yes','No') DEFAULT 'No',
  `cabg` enum('Yes','No') DEFAULT 'No',
  `death` enum('Yes','No') DEFAULT 'No',
  `other_event` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`followup_id`),
  UNIQUE KEY `uq_nstemi_followup` (`nstemi_id`,`followup_month`),
  CONSTRAINT `fk_nstemi_followup` FOREIGN KEY (`nstemi_id`) REFERENCES `nstemi_registry` (`nstemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nstemi_followup`
--

LOCK TABLES `nstemi_followup` WRITE;
/*!40000 ALTER TABLE `nstemi_followup` DISABLE KEYS */;
/*!40000 ALTER TABLE `nstemi_followup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nstemi_hospitalization`
--

DROP TABLE IF EXISTS `nstemi_hospitalization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nstemi_hospitalization` (
  `hospitalization_id` int NOT NULL AUTO_INCREMENT,
  `nstemi_id` int NOT NULL,
  `iccu_hours` decimal(6,2) DEFAULT NULL,
  `stepdown_icu_hours` decimal(6,2) DEFAULT NULL,
  `floor_days` decimal(6,2) DEFAULT NULL,
  `total_hospital_stay_days` decimal(6,2) DEFAULT NULL,
  `bed_charges` decimal(12,2) DEFAULT NULL,
  `drugs_disposables_cost` decimal(12,2) DEFAULT NULL,
  `package_cost` decimal(12,2) DEFAULT NULL,
  `laboratory_cost` decimal(12,2) DEFAULT NULL,
  `non_invasive_lab_cost` decimal(12,2) DEFAULT NULL,
  `consultation_cost` decimal(12,2) DEFAULT NULL,
  `radiology_cost` decimal(12,2) DEFAULT NULL,
  `miscellaneous_cost` decimal(12,2) DEFAULT NULL,
  `total_cost` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`hospitalization_id`),
  KEY `fk_nstemi_hospitalization` (`nstemi_id`),
  CONSTRAINT `fk_nstemi_hospitalization` FOREIGN KEY (`nstemi_id`) REFERENCES `nstemi_registry` (`nstemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nstemi_hospitalization`
--

LOCK TABLES `nstemi_hospitalization` WRITE;
/*!40000 ALTER TABLE `nstemi_hospitalization` DISABLE KEYS */;
/*!40000 ALTER TABLE `nstemi_hospitalization` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nstemi_outcomes`
--

DROP TABLE IF EXISTS `nstemi_outcomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nstemi_outcomes` (
  `outcome_id` int NOT NULL AUTO_INCREMENT,
  `nstemi_id` int NOT NULL,
  `death` enum('Yes','No') DEFAULT 'No',
  `stemi_for_nonstemi` enum('Yes','No') DEFAULT 'No',
  `remi_for_nstemi` enum('Yes','No') DEFAULT 'No',
  `revascularization_recurrent_ischemia` enum('Yes','No') DEFAULT 'No',
  `cva_thrombotic` enum('Yes','No') DEFAULT 'No',
  `cva_hemorrhagic` enum('Yes','No') DEFAULT 'No',
  `major_bleeding` enum('Yes','No') DEFAULT 'No',
  `outcome_other` varchar(255) DEFAULT NULL,
  `beta_blocker` enum('Yes','No') DEFAULT 'No',
  `calcium_channel_blocker` enum('Yes','No') DEFAULT 'No',
  `nitrate` enum('Yes','No') DEFAULT 'No',
  `nicorandil` enum('Yes','No') DEFAULT 'No',
  `ivabradine` enum('Yes','No') DEFAULT 'No',
  `ranolazine` enum('Yes','No') DEFAULT 'No',
  `trimetazidine` enum('Yes','No') DEFAULT 'No',
  `aspirin` enum('Yes','No') DEFAULT 'No',
  `clopidogrel` enum('Yes','No') DEFAULT 'No',
  `prasugrel` enum('Yes','No') DEFAULT 'No',
  `ticagrelor` enum('Yes','No') DEFAULT 'No',
  `statin` enum('Yes','No') DEFAULT 'No',
  `statin_10mg` enum('Yes','No') DEFAULT 'No',
  `statin_20mg` enum('Yes','No') DEFAULT 'No',
  `statin_40mg` enum('Yes','No') DEFAULT 'No',
  `statin_80mg` enum('Yes','No') DEFAULT 'No',
  `discharge_other_medication` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`outcome_id`),
  KEY `fk_nstemi_outcomes` (`nstemi_id`),
  CONSTRAINT `fk_nstemi_outcomes` FOREIGN KEY (`nstemi_id`) REFERENCES `nstemi_registry` (`nstemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nstemi_outcomes`
--

LOCK TABLES `nstemi_outcomes` WRITE;
/*!40000 ALTER TABLE `nstemi_outcomes` DISABLE KEYS */;
/*!40000 ALTER TABLE `nstemi_outcomes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nstemi_registry`
--

DROP TABLE IF EXISTS `nstemi_registry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nstemi_registry` (
  `nstemi_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `acs_no` varchar(30) NOT NULL,
  `ip_no` varchar(30) DEFAULT NULL,
  `admission_date` date NOT NULL,
  `discharge_date` date DEFAULT NULL,
  `primary_consultant` varchar(150) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`nstemi_id`),
  UNIQUE KEY `acs_no` (`acs_no`),
  KEY `fk_nstemi_patient` (`patient_id`),
  CONSTRAINT `fk_nstemi_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nstemi_registry`
--

LOCK TABLES `nstemi_registry` WRITE;
/*!40000 ALTER TABLE `nstemi_registry` DISABLE KEYS */;
/*!40000 ALTER TABLE `nstemi_registry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nstemi_treatment_strategy`
--

DROP TABLE IF EXISTS `nstemi_treatment_strategy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nstemi_treatment_strategy` (
  `treatment_id` int NOT NULL AUTO_INCREMENT,
  `nstemi_id` int NOT NULL,
  `pami` enum('Yes','No') DEFAULT 'No',
  `thrombolysis` enum('Yes','No') DEFAULT 'No',
  `conservative` enum('Yes','No') DEFAULT 'No',
  `door_to_balloon_time` smallint unsigned DEFAULT NULL,
  `vessel_lmca` enum('Yes','No') DEFAULT 'No',
  `vessel_lad` enum('Yes','No') DEFAULT 'No',
  `vessel_diagonal` enum('Yes','No') DEFAULT 'No',
  `vessel_lcx` enum('Yes','No') DEFAULT 'No',
  `vessel_ramus` enum('Yes','No') DEFAULT 'No',
  `vessel_om` enum('Yes','No') DEFAULT 'No',
  `vessel_rca` enum('Yes','No') DEFAULT 'No',
  `vessel_pda` enum('Yes','No') DEFAULT 'No',
  `vessel_segment` varchar(100) DEFAULT NULL,
  `thrombosuction_done` enum('Yes','No') DEFAULT 'No',
  `thrombosuction_not_done` enum('Yes','No') DEFAULT 'No',
  `stent_bms` enum('Yes','No') DEFAULT 'No',
  `stent_des` enum('Yes','No') DEFAULT 'No',
  `stent_diameter` decimal(5,2) DEFAULT NULL,
  `stent_length` decimal(5,2) DEFAULT NULL,
  `procedural_success` enum('Yes','No') DEFAULT 'No',
  `timi_flow` tinyint DEFAULT NULL,
  `complication_none` enum('Yes','No') DEFAULT 'No',
  `complication_tamponade` enum('Yes','No') DEFAULT 'No',
  `complication_major_bleed` enum('Yes','No') DEFAULT 'No',
  `complication_stroke` enum('Yes','No') DEFAULT 'No',
  `complication_stent_thrombosis` enum('Yes','No') DEFAULT 'No',
  `complication_mi` enum('Yes','No') DEFAULT 'No',
  `complication_death` enum('Yes','No') DEFAULT 'No',
  `complication_emergency_cabg` enum('Yes','No') DEFAULT 'No',
  `door_to_needle_time` smallint unsigned DEFAULT NULL,
  `drug_stk` enum('Yes','No') DEFAULT 'No',
  `drug_uk` enum('Yes','No') DEFAULT 'No',
  `drug_reteplase` enum('Yes','No') DEFAULT 'No',
  `drug_tenecteplase` enum('Yes','No') DEFAULT 'No',
  `thrombolysis_dose` varchar(100) DEFAULT NULL,
  `beta_blocker` enum('Yes','No') DEFAULT 'No',
  `calcium_channel_blocker` enum('Yes','No') DEFAULT 'No',
  `nitrate` enum('Yes','No') DEFAULT 'No',
  `nicorandil` enum('Yes','No') DEFAULT 'No',
  `ivabradine` enum('Yes','No') DEFAULT 'No',
  `ranolazine` enum('Yes','No') DEFAULT 'No',
  `trimetazidine` enum('Yes','No') DEFAULT 'No',
  `aspirin` enum('Yes','No') DEFAULT 'No',
  `clopidogrel` enum('Yes','No') DEFAULT 'No',
  `prasugrel` enum('Yes','No') DEFAULT 'No',
  `ticagrelor` enum('Yes','No') DEFAULT 'No',
  `heparin_ufh_iv` enum('Yes','No') DEFAULT 'No',
  `heparin_ufh_sc` enum('Yes','No') DEFAULT 'No',
  `heparin_lmwh` enum('Yes','No') DEFAULT 'No',
  `heparin_ufh_iv_sc` enum('Yes','No') DEFAULT 'No',
  `heparin_ufh_iv_lmwh` enum('Yes','No') DEFAULT 'No',
  `gp2b3a` enum('Yes','No') DEFAULT 'No',
  `bivaluridin` enum('Yes','No') DEFAULT 'No',
  `statin` enum('Yes','No') DEFAULT 'No',
  `statin_10mg` enum('Yes','No') DEFAULT 'No',
  `statin_20mg` enum('Yes','No') DEFAULT 'No',
  `statin_40mg` enum('Yes','No') DEFAULT 'No',
  `statin_80mg` enum('Yes','No') DEFAULT 'No',
  `other_drugs` varchar(255) DEFAULT NULL,
  `cag` enum('Yes','No') DEFAULT 'No',
  `iabp` enum('Yes','No') DEFAULT 'No',
  `invasive_ventilation` enum('Yes','No') DEFAULT 'No',
  `ptca` enum('Yes','No') DEFAULT 'No',
  `cabg` enum('Yes','No') DEFAULT 'No',
  `other_procedure` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`treatment_id`),
  KEY `fk_nstemi_treatment` (`nstemi_id`),
  CONSTRAINT `fk_nstemi_treatment` FOREIGN KEY (`nstemi_id`) REFERENCES `nstemi_registry` (`nstemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nstemi_treatment_strategy`
--

LOCK TABLES `nstemi_treatment_strategy` WRITE;
/*!40000 ALTER TABLE `nstemi_treatment_strategy` DISABLE KEYS */;
/*!40000 ALTER TABLE `nstemi_treatment_strategy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `patient_id` int NOT NULL AUTO_INCREMENT,
  `mr_no` varchar(10) DEFAULT NULL,
  `ip_no` varchar(10) DEFAULT NULL,
  `patient_name` varchar(150) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown') DEFAULT 'Unknown',
  `insurance_mode` enum('Direct Cash / Self-Pay','Private Insurance','Government Reimbursement','Arogyasree Scheme','Unknown') DEFAULT 'Unknown',
  `phone_no` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `hypertension` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `smoking` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `diabetes` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `diabetes_control_type` enum('None (Uncontrolled)','Dietary Control Only','Oral Hypoglycemics (OHA)','Insulin Therapy','Unknown') DEFAULT 'Unknown',
  `renal_failure` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `active_dialysis_status` enum('Under Dialysis','No Dialysis','Unknown') DEFAULT 'Unknown',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `address` varchar(500) DEFAULT NULL,
  `higher_education` enum('Primary','Secondary','Graduate','Post Graduate','None') DEFAULT NULL,
  `occupation` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`patient_id`),
  UNIQUE KEY `mr_no` (`mr_no`),
  UNIQUE KEY `ip_no` (`ip_no`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (1,'MR00001','IP00001','Varshitha','2004-01-15','Female','O+','Private Insurance','9876543210','varshitha@gmail.com','No','No','No','Unknown','No','Unknown','2026-07-15 08:32:06','2026-07-15 08:32:06',NULL,NULL,NULL),(2,'MR00002','IP00002','Rao Ramesh Verma','1967-10-22','Male','AB-','Government Reimbursement','9898987878','','Yes','Yes','No','Unknown','Yes','Unknown','2026-07-15 10:04:11','2026-07-15 10:04:12',NULL,NULL,NULL),(3,'MR00003','IP00003','Test Patient Agent','1990-05-15','Male','O+','Direct Cash / Self-Pay','9876543210','test@example.com','No','No','Yes','Oral Hypoglycemics (OHA)','Yes','Under Dialysis','2026-07-16 04:24:19','2026-07-16 04:24:19',NULL,NULL,NULL),(4,'MR00004','IP00004','test','1985-10-29','Male','B-','Arogyasree Scheme','7657657342',NULL,'Yes','Yes','Yes','Oral Hypoglycemics (OHA)','Yes','Under Dialysis','2026-07-16 04:40:43','2026-07-16 04:40:43',NULL,NULL,NULL),(5,'MR00005','IP00005','Chandhra Kumar','1975-12-27','Male','O+','Private Insurance','7678789873',NULL,'Yes','Yes','Yes','Insulin Therapy','Yes','Under Dialysis','2026-07-17 05:48:08','2026-07-17 05:48:08',NULL,NULL,NULL),(6,'MR00006','IP00006','test 2','1977-09-14','Female','B-','Arogyasree Scheme','9879879876',NULL,'Yes','Yes','Yes','Oral Hypoglycemics (OHA)','Yes','No Dialysis','2026-07-17 09:02:38','2026-07-17 09:02:38',NULL,NULL,NULL),(7,'MR00007','IP00007','test 3','1970-10-30','Male','A-','Private Insurance','9958769873',NULL,'Yes','Yes','No','Unknown','Yes','Under Dialysis','2026-07-18 18:07:15','2026-07-18 18:07:16',NULL,NULL,NULL),(8,'MR00008','IP00008','test patient1','1968-11-19','Male','AB+','Government Reimbursement','7654563451',NULL,'Yes','Yes','Yes','Oral Hypoglycemics (OHA)','Yes','Under Dialysis','2026-07-20 08:34:30','2026-07-20 08:34:30',NULL,NULL,NULL);
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stemi_administrative`
--

DROP TABLE IF EXISTS `stemi_administrative`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stemi_administrative` (
  `administrative_id` int NOT NULL AUTO_INCREMENT,
  `stemi_id` int NOT NULL,
  `hypertension` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `diabetes` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `smoking` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `renal_failure` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `copd` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `cva` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `prior_acs` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `prior_ptca` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `prior_cabg` enum('Yes','No','Unknown') DEFAULT 'Unknown',
  `other_background` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`administrative_id`),
  KEY `fk_stemi_administrative` (`stemi_id`),
  CONSTRAINT `fk_stemi_administrative` FOREIGN KEY (`stemi_id`) REFERENCES `stemi_registry` (`stemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stemi_administrative`
--

LOCK TABLES `stemi_administrative` WRITE;
/*!40000 ALTER TABLE `stemi_administrative` DISABLE KEYS */;
/*!40000 ALTER TABLE `stemi_administrative` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stemi_appropriateness`
--

DROP TABLE IF EXISTS `stemi_appropriateness`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stemi_appropriateness` (
  `appropriateness_id` int NOT NULL AUTO_INCREMENT,
  `stemi_id` int NOT NULL,
  `iccu_admission` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `iccu_transfer_out` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `thrombolysis_indication` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `ptca_indication` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `invasive_monitoring` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `iabp_indication` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `invasive_ventilation` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `dialysis_indication` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `other_procedure_name` varchar(100) DEFAULT NULL,
  `other_procedure_appropriateness` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `cardiac_enzymes` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `bnp` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `crp` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `lipid_profile` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `bedside_echo` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `chest_xray` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `beta_blockers` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `aspirin` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `clopidogrel` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `ace_inhibitor` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `arb` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `statin` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `diuretic` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `lanoxin` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `anticoagulant` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `amiodarone` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `other_drug_name` varchar(100) DEFAULT NULL,
  `other_drug_appropriateness` enum('Appropriate','Inappropriate','Not Applicable') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`appropriateness_id`),
  KEY `fk_stemi_appropriateness` (`stemi_id`),
  CONSTRAINT `fk_stemi_appropriateness` FOREIGN KEY (`stemi_id`) REFERENCES `stemi_registry` (`stemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stemi_appropriateness`
--

LOCK TABLES `stemi_appropriateness` WRITE;
/*!40000 ALTER TABLE `stemi_appropriateness` DISABLE KEYS */;
/*!40000 ALTER TABLE `stemi_appropriateness` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stemi_clinical_assessment`
--

DROP TABLE IF EXISTS `stemi_clinical_assessment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stemi_clinical_assessment` (
  `clinical_assessment_id` int NOT NULL AUTO_INCREMENT,
  `stemi_id` int NOT NULL,
  `typical_angina` enum('Yes','No') DEFAULT 'No',
  `atypical_chest_pain` enum('Yes','No') DEFAULT 'No',
  `breathlessness` enum('Yes','No') DEFAULT 'No',
  `syncope_presyncope` enum('Yes','No') DEFAULT 'No',
  `pulse_rate` smallint unsigned DEFAULT NULL,
  `systolic_bp` smallint unsigned DEFAULT NULL,
  `diastolic_bp` smallint unsigned DEFAULT NULL,
  `age_gt_75` enum('Yes','No') DEFAULT 'No',
  `age_65_to_74` enum('Yes','No') DEFAULT 'No',
  `history_dm_htn_angina` enum('Yes','No') DEFAULT 'No',
  `sbp_lt_100` enum('Yes','No') DEFAULT 'No',
  `heart_rate_gt_100` enum('Yes','No') DEFAULT 'No',
  `killip_class_ii_to_iv` enum('Yes','No') DEFAULT 'No',
  `anterior_mi_or_lbbb` enum('Yes','No') DEFAULT 'No',
  `weight_lt_67kg` enum('Yes','No') DEFAULT 'No',
  `reperfusion_gt_4hrs` enum('Yes','No') DEFAULT 'No',
  `timi_total_score` tinyint unsigned DEFAULT NULL,
  `lvf` enum('Yes','No') DEFAULT 'No',
  `vt_vf` enum('Yes','No') DEFAULT 'No',
  `bbb_chb` enum('Yes','No') DEFAULT 'No',
  `elevated_bnp` enum('Yes','No') DEFAULT 'No',
  `elevated_crp` enum('Yes','No') DEFAULT 'No',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`clinical_assessment_id`),
  KEY `fk_stemi_clinical_assessment` (`stemi_id`),
  CONSTRAINT `fk_stemi_clinical_assessment` FOREIGN KEY (`stemi_id`) REFERENCES `stemi_registry` (`stemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stemi_clinical_assessment`
--

LOCK TABLES `stemi_clinical_assessment` WRITE;
/*!40000 ALTER TABLE `stemi_clinical_assessment` DISABLE KEYS */;
/*!40000 ALTER TABLE `stemi_clinical_assessment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stemi_diagnostics`
--

DROP TABLE IF EXISTS `stemi_diagnostics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stemi_diagnostics` (
  `diagnostic_id` int NOT NULL AUTO_INCREMENT,
  `stemi_id` int NOT NULL,
  `bedside_echo` enum('Yes','No') DEFAULT 'No',
  `departmental_echo` enum('Yes','No') DEFAULT 'No',
  `stress_testing` enum('Yes','No') DEFAULT 'No',
  `lipid_profile` enum('Yes','No') DEFAULT 'No',
  `bnp` enum('Yes','No') DEFAULT 'No',
  `crp` enum('Yes','No') DEFAULT 'No',
  `troponin_test` enum('Yes','No') DEFAULT 'No',
  `cpk_ckmb` enum('Yes','No') DEFAULT 'No',
  `rft` enum('Yes','No') DEFAULT 'No',
  `lft` enum('Yes','No') DEFAULT 'No',
  `electrolytes` enum('Yes','No') DEFAULT 'No',
  `hemogram` enum('Yes','No') DEFAULT 'No',
  `cxr` enum('Yes','No') DEFAULT 'No',
  `diagnostic_other` varchar(255) DEFAULT NULL,
  `ecg_heart_rate` smallint unsigned DEFAULT NULL,
  `av_block_none` enum('Yes','No') DEFAULT 'No',
  `av_block_first_degree` enum('Yes','No') DEFAULT 'No',
  `av_block_second_degree` enum('Yes','No') DEFAULT 'No',
  `av_block_chb` enum('Yes','No') DEFAULT 'No',
  `bbb_none` enum('Yes','No') DEFAULT 'No',
  `bbb_rbbb` enum('Yes','No') DEFAULT 'No',
  `bbb_lbbb` enum('Yes','No') DEFAULT 'No',
  `bbb_indeterminate` enum('Yes','No') DEFAULT 'No',
  `qwaves_none` enum('Yes','No') DEFAULT 'No',
  `qwaves_inferior` enum('Yes','No') DEFAULT 'No',
  `qwaves_anteroseptal` enum('Yes','No') DEFAULT 'No',
  `qwaves_anterior` enum('Yes','No') DEFAULT 'No',
  `qwaves_anterolateral` enum('Yes','No') DEFAULT 'No',
  `qwaves_lateral` enum('Yes','No') DEFAULT 'No',
  `st_depression_none` enum('Yes','No') DEFAULT 'No',
  `st_depression_inferior` enum('Yes','No') DEFAULT 'No',
  `st_depression_anteroseptal` enum('Yes','No') DEFAULT 'No',
  `st_depression_anterior` enum('Yes','No') DEFAULT 'No',
  `st_depression_anterolateral` enum('Yes','No') DEFAULT 'No',
  `st_depression_lateral` enum('Yes','No') DEFAULT 'No',
  `t_inversion_none` enum('Yes','No') DEFAULT 'No',
  `t_inversion_inferior` enum('Yes','No') DEFAULT 'No',
  `t_inversion_anteroseptal` enum('Yes','No') DEFAULT 'No',
  `t_inversion_anterior` enum('Yes','No') DEFAULT 'No',
  `t_inversion_anterolateral` enum('Yes','No') DEFAULT 'No',
  `t_inversion_lateral` enum('Yes','No') DEFAULT 'No',
  `rhythm_nsr` enum('Yes','No') DEFAULT 'No',
  `rhythm_af` enum('Yes','No') DEFAULT 'No',
  `rhythm_svt` enum('Yes','No') DEFAULT 'No',
  `rhythm_vt` enum('Yes','No') DEFAULT 'No',
  `rhythm_vf` enum('Yes','No') DEFAULT 'No',
  `ecg_other` text,
  `echo_ef` decimal(5,2) DEFAULT NULL,
  `lv_function_normal` enum('Yes','No') DEFAULT 'No',
  `lv_function_mild_lvd` enum('Yes','No') DEFAULT 'No',
  `lv_function_moderate_lvd` enum('Yes','No') DEFAULT 'No',
  `lv_function_severe_lvd` enum('Yes','No') DEFAULT 'No',
  `rwma_lad` enum('Yes','No') DEFAULT 'No',
  `rwma_rca` enum('Yes','No') DEFAULT 'No',
  `rwma_lcx` enum('Yes','No') DEFAULT 'No',
  `mr_none` enum('Yes','No') DEFAULT 'No',
  `mr_mild` enum('Yes','No') DEFAULT 'No',
  `mr_moderate` enum('Yes','No') DEFAULT 'No',
  `mr_severe` enum('Yes','No') DEFAULT 'No',
  `echo_e` decimal(6,2) DEFAULT NULL,
  `echo_a` decimal(6,2) DEFAULT NULL,
  `echo_dt` decimal(6,2) DEFAULT NULL,
  `echo_e_prime` decimal(6,2) DEFAULT NULL,
  `echo_tapsv` decimal(6,2) DEFAULT NULL,
  `echo_other` text,
  `hemoglobin` decimal(5,2) DEFAULT NULL,
  `creatinine` decimal(6,2) DEFAULT NULL,
  `troponin_i` varchar(50) DEFAULT NULL,
  `cpk` varchar(50) DEFAULT NULL,
  `ck_mb` varchar(50) DEFAULT NULL,
  `sodium` decimal(5,2) DEFAULT NULL,
  `potassium` decimal(5,2) DEFAULT NULL,
  `rbs_admission` decimal(6,2) DEFAULT NULL,
  `angiogram_done` enum('Yes','No') DEFAULT 'No',
  `angiogram_normal` enum('Yes','No') DEFAULT 'No',
  `angiogram_1vd` enum('Yes','No') DEFAULT 'No',
  `angiogram_2vd` enum('Yes','No') DEFAULT 'No',
  `angiogram_3vd` enum('Yes','No') DEFAULT 'No',
  `angiogram_lmca` enum('Yes','No') DEFAULT 'No',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`diagnostic_id`),
  KEY `fk_stemi_diagnostics` (`stemi_id`),
  CONSTRAINT `fk_stemi_diagnostics` FOREIGN KEY (`stemi_id`) REFERENCES `stemi_registry` (`stemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stemi_diagnostics`
--

LOCK TABLES `stemi_diagnostics` WRITE;
/*!40000 ALTER TABLE `stemi_diagnostics` DISABLE KEYS */;
/*!40000 ALTER TABLE `stemi_diagnostics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stemi_followup`
--

DROP TABLE IF EXISTS `stemi_followup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stemi_followup` (
  `followup_id` int NOT NULL AUTO_INCREMENT,
  `stemi_id` int NOT NULL,
  `followup_month` enum('1 Month','3 Months','6 Months','12 Months') NOT NULL,
  `followup_date` date DEFAULT NULL,
  `angina` varchar(100) DEFAULT NULL,
  `functional_class` varchar(50) DEFAULT NULL,
  `number_of_antianginals` smallint unsigned DEFAULT NULL,
  `dual_antiplatelets` enum('Yes','No') DEFAULT 'No',
  `statins` enum('Yes','No') DEFAULT 'No',
  `beta_blocker` enum('Yes','No') DEFAULT 'No',
  `acei_arb` enum('Yes','No') DEFAULT 'No',
  `aldosterone_antagonist` enum('Yes','No') DEFAULT 'No',
  `acs_hospitalization` enum('Yes','No') DEFAULT 'No',
  `ptca` enum('Yes','No') DEFAULT 'No',
  `cabg` enum('Yes','No') DEFAULT 'No',
  `death` enum('Yes','No') DEFAULT 'No',
  `other_event` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`followup_id`),
  UNIQUE KEY `uq_stemi_followup` (`stemi_id`,`followup_month`),
  CONSTRAINT `fk_stemi_followup` FOREIGN KEY (`stemi_id`) REFERENCES `stemi_registry` (`stemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stemi_followup`
--

LOCK TABLES `stemi_followup` WRITE;
/*!40000 ALTER TABLE `stemi_followup` DISABLE KEYS */;
/*!40000 ALTER TABLE `stemi_followup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stemi_hospitalization`
--

DROP TABLE IF EXISTS `stemi_hospitalization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stemi_hospitalization` (
  `hospitalization_id` int NOT NULL AUTO_INCREMENT,
  `stemi_id` int NOT NULL,
  `iccu_hours` decimal(6,2) DEFAULT NULL,
  `stepdown_icu_hours` decimal(6,2) DEFAULT NULL,
  `floor_days` decimal(6,2) DEFAULT NULL,
  `total_hospital_stay_days` decimal(6,2) DEFAULT NULL,
  `bed_charges` decimal(12,2) DEFAULT NULL,
  `drugs_disposables_cost` decimal(12,2) DEFAULT NULL,
  `package_cost` decimal(12,2) DEFAULT NULL,
  `laboratory_cost` decimal(12,2) DEFAULT NULL,
  `non_invasive_lab_cost` decimal(12,2) DEFAULT NULL,
  `consultation_cost` decimal(12,2) DEFAULT NULL,
  `radiology_cost` decimal(12,2) DEFAULT NULL,
  `miscellaneous_cost` decimal(12,2) DEFAULT NULL,
  `total_cost` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`hospitalization_id`),
  KEY `fk_stemi_hospitalization` (`stemi_id`),
  CONSTRAINT `fk_stemi_hospitalization` FOREIGN KEY (`stemi_id`) REFERENCES `stemi_registry` (`stemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stemi_hospitalization`
--

LOCK TABLES `stemi_hospitalization` WRITE;
/*!40000 ALTER TABLE `stemi_hospitalization` DISABLE KEYS */;
/*!40000 ALTER TABLE `stemi_hospitalization` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stemi_outcomes`
--

DROP TABLE IF EXISTS `stemi_outcomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stemi_outcomes` (
  `outcome_id` int NOT NULL AUTO_INCREMENT,
  `stemi_id` int NOT NULL,
  `death` enum('Yes','No') DEFAULT 'No',
  `stemi_for_nonstemi` enum('Yes','No') DEFAULT 'No',
  `remi_for_stemi` enum('Yes','No') DEFAULT 'No',
  `revascularization_recurrent_ischemia` enum('Yes','No') DEFAULT 'No',
  `cva_thrombotic` enum('Yes','No') DEFAULT 'No',
  `cva_hemorrhagic` enum('Yes','No') DEFAULT 'No',
  `major_bleeding` enum('Yes','No') DEFAULT 'No',
  `outcome_other` varchar(255) DEFAULT NULL,
  `beta_blocker` enum('Yes','No') DEFAULT 'No',
  `calcium_channel_blocker` enum('Yes','No') DEFAULT 'No',
  `nitrate` enum('Yes','No') DEFAULT 'No',
  `nicorandil` enum('Yes','No') DEFAULT 'No',
  `ivabradine` enum('Yes','No') DEFAULT 'No',
  `ranolazine` enum('Yes','No') DEFAULT 'No',
  `trimetazidine` enum('Yes','No') DEFAULT 'No',
  `aspirin` enum('Yes','No') DEFAULT 'No',
  `clopidogrel` enum('Yes','No') DEFAULT 'No',
  `prasugrel` enum('Yes','No') DEFAULT 'No',
  `ticagrelor` enum('Yes','No') DEFAULT 'No',
  `statin` enum('Yes','No') DEFAULT 'No',
  `statin_10mg` enum('Yes','No') DEFAULT 'No',
  `statin_20mg` enum('Yes','No') DEFAULT 'No',
  `statin_40mg` enum('Yes','No') DEFAULT 'No',
  `statin_80mg` enum('Yes','No') DEFAULT 'No',
  `discharge_other_medication` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`outcome_id`),
  KEY `fk_stemi_outcomes` (`stemi_id`),
  CONSTRAINT `fk_stemi_outcomes` FOREIGN KEY (`stemi_id`) REFERENCES `stemi_registry` (`stemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stemi_outcomes`
--

LOCK TABLES `stemi_outcomes` WRITE;
/*!40000 ALTER TABLE `stemi_outcomes` DISABLE KEYS */;
/*!40000 ALTER TABLE `stemi_outcomes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stemi_registry`
--

DROP TABLE IF EXISTS `stemi_registry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stemi_registry` (
  `stemi_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `acs_no` varchar(30) NOT NULL,
  `ip_no` varchar(30) DEFAULT NULL,
  `admission_date` date NOT NULL,
  `discharge_date` date DEFAULT NULL,
  `primary_consultant` varchar(150) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stemi_id`),
  UNIQUE KEY `acs_no` (`acs_no`),
  KEY `fk_stemi_patient` (`patient_id`),
  CONSTRAINT `fk_stemi_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stemi_registry`
--

LOCK TABLES `stemi_registry` WRITE;
/*!40000 ALTER TABLE `stemi_registry` DISABLE KEYS */;
/*!40000 ALTER TABLE `stemi_registry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stemi_treatment_strategy`
--

DROP TABLE IF EXISTS `stemi_treatment_strategy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stemi_treatment_strategy` (
  `treatment_id` int NOT NULL AUTO_INCREMENT,
  `stemi_id` int NOT NULL,
  `pami` enum('Yes','No') DEFAULT 'No',
  `thrombolysis` enum('Yes','No') DEFAULT 'No',
  `conservative` enum('Yes','No') DEFAULT 'No',
  `door_to_balloon_time` smallint unsigned DEFAULT NULL,
  `vessel_lmca` enum('Yes','No') DEFAULT 'No',
  `vessel_lad` enum('Yes','No') DEFAULT 'No',
  `vessel_diagonal` enum('Yes','No') DEFAULT 'No',
  `vessel_lcx` enum('Yes','No') DEFAULT 'No',
  `vessel_ramus` enum('Yes','No') DEFAULT 'No',
  `vessel_om` enum('Yes','No') DEFAULT 'No',
  `vessel_rca` enum('Yes','No') DEFAULT 'No',
  `vessel_pda` enum('Yes','No') DEFAULT 'No',
  `vessel_segment` varchar(100) DEFAULT NULL,
  `thrombosuction_done` enum('Yes','No') DEFAULT 'No',
  `thrombosuction_not_done` enum('Yes','No') DEFAULT 'No',
  `stent_bms` enum('Yes','No') DEFAULT 'No',
  `stent_des` enum('Yes','No') DEFAULT 'No',
  `stent_diameter` decimal(5,2) DEFAULT NULL,
  `stent_length` decimal(5,2) DEFAULT NULL,
  `procedural_success` enum('Yes','No') DEFAULT 'No',
  `timi_flow` tinyint DEFAULT NULL,
  `complication_none` enum('Yes','No') DEFAULT 'No',
  `complication_tamponade` enum('Yes','No') DEFAULT 'No',
  `complication_major_bleed` enum('Yes','No') DEFAULT 'No',
  `complication_stroke` enum('Yes','No') DEFAULT 'No',
  `complication_stent_thrombosis` enum('Yes','No') DEFAULT 'No',
  `complication_mi` enum('Yes','No') DEFAULT 'No',
  `complication_death` enum('Yes','No') DEFAULT 'No',
  `complication_emergency_cabg` enum('Yes','No') DEFAULT 'No',
  `door_to_needle_time` smallint unsigned DEFAULT NULL,
  `drug_stk` enum('Yes','No') DEFAULT 'No',
  `drug_uk` enum('Yes','No') DEFAULT 'No',
  `drug_reteplase` enum('Yes','No') DEFAULT 'No',
  `drug_tenecteplase` enum('Yes','No') DEFAULT 'No',
  `thrombolysis_dose` varchar(100) DEFAULT NULL,
  `beta_blocker` enum('Yes','No') DEFAULT 'No',
  `calcium_channel_blocker` enum('Yes','No') DEFAULT 'No',
  `nitrate` enum('Yes','No') DEFAULT 'No',
  `nicorandil` enum('Yes','No') DEFAULT 'No',
  `ivabradine` enum('Yes','No') DEFAULT 'No',
  `ranolazine` enum('Yes','No') DEFAULT 'No',
  `trimetazidine` enum('Yes','No') DEFAULT 'No',
  `aspirin` enum('Yes','No') DEFAULT 'No',
  `clopidogrel` enum('Yes','No') DEFAULT 'No',
  `prasugrel` enum('Yes','No') DEFAULT 'No',
  `ticagrelor` enum('Yes','No') DEFAULT 'No',
  `heparin_ufh_iv` enum('Yes','No') DEFAULT 'No',
  `heparin_ufh_sc` enum('Yes','No') DEFAULT 'No',
  `heparin_lmwh` enum('Yes','No') DEFAULT 'No',
  `heparin_ufh_iv_sc` enum('Yes','No') DEFAULT 'No',
  `heparin_ufh_iv_lmwh` enum('Yes','No') DEFAULT 'No',
  `gp2b3a` enum('Yes','No') DEFAULT 'No',
  `bivaluridin` enum('Yes','No') DEFAULT 'No',
  `statin` enum('Yes','No') DEFAULT 'No',
  `statin_10mg` enum('Yes','No') DEFAULT 'No',
  `statin_20mg` enum('Yes','No') DEFAULT 'No',
  `statin_40mg` enum('Yes','No') DEFAULT 'No',
  `statin_80mg` enum('Yes','No') DEFAULT 'No',
  `other_drugs` varchar(255) DEFAULT NULL,
  `cag` enum('Yes','No') DEFAULT 'No',
  `iabp` enum('Yes','No') DEFAULT 'No',
  `invasive_ventilation` enum('Yes','No') DEFAULT 'No',
  `ptca` enum('Yes','No') DEFAULT 'No',
  `cabg` enum('Yes','No') DEFAULT 'No',
  `other_procedure` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`treatment_id`),
  KEY `fk_stemi_treatment` (`stemi_id`),
  CONSTRAINT `fk_stemi_treatment` FOREIGN KEY (`stemi_id`) REFERENCES `stemi_registry` (`stemi_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stemi_treatment_strategy`
--

LOCK TABLES `stemi_treatment_strategy` WRITE;
/*!40000 ALTER TABLE `stemi_treatment_strategy` DISABLE KEYS */;
/*!40000 ALTER TABLE `stemi_treatment_strategy` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-20 18:31:08
