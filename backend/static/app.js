// ============================================================
// AutoPost Tabajara! - Logica principal do frontend
// ============================================================

const API_BASE = window.location.origin + "/api";

const MOODS = [
    { id: "alegre", label: "😄 Alegre" },
    { id: "triste", label: "😢 Triste" },
    { id: "engracada", label: "😂 Engraçada" },
    { id: "quinta_serie", label: "🤪 5ª Série" },
    { id: "pensativa", label: "🤔 Pensativa" },
    { id: "motivacional", label: "💪 Motivacional" },
    { id: "sarcastica", label: "😏 Sarcástica" },
    { id: "romantica", label: "❤️ Romântica" },
];

const PAGE_TITLES = {
    dashboard: "Dashboard",
    content: "Conteúdo",
    calendar: "Calendário",
    history: "Histórico",
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
let currentContentFilter = "all";

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
    checkConnection();
    setInterval(checkConnection, 15000);

    setupLogin();
    setupSidebar();
    setupDropzone();
    setupNewPostModal();
    setupScheduleModal();
    setupEditModal();
    setupDeleteModal();
    setupFilters();
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
    const res = await fetch(`${API_BASE}${path}`, { credentials: "same-origin", ...options });
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

async function checkConnection() {
    const dot = document.getElementById("statusDot");
    const text = document.getElementById("statusText");

    try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
            dot.classList.add("connected");
            text.textContent = "Operação Tabajara: ONLINE";
        } else {
            throw new Error("offline");
        }
    } catch (e) {
        dot.classList.remove("connected");
        text.textContent = "Operação Tabajara: OFFLINE";
    }
}

// ============================================================
// SIDEBAR / NAVEGACAO ENTRE PAGINAS
// ============================================================

function setupSidebar() {
    document.querySelectorAll(".side-nav-item[data-page]").forEach((btn) => {
        btn.addEventListener("click", () => switchPage(btn.dataset.page));
    });

    document.querySelectorAll(".link-btn[data-page]").forEach((btn) => {
        btn.addEventListener("click", () => switchPage(btn.dataset.page));
    });

    document.getElementById("navNewPost").addEventListener("click", () => {
        document.getElementById("photoInput").click();
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
    } else if (pageName === "content") {
        renderContentGrid();
    } else if (pageName === "settings") {
        loadSettingsPage();
    }
}

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
    showProgressCard();

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

    for (const photo of selectedPhotos) {
        await processPhotoOnServer(photo);
    }
    renderProgressChecklist(2);

    const analysisErrors = [];
    for (const photo of selectedPhotos) {
        if (photo.processingError) continue;
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
            } else if (data.error) {
                analysisErrors.push(data.error);
            }
        } catch (e) {
            analysisErrors.push("Falha de conexão com o servidor.");
        }
    }
    renderProgressChecklist(4);
    await sleep(300);
    hideProgressCard();

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
// MODAL: NOVA POSTAGEM (revisão foto a foto)
// ============================================================

function setupNewPostModal() {
    document.getElementById("closeNewPostBtn").addEventListener("click", () => {
        document.getElementById("newPostModal").classList.add("hidden");
        selectedPhotos = [];
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
    document.getElementById("newPostImage").src = photo.base64;

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
}

function openScheduleModal() {
    document.getElementById("newPostModal").classList.add("hidden");
    document.getElementById("scheduleModal").classList.remove("hidden");

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("startDateInput").value = now.toISOString().slice(0, 16);

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

async function confirmAndSchedule() {
    const total = selectedPhotos.length;
    const confirmBtn = document.getElementById("confirmScheduleBtn");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Agendando...";

    const startDateValue = document.getElementById("startDateInput").value;
    const startDate = startDateValue ? new Date(startDateValue) : new Date();
    const hoursBetween = 24 / selectedFrequency;

    let postedCount = 0;

    for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const scheduledDate = new Date(startDate.getTime() + hoursBetween * i * 3600 * 1000);

        try {
            const res = await apiFetch(`/create-post`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photo: photo.base64,
                    caption: photo.caption || "",
                    hashtags: photo.hashtags || [],
                    location: photo.location || "",
                    tagged_people: photo.taggedPeople || [],
                    schedule_date: scheduledDate.toISOString()
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
    renderMiniCalendar();

    const activePage = document.querySelector(".page.active");
    const activeId = activePage ? activePage.id.replace("page-", "") : "dashboard";
    if (activeId === "calendar") renderFullCalendarPage();
    else if (activeId === "history") renderHistoryList();
    else if (activeId === "content") renderContentGrid();
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
    div.innerHTML = `
        <img src="/${post.photo_path}" alt="">
        <div class="mini-post-item-info">
            <p class="mini-post-item-caption">${escapeHtml(post.caption || "(sem legenda)")}</p>
            <div class="mini-post-item-meta">
                <span class="status-badge ${post.status}">${post.status === "posted" ? "Postado" : "Pendente"}</span>
                <span>${dateStr}</span>
            </div>
        </div>
    `;
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

    const last = posted[0];
    box.innerHTML = "";
    if (!last) {
        box.innerHTML = '<p class="empty-state">Nenhuma postagem publicada ainda.</p>';
        return;
    }

    const wrap = document.createElement("div");
    wrap.className = "last-post-box";
    wrap.innerHTML = `
        <img src="/${last.photo_path}" alt="">
        <div>
            <p class="last-post-caption">${escapeHtml(last.caption || "(sem legenda)")}</p>
            <p class="mini-post-item-meta">${formatDateBR(last.posted_at || last.schedule_date)}</p>
        </div>
    `;
    box.appendChild(wrap);
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
            const dots = document.createElement("div");
            dots.className = "cal-dots";
            if (dayPosts.some((p) => p.status === "pending")) {
                const d = document.createElement("span");
                d.className = "cal-dot pending";
                dots.appendChild(d);
            }
            if (dayPosts.some((p) => p.status === "posted")) {
                const d = document.createElement("span");
                d.className = "cal-dot posted";
                dots.appendChild(d);
            }
            el.appendChild(dots);
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

// ------------------------------------------------------------
// Conteúdo (galeria)
// ------------------------------------------------------------

function setupFilters() {
    document.querySelectorAll("#contentFilters .filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#contentFilters .filter-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentContentFilter = btn.dataset.filter;
            renderContentGrid();
        });
    });

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

function renderContentGrid() {
    const grid = document.getElementById("contentGrid");
    const filtered = filterPosts(currentContentFilter);

    grid.innerHTML = "";
    if (filtered.length === 0) {
        grid.innerHTML = '<p class="empty-state">Nenhuma foto encontrada.</p>';
        return;
    }

    filtered.forEach((post) => {
        const div = document.createElement("div");
        div.className = "content-grid-item";
        div.innerHTML = `
            <img src="/${post.photo_path}" alt="">
            <span class="status-badge ${post.status}">${post.status === "posted" ? "Postado" : "Pendente"}</span>
        `;
        div.addEventListener("click", () => openEditModal(post));
        grid.appendChild(div);
    });
}

// ------------------------------------------------------------
// Histórico
// ------------------------------------------------------------

function buildQueueItem(post) {
    const div = document.createElement("div");
    div.className = "queue-item";
    const dateStr = formatDateBR(post.schedule_date);

    div.innerHTML = `
        <img src="/${post.photo_path}" alt="">
        <div class="queue-item-info">
            <p class="queue-item-caption">${escapeHtml(post.caption || "(sem legenda)")}</p>
            <div class="queue-item-meta">
                <span class="status-badge ${post.status}">${post.status === "posted" ? "Postado" : "Pendente"}</span>
                <span>${dateStr}</span>
            </div>
        </div>
        <div class="queue-item-actions">
            <button class="edit-btn" title="Editar">✏️</button>
            <button class="delete-btn" title="Cancelar">🗑️</button>
        </div>
    `;

    div.querySelector(".edit-btn").addEventListener("click", () => openEditModal(post));
    div.querySelector(".delete-btn").addEventListener("click", () => openDeleteModal(post.id));

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
}
