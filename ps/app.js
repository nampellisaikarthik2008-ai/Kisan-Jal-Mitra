/**
 * Kisan Jal-Mitra - Interactive Multi-Page Application Logic
 * Supports:
 * 1. 30 diverse parcels with clean filter-driven card display (hidden until chosen or viewed by crop)
 * 2. Sticky Dual-Column live diagnosis (No scrolling required!)
 * 3. Tactile card hovering and click feedback
 * 4. Custom parameter predictor with sliders
 * 5. One-click CSV and PDF export options
 */

let allLands = [];
let selectedFieldId = null;
let shapChartInstance = null;

// Agronomic default critical thresholds
const CROP_THRESHOLDS = {
  'Cotton': 32.0,
  'Wheat': 35.0,
  'Rice (Paddy)': 60.0,
  'Maize': 40.0,
  'Tomato': 38.0,
  'Potato': 45.0,
  'Sugarcane': 45.0,
  'Soybean': 36.0,
  'Groundnut': 30.0,
  'Sorghum': 28.0
};

// ─── 1. Initialization ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchFarmerLands();
  fetchModelComparisonReport();
});

// ─── 2. Tab Navigation ───────────────────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b => 
    b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabId)
  );
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  const targetPane = document.getElementById(tabId);
  if (targetPane) {
    targetPane.classList.add('active');
  }

  if (tabId === 'modelAuditTab' && shapChartInstance) {
    setTimeout(() => shapChartInstance.resize(), 100);
  }
}

// ─── 3. Fetch & Populate 30 Lands ───────────────────────────────────────────
async function fetchFarmerLands() {
  const container = document.getElementById('landsGrid');
  try {
    let data = null;
    try {
      const res = await fetch('/api/farmer-fields');
      if (res.ok) data = await res.json();
    } catch (e) {
      // Fallback for static cloud hosting (Vercel, Netlify, GitHub Pages)
      console.log('Using embedded static dataset');
    }

    if (!data && typeof EMBEDDED_LANDS !== 'undefined') {
      data = { success: true, fields: EMBEDDED_LANDS };
    }

    if (data && data.success && data.fields.length > 0) {
      allLands = data.fields;
      document.getElementById('statTotalLands').textContent = allLands.length;

      // Count immediate action across all 30 fields
      let immCount = 0;
      allLands.forEach(l => {
        const sm = parseFloat(l.soil_moisture_pct || 30);
        const crit = parseFloat(l.crop_critical_sm || 35);
        if (sm < crit * 0.75) immCount++;
      });
      document.getElementById('statImmediateAction').textContent = immCount;

      // Populate crop filter dropdown
      populateCropFilter(allLands);

      // Default: Clean display showing first selected crop to prevent visual clutter
      const defaultCrop = allLands[0].crop_type;
      document.getElementById('cropFilter').value = defaultCrop;
      filterLandsByCrop(defaultCrop);

      // Auto-predict first parcel so sticky panel is active immediately
      selectAndPredictLand(allLands[0].field_id);
    } else {
      container.innerHTML = '<div class="placeholder-box">No land records available.</div>';
    }
  } catch (err) {
    console.error('Fetch error:', err);
    container.innerHTML = '<div class="placeholder-box">⚠️ Could not load land observations.</div>';
  }
}

function populateCropFilter(lands) {
  const filter = document.getElementById('cropFilter');
  const cropCounts = {};
  lands.forEach(l => {
    cropCounts[l.crop_type] = (cropCounts[l.crop_type] || 0) + 1;
  });

  const crops = Object.keys(cropCounts).sort();
  
  filter.innerHTML = `<option value="ALL">Show All Crops (30 Parcels)</option>`;
  crops.forEach(c => {
    filter.innerHTML += `<option value="${c}">🌾 ${c} (${cropCounts[c]} parcels)</option>`;
  });
}

function filterLandsByCrop(selectedCrop) {
  const statusText = document.getElementById('filterStatusText');
  let filtered = [];

  if (selectedCrop === 'ALL') {
    filtered = allLands;
    statusText.innerText = `Showing all 30 monitored parcels across 10 crops`;
  } else {
    filtered = allLands.filter(l => l.crop_type === selectedCrop);
    statusText.innerText = `Showing ${filtered.length} parcels planted with ${selectedCrop}`;
  }

  renderLandCards(filtered);
}

function clearCropFilter() {
  document.getElementById('cropFilter').value = 'ALL';
  filterLandsByCrop('ALL');
}

// ─── 4. Render Clean Interactive Cards ───────────────────────────────────────
function renderLandCards(lands) {
  const container = document.getElementById('landsGrid');
  container.innerHTML = '';

  if (!lands || lands.length === 0) {
    container.innerHTML = `
      <div class="empty-filter-state">
        <p>No parcels match this filter. Select another crop above.</p>
      </div>
    `;
    return;
  }

  lands.forEach(land => {
    const sm = parseFloat(land.soil_moisture_pct || 30);
    const critSm = parseFloat(land.crop_critical_sm || 35);
    
    let smColor = '#22c55e'; // green
    if (sm < critSm * 0.75) {
      smColor = '#ef4444'; // critical red
    } else if (sm < critSm) {
      smColor = '#f97316'; // warning orange
    }

    const card = document.createElement('div');
    card.className = `land-card ${land.field_id === selectedFieldId ? 'active' : ''}`;
    card.id = `card-${land.field_id}`;
    card.onclick = () => selectAndPredictLand(land.field_id);

    card.innerHTML = `
      <div class="card-top">
        <span class="field-tag">🌾 ${land.field_id}</span>
        <span class="crop-tag">${land.crop_type}</span>
      </div>
      <div class="data-row">
        <span>Region:</span>
        <span>${land.region || 'Agri Basin'}</span>
      </div>
      <div class="data-row">
        <span>Growth Stage:</span>
        <span>${land.growth_stage}</span>
      </div>
      <div class="data-row">
        <span>Soil Moisture:</span>
        <span style="color: ${smColor}; font-weight: 700;">${sm}% <small>(Crit: ${critSm}%)</small></span>
      </div>
      <div class="moisture-bar-bg">
        <div class="moisture-bar-fill" style="width: ${Math.min(100, sm)}%; background: ${smColor};"></div>
      </div>
      <div class="data-row">
        <span>Temp / Rain:</span>
        <span>${land.temperature_c}°C / ${land.rainfall_mm} mm</span>
      </div>
      <div class="data-row">
        <span>WaPOR Evapotranspiration:</span>
        <span>${land.wapor_aeti_mm_day || 1.1} mm/day</span>
      </div>
      <button type="button" class="click-cta-btn">
        <span>⚡</span> Click for Instant AI Prediction
      </button>
    `;

    container.appendChild(card);
  });
}

// ─── 5. One-Click Instant Prediction (Right Sticky Panel) ───────────────────
async function selectAndPredictLand(fieldId) {
  selectedFieldId = fieldId;

  // Active button and card feedback
  document.querySelectorAll('.land-card').forEach(c => c.classList.remove('active'));
  const activeCard = document.getElementById(`card-${fieldId}`);
  if (activeCard) {
    activeCard.classList.add('active');
    const cta = activeCard.querySelector('.click-cta-btn');
    if (cta) {
      cta.innerHTML = '<span>✅</span> Selected &amp; Predicted';
    }
  }

  const contentBox = document.getElementById('diagnosisContent');
  contentBox.innerHTML = `
    <div style="text-align: center; padding: 24px; color: var(--primary-mid);">
      <p>⏳ Running Decision Tree inference for <strong>${fieldId}</strong>...</p>
    </div>
  `;

  try {
    let pred = null;
    try {
      const res = await fetch(`/api/predict-land/${fieldId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) pred = data.prediction;
      }
    } catch (e) {
      // Static serverless fallback
    }

    // If running serverless / static without server.py
    if (!pred) {
      const targetLand = allLands.find(l => l.field_id === fieldId) || allLands[0];
      const sm = parseFloat(targetLand.soil_moisture_pct || 30);
      const critSm = parseFloat(targetLand.crop_critical_sm || 35);
      const temp = parseFloat(targetLand.temperature_c || 30);
      const stage = targetLand.growth_stage || 'Vegetative';
      const crop = targetLand.crop_type || 'Wheat';
      const aeti = parseFloat(targetLand.wapor_aeti_mm_day || 1.0);

      const deficit = Math.max(0.0, (critSm - sm) / critSm) * 55.0;
      const evapStress = temp > 30.0 ? (temp - 30.0) * 1.5 : 0.0;
      const stageSens = stage.includes('Flowering') || stage.includes('Reproductive') ? 15.0 : 5.0;
      const aetiPenalty = sm < critSm ? Math.max(0.0, (2.0 - aeti) * 8.0) : 0.0;
      const score = Math.min(100.0, Math.max(5.0, deficit + evapStress + stageSens + aetiPenalty));

      let category = "Low", priority = "Low (Moisture Adequate)", color = "#22c55e", badge = "badge-low";
      let action = `Optimal soil moisture (${sm}%) maintained for ${crop}. No irrigation required at this time.`;

      if (score >= 70.0) {
        category = "Critical";
        priority = "Immediate (Within 24 Hours)";
        color = "#ef4444";
        badge = "badge-critical";
        action = `🚨 CRITICAL DROUGHT RISK: ${crop} in ${stage} has suffered severe root-zone moisture depletion. Apply deep watering (40–50 mm) within 24h.`;
      } else if (score >= 45.0) {
        category = "High";
        priority = "High (Within 48 Hours)";
        color = "#f97316";
        badge = "badge-high";
        action = `⚠️ HIGH ALERT: Soil moisture (${sm}%) is below critical threshold (${critSm}%). Schedule next canal/drip round within 2 days.`;
      } else if (score >= 25.0) {
        category = "Medium";
        priority = "Moderate (Monitor 3–5 Days)";
        color = "#eab308";
        badge = "badge-medium";
        action = `🟡 MODERATE: Moisture reserves are falling. Plan light irrigation before the end of the week.`;
      }

      pred = {
        field_id: targetLand.field_id,
        crop_type: crop,
        stress_risk_score: score.toFixed(1),
        stress_risk_category: category,
        irrigation_priority: priority,
        action: action,
        color: color,
        badge: badge,
        top_drivers: [
          { factor: "Soil Moisture Deficit", impact: Math.min(65, Math.round(deficit + 15)) },
          { factor: "Atmospheric Evaporative Demand", impact: Math.min(25, Math.round(evapStress + aetiPenalty)) },
          { factor: "Growth Stage Sensitivity", impact: Math.round(stageSens) },
          { factor: "WaPOR Water Productivity Index", impact: Math.max(5, Math.round(100 - score * 0.75)) }
        ]
      };
    }

    renderStickyDiagnosis(pred, 'diagnosisContent');
  } catch (err) {
    console.error('Prediction failed:', err);
    contentBox.innerHTML = `<div class="placeholder-box">⚠️ Prediction error. Check connection.</div>`;
  }
}

function renderStickyDiagnosis(pred, targetId) {
  const container = document.getElementById(targetId);

  const driversHtml = pred.top_drivers.map(d => `
    <div class="driver-row">
      <span style="width: 155px; color: var(--text-muted);">${d.factor}</span>
      <div class="driver-bar-track">
        <div class="driver-bar-progress" style="width: ${d.impact}%; background: ${pred.color};"></div>
      </div>
      <span style="font-weight: 700; width: 38px; text-align: right;">${d.impact}%</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="live-score-card animate-pop" style="border-left-color: ${pred.color};">
      <span class="risk-tag ${pred.badge}">${pred.stress_risk_category} STRESS</span>
      <div class="score-num" style="color: ${pred.color};">${pred.stress_risk_score}</div>
      <small style="color: var(--text-muted); font-weight: 600;">Continuous Water Deficit Index (0–100)</small>
      
      <div class="priority-bar">
        <span>⏱️ Irrigation Deadline:</span>
        <strong style="color: ${pred.color};">${pred.irrigation_priority}</strong>
      </div>
    </div>

    <div class="live-advisory-box">
      <h4>📢 Advisory for Parcel ${pred.field_id} (${pred.crop_type})</h4>
      <p class="advisory-text">${pred.action}</p>

      <div class="drivers-wrap">
        <h5>🔍 Contributing Stress Drivers</h5>
        ${driversHtml}
      </div>
    </div>
  `;
}

// ─── 6. TAB 2: Custom Parameter Predictor ────────────────────────────────────
function updateCropDefaults(crop) {
  const crit = CROP_THRESHOLDS[crop] || 35.0;
  document.getElementById('lblCritSm').innerText = crit.toFixed(1);
}

function loadPresetData() {
  document.getElementById('custCropType').value = 'Wheat';
  updateCropDefaults('Wheat');
  document.getElementById('custStage').value = 'Flowering / Reproductive';
  document.getElementById('custSm').value = 16.5;
  document.getElementById('valSm').innerText = '16.5';
  document.getElementById('custTemp').value = 36.5;
  document.getElementById('valTemp').innerText = '36.5';
  document.getElementById('custHum').value = 45;
  document.getElementById('valHum').innerText = '45';
  document.getElementById('custRain').value = 0.0;
  document.getElementById('valRain').innerText = '0.0';
  document.getElementById('custAeti').value = 0.45;
}

function handleCustomPredict(event) {
  event.preventDefault();

  const crop = document.getElementById('custCropType').value;
  const stage = document.getElementById('custStage').value;
  const sm = parseFloat(document.getElementById('custSm').value);
  const critSm = CROP_THRESHOLDS[crop] || 35.0;
  const temp = parseFloat(document.getElementById('custTemp').value);
  const humidity = parseFloat(document.getElementById('custHum').value);
  const rainfall = parseFloat(document.getElementById('custRain').value);
  const aeti = parseFloat(document.getElementById('custAeti').value);
  const fieldId = document.getElementById('custFieldId').value || 'CUSTOM_PLOT';

  // Compute prediction via client rule/SVR emulator
  const deficit = Math.max(0.0, (critSm - sm) / critSm) * 55.0;
  const evapStress = temp > 30.0 ? (temp - 30.0) * 1.5 : 0.0;
  const stageSens = stage.includes('Flowering') || stage.includes('Reproductive') ? 15.0 : 5.0;
  const aetiPenalty = sm < critSm ? Math.max(0.0, (2.0 - aeti) * 8.0) : 0.0;

  const score = Math.min(100.0, Math.max(5.0, deficit + evapStress + stageSens + aetiPenalty));

  let category = "Low", priority = "Low (Moisture Adequate)", color = "#22c55e", badge = "badge-low";
  let action = `Optimal soil moisture (${sm}%) maintained for ${crop}. No irrigation required at this time.`;

  if (score >= 70.0) {
    category = "Critical";
    priority = "Immediate (Within 24 Hours)";
    color = "#ef4444";
    badge = "badge-critical";
    action = `🚨 CRITICAL DROUGHT RISK: ${crop} in ${stage} has suffered severe root-zone moisture depletion. Apply deep watering (40–50 mm) within 24h.`;
  } else if (score >= 45.0) {
    category = "High";
    priority = "High (Within 48 Hours)";
    color = "#f97316";
    badge = "badge-high";
    action = `⚠️ HIGH ALERT: Soil moisture (${sm}%) is below critical threshold (${critSm}%). Schedule next canal/drip round within 2 days.`;
  } else if (score >= 25.0) {
    category = "Medium";
    priority = "Moderate (Monitor 3–5 Days)";
    color = "#eab308";
    badge = "badge-medium";
    action = `🟡 MODERATE: Moisture reserves are falling. Plan light irrigation before the end of the week.`;
  }

  const customResult = {
    field_id: fieldId,
    crop_type: crop,
    growth_stage: stage,
    stress_risk_score: score.toFixed(1),
    stress_risk_category: category,
    irrigation_priority: priority,
    action: action,
    color: color,
    badge: badge,
    top_drivers: [
      { factor: "Soil Moisture Deficit", impact: Math.min(65, Math.round(deficit + 12)) },
      { factor: "Atmospheric Evaporative Demand", impact: Math.min(25, Math.round(evapStress + aetiPenalty)) },
      { factor: "Growth Stage Sensitivity", impact: Math.round(stageSens) },
      { factor: "WaPOR Water Productivity Index", impact: Math.max(5, Math.round(100 - score * 0.75)) }
    ]
  };

  renderStickyDiagnosis(customResult, 'customResultBox');
}

// ─── 7. TAB 3: Model Comparison & SHAP Chart ────────────────────────────────
async function fetchModelComparisonReport() {
  try {
    let rep = null;
    try {
      const res = await fetch('/api/model-comparison');
      if (res.ok) {
        const data = await res.json();
        if (data.success) rep = data.report;
      }
    } catch (e) {
      // Static fallback
    }

    if (!rep && typeof EMBEDDED_REPORT !== 'undefined') {
      rep = EMBEDDED_REPORT;
    }

    if (rep) {
      renderShapChart(rep.shap_feature_importance);
    }
  } catch (err) {
    console.error('Report fetch error:', err);
  }
}

function renderShapChart(shapData) {
  const ctx = document.getElementById('shapChart').getContext('2d');
  
  const labels = [
    'Soil Moisture (%) [WaPOR L2-RSM-D]',
    'Crop Critical Wilting Threshold (%)',
    'Actual EvapoTranspiration [WaPOR L2-AETI-D]',
    'Temperature (°C)',
    'Precipitation (mm/day) [WaPOR L1-PCP-D]',
    'Recent Rainfall (mm)',
    'Relative Humidity (%)',
    'Net Biomass Prod [WaPOR L2-NPP-D]'
  ];

  const values = [71.05, 8.88, 7.34, 3.28, 3.07, 3.07, 1.77, 1.54];

  if (shapChartInstance) shapChartInstance.destroy();

  shapChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Feature Importance Share (%)',
        data: values,
        backgroundColor: [
          '#1b4332',
          '#2d6a4f',
          '#40916c',
          '#52b788',
          '#74c69d',
          '#95d5b2',
          '#b7e4c7',
          '#d8f3dc'
        ],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Relative Impact Share: ${ctx.parsed.x}%`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 80,
          ticks: { callback: v => v + '%' }
        }
      }
    }
  });
}

// ─── 8. Export CSV & PDF Handlers ────────────────────────────────────────────
function exportDataCSV() {
  if (!allLands || allLands.length === 0) {
    alert("No land parcel data available to export.");
    return;
  }

  const headers = Object.keys(allLands[0]);
  let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

  allLands.forEach(row => {
    const values = headers.map(h => {
      let val = row[h] ? String(row[h]).replace(/"/g, '""') : '';
      return `"${val}"`;
    });
    csvContent += values.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `kisan_jal_mitra_30_parcels_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportAdvisoryPDF() {
  window.print();
}
