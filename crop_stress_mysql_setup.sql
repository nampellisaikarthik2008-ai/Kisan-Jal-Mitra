-- ==============================================================================
-- PS #19: Crop Stress & Irrigation Decision Support System
-- MySQL 8.0 Database Setup & Seeding Script
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS crop_stress_db;
USE crop_stress_db;

-- 1. Table: Monitored Agricultural Parcels (fields)
CREATE TABLE IF NOT EXISTS fields (
    field_id VARCHAR(50) PRIMARY KEY,
    region VARCHAR(100),
    dekad VARCHAR(20),
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    crop_type VARCHAR(50),
    soil_type VARCHAR(50),
    growth_stage VARCHAR(50),
    soil_moisture_pct DECIMAL(5, 2),
    temperature_c DECIMAL(5, 2),
    humidity_pct DECIMAL(5, 2),
    rainfall_mm DECIMAL(6, 2),
    wapor_pcp_mm_day DECIMAL(6, 2),
    wapor_aeti_mm_day DECIMAL(6, 2),
    wapor_npp_gc_m2_day DECIMAL(6, 2),
    crop_critical_sm DECIMAL(5, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: Real-Time Prediction Audit Logs (predictions)
CREATE TABLE IF NOT EXISTS predictions (
    prediction_id VARCHAR(50) PRIMARY KEY,
    field_id VARCHAR(50),
    crop_type VARCHAR(50),
    soil_moisture_pct DECIMAL(5, 2),
    temperature_c DECIMAL(5, 2),
    stress_risk_score DECIMAL(5, 2),
    stress_risk_category VARCHAR(20),
    irrigation_priority VARCHAR(50),
    recommended_action TEXT,
    model_used VARCHAR(100),
    timestamp VARCHAR(50)
);

-- 3. Seed Sample Monitored Fields
INSERT INTO fields (field_id, region, dekad, latitude, longitude, crop_type, soil_type, growth_stage, soil_moisture_pct, temperature_c, humidity_pct, rainfall_mm, wapor_pcp_mm_day, wapor_aeti_mm_day, wapor_npp_gc_m2_day, crop_critical_sm)
VALUES
('FIELD_0001', 'Punjab Basin', '2025-01-D1', 31.809900, 74.901400, 'Cotton', 'Sandy Soil', 'Seedling / Initial', 21.10, 29.00, 59.30, 0.40, 0.04, 0.73, 3.37, 32.00),
('FIELD_0002', 'Deccan Plateau', '2025-01-D1', 18.587700, 76.184600, 'Sorghum', 'Clay Loam', 'Seedling / Initial', 42.10, 34.30, 53.50, 0.90, 0.09, 1.11, 5.56, 28.00),
('FIELD_0003', 'Nile Basin (WaPOR Core)', '2025-01-D1', 25.786700, 30.563700, 'Potato', 'Sandy Loam', 'Seedling / Initial', 18.60, 35.10, 56.70, 0.90, 0.09, 0.36, 1.77, 45.00),
('FIELD_0004', 'Punjab Basin', '2025-01-D1', 30.679200, 74.478100, 'Tomato', 'Clay Loam', 'Seedling / Initial', 40.90, 30.20, 62.00, 1.00, 0.10, 1.12, 5.33, 38.00),
('FIELD_0005', 'Indo-Gangetic Plain', '2025-01-D1', 26.846700, 80.946200, 'Wheat', 'Alluvial Loam', 'Crown Root Initiation', 19.50, 24.50, 52.00, 0.00, 0.00, 0.65, 3.10, 35.00)
ON DUPLICATE KEY UPDATE field_id = VALUES(field_id);

-- 4. Seed Live Prediction Audit Records
INSERT INTO predictions (prediction_id, field_id, crop_type, soil_moisture_pct, temperature_c, stress_risk_score, stress_risk_category, irrigation_priority, recommended_action, model_used, timestamp)
VALUES
('PRED_7FF374C2', 'FIELD_0042', 'Cotton', 18.50, 34.20, 64.00, 'High', 'High (Within 48h)', 'Schedule full irrigation cycle; crop approaching permanent wilting point.', 'Decision Tree (crop_stress_model.pkl)', '2026-11-20T13:21:44'),
('PRED_37F79095', 'FIELD_0001', 'Cotton', 21.10, 29.00, 64.00, 'High', 'High (Within 48h)', 'Schedule full irrigation; approaching wilting.', 'Decision Tree (crop_stress_model.pkl)', '2026-11-20T13:00:50'),
('PRED_88A19001', 'FIELD_0002', 'Sorghum', 42.10, 34.30, 12.50, 'Low', 'Low (Adequate Moisture)', 'Optimal moisture levels maintained; no irrigation needed at present.', 'Decision Tree (crop_stress_model.pkl)', '2026-11-21T10:15:20'),
('PRED_99B23002', 'FIELD_0003', 'Potato', 18.60, 35.10, 78.40, 'Critical', 'Critical (Immediate Action Required)', 'Trigger emergency irrigation to prevent permanent wilting.', 'Decision Tree (crop_stress_model.pkl)', '2026-11-21T11:45:00')
ON DUPLICATE KEY UPDATE prediction_id = VALUES(prediction_id);

-- Verify database tables
SHOW TABLES;
SELECT COUNT(*) AS total_fields FROM fields;
SELECT COUNT(*) AS total_predictions FROM predictions;
