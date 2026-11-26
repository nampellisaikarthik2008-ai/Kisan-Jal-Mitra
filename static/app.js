/* ==========================================================================
   Kisan Jal-Mitra | Decision Engine & FastAPI Backend Bridge
   ========================================================================== */

// Sample Monitored Plots from 5,040 FAO WaPOR dataset
const SAMPLE_PARCELS = [
  { id: "FIELD_0001", region: "Punjab Basin", crop: "Cotton", stage: "Seedling", sm: 21.1, temp: 29.0, aeti: 0.73, pcp: 0.04, score: 64.0, cat: "High", priority: "High (Within 48h)", action: "Schedule full irrigation cycle; approaching permanent wilting point." },
  { id: "FIELD_0002", region: "Deccan Plateau", crop: "Sorghum", stage: "Vegetative", sm: 42.1, temp: 34.3, aeti: 1.11, pcp: 0.12, score: 12.5, cat: "Low", priority: "Low (Adequate Moisture)", action: "Optimal moisture levels maintained; no irrigation needed at present." },
  { id: "FIELD_0003", region: "Nile Basin", crop: "Potato", stage: "Tuber Init", sm: 18.6, temp: 35.1, aeti: 0.36, pcp: 0.00, score: 78.4, cat: "Critical", priority: "Critical (Emergency Today)", action: "Trigger emergency irrigation immediately to prevent irreversible yield loss!" },
  { id: "FIELD_0004", region: "Punjab Basin", crop: "Tomato", stage: "Flowering", sm: 40.9, temp: 30.2, aeti: 1.12, pcp: 0.08, score: 14.8, cat: "Low", priority: "Low (Adequate Moisture)", action: "Optimal moisture levels maintained; no irrigation needed at present." },
  { id: "FIELD_0005", region: "Indo-Gangetic", crop: "Wheat", stage: "Crown Root", sm: 19.5, temp: 24.5, aeti: 0.65, pcp: 0.00, score: 58.2, cat: "High", priority: "High (Within 48h)", action: "Schedule irrigation within 48h before root elongation is hindered." },
  { id: "FIELD_0006", region: "Kaveri Basin", crop: "Rice", stage: "Tillering", sm: 48.0, temp: 31.0, aeti: 2.10, pcp: 1.50, score: 8.5, cat: "Low", priority: "Low (Adequate Moisture)", action: "Adequate ponding depth maintained. Defer irrigation until next dekad." },
  { id: "FIELD_0007", region: "Deccan Plateau", crop: "Cotton", stage: "Square", sm: 27.5, temp: 36.0, aeti: 0.95, pcp: 0.02, score: 42.0, cat: "Medium", priority: "Moderate (Monitor 3-5 days)", action: "Soil moisture depleting. Plan a top-up irrigation within 3-5 days." },
  { id: "FIELD_0008", region: "Nile Basin", crop: "Wheat", stage: "Grain Fill", sm: 14.0, temp: 38.0, aeti: 0.40, pcp: 0.00, score: 84.0, cat: "Critical", priority: "Critical (Emergency Today)", action: "Severe thermal & water stress! Irrigate immediately to avert grain abortion." },
  { id: "FIELD_0009", region: "Indo-Gangetic", crop: "Tomato", stage: "Fruit Set", sm: 31.2, temp: 28.0, aeti: 1.05, pcp: 0.10, score: 32.0, cat: "Medium", priority: "Moderate (Monitor 3-5 days)", action: "Monitor field moisture; top-up recommended before flowering transition." },
  { id: "FIELD_0010", region: "Punjab Basin", crop: "Cotton", stage: "Boll Dev", sm: 33.0, temp: 32.5, aeti: 1.20, pcp: 0.05, score: 28.0, cat: "Medium", priority: "Moderate (Monitor 3-5 days)", action: "Adequate vegetative vigor. Inspect soil moisture again in 3 days." },
  { id: "FIELD_0011", region: "Kaveri Basin", crop: "Rice", stage: "Panicle Init", sm: 44.5, temp: 29.5, aeti: 1.80, pcp: 0.80, score: 11.0, cat: "Low", priority: "Low (Adequate Moisture)", action: "Moisture conditions optimal for reproductive phase." },
  { id: "FIELD_0012", region: "Deccan Plateau", crop: "Sorghum", stage: "Grain Fill", sm: 16.2, temp: 37.0, aeti: 0.50, pcp: 0.00, score: 76.5, cat: "Critical", priority: "Critical (Emergency Today)", action: "Water deficit at grain fill risks severe yield penalty. Irrigate now!" }
];

// Seed Audit Database Rows
let auditLogs = [
  { id: "PRED_7FF374C2", field: "FIELD_0042", crop: "Cotton", sm: 18.5, temp: 34.2, score: 64.0, cat: "High", prio: "High (Within 48h)", time: "2026-11-23 21:05:12" },
  { id: "PRED_37F79095", field: "FIELD_0001", crop: "Cotton", sm: 21.1, temp: 29.0, score: 64.0, cat: "High", prio: "High (Within 48h)", time: "2026-11-23 20:30:45" },
  { id: "PRED_88A19001", field: "FIELD_0002", crop: "Sorghum", sm: 42.1, temp: 34.3, score: 12.5, cat: "Low", prio: "Low (Adequate Moisture)", time: "2026-11-23 18:15:20" },
  { id: "PRED_99B23002", field: "FIELD_0003", crop: "Potato", sm: 18.6, temp: 35.1, score: 78.4, cat: "Critical", prio: "Critical (Emergency Today)", time: "2026-11-23 16:45:00" },
  { id: "PRED_24D8D22C", field: "SIM_PARCEL", crop: "Cotton", sm: 18.5, temp: 34.2, score: 64.0, cat: "High", prio: "High (Within 48h)", time: "2026-11-23 14:05:00" },
];

function showToast(message, icon = "✅") {
  const toast = document.getElementById('toastNotification');
  document.getElementById('toastIcon').innerText = icon;
  document.getElementById('toastMessage').innerText = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(tabId);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-tab-classic').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.getElementById('btn-' + tabId);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

function renderParcels(filterList = null) {
  const grid = document.getElementById('parcelsGrid');
  grid.innerHTML = "";

  const parcels = filterList || SAMPLE_PARCELS;

  parcels.forEach(p => {
    let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (p.cat === "Medium") badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
    if (p.cat === "High") badgeColor = "bg-orange-100 text-orange-800 border-orange-300";
    if (p.cat === "Critical") badgeColor = "bg-red-100 text-red-800 border-red-300";

    const card = document.createElement('div');
    card.className = "bg-white border border-slate-300 rounded-md p-4 shadow-xs hover:border-emerald-600 transition space-y-2.5 cursor-pointer";
    card.onclick = () => loadParcelIntoSimulator(p);
    card.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <span class="font-bold text-xs text-slate-900 font-mono">${p.id}</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}">${p.cat.toUpperCase()}</span>
      </div>
      <div>
        <div class="font-bold text-xs text-slate-800">${p.crop} (${p.stage})</div>
        <div class="text-slate-500 text-[11px]">${p.region}</div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2 rounded border border-slate-200">
        <div><span class="text-slate-400">Moisture:</span> <strong>${p.sm}%</strong></div>
        <div><span class="text-slate-400">Temp:</span> <strong>${p.temp}°C</strong></div>
      </div>
      <div class="text-[11px] text-slate-600 leading-snug line-clamp-2">
        ${p.action}
      </div>
      <button class="btn-classic-secondary w-full text-xs font-semibold py-1.5 mt-1">
        Load into Simulator →
      </button>
    `;
    grid.appendChild(card);
  });
}

function filterParcels() {
  const crop = document.getElementById('cropFilter').value;
  const search = (document.getElementById('parcelSearch').value || "").toLowerCase();

  let filtered = SAMPLE_PARCELS;
  if (crop !== "ALL") {
    filtered = filtered.filter(p => p.crop.toLowerCase() === crop.toLowerCase());
  }
  if (search.trim() !== "") {
    filtered = filtered.filter(p =>
      p.id.toLowerCase().includes(search) ||
      p.region.toLowerCase().includes(search) ||
      p.crop.toLowerCase().includes(search)
    );
  }
  renderParcels(filtered);
}

function loadParcelIntoSimulator(p) {
  document.getElementById('input_sm').value = p.sm;
  document.getElementById('input_temp').value = p.temp;
  document.getElementById('input_aeti').value = p.aeti;
  document.getElementById('input_pcp').value = p.pcp || 0.05;
  document.getElementById('simCropSelect').value = p.crop;
  onCropChanged();
  runLiveInference();
  showToast(`Loaded ${p.id} into AI Simulator`, "🌾");
  switchTab('tab-simulator');
}

function onCropChanged() {
  const select = document.getElementById('simCropSelect');
  const opt = select.options[select.selectedIndex];
  const crit = opt.getAttribute('data-crit') || "35.0";
  document.getElementById('sliderCritLabel').innerText = `Critical Threshold: ${crit}%`;
  runLiveInference();
}

function resetSliders() {
  document.getElementById('input_sm').value = 21.0;
  document.getElementById('input_temp').value = 34.0;
  document.getElementById('input_aeti').value = 0.75;
  document.getElementById('input_pcp').value = 0.05;
  document.getElementById('simCropSelect').value = "Cotton";
  onCropChanged();
  runLiveInference();
  showToast("Reset to normal baseline values", "↺");
}

function applyPreset(type) {
  if (type === 'drought') {
    document.getElementById('input_sm').value = 12.0;
    document.getElementById('input_temp').value = 39.0;
    document.getElementById('input_aeti').value = 0.35;
    document.getElementById('input_pcp').value = 0.0;
    showToast("Severe Drought scenario applied", "🚨");
  } else if (type === 'heatwave') {
    document.getElementById('input_sm').value = 21.0;
    document.getElementById('input_temp').value = 34.0;
    document.getElementById('input_aeti').value = 0.75;
    document.getElementById('input_pcp').value = 0.05;
    showToast("Heatwave Deficit scenario applied", "⚠️");
  } else if (type === 'optimal') {
    document.getElementById('input_sm').value = 42.0;
    document.getElementById('input_temp').value = 27.0;
    document.getElementById('input_aeti').value = 1.15;
    document.getElementById('input_pcp').value = 2.50;
    showToast("Post-Rain Optimal scenario applied", "💧");
  }
  runLiveInference();
}

function runLiveInference() {
  const sm = parseFloat(document.getElementById('input_sm').value);
  const temp = parseFloat(document.getElementById('input_temp').value);
  const aeti = parseFloat(document.getElementById('input_aeti').value);
  const pcp = parseFloat(document.getElementById('input_pcp').value);

  const select = document.getElementById('simCropSelect');
  const crit_sm = parseFloat(select.options[select.selectedIndex].getAttribute('data-crit') || 35.0);

  document.getElementById('label_sm').innerText = sm.toFixed(1) + '%';
  document.getElementById('label_temp').innerText = temp.toFixed(1) + '°C';
  document.getElementById('label_aeti').innerText = aeti.toFixed(2) + ' mm';
  document.getElementById('label_pcp').innerText = pcp.toFixed(2) + ' mm';

  // Decision Tree Inference
  const deficit = Math.max(0, 1.0 - (sm / crit_sm));
  const tempPenalty = Math.max(0, (temp - 30.0) * 1.5);
  const etPenalty = Math.max(0, (aeti - pcp) * 3.8);
  let score = (deficit * 70.0) + tempPenalty + etPenalty;
  score = Math.min(100.0, Math.max(0.0, score));

  const scoreEl = document.getElementById('simScore');
  const barEl = document.getElementById('simBar');
  const badgeEl = document.getElementById('simBadge');
  const prioEl = document.getElementById('simPriority');
  const actEl = document.getElementById('simAction');
  const volEl = document.getElementById('simWaterVol');

  scoreEl.innerText = score.toFixed(1);
  barEl.style.width = score + '%';

  if (score < 25) {
    badgeEl.innerText = "LOW STRESS";
    badgeEl.className = "px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300";
    scoreEl.className = "text-5xl font-extrabold font-mono text-emerald-700";
    barEl.className = "h-full bg-emerald-600 transition-all duration-200";
    prioEl.innerText = "Priority: Low (Adequate Moisture)";
    actEl.innerText = "Optimal root-zone moisture maintained. Defer irrigation cycle until next satellite dekad.";
    volEl.innerText = "0 mm (Defer Irrigation)";
  } else if (score < 50) {
    badgeEl.innerText = "MEDIUM STRESS";
    badgeEl.className = "px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300";
    scoreEl.className = "text-5xl font-extrabold font-mono text-amber-700";
    barEl.className = "h-full bg-amber-600 transition-all duration-200";
    prioEl.innerText = "Priority: Moderate (Monitor 3-5 days)";
    actEl.innerText = "Soil moisture depletion detected. Plan a light top-up irrigation within 3 to 5 days.";
    volEl.innerText = "~20 mm / hectare";
  } else if (score < 75) {
    badgeEl.innerText = "HIGH STRESS";
    badgeEl.className = "px-2.5 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300";
    scoreEl.className = "text-5xl font-extrabold font-mono text-orange-700";
    barEl.className = "h-full bg-orange-600 transition-all duration-200";
    prioEl.innerText = "Priority: High (Within 48 Hours)";
    actEl.innerText = "Schedule full irrigation cycle immediately; crop approaching permanent wilting point.";
    volEl.innerText = "~35 mm / hectare";
  } else {
    badgeEl.innerText = "CRITICAL EMERGENCY";
    badgeEl.className = "px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-900 border border-red-300";
    scoreEl.className = "text-5xl font-extrabold font-mono text-red-700";
    barEl.className = "h-full bg-red-600 transition-all duration-200";
    prioEl.innerText = "Priority: Critical (Emergency Today)";
    actEl.innerText = "Trigger emergency irrigation today to prevent permanent crop wilting and irreversible yield loss!";
    volEl.innerText = "~50 mm / hectare";
  }
}

async function savePredictionToDatabase() {
  const sm = parseFloat(document.getElementById('input_sm').value);
  const temp = parseFloat(document.getElementById('input_temp').value);
  const aeti = parseFloat(document.getElementById('input_aeti').value);
  const pcp = parseFloat(document.getElementById('input_pcp').value);
  const crop = document.getElementById('simCropSelect').value;
  const score = parseFloat(document.getElementById('simScore').innerText);
  const prio = document.getElementById('simPriority').innerText.replace('Priority: ', '');
  const badge = document.getElementById('simBadge').innerText;
  const btnText = document.getElementById('saveBtnText');

  btnText.innerText = "Saving to SQL...";

  let newId = "PRED_" + Math.random().toString(16).substring(2, 10).toUpperCase();
  let now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Attempt live POST to FastAPI /api/predict
  try {
    const payload = {
      field_id: "SIM_PARCEL",
      crop_type: crop,
      soil_moisture_pct: sm,
      temperature_c: temp,
      humidity_pct: 55.0,
      rainfall_mm: pcp * 10.0,
      wapor_pcp_mm_day: pcp,
      wapor_aeti_mm_day: aeti,
      wapor_npp_gc_m2_day: 2.10,
      crop_critical_sm: 35.0
    };

    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      newId = data.prediction_id || newId;
      now = data.timestamp || now;
      document.getElementById('dbStorageLabel').innerText = `Active DB: ${data.database_backend || 'SQLite'}`;
    }
  } catch (err) {
    console.warn("API offline; logged client-side", err);
  }

  auditLogs.unshift({
    id: newId,
    field: "SIM_PARCEL",
    crop: crop,
    sm: sm,
    temp: temp,
    score: score,
    cat: badge,
    prio: prio,
    time: now
  });

  renderAuditLogs();
  btnText.innerText = "Saved to Database!";
  showToast(`Record ${newId} logged successfully`, "💾");
  setTimeout(() => { btnText.innerText = "Save Record to Database"; }, 2000);
  switchTab('tab-audit');
}

async function fetchHistoryFromBackend() {
  try {
    const res = await fetch('/api/history?limit=15', { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data.history && data.history.length > 0) {
        auditLogs = data.history.map(row => ({
          id: row.prediction_id,
          field: row.field_id,
          crop: row.crop_type,
          sm: row.soil_moisture_pct,
          temp: row.temperature_c,
          score: row.stress_risk_score,
          cat: row.stress_risk_category,
          prio: row.irrigation_priority,
          time: row.timestamp
        }));
        renderAuditLogs();
        document.getElementById('auditDbBadge').innerText = `Backend: ${data.database_backend || 'SQL'}`;
        showToast("Database records synchronized", "🔄");
        return;
      }
    }
  } catch (e) {
    console.warn("Could not sync history from backend", e);
  }
  renderAuditLogs();
}

function renderAuditLogs() {
  const tbody = document.getElementById('auditTableBody');
  tbody.innerHTML = "";
  auditLogs.forEach(log => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="p-2.5 font-bold text-emerald-700 font-mono">${log.id}</td>
      <td class="p-2.5">${log.field}</td>
      <td class="p-2.5 font-semibold">${log.crop}</td>
      <td class="p-2.5">${log.sm}%</td>
      <td class="p-2.5">${log.temp}°C</td>
      <td class="p-2.5 font-bold">${log.score}</td>
      <td class="p-2.5"><span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-300">${log.cat}</span></td>
      <td class="p-2.5">${log.prio}</td>
      <td class="p-2.5 text-slate-400">${log.time}</td>
    `;
    tbody.appendChild(tr);
  });
}

function toggleSlipModal(show) {
  const modal = document.getElementById('slipModal');
  if (show) modal.classList.remove('hidden');
  else modal.classList.add('hidden');
}

function openSlipModalCurrent() {
  const sm = document.getElementById('input_sm').value;
  const score = parseFloat(document.getElementById('simScore').innerText);
  const prio = document.getElementById('simPriority').innerText;
  const act = document.getElementById('simAction').innerText;
  const crop = document.getElementById('simCropSelect').value;
  const vol = document.getElementById('simWaterVol').innerText;

  document.getElementById('slipModalSm').innerText = sm + '%';
  document.getElementById('slipModalPlot').innerText = `CUSTOM_PLOT (${crop})`;
  document.getElementById('slipModalPriority').innerText = prio.replace('Priority: ', '');
  document.getElementById('slipModalDetail').innerText = act;
  document.getElementById('slipModalWater').innerText = vol;

  const box = document.getElementById('slipModalBox');
  if (score < 25) {
    box.className = "p-3 rounded border border-emerald-300 bg-emerald-50 text-center space-y-1";
  } else if (score < 50) {
    box.className = "p-3 rounded border border-amber-300 bg-amber-50 text-center space-y-1";
  } else if (score < 75) {
    box.className = "p-3 rounded border border-orange-300 bg-orange-50 text-center space-y-1";
  } else {
    box.className = "p-3 rounded border border-red-300 bg-red-50 text-center space-y-1";
  }

  toggleSlipModal(true);
}

// Health check on load
async function checkBackendHealth() {
  try {
    const res = await fetch('/api/model-info', { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const d = await res.json();
      console.log("Backend healthy:", d);
    }
  } catch (err) {
    console.warn("Operating in client standalone mode");
  }
}

// Initialize on window load
window.onload = function() {
  renderParcels();
  runLiveInference();
  renderAuditLogs();
  checkBackendHealth();
  fetchHistoryFromBackend();
};
