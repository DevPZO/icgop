/* =========================================================
   ICG Shifts Management System — script.js (Versión Consolidada)
   [MEJORA] Uso de actualizaciones granulares (.update) para concurrencia.
   [MEJORA] Los Tabuladores son parte del estado de la BD.
   [MEJORA] Grafico de sitios con contraste mejorado y desglose % por cargo.
========================================= */

// Desactivado: Todos los estilos fueron consolidados en styles.css
function injectExtraCss() {
    return;
}

const firebaseConfig = {
    apiKey: "AIzaSyBEatS2GakJM3G-9l9nP00Pg1dts-BB2bU",
    authDomain: "icgnube-7abb3.firebaseapp.com",
    databaseURL: "https://icgnube-7abb3-default-rtdb.firebaseio.com",
    projectId: "icgnube-7abb3",
    storageBucket: "icgnube-7abb3.firebasestorage.app",
    messagingSenderId: "523974615819",
    appId: "1:523974615819:web:f50fe767270974f31d380e"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

const DATA_INCRUSTADA = null;

const MONTHS_BASE = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const MESES_CAP = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DEC_2025 = "DICIEMBRE 2025";
let PERIODS = [];

function buildPeriods() {
    const now = new Date();
    const lastYear = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
    const list = [DEC_2025];
    for (let y = 2026; y <= Math.max(2026, lastYear); y++) MONTHS_BASE.forEach(m => list.push(`${m} ${y}`));
    PERIODS = list;
}
buildPeriods();

const DAYS_IN_MONTH = 31; 
const ROLES = ["Supervisor", "Tecnico de Seguridad", "Inspector", "Surveyor"];
const ROLE_COLORS = { "Supervisor": "#2563eb", "Tecnico de Seguridad": "#16a34a", "Inspector": "#d97706", "Surveyor": "#8b5cf6" };
const PALETTE = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#64748b"];
const IGNORE_SHIFT_ACTIVITIES = ["ATESTIGUAMIENTO", "INSPECCION", "MUESTREO", "DRAFT SURVEY", "INSPECCIÓN"];

const DEFAULT_SITES = ["Sidor", "Bauxilum", "Fmo", "Copal", "Palua", "Punta de Piedras"];
const DEFAULT_ACTIVITIES = ["Buque", "Gabarra", "Muestreo", "Atestiguamiento", "Draft Survey"];
const DEFAULT_EMPLOYEES = [
    { id: 1, name: "PEDRO GONZALEZ", role: "Supervisor", status: "Disponible", distanceScore: 8 },
    { id: 2, name: "JONNY FLORES", role: "Supervisor", status: "Disponible", distanceScore: 2 },
    { id: 3, name: "JORGE CEDEÑO", role: "Supervisor", status: "Disponible", distanceScore: 7 },
    { id: 4, name: "DIEGO RODRIGUEZ", role: "Supervisor", status: "Disponible", distanceScore: 5 },
    { id: 5, name: "DARIS PINTO", role: "Tecnico de Seguridad", status: "Disponible", distanceScore: 7 },
    { id: 6, name: "YENNYRES SUBERO", role: "Tecnico de Seguridad", status: "Disponible", distanceScore: 7 },
    { id: 7, name: "GRISBELYS ASTUDILLO", role: "Tecnico de Seguridad", status: "Disponible", distanceScore: 7 },
    { id: 8, name: "YUER MONTILLA", role: "Tecnico de Seguridad", status: "Disponible", distanceScore: 7 },
    { id: 9, name: "ALEXANDER MEDINA", role: "Inspector", status: "Disponible", distanceScore: 2 },
    { id: 10, name: "FABIAN SOTO", role: "Inspector", status: "Disponible", distanceScore: 3 },
    { id: 11, name: "AQUILES MAITA", role: "Inspector", status: "Disponible", distanceScore: 8 },
    { id: 12, name: "STEFANI ROJAS", role: "Inspector", status: "Disponible", distanceScore: 7 },
    { id: 13, name: "MARIA NORIEGA", role: "Inspector", status: "Disponible", distanceScore: 10 },
    { id: 14, name: "LEOMAR MARCANO", role: "Inspector", status: "Disponible", distanceScore: 7 },
    { id: 15, name: "JOEL RODRIGUEZ", role: "Inspector", status: "Disponible", distanceScore: 1 },
    { id: 16, name: "CARLOS FIGUERA", role: "Inspector", status: "Disponible", distanceScore: 1 },
    { id: 17, name: "ENRIQUE GONZALEZ", role: "Inspector", status: "Disponible", distanceScore: 6 },
    { id: 18, name: "KEINEL PALENCIA", role: "Inspector", status: "Disponible", distanceScore: 4 },
    { id: 19, name: "BRAYAN PEREZ", role: "Inspector", status: "Disponible", distanceScore: 6 },
    { id: 20, name: "CARLOS CORO", role: "Inspector", status: "Disponible", distanceScore: 8 },
    { id: 21, name: "JULIE PEÑA", role: "Inspector", status: "Egreso", distanceScore: 5 }
];

const DEFAULT_TABULADORES = {
    "Sidor": {
        "Buques/Gabarras": [
            { min: 0, max: 6000, roles: { "Supervisor": 50, "Tecnico de Seguridad": 50, "Inspector": 30 } },
            { min: 6001, max: 9000, roles: { "Supervisor": 100, "Tecnico de Seguridad": 100, "Inspector": 60 } },
            { min: 9001, max: 12000, roles: { "Supervisor": 150, "Tecnico de Seguridad": 150, "Inspector": 100 } },
            { min: 12001, max: 15000, roles: { "Supervisor": 190, "Tecnico de Seguridad": 190, "Inspector": 130 } },
            { min: 15001, max: 20000, roles: { "Supervisor": 260, "Tecnico de Seguridad": 260, "Inspector": 180 } },
            { min: 20001, max: 30000, roles: { "Supervisor": 390, "Tecnico de Seguridad": 390, "Inspector": 270 } },
            { min: 30001, max: 40000, roles: { "Supervisor": 520, "Tecnico de Seguridad": 520, "Inspector": 360 } },
            { min: 40001, max: 45000, roles: { "Supervisor": 580, "Tecnico de Seguridad": 580, "Inspector": 400 } },
            { min: 45001, max: 50000, roles: { "Supervisor": 650, "Tecnico de Seguridad": 650, "Inspector": 450 } },
            { min: 50001, max: 51000, roles: { "Supervisor": 660, "Tecnico de Seguridad": 660, "Inspector": 460 } },
            { min: 51001, max: 52000, roles: { "Supervisor": 676, "Tecnico de Seguridad": 676, "Inspector": 470 } },
            { min: 52001, max: 53000, roles: { "Supervisor": 689, "Tecnico de Seguridad": 689, "Inspector": 480 } },
            { min: 53001, max: 54000, roles: { "Supervisor": 700, "Tecnico de Seguridad": 700, "Inspector": 490 } },
            { min: 54001, max: 55000, roles: { "Supervisor": 715, "Tecnico de Seguridad": 715, "Inspector": 500 } },
        ]
    },
    "Copal": { "Buques/Gabarras": [{ min: 0, max: 6000, roles: { "Inspector": 30 } }, { min: 6001, max: 12000, roles: { "Inspector": 80 } }, { min: 12001, max: 20000, roles: { "Inspector": 120 } }, { min: 20001, max: 30000, roles: { "Inspector": 150 } }] },
    "Fmo": { "Buques/Gabarras": [{ min: 0, max: 6000, roles: { "Inspector": 30 } }, { min: 6001, max: 12000, roles: { "Inspector": 80 } }, { min: 12001, max: 20000, roles: { "Inspector": 120 } }, { min: 20001, max: 30000, roles: { "Inspector": 150 } }] },
    "Bauxilum": { "Buques/Gabarras": [{ min: 0, max: 6000, roles: { "Inspector": 30 } }, { min: 6001, max: 9000, roles: { "Inspector": 60 } }, { min: 9001, max: 12000, roles: { "Inspector": 100 } }, { min: 12001, max: 15000, roles: { "Inspector": 130 } }, { min: 15001, max: 20000, roles: { "Inspector": 180 } }, { min: 20001, max: 30000, roles: { "Inspector": 270 } }, { min: 30001, max: 40000, roles: { "Inspector": 360 } }, { min: 40001, max: 45000, roles: { "Inspector": 400 } }, { min: 45001, max: 50000, roles: { "Inspector": 450 } }, { min: 50001, max: 51000, roles: { "Inspector": 460 } }, { min: 51001, max: 52000, roles: { "Inspector": 470 } }, { min: 52001, max: 53000, roles: { "Inspector": 480 } }, { min: 53001, max: 54000, roles: { "Inspector": 490 } }, { min: 54001, max: 55000, roles: { "Inspector": 500 } }] }
};

const USER_ROLES = {
    "jose.solano@icglobal.com.ve": "manager",
    "frank.medina@icglobal.com.ve": "manager",
    "erick.patino@icglobal.com.ve": "adminglobal",
    "gilbert.gomez@icglobal.com.ve": "adminglobal",
    "rrhh@icglobal.com.ve": "rrhh",
    "administracion@icglobal.com.ve": "rrhh",
    "julissa@icglobal.com.ve": "rrhh",
    "asistentepzo@icglobal.com.ve": "asistente"
};

let appData = { employees: [...DEFAULT_EMPLOYEES], sites: [...DEFAULT_SITES], activities: [...DEFAULT_ACTIVITIES], records: {}, historical2025: {}, tabuladores: {...DEFAULT_TABULADORES} };
let currentEdit = { empId: null, dayIdx: null };
let isDirty = false;
let copiedRecordData = null;
let copiedSurvRecordData = null;
let dataLoaded = false;
let currentUserEmail = '';
let payrollViewMode = 'money'; // 'money' | 'hours'
let transRangeMonth = '';
let toastTimer = null;
const chartInstances = {};

/* =========================================
   UTILIDADES
========================================= */
function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const isTouch = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
const pad2 = n => String(n).padStart(2, '0');
function localISO(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function localHM(d) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }

function parsePeriod(p) {
    const parts = String(p || '').split(' ');
    return { mi: MONTHS_BASE.indexOf((parts[0] || '').toUpperCase()), year: parseInt(parts[1]) };
}
function periodYear(p) { return parsePeriod(p).year; }
function periodKey(p) { const { mi, year } = parsePeriod(p); return (isNaN(year) ? 0 : year) * 12 + mi; }
function daysInMonthOf(p) {
    const { mi, year } = parsePeriod(p);
    if (mi < 0 || isNaN(year)) return 31;
    return new Date(year, mi + 1, 0).getDate();
}
function currentPeriodName() { const n = new Date(); return `${MONTHS_BASE[n.getMonth()]} ${n.getFullYear()}`; }
function dayMeta(p, day) {
    const { mi, year } = parsePeriod(p);
    if (mi < 0 || isNaN(year)) return { invalid: day > 31, wk: '', weekend: false };
    if (day > daysInMonthOf(p)) return { invalid: true, wk: '', weekend: false };
    const dow = new Date(year, mi, day).getDay();
    return { invalid: false, wk: 'DLMMJVS'[dow], weekend: dow === 0 || dow === 6 };
}
function isTabActive(tab) { const el = document.getElementById('tab-' + tab); return !!(el && el.classList.contains('active')); }

function showToast(msg, type) {
    const toast = document.getElementById('toastNotif');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.toggle('error', type === 'error');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove('show'); }, type === 'error' ? 4500 : 2500);
}
function notify(msg) { showToast('⚠️ ' + String(msg).replace(/^⚠️\s*/, '').replace(/^ERROR:\s*/, ''), 'error'); }

function auditStamp() { return { updatedBy: currentUserEmail || 'desconocido', updatedAt: Date.now() }; }

function calcHours(activity, days) {
    const a = String(activity || '').toUpperCase();
    const base = (a.includes("MUESTREO") || a.includes("ATESTIGUAMIENTO") || a.includes("DRAFT")) ? 4 : 12;
    return Math.max(1, days) * base;
}

function sumPeriod(empId, p, withPhantom) {
    if (p === DEC_2025) return (appData.historical2025[empId] && appData.historical2025[empId].month) || 0;
    const row = appData.records[p] && appData.records[p][empId];
    if (!row) return 0;
    let s = 0;
    row.forEach(r => { if (r) { const v = parseFloat(r.amount) || 0; if (withPhantom || !r.isPhantom) s += v; } });
    return s;
}
function sumYear(empId, year, withPhantom) {
    if (year === 2025) return (appData.historical2025[empId] && appData.historical2025[empId].year) || 0;
    let s = 0;
    PERIODS.forEach(p => { if (periodYear(p) === year) s += sumPeriod(empId, p, withPhantom); });
    return s;
}
function yearSums(empId, year) {
    if (year === 2025) return { amt: sumYear(empId, 2025, false), hours: 0 };
    let amt = 0, hours = 0;
    PERIODS.forEach(p => {
        if (periodYear(p) !== year) return;
        const row = appData.records[p] && appData.records[p][empId];
        if (!row) return;
        row.forEach(r => { if (r && !r.isPhantom && parseFloat(r.amount) > 0) { amt += parseFloat(r.amount); hours += parseFloat(r.hours) || 0; } });
    });
    return { amt, hours };
}
function periodHasData(p) {
    const recs = appData.records[p];
    if (!recs) return false;
    return Object.values(recs).some(arr => arr && arr.some(r => r && parseFloat(r.amount) > 0));
}

function clearSpanAt(row, idx) {
    const c = row[idx];
    if (!c) return;
    let head = idx;
    if (c.linked) { for (let j = idx - 1; j >= 0; j--) { if (row[j] && !row[j].linked) { head = j; break; } } }
    const span = Math.max(1, (row[head] && row[head].span) || 1);
    for (let k = 0; k < span && head + k < row.length; k++) row[head + k] = null;
    row[idx] = null;
}

function hasConflict(row, s0, e0, ownStart, ownSpan) {
    for (let d = s0; d <= e0; d++) {
        if (row[d] && !(ownStart !== null && d >= ownStart && d < ownStart + ownSpan)) return true;
    }
    return false;
}
function normalizeRow(row) {
    const r = Array.isArray(row) ? row : [];
    while (r.length < DAYS_IN_MONTH) r.push(null);
    return r;
}

/* =========================================
   CARGA / GUARDADO (MEJORADO CON .UPDATE)
========================================= */

function showLoadWarning() {
    if (document.getElementById('loadBanner')) return;
    const b = document.createElement('div');
    b.id = 'loadBanner'; b.className = 'load-banner';
    b.textContent = '⚠️ MODO PROTEGIDO: no se pudieron leer los datos de la nube. No se guardará nada hasta que recargues la página.';
    const app = document.getElementById('mainApp');
    app.insertBefore(b, app.firstChild);
}

function init() {
    if (DATA_INCRUSTADA) { loadParsedData(DATA_INCRUSTADA, true); dataLoaded = true; return Promise.resolve(); }

    return database.ref('icg_master_data').once('value').then((snapshot) => {
        const saved = snapshot.val();
        if (saved) {
            try { loadParsedData(saved, false); dataLoaded = true; }
            catch (e) { console.error(e); dataLoaded = false; setupDefault(); showLoadWarning(); }
        } else {
            dataLoaded = true; 
            setupDefault();
        }
    }).catch((error) => {
        console.error("Error conectando a Firebase:", error);
        alert("Hubo un problema de conexión con la Nube. El sistema queda en MODO PROTEGIDO.");
        dataLoaded = false; setupDefault(); showLoadWarning();
    });
}

function dbUpdate(updatesObj, successMsg = "☁️ ✅ Guardado en la nube") {
    if (!dataLoaded) {
        notify('Modo protegido: NO se guardó nada en la nube.');
        return Promise.resolve();
    }
    setDirty(true);
    const cleanUpdates = JSON.parse(JSON.stringify(updatesObj));
    return database.ref('icg_master_data').update(cleanUpdates)
        .then(() => { setDirty(false); showToast(successMsg); })
        .catch((e) => { console.error(e); notify("⚠️ Error guardando en la Nube"); });
}

function fillPeriodSelectors(selected) {
    ['monthSelector', 'monthSelectorSug', 'monthSelectorSurv', 'monthSelectorTrans'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';
        PERIODS.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; el.appendChild(o); });
        if (selected) el.value = selected;
    });
}

function setupDefault() {
    PERIODS.forEach(p => { if (!appData.records[p]) appData.records[p] = {}; });
    const cur = currentPeriodName();
    fillPeriodSelectors(PERIODS.includes(cur) ? cur : PERIODS[PERIODS.length - 1]);
    renderConfigLists(); handleMonthChange();
}

function loadParsedData(parsed, isEmbedded) {
    if (!parsed.historical2025) parsed.historical2025 = {};
    if (!Array.isArray(parsed.employees)) parsed.employees = parsed.employees ? Object.values(parsed.employees) : [];
    if (!parsed.sites) parsed.sites = [];
    if (!parsed.activities) parsed.activities = [];
    if (!parsed.records) parsed.records = {};
    
    appData.tabuladores = parsed.tabuladores || {...DEFAULT_TABULADORES};

    const diegoEmp = parsed.employees.find(e => e.id == 4);
    if (diegoEmp && diegoEmp.status === "Fuera de Servicio") diegoEmp.status = "Egreso";

    // Auto-recuperar a Julie Peña si existe su histórico 2025 y falta en empleados
    if (parsed.historical2025 && (parsed.historical2025[21] || parsed.historical2025['21']) && !parsed.employees.some(e => e.id == 21)) {
        parsed.employees.push({ id: 21, name: "JULIE PEÑA", role: "Inspector", status: "Fuera de Servicio", distanceScore: 5 });
    }

    parsed.employees.forEach(e => {
        if (!e.status) e.status = "Disponible";
        if (e.distanceScore === undefined) {
            const defEmp = DEFAULT_EMPLOYEES.find(d => d.id === e.id);
            e.distanceScore = defEmp ? defEmp.distanceScore : 5;
        }
    });
    if (!Array.isArray(parsed.sites)) parsed.sites = Object.values(parsed.sites);
    if (!Array.isArray(parsed.activities)) parsed.activities = Object.values(parsed.activities);

    if (parsed.transporte) {
        Object.keys(parsed.transporte).forEach(k => {
            const v = parsed.transporte[k];
            parsed.transporte[k] = (Array.isArray(v) ? v : Object.values(v || {})).filter(Boolean);
        });
    }
    appData = parsed;
    appData.tabuladores = appData.tabuladores || {...DEFAULT_TABULADORES};

    buildPeriods();
    Object.keys(appData.records).forEach(kUp => {
        if (!PERIODS.includes(kUp)) PERIODS.push(kUp);
        Object.keys(appData.records[kUp]).forEach(eid => {
            let arr = appData.records[kUp][eid];
            if (!Array.isArray(arr) || arr.length < 31) {
                const newArr = Array(31).fill(null);
                if (Array.isArray(arr)) {
                    for (let i = 0; i < Math.min(arr.length, 31); i++) newArr[i] = arr[i] === undefined ? null : arr[i];
                } else if (arr && typeof arr === 'object') {
                    Object.keys(arr).forEach(k => {
                        const idx = parseInt(k);
                        if (!isNaN(idx) && idx >= 0 && idx < 31) newArr[idx] = arr[k] === undefined ? null : arr[k];
                    });
                }
                appData.records[kUp][eid] = newArr;
            }
        });
    });
    PERIODS.sort((a, b) => periodKey(a) - periodKey(b));

    let foundMonth = null;
    for (let i = PERIODS.length - 1; i >= 0; i--) { if (periodHasData(PERIODS[i])) { foundMonth = PERIODS[i]; break; } }
    const cur = currentPeriodName();
    const selected = foundMonth || (PERIODS.includes(cur) ? cur : PERIODS[PERIODS.length - 1]);
    fillPeriodSelectors(selected);

    if (isEmbedded) alert("✅ Datos cargados.");
    renderConfigLists(); handleMonthChange();
}

function syncMonths(val) {
    ['monthSelector', 'monthSelectorSug', 'monthSelectorSurv', 'monthSelectorTrans'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = val;
    });
    handleMonthChange();
    if (isTabActive('sugerencias')) renderSuggestions();
    if (isTabActive('surveyors')) renderSurveyorTable(val);
    if (isTabActive('transporte')) { updateTransDateRange(); }
}

function closeEditor() { document.getElementById('cellEditorModal').classList.remove('open'); }
function setDirty(val) { isDirty = val; const dot = document.getElementById('unsavedDot'); if (isDirty) dot.classList.add('visible'); else dot.classList.remove('visible'); }
window.addEventListener('beforeunload', e => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } });

function switchTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const btn = document.getElementById('nav-' + tab);
    if (btn) btn.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');

    if (tab === 'nomina') handleMonthChange();
    if (tab === 'sugerencias') renderSuggestions();
    if (tab === 'graficos') renderAllCharts();
    if (tab === 'analytics') renderAnalytics();
    if (tab === 'surveyors') renderSurveyorTable(document.getElementById('monthSelectorSurv').value);
    if (tab === 'registro') initQuickEntry();
    if (tab === 'transporte') {
        const selTrans = document.getElementById('monthSelectorTrans');
        if (transRangeMonth !== selTrans.value || !document.getElementById('transDateFrom').value) updateTransDateRange();
        else renderTransportTable();
    }
}

function handleMonthChange() {
    const period = document.getElementById('monthSelector').value;
    const tableContainer = document.getElementById('payrollTable');
    const decContainer = document.getElementById('dec2025Container');
    const totalDisplay = document.getElementById('monthlyTotalDisplay');
    document.getElementById('printHeaderTitle').innerText = "REPORTE DE NÓMINA - " + period;
    if (period === DEC_2025) {
        tableContainer.style.display = 'none'; decContainer.style.display = 'block'; totalDisplay.style.visibility = 'hidden';
        renderDec2025();
    } else {
        tableContainer.style.display = 'table'; decContainer.style.display = 'none'; totalDisplay.style.visibility = 'visible';
        renderTable(period);
    }
}

function renderDec2025() {
    const tbody = document.getElementById('dec2025Body'); tbody.innerHTML = '';
    appData.employees.forEach(emp => {
        const hist = appData.historical2025[emp.id] || { month: 0, year: 0 };
        const tr = document.createElement('tr'); tr.className = 'dec2025-row';
        tr.innerHTML = `<td style="padding:10px; border-bottom:1px solid #eee;"><b>${esc(emp.name)}</b><br><small style="color:#64748b">${esc(emp.role)}</small></td><td style="padding:10px; text-align:right; border-bottom:1px solid #eee;"><input type="number" class="dec2025-input" value="${hist.month}" onchange="saveDec2025(${emp.id}, 'month', this.value)"></td><td style="padding:10px; text-align:right; border-bottom:1px solid #eee;"><input type="number" class="dec2025-input" value="${hist.year}" onchange="saveDec2025(${emp.id}, 'year', this.value)" style="color:var(--accent); font-weight:bold;"></td>`;
        tbody.appendChild(tr);
    });
}
function saveDec2025(empId, field, val) {
    if (!appData.historical2025[empId]) appData.historical2025[empId] = { month: 0, year: 0 };
    appData.historical2025[empId][field] = parseFloat(val) || 0; 
    dbUpdate({ [`historical2025/${empId}`]: appData.historical2025[empId] });
}

/* =========================================
   NÓMINA
========================================= */
function siteColor(s) {
    if (!s) return "#64748b";
    const str = String(s).toUpperCase().trim();

    const KNOWN_SITES = {
        "SIDOR": "#2563eb",           // Azul Real
        "BAUXILUM": "#d97706",         // Ámbar / Naranja
        "FMO": "#0284c7",              // Celeste / Cyan
        "COPAL": "#16a34a",            // Verde Esmeralda
        "PALUA": "#dc2626",            // Rojo
        "PUNTA DE PIEDRAS": "#c026d3",  // Magenta / Rosa
        "VENALUM": "#ea580c",          // Naranja Intenso
        "CASITERITA": "#059669",       // Verde Menta / Turquesa
        "ORINOCO IRON": "#4f46e5",     // Índigo
        "LABORATORIO": "#7c3aed"       // Violeta
    };

    if (KNOWN_SITES[str]) return KNOWN_SITES[str];

    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    const hue = (hash * 137.508) % 360;
    
    return `hsl(${Math.floor(hue)}, 75%, 40%)`;
}

function buildTooltip(rec) {
    const amt = parseFloat(rec.amount) || 0;
    return [
        `💵 $${amt}`,
        `📍 ${rec.site || rec.muelle || '-'}`,
        `⚓ ${rec.activity || '-'}`,
        `🕒 ${rec.shift || '-'}`,
        `📅 Días: ${rec.span || 1}`,
        rec.hours ? `⏱️ Horas: ${rec.hours}` : null,
        rec.obs ? `📝 NOTA: ${rec.obs}` : null
    ].filter(Boolean).join('\n');
}

function matchesPayrollFilter(emp, period, filter) {
    if (!filter) return true;
    if (emp.name.toUpperCase().includes(filter) || emp.role.toUpperCase().includes(filter)) return true;
    const userRecs = (appData.records[period] && appData.records[period][emp.id]) || [];
    return userRecs.some(rec => {
        if (!rec) return false;
        const act = rec.activity && rec.activity.toUpperCase().includes(filter);
        const loc = (rec.site || rec.location || rec.muelle || '').toUpperCase().includes(filter);
        const obs = (rec.obs || rec.vessel || '').toUpperCase().includes(filter);
        return act || loc || obs;
    });
}

function cellClick(td, eid, i, kind) {
    selectCell(td);
    if (isTouch()) { if (kind === 'surv') openSurvEditor(eid, i); else openEditor(eid, i); }
}


function setPayrollViewMode(mode) {
    payrollViewMode = mode;
    const btnMoney = document.getElementById('btnModeMoney');
    const btnHours = document.getElementById('btnModeHours');
    if (btnMoney && btnHours) {
        btnMoney.classList.toggle('active', mode === 'money');
        btnHours.classList.toggle('active', mode === 'hours');
    }
    const p = document.getElementById('monthSelector').value;
    renderTable(p);
}

function renderTable(period) {
    const tbody = document.getElementById('tableBody'); const thead = document.getElementById('tableHeader');
    const printBody = document.getElementById('printBody');
    tbody.innerHTML = ''; printBody.innerHTML = '';
    if (!appData.records[period]) appData.records[period] = {};
    const filter = document.getElementById('searchPayroll').value.toUpperCase();
    const isHours = (payrollViewMode === 'hours');

    let h = `<th class="sticky-col sticky-col-header" style="text-align:left; min-width:140px;">EMPLEADO</th>`;
    for (let i = 1; i <= DAYS_IN_MONTH; i++) {
        const m = dayMeta(period, i);
        h += `<th class="day-col${m.weekend ? ' day-weekend' : ''}${m.invalid ? ' day-invalid' : ''}"><div>${i}</div><div class="wk">${m.wk}</div></th>`;
    }
    const col1Title = isHours ? 'TOTAL HORAS' : 'TOTAL MES';
    const col2Title = isHours ? 'ACUM. HORAS' : 'ACUM. ANUAL';
    h += `<th class="col-total center-text">${col1Title}</th><th class="col-total-year center-text">${col2Title}</th>`;
    thead.innerHTML = h;

    // Update Print Header Title if in hours mode
    const printTitleEl = document.getElementById('printHeaderTitle');
    if (printTitleEl) {
        printTitleEl.innerText = isHours ? 'REPORTE DE HORAS TRABAJADAS' : 'REPORTE DE NÓMINA';
    }

    let grandTotal = 0; const year = periodYear(period); const usedSites = new Set();

    appData.employees.forEach(emp => {
        if (emp.role === "Surveyor") return;
        if (!matchesPayrollFilter(emp, period, filter)) return;
        if (!appData.records[period][emp.id]) appData.records[period][emp.id] = Array(DAYS_IN_MONTH).fill(null);
        const row = appData.records[period][emp.id];
        let mTotal = 0; let mHours = 0; let cells = '';

        for (let i = 0; i < DAYS_IN_MONTH; i++) {
            const rec = row[i]; const m = dayMeta(period, i + 1);
            if (rec && rec.span > 1) {
                const phantomClass = rec.isPhantom ? 'phantom-cell' : '';
                const shiftIcon = rec.isPhantom ? '🚫' : (rec.shift === 'Diurno' ? '☀️' : (rec.shift === 'Nocturno' ? '🌙' : ''));
                const amtNum = parseFloat(rec.amount) || 0;
                const hoursNum = parseFloat(rec.hours) || 0;
                const stripe = (!rec.isPhantom && rec.site) ? `box-shadow: inset 0 -3px 0 ${siteColor(rec.site)};` : '';
                if (!rec.isPhantom && rec.site) usedSites.add(rec.site);

                const valDisplay = isHours ? `${hoursNum}h` : `$${amtNum}`;
                cells += `<td colspan="${rec.span}" class="data-cell merged-cell ${phantomClass}" style="${stripe}" data-tooltip="${esc(buildTooltip(rec))}" onclick="cellClick(this, ${emp.id}, ${i}, 'nom')" ondblclick="openEditor(${emp.id}, ${i})">${rec.obs ? '<div class="obs-dot"></div>' : ''}<div class="cell-amt" style="${isHours ? 'color:#0284c7; font-weight:700;' : ''}">${valDisplay}</div><div class="cell-sub">${shiftIcon} ${esc(rec.activity)}</div></td>`;
                if (!rec.isPhantom) { mTotal += amtNum; mHours += hoursNum; }
                i += (rec.span - 1);
            } else if (rec && rec.linked) {
                cells += `<td class="data-cell" style="background:#f1f5f9;">-</td>`;
            } else {
                const amt = rec ? (parseFloat(rec.amount) || 0) : 0;
                const hoursNum = rec ? (parseFloat(rec.hours) || 0) : 0;
                if (!rec || !rec.isPhantom) { mTotal += amt; mHours += hoursNum; }
                if (!rec && m.invalid) { cells += `<td class="data-cell day-col day-invalid"></td>`; continue; }
                const phantomClass = (rec && rec.isPhantom) ? 'phantom-cell' : '';
                let shiftIcon = '';
                if (rec && rec.isPhantom) shiftIcon = '<span style="font-size:0.6rem;">🚫</span>';
                else if (rec && rec.shift === 'Diurno') shiftIcon = '<span class="shift-day" style="font-size:0.6rem;">☀</span>';
                else if (rec && rec.shift === 'Nocturno') shiftIcon = '<span class="shift-night" style="font-size:0.6rem;">☾</span>';
                const stripe = (rec && !rec.isPhantom && (amt > 0 || hoursNum > 0) && rec.site) ? `style="box-shadow: inset 0 -3px 0 ${siteColor(rec.site)};"` : '';
                if (rec && !rec.isPhantom && (amt > 0 || hoursNum > 0) && rec.site) usedSites.add(rec.site);
                const tip = (rec && (amt > 0 || hoursNum > 0)) ? ` data-tooltip="${esc(buildTooltip(rec))}"` : '';

                let cellDisplay = '';
                if (isHours) {
                    cellDisplay = (rec && rec.isPhantom) ? '🚫' : (hoursNum > 0 ? `${hoursNum}h` : '');
                } else {
                    cellDisplay = amt > 0 ? amt : '';
                }

                cells += `<td class="data-cell day-col ${(amt > 0 || hoursNum > 0) ? 'has-data' : ''} ${phantomClass} ${m.weekend ? 'wk-end' : ''}" ${stripe}${tip} onclick="cellClick(this, ${emp.id}, ${i}, 'nom')" ondblclick="openEditor(${emp.id}, ${i})">${(rec && rec.obs) ? '<div class="obs-dot"></div>' : ''}${cellDisplay}${shiftIcon}</td>`;
            }
        }

        const ys = yearSums(emp.id, year);
        const col1Val = isHours ? `${mHours}h` : mTotal;
        const col2Val = isHours ? `${ys.hours}h` : ys.amt;
        grandTotal += isHours ? mHours : mTotal;

        if ((emp.status === "Fuera de Servicio" || emp.status === "Egreso") && mTotal === 0 && mHours === 0) return;

        const tr = document.createElement('tr');
        if (emp.status === "Fuera de Servicio" || emp.status === "Egreso") tr.className = 'inactive-row';
        tr.innerHTML = `<td class="sticky-col" style="text-align:left; padding-left:10px;"><div style="font-weight:600; font-size:0.8rem;">${esc(emp.name)}</div><div style="font-size:0.65rem; color:#64748b">${esc(emp.role)}</div></td>${cells}<td class="total-cell-month center-text" style="${isHours ? 'color:#0284c7;' : ''}">${col1Val}</td><td class="total-cell-year center-text" style="${isHours ? 'color:#0284c7;' : ''}">${col2Val}</td>`;
        tbody.appendChild(tr);

        const trPrint = document.createElement('tr');
        const printCol1 = isHours ? `${mHours} h` : `$${mTotal.toLocaleString()}`;
        const printCol2 = isHours ? `${ys.hours} h` : `$${ys.amt.toLocaleString()}`;
        trPrint.innerHTML = `<td>${esc(emp.name)}<br><small style="font-style:italic;">${esc(emp.role)}</small></td><td class="text-center">${printCol1}</td><td class="text-center">${printCol2}</td>`;
        printBody.appendChild(trPrint);
    });

    const totalLabel = isHours ? `${grandTotal.toLocaleString()} h` : `${grandTotal.toLocaleString()}`;
    document.getElementById('monthTotal').innerText = totalLabel;

    let legend = document.getElementById('siteLegend');
    if (!legend) {
        legend = document.createElement('div'); legend.id = 'siteLegend'; legend.className = 'site-legend';
        document.querySelector('#tab-nomina .table-wrapper').insertAdjacentElement('beforebegin', legend);
    }
    legend.innerHTML = usedSites.size 
    ? '<strong style="margin-right:10px;">Franja inferior = sitio:</strong>' + 
      [...usedSites].sort().map(s => 
          `<span style="display:inline-flex; align-items:center; gap:5px; margin-right:14px; font-size:0.8rem; font-weight:500;">
              <i style="display:inline-block; width:12px; height:12px; border-radius:2px; background:${siteColor(s)}; border:1px solid rgba(0,0,0,0.15);"></i>${esc(s)}
           </span>`
      ).join('') 
    : '';
}

function selectCell(cell) { document.querySelectorAll('.selected-cell').forEach(c => c.classList.remove('selected-cell')); cell.classList.add('selected-cell'); }

function updateCalculatedHours() {
    const startD = parseInt(document.getElementById('editorStartDay').value) || 1;
    const endD = parseInt(document.getElementById('editorEndDay').value) || startD;
    document.getElementById('editorHours').value = calcHours(getSelectVal('editorActivity'), (endD - startD) + 1);
}

function openEditor(eid, dix) {
    currentEdit = { empId: eid, dayIdx: dix };
    const p = document.getElementById('monthSelector').value;
    const emp = appData.employees.find(e => e.id == eid);
    if (!appData.records[p][eid]) appData.records[p][eid] = Array(DAYS_IN_MONTH).fill(null);
    const rec = appData.records[p][eid][dix];
    document.getElementById('modalTitle').innerText = `${emp.name}`;
    let start = dix + 1; let end = dix + 1; let val = rec ? (parseFloat(rec.amount) || '') : '';
    if (rec && rec.span > 1) { end = start + rec.span - 1; }
    document.getElementById('editorStartDay').value = start;
    document.getElementById('editorEndDay').value = end;
    document.getElementById('editorEndDay').max = daysInMonthOf(p);
    document.getElementById('editorAmount').value = val;
    document.getElementById('editorShift').value = rec ? rec.shift : 'Diurno';
    document.getElementById('editorObs').value = rec ? (rec.obs || '') : '';
    document.getElementById('editorPhantom').checked = rec ? (rec.isPhantom || false) : false;

    fillSelect('editorRole', ROLES.filter(r => r !== 'Surveyor'), rec ? rec.role : emp.role);
    fillSelectOther('editorSite', appData.sites, rec ? rec.site : '');
    fillSelectOther('editorActivity', appData.activities, rec ? rec.activity : '');

    if (rec && rec.hours !== undefined) document.getElementById('editorHours').value = rec.hours;
    else updateCalculatedHours();

    document.getElementById('editorActivity').onchange = function () { checkOther('Activity'); updateCalculatedHours(); };
    document.getElementById('editorEndDay').onchange = updateCalculatedHours;
    document.getElementById('cellEditorModal').classList.add('open');
}

function copyRecord() {
    copiedRecordData = {
        span: parseInt(document.getElementById('editorEndDay').value) - parseInt(document.getElementById('editorStartDay').value),
        hours: document.getElementById('editorHours').value,
        amount: document.getElementById('editorAmount').value,
        role: document.getElementById('editorRole').value,
        site: document.getElementById('editorSite').value,
        siteOther: document.getElementById('editorSiteOther').value,
        activity: document.getElementById('editorActivity').value,
        activityOther: document.getElementById('editorActivityOther').value,
        obs: document.getElementById('editorObs').value,
        isPhantom: document.getElementById('editorPhantom').checked
    };
    showToast("📋 ¡Copiado! Ahora abre otra casilla y dale Pegar.");
}

function pasteRecord() {
    if (!copiedRecordData) { notify("No has copiado ninguna guardia todavía."); return; }
    const p = document.getElementById('monthSelector').value;
    const startD = parseInt(document.getElementById('editorStartDay').value);
    let newEnd = startD + copiedRecordData.span;
    const dim = daysInMonthOf(p);
    if (newEnd > dim) newEnd = dim;
    document.getElementById('editorEndDay').value = newEnd;
    document.getElementById('editorHours').value = copiedRecordData.hours || '';
    document.getElementById('editorAmount').value = copiedRecordData.amount;
    document.getElementById('editorRole').value = copiedRecordData.role;
    document.getElementById('editorSite').value = copiedRecordData.site;
    if (copiedRecordData.site === 'OTRO') {
        document.getElementById('editorSiteOther').value = copiedRecordData.siteOther;
        document.getElementById('editorSiteOther').classList.add('visible');
    } else { document.getElementById('editorSiteOther').classList.remove('visible'); }

    document.getElementById('editorActivity').value = copiedRecordData.activity;
    if (copiedRecordData.activity === 'OTRO') {
        document.getElementById('editorActivityOther').value = copiedRecordData.activityOther;
        document.getElementById('editorActivityOther').classList.add('visible');
    } else { document.getElementById('editorActivityOther').classList.remove('visible'); }

    document.getElementById('editorObs').value = copiedRecordData.obs;
    document.getElementById('editorPhantom').checked = copiedRecordData.isPhantom || false;
    showToast("📥 Datos pegados. ¡Verifica el Turno y dale Guardar!");
}

function deleteRecord() {
    if (!confirm("⚠️ ¿Estás seguro de querer BORRAR esta guardia por completo?")) return;
    const p = document.getElementById('monthSelector').value;
    const startD = parseInt(document.getElementById('editorStartDay').value) - 1;
    const row = normalizeRow(appData.records[p][currentEdit.empId]);
    appData.records[p][currentEdit.empId] = row;
    clearSpanAt(row, startD);
    dbUpdate({ [`records/${p}/${currentEdit.empId}`]: row }, "🗑️ Guardia eliminada con éxito").then(() => {
        closeEditor(); renderTable(p);
    });
}

function saveEditor() {
    const startD = parseInt(document.getElementById('editorStartDay').value);
    const endD = parseInt(document.getElementById('editorEndDay').value);
    const amount = parseFloat(document.getElementById('editorAmount').value);
    const p = document.getElementById('monthSelector').value;
    const dim = daysInMonthOf(p);
    if (!endD) { notify("Indica el día final."); return; }
    if (endD > dim) { notify(`${p} solo tiene ${dim} días.`); return; }
    if (endD < startD) { notify("Fecha final menor a inicial."); return; }

    const userRow = normalizeRow(appData.records[p][currentEdit.empId]);
    appData.records[p][currentEdit.empId] = userRow;

    const oldRec = userRow[currentEdit.dayIdx];
    const oldSpan = oldRec ? (oldRec.span || 1) : 1;

    if (amount > 0 && hasConflict(userRow, startD - 1, endD - 1, currentEdit.dayIdx, oldSpan)) {
        if (!confirm("⚠️ En esos días ya existe otra guardia para este empleado.\n\n¿Quieres REEMPLAZARLA? (Se borrará la guardia anterior completa)")) return;
    }

    for (let d = 0; d < oldSpan; d++) { if (currentEdit.dayIdx + d < 31) userRow[currentEdit.dayIdx + d] = null; }
    for (let d = startD - 1; d <= endD - 1; d++) clearSpanAt(userRow, d);

    const span = endD - startD + 1;
    if (amount > 0) {
        const commonData = {
            role: document.getElementById('editorRole').value,
            site: getSelectVal('editorSite'),
            activity: getSelectVal('editorActivity'),
            shift: document.getElementById('editorShift').value,
            obs: document.getElementById('editorObs').value,
            isPhantom: document.getElementById('editorPhantom').checked,
            hours: parseFloat(document.getElementById('editorHours').value) || 0,
            ...auditStamp()
        };
        userRow[startD - 1] = { amount: amount, span: span, ...commonData };
        for (let k = 1; k < span; k++) { userRow[startD - 1 + k] = { amount: 0, linked: true, span: 0, ...commonData }; }
    }
    dbUpdate({ [`records/${p}/${currentEdit.empId}`]: userRow }).then(() => {
        closeEditor(); renderTable(p);
    });
}

/* =========================================
   SUGERENCIAS DE GUARDIAS
========================================= */
function renderSuggestions() {
    const grid = document.getElementById('suggestionGrid'); grid.innerHTML = '';
    const p = document.getElementById('monthSelectorSug').value;
    const year = periodYear(p);
    const pIdx = PERIODS.indexOf(p);
    const prevP = pIdx > 0 ? PERIODS[pIdx - 1] : null;

    const info = document.querySelector('#tab-sugerencias .legend-info');
    if (info && !document.getElementById('sugNote')) {
        const n = document.createElement('div'); n.id = 'sugNote'; n.style.cssText = 'margin-top:6px; color:#64748b;';
        n.innerHTML = '<em>Los montos mostrados son dinero real; para ordenar, el sistema también cuenta las ausencias no justificadas (así quien faltó no sube de prioridad por ello).</em>';
        info.appendChild(n);
    }

    const isHighDistanceEnGuardia = appData.employees.some(e => e.status === "En Guardia" && (e.distanceScore || 5) >= 8);
    const LIMITE_BRECHA = 150;

    ROLES.forEach(role => {
        const group = appData.employees.filter(e => e.role === role);
        const activeGroup = group.filter(e => e.status !== "Vacaciones" && e.status !== "Reposo" && e.status !== "Fuera de Servicio" && e.status !== "Egreso");

        const ranking = activeGroup.map(emp => {
            const r = {
                name: emp.name, status: emp.status, distance: emp.distanceScore || 5, lastOp: getLastOperationalShift(emp.id),
                cur: sumPeriod(emp.id, p, false), prev: prevP ? sumPeriod(emp.id, prevP, false) : 0, ann: sumYear(emp.id, year, false),
                curRank: sumPeriod(emp.id, p, true), prevRank: prevP ? sumPeriod(emp.id, prevP, true) : 0, annRank: sumYear(emp.id, year, true)
            };
            r.score = r.curRank + r.prevRank + ((isHighDistanceEnGuardia && r.distance >= 8) ? LIMITE_BRECHA : 0);
            return r;
        });

        ranking.sort((a, b) => {
            const busyA = a.status === "En Guardia", busyB = b.status === "En Guardia";
            if (busyA !== busyB) return busyA ? 1 : -1;
            if (a.score !== b.score) return a.score - b.score;
            return a.annRank - b.annRank;
        });

        const thresh = role === 'Inspector' ? 4 : 2;
        let rows = '';
        ranking.forEach((r, i) => {
            const isLow = (i < thresh && r.status !== "En Guardia");
            let nextInfo;
            if (r.lastOp) nextInfo = `<span class="shift-info">Últ: <span class="badge-shift ${r.lastOp.shift === 'Diurno' ? 'shift-day' : 'shift-night'}">${r.lastOp.shift.substring(0, 1)}</span> (${esc(r.lastOp.activity.substring(0, 6))}..)</span>`;
            else nextInfo = '<span class="shift-info" style="color:#cbd5e1">-</span>';
            const statusBadge = r.status === "En Guardia" ? `<span class="badge-status-busy">⚠️ OCUPADO</span>` : '';
            const distanceBadge = r.distance >= 8 ? `<span title="Distancia: ${r.distance}/10" style="font-size:0.7rem;">🚗 Lejos</span> ` : '';
            rows += `<tr style="${r.status === 'En Guardia' ? 'background:#fffbeb; opacity:0.7' : ''}"><td>${statusBadge} ${isLow ? '<span class="badge-low">BAJO</span> ' : ''}<b>${esc(r.name)}</b> ${distanceBadge}${nextInfo}</td><td class="money" style="color:${r.cur < 1 ? '#dc2626' : '#16a34a'}">$${r.cur}</td><td class="money prev-month">$${r.prev}</td><td class="money" style="color:var(--accent)">$${r.ann}</td></tr>`;
        });

        const card = document.createElement('div'); card.className = 'dash-card';
        card.id = `card-sug-${role}`;
        card.innerHTML = `<div class="dash-title">${esc(role)}</div><table class="rank-table" id="table-sug-${role}"><thead><tr><th>Nombre</th><th>Mes Actual</th><th>Mes Ant.</th><th>Anual</th></tr></thead><tbody>${rows}</tbody></table>`;
        grid.appendChild(card);
    });
}

function printSuggestions() {
    const printArea = document.getElementById('printSuggestionsSection');
    const p = document.getElementById('monthSelectorSug').value;
    printArea.innerHTML = '';

    let html = `<div class="sug-header">REPORTE DE ASIGNACIÓN DE GUARDIAS</div>`;
    html += `<div class="sug-sub">Generado el: ${new Date().toLocaleDateString()} | Periodo Base: ${esc(p)}</div>`;
    html += `<div style="font-size:9pt; margin-bottom:15px;"><i>Nota: Ordenados por prioridad de asignación.</i></div>`;

    const pluralMap = { "Supervisor": "Supervisores", "Tecnico de Seguridad": "Técnicos de Seguridad", "Inspector": "Inspectores", "Surveyor": "Surveyors" };

    ROLES.forEach(role => {
        const cardTable = document.getElementById(`table-sug-${role}`);
        if (cardTable) {
            const title = pluralMap[role] || role + "s";
            html += `<div class="print-block"><h3 style="margin-bottom:5px; border-bottom:1px solid #ccc; page-break-after: avoid;">${title}</h3><table class="sug-print-table"><thead><tr style="background:#f1f5f9;"><th>Nombre</th><th style="text-align:right;">Mes Actual</th><th style="text-align:right;">Mes Ant.</th><th style="text-align:right;">Anual</th><th>Última Actividad</th><th>Estatus</th></tr></thead><tbody>`;

            cardTable.querySelectorAll('tbody tr').forEach(r => {
                const cells = r.querySelectorAll('td');
                const nameText = cells[0].querySelector('b').innerText;
                const lastTurn = cells[0].querySelector('.shift-info') ? cells[0].querySelector('.shift-info').innerText : '-';
                const busy = !!cells[0].querySelector('.badge-status-busy');
                const isLejos = cells[0].innerHTML.includes('🚗 Lejos');
                const printDistance = isLejos ? ' <span style="font-size:7pt; border:1px solid #ccc; padding:1px 3px; border-radius:3px; color:#b45309; background:#fffbeb; margin-left:5px;">🚗 Lejos</span>' : '';
                html += `<tr><td><b>${esc(nameText)}</b>${printDistance}</td><td style="text-align:right;">${esc(cells[1].innerText)}</td><td style="text-align:right;">${esc(cells[2].innerText)}</td><td style="text-align:right;">${esc(cells[3].innerText)}</td><td>${esc(lastTurn)}</td><td>${busy ? '<span class="badge-print">OCUPADO</span>' : 'DISPONIBLE'}</td></tr>`;
            });
            html += `</tbody></table></div>`;
        }
    });
    printArea.innerHTML = html;
    document.body.classList.add('printing-suggestions'); window.print(); document.body.classList.remove('printing-suggestions');
}
function printPayroll() { document.body.classList.add('printing-payroll'); window.print(); document.body.classList.remove('printing-payroll'); }

/* =========================================
   REPORTE GERENCIAL
========================================= */
function emptyRoleObj() { return { 'Supervisor': 0, 'Tecnico de Seguridad': 0, 'Inspector': 0, 'Surveyor': 0 }; }
function capPeriodKey(p) { const { mi, year } = parsePeriod(p); return mi < 0 ? p : `${MESES_CAP[mi]} ${year}`; }
function transportTotalOf(p) {
    const arr = appData.transporte && appData.transporte[capPeriodKey(p)];
    return Array.isArray(arr) ? arr.reduce((s, v) => s + (parseFloat(v.monto) || 0), 0) : 0;
}

function renderAnalytics() {
    const stats = {}; const siteMap = {}; const monthStats = {};
    const ensureYear = y => { if (!stats[y]) stats[y] = { total: 0, roles: emptyRoleObj() }; return stats[y]; };
    ensureYear(2025); ensureYear(2026);

    appData.employees.forEach(emp => {
        const hist = appData.historical2025[emp.id];
        if (hist && hist.year > 0) {
            const s = ensureYear(2025); s.total += hist.year;
            if (s.roles[emp.role] !== undefined) s.roles[emp.role] += hist.year;
        }
    });

    PERIODS.forEach(p => {
        const recs = appData.records[p];
        if (!recs) return;
        const year = periodYear(p);
        const ys = ensureYear(year);
        if (year > 2025 && !monthStats[p]) monthStats[p] = { total: 0, roles: emptyRoleObj(), hours: 0, absences: 0 };
        Object.keys(recs).forEach(eId => {
            const emp = appData.employees.find(x => x.id == eId);
            if (!emp) return;
            (recs[eId] || []).forEach(r => {
                if (!r) return;
                const amtNum = parseFloat(r.amount) || 0;
                if (r.isPhantom) { if (r.span > 0 && amtNum > 0 && monthStats[p]) monthStats[p].absences++; return; }
                if (amtNum <= 0) return;
                ys.total += amtNum;
                const actualRole = r.role || emp.role;
                if (ys.roles[actualRole] !== undefined) ys.roles[actualRole] += amtNum;
                if (monthStats[p]) {
                    monthStats[p].total += amtNum;
                    monthStats[p].hours += parseFloat(r.hours) || 0;
                    if (monthStats[p].roles[actualRole] !== undefined) monthStats[p].roles[actualRole] += amtNum;
                }
                const siteName = r.site || r.muelle || '(Sin sitio)';
                siteMap[siteName] = (siteMap[siteName] || 0) + amtNum;
            });
        });
    });

    const years = Object.keys(stats).map(Number).sort((a, b) => a - b).filter(y => y === 2025 || y === 2026 || stats[y].total > 0 || y === new Date().getFullYear());
    document.getElementById('analyticsContainer').innerHTML = years.map(y => renderYearCard(y, stats[y])).join('');

    renderMonthlyAnalytics();
    renderDispersion(document.getElementById('monthlyAnalyticsContainer'));
    renderSitesChart();
    renderAnalyticsCharts();
}

function renderSitesChart() {
    const container = document.getElementById('sitesChart');
    if (!container || !appData || !appData.records) return;

    const siteTotals = {};
    Object.keys(appData.records).forEach(period => {
        Object.keys(appData.records[period]).forEach(empId => {
            const row = appData.records[period][empId];
            if (Array.isArray(row)) {
                row.forEach(rec => {
                    if (rec && (rec.site || rec.muelle) && !rec.isPhantom) {
                        const site = (rec.site || rec.muelle || '').trim() || '(Sin sitio)';
                        const amt = Number(rec.amount) || 0;
                        siteTotals[site] = (siteTotals[site] || 0) + amt;
                    }
                });
            }
        });
    });

    const sortedSites = Object.entries(siteTotals).sort((a, b) => b[1] - a[1]);
    const maxAmount = sortedSites.length > 0 ? sortedSites[0][1] : 1;

    let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
    sortedSites.forEach(([site, amount]) => {
        const pct = Math.max((amount / maxAmount) * 100, 1);
        const nameClean = esc(site);
        
        html += `
            <div class="bar-chart-row" style="display:flex; align-items:center; margin-bottom:6px;">
                <span class="bar-label" style="width:130px; text-align:right; padding-right:10px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${nameClean}">${nameClean}</span>
                <div class="bar-track" style="flex:1; background:#f1f5f9; height:22px; border-radius:4px; overflow:hidden;">
                    <div class="bar-fill" style="width:${pct}%; height:100%; background:var(--accent); border-radius:4px;"></div>
                </div>
                <span class="bar-value" style="color:#1e293b; font-weight:700; min-width:75px; text-align:right; margin-left:10px; font-size:0.85rem;">
                    $${Number(amount).toLocaleString()}
                </span>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderMonthlyAnalytics() {
    const container = document.getElementById('monthlyAnalyticsContainer');
    if (!container || !appData || !appData.records) return;

    let html = '';
    const sortedPeriods = [...PERIODS].filter(p => p !== DEC_2025).sort((a, b) => periodKey(a) - periodKey(b));

    sortedPeriods.forEach((period, idx) => {
        const recs = appData.records[period];
        if (!recs) return;

        let totalMes = 0;
        let hoursTotal = 0;
        let absencesCount = 0;
        const roleTotals = emptyRoleObj();

        Object.keys(recs).forEach(empId => {
            const row = recs[empId];
            if (Array.isArray(row)) {
                row.forEach(rec => {
                    if (!rec) return;
                    const amt = parseFloat(rec.amount) || 0;
                    if (rec.isPhantom) {
                        if (rec.span > 0 && amt > 0) absencesCount++;
                        return;
                    }
                    if (amt <= 0) return;
                    totalMes += amt;
                    hoursTotal += parseFloat(rec.hours) || 0;
                    const role = rec.role || 'Otros';
                    if (roleTotals[role] !== undefined) roleTotals[role] += amt;
                });
            }
        });

        if (totalMes === 0) return;

        // --- CÁLCULO DE TOTALES DEL MES ANTERIOR (PARA EL MES Y PARA CADA CARGO) ---
        let prevTotal = 0;
        const prevRoleTotals = {};

        if (idx > 0) {
            const prevPeriod = sortedPeriods[idx - 1];
            if (appData.records[prevPeriod]) {
                Object.values(appData.records[prevPeriod]).forEach(row => {
                    if (Array.isArray(row)) {
                        row.forEach(r => {
                            if (r && r.amount && !r.isPhantom) {
                                const amt = parseFloat(r.amount) || 0;
                                const role = r.role || 'Otros';
                                prevTotal += amt;
                                prevRoleTotals[role] = (prevRoleTotals[role] || 0) + amt;
                            }
                        });
                    }
                });
            }
        }

        // --- ETIQUETA DEL TOTAL DEL MES (SUBIDA / BAJADA GLOBAL) ---
        let momHtml = '';
        if (prevTotal > 0) {
            const diffPct = (((totalMes - prevTotal) / prevTotal) * 100).toFixed(1);
            const isUp = diffPct >= 0;
            const color = isUp ? '#16a34a' : '#dc2626';
            const bgColor = isUp ? '#f0fdf4' : '#fef2f2';
            const icon = isUp ? '▲' : '▼';
            
            momHtml = `
                <div style="display:inline-flex; align-items:center; gap:4px; font-size:0.78rem; font-weight:700; color:${color}; background:${bgColor}; padding:3px 8px; border-radius:12px; margin-bottom:8px;">
                    <span>${icon}</span>
                    <span>${Math.abs(diffPct)}% vs mes anterior</span>
                </div>`;
        }

        // --- FILAS POR CARGO CON % DEL MES Y VARIACIÓN COLORIZADA VS MES ANTERIOR ---
        let rolesHtml = '';
        Object.entries(roleTotals).forEach(([roleName, roleAmt]) => {
            if (roleAmt <= 0) return;
            
            // 1. Porcentaje que representa este cargo dentro del gasto del mes
            const rolePct = ((roleAmt / (totalMes || 1)) * 100).toFixed(1);
            
            // 2. Comparativa individual de este cargo vs mes anterior
            let roleMomHtml = '';
            const prevRoleAmt = prevRoleTotals[roleName] || 0;

            if (prevRoleAmt > 0) {
                const diffRole = (((roleAmt - prevRoleAmt) / prevRoleAmt) * 100).toFixed(1);
                const isRoleUp = diffRole >= 0;
                const roleColor = isRoleUp ? '#16a34a' : '#dc2626';
                const roleIcon = isRoleUp ? '▲' : '▼';
                
                roleMomHtml = `<span style="color:${roleColor}; font-size:0.75rem; font-weight:700; margin-left:6px;" title="vs mes anterior en este cargo">${roleIcon} ${Math.abs(diffRole)}%</span>`;
            } else if (idx > 0) {
                roleMomHtml = `<span style="color:#2563eb; font-size:0.72rem; font-weight:700; margin-left:6px;" title="Cargo sin registros el mes anterior">★ Nuevo</span>`;
            }

            rolesHtml += `
                <div class="role-row" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #f1f5f9; font-size:0.85rem;">
                    <span style="display:flex; align-items:center; flex-wrap:wrap;">
                        <strong>${esc(roleName)}</strong> 
                        <small style="color:#64748b; font-size:0.75rem; margin-left:4px;" title="Porcentaje dentro de la nómina del mes">(${rolePct}%)</small>
                        ${roleMomHtml}
                    </span>
                    <span style="font-weight:600; color:#1e293b;">$${Number(roleAmt).toLocaleString()}</span>
                </div>`;
        });

        const perHour = hoursTotal > 0 ? `<div class="meta" style="font-size:0.78rem; color:#64748b; margin-top:8px;">⏱️ $${(totalMes / hoursTotal).toFixed(2)} por hora (${Math.round(hoursTotal)} h)</div>` : '';
        const abs = absencesCount > 0 ? `<div class="meta" style="font-size:0.78rem; color:#dc2626; margin-top:2px;">🚫 Ausencias no justificadas: ${absencesCount}</div>` : '';
        const transp = transportTotalOf(period);
        const tr = transp > 0 ? `<div class="meta" style="font-size:0.78rem; color:#64748b; margin-top:2px;">🚐 Transporte: $${transp.toLocaleString()} (${((transp / totalMes) * 100).toFixed(1)}% de la nómina)</div>` : '';

        html += `
            <div class="month-card" style="flex:1; min-width:260px; background:white; border-radius:8px; padding:1.2rem; box-shadow:0 1px 3px rgba(0,0,0,0.05); border-top:3px solid #10b981;">
                <h4 style="color:#10b981; margin:0; font-size:1.1rem; text-transform:uppercase;">${esc(period)}</h4>
                <div class="big-number" style="font-size:1.8rem; font-weight:800; margin:6px 0 2px 0; color:#1e293b;">$${Number(totalMes).toLocaleString()}</div>
                ${momHtml}
                <div style="margin-top:8px;">${rolesHtml}</div>
                ${perHour}${abs}${tr}
            </div>`;
    });

    container.innerHTML = html;
}
function renderDispersion(afterEl) {
    let box = document.getElementById('dispersionContainer');
    if (!box) { box = document.createElement('div'); box.id = 'dispersionContainer'; box.className = 'dash-card mb-20'; afterEl.insertAdjacentElement('afterend', box); }
    const year = periodYear(document.getElementById('monthSelector').value) || new Date().getFullYear();
    let rows = '';
    ROLES.forEach(role => {
        const vals = appData.employees.filter(e => e.role === role && e.status !== "Fuera de Servicio").map(e => sumYear(e.id, year, false));
        if (vals.length < 2) return;
        const min = Math.min(...vals), max = Math.max(...vals), avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        rows += `<tr><td>${esc(role)}</td><td>${vals.length}</td><td>$${min.toLocaleString()}</td><td>$${Math.round(avg).toLocaleString()}</td><td>$${max.toLocaleString()}</td><td><strong>$${(max - min).toLocaleString()}</strong></td></tr>`;
    });
    box.innerHTML = `<h3>⚖️ Equidad de ingresos por cargo — ${year}</h3><table class="disp-table"><thead><tr><th>Cargo</th><th>Personas</th><th>Mínimo</th><th>Promedio</th><th>Máximo</th><th>Brecha</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Sin datos suficientes</td></tr>'}</tbody></table><div class="disp-note">Solo personal activo.</div>`;
}


function formatPeriodShort(p) {
    const parts = String(p || '').split(' ');
    if (parts.length < 2) return p;
    const m = parts[0].slice(0, 3);
    const mCap = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
    const y = parts[1].slice(-2);
    return `${mCap} '${y}`;
}

function chartPeriodList() {
    const all = PERIODS.filter(p => p !== DEC_2025);
    let last = -1;
    all.forEach((p, i) => { if (periodHasData(p)) last = i; });
    last = Math.max(last, all.indexOf(currentPeriodName()));
    return last >= 0 ? all.slice(0, last + 1) : all;
}

function renderAnalyticsCharts() {
    const chartPeriods = chartPeriodList();
    const shortLabels = chartPeriods.map(formatPeriodShort);

    const monthlyData = chartPeriods.map(p => {
        let mTotal = 0; const mRoles = emptyRoleObj();
        if (appData.records[p]) {
            Object.keys(appData.records[p]).forEach(eId => {
                const emp = appData.employees.find(x => x.id == eId);
                if (!emp) return;
                (appData.records[p][eId] || []).forEach(r => {
                    if (r && !r.isPhantom && (parseFloat(r.amount) > 0)) {
                        const amtNum = parseFloat(r.amount);
                        mTotal += amtNum;
                        const actualRole = r.role || emp.role;
                        if (mRoles[actualRole] !== undefined) mRoles[actualRole] += amtNum;
                    }
                });
            });
        }
        return { label: p, total: mTotal, roles: mRoles };
    });

    // 1. Gráfico Global (Evolución de Gasto Mensual) - Área suave
    renderChartJS('GlobalMonthly', {
        type: 'line',
        data: {
            labels: shortLabels,
            datasets: [{
                label: 'Gasto Total ($)',
                data: monthlyData.map(d => d.total),
                borderColor: '#F29100',
                backgroundColor: 'rgba(242, 145, 0, 0.12)',
                fill: true,
                tension: 0.35,
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#F29100',
                pointBorderWidth: 2.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    padding: 10,
                    callbacks: { label: ctx => ` Total: $${Number(ctx.parsed.y).toLocaleString()}` }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { family: "'Segoe UI', sans-serif", size: 11 }, color: '#64748b' } },
                y: {
                    grid: { color: '#f1f5f9' },
                    ticks: { font: { family: "'Segoe UI', sans-serif", size: 11 }, color: '#64748b', callback: v => '$' + Number(v).toLocaleString() },
                    beginAtZero: true
                }
            }
        }
    });

    // 2. Gráfico por Puesto (Barras Apiladas Modernas)
    renderChartJS('RoleMonthly', {
        type: 'bar',
        data: {
            labels: shortLabels,
            datasets: [
                { label: 'Supervisor', data: monthlyData.map(d => d.roles['Supervisor']), backgroundColor: '#2563eb', borderRadius: 4 },
                { label: 'Técnico de Seguridad', data: monthlyData.map(d => d.roles['Tecnico de Seguridad']), backgroundColor: '#16a34a', borderRadius: 4 },
                { label: 'Inspector', data: monthlyData.map(d => d.roles['Inspector']), backgroundColor: '#d97706', borderRadius: 4 },
                { label: 'Surveyor', data: monthlyData.map(d => d.roles['Surveyor']), backgroundColor: '#8b5cf6', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle', font: { family: "'Segoe UI', sans-serif", size: 12, weight: '600' }, color: '#475569' }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    padding: 10,
                    callbacks: { label: ctx => ` ${ctx.dataset.label}: $${Number(ctx.parsed.y).toLocaleString()}` }
                }
            },
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { font: { family: "'Segoe UI', sans-serif", size: 11 }, color: '#64748b' } },
                y: {
                    stacked: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { font: { family: "'Segoe UI', sans-serif", size: 11 }, color: '#64748b', callback: v => '$' + Number(v).toLocaleString() },
                    beginAtZero: true
                }
            }
        }
    });
}

function renderYearCard(year, data) {
    return `<div class="year-card y${year === 2025 ? 2025 : 2026}"><h3 style="margin:0; color:${year === 2025 ? '#475569' : 'var(--accent)'}">Año ${year}</h3><div class="big-number">$${data.total.toLocaleString()}</div><div style="margin-top:15px;">${Object.keys(data.roles).filter(r => data.roles[r] > 0 || r !== 'Surveyor').map(r => `<div class="role-row"><span>${esc(r)}</span><strong>$${data.roles[r].toLocaleString()}</strong></div>`).join('')}</div></div>`;
}

/* =========================================
   GRÁFICOS MODERNOS CON CHART.JS
========================================= */
function renderAllCharts() {
    renderChart('Supervisor');
    renderChart('Tecnico de Seguridad');
    renderChart('Inspector');
}

function renderChart(roleFilter) {
    const idBase = roleFilter.split(' ')[0];
    const chartPeriods = chartPeriodList();
    const shortLabels = chartPeriods.map(formatPeriodShort);

    const datasets = [];
    appData.employees.filter(e => e.role === roleFilter).forEach((e, idx) => {
        const vals = chartPeriods.map(p => sumPeriod(e.id, p, false));
        if ((e.status === "Fuera de Servicio" || e.status === "Egreso") && vals.every(v => v === 0)) return;
        const color = PALETTE[idx % PALETTE.length];
        datasets.push({
            label: e.name,
            data: vals,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2.5,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: color,
            pointBorderWidth: 2
        });
    });

    renderChartJS(idBase, {
        type: 'line',
        data: {
            labels: shortLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { family: "'Segoe UI', sans-serif", size: 11, weight: '600' },
                        color: '#475569',
                        padding: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    padding: 10,
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: $${Number(ctx.parsed.y).toLocaleString()}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: "'Segoe UI', sans-serif", size: 11 }, color: '#64748b' }
                },
                y: {
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        font: { family: "'Segoe UI', sans-serif", size: 11 },
                        color: '#64748b',
                        callback: v => '$' + Number(v).toLocaleString()
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function renderChartJS(chartId, config) {
    const container = document.getElementById('chart-' + chartId);
    if (!container) return;

    const legCont = document.getElementById('legend-' + chartId);
    if (legCont) legCont.style.display = 'none';

    // Destroy existing instance if present
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }

    // Clean container and create canvas
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'canvas-' + chartId;
    container.appendChild(canvas);

    // If Chart library is available, instantiate
    if (typeof Chart !== 'undefined') {
        chartInstances[chartId] = new Chart(canvas, config);
    } else {
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;">Cargando motor de gráficos...</div>';
    }
}

const tt = document.getElementById('globalTooltip');
if (tt) {
    tt.style.whiteSpace = 'pre-line';
    tt.style.textAlign = 'left';
}

function positionTooltip(e) {
    const pad = 12; const tw = tt.offsetWidth || 200; const th = tt.offsetHeight || 60;
    let x = e.clientX + pad, y = e.clientY - th - 6;
    if (x + tw > window.innerWidth - 4) x = e.clientX - tw - pad;
    if (y < 4) y = e.clientY + 18;
    tt.style.left = Math.max(4, x) + 'px'; tt.style.top = y + 'px';
}

function showTooltip(e, n, p, v) { 
    if (!tt) return;
    tt.style.whiteSpace = 'pre-line';
    tt.textContent = `${n}\n${p}: $${Number(v).toLocaleString()}`; 
    tt.style.display = 'block'; 
    positionTooltip(e); 
}

function hideTooltip() { if (tt) tt.style.display = 'none'; }

document.addEventListener('mouseover', e => {
    const el = e.target.closest && e.target.closest('[data-tooltip]');
    if (!el || !tt) return;
    tt.style.whiteSpace = 'pre-line';
    tt.textContent = el.getAttribute('data-tooltip'); 
    tt.style.display = 'block'; 
    positionTooltip(e);
});
document.addEventListener('mousemove', e => { if (tt.style.display === 'block' && e.target.closest && e.target.closest('[data-tooltip]')) positionTooltip(e); });
document.addEventListener('mouseout', e => { if (e.target.closest && e.target.closest('[data-tooltip]')) hideTooltip(); });

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (isTabActive('graficos')) renderAllCharts();
        else if (isTabActive('analytics')) renderAnalyticsCharts();
    }, 200);
});

/* =========================================
   CONFIGURACIÓN: LISTAS
========================================= */
function renderL(id, arr, fmt, del) {
    const el = document.getElementById(id); if (!el) return; el.innerHTML = '';
    arr.forEach((x, i) => {
        const l = document.createElement('li'); l.className = 'list-item'; l.innerHTML = fmt(x);
        const b = document.createElement('button'); b.className = 'delete-btn'; b.innerText = '✕';
        b.onclick = () => { const r = del(x.id ? x.id : i); if (r === false) return; renderConfigLists(); };
        l.appendChild(b); el.appendChild(l);
    });
}


function toggleEgresadosList() {
    const box = document.getElementById('egresadosContainer');
    const arrow = document.getElementById('egresadosArrow');
    if (!box) return;
    const isHidden = (box.style.display === 'none' || !box.style.display);
    box.style.display = isHidden ? 'block' : 'none';
    if (arrow) arrow.innerText = isHidden ? '▲ Ocultar' : '▼ Mostrar';
}

function renderConfigLists() {
    const activeEmps = appData.employees.filter(e => e.status !== 'Egreso');
    const egresados = appData.employees.filter(e => e.status === 'Egreso');

    const countEl = document.getElementById('egresadosCount');
    if (countEl) countEl.innerText = egresados.length;

    renderL('employeeList', activeEmps, e => `<div style="display:flex;align-items:center;width:100%;gap:10px;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;"><b>${esc(e.name)}</b></div>
        <input type="number" class="dist-select" min="1" max="10" title="Distancia (1-10)" value="${e.distanceScore || 5}" onchange="changeDistance(${e.id}, this.value)">
        <select class="role-select" onchange="changeRole(${e.id},this.value)">
            <option value="Supervisor" ${e.role === 'Supervisor' ? 'selected' : ''}>Supervisor</option>
            <option value="Tecnico de Seguridad" ${e.role === 'Tecnico de Seguridad' ? 'selected' : ''}>Técnico</option>
            <option value="Inspector" ${e.role === 'Inspector' ? 'selected' : ''}>Inspector</option>
            <option value="Surveyor" ${e.role === 'Surveyor' ? 'selected' : ''}>Surveyor</option>
        </select>
        <select class="status-select ${getStatusClass(e.status)}" onchange="changeStatus(${e.id},this.value)">
            <option value="Disponible" ${e.status === 'Disponible' ? 'selected' : ''}>🟢 Disp.</option>
            <option value="En Guardia" ${e.status === 'En Guardia' ? 'selected' : ''}>🟡 Guardia</option>
            <option value="Vacaciones" ${e.status === 'Vacaciones' ? 'selected' : ''}>🔴 Vacac.</option>
            <option value="Reposo" ${e.status === 'Reposo' ? 'selected' : ''}>🔴 Reposo</option>
            <option value="No Justificado" ${e.status === 'No Justificado' ? 'selected' : ''}>🔴 No Just.</option>
            <option value="Fuera de Servicio" ${e.status === 'Fuera de Servicio' ? 'selected' : ''}>⚫ Inactivo</option>
            <option value="Egreso" ${e.status === 'Egreso' ? 'selected' : ''}>🚪 Dar Egreso</option>
        </select>
    </div>`, (id) => deleteEmployee(id));

    // Renderizar lista separada de egresados
    renderL('egresadosList', egresados, e => `<div style="display:flex;align-items:center;width:100%;gap:10px;flex-wrap:wrap;opacity:0.85;">
        <div style="flex:1;min-width:120px;"><b>${esc(e.name)}</b> <span style="font-size:0.7rem; color:#dc2626; font-weight:600;">(Egresado)</span></div>
        <span style="font-size:0.75rem; color:#64748b; margin-right:5px;">${esc(e.role)}</span>
        <select class="status-select st-egreso" onchange="changeStatus(${e.id},this.value)">
            <option value="Egreso" selected>🚪 Egreso (Histórico)</option>
            <option value="Disponible">🟢 Reincorporar a Disponible</option>
            <option value="Fuera de Servicio">⚫ Pasar a Inactivo</option>
        </select>
    </div>`, (id) => false); // Los egresados no se borran

    renderL('siteList', appData.sites, s => esc(s), i => { appData.sites.splice(i, 1); dbUpdate({ 'sites': appData.sites }); });
    renderL('activityList', appData.activities, a => esc(a), i => { appData.activities.splice(i, 1); dbUpdate({ 'activities': appData.activities }); });
}

function getStatusClass(s) { if (s === 'Disponible') return 'st-active'; if (s === 'En Guardia') return 'st-busy'; if (s === 'Fuera de Servicio') return 'st-inactive'; if (s === 'Egreso') return 'st-egreso'; return 'st-vacation'; }
function fillSelect(id, opts, sel) { const el = document.getElementById(id); el.innerHTML = ''; opts.forEach(o => { const op = document.createElement('option'); op.value = o; op.innerText = o; if (o === sel) op.selected = true; el.appendChild(op); }); }
function fillSelectOther(id, opts, sel) {
    const el = document.getElementById(id); el.innerHTML = ''; let found = false;
    opts.forEach(o => { const op = document.createElement('option'); op.value = o; op.innerText = o; if (o === sel) { op.selected = true; found = true; } el.appendChild(op); });
    const otherOp = document.createElement('option'); otherOp.value = 'OTRO'; otherOp.innerText = 'OTRO (Escribir manual)'; el.appendChild(otherOp);
    const otherInput = document.getElementById(id + 'Other');
    if (sel && !found) { el.value = 'OTRO'; otherInput.value = sel; otherInput.classList.add('visible'); }
    else { otherInput.classList.remove('visible'); otherInput.value = ''; }
}
function checkOther(type) { const sel = document.getElementById('editor' + type); const inp = document.getElementById('editor' + type + 'Other'); if (sel.value === 'OTRO') inp.classList.add('visible'); else inp.classList.remove('visible'); }
function getSelectVal(id) { const sel = document.getElementById(id); if (sel.value === 'OTRO') return document.getElementById(id + 'Other').value.toUpperCase(); return sel.value; }

function addEmployee() {
    const n = document.getElementById('newEmpName').value.trim().toUpperCase();
    const dist = Math.min(10, Math.max(1, parseInt(document.getElementById('newEmpDistance').value) || 5));
    if (!n) return;
    if (appData.employees.some(e => e.name === n) && !confirm(`Ya existe un empleado llamado "${n}". ¿Agregar de todos modos?`)) return;
    appData.employees.push({ id: Date.now(), name: n, role: document.getElementById('newEmpRole').value, status: 'Disponible', distanceScore: dist });
    dbUpdate({ 'employees': appData.employees }).then(renderConfigLists);
    document.getElementById('newEmpName').value = ''; document.getElementById('newEmpDistance').value = '';
}
function addSite() { const n = document.getElementById('newSiteName').value.trim(); if (n && !appData.sites.includes(n)) { appData.sites.push(n); dbUpdate({ 'sites': appData.sites }).then(renderConfigLists); document.getElementById('newSiteName').value = ''; } }
function addActivity() { const n = document.getElementById('newActivityName').value.trim().toUpperCase(); if (n && !appData.activities.includes(n)) { appData.activities.push(n); dbUpdate({ 'activities': appData.activities }).then(renderConfigLists); document.getElementById('newActivityName').value = ''; } }

function getLastOperationalShift(empId) {
    const currentP = document.getElementById('monthSelectorSug').value; const pIdx = PERIODS.indexOf(currentP);
    for (let i = pIdx; i >= 0; i--) {
        const pName = PERIODS[i]; if (pName === DEC_2025) continue;
        const userRecs = appData.records[pName] && appData.records[pName][empId]; if (!userRecs) continue;
        for (let d = 30; d >= 0; d--) {
            const rec = userRecs[d];
            if (rec && rec.activity) {
                const actUpper = rec.activity.toUpperCase(); let ignored = false;
                for (let ign of IGNORE_SHIFT_ACTIVITIES) if (actUpper.includes(ign)) ignored = true;
                if (!ignored && (rec.shift === 'Diurno' || rec.shift === 'Nocturno')) return { shift: rec.shift, activity: rec.activity, date: `Dia ${d + 1} ${pName.slice(0, 3)}` };
            }
        }
    }
    return null;
}
function changeStatus(id, newStatus) { const emp = appData.employees.find(e => e.id == id); if (emp) { emp.status = newStatus; dbUpdate({ 'employees': appData.employees }).then(() => { renderConfigLists(); renderSuggestions(); }); } }
function changeRole(id, newRole) { const emp = appData.employees.find(e => e.id == id); if (emp) { emp.role = newRole; dbUpdate({ 'employees': appData.employees }).then(() => { renderConfigLists(); renderSuggestions(); renderAllCharts(); renderAnalytics(); }); } }
function setAllAvailable() { if (!confirm("¿Estás seguro de poner a TODOS los empleados en estado 'Disponible'?")) return; appData.employees.forEach(e => { if (e.status !== "Egreso" && e.status !== "Fuera de Servicio") e.status = "Disponible"; }); dbUpdate({ 'employees': appData.employees }, "♻️ Todo el personal está ahora disponible.").then(() => { renderConfigLists(); renderSuggestions(); }); }

function deleteEmployee(id) {
    const emp = appData.employees.find(e => e.id == id);
    if (!emp) return false;
    if (!confirm(`¿Dar de baja (Egreso) a ${emp.name}?\n\nSe moverá al archivo histórico de Egresados y se conservará todo su historial intacto.`)) return false;
    emp.status = "Egreso";
    dbUpdate({ 'employees': appData.employees }, "📁 Empleado movido al archivo de Egresados.").then(() => {
        renderConfigLists();
        renderSuggestions();
    });
    return true;
}

/* =========================================
   EXPORTACIÓN A EXCEL (.xlsx real con SheetJS)
========================================= */
function loadXlsxLib() {
    return new Promise((res, rej) => {
        if (window.XLSX) return res(window.XLSX);
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload = () => res(window.XLSX); s.onerror = () => rej(new Error('No se pudo cargar SheetJS'));
        document.head.appendChild(s);
    });
}
async function saveXlsx(filename, sheetName, aoa, opts) {
    opts = opts || {};
    try {
        const X = await loadXlsxLib();
        const ws = X.utils.aoa_to_sheet(aoa);
        if (opts.merges && opts.merges.length) ws['!merges'] = opts.merges;
        if (opts.cols) ws['!cols'] = opts.cols.map(w => ({ wch: w }));
        (opts.formulas || []).forEach(f => { ws[X.utils.encode_cell({ r: f.r, c: f.c })] = { t: 'n', f: f.f, v: f.v }; });
        ws['!views'] = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
        const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, sheetName);
        X.writeFile(wb, filename);
    } catch (e) {
        console.error(e); notify('No se pudo generar el Excel (revisa tu red).');
    }
}

function exportToExcel() {
    const p = document.getElementById('monthSelector').value;
    if (p === DEC_2025) { notify('Diciembre 2025 es solo un cierre; no tiene detalle diario para exportar.'); return; }
    const isHours = (payrollViewMode === 'hours');
    const year = periodYear(p);
    const filter = document.getElementById('searchPayroll').value.toUpperCase();

    let header = ['EMPLEADO']; for (let i = 1; i <= 31; i++) header.push(i);
    if (isHours) {
        header.push('TOTAL HORAS (MES)', 'ACUM. HORAS (AÑO)');
    } else {
        header.push('TOTAL MES ($)', 'ACUM. ANUAL ($)', 'HORAS MES', 'HORAS AÑO');
    }

    const rows = [header]; const merges = []; const formulas = [];

    appData.employees.forEach(emp => {
        if (emp.role === "Surveyor") return;
        if (!matchesPayrollFilter(emp, p, filter)) return;
        const recs = (appData.records[p] && appData.records[p][emp.id]) || Array(31).fill(null);
        const r = rows.length; const line = [`${emp.name} - ${emp.role}`]; const localMerges = [];
        let mTotal = 0, mHours = 0;
        for (let i = 0; i < 31; i++) {
            const rec = recs[i];
            if (rec && rec.span > 1) {
                const a = parseFloat(rec.amount) || 0, hh = parseFloat(rec.hours) || 0;
                if (!rec.isPhantom) { mTotal += a; mHours += hh; }
                const sp = Math.min(rec.span, 31 - i);
                const cellVal = isHours ? (rec.isPhantom ? 'X' : (hh > 0 ? hh : 0)) : (rec.isPhantom ? 'X' : a);
                line.push(cellVal);
                for (let k = 1; k < sp; k++) line.push(null);
                localMerges.push({ s: { r, c: 1 + i }, e: { r, c: i + sp } });
                i += sp - 1;
            } else if (rec && rec.linked) {
                line.push(null);
            } else {
                const a = rec ? (parseFloat(rec.amount) || 0) : 0, hh = rec ? (parseFloat(rec.hours) || 0) : 0;
                if (!rec || !rec.isPhantom) { mTotal += a; mHours += hh; }
                const cellVal = isHours
                    ? (rec && rec.isPhantom ? 'X' : (hh > 0 ? hh : null))
                    : (rec && rec.isPhantom ? 'X' : (a > 0 ? a : null));
                line.push(cellVal);
            }
        }
        if (emp.status === "Fuera de Servicio" && mTotal === 0 && mHours === 0) return;
        const ys = yearSums(emp.id, year);
        if (isHours) {
            line.push(mHours, ys.hours);
            formulas.push({ r, c: 32, f: `SUM(B${r + 1}:AF${r + 1})`, v: mHours });
        } else {
            line.push(mTotal, ys.amt, mHours, ys.hours);
            formulas.push({ r, c: 32, f: `SUM(B${r + 1}:AF${r + 1})`, v: mTotal });
        }
        rows.push(line); merges.push(...localMerges);
    });

    const filename = isHours ? `Nomina_Horas_${p}.xlsx` : `Nomina_${p}.xlsx`;
    const sheetName = isHours ? 'Horas Trabajadas' : 'Nómina';
    const cols = isHours 
        ? [34, ...Array(31).fill(5), 18, 18] 
        : [34, ...Array(31).fill(5), 12, 13, 11, 11];

    saveXlsx(filename, sheetName, rows, { merges, formulas, cols });
}

/* =========================================
   SURVEYORS
========================================= */
function renderSurveyorTable(period) {
    const tbody = document.getElementById('tableBodySurv');
    const thead = document.getElementById('tableHeaderSurv');
    if (!tbody || !thead) return;

    tbody.innerHTML = '';
    if (!appData.records[period]) appData.records[period] = {};
    const filter = document.getElementById('searchSurveyor').value.toUpperCase();

    let h = `<th class="sticky-col sticky-col-header" style="text-align:left; min-width:140px;">EMPLEADO (SURVEYOR)</th>`;
    for (let i = 1; i <= 31; i++) {
        const m = dayMeta(period, i);
        h += `<th class="day-col${m.weekend ? ' day-weekend' : ''}${m.invalid ? ' day-invalid' : ''}"><div>${i}</div><div class="wk">${m.wk}</div></th>`;
    }
    h += `<th class="col-total center-text">TOTAL MES</th>`;
    thead.innerHTML = h;

    let grandTotal = 0;
    appData.employees.forEach(emp => {
        if (emp.role !== "Surveyor") return;
        if (filter && !emp.name.toUpperCase().includes(filter)) return;
        if (!appData.records[period][emp.id]) appData.records[period][emp.id] = Array(31).fill(null);

        let mTotal = 0; let cells = '';
        for (let i = 0; i < 31; i++) {
            const rec = appData.records[period][emp.id][i]; const m = dayMeta(period, i + 1);
            if (rec && rec.span > 1) {
                const amtNum = parseFloat(rec.amount) || 0;
                mTotal += amtNum;
                const tooltip = `💵 $${amtNum}\n🚢 Buque: ${rec.vessel || 'N/A'}\n📍 Muelle: ${rec.muelle || 'N/A'}\n⚓ Fondeo: ${rec.fondeo || 'N/A'}\n🛠️ Act: ${rec.activity || 'N/A'}\n⏱️ Horas: ${rec.hours}h\n📅 Días: ${rec.span}\n📝 Obs: ${rec.obs || ''}`;
                cells += `<td colspan="${rec.span}" class="data-cell merged-cell" style="background-color: #f3e8ff; border-right: 1px solid #d8b4fe;" data-tooltip="${esc(tooltip)}" onclick="cellClick(this, ${emp.id}, ${i}, 'surv')" ondblclick="openSurvEditor(${emp.id}, ${i})">${rec.obs ? '<div class="obs-dot"></div>' : ''}<div class="cell-amt" style="color:#6b21a8;">$${amtNum}</div><div class="cell-sub" style="color:#7e22ce;">${esc(rec.vessel || 'Buque')}</div></td>`;
                i += (rec.span - 1);
            } else if (rec && rec.linked) {
                cells += `<td class="data-cell" style="background:#f8fafc;">-</td>`;
            } else {
                const amt = rec ? (parseFloat(rec.amount) || 0) : 0;
                mTotal += amt;
                if (!rec && m.invalid) { cells += `<td class="data-cell day-col day-invalid"></td>`; continue; }
                cells += `<td class="data-cell day-col ${amt > 0 ? 'has-data' : ''} ${m.weekend ? 'wk-end' : ''}" onclick="cellClick(this, ${emp.id}, ${i}, 'surv')" ondblclick="openSurvEditor(${emp.id}, ${i})">${(rec && rec.obs) ? '<div class="obs-dot"></div>' : ''}${amt > 0 ? amt : ''}</td>`;
            }
        }
        if ((emp.status === "Fuera de Servicio" || emp.status === "Egreso") && mTotal === 0) return;
        grandTotal += mTotal;

        const tr = document.createElement('tr');
        if (emp.status === "Fuera de Servicio" || emp.status === "Egreso") tr.className = 'inactive-row';
        tr.innerHTML = `<td class="sticky-col" style="text-align:left; padding-left:10px;"><div style="font-weight:600; font-size:0.8rem; color:#6b21a8;">${esc(emp.name)}</div><div style="font-size:0.65rem; color:#64748b">${esc(emp.role)}</div></td>${cells}<td class="total-cell-month center-text" style="color:#6b21a8;">${mTotal}</td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('monthTotalSurv').innerText = grandTotal.toLocaleString();
}

function updateSurvHours() {
    const startD = parseInt(document.getElementById('survStartDay').value) || 1;
    const endD = parseInt(document.getElementById('survEndDay').value) || startD;
    document.getElementById('survHours').value = Math.max(1, (endD - startD) + 1) * 12;
}
function checkSurvOther(type) { const sel = document.getElementById('surv' + type); const inp = document.getElementById('surv' + type + 'Other'); if (sel.value === 'OTRO') inp.classList.add('visible'); else inp.classList.remove('visible'); }
function getSurvSelectVal(id) { const sel = document.getElementById(id); if (sel.value === 'OTRO') return document.getElementById(id + 'Other').value.toUpperCase(); return sel.value; }
function closeSurvEditor() { document.getElementById('surveyorEditorModal').classList.remove('open'); }

function openSurvEditor(eid, dix) {
    currentEdit = { empId: eid, dayIdx: dix };
    const p = document.getElementById('monthSelectorSurv').value;
    const emp = appData.employees.find(e => e.id == eid);
    if (!appData.records[p][eid]) appData.records[p][eid] = Array(31).fill(null);
    const rec = appData.records[p][eid][dix];

    document.getElementById('survModalTitle').innerText = `Registro: ${emp.name}`;
    let start = dix + 1; let end = dix + 1;
    let val = rec ? (parseFloat(rec.amount) || '') : 1400;
    if (rec && rec.span > 1) { end = start + rec.span - 1; }

    document.getElementById('survStartDay').value = start;
    document.getElementById('survEndDay').value = end;
    document.getElementById('survEndDay').max = daysInMonthOf(p);
    document.getElementById('survAmount').value = val;
    document.getElementById('survVessel').value = rec ? (rec.vessel || '') : '';
    document.getElementById('survObs').value = rec ? (rec.obs || '') : '';

    const muelleOpts = ["Sidor", "Venalum", "Copal", "Fmo", "Bauxilum", "Punta de Piedras", "N/A"];
    const fondeoOpts = ["Milla 44", "Boca de Serpiente", "N/A"];
    const actOpts = ["Draft Survey a buque", "Draft Survey a Gabarra(s)", "Bunker Survey", "Full Condition Survey", "Tecnico a Bordo", "Instalacion de termocuplas"];
    fillSelectOther('survMuelle', muelleOpts, rec ? rec.muelle : '');
    fillSelectOther('survFondeo', fondeoOpts, rec ? rec.fondeo : '');
    fillSelectOther('survActivity', actOpts, rec ? rec.activity : '');

    if (rec && rec.hours !== undefined) document.getElementById('survHours').value = rec.hours;
    else updateSurvHours();

    document.getElementById('surveyorEditorModal').classList.add('open');
}

function saveSurveyorEditor() {
    const startD = parseInt(document.getElementById('survStartDay').value);
    const endD = parseInt(document.getElementById('survEndDay').value);
    const amount = parseFloat(document.getElementById('survAmount').value);
    const hours = parseFloat(document.getElementById('survHours').value) || 0;
    const p = document.getElementById('monthSelectorSurv').value;
    const dim = daysInMonthOf(p);

    if (!endD) { notify("Indica el día final."); return; }
    if (endD > dim) { notify(`${p} solo tiene ${dim} días.`); return; }
    if (endD < startD) { notify("Fecha final menor a inicial."); return; }

    const userRow = normalizeRow(appData.records[p][currentEdit.empId]);
    appData.records[p][currentEdit.empId] = userRow;

    const oldRec = userRow[currentEdit.dayIdx];
    const oldSpan = oldRec ? (oldRec.span || 1) : 1;
    if (amount > 0 && hasConflict(userRow, startD - 1, endD - 1, currentEdit.dayIdx, oldSpan)) {
        if (!confirm("⚠️ En esos días ya existe otro registro para este surveyor.\n\n¿Quieres REEMPLAZARLO?")) return;
    }
    for (let d = 0; d < oldSpan; d++) { if (currentEdit.dayIdx + d < 31) userRow[currentEdit.dayIdx + d] = null; }
    for (let d = startD - 1; d <= endD - 1; d++) clearSpanAt(userRow, d);

    const span = endD - startD + 1;
    if (amount > 0) {
        const survData = {
            role: "Surveyor",
            vessel: document.getElementById('survVessel').value.toUpperCase(),
            muelle: getSurvSelectVal('survMuelle'),
            fondeo: getSurvSelectVal('survFondeo'),
            activity: getSurvSelectVal('survActivity'),
            obs: document.getElementById('survObs').value,
            hours: hours,
            isPhantom: false,
            ...auditStamp()
        };
        userRow[startD - 1] = { amount: amount, span: span, ...survData };
        for (let k = 1; k < span; k++) { userRow[startD - 1 + k] = { amount: 0, linked: true, span: 0, ...survData }; }
    }
    dbUpdate({ [`records/${p}/${currentEdit.empId}`]: userRow }).then(() => {
        closeSurvEditor(); renderSurveyorTable(p);
    });
}
function copySurvRecord() {
    copiedSurvRecordData = {
        span: parseInt(document.getElementById('survEndDay').value) - parseInt(document.getElementById('survStartDay').value),
        hours: document.getElementById('survHours').value,
        amount: document.getElementById('survAmount').value,
        vessel: document.getElementById('survVessel').value,
        muelle: document.getElementById('survMuelle').value,
        muelleOther: document.getElementById('survMuelleOther') ? document.getElementById('survMuelleOther').value : '',
        fondeo: document.getElementById('survFondeo').value,
        fondeoOther: document.getElementById('survFondeoOther') ? document.getElementById('survFondeoOther').value : '',
        activity: document.getElementById('survActivity').value,
        activityOther: document.getElementById('survActivityOther') ? document.getElementById('survActivityOther').value : '',
        obs: document.getElementById('survObs').value
    };
    showToast("📋 ¡Registro de Surveyor copiado! Abre otra casilla y dale Pegar.");
}

function pasteSurvRecord() {
    if (!copiedSurvRecordData) { 
        notify("No has copiado ningún registro de surveyor todavía."); 
        return; 
    }
    const p = document.getElementById('monthSelectorSurv').value;
    const startD = parseInt(document.getElementById('survStartDay').value);
    let newEnd = startD + copiedSurvRecordData.span;
    const dim = daysInMonthOf(p);
    if (newEnd > dim) newEnd = dim;

    document.getElementById('survEndDay').value = newEnd;
    document.getElementById('survHours').value = copiedSurvRecordData.hours || '';
    document.getElementById('survAmount').value = copiedSurvRecordData.amount;
    document.getElementById('survVessel').value = copiedSurvRecordData.vessel || '';

    // Muelle
    document.getElementById('survMuelle').value = copiedSurvRecordData.muelle;
    const muelleOtherInp = document.getElementById('survMuelleOther');
    if (muelleOtherInp) {
        if (copiedSurvRecordData.muelle === 'OTRO') {
            muelleOtherInp.value = copiedSurvRecordData.muelleOther;
            muelleOtherInp.classList.add('visible');
        } else {
            muelleOtherInp.classList.remove('visible');
        }
    }

    // Fondeo
    document.getElementById('survFondeo').value = copiedSurvRecordData.fondeo;
    const fondeoOtherInp = document.getElementById('survFondeoOther');
    if (fondeoOtherInp) {
        if (copiedSurvRecordData.fondeo === 'OTRO') {
            fondeoOtherInp.value = copiedSurvRecordData.fondeoOther;
            fondeoOtherInp.classList.add('visible');
        } else {
            fondeoOtherInp.classList.remove('visible');
        }
    }

    // Actividad
    document.getElementById('survActivity').value = copiedSurvRecordData.activity;
    const actOtherInp = document.getElementById('survActivityOther');
    if (actOtherInp) {
        if (copiedSurvRecordData.activity === 'OTRO') {
            actOtherInp.value = copiedSurvRecordData.activityOther;
            actOtherInp.classList.add('visible');
        } else {
            actOtherInp.classList.remove('visible');
        }
    }

    document.getElementById('survObs').value = copiedSurvRecordData.obs || '';
    showToast("📥 Datos pegados. ¡Verifica el registro y dale Guardar!");
}
function deleteSurveyorRecord() {
    if (!confirm("⚠️ ¿Estás seguro de querer BORRAR este registro?")) return;
    const p = document.getElementById('monthSelectorSurv').value;
    const startD = parseInt(document.getElementById('survStartDay').value) - 1;
    const row = normalizeRow(appData.records[p][currentEdit.empId]);
    appData.records[p][currentEdit.empId] = row;
    clearSpanAt(row, startD);
    dbUpdate({ [`records/${p}/${currentEdit.empId}`]: row }, "🗑️ Registro eliminado").then(() => {
        closeSurvEditor(); renderSurveyorTable(p);
    });
}

function exportSurveyorsToExcel() {
    const p = document.getElementById('monthSelectorSurv').value;
    const filter = document.getElementById('searchSurveyor').value.toUpperCase();
    const header = ['SURVEYOR']; for (let i = 1; i <= 31; i++) header.push(i);
    header.push('TOTAL MES', 'HORAS MES', 'DETALLE (buque / actividad)');
    const rows = [header]; const merges = []; const formulas = [];

    appData.employees.forEach(emp => {
        if (emp.role !== "Surveyor") return;
        if (filter && !emp.name.toUpperCase().includes(filter)) return;
        const recs = (appData.records[p] && appData.records[p][emp.id]) || Array(31).fill(null);
        const r = rows.length; const line = [emp.name]; const localMerges = []; const detail = [];
        let mTotal = 0, mHours = 0;
        for (let i = 0; i < 31; i++) {
            const rec = recs[i];
            if (rec && rec.span > 1) {
                const a = parseFloat(rec.amount) || 0; mTotal += a; mHours += parseFloat(rec.hours) || 0;
                const sp = Math.min(rec.span, 31 - i);
                line.push(a); for (let k = 1; k < sp; k++) line.push(null);
                localMerges.push({ s: { r, c: 1 + i }, e: { r, c: i + sp } });
                detail.push(`${i + 1}-${i + sp}: ${rec.vessel || ''} (${rec.activity || ''})`);
                i += sp - 1;
            } else if (rec && rec.linked) {
                line.push(null);
            } else {
                const a = rec ? (parseFloat(rec.amount) || 0) : 0, hh = rec ? (parseFloat(rec.hours) || 0) : 0;
                mTotal += a; mHours += hh;
                line.push(a > 0 ? a : null);
                if (a > 0) detail.push(`${i + 1}: ${rec.vessel || ''} (${rec.activity || ''})`);
            }
        }
        if (emp.status === "Fuera de Servicio" && mTotal === 0) return;
        line.push(mTotal, mHours, detail.join(' | '));
        rows.push(line); merges.push(...localMerges);
        formulas.push({ r, c: 32, f: `SUM(B${r + 1}:AF${r + 1})`, v: mTotal });
    });
    saveXlsx(`Surveyors_${p}.xlsx`, 'Surveyors', rows, { merges, formulas, cols: [30, ...Array(31).fill(5), 11, 10, 50] });
}

/* =========================================
   TRANSPORTE
========================================= */
const FLOTA = {
    "Mitsubishi Touring": ["AH288BA"],
    "Daihatsu Terios": ["FBH01N"],
    "Chevrolet Aveo": ["AC549NM"],
    "Terios Bego": ["AA455DB"],
    "Jeep Cherokee": ["AE693JM"],
    "Hyunday Getz": ["AA550JB"]
};
const CHOFERES_BASE = ["Eduardo Marchán", "Jonny Flores", "Julissa Peña", "Diojene Beltran", "Luis Beecker"];

function autoFillPlaca() {
    const v = document.getElementById('transVehiculo').value.trim();
    const p = document.getElementById('transPlaca');
    const dl = document.getElementById('placasList');
    dl.innerHTML = '';
    if (FLOTA[v]) {
        if (FLOTA[v].length === 1) p.value = FLOTA[v][0];
        else { p.value = ''; FLOTA[v].forEach(pl => { dl.innerHTML += `<option value="${esc(pl)}">`; }); }
    }
}

function updateTransDateRange() {
    const p = document.getElementById('monthSelectorTrans').value;
    if (!p) return;
    const { mi, year } = parsePeriod(p);
    if (mi >= 0 && !isNaN(year)) {
        document.getElementById('transDateFrom').value = localISO(new Date(year, mi, 1));
        document.getElementById('transDateTo').value = localISO(new Date(year, mi + 1, 0));
        transRangeMonth = p;
        renderTransportTable();
    }
}

function getAllTransportRecords() {
    const todos = [];
    if (!appData.transporte) return todos;
    Object.keys(appData.transporte).forEach(mesKey => {
        const arr = appData.transporte[mesKey];
        if (!Array.isArray(arr)) return;
        arr.forEach((viaje, idx) => { if (viaje) todos.push({ ...viaje, mesOriginal: mesKey, idOriginal: idx }); });
    });
    return todos.sort((a, b) => ((a.fecha_raw || '') + (a.hora_raw || '')).localeCompare((b.fecha_raw || '') + (b.hora_raw || '')));
}

function filteredTransport() {
    const filter = document.getElementById('searchTransport').value.toUpperCase();
    const fromDate = document.getElementById('transDateFrom').value;
    const toDate = document.getElementById('transDateTo').value;
    return getAllTransportRecords().filter(v => {
        if (fromDate && (v.fecha_raw || '') < fromDate) return false;
        if (toDate && (v.fecha_raw || '') > toDate) return false;
        const matchText = `${v.chofer} ${v.placa} ${v.vehiculo} ${v.detalles}`.toUpperCase();
        return !filter || matchText.includes(filter);
    });
}

function renderTransportTable() {
    const tbody = document.getElementById('tableBodyTrans');
    if (!tbody) return;
    tbody.innerHTML = '';
    let total = 0;
    filteredTransport().forEach(viaje => {
        total += parseFloat(viaje.monto) || 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center;">${esc(viaje.fecha)}</td>
            <td style="text-align:center;">${esc(viaje.hora)}</td>
            <td>${esc(viaje.chofer)}</td>
            <td style="text-align:center; font-weight:bold;">${esc(viaje.placa)}</td>
            <td>${esc(viaje.vehiculo)}</td>
            <td>${esc(viaje.detalles)}</td>
            <td style="text-align:center; font-weight:bold; color: #16a34a;">$${esc(viaje.monto)}</td>
            <td style="text-align:center;">
                <button class="compact-btn" style="background:#f59e0b;" onclick="openTransportEditor('${esc(viaje.mesOriginal)}', ${viaje.idOriginal})">✏️ Editar</button>
            </td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('monthTotalTrans').innerText = total.toLocaleString();
}

function openTransportEditor(mesOriginal = null, idx = -1) {
    document.getElementById('transEditIndex').value = idx;
    document.getElementById('transEditMonth').value = mesOriginal || '';

    const dChofer = document.getElementById('choferesList');
    const dVehiculo = document.getElementById('vehiculosList');
    dChofer.innerHTML = ''; dVehiculo.innerHTML = '';
    Object.keys(FLOTA).forEach(v => dVehiculo.innerHTML += `<option value="${esc(v)}">`);

    const choferesUnicos = new Set(CHOFERES_BASE);
    getAllTransportRecords().forEach(v => { if (v.chofer) choferesUnicos.add(v.chofer); });
    choferesUnicos.forEach(c => dChofer.innerHTML += `<option value="${esc(c)}">`);

    if (idx >= 0 && mesOriginal && appData.transporte && appData.transporte[mesOriginal] && appData.transporte[mesOriginal][idx]) {
        document.getElementById('transModalTitle').innerText = "Editar Viaje";
        document.getElementById('btnDeleteTrans').style.display = 'inline-block';
        const v = appData.transporte[mesOriginal][idx];
        document.getElementById('transChofer').value = v.chofer;
        document.getElementById('transVehiculo').value = v.vehiculo;
        document.getElementById('transPlaca').value = v.placa;
        document.getElementById('transFecha').value = v.fecha_raw || '';
        document.getElementById('transHora').value = v.hora_raw || '';
        document.getElementById('transDetalles').value = v.detalles;
        document.getElementById('transMonto').value = v.monto;
    } else {
        document.getElementById('transEditIndex').value = -1;
        document.getElementById('transEditMonth').value = '';
        document.getElementById('transModalTitle').innerText = "Nuevo Viaje";
        document.getElementById('btnDeleteTrans').style.display = 'none';
        document.getElementById('transChofer').value = '';
        document.getElementById('transVehiculo').value = '';
        document.getElementById('transPlaca').value = '';
        const today = new Date();
        document.getElementById('transFecha').value = localISO(today);
        document.getElementById('transHora').value = localHM(today);
        document.getElementById('transDetalles').value = '';
        document.getElementById('transMonto').value = '';
    }
    document.getElementById('transportEditorModal').classList.add('open');
}

function closeTransportEditor() { document.getElementById('transportEditorModal').classList.remove('open'); }

function getPeriodBucket(dateStr) {
    const [year, month] = dateStr.split('-');
    return `${MESES_CAP[parseInt(month) - 1]} ${year}`;
}

function saveTransportRecord() {
    const f_raw = document.getElementById('transFecha').value;
    if (!f_raw) { notify("Debe indicar la fecha."); return; }

    const bucketPeriod = getPeriodBucket(f_raw);
    if (!appData.transporte) appData.transporte = {};
    if (!appData.transporte[bucketPeriod]) appData.transporte[bucketPeriod] = [];

    const idx = parseInt(document.getElementById('transEditIndex').value);
    const originalMonth = document.getElementById('transEditMonth').value;
    const h_raw = document.getElementById('transHora').value;

    const [year, month, day] = f_raw.split('-');
    const fechaFmt = `${day}/${month}/${year}`;
    let horaFmt = h_raw;
    if (h_raw) {
        const [hh, mm] = h_raw.split(':');
        let h = parseInt(hh); const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12; if (h === 0) h = 12;
        horaFmt = `${pad2(h)}:${mm}${ampm}`;
    }

    const viaje = {
        chofer: document.getElementById('transChofer').value.trim(),
        vehiculo: document.getElementById('transVehiculo').value.trim(),
        placa: document.getElementById('transPlaca').value.trim(),
        fecha: fechaFmt, fecha_raw: f_raw,
        hora: horaFmt, hora_raw: h_raw,
        detalles: document.getElementById('transDetalles').value.trim(),
        monto: parseFloat(document.getElementById('transMonto').value) || 0,
        ...auditStamp()
    };

    let multipath = {};
    if (idx >= 0 && originalMonth && appData.transporte[originalMonth]) {
        if (originalMonth === bucketPeriod) {
            appData.transporte[bucketPeriod][idx] = viaje;
        } else {
            appData.transporte[originalMonth].splice(idx, 1);
            appData.transporte[bucketPeriod].push(viaje);
            multipath[`transporte/${originalMonth}`] = appData.transporte[originalMonth];
        }
    } else {
        appData.transporte[bucketPeriod].push(viaje);
    }
    
    multipath[`transporte/${bucketPeriod}`] = appData.transporte[bucketPeriod];
    dbUpdate(multipath).then(() => { closeTransportEditor(); renderTransportTable(); });
}

function deleteTransportRecord() {
    if (!confirm("⚠️ ¿Eliminar este viaje?")) return;
    const idx = parseInt(document.getElementById('transEditIndex').value);
    const originalMonth = document.getElementById('transEditMonth').value;
    if (appData.transporte && appData.transporte[originalMonth]) {
        appData.transporte[originalMonth].splice(idx, 1);
        dbUpdate({ [`transporte/${originalMonth}`]: appData.transporte[originalMonth] }).then(() => {
            closeTransportEditor(); renderTransportTable();
        });
    }
}

function exportTransportToExcel() {
    const fromDate = document.getElementById('transDateFrom').value;
    const toDate = document.getElementById('transDateTo').value;
    const viajes = filteredTransport();
    const rows = [['VEHICULO', 'PLACA', 'CHOFER', 'OPERACION', 'FECHA', 'HORA', 'DETALLES DEL SERVICIO', 'MONTO']];
    let mTotal = 0;
    viajes.forEach(v => {
        const amt = parseFloat(v.monto) || 0; mTotal += amt;
        rows.push([v.vehiculo, v.placa, v.chofer, 'Transporte', v.fecha, v.hora, v.detalles, amt]);
    });
    const totalRow = rows.length;
    rows.push([null, null, null, null, null, null, 'TOTAL', mTotal]);
    const formulas = viajes.length ? [{ r: totalRow, c: 7, f: `SUM(H2:H${totalRow})`, v: mTotal }] : [];
    saveXlsx(`Transporte_${fromDate || 'inicio'}_al_${toDate || 'fin'}.xlsx`, 'Transporte', rows, { formulas, cols: [20, 12, 20, 14, 12, 10, 50, 10] });
}

/* =========================================
   RESPALDOS
========================================= */
async function downloadData() {
    const str = JSON.stringify(appData);
    try {
        const handle = await window.showSaveFilePicker({ suggestedName: 'icg_backup.json', types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }] });
        const writable = await handle.createWritable(); await writable.write(str); await writable.close();
    } catch (err) {
        if (err.name !== 'AbortError') {
            const a = document.createElement('a'); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(str);
            a.download = "icg_backup_v1.0.json"; document.body.appendChild(a); a.click(); a.remove();
        }
    }
    setDirty(false);
}

function autoBackupDownload() {
    try {
        const blob = new Blob([JSON.stringify(appData)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `icg_respaldo_previo_${localISO(new Date())}.json`;
        document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { console.error(e); }
}

function changeDistance(id, newDist) {
    const emp = appData.employees.find(e => e.id == id);
    if (emp) {
        emp.distanceScore = Math.min(10, Math.max(1, parseInt(newDist) || 5));
        dbUpdate({ 'employees': appData.employees }).then(renderSuggestions);
    }
}

function validateBackup(p) {
    if (!p || typeof p !== 'object') return 'El archivo no es un JSON de respaldo válido.';
    if (!p.employees || (Array.isArray(p.employees) && p.employees.length === 0)) return 'No contiene la lista de empleados.';
    if (!p.records || typeof p.records !== 'object') return 'No contiene los registros (records).';
    return null;
}

function loadBackup(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        let raw = e.target.result;
        if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
        try {
            const parsed = JSON.parse(raw);
            const problem = validateBackup(parsed);
            if (problem) { alert("❌ Respaldo rechazado: " + problem); return; }
            const nEmp = Array.isArray(parsed.employees) ? parsed.employees.length : Object.keys(parsed.employees).length;
            const nPer = Object.keys(parsed.records).length;
            if (!confirm(`⚠️ Vas a REEMPLAZAR TODOS los datos de la nube por este archivo:\n\n• ${nEmp} empleados\n• ${nPer} periodos con registros\n\nSe descargará automáticamente una copia de los datos actuales antes de continuar.\n\n¿Continuar?`)) return;
            if (dataLoaded) autoBackupDownload();
            loadParsedData(parsed, false);
            dataLoaded = true;
            database.ref('icg_master_data').set(JSON.parse(JSON.stringify(appData)))
                .then(() => showToast("✅ Respaldo cargado y sincronizado"));
        } catch (x) {
            console.error(x); alert("❌ Error: " + x.message);
        } finally { input.value = ''; }
    };
    reader.readAsText(file);
}

function inspectData() {
    if (!appData.records) { alert("No hay datos cargados."); return; }
    let msg = "📅 PERIODOS ENCONTRADOS EN LA NUBE:\n\n";
    Object.keys(appData.records).sort((a, b) => periodKey(a) - periodKey(b)).forEach(k => {
        const count = Object.values(appData.records[k]).reduce((acc, curr) => acc + (curr ? curr.filter(x => x && (parseFloat(x.amount) > 0)).length : 0), 0);
        msg += `• ${k}: ${count} registros\n`;
    });
    alert(msg);
}

function openBaseModal() {
    const container = document.getElementById('baseList'); container.innerHTML = '';
    appData.employees.forEach(emp => {
        const hist = appData.historical2025[emp.id] || { year: 0 };
        const row = document.createElement('div');
        row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.alignItems = 'center';
        row.innerHTML = `<span style="font-size:0.85rem; font-weight:bold;">${esc(emp.name)}</span><input type="number" id="base_year_${emp.id}" value="${hist.year}" class="compact-input" style="width:100px; text-align:right;">`;
        container.appendChild(row);
    });
    document.getElementById('baseModal').classList.add('open');
}

function saveBases() {
    appData.employees.forEach(emp => {
        const val = parseFloat(document.getElementById(`base_year_${emp.id}`).value) || 0;
        if (!appData.historical2025[emp.id]) appData.historical2025[emp.id] = { month: 0, year: 0 };
        appData.historical2025[emp.id].year = val;
    });
    dbUpdate({ 'historical2025': appData.historical2025 }).then(() => {
        document.getElementById('baseModal').classList.remove('open'); renderAnalytics();
    });
}

/* =========================================
   REGISTRO RÁPIDO Y TABULADORES
========================================= */

let quickRows = [];

function checkQrOther(type) {
    const sel = document.getElementById('qr' + type);
    const inp = document.getElementById('qr' + type + 'Other');
    if (sel.value === 'OTRO') inp.classList.add('visible'); else inp.classList.remove('visible');
}

function initQuickEntry() {
    const selPeriod = document.getElementById('qrPeriod');
    selPeriod.innerHTML = document.getElementById('monthSelector').innerHTML;
    selPeriod.value = document.getElementById('monthSelector').value;
    fillSelect('qrSite', appData.sites, appData.sites[0]);
    fillSelectOther('qrActivity', appData.activities, appData.activities[0]);
    if (quickRows.length === 0) addQuickRow(); else renderQuickRows();
}

function addQuickRow() { quickRows.push({ empId: '', role: 'Inspector', shift: 'Diurno', amount: '', isAuto: false }); renderQuickRows(); }
function removeQuickRow(index) { quickRows.splice(index, 1); renderQuickRows(); }

function getTabuladorPrice(site, activity, tons, role) {
    if (!tons || tons <= 0) return null;
    const siteUpper = String(site).toUpperCase();
    const actUpper = String(activity).toUpperCase();

    let tabAct = null;
    if (actUpper.includes("BUQUE") || actUpper.includes("GABARRA")) tabAct = "Buques/Gabarras";
    else return null;

    const siteKey = Object.keys(appData.tabuladores).find(k => k.toUpperCase() === siteUpper);
    if (!siteKey || !appData.tabuladores[siteKey][tabAct]) return null;

    const ranges = appData.tabuladores[siteKey][tabAct];
    let selectedTier = ranges.find(r => tons <= r.max);
    if (!selectedTier) selectedTier = ranges[ranges.length - 1]; 

    let roleToLookUp = role;
    if (siteKey !== "Sidor") roleToLookUp = "Inspector";

    let price = selectedTier.roles[roleToLookUp];
    if (price === undefined) price = selectedTier.roles["Inspector"];
    return price;
}

function recalculateAllQuickRows() {
    const site = document.getElementById('qrSite').value;
    const act = getSelectVal('qrActivity');
    const tons = parseFloat(document.getElementById('qrTons').value) || 0;

    let updatedAny = false;
    quickRows.forEach(row => {
        if (!row.empId) return;
        const autoPrice = getTabuladorPrice(site, act, tons, row.role);
        if (autoPrice !== null) { row.amount = autoPrice; row.isAuto = true; updatedAny = true; }
        else row.isAuto = false;
    });
    renderQuickRows();
    if (updatedAny) showToast("💡 Tarifas aplicadas según tabulador");
}

function updateQuickRow(index, field, value) {
    quickRows[index][field] = value;
    if (field === 'amount') quickRows[index].isAuto = false;
    if (field === 'empId') {
        const emp = appData.employees.find(e => e.id == value);
        if (emp) quickRows[index].role = emp.role;
    }
    if (field === 'empId' || field === 'role') {
        const site = document.getElementById('qrSite').value;
        const act = getSelectVal('qrActivity');
        const tons = parseFloat(document.getElementById('qrTons').value) || 0;
        const autoPrice = getTabuladorPrice(site, act, tons, quickRows[index].role);
        if (autoPrice !== null) { quickRows[index].amount = autoPrice; quickRows[index].isAuto = true; }
    }
    renderQuickRows();
}

function renderQuickRows() {
    const container = document.getElementById('quickEntryList');
    if (quickRows.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">No hay personal. Haz clic en "+ Agregar Persona".</div>';
        return;
    }
    let html = '';
    quickRows.forEach((row, i) => {
        const autoClass = row.isAuto ? 'auto-calc' : '';
        const autoTitle = row.isAuto ? 'Calculado por Tabulador' : 'Monto manual';
        html += `
        <div class="qr-row">
            <select class="form-control qr-emp-select" onchange="updateQuickRow(${i}, 'empId', this.value)">
                <option value="">-- Seleccionar Empleado --</option>
                ${appData.employees.filter(e => (e.status !== 'Fuera de Servicio' && e.status !== 'Egreso') || e.id == row.empId).map(e => `<option value="${e.id}" ${e.id == row.empId ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}
            </select>
            <select class="form-control qr-role-select" onchange="updateQuickRow(${i}, 'role', this.value)">
                ${ROLES.map(r => `<option value="${esc(r)}" ${r == row.role ? 'selected' : ''}>${esc(r)}</option>`).join('')}
            </select>
            <select class="form-control qr-shift-select" onchange="updateQuickRow(${i}, 'shift', this.value)">
                <option value="Diurno" ${row.shift == 'Diurno' ? 'selected' : ''}>☀️ Diurno (D)</option>
                <option value="Nocturno" ${row.shift == 'Nocturno' ? 'selected' : ''}>🌙 Nocturno (N)</option>
                <option value="Mixto" ${row.shift == 'Mixto' ? 'selected' : ''}>⚖️ Mixto (M)</option>
            </select>
            <input type="number" class="form-control qr-amount-input ${autoClass}" placeholder="Monto ($)" value="${row.amount}" title="${autoTitle}" onchange="updateQuickRow(${i}, 'amount', parseFloat(this.value) || 0)">
            <button class="qr-delete" onclick="removeQuickRow(${i})" title="Quitar fila">✕</button>
        </div>`;
    });
    container.innerHTML = html;
}

function saveQuickOperation() {
    const p = document.getElementById('qrPeriod').value;
    const startD = parseInt(document.getElementById('qrStartDay').value);
    const endD = parseInt(document.getElementById('qrEndDay').value);
    const site = document.getElementById('qrSite').value;
    const act = getSelectVal('qrActivity');
    const obs = document.getElementById('qrObs').value.toUpperCase();
    const tons = parseFloat(document.getElementById('qrTons').value) || 0;
    const dim = daysInMonthOf(p);

    if (!p) { notify("Selecciona el periodo de nómina."); return; }
    if (!startD || !endD || startD > endD || startD < 1) { notify("Verifica los días de inicio y fin."); return; }
    if (endD > dim) { notify(`${p} solo tiene ${dim} días.`); return; }
    if (quickRows.length === 0) { notify("Debes agregar al menos a una persona a la lista."); return; }
    if (quickRows.some(r => !r.empId)) { notify("Hay filas sin empleado seleccionado. Verifica la lista."); return; }
    if (new Set(quickRows.map(r => String(r.empId))).size !== quickRows.length) { notify("Hay un empleado repetido en la lista."); return; }

    if (!appData.records[p]) appData.records[p] = {};
    const span = endD - startD + 1;

    const conflicted = quickRows.filter(r => {
        const row = appData.records[p][r.empId];
        return row && (parseFloat(r.amount) || 0) > 0 && hasConflict(normalizeRow(row), startD - 1, endD - 1, null, 0);
    }).map(r => (appData.employees.find(e => e.id == r.empId) || {}).name);
    
    if (conflicted.length && !confirm(`⚠️ Estas personas ya tienen guardias registradas en esos días:\n\n• ${conflicted.join('\n• ')}\n\n¿REEMPLAZAR esas guardias?`)) return;

    let finalObs = obs;
    if (tons > 0 && finalObs !== "") finalObs += ` / ${tons}TM`;
    else if (tons > 0) finalObs = `${tons}TM`;

    const hours = calcHours(act, span);
    let multipath = {};

    quickRows.forEach(row => {
        const eId = row.empId;
        const amount = parseFloat(row.amount) || 0;
        const userRow = normalizeRow(appData.records[p][eId]);
        for (let d = startD - 1; d <= endD - 1; d++) clearSpanAt(userRow, d);
        
        if (amount > 0) {
            const commonData = { role: row.role, site: site, activity: act, shift: row.shift, obs: finalObs, isPhantom: false, hours: hours, ...auditStamp() };
            userRow[startD - 1] = { amount: amount, span: span, ...commonData };
            for (let k = 1; k < span; k++) { userRow[startD - 1 + k] = { amount: 0, linked: true, span: 0, ...commonData }; }
        }
        appData.records[p][eId] = userRow;
        multipath[`records/${p}/${eId}`] = userRow;
    });

    dbUpdate(multipath, "✅ ¡Operación guardada en la nómina!").then(() => {
        renderTable(p);
        quickRows = [];
        document.getElementById('qrObs').value = '';
        document.getElementById('qrTons').value = '';
        addQuickRow();
    });
}

function printQuickEntry() {
    const p = document.getElementById('qrPeriod').value;
    const startD = document.getElementById('qrStartDay').value || '-';
    const endD = document.getElementById('qrEndDay').value || '-';
    const site = document.getElementById('qrSite').value;
    const act = getSelectVal('qrActivity');
    const obs = document.getElementById('qrObs').value.toUpperCase() || 'Ninguna';
    const tons = document.getElementById('qrTons').value || '0';

    if (quickRows.length === 0) { notify("Debes agregar al menos a una persona a la lista."); return; }
    if (quickRows.some(r => !r.empId)) { notify("Hay filas sin empleado seleccionado. Verifica la lista."); return; }

    const printArea = document.getElementById('printQuickEntrySection');
    let html = `<div class="qe-header">REPORTE DE OPERACIÓN - REGISTRO RÁPIDO</div>`;
    html += `<div style="font-size:10pt; color: #64748b; margin-bottom: 15px;">Generado el: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>`;
    html += `<div class="qe-info-grid">
                <div class="qe-info-item"><b>Periodo:</b> ${esc(p)}</div>
                <div class="qe-info-item"><b>Fechas:</b> Del ${esc(startD)} al ${esc(endD)}</div>
                <div class="qe-info-item"><b>Sitio:</b> ${esc(site)}</div>
                <div class="qe-info-item"><b>Actividad:</b> ${esc(act)}</div>
                <div class="qe-info-item"><b>Toneladas:</b> ${esc(tons)} TM</div>
                <div class="qe-info-item"><b>Embarcación / Notas:</b> ${esc(obs)}</div>
             </div>`;
    html += `<h3 style="margin-bottom:5px; border-bottom:1px solid #ccc;">Personal Asignado</h3>`;
    html += `<table class="sug-print-table"><thead><tr style="background:#f1f5f9;"><th>Empleado</th><th>Cargo</th><th>Turno</th><th style="text-align:right;">Monto ($)</th></tr></thead><tbody>`;

    let totalAmount = 0;
    quickRows.forEach(row => {
        const emp = appData.employees.find(e => e.id == row.empId);
        const amount = parseFloat(row.amount) || 0;
        totalAmount += amount;
        html += `<tr><td><b>${esc(emp ? emp.name : 'Desconocido')}</b></td><td>${esc(row.role)}</td><td>${esc(row.shift)}</td><td style="text-align:right;">$${amount}</td></tr>`;
    });
    html += `<tr style="font-weight:bold; background:#f8fafc;"><td colspan="3" style="text-align:right;">TOTAL OPERACIÓN:</td><td style="text-align:right; color:var(--accent);">$${totalAmount}</td></tr></tbody></table>`;

    printArea.innerHTML = html;
    document.body.classList.add('printing-quick-entry');
    window.print();
    document.body.classList.remove('printing-quick-entry');
}

/* =========================================
   SEGURIDAD Y LOGIN
========================================= */
auth.onAuthStateChanged(user => {
    if (!user) {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        return;
    }
    currentUserEmail = (user.email || '').toLowerCase();
    if (!USER_ROLES[currentUserEmail]) {
        alert("Tu cuenta no tiene un rol asignado. Contacta al administrador.");
        logoutUser();
        return;
    }
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    init().then(() => applyRoles(currentUserEmail));
});

function authErrorMsg(code) {
    switch (code) {
        case 'auth/invalid-email': return 'El correo no tiene un formato válido.';
        case 'auth/user-disabled': return 'Esta cuenta está deshabilitada. Contacta al administrador.';
        case 'auth/too-many-requests': return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
        case 'auth/network-request-failed': return 'Sin conexión a internet. Revisa tu red.';
        default: return 'Correo o contraseña incorrectos.';
    }
}

function loginUser(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const btn = document.getElementById('loginBtn');
    const err = document.getElementById('loginError');

    btn.innerText = "Iniciando..."; err.style.display = "none"; err.style.color = 'red';
    auth.signInWithEmailAndPassword(email, pass)
        .then(() => { btn.innerText = "Ingresar"; })
        .catch(error => {
            btn.innerText = "Ingresar";
            console.error(error.code);
            err.innerText = authErrorMsg(error.code);
            err.style.display = "block";
        });
}

(function addResetLink() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'link-btn'; b.textContent = '¿Olvidaste tu contraseña?';
    b.onclick = () => {
        const email = document.getElementById('loginEmail').value.trim();
        const err = document.getElementById('loginError');
        err.style.display = 'block';
        if (!email) { err.style.color = 'red'; err.innerText = 'Escribe tu correo arriba y vuelve a pulsar este enlace.'; return; }
        auth.sendPasswordResetEmail(email).catch(() => { }).finally(() => {
            err.style.color = '#15803d';
            err.innerText = 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';
        });
    };
    form.appendChild(b);
})();

function logoutUser() {
    auth.signOut().then(() => {
        appData = { employees: [], sites: [], activities: [], records: {}, historical2025: {}, tabuladores: {...DEFAULT_TABULADORES} };
        window.location.reload();
    });
}

function applyRoles(email) {
    const role = USER_ROLES[email.toLowerCase()] || "invitado";
    document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = '');
    const hide = ids => ids.forEach(id => { document.getElementById('nav-' + id).style.display = 'none'; });

    if (role === "adminglobal") {
        switchTab('config');
    } else if (role === "manager") {
        hide(['config', 'nomina', 'registro']);
        switchTab('sugerencias');
    } else if (role === "rrhh") {
        hide(['config', 'nomina', 'registro', 'graficos', 'analytics']);
        switchTab('sugerencias');
    } else if (role === "asistente") {
        hide(['config', 'nomina', 'sugerencias', 'graficos', 'analytics']);
        switchTab('registro');
    } else {
        alert("Tu cuenta no tiene un rol asignado. Contacta al administrador.");
        logoutUser();
    }
}

/* =========================================
   HERRAMIENTA DE MIGRACIÓN Y LIMPIEZA (FORZAR NOMBRE PROPIO)
========================================= */
function normalizarSitiosHistoricos() {
    try {
        if (!confirm("¿Deseas convertir TODOS los sitios (incluyendo los de Configuración y el historial) a formato Nombre Propio (Ej: 'Venalum', 'Casiterita')?")) return;

        const formatTitle = (str) => {
            if (!str) return '';
            const lowerWords = ['de', 'del', 'la', 'los', 'las', 'en', 'y', 'a'];
            return String(str).toLowerCase().trim().split(/\s+/).map((word, index) => {
                if (!word) return '';
                if (index > 0 && lowerWords.includes(word)) return word;
                return word.charAt(0).toUpperCase() + word.slice(1);
            }).join(' ');
        };

        if (!appData || !appData.records) {
            alert("⚠️ Los datos de la aplicación aún no se han cargado desde Firebase.");
            return;
        }

        let updates = {};
        let mapaSitiosExistentes = {};

        if (!Array.isArray(appData.sites)) appData.sites = [];
        
        let sitiosUnicos = [];
        let vistos = new Set();

        appData.sites.forEach(s => {
            if (!s || !String(s).trim()) return;
            let formatted = formatTitle(s);
            let key = formatted.toUpperCase();

            if (!vistos.has(key)) {
                vistos.add(key);
                sitiosUnicos.push(formatted);
            }
            mapaSitiosExistentes[key] = formatted;
        });

        appData.sites = sitiosUnicos;
        updates['sites'] = appData.sites;

        let registrosCorregidos = 0;

        Object.keys(appData.records).forEach(periodo => {
            const recsPeriodo = appData.records[periodo];
            if (!recsPeriodo) return;

            Object.keys(recsPeriodo).forEach(empId => {
                let row = recsPeriodo[empId];
                if (!Array.isArray(row)) return;

                let rowModificada = false;
                row.forEach(rec => {
                    if (!rec) return;

                    if (rec.site && typeof rec.site === 'string') {
                        let siteClean = rec.site.trim();
                        let siteUpper = siteClean.toUpperCase();
                        let nombreEstandar = mapaSitiosExistentes[siteUpper] || formatTitle(siteClean);

                        if (!mapaSitiosExistentes[siteUpper]) {
                            mapaSitiosExistentes[siteUpper] = nombreEstandar;
                            appData.sites.push(nombreEstandar);
                        }

                        if (rec.site !== nombreEstandar) {
                            rec.site = nombreEstandar;
                            rowModificada = true;
                            registrosCorregidos++;
                        }
                    }

                    if (rec.muelle && typeof rec.muelle === 'string' && rec.muelle.toUpperCase() !== 'N/A') {
                        let muelleClean = rec.muelle.trim();
                        let muelleUpper = muelleClean.toUpperCase();
                        let nombreEstandar = mapaSitiosExistentes[muelleUpper] || formatTitle(muelleClean);

                        if (!mapaSitiosExistentes[muelleUpper]) {
                            mapaSitiosExistentes[muelleUpper] = nombreEstandar;
                            appData.sites.push(nombreEstandar);
                        }

                        if (rec.muelle !== nombreEstandar) {
                            rec.muelle = nombreEstandar;
                            rowModificada = true;
                            registrosCorregidos++;
                        }
                    }
                });

                if (rowModificada) {
                    updates[`records/${periodo}/${empId}`] = row;
                }
            });
        });

        dbUpdate(updates, "✨ Normalización completa").then(() => {
            renderConfigLists();
            handleMonthChange();
            if (isTabActive('surveyors')) renderSurveyorTable(document.getElementById('monthSelectorSurv').value);
            alert(`✅ Formato actualizado con éxito:\n\n• Todos los sitios de la lista ahora tienen formato Nombre Propio.\n• ${registrosCorregidos} registros corregidos en el historial.`);
        });

    } catch (err) {
        console.error("Error en normalizarSitiosHistoricos:", err);
        alert("❌ Ocurrió un error al ejecutar la limpieza: " + err.message);
    }
}