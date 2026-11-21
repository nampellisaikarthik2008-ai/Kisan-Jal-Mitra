"""
Automated Test Script: PS #19 FastAPI & Postman Checkpoints Verification
Tests all 6 checkpoints against main.py
"""
import subprocess
import time
import json
import urllib.request
import urllib.error

proc = subprocess.Popen(["python", "-u", "main.py"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

# Wait for server to bind
for _ in range(20):
    try:
        with urllib.request.urlopen("http://127.0.0.1:8000/api/model-info", timeout=1) as resp:
            if resp.status == 200:
                break
    except Exception:
        time.sleep(1)

try:
    print("=====================================================================")
    print("TESTING ALL 6 POSTMAN CHECKPOINTS AGAINST MAIN.PY")
    print("=====================================================================")

    # Checkpoint 1: GET / (Health Check)
    req1 = urllib.request.Request("http://127.0.0.1:8000/", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req1, timeout=5) as resp:
        d1 = json.loads(resp.read().decode("utf-8"))
        print(f"[OK 200] Checkpoint 1 (Health Check): Status = {d1.get('status')}")

    # Checkpoint 2: GET /api/model-info (Model Metrics & SHAP)
    req2 = urllib.request.Request("http://127.0.0.1:8000/api/model-info", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req2, timeout=5) as resp:
        d2 = json.loads(resp.read().decode("utf-8"))
        print(f"[OK 200] Checkpoint 2 (Model Benchmarks): Champion = {d2.get('champion_model')}")

    # Checkpoint 3: POST /api/predict (ML Inference via crop_stress_model.pkl)
    payload3 = {
        "field_id": "FIELD_0042",
        "crop_type": "Cotton",
        "soil_moisture_pct": 18.5,
        "temperature_c": 34.2,
        "humidity_pct": 55.0,
        "rainfall_mm": 0.5,
        "wapor_pcp_mm_day": 0.05,
        "wapor_aeti_mm_day": 0.45,
        "wapor_npp_gc_m2_day": 2.10,
        "crop_critical_sm": 40.0
    }
    req3 = urllib.request.Request(
        "http://127.0.0.1:8000/api/predict",
        data=json.dumps(payload3).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req3, timeout=5) as resp:
        d3 = json.loads(resp.read().decode("utf-8"))
        print(f"[OK 200] Checkpoint 3 (ML Inference): Pred ID = {d3.get('prediction_id')} | Score = {d3.get('stress_risk_score')} ({d3.get('stress_risk_category')})")

    # Checkpoint 4: GET /api/fields (Monitored Parcels)
    req4 = urllib.request.Request("http://127.0.0.1:8000/api/fields?limit=10&crop=Cotton", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req4, timeout=5) as resp:
        d4 = json.loads(resp.read().decode("utf-8"))
        print(f"[OK 200] Checkpoint 4 (Monitored Parcels): Records returned = {d4.get('total_returned')}")

    # Checkpoint 5: POST /api/save-field (Database Insertion)
    payload5 = {
        "field_id": "FIELD_5001",
        "region": "Punjab Basin",
        "dekad": "2025-01-D1",
        "latitude": 31.8099,
        "longitude": 74.9014,
        "crop_type": "Cotton",
        "soil_type": "Sandy Soil",
        "growth_stage": "Seedling / Initial",
        "soil_moisture_pct": 21.1,
        "temperature_c": 29.0,
        "humidity_pct": 59.3,
        "rainfall_mm": 0.4,
        "wapor_pcp_mm_day": 0.04,
        "wapor_aeti_mm_day": 0.73,
        "wapor_npp_gc_m2_day": 3.37,
        "crop_critical_sm": 32.0
    }
    req5 = urllib.request.Request(
        "http://127.0.0.1:8000/api/save-field",
        data=json.dumps(payload5).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req5, timeout=5) as resp:
        d5 = json.loads(resp.read().decode("utf-8"))
        print(f"[OK 200] Checkpoint 5 (Database Insert): {d5.get('message')}")

    # Checkpoint 6: GET /api/history (Database Audit Trail)
    req6 = urllib.request.Request("http://127.0.0.1:8000/api/history?limit=15", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req6, timeout=5) as resp:
        d6 = json.loads(resp.read().decode("utf-8"))
        print(f"[OK 200] Checkpoint 6 (Database Audit): DB Backend = {d6.get('database_backend')} | Logs count = {d6.get('count')}")

    print("=====================================================================")
    print("ALL 6 POSTMAN CHECKPOINTS PASSED WITH 200 OK!")
    print("=====================================================================")

finally:
    proc.terminate()
    proc.wait()
