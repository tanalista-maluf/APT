// ============================================================
// AutoPost WebApp - Logica principal
// ============================================================

const API_BASE = window.location.origin + "/api";

// Estado global
let selectedPhotos = []; // { file, base64, exif, caption, hashtags, location, taggedPeople }
let currentReviewIndex = 0;
let selectedFrequency = 1;
let startDate = new Date();
let useAI = true;

// ============================================================
// INICIALIZACAO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    checkConnection();
    setInterval(checkConnection, 15000);

    setupLogin();
    setupTabNavigation();
    setupPhotoUpload();
    setupScheduleStep();
    setupReviewStep();
    setupDashboard();
    setupModals();

    // Data de inicio padrao = agora
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("startDateInput").value = now.toISOString().slice(0, 16);
});

// ============================================================
// LOGIN (ativo somente quando o servidor define APP_PASSWORD)
// ============================================================

// Wrapper de fetch: se o servidor pedir login (401), mostra a tela de senha.
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, { credentials: "same-origin", ...options });
    if (res.status === 401) {
        showLoginOverlay();
    }
    return res;
}

function showLoginOverlay() {
    document.getElementById("loginOverlay").classList.remove("hidden");
    document.getElementById("loginPasswordInput").focus();
}

function setupLogin() {
    const overlay = document.getElementById("loginOverlay");
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
                overlay.classList.add("hidden");
                input.value = "";
                loadQueue();
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

    // Verifica ao carregar se o servidor exige senha
    fetch(`${API_BASE}/auth-status`, { credentials: "same-origin" })
        .then(res => res.json())
        .then(data => {
            if (data.auth_required && !data.authenticated) showLoginOverlay();
        })
        .catch(() => {});
}

// ============================================================
// CONEXAO COM BACKEND
// ============================================================

async function checkConnection() {
    const dot = document.getElementById("statusDot");
    const text = document.getElementById("statusText");

    try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
            dot.classList.add("connected");
            text.textContent = "Backend Conectado";
        } else {
            throw new Error("offline");
        }
    } catch (e) {
        dot.classList.remove("connected");
        text.textContent = "Backend Desconectado";
    }
}

document.getElementById("refreshBtn").addEventListener("click", checkConnection);

// ============================================================
// NAVEGACAO POR TABS
// ============================================================

function setupTabNavigation() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");

            if (btn.dataset.tab === "dashboard") {
                loadQueue();
            }
        });
    });
}

function switchToTab(tabName) {
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).click();
}

function showStep(stepId) {
    document.querySelectorAll(".step").forEach(s => s.classList.add("hidden"));
    document.getElementById(stepId).classList.remove("hidden");
}

// ============================================================
// STEP 1: UPLOAD E SELECAO DE FOTOS
// ============================================================

function setupPhotoUpload() {
    const input = document.getElementById("photoInput");
    const grid = document.getElementById("photoGrid");
    const proceedBtn = document.getElementById("proceedToScheduleBtn");
    const useAiCheckbox = document.getElementById("useAiCheckbox");

    input.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = [];

        for (const file of files) {
            const rawBase64 = await fileToBase64(file);
            const photo = {
                id: `photo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                file,
                base64: rawBase64,   // sera substituido pela versao normalizada
                processing: true,     // mostra spinner ate o backend responder
                selected: true,
                exif: null,
                caption: "",
                hashtags: [],
                location: "",
                taggedPeople: []
            };
            selectedPhotos.push(photo);
            newPhotos.push(photo);
        }

        renderPhotoGrid();
        input.value = "";

        // Processa cada foto nova, uma de cada vez: corrige HEIC/rotacao, extrai EXIF/local.
        // Sequencial (nao em paralelo) para nao sobrecarregar o servidor local
        // nem estourar o limite de 1 req/seg do servico de geolocalizacao.
        for (const photo of newPhotos) {
            await processPhotoOnServer(photo);
            renderPhotoGrid();
        }
    });

    useAiCheckbox.addEventListener("change", (e) => {
        useAI = e.target.checked;
    });

    proceedBtn.addEventListener("click", async () => {
        await proceedFromSelection();
    });
}

function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
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
    } finally {
        photo.processing = false;
    }
}

function renderPhotoGrid() {
    const grid = document.getElementById("photoGrid");
    const summary = document.getElementById("selectionSummary");
    const countEl = document.getElementById("selectedCount");
    const proceedBtn = document.getElementById("proceedToScheduleBtn");

    grid.innerHTML = "";

    selectedPhotos.forEach((photo) => {
        const div = document.createElement("div");
        div.className = "photo-item" + (photo.selected ? " selected" : "");

        if (photo.processing) {
            div.innerHTML = `<div class="photo-processing"><div class="spinner"></div></div>`;
        } else if (photo.processingError) {
            div.innerHTML = `<div class="photo-error" title="${photo.processingError}">⚠️</div>`;
        } else {
            div.innerHTML = `<img src="${photo.base64}" alt="">`;
        }

        div.addEventListener("click", () => {
            if (photo.processing) return;
            photo.selected = !photo.selected;
            renderPhotoGrid();
        });
        grid.appendChild(div);
    });

    const selectedCount = selectedPhotos.filter(p => p.selected).length;

    if (selectedPhotos.length > 0) {
        summary.classList.remove("hidden");
        countEl.textContent = `${selectedCount} foto(s) selecionada(s)`;
    } else {
        summary.classList.add("hidden");
    }

    proceedBtn.disabled = selectedCount === 0;
}

async function proceedFromSelection() {
    let activePhotos = selectedPhotos.filter(p => p.selected);
    if (activePhotos.length === 0) return;

    // Se alguma foto ainda estiver processando (raro, mas possivel em conexoes lentas),
    // espera terminar antes de continuar.
    const stillProcessing = activePhotos.filter(p => p.processing);
    if (stillProcessing.length > 0) {
        const analyzingStatus = document.getElementById("analyzingStatus");
        const analyzingText = document.getElementById("analyzingText");
        analyzingStatus.classList.remove("hidden");
        analyzingText.textContent = "Aguardando processamento das fotos...";
        await Promise.all(stillProcessing.map(p => waitUntil(() => !p.processing)));
        analyzingStatus.classList.add("hidden");
        renderPhotoGrid();
    }

    // Remove fotos que falharam ao processar (ex: arquivo corrompido).
    // Desmarca no estado global tambem, para nao reaparecerem depois.
    const withErrors = activePhotos.filter(p => p.processingError);
    if (withErrors.length > 0) {
        alert(`${withErrors.length} foto(s) não puderam ser processadas e foram ignoradas.`);
        withErrors.forEach(p => { p.selected = false; });
        activePhotos = activePhotos.filter(p => !p.processingError);
        renderPhotoGrid();
    }

    if (activePhotos.length === 0) return;

    // Analise com IA (opcional) - a foto ja esta normalizada desde a selecao
    if (useAI) {
        const analyzingStatus = document.getElementById("analyzingStatus");
        const analyzingText = document.getElementById("analyzingText");
        analyzingStatus.classList.remove("hidden");

        const analysisErrors = [];
        for (let i = 0; i < activePhotos.length; i++) {
            const photo = activePhotos[i];
            analyzingText.textContent = `Gerando legendas com IA (${i + 1} de ${activePhotos.length})...`;
            try {
                // Envia tambem o local (do GPS) e a data - o Claude usa isso
                // para criar legendas e hashtags que citam o lugar da foto.
                const analyzeRes = await apiFetch(`/analyze-image`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        photo: photo.base64,
                        location: photo.location || "",
                        date: (photo.exif && photo.exif.dateTime) || ""
                    })
                });
                const analysis = await analyzeRes.json();
                if (analysis.success) {
                    photo.captionOptions = analysis.captions || [];
                    photo.caption = analysis.caption || "";
                    photo.hashtags = analysis.hashtags || [];
                    photo.contentType = analysis.content_type || "";
                } else if (analysis.error) {
                    analysisErrors.push(analysis.error);
                }
            } catch (e) {
                console.error("Erro ao analisar imagem:", e);
                analysisErrors.push("Falha de conexão com o servidor.");
            }
        }

        analyzingStatus.classList.add("hidden");

        if (analysisErrors.length > 0) {
            alert(`A análise com IA falhou em ${analysisErrors.length} foto(s):\n${analysisErrors[0]}\n\nVocê ainda pode escrever as legendas manualmente na revisão.`);
        }
    }

    updateScheduleSummary(activePhotos.length);
    showStep("step-schedule");
}

function waitUntil(conditionFn, intervalMs = 200) {
    return new Promise((resolve) => {
        const check = () => {
            if (conditionFn()) {
                resolve();
            } else {
                setTimeout(check, intervalMs);
            }
        };
        check();
    });
}

// ============================================================
// STEP 2: AGENDAMENTO
// ============================================================

function setupScheduleStep() {
    document.querySelectorAll(".freq-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".freq-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedFrequency = parseInt(btn.dataset.freq);
            updateScheduleSummary(getActivePhotos().length);
        });
    });

    document.getElementById("backToSelectBtn").addEventListener("click", () => {
        showStep("step-select");
    });

    document.getElementById("proceedToReviewBtn").addEventListener("click", () => {
        const dateInput = document.getElementById("startDateInput").value;
        startDate = dateInput ? new Date(dateInput) : new Date();
        currentReviewIndex = 0;
        renderReviewCard();
        showStep("step-review");
    });
}

function getActivePhotos() {
    return selectedPhotos.filter(p => p.selected);
}

function updateScheduleSummary(totalPhotos) {
    const days = Math.ceil(totalPhotos / selectedFrequency) || 0;
    document.getElementById("summaryTotalPhotos").textContent = totalPhotos;
    document.getElementById("summaryDuration").textContent = `${days} dia(s)`;
    document.getElementById("summaryFrequency").textContent = `${selectedFrequency}x/dia`;
}

// ============================================================
// STEP 3: REVISAO
// ============================================================

function setupReviewStep() {
    document.getElementById("prevPhotoBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        if (currentReviewIndex > 0) {
            currentReviewIndex--;
            renderReviewCard();
        }
    });

    document.getElementById("nextPhotoBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        const photos = getActivePhotos();
        if (currentReviewIndex < photos.length - 1) {
            currentReviewIndex++;
            renderReviewCard();
        }
    });

    document.getElementById("addHashtagBtn").addEventListener("click", addHashtagToCurrent);
    document.getElementById("newHashtagInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addHashtagToCurrent();
        }
    });

    document.getElementById("backToScheduleBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        showStep("step-schedule");
    });

    document.getElementById("confirmScheduleBtn").addEventListener("click", confirmAndSchedule);
    document.getElementById("regenHashtagsBtn").addEventListener("click", regenerateHashtags);
}

// Gera hashtags novas a partir da legenda + local atuais (depois de editar)
async function regenerateHashtags() {
    const photos = getActivePhotos();
    const photo = photos[currentReviewIndex];
    if (!photo) return;

    saveCurrentReviewFields();

    if (!photo.caption && !photo.location) {
        alert("Escreva uma legenda (ou preencha o local) antes de gerar as hashtags.");
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
            alert(data.error);
        }
    } catch (e) {
        alert("Erro ao gerar hashtags. Verifique a conexão.");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function renderReviewCard() {
    const photos = getActivePhotos();
    const photo = photos[currentReviewIndex];
    if (!photo) return;

    document.getElementById("reviewPosition").textContent = `${currentReviewIndex + 1} de ${photos.length}`;
    document.getElementById("reviewProgressFill").style.width = `${((currentReviewIndex + 1) / photos.length) * 100}%`;

    document.getElementById("reviewImage").src = photo.base64;

    if (photo.exif) {
        const settings = [
            photo.exif.cameraModel,
            photo.exif.focalLength ? `${photo.exif.focalLength}mm` : null,
            photo.exif.aperture ? `f/${photo.exif.aperture}` : null,
            photo.exif.iso ? `ISO${photo.exif.iso}` : null
        ].filter(Boolean).join(" • ");

        document.getElementById("exifCamera").textContent = settings || "Câmera desconhecida";
        document.getElementById("exifLocation").textContent = photo.exif.locationName
            ? `📍 ${photo.exif.locationName}`
            : "📍 Sem dados de localização";
        document.getElementById("exifDate").textContent = photo.exif.dateTime ? `🕐 ${photo.exif.dateTime}` : "";
    } else {
        document.getElementById("exifCamera").textContent = "Sem dados EXIF";
        document.getElementById("exifLocation").textContent = "📍 Sem dados de localização";
        document.getElementById("exifDate").textContent = "";
    }

    document.getElementById("captionTextarea").value = photo.caption || "";
    document.getElementById("locationInput").value = photo.location || "";
    document.getElementById("taggedPeopleInput").value = (photo.taggedPeople || []).join(", ");

    renderCaptionOptions(photo);
    renderHashtagList(photo);

    document.getElementById("prevPhotoBtn").disabled = currentReviewIndex === 0;
    document.getElementById("nextPhotoBtn").disabled = currentReviewIndex === photos.length - 1;
}

// Mostra as 3 opcoes de legenda geradas pela IA; clicar numa opcao
// preenche o campo de legenda (que continua 100% editavel).
function renderCaptionOptions(photo) {
    const container = document.getElementById("captionOptions");
    const options = photo.captionOptions || [];

    if (options.length === 0) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    container.classList.remove("hidden");
    container.innerHTML = "";

    options.forEach(opt => {
        const div = document.createElement("div");
        div.className = "caption-option" + (photo.caption === opt.text ? " selected" : "");

        const label = document.createElement("span");
        label.className = "caption-option-style";
        label.textContent = opt.style;

        const text = document.createElement("p");
        text.className = "caption-option-text";
        text.textContent = opt.text;

        div.appendChild(label);
        div.appendChild(text);

        div.addEventListener("click", () => {
            photo.caption = opt.text;
            document.getElementById("captionTextarea").value = opt.text;
            renderCaptionOptions(photo);
        });

        container.appendChild(div);
    });
}

function renderHashtagList(photo) {
    const list = document.getElementById("hashtagList");
    list.innerHTML = "";

    (photo.hashtags || []).forEach(tag => {
        const chip = document.createElement("div");
        chip.className = "hashtag-chip";
        chip.innerHTML = `<span>${tag}</span><button>×</button>`;
        chip.querySelector("button").addEventListener("click", () => {
            photo.hashtags = photo.hashtags.filter(t => t !== tag);
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

    const photos = getActivePhotos();
    const photo = photos[currentReviewIndex];

    if (!photo.hashtags) photo.hashtags = [];
    if (!photo.hashtags.includes(tag)) {
        photo.hashtags.push(tag);
        renderHashtagList(photo);
    }
    input.value = "";
}

function saveCurrentReviewFields() {
    const photos = getActivePhotos();
    const photo = photos[currentReviewIndex];
    if (!photo) return;

    photo.caption = document.getElementById("captionTextarea").value;
    photo.location = document.getElementById("locationInput").value;
    photo.taggedPeople = document.getElementById("taggedPeopleInput").value
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
}

async function confirmAndSchedule() {
    saveCurrentReviewFields();

    const photos = getActivePhotos();
    const confirmBtn = document.getElementById("confirmScheduleBtn");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Agendando...";

    let postedCount = 0;
    const hoursBetween = 24 / selectedFrequency;

    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
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
            console.error("Erro ao criar post:", e);
        }
    }

    confirmBtn.disabled = false;
    confirmBtn.textContent = "✅ Confirmar e Agendar Todos";

    document.getElementById("successMessage").textContent =
        postedCount > 0
            ? `${postedCount} post(s) agendado(s) com sucesso!\n\nComeçarão em ${startDate.toLocaleString("pt-BR")}`
            : "Nenhum post foi agendado. Verifique a conexão.";

    showStep("step-success");
    resetCreationState();
}

function resetCreationState() {
    selectedPhotos = [];
    currentReviewIndex = 0;
    document.getElementById("photoGrid").innerHTML = "";
    document.getElementById("selectionSummary").classList.add("hidden");
    document.getElementById("proceedToScheduleBtn").disabled = true;
}

document.getElementById("goToDashboardBtn").addEventListener("click", () => {
    showStep("step-select");
    switchToTab("dashboard");
});

document.getElementById("createAnotherBtn").addEventListener("click", () => {
    showStep("step-select");
});

// ============================================================
// DASHBOARD
// ============================================================

let currentFilter = "all";
let queueData = [];
let editingPostId = null;
let deletingPostId = null;

function setupDashboard() {
    document.getElementById("refreshQueueBtn").addEventListener("click", loadQueue);

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderQueue();
        });
    });
}

async function loadQueue() {
    const list = document.getElementById("queueList");
    list.innerHTML = `<p class="empty-state">Carregando fila...</p>`;

    try {
        const res = await apiFetch(`/queue`);
        const data = await res.json();
        queueData = (data.posts || []).sort((a, b) =>
            new Date(a.schedule_date) - new Date(b.schedule_date)
        );
        renderQueue();
    } catch (e) {
        list.innerHTML = `<p class="empty-state">Erro ao carregar fila. Verifique a conexão.</p>`;
    }
}

function renderQueue() {
    const list = document.getElementById("queueList");
    let filtered = queueData;

    if (currentFilter === "pending") {
        filtered = queueData.filter(p => p.status === "pending");
    } else if (currentFilter === "posted") {
        filtered = queueData.filter(p => p.status === "posted");
    }

    if (filtered.length === 0) {
        list.innerHTML = `<p class="empty-state">Nenhum post encontrado.</p>`;
        return;
    }

    list.innerHTML = "";

    filtered.forEach(post => {
        const div = document.createElement("div");
        div.className = "queue-item";

        const scheduleDate = post.schedule_date ? new Date(post.schedule_date) : null;
        const dateStr = scheduleDate ? scheduleDate.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

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

        list.appendChild(div);
    });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// MODAIS
// ============================================================

function setupModals() {
    document.getElementById("cancelEditBtn").addEventListener("click", () => {
        document.getElementById("editModal").classList.add("hidden");
    });

    document.getElementById("saveEditBtn").addEventListener("click", saveEdit);

    document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
        document.getElementById("deleteModal").classList.add("hidden");
    });

    document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);
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
        loadQueue();
    } catch (e) {
        alert("Erro ao salvar edição.");
    }
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
        loadQueue();
    } catch (e) {
        alert("Erro ao remover post.");
    }
}
