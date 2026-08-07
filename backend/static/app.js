// ============================================================
// AutoPost Tabajara! - Logica principal do frontend
// ============================================================

const API_BASE = window.location.origin + "/api";

const MOODS = [
    { id: "pin", label: "📍 Só Local" },
    { id: "maluf", label: "✍️ Meu Estilo" },
    { id: "espirituosa", label: "Espirituosa" },
    { id: "seca", label: "Seca" },
    { id: "ironica", label: "Irônica" },
    { id: "storyteller", label: "Storyteller" },
    { id: "zoeira", label: "Zoeira" },
    { id: "cronica", label: "Crônica" },
];

const PHOTO_FILTERS = {
    none: { label: "Original", group: null },

    // ── 30ºS Brand ──────────────────────────────────────────
    "30s-kraft":   { label: "Kraft",   group: "30ºS", brightness: 1.02, contrast: 1.08, saturate: 0.82, temperature: 24, tint: { r: 60, g: 30, b: 10, a: 0.06 }, vignette: 0.12, clarity: 0, grayscale: 0 },
    "30s-ink":     { label: "Ink",     group: "30ºS", brightness: 0.92, contrast: 1.25, saturate: 0.75, temperature: 8, tint: { r: 17, g: 17, b: 17, a: 0.08 }, vignette: 0.18, clarity: 0, grayscale: 0 },
    "30s-stamp":   { label: "Stamp",   group: "30ºS", brightness: 1.05, contrast: 1.15, saturate: 0.88, temperature: 18, tint: { r: 50, g: 25, b: 5, a: 0.05 }, vignette: 0.08, clarity: 0, grayscale: 0 },
    "30s-golden":  { label: "Golden",  group: "30ºS", brightness: 1.08, contrast: 1.05, saturate: 0.90, temperature: 32, tint: { r: 242, g: 201, b: 76, a: 0.04 }, vignette: 0.06, clarity: 0, grayscale: 0 },
    "30s-mono":    { label: "Mono",    group: "30ºS", brightness: 1.05, contrast: 1.20, saturate: 0, temperature: 6, tint: { r: 60, g: 40, b: 20, a: 0.06 }, vignette: 0.10, clarity: 0, grayscale: 1 },

    // ── Fab Four ────────────────────────────────────────────
    "fab-four-red":   { label: "Red",   group: "Fab Four", brightness: 1.03, contrast: 1.18, saturate: 1.25, temperature: 12, tint: { r: 231, g: 76, b: 60, a: 0.05 }, vignette: 0.10, clarity: 0, grayscale: 0 },
    "fab-four-vivid": { label: "Vivid", group: "Fab Four", brightness: 1.06, contrast: 1.12, saturate: 1.35, temperature: 6, tint: { r: 50, g: 10, b: 30, a: 0.04 }, vignette: 0.05, clarity: 0, grayscale: 0 },
    "fab-four-warm":  { label: "Warm",  group: "Fab Four", brightness: 1.04, contrast: 1.10, saturate: 1.15, temperature: 20, tint: { r: 180, g: 50, b: 30, a: 0.04 }, vignette: 0.08, clarity: 0, grayscale: 0 },

    // ── Nordic ──────────────────────────────────────────────
    "nordic-frost":    { label: "Frost",    group: "Nordic", brightness: 1.06, contrast: 1.05, saturate: 0.85, temperature: -18, tint: { r: 10, g: 30, b: 60, a: 0.05 }, vignette: 0.06, clarity: 0, grayscale: 0 },
    "nordic-aurora":   { label: "Aurora",   group: "Nordic", brightness: 0.95, contrast: 1.15, saturate: 1.20, temperature: -12, tint: { r: 20, g: 60, b: 40, a: 0.05 }, vignette: 0.12, clarity: 0, grayscale: 0 },
    "nordic-midnight": { label: "Midnight", group: "Nordic", brightness: 0.88, contrast: 1.22, saturate: 0.90, temperature: -22, tint: { r: 15, g: 20, b: 50, a: 0.07 }, vignette: 0.18, clarity: 0, grayscale: 0 },

    // ── Lapland ─────────────────────────────────────────────
    "lapland-snow":  { label: "Snow",  group: "Lapland", brightness: 1.12, contrast: 0.95, saturate: 0.78, temperature: -8, tint: { r: 200, g: 210, b: 220, a: 0.04 }, vignette: 0.04, clarity: 0, grayscale: 0 },
    "lapland-cabin": { label: "Cabin", group: "Lapland", brightness: 1.04, contrast: 1.10, saturate: 0.88, temperature: 28, tint: { r: 80, g: 40, b: 15, a: 0.06 }, vignette: 0.14, clarity: 0, grayscale: 0 },
    "lapland-birch": { label: "Birch", group: "Lapland", brightness: 1.08, contrast: 1.02, saturate: 0.82, temperature: 4, tint: { r: 40, g: 50, b: 30, a: 0.04 }, vignette: 0.06, clarity: 0, grayscale: 0 },

    // ── Highlands ───────────────────────────────────────────
    "highlands-moss":  { label: "Moss",  group: "Highlands", brightness: 0.98, contrast: 1.08, saturate: 0.92, temperature: -4, tint: { r: 20, g: 50, b: 15, a: 0.06 }, vignette: 0.10, clarity: 0, grayscale: 0 },
    "highlands-mist":  { label: "Mist",  group: "Highlands", brightness: 1.10, contrast: 0.90, saturate: 0.75, temperature: -6, tint: { r: 30, g: 35, b: 45, a: 0.05 }, vignette: 0.08, clarity: 0, grayscale: 0 },
    "highlands-stone": { label: "Stone", group: "Highlands", brightness: 0.95, contrast: 1.18, saturate: 0.80, temperature: 2, tint: { r: 40, g: 35, b: 30, a: 0.06 }, vignette: 0.14, clarity: 0, grayscale: 0 },

    // ── Mediterranean ───────────────────────────────────────
    "med-terracota": { label: "Terracota", group: "Mediterranean", brightness: 1.05, contrast: 1.10, saturate: 1.05, temperature: 22, tint: { r: 180, g: 80, b: 40, a: 0.04 }, vignette: 0.06, clarity: 0, grayscale: 0 },
    "med-azur":      { label: "Azur",      group: "Mediterranean", brightness: 1.08, contrast: 1.05, saturate: 1.12, temperature: -6, tint: { r: 20, g: 50, b: 80, a: 0.04 }, vignette: 0.04, clarity: 0, grayscale: 0 },
    "med-sunset":    { label: "Sunset",    group: "Mediterranean", brightness: 1.10, contrast: 1.08, saturate: 1.08, temperature: 35, tint: { r: 200, g: 100, b: 40, a: 0.04 }, vignette: 0.08, clarity: 0, grayscale: 0 },

    // ── Desert ──────────────────────────────────────────────
    "desert-dune":  { label: "Dune",  group: "Desert", brightness: 1.08, contrast: 1.05, saturate: 0.85, temperature: 30, tint: { r: 200, g: 160, b: 80, a: 0.05 }, vignette: 0.06, clarity: 0, grayscale: 0 },
    "desert-oasis": { label: "Oasis", group: "Desert", brightness: 1.02, contrast: 1.12, saturate: 1.10, temperature: 18, tint: { r: 50, g: 40, b: 10, a: 0.04 }, vignette: 0.08, clarity: 0, grayscale: 0 },

    // ── Patagonia ────────────────────────────────────────────
    "patagonia-ice":  { label: "Ice",  group: "Patagonia", brightness: 1.04, contrast: 1.20, saturate: 0.92, temperature: -14, tint: { r: 15, g: 40, b: 60, a: 0.05 }, vignette: 0.10, clarity: 0, grayscale: 0 },
    "patagonia-wind": { label: "Wind", group: "Patagonia", brightness: 0.96, contrast: 1.25, saturate: 1.05, temperature: -4, tint: null, vignette: 0.14, clarity: 0, grayscale: 0 },

    // ── Tropical ────────────────────────────────────────────
    "tropical-jungle": { label: "Jungle", group: "Tropical", brightness: 0.98, contrast: 1.10, saturate: 1.28, temperature: 8, tint: { r: 10, g: 60, b: 20, a: 0.04 }, vignette: 0.08, clarity: 0, grayscale: 0 },
    "tropical-beach":  { label: "Beach",  group: "Tropical", brightness: 1.10, contrast: 1.02, saturate: 1.15, temperature: 14, tint: { r: 40, g: 180, b: 200, a: 0.03 }, vignette: 0.04, clarity: 0, grayscale: 0 },

    // ── Film ────────────────────────────────────────────────
    "film-kodak":  { label: "Kodak",  group: "Film", brightness: 1.04, contrast: 1.08, saturate: 1.10, temperature: 16, tint: { r: 255, g: 200, b: 50, a: 0.03 }, vignette: 0.10, clarity: 0, grayscale: 0 },
    "film-fuji":   { label: "Fuji",   group: "Film", brightness: 1.02, contrast: 1.06, saturate: 1.05, temperature: -8, tint: { r: 30, g: 80, b: 60, a: 0.03 }, vignette: 0.08, clarity: 0, grayscale: 0 },
    "film-portra": { label: "Portra", group: "Film", brightness: 1.06, contrast: 0.95, saturate: 0.90, temperature: 12, tint: { r: 60, g: 40, b: 30, a: 0.04 }, vignette: 0.06, clarity: 0, grayscale: 0 },

};

const PAGE_TITLES = {
    dashboard: "Dashboard",
    calendar: "Calendário",
    history: "Histórico",
    "content-gen": "Gerar Conteúdo",
    settings: "Configurações",
};

const PROGRESS_STEPS = [
    "📤 Enviando fotos...",
    "🔍 Analisando fotos (EXIF e localização)...",
    "✍️ Criando legendas com Claude...",
    "🏷️ Selecionando hashtags...",
];

// Estado global
let selectedPhotos = [];       // fotos do lote de "nova postagem" em andamento
let currentModalIndex = 0;
let selectedFrequency = 1;

let queueData = [];             // todos os posts vindos do backend
let currentHistoryFilter = "all";
let _dashboardPollTimer = null;

let calendarViewDate = new Date();
calendarViewDate.setDate(1);
let selectedDayKey = null;

let editingPostId = null;
let deletingPostId = null;

// ============================================================
// INICIALIZACAO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initAuth();

    setupLogin();
    setupSidebar();
    setupDropzone();
    setupStoryDropzone();
    setupCarouselDropzone();
    setupStatsControls();
    setupNewPostModal();
    setupScheduleModal();
    setupEditModal();
    setupDeleteModal();
    setupPublishModal();
    setupFilters();
    setupAccountSwitcher();
    setupContentGenPage();
    setupPostActionsModal();
    loadIgAccounts();

    const params = new URLSearchParams(window.location.search);
    const toast = params.get("toast");
    if (toast) {
        showToast(toast, toast.includes("Nenhuma") ? "error" : "success", 6000);
        window.history.replaceState({}, "", "/");
        navigateTo("settings");
        loadInstagramStatus();
    }
});

// ============================================================
// HELPERS GERAIS
// ============================================================

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatDateBR(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthLabel(date) {
    const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return `${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatKeyLongBR(key) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return capitalize(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }));
}

function showToast(message, type = "success", duration = 4500) {
    const container = document.getElementById("toastContainer");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), duration);
}

// Wrapper de fetch: se o servidor pedir login (401), mostra a tela de senha.
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, { credentials: "same-origin", cache: "no-store", ...options });
    if (res.status === 401) {
        showLogin();
    }
    return res;
}

// ============================================================
// LOGIN / AUTENTICACAO
// ============================================================

async function initAuth() {
    try {
        const res = await fetch(`${API_BASE}/auth-status`, { credentials: "same-origin" });
        const data = await res.json();
        if (data.auth_required && !data.authenticated) {
            showLogin();
        } else {
            showApp();
        }
    } catch (e) {
        showApp();
    }
}

function showLogin() {
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("appShell").classList.add("hidden");
}

function showApp() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appShell").classList.remove("hidden");
    loadQueue();
    _startDashboardPoll();
}

function setupLogin() {
    const input = document.getElementById("loginPasswordInput");
    const errorEl = document.getElementById("loginError");

    async function doLogin() {
        errorEl.classList.add("hidden");
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: input.value })
            });
            if (res.ok) {
                input.value = "";
                showApp();
            } else {
                errorEl.classList.remove("hidden");
            }
        } catch (e) {
            errorEl.textContent = "Erro de conexão. Tente novamente.";
            errorEl.classList.remove("hidden");
        }
    }

    document.getElementById("loginBtn").addEventListener("click", doLogin);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") doLogin();
    });
}

async function logout() {
    try {
        await apiFetch("/logout", { method: "POST" });
    } catch (e) {
        // segue o jogo - mostra login de qualquer forma
    }
    showLogin();
}

// ============================================================
// CONEXAO COM BACKEND (status pill)
// ============================================================

// ============================================================
// SIDEBAR / NAVEGACAO ENTRE PAGINAS
// ============================================================

function closeMobileMenu() {
    document.querySelector(".sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("active");
}

function setupSidebar() {
    document.getElementById("hamburgerBtn").addEventListener("click", () => {
        document.querySelector(".sidebar").classList.toggle("open");
        document.getElementById("sidebarOverlay").classList.toggle("active");
    });

    document.getElementById("sidebarOverlay").addEventListener("click", closeMobileMenu);

    document.querySelectorAll(".side-nav-item[data-page]").forEach((btn) => {
        btn.addEventListener("click", () => {
            switchPage(btn.dataset.page);
            closeMobileMenu();
        });
    });

    document.querySelectorAll(".link-btn[data-page]").forEach((btn) => {
        btn.addEventListener("click", () => switchPage(btn.dataset.page));
    });

    document.getElementById("userAvatarBtn").addEventListener("click", () => switchPage("settings"));
}

function switchPage(pageName) {
    document.querySelectorAll(".side-nav-item[data-page]").forEach((b) => {
        b.classList.toggle("active", b.dataset.page === pageName);
    });
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    document.getElementById(`page-${pageName}`).classList.add("active");
    document.getElementById("pageTitle").textContent = PAGE_TITLES[pageName] || "Dashboard";

    if (pageName === "calendar") {
        selectedDayKey = null;
        renderFullCalendarPage();
    } else if (pageName === "history") {
        renderHistoryList();
    } else if (pageName === "content-gen") {
        renderContentGenPage();
    } else if (pageName === "settings") {
        loadSettingsPage();
    }

    if (pageName === "dashboard") {
        loadQueue();
        _startDashboardPoll();
    } else {
        _stopDashboardPoll();
    }

    if (pageName !== "content-gen") {
        _stopContentGenPoll();
    }
}

function _startDashboardPoll() {
    _stopDashboardPoll();
    _dashboardPollTimer = setInterval(loadQueue, 600000);
}

function _stopDashboardPoll() {
    if (_dashboardPollTimer) {
        clearInterval(_dashboardPollTimer);
        _dashboardPollTimer = null;
    }
}

document.addEventListener("visibilitychange", () => {
    const onDashboard = document.getElementById("page-dashboard")?.classList.contains("active");
    if (!onDashboard) return;
    if (document.hidden) {
        _stopDashboardPoll();
    } else {
        loadQueue();
        _startDashboardPoll();
    }
});

(function setupPullToRefresh() {
    let startY = 0;
    let pulling = false;
    const THRESHOLD = 80;
    const ptr = document.getElementById("pullToRefresh");
    const page = document.getElementById("page-dashboard");

    page.addEventListener("touchstart", (e) => {
        if (window.scrollY > 0 || !page.classList.contains("active")) return;
        startY = e.touches[0].clientY;
        pulling = true;
    }, { passive: true });

    page.addEventListener("touchmove", (e) => {
        if (!pulling) return;
        const dy = e.touches[0].clientY - startY;
        if (dy > 10 && window.scrollY === 0) {
            ptr.classList.add("visible");
        }
    }, { passive: true });

    page.addEventListener("touchend", async () => {
        if (!pulling) return;
        pulling = false;
        if (!ptr.classList.contains("visible")) return;
        ptr.classList.remove("visible");
        ptr.classList.add("refreshing");
        await loadQueue();
        ptr.classList.remove("refreshing");
    });
})();

// ============================================================
// UPLOAD DE FOTOS (dropzone + pipeline de processamento)
// ============================================================

function setupDropzone() {
    const input = document.getElementById("photoInput");
    const inner = document.getElementById("dropzoneInner");

    inner.addEventListener("click", () => input.click());

    input.addEventListener("change", (e) => {
        handleNewFiles(e.target.files);
        input.value = "";
    });

    inner.addEventListener("dragover", (e) => {
        e.preventDefault();
        inner.classList.add("drag-over");
    });
    inner.addEventListener("dragleave", () => inner.classList.remove("drag-over"));
    inner.addEventListener("drop", (e) => {
        e.preventDefault();
        inner.classList.remove("drag-over");
        if (e.dataTransfer.files.length > 0) handleNewFiles(e.dataTransfer.files);
    });
}

function showProgressCard() {
    document.getElementById("progressCard").classList.remove("hidden");
    renderProgressChecklist(0);
}

function hideProgressCard() {
    document.getElementById("progressCard").classList.add("hidden");
}

// Rodinha global e discreta no topo - visível de qualquer página enquanto
// as fotos são enviadas/processadas/analisadas.
function showTopbarSpinner(text) {
    document.getElementById("topbarSpinnerText").textContent = text || "Processando...";
    document.getElementById("topbarSpinner").classList.remove("hidden");
}

function updateTopbarSpinner(text) {
    document.getElementById("topbarSpinnerText").textContent = text;
}

function hideTopbarSpinner() {
    document.getElementById("topbarSpinner").classList.add("hidden");
}

// Troca o conteúdo da dropzone por uma rodinha enquanto processa, e restaura
// depois. O elemento em si permanece, então os listeners de clique/drop seguem valendo.
function setDropzoneBusy(busy, text) {
    const inner = document.getElementById("dropzoneInner");
    if (busy) {
        inner.innerHTML = `
            <span class="spinner spinner-dark dropzone-spinner"></span>
            <p class="dropzone-text">${text || "Processando..."}</p>
            <p class="dropzone-hint">Aguarde, a mágica Tabajara está acontecendo</p>`;
    } else {
        inner.innerHTML = `
            <span class="dropzone-icon">☁️</span>
            <p class="dropzone-text">Solte suas fotos aqui ou clique para enviar</p>
            <p class="dropzone-hint">JPG, PNG, HEIC — pode escolher várias de uma vez</p>`;
    }
}

function renderProgressChecklist(activeIndex) {
    const list = document.getElementById("progressChecklist");
    list.innerHTML = "";
    PROGRESS_STEPS.forEach((label, i) => {
        const li = document.createElement("li");
        if (i < activeIndex) li.classList.add("done");
        const check = document.createElement("span");
        check.className = "check";
        check.textContent = i < activeIndex ? "✅" : (i === activeIndex ? "⏳" : "⬜");
        const text = document.createElement("span");
        text.textContent = label;
        li.appendChild(check);
        li.appendChild(text);
        list.appendChild(li);
    });
}

async function handleNewFiles(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    selectedPhotos = [];
    const analysisErrors = [];
    const total = files.length;
    const plural = total > 1 ? "s" : "";

    showProgressCard();
    showTopbarSpinner(`Enviando ${total} foto${plural}...`);
    setDropzoneBusy(true, `Enviando ${total} foto${plural}...`);

    try {
        for (const file of files) {
            const rawBase64 = await fileToBase64(file);
            selectedPhotos.push({
                id: `photo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                file,
                base64: rawBase64,
                exif: null,
                caption: "",
                captionOptions: [],
                hashtags: [],
                location: "",
                taggedPeople: [],
                contentType: "",
                activeMood: null,
                processingError: null,
            });
        }
        renderProgressChecklist(1);

        for (let i = 0; i < selectedPhotos.length; i++) {
            const msg = `Analisando foto ${i + 1} de ${total}...`;
            updateTopbarSpinner(msg);
            setDropzoneBusy(true, msg);
            await processPhotoOnServer(selectedPhotos[i]);
        }
        renderProgressChecklist(2);

        for (let i = 0; i < selectedPhotos.length; i++) {
            const photo = selectedPhotos[i];
            if (photo.processingError) continue;
            const msg = `Gerando legenda ${i + 1} de ${total} com IA...`;
            updateTopbarSpinner(msg);
            setDropzoneBusy(true, msg);
            try {
                const res = await apiFetch(`/analyze-image`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        photo: photo.base64,
                        location: photo.location || "",
                        date: (photo.exif && photo.exif.dateTime) || ""
                    })
                });
                const data = await res.json();
                if (data.success) {
                    photo.captionOptions = data.captions || [];
                    photo.caption = data.caption || "";
                    photo.hashtags = data.hashtags || [];
                    photo.contentType = data.content_type || "";
                    if (photo.location) {
                        try {
                            const moodRes = await apiFetch(`/rewrite-caption`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    caption: photo.caption,
                                    mood: "pin",
                                    location: photo.location || "",
                                    content_type: photo.contentType || ""
                                })
                            });
                            const moodData = await moodRes.json();
                            if (moodData.success && moodData.caption) {
                                photo.captionOptions.unshift({ style: "📍 Só Local", text: moodData.caption });
                                photo.caption = moodData.caption;
                                photo.activeMood = "pin";
                            }
                        } catch (_) {}
                    } else {
                        photo.caption = "";
                        photo.activeMood = null;
                    }
                } else if (data.error) {
                    analysisErrors.push(data.error);
                }
            } catch (e) {
                analysisErrors.push("Falha de conexão com o servidor.");
            }
        }
        renderProgressChecklist(4);
        await sleep(300);
    } finally {
        hideProgressCard();
        hideTopbarSpinner();
        setDropzoneBusy(false);
    }

    const withErrors = selectedPhotos.filter((p) => p.processingError);
    if (withErrors.length > 0) {
        showToast(`${withErrors.length} foto(s) não puderam ser processadas e foram ignoradas.`, "error");
        selectedPhotos = selectedPhotos.filter((p) => !p.processingError);
    }
    if (analysisErrors.length > 0) {
        showToast(`A análise com IA falhou em ${analysisErrors.length} foto(s). Você pode escrever as legendas manualmente.`, "error");
    }
    if (selectedPhotos.length === 0) {
        showToast("Nenhuma foto pôde ser processada.", "error");
        return;
    }

    currentModalIndex = 0;
    openNewPostModal();
}

async function processPhotoOnServer(photo) {
    try {
        const res = await apiFetch(`/process-photo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photo: photo.base64 })
        });
        const data = await res.json();

        if (data.success) {
            photo.base64 = data.normalized_photo;
            photo.exif = data.exif;
            photo.location = data.exif.locationName || "";
        } else {
            photo.processingError = data.error || "Erro ao processar foto";
        }
    } catch (e) {
        photo.processingError = "Não foi possível conectar ao servidor";
    }
}

// ============================================================
// FILTROS DE FOTO (Canvas API)
// ============================================================

let _filterOriginalImage = null;

// ============================================================
// CROP / ROTATION / ZOOM
// ============================================================

const ASPECT_RATIOS = {
    "free": null,
    "1:1": 1,
    "4:5": 4 / 5,
    "1.91:1": 1.91,
};

let _cropState = { panX: 0, panY: 0, zoom: 100, rotation: 0, aspect: "free" };
let _isDragging = false;
let _dragStart = { x: 0, y: 0, panX: 0, panY: 0 };

function getCropState() {
    const photo = getCurrentPhoto();
    if (!photo) return _cropState;
    if (!photo.cropState) {
        photo.cropState = { panX: 0, panY: 0, zoom: 100, rotation: 0, aspect: "free" };
    }
    return photo.cropState;
}

function updateViewportAspect() {
    const state = getCropState();
    const viewport = document.getElementById("cropViewport");
    const ratio = ASPECT_RATIOS[state.aspect];
    if (!ratio) {
        if (_filterOriginalImage) {
            const isRotated = state.rotation % 180 !== 0;
            const w = isRotated ? _filterOriginalImage.naturalHeight : _filterOriginalImage.naturalWidth;
            const h = isRotated ? _filterOriginalImage.naturalWidth : _filterOriginalImage.naturalHeight;
            viewport.style.aspectRatio = `${w / h}`;
        } else {
            viewport.style.aspectRatio = "1";
        }
    } else {
        viewport.style.aspectRatio = `${ratio}`;
    }
}

function updateCropTransform() {
    const state = getCropState();
    const img = document.getElementById("newPostImage");
    const canvas = document.getElementById("filterCanvas");
    const viewport = document.getElementById("cropViewport");

    if (!_filterOriginalImage) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const isRotated = state.rotation % 180 !== 0;
    const natW = _filterOriginalImage.naturalWidth;
    const natH = _filterOriginalImage.naturalHeight;
    const imgW = isRotated ? natH : natW;
    const imgH = isRotated ? natW : natH;

    const scaleToFit = Math.max(vw / imgW, vh / imgH);
    const zoom = state.zoom / 100;
    const finalScale = scaleToFit * zoom;

    const displayW = natW * finalScale;
    const displayH = natH * finalScale;

    const maxPanX = Math.max(0, ((isRotated ? displayH : displayW) - vw) / 2);
    const maxPanY = Math.max(0, ((isRotated ? displayW : displayH) - vh) / 2);
    state.panX = Math.max(-maxPanX, Math.min(maxPanX, state.panX));
    state.panY = Math.max(-maxPanY, Math.min(maxPanY, state.panY));

    state._viewportW = vw;
    state._viewportH = vh;

    const transform = `translate(${state.panX}px, ${state.panY}px) rotate(${state.rotation}deg) scale(${finalScale})`;

    img.style.width = `${natW}px`;
    img.style.height = `${natH}px`;
    img.style.transform = transform;
    img.style.left = `${(vw - natW) / 2}px`;
    img.style.top = `${(vh - natH) / 2}px`;

    const cw = canvas.width || natW;
    const ch = canvas.height || natH;
    const canvasScale = finalScale * (natW / cw);
    const canvasTransform = `translate(${state.panX}px, ${state.panY}px) rotate(${state.rotation}deg) scale(${canvasScale})`;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    canvas.style.transform = canvasTransform;
    canvas.style.left = `${(vw - cw) / 2}px`;
    canvas.style.top = `${(vh - ch) / 2}px`;
}

function clampPan() {
    updateCropTransform();
}

function setupCropControls() {
    const viewport = document.getElementById("cropViewport");

    document.getElementById("rotateLeftBtn").addEventListener("click", () => {
        const state = getCropState();
        state.rotation = (state.rotation - 90 + 360) % 360;
        state.panX = 0;
        state.panY = 0;
        updateCropTransform();
    });

    document.getElementById("rotateRightBtn").addEventListener("click", () => {
        const state = getCropState();
        state.rotation = (state.rotation + 90) % 360;
        state.panX = 0;
        state.panY = 0;
        updateCropTransform();
    });

    document.getElementById("aspectRatioSelect").addEventListener("change", (e) => {
        const state = getCropState();
        state.aspect = e.target.value;
        state.panX = 0;
        state.panY = 0;
        updateViewportAspect();
        updateCropTransform();
    });

    document.getElementById("cropZoom").addEventListener("input", (e) => {
        const state = getCropState();
        state.zoom = parseInt(e.target.value);
        document.getElementById("cropZoomValue").textContent = state.zoom + "%";
        updateCropTransform();
    });

    document.getElementById("cropResetBtn").addEventListener("click", () => {
        const photo = getCurrentPhoto();
        if (photo) {
            photo.cropState = { panX: 0, panY: 0, zoom: 100, rotation: 0, aspect: "free" };
        }
        document.getElementById("cropZoom").value = 100;
        document.getElementById("cropZoomValue").textContent = "100%";
        document.getElementById("aspectRatioSelect").value = "free";
        updateViewportAspect();
        updateCropTransform();
    });

    // Pan via mouse
    viewport.addEventListener("mousedown", (e) => {
        e.preventDefault();
        _isDragging = true;
        const state = getCropState();
        _dragStart = { x: e.clientX, y: e.clientY, panX: state.panX, panY: state.panY };
    });

    window.addEventListener("mousemove", (e) => {
        if (!_isDragging) return;
        const state = getCropState();
        state.panX = _dragStart.panX + (e.clientX - _dragStart.x);
        state.panY = _dragStart.panY + (e.clientY - _dragStart.y);
        updateCropTransform();
    });

    window.addEventListener("mouseup", () => { _isDragging = false; });

    // Pan via touch
    viewport.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            _isDragging = true;
            const t = e.touches[0];
            const state = getCropState();
            _dragStart = { x: t.clientX, y: t.clientY, panX: state.panX, panY: state.panY };
        }
    }, { passive: true });

    viewport.addEventListener("touchmove", (e) => {
        if (!_isDragging || e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        const state = getCropState();
        state.panX = _dragStart.panX + (t.clientX - _dragStart.x);
        state.panY = _dragStart.panY + (t.clientY - _dragStart.y);
        updateCropTransform();
    }, { passive: false });

    viewport.addEventListener("touchend", () => { _isDragging = false; });
}

function restoreCropUI() {
    const state = getCropState();
    document.getElementById("cropZoom").value = state.zoom;
    document.getElementById("cropZoomValue").textContent = state.zoom + "%";
    document.getElementById("aspectRatioSelect").value = state.aspect;
    updateViewportAspect();
}

function applyPhotoFilter() {
    const filterKey = document.getElementById("filterSelect").value;
    const intensity = parseInt(document.getElementById("filterIntensity").value) / 100;
    document.getElementById("filterIntensityValue").textContent = Math.round(intensity * 100) + "%";

    const photo = getCurrentPhoto();
    if (!photo) return;

    photo.filterKey = filterKey;
    photo.filterIntensity = Math.round(intensity * 100);

    if (filterKey === "none" || intensity === 0) {
        document.getElementById("newPostImage").style.display = "";
        document.getElementById("filterCanvas").style.display = "none";
        updateCropTransform();
        return;
    }

    if (!_filterOriginalImage) return;

    const filter = PHOTO_FILTERS[filterKey];
    if (!filter) return;

    const canvas = document.getElementById("filterCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const img = _filterOriginalImage;

    const MAX_PREVIEW = 1200;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const previewScale = Math.min(1, MAX_PREVIEW / Math.max(natW, natH));
    const pw = Math.round(natW * previewScale);
    const ph = Math.round(natH * previewScale);

    canvas.width = pw;
    canvas.height = ph;

    const b = 1 + ((filter.brightness || 1) - 1) * intensity;
    const c = 1 + ((filter.contrast || 1) - 1) * intensity;
    const s = filter.grayscale
        ? 1 - intensity
        : 1 + ((filter.saturate || 1) - 1) * intensity;

    let cssFilter = `brightness(${b}) contrast(${c}) saturate(${s})`;
    if (filter.grayscale) {
        cssFilter += ` grayscale(${intensity})`;
    }
    if (filter.temperature) {
        const hueShift = filter.temperature * 0.5 * intensity;
        cssFilter += ` hue-rotate(${hueShift}deg)`;
    }

    ctx.filter = cssFilter;
    ctx.drawImage(img, 0, 0, pw, ph);
    ctx.filter = "none";

    if (filter.tint) {
        const t = filter.tint;
        ctx.fillStyle = `rgba(${t.r},${t.g},${t.b},${(t.a || 0.05) * intensity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (filter.clarity && filter.clarity > 0) {
        ctx.globalCompositeOperation = "overlay";
        ctx.globalAlpha = filter.clarity * intensity * 0.3;
        ctx.drawImage(canvas, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
    }

    if (filter.vignette && filter.vignette > 0) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const r = Math.max(cx, cy);
        const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.2);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${filter.vignette * intensity})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    document.getElementById("newPostImage").style.display = "none";
    canvas.style.display = "";
    updateCropTransform();
}

function getFilteredBase64(photo) {
    const crop = photo.cropState || { panX: 0, panY: 0, zoom: 100, rotation: 0, aspect: "free" };
    const hasFilter = photo.filterKey && photo.filterKey !== "none" && photo.filterIntensity;
    const hasCrop = crop.zoom !== 100 || crop.rotation !== 0 || crop.panX !== 0 || crop.panY !== 0 || (crop.aspect && crop.aspect !== "free");

    if (!hasFilter && !hasCrop) {
        return photo.base64;
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const natW = img.naturalWidth;
            const natH = img.naturalHeight;
            const isRotated = crop.rotation % 180 !== 0;
            const srcW = isRotated ? natH : natW;
            const srcH = isRotated ? natW : natH;

            const ratio = ASPECT_RATIOS[crop.aspect];
            let outW, outH;
            if (ratio) {
                if (srcW / srcH > ratio) {
                    outH = srcH;
                    outW = Math.round(srcH * ratio);
                } else {
                    outW = srcW;
                    outH = Math.round(srcW / ratio);
                }
            } else {
                outW = srcW;
                outH = srcH;
            }

            const zoom = crop.zoom / 100;
            const scaleToFit = Math.max(outW / srcW, outH / srcH);
            const finalScale = scaleToFit * zoom;

            const c = document.createElement("canvas");
            c.width = outW;
            c.height = outH;
            const ctx = c.getContext("2d");

            const filter = hasFilter ? PHOTO_FILTERS[photo.filterKey] : null;
            if (filter) {
                const intensity = (photo.filterIntensity || 100) / 100;
                const b = 1 + ((filter.brightness || 1) - 1) * intensity;
                const co = 1 + ((filter.contrast || 1) - 1) * intensity;
                const s = filter.grayscale ? 1 - intensity : 1 + ((filter.saturate || 1) - 1) * intensity;
                let cssF = `brightness(${b}) contrast(${co}) saturate(${s})`;
                if (filter.grayscale) cssF += ` grayscale(${intensity})`;
                if (filter.temperature) cssF += ` hue-rotate(${filter.temperature * 0.5 * intensity}deg)`;
                ctx.filter = cssF;
            }

            const vpW = crop._viewportW || 400;
            const vpH = crop._viewportH || 400;
            const panXScaled = crop.panX * (outW / vpW);
            const panYScaled = crop.panY * (outH / vpH);

            ctx.save();
            ctx.translate(outW / 2 + panXScaled, outH / 2 + panYScaled);
            ctx.rotate((crop.rotation * Math.PI) / 180);
            ctx.scale(finalScale, finalScale);
            ctx.drawImage(img, -natW / 2, -natH / 2);
            ctx.restore();
            ctx.filter = "none";

            if (filter) {
                const intensity = (photo.filterIntensity || 100) / 100;
                if (filter.tint) {
                    const t = filter.tint;
                    ctx.fillStyle = `rgba(${t.r},${t.g},${t.b},${(t.a || 0.05) * intensity})`;
                    ctx.fillRect(0, 0, c.width, c.height);
                }
                if (filter.clarity && filter.clarity > 0) {
                    ctx.globalCompositeOperation = "overlay";
                    ctx.globalAlpha = filter.clarity * intensity * 0.3;
                    ctx.drawImage(c, 0, 0);
                    ctx.globalCompositeOperation = "source-over";
                    ctx.globalAlpha = 1.0;
                }
                if (filter.vignette && filter.vignette > 0) {
                    const cx = c.width / 2, cy = c.height / 2;
                    const r = Math.max(cx, cy);
                    const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.2);
                    grad.addColorStop(0, "rgba(0,0,0,0)");
                    grad.addColorStop(1, `rgba(0,0,0,${filter.vignette * intensity})`);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, c.width, c.height);
                }
            }
            resolve(c.toDataURL("image/jpeg", 1.0));
        };
        img.src = photo.base64;
    });
}

// ============================================================
// MODAL: NOVA POSTAGEM (revisão foto a foto)
// ============================================================

function setupNewPostModal() {
    document.getElementById("closeNewPostBtn").addEventListener("click", () => {
        document.getElementById("newPostModal").classList.add("hidden");
        selectedPhotos = [];
    });

    document.getElementById("movePhotoUpBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        if (currentModalIndex > 0) {
            [selectedPhotos[currentModalIndex - 1], selectedPhotos[currentModalIndex]] =
                [selectedPhotos[currentModalIndex], selectedPhotos[currentModalIndex - 1]];
            currentModalIndex--;
            renderNewPostCard();
        }
    });

    document.getElementById("movePhotoDownBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        if (currentModalIndex < selectedPhotos.length - 1) {
            [selectedPhotos[currentModalIndex], selectedPhotos[currentModalIndex + 1]] =
                [selectedPhotos[currentModalIndex + 1], selectedPhotos[currentModalIndex]];
            currentModalIndex++;
            renderNewPostCard();
        }
    });

    document.getElementById("prevPhotoBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        if (currentModalIndex > 0) {
            currentModalIndex--;
            renderNewPostCard();
        }
    });

    document.getElementById("nextPhotoBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        if (currentModalIndex < selectedPhotos.length - 1) {
            currentModalIndex++;
            renderNewPostCard();
        }
    });

    document.getElementById("addHashtagBtn").addEventListener("click", addHashtagToCurrent);
    document.getElementById("newHashtagInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addHashtagToCurrent();
        }
    });

    document.getElementById("regenHashtagsBtn").addEventListener("click", regenerateHashtags);

    const filterSelect = document.getElementById("filterSelect");
    const groups = {};
    const groupOrder = [];
    for (const [key, f] of Object.entries(PHOTO_FILTERS)) {
        if (key === "none") continue;
        const g = f.group || "Outros";
        if (!groups[g]) { groups[g] = []; groupOrder.push(g); }
        groups[g].push({ key, label: f.label });
    }
    for (const groupName of groupOrder) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = groupName;
        for (const item of groups[groupName]) {
            const opt = document.createElement("option");
            opt.value = item.key;
            opt.textContent = item.label;
            optgroup.appendChild(opt);
        }
        filterSelect.appendChild(optgroup);
    }

    filterSelect.addEventListener("change", applyPhotoFilter);
    document.getElementById("filterIntensity").addEventListener("input", applyPhotoFilter);

    setupCropControls();

    document.getElementById("reviewScheduleBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        openScheduleModal();
    });
}

function openNewPostModal() {
    document.getElementById("newPostModal").classList.remove("hidden");
    renderNewPostCard();
}

function getCurrentPhoto() {
    return selectedPhotos[currentModalIndex];
}

function renderNewPostCard() {
    const photo = getCurrentPhoto();
    if (!photo) return;

    document.getElementById("newPostPosition").textContent = `${currentModalIndex + 1} de ${selectedPhotos.length}`;
    document.getElementById("movePhotoUpBtn").disabled = currentModalIndex === 0;
    document.getElementById("movePhotoDownBtn").disabled = currentModalIndex >= selectedPhotos.length - 1;
    document.getElementById("newPostImage").src = photo.base64;
    document.getElementById("newPostImage").style.display = "";
    document.getElementById("filterCanvas").style.display = "none";

    _filterOriginalImage = new Image();
    _filterOriginalImage.onload = () => {
        document.getElementById("filterSelect").value = photo.filterKey || "none";
        document.getElementById("filterIntensity").value = photo.filterIntensity || 100;
        document.getElementById("filterIntensityValue").textContent = (photo.filterIntensity || 100) + "%";
        restoreCropUI();
        updateCropTransform();
        if (photo.filterKey && photo.filterKey !== "none") applyPhotoFilter();
    };
    _filterOriginalImage.src = photo.base64;

    if (photo.exif) {
        const settings = [
            photo.exif.cameraModel,
            photo.exif.focalLength ? `${photo.exif.focalLength}mm` : null,
            photo.exif.aperture ? `f/${photo.exif.aperture}` : null,
            photo.exif.iso ? `ISO${photo.exif.iso}` : null
        ].filter(Boolean).join(" • ");

        document.getElementById("exifCamera").textContent = settings || "Câmera desconhecida";
        document.getElementById("exifDate").textContent = photo.exif.dateTime ? `🕐 ${photo.exif.dateTime}` : "";
    } else {
        document.getElementById("exifCamera").textContent = "Sem dados EXIF";
        document.getElementById("exifDate").textContent = "";
    }
    document.getElementById("exifLocationLine").textContent = photo.location
        ? `📍 ${photo.location}`
        : "📍 Sem dados de localização";

    document.getElementById("captionTextarea").value = photo.caption || "";
    document.getElementById("locationInput").value = photo.location || "";
    document.getElementById("taggedPeopleInput").value = (photo.taggedPeople || []).join(", ");

    renderMoodChips(photo);
    renderHashtagList(photo);

    document.getElementById("prevPhotoBtn").disabled = currentModalIndex === 0;
    document.getElementById("nextPhotoBtn").disabled = currentModalIndex === selectedPhotos.length - 1;
}

function renderMoodChips(photo, loadingMood = null) {
    const container = document.getElementById("moodChips");
    container.innerHTML = "";

    MOODS.forEach((mood) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mood-chip" + (photo.activeMood === mood.id ? " active" : "");
        btn.textContent = loadingMood === mood.id ? "Gerando..." : mood.label;
        btn.disabled = loadingMood !== null;
        btn.addEventListener("click", () => applyMood(photo, mood.id));
        container.appendChild(btn);
    });
}

async function applyMood(photo, moodId) {
    saveCurrentReviewFields();
    const currentCaption = document.getElementById("captionTextarea").value;
    renderMoodChips(photo, moodId);

    try {
        const res = await apiFetch(`/rewrite-caption`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                caption: currentCaption,
                mood: moodId,
                location: photo.location || "",
                content_type: photo.contentType || ""
            })
        });
        const data = await res.json();
        if (data.success) {
            photo.caption = data.caption;
            photo.activeMood = moodId;
            document.getElementById("captionTextarea").value = data.caption;
        } else if (data.error) {
            showToast(data.error, "error");
        }
    } catch (e) {
        showToast("Erro ao gerar legenda. Verifique a conexão.", "error");
    } finally {
        renderMoodChips(photo);
    }
}

function renderHashtagList(photo) {
    const list = document.getElementById("hashtagList");
    list.innerHTML = "";

    (photo.hashtags || []).forEach((tag) => {
        const chip = document.createElement("div");
        chip.className = "hashtag-chip";
        chip.innerHTML = `<span>${escapeHtml(tag)}</span><button>×</button>`;
        chip.querySelector("button").addEventListener("click", () => {
            photo.hashtags = photo.hashtags.filter((t) => t !== tag);
            renderHashtagList(photo);
        });
        list.appendChild(chip);
    });
}

function addHashtagToCurrent() {
    const input = document.getElementById("newHashtagInput");
    let tag = input.value.trim();
    if (!tag) return;
    if (!tag.startsWith("#")) tag = "#" + tag;

    const photo = getCurrentPhoto();
    if (!photo) return;

    if (!photo.hashtags) photo.hashtags = [];
    if (!photo.hashtags.includes(tag)) {
        photo.hashtags.push(tag);
        renderHashtagList(photo);
    }
    input.value = "";
}

async function regenerateHashtags() {
    const photo = getCurrentPhoto();
    if (!photo) return;

    saveCurrentReviewFields();

    if (!photo.caption && !photo.location) {
        showToast("Escreva uma legenda (ou preencha o local) antes de gerar as hashtags.", "error");
        return;
    }

    const btn = document.getElementById("regenHashtagsBtn");
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Gerando...";

    try {
        const res = await apiFetch(`/generate-hashtags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                caption: photo.caption || "",
                location: photo.location || "",
                content_type: photo.contentType || ""
            })
        });
        const data = await res.json();
        if (data.success) {
            photo.hashtags = data.hashtags || [];
            renderHashtagList(photo);
        } else if (data.error) {
            showToast(data.error, "error");
        }
    } catch (e) {
        showToast("Erro ao gerar hashtags. Verifique a conexão.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function saveCurrentReviewFields() {
    const photo = getCurrentPhoto();
    if (!photo) return;

    photo.caption = document.getElementById("captionTextarea").value;
    photo.location = document.getElementById("locationInput").value;
    photo.taggedPeople = document.getElementById("taggedPeopleInput").value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    photo.filterKey = document.getElementById("filterSelect").value;
    photo.filterIntensity = parseInt(document.getElementById("filterIntensity").value);
}

// ============================================================
// MODAL: AGENDAMENTO
// ============================================================

function setupScheduleModal() {
    document.querySelectorAll(".freq-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".freq-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            selectedFrequency = parseInt(btn.dataset.freq);
            updateScheduleSummary();
        });
    });

    document.getElementById("backToReviewBtn").addEventListener("click", backToReview);
    document.getElementById("closeScheduleBtn").addEventListener("click", backToReview);
    document.getElementById("confirmScheduleBtn").addEventListener("click", confirmAndSchedule);
    setupTimeWindowListeners();
}

function openScheduleModal() {
    document.getElementById("newPostModal").classList.add("hidden");
    document.getElementById("scheduleModal").classList.remove("hidden");

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("startDateInput").value = now.toISOString().slice(0, 16);

    populateAccountSelectors();
    updateScheduleSummary();
}

function backToReview() {
    document.getElementById("scheduleModal").classList.add("hidden");
    document.getElementById("newPostModal").classList.remove("hidden");
    renderNewPostCard();
}

function updateScheduleSummary() {
    const total = selectedPhotos.length;
    const days = Math.ceil(total / selectedFrequency) || 0;
    document.getElementById("summaryTotalPhotos").textContent = total;
    document.getElementById("summaryDuration").textContent = `${days} dia(s)`;
    document.getElementById("summaryFrequency").textContent = `${selectedFrequency}x/dia`;
}

function setupTimeWindowListeners() {
    document.getElementById("windowStartTime").addEventListener("change", updateScheduleSummary);
    document.getElementById("windowEndTime").addEventListener("change", updateScheduleSummary);
}

async function confirmAndSchedule() {
    const total = selectedPhotos.length;
    const confirmBtn = document.getElementById("confirmScheduleBtn");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Agendando...";

    const startDateValue = document.getElementById("startDateInput").value;
    const startDate = startDateValue ? new Date(startDateValue) : new Date();

    const winStart = document.getElementById("windowStartTime").value || "08:00";
    const winEnd = document.getElementById("windowEndTime").value || "22:00";
    const [wsH, wsM] = winStart.split(":").map(Number);
    const [weH, weM] = winEnd.split(":").map(Number);
    const windowMinutes = (weH * 60 + weM) - (wsH * 60 + wsM);
    const slotMinutes = selectedFrequency > 1
        ? Math.floor(windowMinutes / (selectedFrequency - 1))
        : 0;

    function getSlotTime(index) {
        const slotsPerDay = selectedFrequency;
        const dayOffset = Math.floor(index / slotsPerDay);
        const slotInDay = index % slotsPerDay;

        const day = new Date(startDate);
        day.setDate(day.getDate() + dayOffset);

        if (dayOffset === 0 && slotInDay === 0) {
            const startH = startDate.getHours();
            const startM = startDate.getMinutes();
            if (startH * 60 + startM >= wsH * 60 + wsM && startH * 60 + startM <= weH * 60 + weM) {
                return new Date(startDate);
            }
        }

        const d = new Date(day);
        if (slotsPerDay === 1) {
            d.setHours(wsH, wsM, 0, 0);
        } else {
            const mins = wsH * 60 + wsM + slotMinutes * slotInDay;
            d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
        }
        return d;
    }

    let postedCount = 0;

    for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const scheduledDate = getSlotTime(i);

        try {
            const res = await apiFetch(`/create-post`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photo: await getFilteredBase64(photo),
                    caption: photo.caption || "",
                    hashtags: photo.hashtags || [],
                    location: photo.location || "",
                    tagged_people: photo.taggedPeople || [],
                    schedule_date: scheduledDate.toISOString(),
                    ig_account_id: _igAccounts.length > 1 ? parseInt(document.getElementById("scheduleAccountSelect").value) : undefined
                })
            });
            const data = await res.json();
            if (data.success) postedCount++;
        } catch (e) {
            // conta como falha, segue para a proxima
        }
    }

    confirmBtn.disabled = false;
    confirmBtn.textContent = "✅ Agendar Tudo";

    if (postedCount > 0) {
        showToast(`${postedCount} postagem(ns) agendada(s) com sucesso!`, "success");
    }
    if (postedCount < total) {
        showToast(`${total - postedCount} postagem(ns) falharam ao agendar.`, "error");
    }

    document.getElementById("scheduleModal").classList.add("hidden");
    document.getElementById("newPostModal").classList.add("hidden");
    selectedPhotos = [];
    currentModalIndex = 0;

    loadQueue();
}

// ============================================================
// CARREGAR FILA + RENDERIZAR DASHBOARD/CALENDARIO/HISTORICO/CONTEUDO
// ============================================================

async function loadQueue() {
    try {
        const res = await apiFetch(`/queue`);
        const data = await res.json();
        queueData = (data.posts || []).sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date));
    } catch (e) {
        showToast("Erro ao carregar a fila de postagens.", "error");
        return;
    }

    renderNextPosts();
    renderLastPost();
    renderStats();
    renderMiniCalendar();

    const activePage = document.querySelector(".page.active");
    const activeId = activePage ? activePage.id.replace("page-", "") : "dashboard";
    if (activeId === "calendar") renderFullCalendarPage();
    else if (activeId === "history") renderHistoryList();
}

function groupPostsByDate(posts) {
    const map = {};
    posts.forEach((p) => {
        if (!p.schedule_date) return;
        const d = new Date(p.schedule_date);
        if (isNaN(d)) return;
        const key = formatDateKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(p);
    });
    return map;
}

// ------------------------------------------------------------
// Dashboard: próximas postagens + última postagem
// ------------------------------------------------------------

function buildMiniPostItem(post) {
    const div = document.createElement("div");
    div.className = "mini-post-item";
    const dateStr = formatDateBR(post.schedule_date);
    const isStory = post.post_type === "story";
    const errorLine = post.publish_error
        ? `<span class="queue-item-error" data-error="${escapeHtml(post.publish_error)}">⚠️ falhou</span>`
        : "";
    div.innerHTML = `
        <div class="mini-post-thumb">
            <img src="/${post.photo_path}" alt="">
            <span class="mini-post-type-dot ${isStory ? "dot-story" : "dot-feed"}" title="${isStory ? "Story" : "Feed"}">${isStory ? "S" : "F"}</span>
        </div>
        <div class="mini-post-item-info">
            <p class="mini-post-item-caption">${escapeHtml(post.caption || (isStory ? "Story" : "(sem legenda)"))}</p>
            <div class="mini-post-item-meta">
                <span class="status-badge ${post.status}">${post.status === "posted" ? "Postado" : "Pendente"}</span>
                <span>${dateStr}</span>
                ${errorLine}
            </div>
        </div>
    `;
    const errorEl = div.querySelector(".queue-item-error");
    if (errorEl) {
        errorEl.addEventListener("click", (e) => { e.stopPropagation(); showToast(errorEl.dataset.error, "error", 8000); });
    }
    div.addEventListener("click", () => openEditModal(post));
    return div;
}

function renderNextPosts() {
    const list = document.getElementById("nextPostsList");
    const pending = queueData
        .filter((p) => p.status === "pending")
        .sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date))
        .slice(0, 6);

    list.innerHTML = "";
    if (pending.length === 0) {
        list.innerHTML = '<p class="empty-state">Nenhuma postagem agendada ainda.</p>';
        return;
    }
    pending.forEach((p) => list.appendChild(buildMiniPostItem(p)));
}

function renderLastPost() {
    const box = document.getElementById("lastPostBox");
    const posted = queueData
        .filter((p) => p.status === "posted")
        .sort((a, b) => new Date(b.posted_at || b.schedule_date) - new Date(a.posted_at || a.schedule_date));

    box.innerHTML = "";
    if (posted.length === 0) {
        box.innerHTML = '<p class="empty-state">Nenhuma postagem publicada ainda.</p>';
        return;
    }

    posted.slice(0, 2).forEach((post) => {
        const isStory = post.post_type === "story";
        const wrap = document.createElement("div");
        wrap.className = "last-post-box";
        wrap.innerHTML = `
            <div class="mini-post-thumb">
                <img src="/${post.photo_path}" alt="">
                <span class="mini-post-type-dot ${isStory ? "dot-story" : "dot-feed"}" title="${isStory ? "Story" : "Feed"}">${isStory ? "S" : "F"}</span>
            </div>
            <div>
                <p class="last-post-caption">${escapeHtml(post.caption || (isStory ? "Story" : "(sem legenda)"))}</p>
                <p class="mini-post-item-meta">${formatDateBR(post.posted_at || post.schedule_date)}</p>
            </div>
        `;
        box.appendChild(wrap);
    });
}

// ------------------------------------------------------------
// Estatísticas (pizza + barras diárias)
// ------------------------------------------------------------

let _statsMonth = new Date();

function renderStats() {
    renderStatsPie();
    renderStatsDailyChart();
    updateStatsMonthLabel();
}

function renderStatsPie() {
    const canvas = document.getElementById("statsPieCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 200, 200);

    const pending = queueData.filter((p) => p.status === "pending").length;
    const postedFeed = queueData.filter((p) => p.status === "posted" && p.post_type !== "story").length;
    const postedStory = queueData.filter((p) => p.status === "posted" && p.post_type === "story").length;
    const failed = queueData.filter((p) => p.publish_error && p.status === "pending").length;
    const pendingClean = pending - failed;
    const total = queueData.length;

    const slices = [
        { label: "Feed publicados", count: postedFeed, color: "#22c55e" },
        { label: "Stories publicados", count: postedStory, color: "#7c3aed" },
        { label: "Agendadas", count: pendingClean, color: "#3b82f6" },
        { label: "Com erro", count: failed, color: "#ef4444" },
    ].filter((s) => s.count > 0);

    if (slices.length === 0) {
        ctx.fillStyle = "#e5e7eb";
        ctx.beginPath();
        ctx.arc(100, 100, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Sem dados", 100, 105);
    } else {
        let angle = -Math.PI / 2;
        slices.forEach((s) => {
            const sliceAngle = (s.count / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(100, 100);
            ctx.arc(100, 100, 80, angle, angle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = s.color;
            ctx.fill();
            angle += sliceAngle;
        });
        ctx.beginPath();
        ctx.arc(100, 100, 45, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 28px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(total, 100, 107);
        ctx.font = "11px sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.fillText("total", 100, 122);
    }

    const legend = document.getElementById("statsPieLegend");
    legend.innerHTML = "";
    [
        { label: "Feed publicados", count: postedFeed, color: "#22c55e" },
        { label: "Stories publicados", count: postedStory, color: "#7c3aed" },
        { label: "Agendadas", count: pendingClean, color: "#3b82f6" },
        { label: "Com erro", count: failed, color: "#ef4444" },
    ].forEach((s) => {
        const div = document.createElement("div");
        div.className = "stats-pie-legend-item";
        div.innerHTML = `<span class="stats-pie-legend-dot" style="background:${s.color}"></span>${s.label}: ${s.count}`;
        legend.appendChild(div);
    });
}

function renderStatsDailyChart() {
    const canvas = document.getElementById("statsDailyCanvas");
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.parentElement.clientWidth || 600;
    const cssH = 200;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = cssW;
    const H = cssH;
    ctx.clearRect(0, 0, W, H);

    const year = _statsMonth.getFullYear();
    const month = _statsMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const feedCounts = new Array(daysInMonth).fill(0);
    const storyCounts = new Array(daysInMonth).fill(0);
    queueData.forEach((p) => {
        if (p.status !== "posted") return;
        const d = new Date(p.posted_at || p.schedule_date);
        if (d.getFullYear() === year && d.getMonth() === month) {
            if (p.post_type === "story") storyCounts[d.getDate() - 1]++;
            else feedCounts[d.getDate() - 1]++;
        }
    });

    const totalCounts = feedCounts.map((f, i) => f + storyCounts[i]);
    const maxCount = Math.max(1, ...totalCounts);
    const leftPad = 28;
    const barW = Math.max(3, (W - leftPad - 4) / daysInMonth - 1.5);
    const gap = (W - leftPad - 4 - barW * daysInMonth) / (daysInMonth - 1 || 1);
    const chartH = H - 28;
    const baseY = chartH;

    // Y-axis: grid lines + labels
    const niceMax = maxCount <= 5 ? maxCount : Math.ceil(maxCount / 5) * 5;
    const steps = Math.min(niceMax, 5);
    ctx.font = "11px sans-serif";
    for (let i = 0; i <= steps; i++) {
        const val = Math.round((niceMax / steps) * i);
        const y = baseY - (chartH - 10) * (i / steps);
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftPad, y);
        ctx.lineTo(W, y);
        ctx.stroke();
        if (i > 0) {
            ctx.fillStyle = "#9ca3af";
            ctx.textAlign = "right";
            ctx.fillText(val, leftPad - 4, y + 4);
        }
    }

    // Stacked bars (feed green + story purple) + X-axis labels
    totalCounts.forEach((total, i) => {
        const x = leftPad + i * (barW + gap);
        const feedH = feedCounts[i] > 0 ? Math.max(2, ((chartH - 10) * feedCounts[i]) / niceMax) : 0;
        const storyH = storyCounts[i] > 0 ? Math.max(2, ((chartH - 10) * storyCounts[i]) / niceMax) : 0;

        if (feedH > 0) {
            ctx.fillStyle = "#22c55e";
            ctx.beginPath();
            ctx.roundRect(x, baseY - feedH - storyH, barW, feedH, storyH > 0 ? 0 : 2);
            ctx.fill();
        }
        if (storyH > 0) {
            ctx.fillStyle = "#7c3aed";
            ctx.beginPath();
            ctx.roundRect(x, baseY - storyH, barW, storyH, 2);
            ctx.fill();
        }

        ctx.fillStyle = "#6b7280";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(i + 1, x + barW / 2, H - 4);
    });
}

const MONTH_NAMES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function updateStatsMonthLabel() {
    const label = document.getElementById("statsMonthLabel");
    if (label) label.textContent = `${MONTH_NAMES_PT[_statsMonth.getMonth()]} ${_statsMonth.getFullYear()}`;
}

function setupStatsControls() {
    const prev = document.getElementById("statsPrevMonth");
    const next = document.getElementById("statsNextMonth");
    if (!prev || !next) return;
    prev.addEventListener("click", () => {
        _statsMonth = new Date(_statsMonth.getFullYear(), _statsMonth.getMonth() - 1, 1);
        renderStatsDailyChart();
        updateStatsMonthLabel();
    });
    next.addEventListener("click", () => {
        _statsMonth = new Date(_statsMonth.getFullYear(), _statsMonth.getMonth() + 1, 1);
        renderStatsDailyChart();
        updateStatsMonthLabel();
    });
}

// ------------------------------------------------------------
// Calendário (mini + completo)
// ------------------------------------------------------------

function renderCalendarGrid(container, monthDate, postsByDate, opts = {}) {
    const { clickable = false, onDayClick = null, selectedKey = null } = opts;
    container.innerHTML = "";

    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    weekdays.forEach((w) => {
        const el = document.createElement("div");
        el.className = "cal-weekday";
        el.textContent = w;
        container.appendChild(el);
    });

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = formatDateKey(new Date());

    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement("div");
        el.className = "cal-day empty";
        container.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayPosts = postsByDate[key] || [];

        const el = document.createElement("div");
        el.className = "cal-day";
        if (key === todayKey) el.classList.add("today");
        if (key === selectedKey) el.classList.add("selected");
        if (clickable && dayPosts.length > 0) el.classList.add("clickable");

        const num = document.createElement("span");
        num.textContent = day;
        el.appendChild(num);

        if (dayPosts.length > 0) {
            const feedPosts = dayPosts.filter((p) => p.post_type !== "story");
            const storyPosts = dayPosts.filter((p) => p.post_type === "story");
            const errorPosts = dayPosts.filter((p) => p.publish_error);

            const dots = document.createElement("div");
            dots.className = "cal-dots";

            if (feedPosts.length > 0) {
                const d = document.createElement("span");
                const allPosted = feedPosts.every((p) => p.status === "posted");
                d.className = "cal-dot " + (allPosted ? "feed-posted" : "feed-pending");
                dots.appendChild(d);
            }
            if (storyPosts.length > 0) {
                const d = document.createElement("span");
                const allPosted = storyPosts.every((p) => p.status === "posted");
                d.className = "cal-dot " + (allPosted ? "story-posted" : "story-pending");
                dots.appendChild(d);
            }
            el.appendChild(dots);

            if (errorPosts.length > 0) {
                const warn = document.createElement("span");
                warn.className = "cal-error-badge";
                warn.textContent = "⚠";
                warn.title = errorPosts.map((p) => `${p.post_type === "story" ? "Story" : "Feed"}: ${p.publish_error}`).join("\n");
                warn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const msg = errorPosts.map((p) =>
                        `• ${p.post_type === "story" ? "Story" : "Feed"} (${formatDateBR(p.schedule_date)}):\n  ${p.publish_error}`
                    ).join("\n\n");
                    showToast(msg, "error", 8000);
                });
                el.appendChild(warn);
            }
        }

        if (clickable && dayPosts.length > 0 && onDayClick) {
            el.addEventListener("click", () => onDayClick(key, dayPosts));
        }

        container.appendChild(el);
    }
}

function renderMiniCalendar() {
    const postsByDate = groupPostsByDate(queueData);
    const today = new Date();
    document.getElementById("miniCalendarLabel").textContent = capitalize(getMonthLabel(today));
    renderCalendarGrid(document.getElementById("miniCalendarGrid"), today, postsByDate, { clickable: false });
}

function renderFullCalendarPage() {
    const postsByDate = groupPostsByDate(queueData);
    document.getElementById("fullCalendarLabel").textContent = capitalize(getMonthLabel(calendarViewDate));

    renderCalendarGrid(document.getElementById("fullCalendarGrid"), calendarViewDate, postsByDate, {
        clickable: true,
        selectedKey: selectedDayKey,
        onDayClick: (key, posts) => {
            selectedDayKey = key;
            renderFullCalendarPage();
            renderCalendarDayPosts(key, posts);
        }
    });

    if (!selectedDayKey) {
        document.getElementById("calendarDayLabel").textContent = "Selecione um dia";
        document.getElementById("calendarDayPosts").innerHTML =
            '<p class="empty-state">Clique num dia com postagens para ver os detalhes.</p>';
    }

    document.getElementById("calPrevBtn").onclick = () => {
        calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
        selectedDayKey = null;
        renderFullCalendarPage();
    };
    document.getElementById("calNextBtn").onclick = () => {
        calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
        selectedDayKey = null;
        renderFullCalendarPage();
    };
}

function renderCalendarDayPosts(key, posts) {
    document.getElementById("calendarDayLabel").textContent = formatKeyLongBR(key);
    const container = document.getElementById("calendarDayPosts");
    container.innerHTML = "";
    posts
        .sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date))
        .forEach((p) => container.appendChild(buildMiniPostItem(p)));
}

function setupFilters() {
    document.querySelectorAll("#historyFilters .filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#historyFilters .filter-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentHistoryFilter = btn.dataset.filter;
            renderHistoryList();
        });
    });
}

function filterPosts(filter) {
    if (filter === "pending") return queueData.filter((p) => p.status === "pending");
    if (filter === "posted") return queueData.filter((p) => p.status === "posted");
    return queueData;
}

// ------------------------------------------------------------
// Histórico (grade)
// ------------------------------------------------------------

function buildQueueItem(post) {
    const div = document.createElement("div");
    div.className = "content-grid-item";
    const errorBadge = post.publish_error ? '<span class="cal-legend-warn" title="Falha ao publicar">⚠️</span>' : "";
    div.innerHTML = `
        <img src="/${post.photo_path}" alt="">
        <span class="status-badge ${post.status}">${post.status === "posted" ? "Postado" : "Pendente"}</span>
        ${errorBadge}
    `;
    div.addEventListener("click", () => openPostActionsModal(post));
    return div;
}

function renderHistoryList() {
    const list = document.getElementById("historyList");
    const filtered = filterPosts(currentHistoryFilter);

    list.innerHTML = "";
    if (filtered.length === 0) {
        list.innerHTML = '<p class="empty-state">Nenhuma postagem encontrada.</p>';
        return;
    }
    filtered.forEach((post) => list.appendChild(buildQueueItem(post)));
}

// ============================================================
// MODAL: AÇÕES DO POST (abre ao clicar num item da grade do histórico)
// ============================================================

let postActionsPost = null;

function setupPostActionsModal() {
    document.getElementById("closePostActionsBtn").addEventListener("click", () => {
        document.getElementById("postActionsModal").classList.add("hidden");
    });
    document.getElementById("postActionsEditBtn").addEventListener("click", () => {
        document.getElementById("postActionsModal").classList.add("hidden");
        openEditModal(postActionsPost);
    });
    document.getElementById("postActionsPublishBtn").addEventListener("click", () => {
        document.getElementById("postActionsModal").classList.add("hidden");
        openPublishModal(postActionsPost.id);
    });
    document.getElementById("postActionsDeleteBtn").addEventListener("click", () => {
        document.getElementById("postActionsModal").classList.add("hidden");
        openDeleteModal(postActionsPost.id);
    });
}

function openPostActionsModal(post) {
    postActionsPost = post;
    document.getElementById("postActionsImage").src = `/${post.photo_path}`;
    document.getElementById("postActionsPublishBtn").classList.toggle("hidden", post.status === "posted");
    document.getElementById("postActionsModal").classList.remove("hidden");
}

// ============================================================
// MODAL: EDITAR POSTAGEM
// ============================================================

function setupEditModal() {
    document.getElementById("closeEditBtn").addEventListener("click", () => {
        document.getElementById("editModal").classList.add("hidden");
    });
    document.getElementById("cancelEditBtn").addEventListener("click", () => {
        document.getElementById("editModal").classList.add("hidden");
    });
    document.getElementById("saveEditBtn").addEventListener("click", saveEdit);
}

function openEditModal(post) {
    editingPostId = post.id;
    document.getElementById("editModalImage").src = `/${post.photo_path}`;
    document.getElementById("editModalCaption").value = post.caption || "";
    document.getElementById("editModalLocation").value = post.location || "";
    document.getElementById("editModalHashtags").value = (post.hashtags || []).join(" ");
    document.getElementById("editModal").classList.remove("hidden");
}

async function saveEdit() {
    if (!editingPostId) return;

    const caption = document.getElementById("editModalCaption").value;
    const location = document.getElementById("editModalLocation").value;
    const hashtags = document.getElementById("editModalHashtags").value.split(" ").filter(Boolean);

    try {
        await apiFetch(`/queue/${editingPostId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ caption, location, hashtags })
        });
        document.getElementById("editModal").classList.add("hidden");
        showToast("Postagem atualizada.", "success");
        loadQueue();
    } catch (e) {
        showToast("Erro ao salvar edição.", "error");
    }
}

// ============================================================
// MODAL: CONFIRMAR EXCLUSAO
// ============================================================

function setupDeleteModal() {
    document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
        document.getElementById("deleteModal").classList.add("hidden");
    });
    document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);
}

function openDeleteModal(postId) {
    deletingPostId = postId;
    document.getElementById("deleteModal").classList.remove("hidden");
}

async function confirmDelete() {
    if (!deletingPostId) return;

    try {
        await apiFetch(`/queue/${deletingPostId}`, { method: "DELETE" });
        document.getElementById("deleteModal").classList.add("hidden");
        showToast("Postagem removida.", "success");
        loadQueue();
    } catch (e) {
        showToast("Erro ao remover postagem.", "error");
    }
}

// ============================================================
// MODAL: PUBLICAR AGORA (ação real e irreversível → confirmação)
// ============================================================

let publishingPostId = null;

function setupPublishModal() {
    document.getElementById("cancelPublishBtn").addEventListener("click", () => {
        document.getElementById("publishModal").classList.add("hidden");
    });
    document.getElementById("confirmPublishBtn").addEventListener("click", confirmPublishNow);
}

function openPublishModal(postId) {
    publishingPostId = postId;
    populateAccountSelectors();
    document.getElementById("publishModal").classList.remove("hidden");
}

async function confirmPublishNow() {
    if (!publishingPostId) return;
    const btn = document.getElementById("confirmPublishBtn");
    btn.disabled = true;
    btn.textContent = "Publicando...";

    const body = {};
    if (_igAccounts.length > 1) {
        body.ig_account_id = parseInt(document.getElementById("publishAccountSelect").value);
    }

    try {
        const res = await apiFetch(`/queue/${publishingPostId}/publish-now`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.success) {
            showToast("Publicado no Instagram! 🎉", "success");
            loadQueue();
        } else {
            showToast(data.error || "Não foi possível publicar.", "error");
        }
    } catch (e) {
        showToast("Erro de conexão ao publicar.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Sim, publicar";
        document.getElementById("publishModal").classList.add("hidden");
        publishingPostId = null;
    }
}

// ============================================================
// PAGINA: CONFIGURACOES
// ============================================================

async function loadSettingsPage() {
    try {
        const res = await apiFetch(`/app-info`);
        const data = await res.json();
        document.getElementById("serverInfoModel").textContent =
            `Modelo de IA: ${data.claude_model}${data.ai_configured ? "" : " (chave não configurada)"}`;
        document.getElementById("serverInfoAuth").textContent =
            `Proteção por senha: ${data.auth_enabled ? "ativa" : "desativada"}`;
        document.getElementById("logoutCard").classList.toggle("hidden", !data.auth_enabled);
    } catch (e) {
        document.getElementById("serverInfoModel").textContent = "Modelo de IA: —";
    }

    document.getElementById("logoutBtn").onclick = logout;

    document.getElementById("deleteAllDataBtn").addEventListener("click", async () => {
        if (!confirm("Tem certeza? Isso vai excluir TODAS as contas, fotos e posts. Não tem volta.")) return;
        if (!confirm("Última chance. Confirma a exclusão de todos os dados?")) return;
        try {
            await apiFetch("/delete-all-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
            showToast("Todos os dados foram excluídos.", "success");
            loadInstagramStatus();
            loadQueue();
        } catch (e) {
            showToast("Erro ao excluir dados.", "error");
        }
    });

    loadInstagramStatus();
    wireInstagramButtons();
}

// ------------------------------------------------------------
// Instagram: conexão / desconexão nas Configurações
// ------------------------------------------------------------

let _igAccounts = [];

async function loadIgAccounts() {
    try {
        const res = await apiFetch(`/instagram/accounts`);
        const data = await res.json();
        _igAccounts = data.accounts || [];
        populateAccountSelectors();
        updateAvatar();
    } catch (e) { /* silently fail */ }
}

function updateAvatar() {
    const defaultAcct = _igAccounts.find(a => a.is_default) || _igAccounts[0];
    const img = document.getElementById("userAvatarImg");
    const text = document.getElementById("userAvatarText");
    if (!img || !text) return;
    if (defaultAcct && defaultAcct.profile_picture_url) {
        img.src = defaultAcct.profile_picture_url;
        img.alt = "@" + (defaultAcct.username || "");
        img.style.display = "";
        text.style.display = "none";
    } else {
        img.style.display = "none";
        text.style.display = "";
    }
    renderAccountDropdown();
}

function renderAccountDropdown() {
    const dropdown = document.getElementById("accountDropdown");
    if (!dropdown) return;
    if (_igAccounts.length === 0) {
        dropdown.innerHTML = '<div class="account-dropdown-item" style="opacity:0.5;cursor:default">Nenhuma conta conectada</div>';
        return;
    }
    dropdown.innerHTML = _igAccounts.map(a => {
        const avatar = a.profile_picture_url
            ? `<img src="${a.profile_picture_url}" alt="@${a.username}">`
            : `<span class="acct-initials">${(a.username || "?").substring(0, 2).toUpperCase()}</span>`;
        return `<button class="account-dropdown-item ${a.is_default ? 'active' : ''}" data-account-id="${a.id}">
            ${avatar}
            <span class="acct-name">@${a.username || a.ig_user_id}</span>
            ${a.is_default ? '<span class="acct-check">✓</span>' : ''}
        </button>`;
    }).join("");

    dropdown.querySelectorAll("[data-account-id]").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.accountId);
            const acct = _igAccounts.find(a => a.id === id);
            if (acct && acct.is_default) {
                dropdown.classList.add("hidden");
                return;
            }
            await setDefaultAccount(id);
            dropdown.classList.add("hidden");
        });
    });
}

function setupAccountSwitcher() {
    const avatarBtn = document.getElementById("userAvatarBtn");
    const dropdown = document.getElementById("accountDropdown");
    if (!avatarBtn || !dropdown) return;

    avatarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
        dropdown.classList.add("hidden");
    });
}

async function loadInstagramStatus() {
    const listEl = document.getElementById("igAccountsList");
    const warn = document.getElementById("igPublicUrlWarn");

    try {
        const res = await apiFetch(`/instagram/status`);
        const data = await res.json();
        _igAccounts = data.accounts || [];

        if (_igAccounts.length === 0) {
            listEl.innerHTML = '<p class="muted-text">Nenhuma conta conectada.</p>';
        } else {
            listEl.innerHTML = _igAccounts.map(a => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.08)">
                    <strong>@${a.username || a.ig_user_id}</strong>
                    ${a.is_default ? '<span style="background:var(--green);color:#fff;padding:2px 8px;border-radius:10px;font-size:0.75rem">padrão</span>' : `<button class="btn btn-secondary" style="font-size:0.75rem;padding:2px 8px" onclick="setDefaultAccount(${a.id})">definir padrão</button>`}
                    <button class="btn btn-secondary" style="font-size:0.75rem;padding:2px 8px;margin-left:auto" onclick="removeAccount(${a.id}, '@${a.username}')">remover</button>
                </div>
            `).join("");
        }

        if (!data.public_base_url_set) {
            warn.textContent = "⚠️ A publicação automática só funciona com o app publicado na internet (falta definir o endereço público).";
        } else {
            warn.textContent = "";
        }

        populateAccountSelectors();
        updateAvatar();
    } catch (e) {
        warn.textContent = "Não foi possível verificar o status do Instagram.";
    }

    checkTokenHealth();
}

async function checkTokenHealth() {
    const alertEl = document.getElementById("igTokenAlert");
    if (!alertEl) return;
    alertEl.innerHTML = "";
    alertEl.classList.add("hidden");

    if (_igAccounts.length === 0) return;

    try {
        const res = await apiFetch(`/instagram/check-token`);
        const data = await res.json();
        const problems = [];

        for (const acct of (data.accounts || [])) {
            if (!acct.ok) {
                problems.push(`<strong>@${escapeHtml(acct.username)}</strong>: ${escapeHtml(acct.error)}`);
            }
        }

        if (data.has_permission_errors) {
            problems.push(`${data.failed_posts_count} postagem(ns) falharam por erro de permissão — reconecte a conta para corrigir.`);
        }

        if (problems.length > 0) {
            alertEl.innerHTML =
                `<strong>⚠️ Problema com o token do Instagram</strong><br>` +
                problems.join("<br>") +
                `<br><br><span style="font-size:0.85em;opacity:0.9">Reconecte a conta para renovar o token e as permissões.</span>`;
            alertEl.classList.remove("hidden");
        }
    } catch (_) {}
}

function populateAccountSelectors() {
    ["scheduleAccountSelect", "publishAccountSelect"].forEach(selId => {
        const sel = document.getElementById(selId);
        if (!sel) return;
        const block = sel.closest("[id$=AccountBlock]");
        if (_igAccounts.length <= 1) {
            if (block) block.style.display = "none";
            return;
        }
        if (block) block.style.display = "";
        sel.innerHTML = _igAccounts.map(a =>
            `<option value="${a.id}" ${a.is_default ? "selected" : ""}>@${a.username || a.ig_user_id}</option>`
        ).join("");
    });
}

async function setDefaultAccount(accountId) {
    try {
        await apiFetch(`/instagram/set-default`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_id: accountId })
        });
        showToast("Conta padrão atualizada!", "success");
        loadInstagramStatus();
    } catch (e) {
        showToast("Erro ao definir conta padrão.", "error");
    }
}

async function removeAccount(accountId, username) {
    if (!confirm(`Remover ${username} do app?`)) return;
    try {
        await apiFetch(`/instagram/disconnect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_id: accountId })
        });
        showToast(`${username} removida.`, "success");
        loadInstagramStatus();
    } catch (e) {
        showToast("Erro ao remover conta.", "error");
    }
}

let _igButtonsWired = false;
function wireInstagramButtons() {
    if (_igButtonsWired) return;
    _igButtonsWired = true;

    document.getElementById("igFacebookLoginBtn").addEventListener("click", async () => {
        const btn = document.getElementById("igFacebookLoginBtn");
        btn.disabled = true;
        btn.textContent = "Redirecionando...";
        try {
            const res = await apiFetch("/instagram/auth-url");
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                showToast(data.error || "Erro ao gerar link de login.", "error");
                btn.disabled = false;
                btn.innerHTML = '<span style="margin-right:6px">📎</span> Conectar Instagram via Facebook';
            }
        } catch (e) {
            showToast("Erro de conexão.", "error");
            btn.disabled = false;
            btn.innerHTML = '<span style="margin-right:6px">📎</span> Conectar Instagram via Facebook';
        }
    });

    document.getElementById("igConnectBtn").addEventListener("click", async () => {
        const ig_user_id = document.getElementById("igUserIdInput").value.trim();
        const access_token = document.getElementById("igTokenInput").value.trim();
        const hint = document.getElementById("igConnectHint");
        const btn = document.getElementById("igConnectBtn");

        if (!ig_user_id || !access_token) {
            hint.textContent = "Preencha o ID da conta e o token.";
            return;
        }

        btn.disabled = true;
        btn.textContent = "Validando...";
        hint.textContent = "";

        try {
            const res = await apiFetch(`/instagram/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ig_user_id, access_token })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Instagram conectado como @${data.username}! 🎉`, "success");
                document.getElementById("igUserIdInput").value = "";
                document.getElementById("igTokenInput").value = "";
                document.getElementById("igAddForm").removeAttribute("open");
                loadInstagramStatus();
            } else {
                hint.textContent = data.error || "Não foi possível conectar.";
            }
        } catch (e) {
            hint.textContent = "Erro de conexão.";
        } finally {
            btn.disabled = false;
            btn.textContent = "Conectar e validar";
        }
    });
}

// ============================================================
// STORY: dropzone multi-foto, editor com crop/zoom/rotação/filtros
// ============================================================

let storyItems = [];
let currentStoryIndex = 0;
let _storyDragging = false;
let _storyDragStart = { x: 0, y: 0, panX: 0, panY: 0 };
let _storyOrigImg = null;

function _storyCrop() {
    const item = storyItems[currentStoryIndex];
    if (!item) return { panX: 0, panY: 0, zoom: 100, rotation: 0 };
    if (!item.crop) item.crop = { panX: 0, panY: 0, zoom: 100, rotation: 0 };
    return item.crop;
}

function setupStoryDropzone() {
    const input = document.getElementById("storyPhotoInput");
    const inner = document.getElementById("storyDropzoneInner");
    if (!inner || !input) return;

    inner.addEventListener("click", () => input.click());
    input.addEventListener("change", (e) => {
        if (e.target.files.length > 0) handleStoryFiles(e.target.files);
        input.value = "";
    });
    inner.addEventListener("dragover", (e) => { e.preventDefault(); inner.classList.add("drag-over"); });
    inner.addEventListener("dragleave", () => inner.classList.remove("drag-over"));
    inner.addEventListener("drop", (e) => {
        e.preventDefault(); inner.classList.remove("drag-over");
        if (e.dataTransfer.files.length > 0) handleStoryFiles(e.dataTransfer.files);
    });

    document.getElementById("closeStoryEditorBtn").addEventListener("click", closeStoryEditor);
    document.getElementById("cancelStoryBtn").addEventListener("click", closeStoryEditor);
    document.getElementById("confirmStoryBtn").addEventListener("click", submitAllStories);
    document.getElementById("storyPrevBtn").addEventListener("click", () => navigateStory(-1));
    document.getElementById("storyNextBtn").addEventListener("click", () => navigateStory(1));

    document.getElementById("storyTextOverlay").addEventListener("input", () => {
        storyItems[currentStoryIndex].text = document.getElementById("storyTextOverlay").value;
    });
    document.getElementById("storyLocation").addEventListener("input", () => {
        storyItems[currentStoryIndex].location = document.getElementById("storyLocation").value;
    });

    // Crop controls
    document.getElementById("storyRotateLeftBtn").addEventListener("click", () => {
        const c = _storyCrop(); c.rotation = (c.rotation - 90 + 360) % 360; c.panX = 0; c.panY = 0;
        updateStoryCropTransform();
    });
    document.getElementById("storyRotateRightBtn").addEventListener("click", () => {
        const c = _storyCrop(); c.rotation = (c.rotation + 90) % 360; c.panX = 0; c.panY = 0;
        updateStoryCropTransform();
    });
    document.getElementById("storyCropResetBtn").addEventListener("click", () => {
        const item = storyItems[currentStoryIndex];
        if (item) { item.crop = { panX: 0, panY: 0, zoom: 100, rotation: 0 }; item.filterKey = "none"; item.filterIntensity = 80; }
        document.getElementById("storyZoom").value = 100;
        document.getElementById("storyZoomValue").textContent = "100%";
        document.getElementById("storyFilterSelect").value = "none";
        document.getElementById("storyFilterIntensityRow").style.display = "none";
        applyStoryFilter();
        updateStoryCropTransform();
    });
    document.getElementById("storyZoom").addEventListener("input", (e) => {
        const c = _storyCrop(); c.zoom = parseInt(e.target.value);
        document.getElementById("storyZoomValue").textContent = c.zoom + "%";
        updateStoryCropTransform();
    });

    // Filter controls
    const storyFilterSelect = document.getElementById("storyFilterSelect");
    storyFilterSelect.innerHTML = "";
    const origOpt = document.createElement("option");
    origOpt.value = "none"; origOpt.textContent = "Original";
    storyFilterSelect.appendChild(origOpt);
    const sGroups = {}; const sOrder = [];
    for (const [key, f] of Object.entries(PHOTO_FILTERS)) {
        if (key === "none") continue;
        const g = f.group || "Outros";
        if (!sGroups[g]) { sGroups[g] = []; sOrder.push(g); }
        sGroups[g].push({ key, label: f.label });
    }
    for (const gn of sOrder) {
        const og = document.createElement("optgroup");
        og.label = gn;
        for (const item of sGroups[gn]) {
            const opt = document.createElement("option");
            opt.value = item.key; opt.textContent = item.label;
            og.appendChild(opt);
        }
        storyFilterSelect.appendChild(og);
    }
    storyFilterSelect.addEventListener("change", () => {
        const item = storyItems[currentStoryIndex];
        if (item) item.filterKey = storyFilterSelect.value;
        document.getElementById("storyFilterIntensityRow").style.display = storyFilterSelect.value === "none" ? "none" : "";
        applyStoryFilter();
    });
    document.getElementById("storyFilterIntensity").addEventListener("input", (e) => {
        const item = storyItems[currentStoryIndex];
        if (item) item.filterIntensity = parseInt(e.target.value);
        document.getElementById("storyFilterIntensityValue").textContent = e.target.value + "%";
        applyStoryFilter();
    });

    // Pan via mouse
    const vp = document.getElementById("storyCropViewport");
    vp.addEventListener("mousedown", (e) => {
        e.preventDefault(); _storyDragging = true;
        const c = _storyCrop();
        _storyDragStart = { x: e.clientX, y: e.clientY, panX: c.panX, panY: c.panY };
    });
    window.addEventListener("mousemove", (e) => {
        if (!_storyDragging) return;
        const c = _storyCrop();
        c.panX = _storyDragStart.panX + (e.clientX - _storyDragStart.x);
        c.panY = _storyDragStart.panY + (e.clientY - _storyDragStart.y);
        updateStoryCropTransform();
    });
    window.addEventListener("mouseup", () => { _storyDragging = false; });

    // Pan via touch
    vp.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            _storyDragging = true;
            const t = e.touches[0]; const c = _storyCrop();
            _storyDragStart = { x: t.clientX, y: t.clientY, panX: c.panX, panY: c.panY };
        }
    }, { passive: true });
    vp.addEventListener("touchmove", (e) => {
        if (!_storyDragging || e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0]; const c = _storyCrop();
        c.panX = _storyDragStart.panX + (t.clientX - _storyDragStart.x);
        c.panY = _storyDragStart.panY + (t.clientY - _storyDragStart.y);
        updateStoryCropTransform();
    }, { passive: false });
    vp.addEventListener("touchend", () => { _storyDragging = false; });
}

function updateStoryCropTransform() {
    const crop = _storyCrop();
    const img = document.getElementById("storyEditImage");
    const canvas = document.getElementById("storyFilterCanvas");
    const vp = document.getElementById("storyCropViewport");
    if (!_storyOrigImg) return;

    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const isRotated = crop.rotation % 180 !== 0;
    const natW = _storyOrigImg.naturalWidth;
    const natH = _storyOrigImg.naturalHeight;
    const imgW = isRotated ? natH : natW;
    const imgH = isRotated ? natW : natH;

    const scaleToFit = Math.max(vw / imgW, vh / imgH);
    const zoom = crop.zoom / 100;
    const finalScale = scaleToFit * zoom;

    const displayW = natW * finalScale;
    const displayH = natH * finalScale;
    const maxPanX = Math.max(0, ((isRotated ? displayH : displayW) - vw) / 2);
    const maxPanY = Math.max(0, ((isRotated ? displayW : displayH) - vh) / 2);
    crop.panX = Math.max(-maxPanX, Math.min(maxPanX, crop.panX));
    crop.panY = Math.max(-maxPanY, Math.min(maxPanY, crop.panY));

    crop._vpW = vw;
    crop._vpH = vh;

    const transform = `translate(${crop.panX}px, ${crop.panY}px) rotate(${crop.rotation}deg) scale(${finalScale})`;
    img.style.width = `${natW}px`;
    img.style.height = `${natH}px`;
    img.style.transform = transform;
    img.style.left = `${(vw - natW) / 2}px`;
    img.style.top = `${(vh - natH) / 2}px`;

    const cw = canvas.width || natW;
    const ch = canvas.height || natH;
    const canvasScale = finalScale * (natW / cw);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    canvas.style.transform = `translate(${crop.panX}px, ${crop.panY}px) rotate(${crop.rotation}deg) scale(${canvasScale})`;
    canvas.style.left = `${(vw - cw) / 2}px`;
    canvas.style.top = `${(vh - ch) / 2}px`;
}

function applyStoryFilter() {
    const item = storyItems[currentStoryIndex];
    if (!item || !_storyOrigImg) return;
    const filterKey = item.filterKey || "none";
    const intensity = (item.filterIntensity || 80) / 100;
    const img = document.getElementById("storyEditImage");
    const canvas = document.getElementById("storyFilterCanvas");

    if (filterKey === "none" || intensity === 0) {
        img.style.display = "";
        canvas.style.display = "none";
        updateStoryCropTransform();
        return;
    }

    const filter = PHOTO_FILTERS[filterKey];
    if (!filter) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const natW = _storyOrigImg.naturalWidth;
    const natH = _storyOrigImg.naturalHeight;
    const MAX = 1200;
    const ps = Math.min(1, MAX / Math.max(natW, natH));
    const pw = Math.round(natW * ps);
    const ph = Math.round(natH * ps);
    canvas.width = pw;
    canvas.height = ph;

    const b = 1 + ((filter.brightness || 1) - 1) * intensity;
    const co = 1 + ((filter.contrast || 1) - 1) * intensity;
    const s = filter.grayscale ? 1 - intensity : 1 + ((filter.saturate || 1) - 1) * intensity;
    let cssF = `brightness(${b}) contrast(${co}) saturate(${s})`;
    if (filter.grayscale) cssF += ` grayscale(${intensity})`;
    if (filter.temperature) cssF += ` hue-rotate(${filter.temperature * 0.5 * intensity}deg)`;
    ctx.filter = cssF;
    ctx.drawImage(_storyOrigImg, 0, 0, pw, ph);
    ctx.filter = "none";

    if (filter.tint) {
        const t = filter.tint;
        ctx.fillStyle = `rgba(${t.r},${t.g},${t.b},${(t.a || 0.05) * intensity})`;
        ctx.fillRect(0, 0, pw, ph);
    }
    if (filter.clarity && filter.clarity > 0) {
        ctx.globalCompositeOperation = "overlay";
        ctx.globalAlpha = filter.clarity * intensity * 0.3;
        ctx.drawImage(canvas, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
    }
    if (filter.vignette && filter.vignette > 0) {
        const cx = pw / 2, cy = ph / 2, r = Math.max(cx, cy);
        const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.2);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${filter.vignette * intensity})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, pw, ph);
    }

    img.style.display = "none";
    canvas.style.display = "";
    updateStoryCropTransform();
}

async function handleStoryFiles(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    storyItems = [];
    for (const file of files) {
        const base64 = await fileToBase64(file);
        storyItems.push({ base64, text: "", location: "", crop: { panX: 0, panY: 0, zoom: 100, rotation: 0 }, filterKey: "none", filterIntensity: 80 });
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById("storyScheduleDate").value = local;

    currentStoryIndex = 0;
    document.getElementById("storyEditorModal").classList.remove("hidden");
    renderStoryThumbnails();
    loadStoryEditorForCurrent();
    updateStoryNav();
}

function loadStoryEditorForCurrent() {
    const item = storyItems[currentStoryIndex];
    document.getElementById("storyTextOverlay").value = item.text || "";
    document.getElementById("storyLocation").value = item.location || "";

    const crop = _storyCrop();
    document.getElementById("storyZoom").value = crop.zoom;
    document.getElementById("storyZoomValue").textContent = crop.zoom + "%";
    document.getElementById("storyFilterSelect").value = item.filterKey || "none";
    document.getElementById("storyFilterIntensity").value = item.filterIntensity || 80;
    document.getElementById("storyFilterIntensityValue").textContent = (item.filterIntensity || 80) + "%";
    document.getElementById("storyFilterIntensityRow").style.display = (item.filterKey && item.filterKey !== "none") ? "" : "none";

    const img = document.getElementById("storyEditImage");
    _storyOrigImg = new Image();
    _storyOrigImg.onload = () => {
        img.src = _storyOrigImg.src;
        img.style.display = "";
        document.getElementById("storyFilterCanvas").style.display = "none";
        requestAnimationFrame(() => {
            applyStoryFilter();
            updateStoryCropTransform();
        });
    };
    _storyOrigImg.src = item.base64;
}

function renderStoryThumbnails() {
    const strip = document.getElementById("storyThumbnails");
    strip.innerHTML = "";
    storyItems.forEach((item, i) => {
        const thumb = document.createElement("div");
        thumb.className = "story-thumb" + (i === currentStoryIndex ? " active" : "");
        thumb.innerHTML = `<img src="${item.base64}"><span class="story-thumb-num">${i + 1}</span>`;
        thumb.addEventListener("click", () => {
            saveCurrentStoryFields();
            currentStoryIndex = i;
            renderStoryThumbnails();
            loadStoryEditorForCurrent();
            updateStoryNav();
        });

        const removeBtn = document.createElement("button");
        removeBtn.className = "story-thumb-remove";
        removeBtn.textContent = "✕";
        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            storyItems.splice(i, 1);
            if (storyItems.length === 0) { closeStoryEditor(); return; }
            if (currentStoryIndex >= storyItems.length) currentStoryIndex = storyItems.length - 1;
            renderStoryThumbnails();
            loadStoryEditorForCurrent();
            updateStoryNav();
        });
        thumb.appendChild(removeBtn);
        strip.appendChild(thumb);
    });
}

function saveCurrentStoryFields() {
    if (!storyItems[currentStoryIndex]) return;
    storyItems[currentStoryIndex].text = document.getElementById("storyTextOverlay").value;
    storyItems[currentStoryIndex].location = document.getElementById("storyLocation").value;
}

function updateStoryNav() {
    const total = storyItems.length;
    document.getElementById("storyPrevBtn").disabled = currentStoryIndex === 0;
    document.getElementById("storyNextBtn").disabled = currentStoryIndex === total - 1;
    document.getElementById("storyCounter").textContent = `${currentStoryIndex + 1} / ${total}`;
    document.getElementById("confirmStoryBtn").textContent =
        total > 1 ? `Agendar ${total} Stories` : "Agendar Story";
}

function navigateStory(dir) {
    saveCurrentStoryFields();
    currentStoryIndex = Math.max(0, Math.min(storyItems.length - 1, currentStoryIndex + dir));
    renderStoryThumbnails();
    loadStoryEditorForCurrent();
    updateStoryNav();
}

function renderStoryFinalCanvas(item) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement("canvas");
            c.width = 1080; c.height = 1920;
            const ctx = c.getContext("2d");
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, 1080, 1920);

            const crop = item.crop || { panX: 0, panY: 0, zoom: 100, rotation: 0 };
            const isRotated = crop.rotation % 180 !== 0;
            const natW = img.naturalWidth;
            const natH = img.naturalHeight;
            const imgW = isRotated ? natH : natW;
            const imgH = isRotated ? natW : natH;

            const scaleToFit = Math.max(1080 / imgW, 1920 / imgH);
            const zoom = crop.zoom / 100;
            const finalScale = scaleToFit * zoom;

            const vpW = crop._vpW || 270;
            const vpH = crop._vpH || 480;
            const panXScaled = crop.panX * (1080 / vpW);
            const panYScaled = crop.panY * (1920 / vpH);

            const filterKey = item.filterKey || "none";
            const hasFilter = filterKey !== "none" && item.filterIntensity;
            const filter = hasFilter ? PHOTO_FILTERS[filterKey] : null;

            if (filter) {
                const intensity = (item.filterIntensity || 80) / 100;
                const b = 1 + ((filter.brightness || 1) - 1) * intensity;
                const co = 1 + ((filter.contrast || 1) - 1) * intensity;
                const s = filter.grayscale ? 1 - intensity : 1 + ((filter.saturate || 1) - 1) * intensity;
                let cssF = `brightness(${b}) contrast(${co}) saturate(${s})`;
                if (filter.grayscale) cssF += ` grayscale(${intensity})`;
                if (filter.temperature) cssF += ` hue-rotate(${filter.temperature * 0.5 * intensity}deg)`;
                ctx.filter = cssF;
            }

            ctx.save();
            ctx.translate(1080 / 2 + panXScaled, 1920 / 2 + panYScaled);
            ctx.rotate((crop.rotation * Math.PI) / 180);
            ctx.scale(finalScale, finalScale);
            ctx.drawImage(img, -natW / 2, -natH / 2);
            ctx.restore();
            ctx.filter = "none";

            if (filter) {
                const intensity = (item.filterIntensity || 80) / 100;
                if (filter.tint) {
                    const t = filter.tint;
                    ctx.fillStyle = `rgba(${t.r},${t.g},${t.b},${(t.a || 0.05) * intensity})`;
                    ctx.fillRect(0, 0, 1080, 1920);
                }
                if (filter.vignette && filter.vignette > 0) {
                    const cx = 540, cy = 960, r = Math.max(cx, cy);
                    const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.2);
                    grad.addColorStop(0, "rgba(0,0,0,0)");
                    grad.addColorStop(1, `rgba(0,0,0,${filter.vignette * intensity})`);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, 1080, 1920);
                }
            }

            const text = (item.text || "").trim();
            if (text) {
                ctx.save();
                ctx.font = "bold 64px sans-serif";
                ctx.textAlign = "center";
                ctx.fillStyle = "#fff";
                ctx.shadowColor = "rgba(0,0,0,0.7)";
                ctx.shadowBlur = 12;
                ctx.fillText(text, 540, 1700, 1000);
                ctx.restore();
            }

            const loc = (item.location || "").trim();
            if (loc) {
                ctx.save();
                ctx.font = "500 42px sans-serif";
                ctx.textAlign = "center";
                ctx.fillStyle = "#fff";
                ctx.shadowColor = "rgba(0,0,0,0.6)";
                ctx.shadowBlur = 8;
                ctx.fillText("\u{1F4CD} " + loc, 540, 120, 900);
                ctx.restore();
            }

            resolve(c.toDataURL("image/jpeg", 0.92));
        };
        img.src = item.base64;
    });
}

function closeStoryEditor() {
    document.getElementById("storyEditorModal").classList.add("hidden");
    storyItems = [];
    currentStoryIndex = 0;
    _storyOrigImg = null;
}

async function submitAllStories() {
    saveCurrentStoryFields();
    const scheduleDate = document.getElementById("storyScheduleDate").value;
    const total = storyItems.length;

    const btn = document.getElementById("confirmStoryBtn");
    btn.disabled = true;
    btn.textContent = `Agendando 0/${total}...`;

    let success = 0;
    let errors = 0;

    for (let i = 0; i < storyItems.length; i++) {
        btn.textContent = `Agendando ${i + 1}/${total}...`;

        const finalBase64 = await renderStoryFinalCanvas(storyItems[i]);
        const storyDate = new Date(scheduleDate);
        storyDate.setMinutes(storyDate.getMinutes() + i * 5);

        try {
            const res = await apiFetch("/create-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photo: finalBase64,
                    caption: "",
                    hashtags: [],
                    location: storyItems[i].location.trim(),
                    schedule_date: storyDate.toISOString(),
                    post_type: "story",
                }),
            });
            const data = await res.json();
            if (data.success) success++;
            else errors++;
        } catch (e) {
            errors++;
        }
    }

    if (success > 0) {
        showToast(`${success} stor${success > 1 ? "ies agendados" : "y agendado"} com sucesso!`, "success");
        if (typeof loadNextPosts === "function") loadNextPosts();
    }
    if (errors > 0) {
        showToast(`${errors} stor${errors > 1 ? "ies falharam" : "y falhou"}`, "error");
    }

    closeStoryEditor();
    btn.disabled = false;
    btn.textContent = "Agendar Story";
}

// ============================================================
// CARROSSEL
// ============================================================

let carouselItems = [];
let currentCarouselIndex = 0;
let _carouselDragging = false;
let _carouselDragStart = { x: 0, y: 0, panX: 0, panY: 0 };
let _carouselOrigImg = null;

const CAROUSEL_MIN_PHOTOS = 2;
const CAROUSEL_MAX_PHOTOS = 10;

function _carouselCrop() {
    const item = carouselItems[currentCarouselIndex];
    if (!item) return { panX: 0, panY: 0, zoom: 100, rotation: 0 };
    if (!item.crop) item.crop = { panX: 0, panY: 0, zoom: 100, rotation: 0 };
    return item.crop;
}

function setupCarouselDropzone() {
    const input = document.getElementById("carouselPhotoInput");
    const inner = document.getElementById("carouselDropzoneInner");
    if (!inner || !input) return;

    inner.addEventListener("click", () => input.click());
    input.addEventListener("change", (e) => {
        if (e.target.files.length > 0) handleCarouselFiles(e.target.files);
        input.value = "";
    });
    inner.addEventListener("dragover", (e) => { e.preventDefault(); inner.classList.add("drag-over"); });
    inner.addEventListener("dragleave", () => inner.classList.remove("drag-over"));
    inner.addEventListener("drop", (e) => {
        e.preventDefault(); inner.classList.remove("drag-over");
        if (e.dataTransfer.files.length > 0) handleCarouselFiles(e.dataTransfer.files);
    });

    document.getElementById("closeCarouselEditorBtn").addEventListener("click", closeCarouselEditor);
    document.getElementById("cancelCarouselBtn").addEventListener("click", closeCarouselEditor);
    document.getElementById("confirmCarouselBtn").addEventListener("click", submitCarousel);
    document.getElementById("carouselPrevBtn").addEventListener("click", () => navigateCarousel(-1));
    document.getElementById("carouselNextBtn").addEventListener("click", () => navigateCarousel(1));

    document.getElementById("carouselTextOverlay").addEventListener("input", () => {
        if (carouselItems[currentCarouselIndex]) {
            carouselItems[currentCarouselIndex].text = document.getElementById("carouselTextOverlay").value;
        }
    });

    // Crop controls
    document.getElementById("carouselRotateLeftBtn").addEventListener("click", () => {
        const c = _carouselCrop(); c.rotation = (c.rotation - 90 + 360) % 360; c.panX = 0; c.panY = 0;
        updateCarouselCropTransform();
    });
    document.getElementById("carouselRotateRightBtn").addEventListener("click", () => {
        const c = _carouselCrop(); c.rotation = (c.rotation + 90) % 360; c.panX = 0; c.panY = 0;
        updateCarouselCropTransform();
    });
    document.getElementById("carouselCropResetBtn").addEventListener("click", () => {
        const item = carouselItems[currentCarouselIndex];
        if (item) { item.crop = { panX: 0, panY: 0, zoom: 100, rotation: 0 }; item.filterKey = "none"; item.filterIntensity = 80; }
        document.getElementById("carouselZoom").value = 100;
        document.getElementById("carouselZoomValue").textContent = "100%";
        document.getElementById("carouselFilterSelect").value = "none";
        document.getElementById("carouselFilterIntensityRow").style.display = "none";
        applyCarouselFilter();
        updateCarouselCropTransform();
    });
    document.getElementById("carouselZoom").addEventListener("input", (e) => {
        const c = _carouselCrop(); c.zoom = parseInt(e.target.value);
        document.getElementById("carouselZoomValue").textContent = c.zoom + "%";
        updateCarouselCropTransform();
    });

    // Filter controls
    const filterSelect = document.getElementById("carouselFilterSelect");
    filterSelect.innerHTML = "";
    for (const [key, f] of Object.entries(PHOTO_FILTERS)) {
        const opt = document.createElement("option");
        opt.value = key; opt.textContent = f.label;
        filterSelect.appendChild(opt);
    }
    filterSelect.addEventListener("change", () => {
        const item = carouselItems[currentCarouselIndex];
        if (item) item.filterKey = filterSelect.value;
        document.getElementById("carouselFilterIntensityRow").style.display = filterSelect.value === "none" ? "none" : "";
        applyCarouselFilter();
    });
    document.getElementById("carouselFilterIntensity").addEventListener("input", (e) => {
        const item = carouselItems[currentCarouselIndex];
        if (item) item.filterIntensity = parseInt(e.target.value);
        document.getElementById("carouselFilterIntensityValue").textContent = e.target.value + "%";
        applyCarouselFilter();
    });

    // Pan via mouse
    const vp = document.getElementById("carouselCropViewport");
    vp.addEventListener("mousedown", (e) => {
        e.preventDefault(); _carouselDragging = true;
        const c = _carouselCrop();
        _carouselDragStart = { x: e.clientX, y: e.clientY, panX: c.panX, panY: c.panY };
    });
    window.addEventListener("mousemove", (e) => {
        if (!_carouselDragging) return;
        const c = _carouselCrop();
        c.panX = _carouselDragStart.panX + (e.clientX - _carouselDragStart.x);
        c.panY = _carouselDragStart.panY + (e.clientY - _carouselDragStart.y);
        updateCarouselCropTransform();
    });
    window.addEventListener("mouseup", () => { _carouselDragging = false; });

    // Pan via touch
    vp.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            _carouselDragging = true;
            const t = e.touches[0]; const c = _carouselCrop();
            _carouselDragStart = { x: t.clientX, y: t.clientY, panX: c.panX, panY: c.panY };
        }
    }, { passive: true });
    vp.addEventListener("touchmove", (e) => {
        if (!_carouselDragging || e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0]; const c = _carouselCrop();
        c.panX = _carouselDragStart.panX + (t.clientX - _carouselDragStart.x);
        c.panY = _carouselDragStart.panY + (t.clientY - _carouselDragStart.y);
        updateCarouselCropTransform();
    }, { passive: false });
    vp.addEventListener("touchend", () => { _carouselDragging = false; });
}

function updateCarouselCropTransform() {
    const crop = _carouselCrop();
    const img = document.getElementById("carouselEditImage");
    const canvas = document.getElementById("carouselFilterCanvas");
    const vp = document.getElementById("carouselCropViewport");
    if (!_carouselOrigImg) return;

    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const isRotated = crop.rotation % 180 !== 0;
    const natW = _carouselOrigImg.naturalWidth;
    const natH = _carouselOrigImg.naturalHeight;
    const imgW = isRotated ? natH : natW;
    const imgH = isRotated ? natW : natH;

    const scaleToFit = Math.max(vw / imgW, vh / imgH);
    const zoom = crop.zoom / 100;
    const finalScale = scaleToFit * zoom;

    const displayW = natW * finalScale;
    const displayH = natH * finalScale;
    const maxPanX = Math.max(0, ((isRotated ? displayH : displayW) - vw) / 2);
    const maxPanY = Math.max(0, ((isRotated ? displayW : displayH) - vh) / 2);
    crop.panX = Math.max(-maxPanX, Math.min(maxPanX, crop.panX));
    crop.panY = Math.max(-maxPanY, Math.min(maxPanY, crop.panY));

    crop._vpW = vw;
    crop._vpH = vh;

    const transform = `translate(${crop.panX}px, ${crop.panY}px) rotate(${crop.rotation}deg) scale(${finalScale})`;
    img.style.width = `${natW}px`;
    img.style.height = `${natH}px`;
    img.style.transform = transform;
    img.style.left = `${(vw - natW) / 2}px`;
    img.style.top = `${(vh - natH) / 2}px`;

    const cw = canvas.width || natW;
    const ch = canvas.height || natH;
    const canvasScale = finalScale * (natW / cw);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    canvas.style.transform = `translate(${crop.panX}px, ${crop.panY}px) rotate(${crop.rotation}deg) scale(${canvasScale})`;
    canvas.style.left = `${(vw - cw) / 2}px`;
    canvas.style.top = `${(vh - ch) / 2}px`;
}

function applyCarouselFilter() {
    const item = carouselItems[currentCarouselIndex];
    if (!item || !_carouselOrigImg) return;
    const filterKey = item.filterKey || "none";
    const intensity = (item.filterIntensity || 80) / 100;
    const img = document.getElementById("carouselEditImage");
    const canvas = document.getElementById("carouselFilterCanvas");

    if (filterKey === "none" || intensity === 0) {
        img.style.display = "";
        canvas.style.display = "none";
        updateCarouselCropTransform();
        return;
    }

    const filter = PHOTO_FILTERS[filterKey];
    if (!filter) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const natW = _carouselOrigImg.naturalWidth;
    const natH = _carouselOrigImg.naturalHeight;
    const MAX = 1200;
    const ps = Math.min(1, MAX / Math.max(natW, natH));
    const pw = Math.round(natW * ps);
    const ph = Math.round(natH * ps);
    canvas.width = pw;
    canvas.height = ph;

    const b = 1 + ((filter.brightness || 1) - 1) * intensity;
    const co = 1 + ((filter.contrast || 1) - 1) * intensity;
    const s = filter.grayscale ? 1 - intensity : 1 + ((filter.saturate || 1) - 1) * intensity;
    let cssF = `brightness(${b}) contrast(${co}) saturate(${s})`;
    if (filter.grayscale) cssF += ` grayscale(${intensity})`;
    if (filter.temperature) cssF += ` hue-rotate(${filter.temperature * 0.5 * intensity}deg)`;
    ctx.filter = cssF;
    ctx.drawImage(_carouselOrigImg, 0, 0, pw, ph);
    ctx.filter = "none";

    if (filter.tint) {
        const t = filter.tint;
        ctx.fillStyle = `rgba(${t.r},${t.g},${t.b},${(t.a || 0.05) * intensity})`;
        ctx.fillRect(0, 0, pw, ph);
    }
    if (filter.clarity && filter.clarity > 0) {
        ctx.globalCompositeOperation = "overlay";
        ctx.globalAlpha = filter.clarity * intensity * 0.3;
        ctx.drawImage(canvas, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
    }
    if (filter.vignette && filter.vignette > 0) {
        const cx = pw / 2, cy = ph / 2, r = Math.max(cx, cy);
        const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.2);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${filter.vignette * intensity})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, pw, ph);
    }

    img.style.display = "none";
    canvas.style.display = "";
    updateCarouselCropTransform();
}

async function handleCarouselFiles(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    if (files.length < CAROUSEL_MIN_PHOTOS) {
        showToast(`Escolha pelo menos ${CAROUSEL_MIN_PHOTOS} fotos para montar um carrossel.`, "error");
        return;
    }
    if (files.length > CAROUSEL_MAX_PHOTOS) {
        showToast(`Máximo de ${CAROUSEL_MAX_PHOTOS} fotos por carrossel. Selecione menos fotos.`, "error");
        return;
    }

    carouselItems = [];
    for (const file of files) {
        const base64 = await fileToBase64(file);
        carouselItems.push({ base64, text: "", crop: { panX: 0, panY: 0, zoom: 100, rotation: 0 }, filterKey: "none", filterIntensity: 80 });
    }

    document.getElementById("carouselCaption").value = "";
    document.getElementById("carouselHashtags").value = "";
    document.getElementById("carouselLocation").value = "";

    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById("carouselScheduleDate").value = local;

    currentCarouselIndex = 0;
    document.getElementById("carouselEditorModal").classList.remove("hidden");
    renderCarouselThumbnails();
    loadCarouselEditorForCurrent();
    updateCarouselNav();
}

function loadCarouselEditorForCurrent() {
    const item = carouselItems[currentCarouselIndex];
    document.getElementById("carouselTextOverlay").value = item.text || "";

    const crop = _carouselCrop();
    document.getElementById("carouselZoom").value = crop.zoom;
    document.getElementById("carouselZoomValue").textContent = crop.zoom + "%";
    document.getElementById("carouselFilterSelect").value = item.filterKey || "none";
    document.getElementById("carouselFilterIntensity").value = item.filterIntensity || 80;
    document.getElementById("carouselFilterIntensityValue").textContent = (item.filterIntensity || 80) + "%";
    document.getElementById("carouselFilterIntensityRow").style.display = (item.filterKey && item.filterKey !== "none") ? "" : "none";

    const img = document.getElementById("carouselEditImage");
    _carouselOrigImg = new Image();
    _carouselOrigImg.onload = () => {
        img.src = _carouselOrigImg.src;
        img.style.display = "";
        document.getElementById("carouselFilterCanvas").style.display = "none";
        requestAnimationFrame(() => {
            applyCarouselFilter();
            updateCarouselCropTransform();
        });
    };
    _carouselOrigImg.src = item.base64;
}

function renderCarouselThumbnails() {
    const strip = document.getElementById("carouselThumbnails");
    strip.innerHTML = "";
    carouselItems.forEach((item, i) => {
        const thumb = document.createElement("div");
        thumb.className = "story-thumb" + (i === currentCarouselIndex ? " active" : "");
        thumb.innerHTML = `<img src="${item.base64}"><span class="story-thumb-num">${i + 1}</span>`;
        thumb.addEventListener("click", () => {
            saveCurrentCarouselFields();
            currentCarouselIndex = i;
            renderCarouselThumbnails();
            loadCarouselEditorForCurrent();
            updateCarouselNav();
        });

        const removeBtn = document.createElement("button");
        removeBtn.className = "story-thumb-remove";
        removeBtn.textContent = "✕";
        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (carouselItems.length <= CAROUSEL_MIN_PHOTOS) {
                showToast(`O carrossel precisa de pelo menos ${CAROUSEL_MIN_PHOTOS} fotos.`, "error");
                return;
            }
            carouselItems.splice(i, 1);
            if (currentCarouselIndex >= carouselItems.length) currentCarouselIndex = carouselItems.length - 1;
            renderCarouselThumbnails();
            loadCarouselEditorForCurrent();
            updateCarouselNav();
        });
        thumb.appendChild(removeBtn);
        strip.appendChild(thumb);
    });
}

function saveCurrentCarouselFields() {
    if (!carouselItems[currentCarouselIndex]) return;
    carouselItems[currentCarouselIndex].text = document.getElementById("carouselTextOverlay").value;
}

function updateCarouselNav() {
    const total = carouselItems.length;
    document.getElementById("carouselPrevBtn").disabled = currentCarouselIndex === 0;
    document.getElementById("carouselNextBtn").disabled = currentCarouselIndex === total - 1;
    document.getElementById("carouselCounter").textContent = `${currentCarouselIndex + 1} / ${total}`;
    document.getElementById("confirmCarouselBtn").textContent = `Agendar Carrossel (${total} fotos)`;
}

function navigateCarousel(dir) {
    saveCurrentCarouselFields();
    currentCarouselIndex = Math.max(0, Math.min(carouselItems.length - 1, currentCarouselIndex + dir));
    renderCarouselThumbnails();
    loadCarouselEditorForCurrent();
    updateCarouselNav();
}

function renderCarouselFinalCanvas(item) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement("canvas");
            c.width = 1080; c.height = 1080;
            const ctx = c.getContext("2d");
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, 1080, 1080);

            const crop = item.crop || { panX: 0, panY: 0, zoom: 100, rotation: 0 };
            const isRotated = crop.rotation % 180 !== 0;
            const natW = img.naturalWidth;
            const natH = img.naturalHeight;
            const imgW = isRotated ? natH : natW;
            const imgH = isRotated ? natW : natH;

            const scaleToFit = Math.max(1080 / imgW, 1080 / imgH);
            const zoom = crop.zoom / 100;
            const finalScale = scaleToFit * zoom;

            const vpW = crop._vpW || 320;
            const vpH = crop._vpH || 320;
            const panXScaled = crop.panX * (1080 / vpW);
            const panYScaled = crop.panY * (1080 / vpH);

            const filterKey = item.filterKey || "none";
            const hasFilter = filterKey !== "none" && item.filterIntensity;
            const filter = hasFilter ? PHOTO_FILTERS[filterKey] : null;

            if (filter) {
                const intensity = (item.filterIntensity || 80) / 100;
                const b = 1 + ((filter.brightness || 1) - 1) * intensity;
                const co = 1 + ((filter.contrast || 1) - 1) * intensity;
                const s = filter.grayscale ? 1 - intensity : 1 + ((filter.saturate || 1) - 1) * intensity;
                let cssF = `brightness(${b}) contrast(${co}) saturate(${s})`;
                if (filter.grayscale) cssF += ` grayscale(${intensity})`;
                if (filter.temperature) cssF += ` hue-rotate(${filter.temperature * 0.5 * intensity}deg)`;
                ctx.filter = cssF;
            }

            ctx.save();
            ctx.translate(1080 / 2 + panXScaled, 1080 / 2 + panYScaled);
            ctx.rotate((crop.rotation * Math.PI) / 180);
            ctx.scale(finalScale, finalScale);
            ctx.drawImage(img, -natW / 2, -natH / 2);
            ctx.restore();
            ctx.filter = "none";

            if (filter) {
                const intensity = (item.filterIntensity || 80) / 100;
                if (filter.tint) {
                    const t = filter.tint;
                    ctx.fillStyle = `rgba(${t.r},${t.g},${t.b},${(t.a || 0.05) * intensity})`;
                    ctx.fillRect(0, 0, 1080, 1080);
                }
                if (filter.vignette && filter.vignette > 0) {
                    const cx = 540, cy = 540, r = Math.max(cx, cy);
                    const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.2);
                    grad.addColorStop(0, "rgba(0,0,0,0)");
                    grad.addColorStop(1, `rgba(0,0,0,${filter.vignette * intensity})`);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, 1080, 1080);
                }
            }

            const text = (item.text || "").trim();
            if (text) {
                ctx.save();
                ctx.font = "bold 56px sans-serif";
                ctx.textAlign = "center";
                ctx.fillStyle = "#fff";
                ctx.shadowColor = "rgba(0,0,0,0.7)";
                ctx.shadowBlur = 12;
                ctx.fillText(text, 540, 960, 1000);
                ctx.restore();
            }

            resolve(c.toDataURL("image/jpeg", 0.92));
        };
        img.src = item.base64;
    });
}

function closeCarouselEditor() {
    document.getElementById("carouselEditorModal").classList.add("hidden");
    carouselItems = [];
    currentCarouselIndex = 0;
    _carouselOrigImg = null;
}

async function submitCarousel() {
    saveCurrentCarouselFields();

    if (carouselItems.length < CAROUSEL_MIN_PHOTOS) {
        showToast(`O carrossel precisa de pelo menos ${CAROUSEL_MIN_PHOTOS} fotos.`, "error");
        return;
    }
    if (carouselItems.length > CAROUSEL_MAX_PHOTOS) {
        showToast(`Máximo de ${CAROUSEL_MAX_PHOTOS} fotos por carrossel.`, "error");
        return;
    }

    const caption = document.getElementById("carouselCaption").value.trim();
    const hashtagsRaw = document.getElementById("carouselHashtags").value.trim();
    const hashtags = hashtagsRaw ? hashtagsRaw.split(/[\s,]+/).filter(Boolean) : [];
    const location = document.getElementById("carouselLocation").value.trim();
    const scheduleDate = document.getElementById("carouselScheduleDate").value;

    const btn = document.getElementById("confirmCarouselBtn");
    btn.disabled = true;
    btn.textContent = "Gerando fotos...";

    try {
        const photos = [];
        for (let i = 0; i < carouselItems.length; i++) {
            btn.textContent = `Gerando foto ${i + 1}/${carouselItems.length}...`;
            const finalBase64 = await renderCarouselFinalCanvas(carouselItems[i]);
            photos.push(finalBase64);
        }

        btn.textContent = "Agendando...";
        const res = await apiFetch("/create-post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                photos,
                caption,
                hashtags,
                location,
                schedule_date: scheduleDate ? new Date(scheduleDate).toISOString() : new Date().toISOString(),
                post_type: "carousel",
            }),
        });
        const data = await res.json();
        if (data.success) {
            showToast("Carrossel agendado com sucesso!", "success");
            if (typeof loadNextPosts === "function") loadNextPosts();
            closeCarouselEditor();
        } else {
            showToast(data.error || "Erro ao agendar carrossel.", "error");
        }
    } catch (e) {
        showToast("Erro ao agendar carrossel. Verifique a conexão.", "error");
    }

    btn.disabled = false;
    btn.textContent = "Agendar Carrossel";
}

// ============================================================
// GERAR CONTEÚDO (roteiros -> carrosseis via Claude + Unsplash)
// ============================================================

const CG_DEFAULT_THEMES = [
    "Cidades",
    "Highlights",
    "Pratos e Bebidas Típicas",
    "Locais Instagramáveis",
    "Dicas Práticas",
];

let cgExpeditions = [];   // [{name, roteiro_text}]
let cgThemes = [];        // [{name, photo_count}]
let cgCurrentBatchId = null;
let _cgPollTimer = null;
let cgScheduleTarget = null; // {expedition_id, theme_id}
let cgPresetExpeditions = []; // [{name, roteiro_text}] carregado do backend

async function loadCgPresetExpeditions() {
    if (cgPresetExpeditions.length) return cgPresetExpeditions;
    try {
        const res = await apiFetch("/content-batches/preset-expeditions");
        const data = await res.json();
        cgPresetExpeditions = data.expeditions || [];
    } catch (e) {
        cgPresetExpeditions = [];
    }
    return cgPresetExpeditions;
}

function setupContentGenPage() {
    loadCgPresetExpeditions().then(() => renderCgExpeditionsList());
    restoreCgBatchFromStorage();

    document.getElementById("cgAddExpeditionBtn").addEventListener("click", () => {
        cgExpeditions.push({ name: "", roteiro_text: "" });
        renderCgExpeditionsList();
    });

    document.getElementById("cgAddThemeBtn").addEventListener("click", () => {
        cgThemes.push({ name: "", photo_count: 5 });
        renderCgThemesList();
    });

    document.getElementById("cgSubmitBtn").addEventListener("click", submitContentBatch);
    document.getElementById("cgCancelBtn").addEventListener("click", cancelContentBatch);
    document.getElementById("cgBackToFormBtn").addEventListener("click", () => {
        _stopContentGenPoll();
        cgCurrentBatchId = null;
        localStorage.removeItem("cgCurrentBatchId");
        document.getElementById("cgProgress").classList.add("hidden");
        document.getElementById("cgForm").classList.remove("hidden");
    });

    document.getElementById("cgScheduleCloseBtn").addEventListener("click", closeCgScheduleModal);
    document.getElementById("cgScheduleCancelBtn").addEventListener("click", closeCgScheduleModal);
    document.getElementById("cgScheduleConfirmBtn").addEventListener("click", confirmCgSchedule);
}

async function restoreCgBatchFromStorage() {
    const saved = localStorage.getItem("cgCurrentBatchId");
    if (!saved || cgCurrentBatchId) return;
    try {
        const res = await apiFetch(`/content-batches/${saved}`);
        if (!res.ok) throw new Error("not found");
        cgCurrentBatchId = saved;
    } catch (e) {
        localStorage.removeItem("cgCurrentBatchId");
        return;
    }
    const activePage = document.querySelector(".page.active");
    if (activePage && activePage.id === "page-content-gen") {
        renderContentGenPage();
    }
}

function renderContentGenPage() {
    if (cgExpeditions.length === 0) {
        cgExpeditions.push({ name: "", roteiro_text: "" });
    }
    if (cgThemes.length === 0) {
        cgThemes = CG_DEFAULT_THEMES.map((name) => ({ name, photo_count: 5 }));
    }
    renderCgExpeditionsList();
    renderCgThemesList();

    if (cgCurrentBatchId) {
        document.getElementById("cgForm").classList.add("hidden");
        document.getElementById("cgProgress").classList.remove("hidden");
        pollContentBatchProgress(cgCurrentBatchId);
    } else {
        document.getElementById("cgForm").classList.remove("hidden");
        document.getElementById("cgProgress").classList.add("hidden");
    }
}

function renderCgExpeditionsList() {
    const container = document.getElementById("cgExpeditionsList");
    const presetOptions = cgPresetExpeditions.map((p, pi) =>
        `<option value="${pi}">${escapeHtml(p.name)}</option>`
    ).join("");

    container.innerHTML = cgExpeditions.map((exp, i) => `
        <div class="cg-expedition-block" data-index="${i}">
            <div class="cg-block-header">
                <label class="field-label" style="margin:0">Expedição ${i + 1}</label>
                ${cgExpeditions.length > 1 ? `<button type="button" class="cg-remove-btn" data-remove-exp="${i}">Remover</button>` : ""}
            </div>
            <select class="cg-exp-preset" data-exp-preset="${i}">
                <option value="">— selecionar expedição cadastrada —</option>
                ${presetOptions}
                <option value="custom">Personalizado (preencher manualmente)</option>
            </select>
            <input type="text" class="cg-exp-name" data-exp-name="${i}" placeholder="Nome da expedição" value="${escapeHtml(exp.name)}">
            <textarea class="cg-exp-roteiro" data-exp-roteiro="${i}" placeholder="Cole aqui o roteiro completo da expedição...">${escapeHtml(exp.roteiro_text)}</textarea>
        </div>
    `).join("");

    container.querySelectorAll("[data-exp-preset]").forEach((select) => {
        select.addEventListener("change", (e) => {
            const idx = Number(e.target.dataset.expPreset);
            const val = e.target.value;
            if (val === "" || val === "custom") {
                return;
            }
            const preset = cgPresetExpeditions[Number(val)];
            if (preset) {
                cgExpeditions[idx].name = preset.name;
                cgExpeditions[idx].roteiro_text = preset.roteiro_text;
                renderCgExpeditionsList();
                updateCgEstimate();
            }
        });
    });
    container.querySelectorAll("[data-exp-name]").forEach((input) => {
        input.addEventListener("input", (e) => {
            cgExpeditions[Number(e.target.dataset.expName)].name = e.target.value;
            updateCgEstimate();
        });
    });
    container.querySelectorAll("[data-exp-roteiro]").forEach((ta) => {
        ta.addEventListener("input", (e) => {
            cgExpeditions[Number(e.target.dataset.expRoteiro)].roteiro_text = e.target.value;
        });
    });
    container.querySelectorAll("[data-remove-exp]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            cgExpeditions.splice(Number(e.target.dataset.removeExp), 1);
            renderCgExpeditionsList();
            updateCgEstimate();
        });
    });

    updateCgEstimate();
}

const CG_PHOTO_COUNT_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];

function renderCgThemesList() {
    const container = document.getElementById("cgThemesList");
    container.innerHTML = cgThemes.map((theme, i) => `
        <div class="cg-theme-block" data-index="${i}">
            <input type="text" data-theme-name="${i}" placeholder="Nome do tema" value="${escapeHtml(theme.name)}">
            <select data-theme-photo-count="${i}" title="Número de fotos do carrossel">
                ${CG_PHOTO_COUNT_OPTIONS.map((n) => `<option value="${n}" ${Number(theme.photo_count || 5) === n ? "selected" : ""}>${n} fotos</option>`).join("")}
            </select>
            ${cgThemes.length > 1 ? `<button type="button" class="cg-remove-btn" data-remove-theme="${i}">Remover</button>` : ""}
        </div>
    `).join("");

    container.querySelectorAll("[data-theme-name]").forEach((input) => {
        input.addEventListener("input", (e) => {
            cgThemes[Number(e.target.dataset.themeName)].name = e.target.value;
            updateCgEstimate();
        });
    });
    container.querySelectorAll("[data-theme-photo-count]").forEach((select) => {
        select.addEventListener("change", (e) => {
            cgThemes[Number(e.target.dataset.themePhotoCount)].photo_count = Number(e.target.value);
            updateCgEstimate();
        });
    });
    container.querySelectorAll("[data-remove-theme]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            cgThemes.splice(Number(e.target.dataset.removeTheme), 1);
            renderCgThemesList();
            updateCgEstimate();
        });
    });

    updateCgEstimate();
}

function updateCgEstimate() {
    const photosPerRound = cgThemes.reduce((sum, t) => sum + Number(t.photo_count || 5), 0);
    const totalItems = cgExpeditions.length * photosPerRound;
    const hours = totalItems ? Math.round((totalItems / 25) * 10) / 10 : 0;
    const el = document.getElementById("cgEstimate");
    if (el) {
        el.textContent = totalItems
            ? `${totalItems} fotos no total — estimativa de ~${hours}h para baixar todas (cota do Unsplash é limitada).`
            : "";
    }
}

async function submitContentBatch() {
    const name = document.getElementById("cgBatchName").value.trim();
    const expeditions = cgExpeditions
        .map((e) => ({ name: e.name.trim(), roteiro_text: e.roteiro_text.trim() }))
        .filter((e) => e.name && e.roteiro_text);
    const themes = cgThemes
        .map((t) => ({ name: (t.name || "").trim(), photo_count: Number(t.photo_count) || 5 }))
        .filter((t) => t.name);

    if (expeditions.length === 0) {
        showToast("Adicione ao menos 1 expedição com nome e roteiro.", "error");
        return;
    }
    if (themes.length === 0) {
        showToast("Adicione ao menos 1 tema.", "error");
        return;
    }

    const btn = document.getElementById("cgSubmitBtn");
    btn.disabled = true;
    btn.textContent = "Criando leva...";

    try {
        const createRes = await apiFetch("/content-batches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, expeditions, themes }),
        });
        const createData = await createRes.json();
        if (!createData.success) {
            showToast(createData.error || "Erro ao criar leva.", "error");
            btn.disabled = false;
            btn.textContent = "Gerar conteúdo →";
            return;
        }

        cgCurrentBatchId = createData.batch_id;
        localStorage.setItem("cgCurrentBatchId", cgCurrentBatchId);

        const genRes = await apiFetch(`/content-batches/${cgCurrentBatchId}/generate-text`, { method: "POST" });
        const genData = await genRes.json();
        if (!genData.success) {
            showToast(genData.error || "Erro ao iniciar geração de texto.", "error");
        } else {
            showToast("Gerando textos com IA em segundo plano...", "success");
        }

        document.getElementById("cgForm").classList.add("hidden");
        document.getElementById("cgProgress").classList.remove("hidden");
        pollContentBatchProgress(cgCurrentBatchId);
    } catch (e) {
        showToast("Erro de conexão ao criar a leva.", "error");
    }

    btn.disabled = false;
    btn.textContent = "Gerar conteúdo →";
}

async function cancelContentBatch() {
    if (!cgCurrentBatchId) return;
    if (!confirm("Cancelar esta leva? Textos e fotos ainda pendentes param de ser gerados. O que já ficou pronto continua disponível pra agendar.")) return;

    const btn = document.getElementById("cgCancelBtn");
    btn.disabled = true;
    btn.textContent = "Cancelando...";

    try {
        await apiFetch(`/content-batches/${cgCurrentBatchId}/cancel`, { method: "POST" });
        showToast("Leva cancelada. O que já estava pronto continua disponível.", "success");
        _cgPhotoDownloadStarted = true; // impede o próximo tick de tentar reiniciar o download
        fetchAndRenderCgProgress(cgCurrentBatchId);
    } catch (e) {
        showToast("Erro ao cancelar a leva.", "error");
    }

    btn.disabled = false;
    btn.textContent = "Cancelar";
}

function _stopContentGenPoll() {
    if (_cgPollTimer) {
        clearInterval(_cgPollTimer);
        _cgPollTimer = null;
    }
}

function pollContentBatchProgress(batchId) {
    _stopContentGenPoll();
    const tick = () => fetchAndRenderCgProgress(batchId);
    tick();
    _cgPollTimer = setInterval(tick, 5000);
}

let _cgPhotoDownloadStarted = false;

async function fetchAndRenderCgProgress(batchId) {
    try {
        const res = await apiFetch(`/content-batches/${batchId}/progress`);
        const data = await res.json();
        if (data.error) {
            showToast(data.error, "error");
            _stopContentGenPoll();
            return;
        }
        renderContentGenGrid(data);

        // Assim que os textos terminam, dispara o download das fotos (idempotente).
        const totals = data.totals;
        if (!_cgPhotoDownloadStarted && totals.text_pending === 0 && (totals.photo_pending > 0)) {
            _cgPhotoDownloadStarted = true;
            apiFetch(`/content-batches/${batchId}/start-photo-download`, { method: "POST" }).catch(() => {});
        }
    } catch (e) {
        // silencioso - tenta de novo no proximo tick
    }
}

function renderContentGenGrid(data) {
    const { batch, totals, themes, estimated_hours_remaining } = data;

    const titleSuffix = batch.status === "cancelled" ? " (cancelada)" : "";
    document.getElementById("cgProgressTitle").textContent = (batch.name || "Gerando conteúdo…") + titleSuffix;
    document.getElementById("cgCancelBtn").classList.toggle("hidden", batch.status === "cancelled" || batch.status === "done");

    const textTotal = totals.total || 0;
    const textDone = totals.text_done || 0;
    const photoTotal = totals.total || 0;
    const photoDone = totals.photo_done || 0;

    document.getElementById("cgTextProgressLabel").textContent = `${textDone}/${textTotal}`;
    document.getElementById("cgTextProgressFill").style.width = textTotal ? `${(textDone / textTotal) * 100}%` : "0%";
    document.getElementById("cgPhotoProgressLabel").textContent = `${photoDone}/${photoTotal}`;
    document.getElementById("cgPhotoProgressFill").style.width = photoTotal ? `${(photoDone / photoTotal) * 100}%` : "0%";

    const etaEl = document.getElementById("cgEtaLabel");
    if (totals.photo_pending > 0) {
        etaEl.textContent = `Estimativa: ~${estimated_hours_remaining}h restantes para as fotos (cota do Unsplash).`;
    } else {
        etaEl.textContent = "";
    }

    const grid = document.getElementById("cgGrid");
    grid.innerHTML = themes.map((theme) => {
        const thumbs = theme.items.map((item) => {
            let thumbHtml;
            if (item.photo_status === "done" && item.photo_path) {
                thumbHtml = `<img src="/${item.photo_path}" alt="${escapeHtml(item.theme_name)}">`;
            } else if (item.photo_status === "error") {
                thumbHtml = `<div class="cg-thumb-placeholder error" title="${escapeHtml(item.photo_error || "erro")}">⚠️</div>`;
            } else {
                thumbHtml = `<div class="cg-thumb-placeholder">${item.text_status === "done" ? "⏳" : "✍️"}</div>`;
            }
            const badgeClass = item.photo_status === "done" ? "done" : (item.photo_status === "error" || item.text_status === "error") ? "error" : "pending";
            const badgeLabel = item.photo_status === "done" ? "OK" : (item.text_status === "error" ? "erro texto" : item.photo_status === "error" ? "erro foto" : "…");
            return `
                <div class="cg-thumb">
                    ${thumbHtml}
                    <span class="status-badge ${badgeClass}">${badgeLabel}</span>
                </div>
            `;
        }).join("");

        const hasError = theme.items.some((it) => it.text_status === "error" || it.photo_status === "error");
        const firstErrorItem = theme.items.find((it) => it.text_status === "error" || it.photo_status === "error");

        let actionHtml;
        if (theme.scheduled) {
            actionHtml = `<span class="status-badge done">Agendado</span>`;
        } else if (theme.ready) {
            actionHtml = `<button class="btn btn-small btn-primary" data-schedule-exp="${theme.expedition_id}" data-schedule-theme="${theme.theme_id}">Agendar carrossel</button>`;
        } else if (hasError) {
            actionHtml = `<button class="btn btn-small" data-retry-item="${firstErrorItem.id}">Tentar de novo</button>`;
        } else {
            actionHtml = `<span class="muted-text">Em andamento…</span>`;
        }

        return `
            <div class="cg-theme-card">
                <div class="cg-theme-card-header">
                    <div>
                        <h4>${escapeHtml(theme.theme_name)}</h4>
                        <div class="cg-theme-card-sub">${escapeHtml(theme.expedition_name)}</div>
                    </div>
                    ${actionHtml}
                </div>
                <div class="cg-thumbs-row">${thumbs}</div>
            </div>
        `;
    }).join("") || `<p class="empty-state">Nenhum item ainda.</p>`;

    grid.querySelectorAll("[data-schedule-exp]").forEach((btn) => {
        btn.addEventListener("click", () => {
            openCgScheduleModal(btn.dataset.scheduleExp, btn.dataset.scheduleTheme);
        });
    });
    grid.querySelectorAll("[data-retry-item]").forEach((btn) => {
        btn.addEventListener("click", () => retryContentItem(btn.dataset.retryItem));
    });
}

async function retryContentItem(itemId) {
    if (!cgCurrentBatchId) return;
    try {
        const res = await apiFetch(`/content-batches/${cgCurrentBatchId}/items/${itemId}/retry`, { method: "POST" });
        const data = await res.json();
        if (data.success) {
            showToast("Reprocessando item...", "success");
            fetchAndRenderCgProgress(cgCurrentBatchId);
        } else {
            showToast(data.error || "Erro ao reprocessar item.", "error");
        }
    } catch (e) {
        showToast("Erro de conexão ao reprocessar item.", "error");
    }
}

function openCgScheduleModal(expeditionId, themeId) {
    cgScheduleTarget = { expedition_id: expeditionId, theme_id: themeId };
    document.getElementById("cgScheduleThemeLabel").textContent = "Escolha a data e hora para publicar este carrossel.";
    document.getElementById("cgScheduleDateInput").value = "";
    document.getElementById("cgScheduleModal").classList.remove("hidden");
}

function closeCgScheduleModal() {
    document.getElementById("cgScheduleModal").classList.add("hidden");
    cgScheduleTarget = null;
}

async function confirmCgSchedule() {
    if (!cgScheduleTarget || !cgCurrentBatchId) return;
    const dateVal = document.getElementById("cgScheduleDateInput").value;
    const scheduleDate = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();

    const btn = document.getElementById("cgScheduleConfirmBtn");
    btn.disabled = true;
    try {
        const res = await apiFetch(`/content-batches/${cgCurrentBatchId}/schedule-theme`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                expedition_id: cgScheduleTarget.expedition_id,
                theme_id: cgScheduleTarget.theme_id,
                schedule_date: scheduleDate,
            }),
        });
        const data = await res.json();
        if (data.success) {
            showToast("Carrossel agendado com sucesso!", "success");
            closeCgScheduleModal();
            fetchAndRenderCgProgress(cgCurrentBatchId);
        } else {
            showToast(data.error || "Erro ao agendar carrossel.", "error");
        }
    } catch (e) {
        showToast("Erro de conexão ao agendar carrossel.", "error");
    }
    btn.disabled = false;
}
