const SLIDE_ENDPOINT = "/api/slides";
const SLIDE_CHARTS_ENDPOINT = "/api/slide-charts";
const DECK_LIST_ENDPOINT = "/api/slide-decks";
const PRESENTER_ACTION_ENDPOINT = "/api/presenter-actions";
const PRESENTATION_RUN_ENDPOINT = "/api/presentation-runs";
const PRESENTATION_VERSION_ENDPOINT = "/api/presentation-versions";
const SLIDE_TARGET_MIN_SECONDS = 60;
const SLIDE_TARGET_MAX_SECONDS = 90;
const THEME_STORAGE_KEY = "mi_hmi_theme";
const HMI_CONFIG_STORAGE_KEY = "mi_hmi_config";
const CONTENT_DENSITY_STORAGE_KEY = "mi_hmi_content_density";
const HMI_LAYOUT_STORAGE_KEY = "mi_hmi_layout";
const DEFAULT_THEME = "nebula_rain";
const THEME_LABELS = {
    nebula_rain: "Nebula Rain",
    ops_cascade: "Ops Cascade",
    science_matrix: "Science Matrix",
    command_aurora: "Command Aurora",
    lcars_flux: "LCARS Flux",
    command_blue: "Command Blue",
    ops_amber: "Ops Amber",
    medical_teal: "Medical Teal",
    engineering_bronze: "Engineering Bronze",
    science_cyan: "Science Cyan",
    lcars: "LCARS",
    quality_irrigation: "Quality Irrigation",
    dark: "Dark",
    light: "Light",
    blues_green: "Blues/Green",
    futuristic: "Futuristic",
    soil_field: "Soil/Field",
    night_ops: "Night Ops",
    high_contrast: "High Contrast",
    retro: "Retro"
};
const REDUCED_MOTION_STORAGE_KEY = "mi_hmi_reduced_motion";
const INSIGHTS_STORAGE_KEY = "mi_hmi_insights";
const MEDIA_HIDDEN_STORAGE_KEY = "mi_hmi_media_hidden";
const CHART_HIDDEN_STORAGE_KEY = "mi_hmi_chart_hidden";
const GAMEPAD_STORAGE_KEY = "mi_hmi_gamepad";
const STYLE_WARNING_ID = "style-warning";
const STYLE_WARNING_MESSAGE = "Styles did not load. Hard refresh (Ctrl+F5) or open the WSL IP link.";
const BOOTSTRAP_WARNING_ID = "hmi-bootstrap-warning";
const BOOTSTRAP_LOADING_MESSAGE = "Loading HMI data...";
const HMI_VIEW_PARAM = "view";
const CONTENT_DENSITY_PARAM = "density";
const HMI_LAYOUT_PARAM = "layout";
const HMI_HELP_PARAM = "help";
const HMI_VIEW_FULLSCREEN = "fullscreen";
const HMI_VIEW_PRESENTER = "presenter";
const HMI_VIEW_CONTROL = "control";
const HMI_PROJECTOR_PAGE = "master_irrigator_projector_hmi.html";
const HMI_PRESENTER_PAGE = "master_irrigator_presentation_hmi.html";
const PRESENTATION_CHANNEL_NAME = "mi_presentation_channel";
const PRESENTATION_STORAGE_KEY = `${PRESENTATION_CHANNEL_NAME}_storage`;
const SAFE_MEDIA_PROTOCOLS = new Set(["http:", "https:"]);
const CSV_SAMPLE_DATA_URL = "/assets/sample_data.csv";
const CSV_QUICKSTATS_STATE_URL = "/assets/data/quickstats_irrigation_state_summary.csv";
const CSV_GHCN_DAILY_URL = "/assets/data/ghcn_daily_summary.csv";
const CSV_MODIS_NDVI_URL = "/assets/data/modis_ndvi_timeseries.csv";
const GAMEPAD_ACTION_COOLDOWN_MS = 280;
const CONTRAST_MIN_RATIO = 4.5;
let bootstrapHideTimer = null;
let fitSlidePreviewRetries = 0;
const FIT_SLIDE_PREVIEW_MAX_RETRIES = 3;

const hmiState = {
    slides: [],
    scopeSlides: [],
    currentIndex: 0,
    slideType: "title",
    slideScope: "deck",
    agendaItems: [],
    agendaDetailsEnabled: false,
    presentationStart: null,
    timerInterval: null,
    slideStart: null,
    deckData: null,
    deckId: null,
    deckTitle: "",
    deckFileName: "master_irrigator_slide_deck.json",
    deckCatalog: null,
    reducedMotion: false,
    contentDensity: "standard",
    layoutMode: "newspaper",
    insightsEnabled: true,
    mediaHidden: false,
    chartHidden: false,
    chartMetadata: [],
    gamepadEnabled: false,
    lastGamepadAction: 0,
    timerPaused: false,
    timerPausedAt: null,
    viewMode: HMI_VIEW_CONTROL,
    isReceiver: false,
    initialSlideIndex: null,
    pendingSlideIndex: null,
    presentationChannel: null,
    lastLiveCues: {},
    activeAgendaIndex: null,
    activeRailPanel: "next",
    lastLiveState: {
        elapsedSeconds: 0,
        slideSeconds: 0,
        clock: "--:--"
    }
};

function readStoredConfig() {
    try {
        const raw = localStorage.getItem(HMI_CONFIG_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
        return null;
    }
}

const ACT_LABELS = {
    act_1: "Act 1",
    act_2: "Act 2",
    act_3: "Act 3",
    wrap_up: "Wrap up"
};

function buildShortTitle(value) {
    const cleaned = String(value || "").replace(/\s+/g, " ").trim();
    if (!cleaned) {
        return "Untitled";
    }
    const maxChars = 24;
    const maxWords = 4;
    if (cleaned.length <= maxChars) {
        return cleaned;
    }
    const words = cleaned.split(" ");
    let chosen = [];
    for (const word of words) {
        if (chosen.length >= maxWords) {
            break;
        }
        const next = chosen.length ? `${chosen.join(" ")} ${word}` : word;
        if (next.length > maxChars) {
            break;
        }
        chosen.push(word);
    }
    const shortTitle = chosen.length ? chosen.join(" ") : cleaned.slice(0, maxChars);
    return shortTitle.length < cleaned.length ? `${shortTitle}…` : shortTitle;
}

const MARKDOWN_ALLOWED_TAGS = new Set([
    "A",
    "BLOCKQUOTE",
    "BR",
    "CODE",
    "EM",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HR",
    "IMG",
    "LI",
    "OL",
    "P",
    "PRE",
    "STRONG",
    "TABLE",
    "TBODY",
    "TD",
    "TH",
    "THEAD",
    "TR",
    "UL"
]);

function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element && value !== undefined && value !== null) {
        element.textContent = value;
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeUrl(raw, allowedProtocols) {
    if (!raw) {
        return "";
    }
    try {
        const parsed = new URL(raw, window.location.href);
        if (allowedProtocols.includes(parsed.protocol)) {
            return parsed.href;
        }
    } catch (error) {
        return "";
    }
    return "";
}

// Basic URL safety helper for media/embed sources.
function resolveSafeUrl(raw) {
    if (!raw) {
        return "";
    }
    const allowed = ["http:", "https:", "file:", "blob:"];
    try {
        const parsed = new URL(raw, window.location.href);
        return allowed.includes(parsed.protocol) ? parsed.href : "";
    } catch (error) {
        return "";
    }
}

function sanitizeMarkdownHtml(unsafeHtml) {
    if (!unsafeHtml) {
        return "";
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(unsafeHtml, "text/html");
    const elements = Array.from(doc.body.querySelectorAll("*"));
    elements.forEach((element) => {
        const tag = element.tagName;
        if (!MARKDOWN_ALLOWED_TAGS.has(tag)) {
            const text = document.createTextNode(element.textContent || "");
            element.replaceWith(text);
            return;
        }

        if (tag === "A") {
            const href = element.getAttribute("href") || "";
            const safeHref = normalizeUrl(href, ["http:", "https:", "mailto:", "tel:"]);
            Array.from(element.attributes).forEach((attr) => {
                if (!["href", "rel", "target"].includes(attr.name)) {
                    element.removeAttribute(attr.name);
                }
            });
            if (safeHref) {
                element.setAttribute("href", safeHref);
                element.setAttribute("rel", "noopener noreferrer");
                element.setAttribute("target", "_blank");
            } else {
                element.removeAttribute("href");
            }
            return;
        }

        if (tag === "IMG") {
            const src = element.getAttribute("src") || "";
            const safeSrc = normalizeUrl(src, ["http:", "https:", "file:", "blob:"]);
            const alt = element.getAttribute("alt") || "";
            Array.from(element.attributes).forEach((attr) => {
                if (!["src", "alt"].includes(attr.name)) {
                    element.removeAttribute(attr.name);
                }
            });
            if (safeSrc) {
                element.setAttribute("src", safeSrc);
                element.setAttribute("alt", alt);
            } else {
                element.remove();
            }
            return;
        }

        Array.from(element.attributes).forEach((attr) => {
            element.removeAttribute(attr.name);
        });
    });
    return doc.body.innerHTML;
}

function getMarkdownSource(slide) {
    if (!slide) {
        return "";
    }
    const fieldNames = ["markdown", "body_markdown", "body"];
    for (const field of fieldNames) {
        const value = slide[field];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    if (typeof slide.notes === "string" && slide.notes.trim()) {
        return slide.notes.trim();
    }
    if (typeof slide.callout === "string" && slide.callout.trim()) {
        return slide.callout.trim();
    }
    return "";
}

function renderMarkdown(container, markdown, fallback) {
    if (!container) {
        return;
    }
    let source = typeof markdown === "string" && markdown.trim() ? markdown.trim() : "";
    if (!source && typeof fallback === "string" && fallback.trim()) {
        source = fallback.trim();
    }
    if (!source) {
        container.textContent = fallback || "";
        return;
    }
    if (window.marked && typeof window.marked.parse === "function") {
        try {
            const parsed = window.marked.parse(source, {
                headerIds: false,
                mangle: false
            });
            const sanitized = sanitizeMarkdownHtml(parsed);
            if (sanitized) {
                container.innerHTML = sanitized;
            } else {
                container.textContent = source;
            }
            return;
        } catch (error) {
            console.warn("Markdown render failed:", error);
        }
    }
    container.textContent = source;
}

function formatActLabel(actValue) {
    if (!actValue) {
        return "";
    }
    if (ACT_LABELS[actValue]) {
        return ACT_LABELS[actValue];
    }
    return actValue.replace(/_/g, " ");
}

function updateActMarker(slide) {
    const actValue = slide && slide.act ? slide.act : "";
    const label = formatActLabel(actValue);
    const actElement = document.querySelector("[data-slide-act]");
    const actStatus = document.querySelector("[data-slide-act-status]");

    if (label) {
        if (actElement) {
            actElement.textContent = label;
            setHidden(actElement, false);
        }
    } else {
        if (actElement) {
            setHidden(actElement, true);
        }
    }

    if (actStatus) {
        actStatus.textContent = label || "Not set";
    }

    if (document.body) {
        document.body.dataset.slideActValue = actValue;
    }
}

function applyTheme(theme) {
    if (!theme || !document.body) {
        return;
    }
    if (!THEME_LABELS[theme]) {
        theme = DEFAULT_THEME;
    }
    document.body.dataset.theme = theme;
    const label = document.querySelector("[data-theme-label]");
    if (label) {
        label.textContent = THEME_LABELS[theme] || theme.toUpperCase();
    }
    const select = document.getElementById("theme-select");
    if (select && select.value !== theme) {
        select.value = theme;
    }
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        return;
    }
    window.requestAnimationFrame(applyThemeContrast);
}

function buildThemeSelectOptions(select) {
    if (!select) {
        return;
    }
    clearElement(select);
    Object.entries(THEME_LABELS).forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    });
}

function setupThemeMenuSelect() {
    const select = document.getElementById("theme-select");
    if (!select) {
        return;
    }
    buildThemeSelectOptions(select);
    const current = document.body ? document.body.dataset.theme : null;
    if (current && select.value !== current) {
        select.value = current;
    }
    select.addEventListener("change", (event) => {
        applyTheme(event.target.value);
    });
}

function parseCssColor(value) {
    if (!value) {
        return null;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized.startsWith("#")) {
        const hex = normalized.slice(1);
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            return { r, g, b };
        }
        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return { r, g, b };
        }
        return null;
    }
    const rgbMatch = normalized.match(/rgba?\\(([^)]+)\\)/);
    if (!rgbMatch) {
        return null;
    }
    const parts = rgbMatch[1].split(",").map((part) => Number.parseFloat(part.trim()));
    if (parts.length < 3 || parts.some((value) => !Number.isFinite(value))) {
        return null;
    }
    return { r: parts[0], g: parts[1], b: parts[2] };
}

function srgbToLinear(channel) {
    const value = channel / 255;
    if (value <= 0.03928) {
        return value / 12.92;
    }
    return Math.pow((value + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(color) {
    const r = srgbToLinear(color.r);
    const g = srgbToLinear(color.g);
    const b = srgbToLinear(color.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(colorA, colorB) {
    const lumA = getRelativeLuminance(colorA);
    const lumB = getRelativeLuminance(colorB);
    const light = Math.max(lumA, lumB);
    const dark = Math.min(lumA, lumB);
    return (light + 0.05) / (dark + 0.05);
}

function applyThemeContrast() {
    if (!document.body) {
        return;
    }
    const style = window.getComputedStyle(document.body);
    const bgRaw = style.getPropertyValue("--qi-bg").trim();
    const textRaw = style.getPropertyValue("--qi-text").trim();
    const bgColor = parseCssColor(bgRaw);
    const textColor = parseCssColor(textRaw);
    if (!bgColor || !textColor) {
        return;
    }
    const ratio = getContrastRatio(bgColor, textColor);
    const isDarkBg = getRelativeLuminance(bgColor) < 0.45;
    const shouldForce = ratio < CONTRAST_MIN_RATIO;
    document.body.dataset.themeContrast = shouldForce ? "forced" : "ok";
    if (shouldForce) {
        document.body.style.setProperty("--qi-text", isDarkBg ? "#F8FAFC" : "#0B1B2D");
        document.body.style.setProperty("--qi-text-soft", isDarkBg ? "#CBD5E1" : "#42566A");
    } else {
        document.body.style.removeProperty("--qi-text");
        document.body.style.removeProperty("--qi-text-soft");
    }
}

function getInitialTheme() {
    const config = readStoredConfig();
    if (config && config.theme) {
        return config.theme;
    }
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
            return stored;
        }
    } catch (error) {
        return DEFAULT_THEME;
    }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : DEFAULT_THEME;
}

function applyReducedMotion(enabled) {
    if (!document.body) {
        return;
    }
    document.body.dataset.reducedMotion = enabled ? "true" : "false";
    hmiState.reducedMotion = Boolean(enabled);
    try {
        localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, enabled ? "true" : "false");
    } catch (error) {
        return;
    }
}

function applyInsightsVisibility(enabled, persist = true, broadcast = false) {
    const nextValue = Boolean(enabled);
    hmiState.insightsEnabled = nextValue;
    if (document.body) {
        document.body.dataset.hmiInsights = nextValue ? "on" : "off";
    }
    const presenterNodes = document.querySelectorAll("[data-presenter-insights]");
    presenterNodes.forEach((node) => {
        node.hidden = !nextValue;
    });
    const projectorNodes = document.querySelectorAll("[data-projector-insights]");
    projectorNodes.forEach((node) => {
        node.hidden = !nextValue;
    });
    updateInsightsToggle();
    if (persist) {
        try {
            localStorage.setItem(INSIGHTS_STORAGE_KEY, nextValue ? "on" : "off");
        } catch (error) {
            return;
        }
    }
    if (broadcast && !hmiState.isReceiver) {
        broadcastSlideState();
    }
    if (nextValue) {
        void setupPresenterInsights();
    }
}

function applyMediaVisibility(hidden, persist = true) {
    const nextValue = Boolean(hidden);
    hmiState.mediaHidden = nextValue;
    if (document.body) {
        if (nextValue) {
            document.body.dataset.hmiMediaHidden = "true";
        } else {
            delete document.body.dataset.hmiMediaHidden;
        }
    }
    updateMediaToggle();
    if (persist) {
        try {
            localStorage.setItem(MEDIA_HIDDEN_STORAGE_KEY, nextValue ? "true" : "false");
        } catch (error) {
            return;
        }
    }
}

function updateMediaToggle() {
    const toggles = document.querySelectorAll("[data-media-toggle]");
    const label = hmiState.mediaHidden ? "Media: Off" : "Media: On";
    toggles.forEach((toggle) => {
        toggle.textContent = label;
        toggle.setAttribute("aria-pressed", hmiState.mediaHidden ? "true" : "false");
    });
}

function applyChartVisibility(hidden, persist = true) {
    const nextValue = Boolean(hidden);
    hmiState.chartHidden = nextValue;
    if (document.body) {
        if (nextValue) {
            document.body.dataset.hmiChartHidden = "true";
        } else {
            delete document.body.dataset.hmiChartHidden;
        }
    }
    updateChartToggle();
    const currentSlide = hmiState.slides && Number.isFinite(hmiState.currentIndex)
        ? hmiState.slides[hmiState.currentIndex]
        : null;
    if (currentSlide) {
        updateSlideContent(currentSlide);
    }
    if (persist) {
        try {
            localStorage.setItem(CHART_HIDDEN_STORAGE_KEY, nextValue ? "true" : "false");
        } catch (error) {
            return;
        }
    }
}

function updateChartToggle() {
    const toggles = document.querySelectorAll("[data-chart-toggle]");
    const label = hmiState.chartHidden ? "Charts: Off" : "Charts: On";
    toggles.forEach((toggle) => {
        toggle.textContent = label;
        toggle.setAttribute("aria-pressed", hmiState.chartHidden ? "true" : "false");
    });
}

function getInitialInsightsEnabled() {
    if (isProjectorView()) {
        return false;
    }
    const config = readStoredConfig();
    if (config && typeof config.insights_enabled === "boolean") {
        return config.insights_enabled;
    }
    try {
        const stored = localStorage.getItem(INSIGHTS_STORAGE_KEY);
        if (stored === "off") {
            return false;
        }
        if (stored === "on") {
            return true;
        }
    } catch (error) {
        return true;
    }
    return true;
}

function getInitialMediaHidden() {
    const config = readStoredConfig();
    if (config && typeof config.media_hidden === "boolean") {
        return config.media_hidden;
    }
    try {
        const stored = localStorage.getItem(MEDIA_HIDDEN_STORAGE_KEY);
        if (stored === "true") {
            return true;
        }
        if (stored === "false") {
            return false;
        }
    } catch (error) {
        return false;
    }
    return false;
}

function getInitialChartHidden() {
    const config = readStoredConfig();
    if (config && typeof config.chart_hidden === "boolean") {
        return config.chart_hidden;
    }
    try {
        const stored = localStorage.getItem(CHART_HIDDEN_STORAGE_KEY);
        if (stored === "true") {
            return true;
        }
        if (stored === "false") {
            return false;
        }
    } catch (error) {
        return false;
    }
    return false;
}

function getInitialGamepadEnabled() {
    const config = readStoredConfig();
    if (config && typeof config.gamepad_enabled === "boolean") {
        return config.gamepad_enabled;
    }
    try {
        const stored = localStorage.getItem(GAMEPAD_STORAGE_KEY);
        return stored === "on";
    } catch (error) {
        return false;
    }
}

function applyGamepadEnabled(enabled, persist = true) {
    const nextValue = Boolean(enabled);
    hmiState.gamepadEnabled = nextValue;
    if (document.body) {
        if (nextValue) {
            document.body.dataset.hmiGamepad = "on";
        } else {
            delete document.body.dataset.hmiGamepad;
        }
    }
    updateGamepadToggle();
    if (persist) {
        try {
            localStorage.setItem(GAMEPAD_STORAGE_KEY, nextValue ? "on" : "off");
        } catch (error) {
            return;
        }
    }
}

function normalizeContentDensity(value) {
    if (!value || typeof value !== "string") {
        return null;
    }
    const normalized = value.trim().toLowerCase();
    if (["compact", "standard", "relaxed", "auto"].includes(normalized)) {
        return normalized;
    }
    return null;
}

function normalizeLayout(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["console", "newspaper", "projector", "landscape", "portrait"].includes(normalized)) {
        return normalized;
    }
    return null;
}

function getLayoutOrientation(layout) {
    if (layout === "landscape" || layout === "portrait") {
        return layout;
    }
    return null;
}

function getAutoContentDensity() {
    const width = window.innerWidth || 0;
    const height = window.innerHeight || 0;
    if ((width && width <= 1100) || (height && height <= 800)) {
        return "compact";
    }
    return "standard";
}

function resolveContentDensity(value) {
    const normalized = normalizeContentDensity(value) || "standard";
    if (normalized === "auto") {
        return getAutoContentDensity();
    }
    return normalized;
}

function applyLayoutMode(value, persist = true) {
    if (!document.body) {
        return;
    }
    const normalized = normalizeLayout(value) || normalizeLayout(document.body.dataset.hmiLayout) || "console";
    document.body.dataset.hmiLayout = normalized;
    hmiState.layoutMode = normalized;
    const orientation = getLayoutOrientation(normalized);
    if (orientation) {
        document.body.dataset.hmiOrientation = orientation;
    } else if (document.body.dataset.hmiOrientation) {
        delete document.body.dataset.hmiOrientation;
    }
    if (!persist) {
        return;
    }
    try {
        localStorage.setItem(HMI_LAYOUT_STORAGE_KEY, normalized);
    } catch (error) {
        return;
    }
}

function applyContentDensity(value, persist = true) {
    if (!document.body) {
        return;
    }
    const normalized = normalizeContentDensity(value) || "standard";
    const resolved = resolveContentDensity(normalized);
    document.body.dataset.contentDensity = resolved;
    hmiState.contentDensity = normalized;
    if (!persist) {
        return;
    }
    try {
        localStorage.setItem(CONTENT_DENSITY_STORAGE_KEY, normalized);
    } catch (error) {
        return;
    }
}

function getInitialLayout() {
    const params = getSearchParams();
    const config = readStoredConfig();
    const paramValue = params.get(HMI_LAYOUT_PARAM);
    const configValue = config && config.layout ? config.layout : null;
    let storedValue = null;
    try {
        storedValue = localStorage.getItem(HMI_LAYOUT_STORAGE_KEY);
    } catch (error) {
        storedValue = null;
    }
    const bodyValue = document.body && document.body.dataset ? document.body.dataset.hmiLayout : null;
    return normalizeLayout(paramValue)
        || normalizeLayout(configValue)
        || normalizeLayout(storedValue)
        || normalizeLayout(bodyValue)
        || "console";
}

function getInitialReducedMotion() {
    const config = readStoredConfig();
    if (config && typeof config.reduced_motion === "boolean") {
        return config.reduced_motion;
    }
    try {
        const stored = localStorage.getItem(REDUCED_MOTION_STORAGE_KEY);
        if (stored === "true") {
            return true;
        }
        if (stored === "false") {
            return false;
        }
    } catch (error) {
        return false;
    }
    return Boolean(
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

function getSearchParams() {
    try {
        return new URLSearchParams(window.location.search);
    } catch (error) {
        return new URLSearchParams();
    }
}

function shouldOpenHelpFromUrl() {
    const params = getSearchParams();
    const value = params.get(HMI_HELP_PARAM);
    if (!value) {
        return false;
    }
    const normalized = value.toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
}

function getInitialContentDensity() {
    const params = getSearchParams();
    const config = readStoredConfig();
    const paramValue = params.get(CONTENT_DENSITY_PARAM);
    const configValue = config && config.content_density ? config.content_density : null;
    let storedValue = null;
    try {
        storedValue = localStorage.getItem(CONTENT_DENSITY_STORAGE_KEY);
    } catch (error) {
        storedValue = null;
    }
    return normalizeContentDensity(paramValue)
        || normalizeContentDensity(configValue)
        || normalizeContentDensity(storedValue)
        || "standard";
}

function getConsoleScaleOverride() {
    const config = readStoredConfig();
    if (!config || config.console_scale === null || typeof config.console_scale === "undefined") {
        return null;
    }
    const value = typeof config.console_scale === "number"
        ? config.console_scale
        : Number.parseFloat(config.console_scale);
    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }
    return value;
}

function applyViewModeFromUrl() {
    const params = getSearchParams();
    const config = readStoredConfig();
    const viewParam = params.get(HMI_VIEW_PARAM) || (config && config.view);
    let viewMode = HMI_VIEW_CONTROL;
    const bodyView = document.body && document.body.dataset ? document.body.dataset.hmiView : "";
    if (bodyView === HMI_VIEW_FULLSCREEN || bodyView === HMI_VIEW_PRESENTER || bodyView === HMI_VIEW_CONTROL) {
        viewMode = bodyView;
    } else if (viewParam === HMI_VIEW_FULLSCREEN) {
        viewMode = HMI_VIEW_FULLSCREEN;
    } else if (viewParam === HMI_VIEW_PRESENTER) {
        viewMode = HMI_VIEW_PRESENTER;
    }
    hmiState.viewMode = viewMode;
    hmiState.isReceiver = viewMode === HMI_VIEW_FULLSCREEN || viewMode === HMI_VIEW_PRESENTER;
    if (document.body) {
        document.body.dataset.hmiView = viewMode;
    }
    if (viewMode === HMI_VIEW_CONTROL) {
        hmiState.activeRailPanel = "tools";
    } else {
        hmiState.activeRailPanel = "next";
    }

    const deckParam = params.get("deck") || (config && config.deck);
    if (deckParam) {
        hmiState.deckId = deckParam;
    }

    const slideParam = params.get("slide");
    const slideConfigValue = config && config.slide ? config.slide : null;
    const resolvedSlideValue = slideParam || slideConfigValue;
    if (resolvedSlideValue) {
        const slideIndex = Number.parseInt(resolvedSlideValue, 10);
        if (!Number.isNaN(slideIndex) && slideIndex > 0) {
            hmiState.initialSlideIndex = slideIndex - 1;
        }
    }
}

function resolveRequestedSlideIndex(total) {
    if (!Number.isFinite(total) || total <= 0) {
        return null;
    }
    const candidate = Number.isInteger(hmiState.pendingSlideIndex)
        ? hmiState.pendingSlideIndex
        : hmiState.initialSlideIndex;
    if (!Number.isInteger(candidate)) {
        return null;
    }
    const clamped = Math.max(0, Math.min(candidate, total - 1));
    hmiState.pendingSlideIndex = null;
    hmiState.initialSlideIndex = null;
    return clamped;
}

function getFullscreenTargetElement() {
    return document.querySelector(".stage");
}

async function toggleFullscreen(targetElement) {
    const target = targetElement || getFullscreenTargetElement();
    if (!target) {
        return;
    }
    if (!document.fullscreenEnabled) {
        setBootstrapWarning("Fullscreen blocked. Continue in normal view.");
        return;
    }
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await target.requestFullscreen();
        }
    } catch (error) {
        setBootstrapWarning("Fullscreen blocked. Continue in normal view.");
    }
}

function buildFullscreenUrl() {
    const url = new URL(HMI_PROJECTOR_PAGE, window.location.href);
    url.searchParams.set(HMI_VIEW_PARAM, HMI_VIEW_FULLSCREEN);
    if (hmiState.layoutMode) {
        url.searchParams.set(HMI_LAYOUT_PARAM, hmiState.layoutMode);
    }
    if (hmiState.deckId) {
        url.searchParams.set("deck", hmiState.deckId);
    }
    if (Number.isInteger(hmiState.currentIndex)) {
        url.searchParams.set("slide", (hmiState.currentIndex + 1).toString());
    }
    return url.toString();
}

function openFullscreenWindow() {
    if (hmiState.viewMode === HMI_VIEW_FULLSCREEN) {
        setBootstrapWarning("Already in fullscreen view.");
        return;
    }
    const url = buildFullscreenUrl();
    const screenWidth = window.screen && window.screen.availWidth ? window.screen.availWidth : 1280;
    const screenHeight = window.screen && window.screen.availHeight ? window.screen.availHeight : 720;
    const baseLeft = window.screen && Number.isFinite(window.screen.availLeft) ? window.screen.availLeft : 0;
    const baseTop = window.screen && Number.isFinite(window.screen.availTop) ? window.screen.availTop : 0;
    const isExtended = window.screen && window.screen.isExtended === true;
    const left = isExtended ? baseLeft + screenWidth + 40 : baseLeft + 40;
    const top = baseTop + 40;
    const features = [
        "noopener=yes",
        "popup=yes",
        `width=${Math.min(screenWidth, 1600)}`,
        `height=${Math.min(screenHeight, 900)}`,
        `left=${left}`,
        `top=${top}`
    ].join(",");

    const newWindow = window.open(url, "mi_fullscreen_view", features);
    if (!newWindow) {
        setBootstrapWarning("Popup blocked. Allow popups to open the fullscreen view.");
        return;
    }
    newWindow.focus();
}

function buildPresenterUrl() {
    const url = new URL(HMI_PRESENTER_PAGE, window.location.href);
    url.searchParams.set(HMI_VIEW_PARAM, HMI_VIEW_CONTROL);
    if (hmiState.layoutMode) {
        url.searchParams.set(HMI_LAYOUT_PARAM, hmiState.layoutMode);
    }
    if (hmiState.deckId) {
        url.searchParams.set("deck", hmiState.deckId);
    }
    if (Number.isInteger(hmiState.currentIndex)) {
        url.searchParams.set("slide", (hmiState.currentIndex + 1).toString());
    }
    return url.toString();
}

function openPresenterWindow() {
    if (hmiState.viewMode === HMI_VIEW_PRESENTER) {
        setBootstrapWarning("Presenter view already open.");
        return;
    }
    const url = buildPresenterUrl();
    const newWindow = window.open(url, "mi_presenter_view", "noopener=yes,popup=yes,resizable=yes,scrollbars=yes");
    if (!newWindow) {
        setBootstrapWarning("Popup blocked. Allow popups to open the presenter view.");
        return;
    }
    newWindow.focus();
}

function updateFullscreenControls() {
    const fullscreenButtons = Array.from(document.querySelectorAll("[data-action=\"fullscreen\"]"));
    const isFullscreen = Boolean(document.fullscreenElement);

    if (fullscreenButtons.length) {
        fullscreenButtons.forEach((button) => {
            button.textContent = isFullscreen ? "Exit fullscreen" : "Enter fullscreen";
        });
    }
}

function setupFullscreenControls() {
    const fullscreenButtons = Array.from(document.querySelectorAll("[data-action=\"fullscreen\"]"));
    const fullscreenOpenButtons = Array.from(document.querySelectorAll("[data-action=\"fullscreen-open\"]"));
    fullscreenButtons.forEach((button) => {
        button.addEventListener("click", () => {
            void toggleFullscreen(getFullscreenTargetElement());
        });
    });
    fullscreenOpenButtons.forEach((button) => {
        button.addEventListener("click", () => {
            openFullscreenWindow();
        });
    });
    document.addEventListener("fullscreenchange", updateFullscreenControls);
    updateFullscreenControls();
}

function setupPresenterControls() {
    const presenterButtons = Array.from(document.querySelectorAll("[data-action=\"presenter-view\"]"));
    if (!presenterButtons.length) {
        return;
    }
    presenterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            openPresenterWindow();
        });
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
        if (!event || event.defaultPrevented) {
            return;
        }
        const target = event.target;
        const tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
        if (tagName === "input" || tagName === "textarea" || tagName === "button" || target.isContentEditable) {
            return;
        }
        const key = event.key ? event.key.toLowerCase() : "";
        if (key === "s") {
            event.preventDefault();
            openPresenterWindow();
            return;
        }
        if (key === "f") {
            event.preventDefault();
            openFullscreenWindow();
            return;
        }
    });
}

function setupGamepadControls() {
    if (!navigator || typeof navigator.getGamepads !== "function") {
        return;
    }
    const poll = () => {
        if (!hmiState.gamepadEnabled) {
            requestAnimationFrame(poll);
            return;
        }
        const pads = navigator.getGamepads();
        const pad = pads && pads.length ? pads[0] : null;
        if (pad) {
            const now = Date.now();
            if (now - hmiState.lastGamepadAction > GAMEPAD_ACTION_COOLDOWN_MS) {
                const left = pad.buttons[14] && pad.buttons[14].pressed;
                const right = pad.buttons[15] && pad.buttons[15].pressed;
                const primary = pad.buttons[0] && pad.buttons[0].pressed;
                const secondary = pad.buttons[1] && pad.buttons[1].pressed;
                const axis = Array.isArray(pad.axes) ? pad.axes[0] : 0;
                if (left || axis < -0.6 || secondary) {
                    hmiState.lastGamepadAction = now;
                    goToSlide(-1);
                } else if (right || axis > 0.6 || primary) {
                    hmiState.lastGamepadAction = now;
                    goToSlide(1);
                }
            }
        }
        requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
}

function buildSlidePayload() {
    const slide = hmiState.scopeSlides[hmiState.currentIndex];
    const nextSlide = hmiState.scopeSlides[hmiState.currentIndex + 1];
    const payload = {
        type: "slide_state",
        deckId: hmiState.deckId,
        slideIndex: hmiState.currentIndex,
        slideType: hmiState.slideType,
        slideScope: hmiState.slideScope,
        slideTitle: slide && slide.title ? slide.title : "",
        slideSubtitle: slide && slide.subtitle ? slide.subtitle : "",
        slideMarkdown: getMarkdownSource(slide),
        liveCues: hmiState.lastLiveCues || {},
        nextSlideTitle: nextSlide && nextSlide.title ? nextSlide.title : "",
        nextSlideSubtitle: nextSlide && nextSlide.subtitle ? nextSlide.subtitle : ""
    };
    return payload;
}

function broadcastSlideState() {
    if (!hmiState.presentationChannel || hmiState.isReceiver || !hmiState.scopeSlides.length) {
        return;
    }
    const payload = buildSlidePayload();

    if (!hmiState.deckId && hmiState.deckData) {
        payload.deckData = hmiState.deckData;
    }

    hmiState.presentationChannel.postMessage(payload);
}

function broadcastLiveState(state) {
    if (!hmiState.presentationChannel || hmiState.isReceiver) {
        return;
    }
    const payload = Object.assign({ type: "live_state" }, state);
    hmiState.presentationChannel.postMessage(payload);
}

function shouldRenderPresenterPanel() {
    return hmiState.viewMode === HMI_VIEW_PRESENTER || isNewspaperLayout();
}

function renderPresenterPanel(payload) {
    if (!shouldRenderPresenterPanel()) {
        return;
    }
    if (!payload) {
        return;
    }
    const titleEl = document.querySelector("[data-presenter-title]");
    const notesEl = document.querySelector("[data-presenter-notes]");
    const nextEl = document.querySelector("[data-presenter-next]");
    const paceEl = document.querySelector("[data-presenter-pace]");
    const audienceEl = document.querySelector("[data-presenter-audience]");

    if (titleEl) {
        titleEl.textContent = payload.slideTitle || "Untitled slide";
    }
    if (notesEl) {
        renderMarkdown(notesEl, payload.slideMarkdown, "Notes are not available.");
    }
    if (nextEl) {
        const nextLabel = payload.nextSlideTitle || "Next slide not available";
        const nextSubtitle = payload.nextSlideSubtitle ? ` — ${payload.nextSlideSubtitle}` : "";
        nextEl.textContent = `${nextLabel}${nextSubtitle}`;
    }
    const liveCues = payload.liveCues || {};
    if (paceEl) {
        const paceText = liveCues.pace ? `Pace: ${liveCues.pace}` : "Pace: not set";
        paceEl.textContent = paceText;
    }
    if (audienceEl) {
        const audienceText = liveCues.audience ? `Audience: ${liveCues.audience}` : "Audience: not set";
        audienceEl.textContent = audienceText;
    }
}

function renderPresenterLiveState(state) {
    if (!shouldRenderPresenterPanel()) {
        return;
    }
    if (!state) {
        return;
    }
    const elapsedEl = document.querySelector("[data-presenter-elapsed]");
    const clockEl = document.querySelector("[data-presenter-clock]");

    if (elapsedEl && Number.isFinite(state.elapsedSeconds)) {
        elapsedEl.textContent = `Elapsed: ${formatElapsed(state.elapsedSeconds)}`;
    }
    if (clockEl && typeof state.clock === "string") {
        clockEl.textContent = `Clock: ${state.clock}`;
    }
    const paceEl = document.querySelector("[data-presenter-pace]");
    if (paceEl && state.liveCues) {
        const slideSeconds = Number.isFinite(state.slideSeconds) ? state.slideSeconds : 0;
        const paceState = determinePaceState(state.liveCues, slideSeconds);
        paceEl.textContent = paceState.label;
        paceEl.dataset.paceState = paceState.state;
    }
}

function determinePaceState(liveCues, slideSeconds) {
    const targetMinutes = Number(liveCues.time_target_minutes);
    const targetSeconds = Number(liveCues.time_target_seconds);
    let goalSeconds = Number.isFinite(targetSeconds) && targetSeconds > 0 ? targetSeconds : null;
    if (!goalSeconds && Number.isFinite(targetMinutes) && targetMinutes > 0) {
        goalSeconds = targetMinutes * 60;
    }
    if (!goalSeconds) {
        return { state: "neutral", label: "Pace: not set" };
    }
    const ratio = slideSeconds / goalSeconds;
    if (ratio <= 0.9) {
        return { state: "ahead", label: "Pace: ahead" };
    }
    if (ratio <= 1.1) {
        return { state: "on-track", label: "Pace: on track" };
    }
    return { state: "behind", label: "Pace: slow down" };
}

function handlePresentationMessage(message) {
    if (!message || !hmiState.isReceiver) {
        return;
    }
    if (message.type === "live_state") {
        renderPresenterLiveState(message);
        return;
    }
    if (message.type !== "slide_state") {
        return;
    }
    if (message.slideType) {
        hmiState.slideType = message.slideType;
    }
    if (message.slideScope) {
        hmiState.slideScope = message.slideScope;
    }

    if (message.deckId && message.deckId !== hmiState.deckId) {
        hmiState.deckId = message.deckId;
        hmiState.pendingSlideIndex = Number.isInteger(message.slideIndex) ? message.slideIndex : null;
        void reloadCurrentDeck();
        return;
    }

    if (message.deckData) {
        hmiState.deckId = null;
        hmiState.pendingSlideIndex = Number.isInteger(message.slideIndex) ? message.slideIndex : null;
        applySlideData(message.deckData, "Synced from controller.");
        return;
    }

    if (Number.isInteger(message.slideIndex)) {
        hmiState.pendingSlideIndex = message.slideIndex;
        if (hmiState.scopeSlides.length) {
            const targetIndex = resolveRequestedSlideIndex(hmiState.scopeSlides.length);
            if (targetIndex !== null) {
                hmiState.currentIndex = targetIndex;
                renderSlide();
            }
        }
    }

    renderPresenterPanel(message);
}

function postStorageMessage(payload) {
    try {
        localStorage.setItem(
            PRESENTATION_STORAGE_KEY,
            JSON.stringify(Object.assign({ _ts: Date.now() }, payload))
        );
    } catch (error) {
        return;
    }
}

function setupStorageChannel() {
    hmiState.presentationChannel = { postMessage: postStorageMessage };

    window.addEventListener("storage", (event) => {
        if (!event || event.key !== PRESENTATION_STORAGE_KEY || !event.newValue) {
            return;
        }
        let data = null;
        try {
            data = JSON.parse(event.newValue);
        } catch (error) {
            return;
        }
        if (data && data.type === "request_state") {
            broadcastSlideState();
            return;
        }
        handlePresentationMessage(data);
    });

    if (hmiState.isReceiver) {
        postStorageMessage({ type: "request_state" });
    }
}

function setupPresentationChannel() {
    if (!("BroadcastChannel" in window)) {
        setupStorageChannel();
        return;
    }
    const channel = new BroadcastChannel(PRESENTATION_CHANNEL_NAME);
    hmiState.presentationChannel = channel;

    channel.addEventListener("message", (event) => {
        const data = event && event.data ? event.data : null;
        if (!data) {
            return;
        }
        if (data.type === "request_state") {
            broadcastSlideState();
            return;
        }
        handlePresentationMessage(data);
    });

    if (hmiState.isReceiver) {
        channel.postMessage({ type: "request_state" });
    }
}

function updateReducedMotionToggle() {
    const toggles = document.querySelectorAll("[data-motion-toggle]");
    if (!toggles.length) {
        return;
    }
    const label = hmiState.reducedMotion ? "Reduce motion: On" : "Reduce motion: Off";
    toggles.forEach((toggle) => {
        toggle.textContent = label;
        toggle.dataset.motionState = hmiState.reducedMotion ? "on" : "off";
    });
}

function setHidden(element, hidden) {
    if (!element) {
        return;
    }
    element.hidden = hidden;
}

function setBootstrapWarning(message) {
    const warning = document.getElementById(BOOTSTRAP_WARNING_ID);
    if (!warning) {
        return;
    }
    if (bootstrapHideTimer) {
        window.clearTimeout(bootstrapHideTimer);
        bootstrapHideTimer = null;
    }
    warning.textContent = message;
    warning.style.display = "block";
}

function clearBootstrapWarning() {
    const warning = document.getElementById(BOOTSTRAP_WARNING_ID);
    if (!warning) {
        return;
    }
    warning.style.display = "none";
}

function scheduleBootstrapWarningHide() {
    if (bootstrapHideTimer) {
        window.clearTimeout(bootstrapHideTimer);
    }
    bootstrapHideTimer = window.setTimeout(() => {
        clearBootstrapWarning();
        bootstrapHideTimer = null;
    }, 4000);
}

function ensureStyleWarning() {
    let warning = document.getElementById(STYLE_WARNING_ID);
    if (warning) {
        return warning;
    }
    warning = document.createElement("div");
    warning.id = STYLE_WARNING_ID;
    warning.className = "style-warning";
    warning.textContent = STYLE_WARNING_MESSAGE;
    warning.style.display = "none";
    document.body.prepend(warning);
    return warning;
}

function checkStyleHealth() {
    const grid = document.querySelector(".main-grid");
    const warning = ensureStyleWarning();
    const isProjector = document.body && document.body.dataset.hmiRole === "projector";
    if (isProjector) {
        if (!grid) {
            warning.classList.add("is-visible");
            warning.style.display = "block";
            setBootstrapWarning(STYLE_WARNING_MESSAGE);
            return;
        }
        const gridDisplay = window.getComputedStyle(grid).display;
        const ok = gridDisplay === "grid";
        warning.classList.toggle("is-visible", !ok);
        warning.style.display = ok ? "none" : "block";
        if (!ok) {
            setBootstrapWarning(STYLE_WARNING_MESSAGE);
        } else {
            scheduleBootstrapWarningHide();
        }
        return;
    }
    const header = document.querySelector(".header");
    if (!header || !grid) {
        warning.classList.add("is-visible");
        warning.style.display = "block";
        setBootstrapWarning(STYLE_WARNING_MESSAGE);
        return;
    }
    const headerDisplay = window.getComputedStyle(header).display;
    const gridDisplay = window.getComputedStyle(grid).display;
    const ok = (headerDisplay === "flex" || headerDisplay === "grid") && gridDisplay === "grid";
    warning.classList.toggle("is-visible", !ok);
    warning.style.display = ok ? "none" : "block";
    if (!ok) {
        setBootstrapWarning(STYLE_WARNING_MESSAGE);
    } else {
        scheduleBootstrapWarningHide();
    }
}

function formatElapsed(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
}

function formatTargetMinutes(minutes) {
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return "";
    }
    if (Number.isInteger(minutes)) {
        return `${minutes} min`;
    }
    return `${minutes.toFixed(1)} min`;
}

function getLiveTargetLabel(liveCues) {
    const targetMinutes = Number(liveCues.time_target_minutes);
    if (Number.isFinite(targetMinutes) && targetMinutes > 0) {
        return `Target: ${formatTargetMinutes(targetMinutes)}`;
    }
    const targetSeconds = Number(liveCues.time_target_seconds);
    if (Number.isFinite(targetSeconds) && targetSeconds > 0) {
        return `Target: ${Math.round(targetSeconds)}s`;
    }
    return `Target: ${SLIDE_TARGET_MIN_SECONDS}-${SLIDE_TARGET_MAX_SECONDS}s`;
}

function setLiveTargetLabel(liveCues) {
    const targetElement = document.querySelector("[data-live-target]");
    if (targetElement) {
        targetElement.textContent = getLiveTargetLabel(liveCues || {});
    }
}

function clearSlideView(message) {
    hmiState.slides = [];
    hmiState.scopeSlides = [];
    hmiState.agendaItems = [];
    hmiState.currentIndex = 0;
    hmiState.activeAgendaIndex = null;

    renderSlideList([]);
    renderSlideCarousel([], 0);
    renderAgenda([], null);
    renderAgendaChips([], null);
    setAgendaMessage("");
    closeAgendaPopover();
    renderSpeakerNotes([]);
    updateLiveCues({});
    updateSlideFocus(null);
    setText("[data-slide-count]", "0");
    setText("[data-slide-index]", "0");
    setText("[data-next-slide]", "No slides loaded.");
    setText("[data-slide-title]", "No deck loaded");
    setText("[data-slide-subtitle]", "");
    const bodyElement = document.querySelector("[data-slide-body]");
    renderMarkdown(bodyElement, message, "No slide deck loaded.");
    setText("[data-qa-prompt]", "");
    setText("[data-photo-caption]", "");

    const bulletList = document.querySelector("[data-slide-bullets]");
    renderList(bulletList, []);

    const mediaContainer = document.querySelector("[data-slide-media]");
    renderMedia(mediaContainer, null);

    const chartContainer = document.querySelector("[data-slide-chart]");
    renderChart(chartContainer, null);
    updateActMarker(null);
}

function resetDeckState(message) {
    hmiState.deckData = null;
    hmiState.deckId = null;
    hmiState.deckTitle = "";
    hmiState.deckFileName = "master_irrigator_slide_deck.json";
    setText("[data-deck-title]", "Deck: not loaded");
    updateDeckDetails(null);
    updateDeckFocus(null);
    updateDeckSelectStatus("No deck selected.");
    updateDeckStatus(message || "Deck closed.");
    clearSlideView(message || "No slide deck loaded.");
}

function setPanelHidden(panelId, layoutClass, hidden) {
    const panel = document.getElementById(panelId);
    const grid = document.querySelector(".main-grid");
    if (!panel || !grid) {
        return;
    }
    panel.classList.toggle("is-hidden", hidden);
    grid.classList.toggle(layoutClass, hidden);
}

function isNewspaperLayout() {
    return document.body.dataset.hmiLayout === "newspaper";
}

function isConsoleLayout() {
    const layout = document.body.dataset.hmiLayout;
    return layout === "console"
        || layout === "newspaper"
        || layout === "landscape"
        || layout === "portrait";
}

function isConsoleScaleLayout() {
    const layout = document.body.dataset.hmiLayout;
    return layout === "console" || layout === "landscape" || layout === "portrait";
}

function isProjectorView() {
    return document.body && document.body.dataset.hmiRole === "projector";
}

function setCarouselHidden(hidden) {
    const row = document.querySelector("[data-carousel-row]");
    if (!row) {
        return;
    }
    row.classList.toggle("is-hidden", hidden);
}

function setAgendaRowHidden(hidden) {
    const row = document.querySelector("[data-agenda-row]");
    if (!row) {
        return;
    }
    row.classList.toggle("is-hidden", hidden);
    if (hidden) {
        document.body.dataset.agendaRowHidden = "true";
    } else {
        delete document.body.dataset.agendaRowHidden;
    }
}

function setRailHidden(selector, hidden) {
    const railCard = document.querySelector(selector);
    if (!railCard) {
        return;
    }
    railCard.classList.toggle("is-hidden", hidden);
}

function toggleRailCard(selector) {
    const railCard = document.querySelector(selector);
    if (!railCard) {
        return;
    }
    const hidden = !railCard.classList.contains("is-hidden");
    setRailHidden(selector, hidden);
    updateRailTabs();
}

function toggleCarouselRow() {
    const row = document.querySelector("[data-carousel-row]");
    if (!row) {
        return;
    }
    const hidden = !row.classList.contains("is-hidden");
    setCarouselHidden(hidden);
}

function toggleAgendaRow() {
    const row = document.querySelector("[data-agenda-row]");
    if (!row) {
        return;
    }
    const hidden = !row.classList.contains("is-hidden");
    setAgendaRowHidden(hidden);
}

function applyAgendaDetails(enabled) {
    hmiState.agendaDetailsEnabled = Boolean(enabled);
    if (hmiState.agendaDetailsEnabled) {
        document.body.dataset.agendaDetails = "on";
    } else {
        delete document.body.dataset.agendaDetails;
        closeAgendaPopover();
        setAgendaMessage("");
    }
    updateAgendaDetailsToggle();
}

function updateAgendaDetailsToggle() {
    const toggles = document.querySelectorAll("[data-action=\"agenda-details-toggle\"]");
    const label = hmiState.agendaDetailsEnabled ? "Details: On" : "Details: Off";
    if (toggles.length) {
        toggles.forEach((toggle) => {
            toggle.textContent = label;
            toggle.classList.toggle("is-active", hmiState.agendaDetailsEnabled);
            toggle.setAttribute("aria-pressed", hmiState.agendaDetailsEnabled ? "true" : "false");
        });
    }
    const statusBadge = document.querySelector("[data-agenda-detail-status]");
    if (statusBadge) {
        statusBadge.textContent = label;
        statusBadge.classList.toggle("is-active", hmiState.agendaDetailsEnabled);
    }
}

function setupAgendaDetailsToggle() {
    const toggles = Array.from(document.querySelectorAll("[data-action=\"agenda-details-toggle\"]"));
    if (!toggles.length) {
        return;
    }
    toggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
            applyAgendaDetails(!hmiState.agendaDetailsEnabled);
        });
    });
    updateAgendaDetailsToggle();
}

function togglePanel(panelId, layoutClass) {
    const panel = document.getElementById(panelId);
    if (!panel) {
        return;
    }
    const hidden = !panel.classList.contains("is-hidden");
    setPanelHidden(panelId, layoutClass, hidden);
}

function toggleDetails(detailsId) {
    const panel = document.getElementById(detailsId);
    if (!panel) {
        return;
    }
    panel.open = !panel.open;
}

function positionToolsPanel(summary, panel) {
    if (!summary || !panel) {
        return;
    }
    const rect = summary.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const panelWidth = panelRect.width || panel.offsetWidth || 0;
    const panelHeight = panelRect.height || panel.offsetHeight || 0;
    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    let left = rect.right - panelWidth;
    if (left < 12) {
        left = 12;
    }
    if (panelWidth && left + panelWidth > viewportWidth - 12) {
        left = Math.max(12, viewportWidth - panelWidth - 12);
    }
    let top = rect.bottom + 8;
    if (panelHeight && top + panelHeight > viewportHeight - 12) {
        top = rect.top - panelHeight - 8;
    }
    if (top < 12) {
        top = 12;
    }
    panel.style.setProperty("--tools-panel-top", `${Math.round(top)}px`);
    panel.style.setProperty("--tools-panel-left", `${Math.round(left)}px`);
}

function setupDeckToolsFloatingPanel() {
    const details = document.getElementById("deck-tools");
    if (!details) {
        return;
    }
    const summary = details.querySelector("summary");
    const panel = details.querySelector(".tools-panel");
    if (!summary || !panel) {
        return;
    }
    const portal = document.getElementById("floating-panels");
    const placeholder = document.createElement("div");
    placeholder.className = "tools-panel-placeholder";
    placeholder.hidden = true;
    const originalParent = panel.parentElement;
    const restorePanel = () => {
        if (!originalParent) {
            return;
        }
        if (panel.parentElement !== originalParent) {
            originalParent.insertBefore(panel, placeholder);
            placeholder.remove();
        }
        panel.setAttribute("aria-hidden", "true");
    };
    const movePanel = () => {
        if (!portal) {
            return;
        }
        if (panel.parentElement !== portal) {
            originalParent.insertBefore(placeholder, panel);
            portal.appendChild(panel);
        }
        panel.setAttribute("aria-hidden", "false");
    };
    const refresh = () => {
        if (!details.open) {
            return;
        }
        positionToolsPanel(summary, panel);
    };
    details.addEventListener("toggle", () => {
        if (!details.open) {
            restorePanel();
            return;
        }
        movePanel();
        window.requestAnimationFrame(refresh);
    });
    document.addEventListener("click", (event) => {
        if (details.contains(event.target) || panel.contains(event.target)) {
            return;
        }
        details.open = false;
    });
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
}

function resetLayout() {
    if (isConsoleLayout()) {
        setCarouselHidden(false);
        setAgendaRowHidden(false);
    } else {
        setPanelHidden("slide-list-panel", "layout-hide-list", true);
    }
    setPanelHidden("side-panel", "layout-hide-side", true);
    setRailHidden("[data-rail-notes]", false);
    setRailHidden("[data-rail-live]", false);
    setRailHidden("[data-rail-next]", false);
    const agendaPanel = document.getElementById("agenda-panel");
    if (agendaPanel && !isConsoleLayout()) {
        agendaPanel.open = true;
    }
}

function getSlideClampMode(slide) {
    if (!slide) {
        return "balanced";
    }
    let mediaScore = 0;
    let notesScore = 0;
    const slideType = slide.type ? String(slide.type).toLowerCase() : "";
    if (slideType === "agenda") {
        return "agenda";
    }
    if (slideType === "poll") {
        return "poll";
    }
    if (slideType === "photo_map") {
        return "photo_map";
    }
    if (slide.media) {
        mediaScore += 2;
    }
    if (slide.chart) {
        mediaScore += 2;
    }
    if (Array.isArray(slide.media_gallery) && slide.media_gallery.length) {
        mediaScore += 2;
    }
    if (["image", "video", "photo_map", "dashboard", "data_snapshot"].includes(slideType)) {
        mediaScore += 1;
    }
    if (slide.markdown && String(slide.markdown).trim()) {
        notesScore += 2;
    }
    if (slide.notes && String(slide.notes).trim()) {
        notesScore += 1;
    }
    if (slide.body && String(slide.body).trim()) {
        notesScore += 1;
    }
    if (slide.callout && String(slide.callout).trim()) {
        notesScore += 1;
    }
    if (slide.qa_prompt || (Array.isArray(slide.qa_options) && slide.qa_options.length)) {
        notesScore += 2;
    }
    if (Array.isArray(slide.contacts) && slide.contacts.length) {
        notesScore += 2;
    }
    if (Array.isArray(slide.bullets) && slide.bullets.length >= 6) {
        notesScore += 1;
    }
    if (["poll", "contact_qa", "agenda"].includes(slideType)) {
        notesScore += 1;
    }
    if (!mediaScore && !notesScore) {
        return "balanced";
    }
    if (mediaScore === notesScore) {
        return "balanced";
    }
    return mediaScore > notesScore ? "media" : "notes";
}

function applySlideClampMode(slide) {
    if (!document.body) {
        return;
    }
    document.body.dataset.slideClamp = getSlideClampMode(slide);
}

function fitSlidePreview() {
    const slidePreview = document.querySelector(".slide-preview");
    if (!slidePreview) {
        return;
    }
    const slideInner = slidePreview.querySelector(".slide-preview-inner");
    if (!slideInner) {
        return;
    }
    slidePreview.style.setProperty("--slide-content-scale", "1");
    const style = window.getComputedStyle(slidePreview);
    const paddingX = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0);
    const paddingY = (Number.parseFloat(style.paddingTop) || 0) + (Number.parseFloat(style.paddingBottom) || 0);
    const availableWidth = Math.max(0, slidePreview.clientWidth - paddingX);
    const availableHeight = Math.max(0, slidePreview.clientHeight - paddingY);
    const contentRect = slideInner.getBoundingClientRect();
    const contentWidth = Math.max(contentRect.width, slideInner.scrollWidth || 0);
    const contentHeight = Math.max(contentRect.height, slideInner.scrollHeight || 0);
    if (availableWidth <= 0 || availableHeight <= 0 || contentWidth <= 0 || contentHeight <= 0) {
        return;
    }
    const clampMode = document.body ? document.body.dataset.slideClamp : "balanced";
    const clamp = (min, value, max) => Math.min(max, Math.max(min, value));
    const bodyRatio = clampMode === "media" ? 0.2 : clampMode === "notes" ? 0.3 : 0.24;
    const noteRatio = clampMode === "media" ? 0.17 : clampMode === "notes" ? 0.26 : 0.21;
    const bodyMax = clamp(110, Math.round(availableHeight * bodyRatio), 280);
    const noteMax = clamp(90, Math.round(availableHeight * noteRatio), 260);
    const lineClampMap = {
        media: { body: 3, note: 4 },
        notes: { body: 7, note: 8 },
        balanced: { body: 5, note: 6 }
    };
    const clampSetting = lineClampMap[clampMode] || lineClampMap.balanced;
    slidePreview.style.setProperty("--slide-body-max", `${bodyMax}px`);
    slidePreview.style.setProperty("--slide-note-max", `${noteMax}px`);
    slidePreview.style.setProperty("--slide-body-lines", `${clampSetting.body}`);
    slidePreview.style.setProperty("--slide-note-lines", `${clampSetting.note}`);
    const scaleWidth = availableWidth / contentWidth;
    const scaleHeight = availableHeight / contentHeight;
    const targetScale = Math.min(scaleWidth, scaleHeight);
    const maxScale = isConsoleScaleLayout() ? 1.45 : 1.5;
    const scale = Math.min(targetScale, maxScale);
    slidePreview.style.setProperty("--slide-content-scale", Math.max(0.01, scale).toFixed(3));
}

function applyConsoleScale() {
    if (!document.body) {
        return;
    }
    if (!isConsoleScaleLayout()) {
        document.body.style.removeProperty("--mi-console-scale");
        return;
    }
    const page = document.querySelector(".page");
    if (!page) {
        return;
    }
    const override = getConsoleScaleOverride();
    if (Number.isFinite(override) && override > 0) {
        const clamped = Math.min(1.2, Math.max(0.6, override));
        document.body.style.setProperty("--mi-console-scale", clamped.toFixed(3));
        return;
    }
    document.body.style.setProperty("--mi-console-scale", "1");
    const header = document.querySelector(".header");
    const menu = document.querySelector(".menu-bar");
    const carousel = document.querySelector("[data-carousel-row]");
    const agenda = document.querySelector("[data-agenda-row]");
    const mainGrid = document.querySelector(".main-grid");
    const sections = [header, menu, carousel, agenda, mainGrid].filter(Boolean);
    const requiredHeight = sections.reduce((sum, section) => {
        const rect = section.getBoundingClientRect();
        return sum + rect.height;
    }, 0);
    const requiredWidth = Math.max(page.scrollWidth, page.getBoundingClientRect().width);
    const heightScale = requiredHeight > 0 ? (window.innerHeight / requiredHeight) : 1;
    const widthScale = requiredWidth > 0 ? (window.innerWidth / requiredWidth) : 1;
    const nextScale = Math.min(1, heightScale, widthScale);
    if (!Number.isFinite(nextScale) || nextScale <= 0) {
        return;
    }
    document.body.style.setProperty("--mi-console-scale", nextScale.toFixed(3));
}

function adjustLayout() {
    const stage = document.querySelector(".stage");
    if (!stage) {
        return;
    }
    const width = window.innerWidth || 0;
    const height = window.innerHeight || 0;
    const isWide = width >= 1400;
    const isMedium = width >= 900 && width < 1400;
    const isNarrow = width > 0 && width < 1200;
    const isCramped = height > 0 && height < 820;
    stage.classList.toggle("layout-wide", isWide);
    stage.classList.toggle("layout-medium", isMedium);
    if (isNarrow) {
        document.body.dataset.hmiNarrow = "true";
    } else {
        delete document.body.dataset.hmiNarrow;
    }
    if (isCramped) {
        document.body.dataset.hmiCramped = "true";
    } else {
        delete document.body.dataset.hmiCramped;
    }
    const isTall = width > 0 && height > 0 ? (height / width) >= 1.25 : false;
    if (isTall) {
        document.body.dataset.hmiTall = "true";
    } else {
        delete document.body.dataset.hmiTall;
    }
    applyConsoleScale();
    fitSlidePreview();
    renderSlideCarousel(hmiState.scopeSlides, hmiState.currentIndex);
}

function openHelpDialog() {
    const helpDialog = document.getElementById("help-dialog");
    if (!helpDialog) {
        return;
    }
    if (typeof helpDialog.showModal === "function") {
        helpDialog.showModal();
    } else {
        helpDialog.setAttribute("open", "open");
    }
}

async function reloadCurrentDeck() {
    if (hmiState.deckId) {
        updateDeckStatus("Reloading deck...");
        try {
            const data = await loadSlideData();
            applySlideData(data, "Reloaded from server.");
        } catch (error) {
            updateDeckStatus("Reload failed.");
        }
        return;
    }
    if (hmiState.deckData) {
        applySlideData(hmiState.deckData, "Reloaded current deck.");
        return;
    }
    updateDeckStatus("No deck loaded to reload.");
}

function closeOpenMenus() {
    document.querySelectorAll(".menu[open]").forEach((menu) => {
        menu.removeAttribute("open");
    });
}

function clearElement(element) {
    if (!element) {
        return;
    }
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function getCssVariableValue(name, fallback) {
    if (!name) {
        return fallback;
    }
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
}

function addContactCard(container, contact) {
    const card = document.createElement("div");
    card.className = "contact-card";

    const role = document.createElement("div");
    role.className = "contact-role";
    role.textContent = contact.role || "Contact";

    const name = document.createElement("div");
    name.className = "contact-name";
    name.textContent = contact.name || "Name TBD";

    const phone = document.createElement("div");
    phone.className = "contact-detail";
    phone.textContent = contact.phone || "Phone TBD";

    const email = document.createElement("div");
    email.className = "contact-detail";
    email.textContent = contact.email || "Email TBD";

    card.append(role, name, phone, email);
    container.appendChild(card);
}

function addMetricCard(container, metric) {
    const card = document.createElement("div");
    card.className = "metric-card";

    const label = document.createElement("div");
    label.className = "metric-label";
    label.textContent = metric.label || "Metric";

    const value = document.createElement("div");
    value.className = "metric-value";
    value.textContent = metric.value || "Placeholder";

    card.append(label, value);
    container.appendChild(card);
}

function addCallout(container, text) {
    const item = document.createElement("div");
    item.className = "callout-item";
    item.textContent = text;
    container.appendChild(item);
}

function addListItem(container, text) {
    const item = document.createElement("li");
    item.textContent = text;
    container.appendChild(item);
}

function renderList(container, items) {
    if (!container) {
        return;
    }
    clearElement(container);
    if (!items || !items.length) {
        setHidden(container, true);
        return;
    }
    setHidden(container, false);
    items.forEach((item) => addListItem(container, item));
}

function renderQA(container, prompt, options) {
    if (!container) {
        return;
    }
    const promptEl = container.querySelector("[data-qa-prompt]");
    const optionsEl = container.querySelector("[data-qa-options]");

    if (!prompt || !Array.isArray(options) || options.length === 0 || !optionsEl) {
        container.hidden = true;
        if (promptEl) {
            promptEl.textContent = "";
        }
        optionsEl.innerHTML = "";
        return;
    }

    container.hidden = false;
    if (promptEl) {
        promptEl.textContent = prompt;
    }
    optionsEl.innerHTML = "";

    options.forEach((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "qa-option";
        button.setAttribute("aria-pressed", "false");
        button.dataset.qaOptionValue = option.label || `option-${index + 1}`;

        const title = document.createElement("span");
        title.textContent = option.label || `Option ${index + 1}`;
        button.appendChild(title);

        if (option.detail) {
            const detail = document.createElement("span");
            detail.className = "qa-option-detail";
            detail.textContent = option.detail;
            button.appendChild(detail);
        }

        button.addEventListener("click", () => {
            const active = optionsEl.querySelector(".qa-option.is-selected");
            if (active) {
                active.classList.remove("is-selected");
                active.setAttribute("aria-pressed", "false");
            }
            button.classList.add("is-selected");
            button.setAttribute("aria-pressed", "true");
        });

        optionsEl.appendChild(button);
    });
}

function renderMedia(container, media) {
    if (!container) {
        return;
    }
    clearElement(container);
    if (Array.isArray(media)) {
        renderMediaGallery(container, media);
        return;
    }
    if (!media || !media.type || !media.src) {
        setHidden(container, true);
        return;
    }
    const safeSrc = resolveSafeUrl(media.src);
    if (!safeSrc) {
        setHidden(container, true);
        return;
    }
    setHidden(container, false);

    const mediaBlock = document.createElement("div");
    mediaBlock.className = "slide-media-block";
    const safeMediaSrc = normalizeUrl(media.src, ["http:", "https:", "file:", "blob:"]);
    if (!safeMediaSrc) {
        setHidden(container, true);
        return;
    }

    const captionText = media.caption || media.summary || media.alt || "";
    const allowLightbox = true;

    if (media.type === "image") {
        const link = document.createElement("a");
        link.className = "slide-media-link";
        link.href = safeMediaSrc;
        link.setAttribute("aria-label", media.alt || media.caption || "View enlarged image");
        const img = document.createElement("img");
        img.alt = media.alt || media.caption || "Slide media";
        img.src = safeMediaSrc;
        img.loading = "lazy";
        link.appendChild(img);
        link.addEventListener("click", (event) => {
            if (typeof window.jQuery !== "function" || typeof window.jQuery.featherlight !== "function") {
                return;
            }
            event.preventDefault();
            openImageLightbox(safeMediaSrc, media.caption || media.alt || "");
        });
        mediaBlock.appendChild(link);
    } else if (media.type === "audio") {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.preload = "metadata";
        audio.setAttribute("aria-label", media.alt || media.caption || "Slide audio");
        audio.src = safeMediaSrc;
        mediaBlock.appendChild(audio);
    } else if (media.type === "video") {
        const video = document.createElement("video");
        video.controls = true;
        video.preload = "none";
        video.playsInline = true;
        video.src = safeMediaSrc;
        video.setAttribute("aria-label", media.alt || media.caption || "Slide video");
        mediaBlock.appendChild(video);
        if (typeof window.jQuery === "function" && typeof window.jQuery.featherlight === "function") {
            const fullscreenButton = document.createElement("button");
            fullscreenButton.type = "button";
            fullscreenButton.className = "media-lightbox-button";
            fullscreenButton.textContent = "Open video lightbox";
            fullscreenButton.addEventListener("click", () => {
                const safeCaption = escapeHtml(media.caption || "");
                const markup = `<div class="featherlight-video-wrapper"><video controls autoplay style="width:100%;height:100%;max-width:960px;"><source src="${safeMediaSrc}" type="video/mp4"></video><div class="featherlight-caption">${safeCaption}</div></div>`;
                window.jQuery.featherlight(markup);
            });
            mediaBlock.appendChild(fullscreenButton);
        }
    } else {
        setHidden(container, true);
        return;
    }

    container.appendChild(mediaBlock);

    const element = mediaBlock.querySelector("video, audio");
    if (window.Plyr && element instanceof HTMLMediaElement) {
        // eslint-disable-next-line no-new
        new window.Plyr(element, {
            controls: ["play", "progress", "current-time", "mute", "volume", "settings", "fullscreen"],
            tooltips: { controls: true }
        });
    }

    if (media.type === "video" && allowLightbox) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "slide-media-lightbox";
        button.textContent = "Open video";
        button.addEventListener("click", () => openMediaLightbox(media));
        mediaBlock.appendChild(button);
    }

    let caption = captionText;
    if (!caption && (media.type === "video" || media.type === "audio")) {
        caption = "Caption or summary not provided.";
    }
    if (caption) {
        const captionElement = document.createElement("div");
        captionElement.className = "slide-preview-media-caption";
        captionElement.textContent = caption;
        mediaBlock.appendChild(captionElement);
    }
    container.appendChild(mediaBlock);
}

function renderMediaGallery(container, items) {
    if (!Array.isArray(items) || !items.length) {
        setHidden(container, true);
        return;
    }
    const images = items.filter((item) => item && item.type === "image" && item.src);
    if (!images.length) {
        setHidden(container, true);
        return;
    }
    setHidden(container, false);
    const gallery = document.createElement("div");
    gallery.className = "slide-media-gallery";
    images.forEach((item) => {
        const safeMediaSrc = normalizeUrl(item.src, ["http:", "https:", "file:", "blob:"]);
        if (!safeMediaSrc) {
            return;
        }
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "slide-media-tile";
        tile.setAttribute("aria-label", item.alt || item.caption || "Open image");
        const scale = Number(item.scale);
        if (Number.isFinite(scale) && scale > 0) {
            tile.style.setProperty("--media-scale", Math.min(scale, 2).toFixed(2));
        }
        const img = document.createElement("img");
        img.alt = item.alt || item.caption || "Slide media";
        img.src = safeMediaSrc;
        img.loading = "lazy";
        tile.appendChild(img);
        tile.addEventListener("click", () => {
            openImageLightbox(safeMediaSrc, item.caption || item.alt || "");
        });
        gallery.appendChild(tile);
    });
    container.appendChild(gallery);
}

function openMediaLightbox(media) {
    if (!media || !media.src) {
        return;
    }
    if (openLightboxIfAvailable(media)) {
        return;
    }
    const fallbackUrl = resolveSafeUrl(media.embed_url || media.src);
    if (fallbackUrl) {
        openExternalLink(fallbackUrl);
    }
}

function openLightboxIfAvailable(media) {
    if (!(window.jQuery && window.jQuery.featherlight)) {
        return false;
    }
    const captionText = media.caption || media.summary || media.alt || "";
    const content = buildLightboxContent(media, captionText);
    if (!content) {
        return false;
    }
    try {
        window.jQuery.featherlight(window.jQuery(content), {
            variant: "mi-lightbox"
        });
        return true;
    } catch (error) {
        return false;
    }
}

function buildLightboxContent(media, captionText) {
    const safeSrc = resolveSafeUrl(media.src || "");
    const safeEmbed = resolveSafeUrl(media.embed_url || "");
    if (!safeSrc && !safeEmbed) {
        return null;
    }
    const figure = document.createElement("figure");
    figure.className = "mi-lightbox-figure";

    if ((media.lightbox_type === "iframe" || media.embed_url) && safeEmbed) {
        const iframe = document.createElement("iframe");
        iframe.className = "mi-lightbox-iframe";
        iframe.src = safeEmbed;
        iframe.allow = "autoplay; fullscreen";
        iframe.allowFullscreen = true;
        iframe.title = media.alt || media.caption || "Embedded media";
        figure.appendChild(iframe);
    } else if (media.type === "video") {
        const video = document.createElement("video");
        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;
        video.src = safeSrc;
        if (media.poster) {
            const safePoster = resolveSafeUrl(media.poster);
            if (safePoster) {
                video.poster = safePoster;
            }
        }
        video.setAttribute("aria-label", media.alt || media.caption || "Slide video");
        figure.appendChild(video);
    } else {
        const image = document.createElement("img");
        image.src = safeSrc;
        image.alt = media.alt || media.caption || "Slide media";
        figure.appendChild(image);
    }

    if (captionText) {
        const caption = document.createElement("figcaption");
        caption.textContent = captionText;
        figure.appendChild(caption);
    }

    return figure;
}

function openImageLightbox(src, caption) {
    if (typeof window.jQuery !== "function" || typeof window.jQuery.featherlight !== "function") {
        return;
    }
    const safeSrc = normalizeUrl(src, ["http:", "https:", "file:", "blob:"]);
    if (!safeSrc) {
        return;
    }
    const safeCaptionText = caption ? escapeHtml(caption) : "";
    const sanitizedCaption = safeCaptionText
        ? `<figcaption class="featherlight-caption">${safeCaptionText}</figcaption>`
        : "";
    const markup = `<figure class="featherlight-figure"><img src="${safeSrc}" alt="${safeCaptionText || "Presented image"}">${sanitizedCaption}</figure>`;
    window.jQuery.featherlight(markup, { variant: "media-lightbox" });
}

function hasECharts() {
    return typeof window.echarts === "object" && window.echarts;
}

function disposeECharts(container) {
    if (!container || !hasECharts()) {
        return;
    }
    const nodes = container.querySelectorAll("[data-echarts-canvas]");
    nodes.forEach((node) => {
        const instance = window.echarts.getInstanceByDom(node);
        if (instance) {
            instance.dispose();
        }
    });
}

function getChartPalette() {
    return [
        getCssVariableValue("--qi-blue", "#0093D0"),
        getCssVariableValue("--qi-navy", "#002D62"),
        getCssVariableValue("--qi-amber", "#D9822B"),
        getCssVariableValue("--qi-blue-soft", "#5B7FA6")
    ];
}

function getPlotlyTitle(value, fallback = "") {
    if (!value) {
        return fallback;
    }
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "object" && typeof value.text === "string") {
        return value.text;
    }
    return fallback;
}

function mapPlotlyDash(value) {
    if (!value) {
        return "solid";
    }
    const normalized = String(value).toLowerCase();
    if (normalized === "dash") {
        return "dashed";
    }
    if (normalized === "dot") {
        return "dotted";
    }
    if (normalized === "dashdot") {
        return "dashed";
    }
    return "solid";
}

function buildPlotlyYAxis(axisConfig, fallbackLabel) {
    const label = getPlotlyTitle(axisConfig && axisConfig.title, fallbackLabel);
    const range = axisConfig && Array.isArray(axisConfig.range) ? axisConfig.range : null;
    const suffix = axisConfig && axisConfig.ticksuffix ? axisConfig.ticksuffix : "";
    const axis = {
        type: "value"
    };
    if (label) {
        axis.name = label;
    }
    if (range && Number.isFinite(range[0]) && Number.isFinite(range[1])) {
        axis.min = range[0];
        axis.max = range[1];
    }
    if (suffix) {
        axis.axisLabel = {
            formatter: (value) => `${value}${suffix}`
        };
    }
    return axis;
}

function buildEChartsOptionFromPlotly(chart) {
    if (!chart || !chart.plotly || !Array.isArray(chart.plotly.data)) {
        return null;
    }
    const plotly = chart.plotly;
    const traces = plotly.data;
    if (!traces.length) {
        return null;
    }
    const layout = plotly.layout || {};
    const xAxisConfig = layout.xaxis || {};
    const xValues = Array.isArray(xAxisConfig.tickvals) && xAxisConfig.tickvals.length
        ? xAxisConfig.tickvals
        : (traces[0].x || []);
    const xLabels = xValues.map((value) => `${value}`);
    const palette = getChartPalette();

    const series = traces.map((trace, index) => {
        const traceType = typeof trace.type === "string" ? trace.type.toLowerCase() : "scatter";
        const mode = typeof trace.mode === "string" ? trace.mode.toLowerCase() : "";
        const hasLines = mode.includes("lines");
        const hasMarkers = mode.includes("markers");
        const seriesType = traceType === "scatter" && !hasLines ? "scatter" : "line";
        const yAxisIndex = trace.yaxis === "y2" ? 1 : 0;
        const color = (trace.line && trace.line.color) || (trace.marker && trace.marker.color) || palette[index % palette.length];
        const lineStyle = {};
        if (trace.line && trace.line.dash) {
            lineStyle.type = mapPlotlyDash(trace.line.dash);
        }
        if (trace.line && Number.isFinite(trace.line.width)) {
            lineStyle.width = trace.line.width;
        }
        const values = Array.isArray(trace.y) ? trace.y.map((value) => {
            const num = Number(value);
            return Number.isFinite(num) ? num : null;
        }) : [];
        return {
            name: trace.name || `Series ${index + 1}`,
            type: seriesType,
            data: values,
            yAxisIndex,
            showSymbol: hasMarkers || seriesType === "scatter",
            symbolSize: seriesType === "scatter" ? 8 : 6,
            smooth: seriesType === "line",
            lineStyle,
            itemStyle: {
                color
            }
        };
    });

    const grid = {
        top: layout.margin && Number.isFinite(layout.margin.t) ? layout.margin.t : 24,
        right: layout.margin && Number.isFinite(layout.margin.r) ? layout.margin.r : 16,
        bottom: layout.margin && Number.isFinite(layout.margin.b) ? layout.margin.b : 42,
        left: layout.margin && Number.isFinite(layout.margin.l) ? layout.margin.l : 48,
        containLabel: true
    };

    const yAxis = [buildPlotlyYAxis(layout.yaxis || {}, chart.unit || "")];
    if (traces.some((trace) => trace.yaxis === "y2")) {
        yAxis.push(buildPlotlyYAxis(layout.yaxis2 || {}, ""));
    }

    return {
        grid,
        tooltip: {
            trigger: "axis"
        },
        legend: {
            top: 0,
            type: "scroll"
        },
        xAxis: {
            type: "category",
            data: xLabels,
            name: getPlotlyTitle(xAxisConfig.title, ""),
            axisLabel: {
                color: getCssVariableValue("--qi-text-soft", "#506070")
            }
        },
        yAxis,
        series
    };
}

function renderEChartsChart(container, option, height) {
    if (!container || !hasECharts() || !option) {
        return false;
    }
    setHidden(container, false);
    if (!option.color) {
        option.color = getChartPalette();
    }
    const canvas = document.createElement("div");
    canvas.className = "echarts-canvas";
    canvas.dataset.echartsCanvas = "true";
    if (Number.isFinite(height) && height > 0) {
        canvas.style.height = `${height}px`;
    }
    container.appendChild(canvas);
    const instance = window.echarts.init(canvas);
    instance.setOption(option, true);
    return true;
}

function renderClarksoftChart(container, chart) {
    if (!container || !chart || !Array.isArray(chart.series) || chart.series.length === 0) {
        return false;
    }

    setHidden(container, false);
    container.classList.add("is-clarksoft");

    const titleText = chart.title || "";
    if (titleText) {
        const title = document.createElement("div");
        title.className = "slide-chart-title";
        title.textContent = titleText;
        container.appendChild(title);
    }

    const palette = [
        getCssVariableValue("--qi-navy", "#002D62"),
        getCssVariableValue("--qi-blue", "#0093D0"),
        getCssVariableValue("--qi-blue-soft", "#3F6189"),
        getCssVariableValue("--qi-amber", "#D9822B")
    ];
    const gridColor = getCssVariableValue("--mi-border", "#D5DEE6");
    const textColor = getCssVariableValue("--qi-text-soft", "#506070");

    const chartCanvas = document.createElement("div");
    chartCanvas.className = "slide-chart-canvas";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("slide-chart-svg");
    svg.setAttribute("viewBox", "0 0 640 320");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", chart.title || "Chart");

    const leftSeries = chart.series.filter((series) => series.axis !== "right");
    const rightSeries = chart.series.filter((series) => series.axis === "right");
    const xTicks = (chart.x_axis && chart.x_axis.ticks) || [];
    const xValues = xTicks.length
        ? xTicks
        : (chart.series[0].points || []).map((point) => point.x);
    const xLabels = xValues.map((value) => `${value}`);

    const hasRightAxis = rightSeries.length > 0;
    const padding = {
        top: 24,
        right: hasRightAxis ? 60 : 24,
        bottom: 52,
        left: 60
    };
    const width = 640;
    const height = 320;
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    function getRange(seriesList, axisConfig) {
        const values = seriesList
            .flatMap((series) => series.points || [])
            .map((point) => Number(point.y))
            .filter((value) => !Number.isNaN(value));
        let minValue = axisConfig && axisConfig.min !== null ? axisConfig.min : null;
        let maxValue = axisConfig && axisConfig.max !== null ? axisConfig.max : null;
        if (minValue === null || minValue === undefined) {
            minValue = values.length ? Math.min(...values) : 0;
        }
        if (maxValue === null || maxValue === undefined) {
            maxValue = values.length ? Math.max(...values) : 1;
        }
        if (minValue === maxValue) {
            minValue -= 1;
            maxValue += 1;
        }
        const pad = (maxValue - minValue) * 0.08;
        return {
            min: minValue - pad,
            max: maxValue + pad
        };
    }

    const leftAxis = getRange(leftSeries, chart.y_axis || {});
    const rightAxis = hasRightAxis ? getRange(rightSeries, chart.y2_axis || {}) : null;

    function xPosition(index) {
        if (xLabels.length <= 1) {
            return padding.left + plotWidth / 2;
        }
        return padding.left + (index / (xLabels.length - 1)) * plotWidth;
    }

    function yPosition(value, axis) {
        const safeValue = Number(value);
        const range = axis.max - axis.min;
        if (range <= 0) {
            return padding.top + plotHeight / 2;
        }
        const ratio = (axis.max - safeValue) / range;
        return padding.top + ratio * plotHeight;
    }

    function addSvgElement(tag, attrs = {}) {
        const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.entries(attrs).forEach(([key, val]) => {
            node.setAttribute(key, val);
        });
        svg.appendChild(node);
        return node;
    }

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i += 1) {
        const y = padding.top + (i / gridLines) * plotHeight;
        addSvgElement("line", {
            x1: padding.left,
            y1: y,
            x2: width - padding.right,
            y2: y,
            stroke: gridColor,
            "stroke-width": "1"
        });
    }

    const axisLineColor = gridColor;
    addSvgElement("line", {
        x1: padding.left,
        y1: padding.top,
        x2: padding.left,
        y2: height - padding.bottom,
        stroke: axisLineColor,
        "stroke-width": "1.2"
    });
    addSvgElement("line", {
        x1: padding.left,
        y1: height - padding.bottom,
        x2: width - padding.right,
        y2: height - padding.bottom,
        stroke: axisLineColor,
        "stroke-width": "1.2"
    });
    if (hasRightAxis) {
        addSvgElement("line", {
            x1: width - padding.right,
            y1: padding.top,
            x2: width - padding.right,
            y2: height - padding.bottom,
            stroke: axisLineColor,
            "stroke-width": "1.2"
        });
    }

    const tickCount = 5;
    for (let i = 0; i <= tickCount; i += 1) {
        const value = leftAxis.min + ((leftAxis.max - leftAxis.min) * (tickCount - i)) / tickCount;
        const y = padding.top + (i / tickCount) * plotHeight;
        const label = value.toFixed(1).replace(/\\.0$/, "");
        const suffix = chart.y_axis && chart.y_axis.suffix ? chart.y_axis.suffix : "";
        addSvgElement("text", {
            x: padding.left - 8,
            y: y + 4,
            "text-anchor": "end",
            "font-size": "10",
            "fill": textColor,
            class: "slide-chart-tick"
        }).textContent = `${label}${suffix}`;
    }

    if (hasRightAxis && rightAxis) {
        for (let i = 0; i <= tickCount; i += 1) {
            const value = rightAxis.min + ((rightAxis.max - rightAxis.min) * (tickCount - i)) / tickCount;
            const y = padding.top + (i / tickCount) * plotHeight;
            const label = value.toFixed(1).replace(/\\.0$/, "");
            const suffix = chart.y2_axis && chart.y2_axis.suffix ? chart.y2_axis.suffix : "";
            addSvgElement("text", {
                x: width - padding.right + 8,
                y: y + 4,
                "text-anchor": "start",
                "font-size": "10",
                "fill": textColor,
                class: "slide-chart-tick"
            }).textContent = `${label}${suffix}`;
        }
    }

    xLabels.forEach((label, index) => {
        const x = xPosition(index);
        addSvgElement("text", {
            x,
            y: height - padding.bottom + 18,
            "text-anchor": "middle",
            "font-size": "10",
            "fill": textColor,
            class: "slide-chart-tick"
        }).textContent = label;
    });

    if (chart.x_axis && chart.x_axis.label) {
        addSvgElement("text", {
            x: padding.left + plotWidth / 2,
            y: height - 10,
            "text-anchor": "middle",
            "font-size": "11",
            "fill": textColor,
            class: "slide-chart-axis-label"
        }).textContent = chart.x_axis.label;
    }
    if (chart.y_axis && chart.y_axis.label) {
        addSvgElement("text", {
            x: 16,
            y: padding.top + plotHeight / 2,
            "text-anchor": "middle",
            "font-size": "11",
            "fill": textColor,
            class: "slide-chart-axis-label",
            transform: `rotate(-90 16 ${padding.top + plotHeight / 2})`
        }).textContent = chart.y_axis.label;
    }
    if (hasRightAxis && chart.y2_axis && chart.y2_axis.label) {
        addSvgElement("text", {
            x: width - 12,
            y: padding.top + plotHeight / 2,
            "text-anchor": "middle",
            "font-size": "11",
            "fill": textColor,
            class: "slide-chart-axis-label",
            transform: `rotate(90 ${width - 12} ${padding.top + plotHeight / 2})`
        }).textContent = chart.y2_axis.label;
    }

    chart.series.forEach((series, index) => {
        const axis = series.axis === "right" && rightAxis ? rightAxis : leftAxis;
        const color = series.color || palette[index % palette.length];
        const points = (series.points || []).map((point, pointIndex) => {
            return {
                x: xPosition(pointIndex),
                y: yPosition(point.y, axis)
            };
        });
        if (points.length === 0) {
            return;
        }
        const pathData = points
            .map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"} ${point.x} ${point.y}`)
            .join(" ");
        const pathAttrs = {
            d: pathData,
            fill: "none",
            stroke: color,
            "stroke-width": "2"
        };
        if (series.style === "dash") {
            pathAttrs["stroke-dasharray"] = "6 4";
        } else if (series.style === "dot") {
            pathAttrs["stroke-dasharray"] = "2 4";
        }
        addSvgElement("path", pathAttrs);

        points.forEach((point) => {
            addSvgElement("circle", {
                cx: point.x,
                cy: point.y,
                r: "3.5",
                fill: color
            });
        });
    });

    chartCanvas.appendChild(svg);
    container.appendChild(chartCanvas);

    const legend = document.createElement("div");
    legend.className = "slide-chart-legend";
    chart.series.forEach((series, index) => {
        const item = document.createElement("div");
        item.className = "slide-chart-legend-item";

        const swatch = document.createElement("span");
        swatch.className = "slide-chart-legend-swatch";
        swatch.style.background = series.color || palette[index % palette.length];

        const label = document.createElement("span");
        label.textContent = series.label || `Series ${index + 1}`;

        item.append(swatch, label);
        legend.appendChild(item);
    });
    container.appendChild(legend);

    const noteText = chart.note || chart.source_note;
    if (noteText) {
        const note = document.createElement("div");
        note.className = "slide-chart-note";
        note.textContent = noteText;
        container.appendChild(note);
    }

    return true;
}

function renderSimpleChart(container, chart) {
    if (!container) {
        return;
    }
    if (!chart || !Array.isArray(chart.labels) || !Array.isArray(chart.values)) {
        setHidden(container, true);
        return;
    }
    if (chart.labels.length === 0 || chart.labels.length !== chart.values.length) {
        setHidden(container, true);
        return;
    }

    const values = chart.values.map((value) => Number(value));
    if (values.some((value) => Number.isNaN(value))) {
        setHidden(container, true);
        return;
    }

    setHidden(container, false);

    const title = document.createElement("div");
    title.className = "slide-chart-title";
    title.textContent = chart.title || "Chart";
    container.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "slide-chart-grid";
    const maxValue = Math.max(...values, 0);
    values.forEach((value, index) => {
        const bar = document.createElement("div");
        bar.className = "slide-chart-bar";

        const valueLabel = document.createElement("div");
        valueLabel.className = "slide-chart-bar-value";
        const unit = chart.unit || "";
        valueLabel.textContent = `${value}${unit}`;

        const fill = document.createElement("div");
        fill.className = "slide-chart-bar-fill";
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        fill.style.height = `${height}%`;

        const label = document.createElement("div");
        label.className = "slide-chart-bar-label";
        label.textContent = chart.labels[index] || "";

        bar.append(valueLabel, fill, label);
        grid.appendChild(bar);
    });
    container.appendChild(grid);

    const noteText = chart.note || chart.source_note;
    if (noteText) {
        const note = document.createElement("div");
        note.className = "slide-chart-note";
        note.textContent = noteText;
        container.appendChild(note);
    }
}

function renderChart(container, chart) {
    if (!container) {
        return;
    }
    disposeECharts(container);
    clearElement(container);
    container.classList.remove("is-clarksoft");
    if (!chart) {
        setHidden(container, true);
        return;
    }

    const library = typeof chart.library === "string" ? chart.library.toLowerCase() : "";
    if ((library === "plotly" && chart.plotly) || (library === "echarts" && chart.echarts)) {
        const titleText = chart.title || "";
        if (titleText) {
            const title = document.createElement("div");
            title.className = "slide-chart-title";
            title.textContent = titleText;
            container.appendChild(title);
        }
        const option = library === "plotly"
            ? buildEChartsOptionFromPlotly(chart)
            : chart.echarts;
        const rendered = renderEChartsChart(container, option, chart.height);
        if (rendered) {
            const noteText = chart.note || chart.source_note;
            if (noteText) {
                const note = document.createElement("div");
                note.className = "slide-chart-note";
                note.textContent = noteText;
                container.appendChild(note);
            }
            return;
        }
    }
    if (library === "clarksoft") {
        const rendered = renderClarksoftChart(container, chart);
        if (rendered) {
            return;
        }
    }

    renderSimpleChart(container, chart);
}

function parseCsvLine(line) {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === "\"") {
            if (inQuotes && line[i + 1] === "\"") {
                current += "\"";
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (char === "," && !inQuotes) {
            cells.push(current);
            current = "";
            continue;
        }
        current += char;
    }
    cells.push(current);
    return cells;
}

function parseCsvText(text) {
    if (!text) {
        return { headers: [], rows: [] };
    }
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (!lines.length) {
        return { headers: [], rows: [] };
    }
    const headers = parseCsvLine(lines[0]).map((header) => header.trim());
    const rows = lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] !== undefined ? values[index].trim() : "";
        });
        return row;
    });
    return { headers, rows };
}

function formatSiteLabel(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();
}

function buildSampleMetrics(rows) {
    const siteMap = new Map();
    rows.forEach((row) => {
        const siteId = row.site_id || row.site || row.siteId || "";
        const date = row.date || "";
        const ndvi = Number(row.ndvi);
        const ndmi = Number(row.ndmi);
        if (!siteId || !date || !Number.isFinite(ndvi) || !Number.isFinite(ndmi)) {
            return;
        }
        if (!siteMap.has(siteId)) {
            siteMap.set(siteId, []);
        }
        siteMap.get(siteId).push({ date, ndvi, ndmi });
    });

    const sites = Array.from(siteMap.entries()).map(([siteId, entries]) => {
        const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date));
        return { siteId, entries: sorted };
    });

    const dateSet = new Set();
    sites.forEach((site) => {
        site.entries.forEach((entry) => dateSet.add(entry.date));
    });
    const dates = Array.from(dateSet).sort((a, b) => a.localeCompare(b));

    const latestBySite = sites.map((site) => {
        const last = site.entries[site.entries.length - 1] || null;
        return {
            siteId: site.siteId,
            label: formatSiteLabel(site.siteId),
            ndvi: last ? last.ndvi : null,
            ndmi: last ? last.ndmi : null
        };
    });

    const countsBySite = sites.map((site) => ({
        name: formatSiteLabel(site.siteId),
        value: site.entries.length
    }));

    return {
        sites,
        dates,
        latestBySite,
        countsBySite,
        axisLabels: {
            ndvi: "NDVI",
            ndmi: "NDMI"
        },
        scatterLabels: { x: "NDVI", y: "NDMI" },
        sparklineKey: "ndvi"
    };
}

function buildTimeSeriesOption(metrics, metricKey) {
    const palette = getChartPalette();
    const series = metrics.sites.map((site, index) => {
        const valueMap = new Map(site.entries.map((entry) => [entry.date, entry[metricKey]]));
        const data = metrics.dates.map((date) => {
            const value = valueMap.get(date);
            return Number.isFinite(value) ? value : null;
        });
        return {
            name: formatSiteLabel(site.siteId),
            type: "line",
            data,
            smooth: true,
            showSymbol: true,
            symbolSize: 6,
            itemStyle: { color: palette[index % palette.length] },
            lineStyle: { width: 2 }
        };
    });

    return {
        grid: { top: 22, right: 12, bottom: 32, left: 40, containLabel: true },
        legend: { top: 0, type: "scroll" },
        tooltip: { trigger: "axis" },
        xAxis: {
            type: "category",
            data: metrics.dates,
            axisLabel: { color: getCssVariableValue("--qi-text-soft", "#506070") }
        },
        yAxis: {
            type: "value",
            name: metrics.axisLabels && metrics.axisLabels[metricKey] ? metrics.axisLabels[metricKey] : "",
            axisLabel: { color: getCssVariableValue("--qi-text-soft", "#506070") }
        },
        series
    };
}

function buildScatterOption(metrics) {
    const palette = getChartPalette();
    const series = metrics.sites.map((site, index) => {
        const data = site.entries.map((entry) => [entry.ndvi, entry.ndmi]);
        return {
            name: formatSiteLabel(site.siteId),
            type: "scatter",
            data,
            symbolSize: 8,
            itemStyle: { color: palette[index % palette.length] }
        };
    });

    return {
        grid: { top: 24, right: 12, bottom: 36, left: 44, containLabel: true },
        legend: { top: 0, type: "scroll" },
        tooltip: { trigger: "item" },
        xAxis: { type: "value", name: metrics.scatterLabels?.x || "NDVI" },
        yAxis: { type: "value", name: metrics.scatterLabels?.y || "NDMI" },
        series
    };
}

function buildBarOption(metrics) {
    const labels = metrics.latestBySite.map((item) => item.label);
    const data = metrics.latestBySite.map((item) => {
        if (Number.isFinite(item.value)) {
            return item.value;
        }
        return Number.isFinite(item.ndvi) ? item.ndvi : 0;
    });
    return {
        grid: { top: 24, right: 12, bottom: 36, left: 44, containLabel: true },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: labels },
        yAxis: { type: "value" },
        series: [
            {
                type: "bar",
                data,
                itemStyle: { color: getCssVariableValue("--qi-blue", "#0093D0") },
                barMaxWidth: 36
            }
        ]
    };
}

function buildPieOption(metrics) {
    return {
        tooltip: { trigger: "item" },
        series: [
            {
                type: "pie",
                radius: ["30%", "60%"],
                data: metrics.countsBySite,
                label: { formatter: "{b}: {c}" }
            }
        ]
    };
}

function buildRadarOption(metrics) {
    if (metrics.radarIndicators && metrics.radarData) {
        return {
            radar: { indicator: metrics.radarIndicators },
            legend: { top: 0, type: "scroll" },
            series: [{ type: "radar", data: metrics.radarData }]
        };
    }
    const ndviMax = Math.max(0, ...metrics.sites.flatMap((site) => site.entries.map((entry) => entry.ndvi)));
    const ndmiMax = Math.max(0, ...metrics.sites.flatMap((site) => site.entries.map((entry) => entry.ndmi)));
    const indicators = [
        { name: "NDVI", max: ndviMax || 1 },
        { name: "NDMI", max: ndmiMax || 1 }
    ];
    const palette = getChartPalette();
    const data = metrics.sites.map((site, index) => {
        const last = site.entries[site.entries.length - 1] || { ndvi: 0, ndmi: 0 };
        return {
            name: formatSiteLabel(site.siteId),
            value: [last.ndvi || 0, last.ndmi || 0],
            itemStyle: { color: palette[index % palette.length] }
        };
    });
    return {
        radar: {
            indicator: indicators
        },
        legend: { top: 0, type: "scroll" },
        series: [
            {
                type: "radar",
                data
            }
        ]
    };
}

function buildSparklineOption(values) {
    return {
        grid: { top: 6, right: 6, bottom: 6, left: 6 },
        xAxis: { type: "category", show: false },
        yAxis: { type: "value", show: false },
        series: [
            {
                type: "line",
                data: values,
                smooth: true,
                symbol: "none",
                lineStyle: { width: 2, color: getCssVariableValue("--qi-blue", "#0093D0") }
            }
        ]
    };
}

function renderSparklineGrid(container, metrics, metricKey) {
    if (!container) {
        return;
    }
    disposeECharts(container);
    clearElement(container);
    const grid = document.createElement("div");
    grid.className = "sparkline-grid";
    metrics.sites.forEach((site) => {
        const card = document.createElement("div");
        card.className = "sparkline-card";
        const title = document.createElement("div");
        title.className = "sparkline-title";
        title.textContent = formatSiteLabel(site.siteId);
        const chart = document.createElement("div");
        chart.className = "sparkline-chart";
        card.append(title, chart);
        grid.appendChild(card);
        const values = site.entries.map((entry) => entry[metricKey]).filter((value) => Number.isFinite(value));
        renderEChartsChart(chart, buildSparklineOption(values), 80);
    });
    container.appendChild(grid);
}

function parseNumber(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const cleaned = String(value).replace(/,/g, "").trim();
    if (!cleaned) {
        return null;
    }
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
}

function buildRealMetrics(quickstatsRows, ghcnRows) {
    const stationMap = new Map();
    ghcnRows.forEach((row) => {
        const station = row.station || "";
        const date = row.date || "";
        const prcp = parseNumber(row.prcp);
        const tmax = parseNumber(row.tmax);
        if (!station || !date) {
            return;
        }
        if (!stationMap.has(station)) {
            stationMap.set(station, { station, state: row.state || "", entries: [] });
        }
        stationMap.get(station).entries.push({
            date,
            prcp: Number.isFinite(prcp) ? prcp / 10 : null,
            tmax: Number.isFinite(tmax) ? tmax / 10 : null
        });
    });
    const sites = Array.from(stationMap.values()).map((site) => ({
        siteId: site.station,
        state: site.state,
        entries: site.entries.slice().sort((a, b) => a.date.localeCompare(b.date))
    }));
    const dateSet = new Set();
    sites.forEach((site) => site.entries.forEach((entry) => dateSet.add(entry.date)));
    const dates = Array.from(dateSet).sort((a, b) => a.localeCompare(b));

    const latestBySite = quickstatsRows.map((row) => ({
        siteId: row.state_alpha || row.state || "",
        label: row.state_alpha || row.state || "",
        value: parseNumber(row.total_value)
    }));

    const countsBySite = quickstatsRows.map((row) => ({
        name: row.state_alpha || row.state || "",
        value: parseNumber(row.total_value) || 0
    }));

    const prcpByState = {};
    sites.forEach((site) => {
        if (!site.state) {
            return;
        }
        const values = site.entries.map((entry) => entry.prcp).filter((value) => Number.isFinite(value));
        if (!values.length) {
            return;
        }
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        prcpByState[site.state] = avg;
    });

    const radarIndicators = [
        { name: "Irrigated acres", max: Math.max(1, ...latestBySite.map((row) => row.value || 0)) },
        { name: "Avg precip (mm)", max: Math.max(1, ...Object.values(prcpByState)) }
    ];
    const radarData = latestBySite.map((row) => ({
        name: row.label,
        value: [row.value || 0, prcpByState[row.siteId] || 0]
    }));

    return {
        sites,
        dates,
        latestBySite,
        countsBySite,
        radarIndicators,
        radarData,
        axisLabels: { prcp: "Precip (mm)", tmax: "Tmax (°C)" },
        scatterLabels: { x: "Precip (mm)", y: "Tmax (°C)" },
        sparklineKey: "prcp"
    };
}

function renderPresenterCharts(metrics) {
    const containers = Array.from(document.querySelectorAll("[data-presenter-chart]"));
    if (!containers.length) {
        return;
    }
    containers.forEach((container) => {
        const chartId = container.dataset.presenterChart || "";
        disposeECharts(container);
        clearElement(container);
        if (chartId === "ndvi_sparklines") {
            renderSparklineGrid(container, metrics, metrics.sparklineKey || "ndvi");
            return;
        }
        let option = null;
        if (chartId === "ndvi_timeseries") {
            option = buildTimeSeriesOption(metrics, metrics.axisLabels ? "prcp" : "ndvi");
        } else if (chartId === "ndmi_timeseries") {
            option = buildTimeSeriesOption(metrics, metrics.axisLabels ? "tmax" : "ndmi");
        } else if (chartId === "ndvi_scatter") {
            option = buildScatterOption(metrics);
        } else if (chartId === "ndvi_bar") {
            option = buildBarOption(metrics);
        } else if (chartId === "site_pie") {
            option = buildPieOption(metrics);
        } else if (chartId === "site_radar") {
            option = buildRadarOption(metrics);
        }
        if (option) {
            renderEChartsChart(container, option, 160);
        }
    });
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(() => {
            resizeECharts();
        });
    }
}

function resizeECharts() {
    if (!hasECharts()) {
        return;
    }
    const nodes = document.querySelectorAll("[data-echarts-canvas]");
    nodes.forEach((node) => {
        const instance = window.echarts.getInstanceByDom(node);
        if (instance) {
            instance.resize();
        }
    });
}

async function setupPresenterInsights() {
    const status = document.querySelector("[data-presenter-chart-status]");
    const presenterContainers = Array.from(document.querySelectorAll("[data-presenter-insights]"));
    const projectorContainers = Array.from(document.querySelectorAll("[data-projector-insights]"));
    const containers = [...presenterContainers, ...projectorContainers];
    if (!containers.length) {
        return;
    }
    if (!hmiState.insightsEnabled && !isProjectorView()) {
        if (status) {
            status.textContent = "Insights hidden.";
        }
        return;
    }
    if (!hasECharts()) {
        if (status) {
            status.textContent = "Charts disabled. ECharts library not loaded.";
        }
        return;
    }
    if (status) {
        status.textContent = "Loading CSV…";
    }
    try {
        const [quickstatsText, ghcnText] = await Promise.all([
            fetch(CSV_QUICKSTATS_STATE_URL, { cache: "no-store" }).then((res) => (res.ok ? res.text() : "")),
            fetch(CSV_GHCN_DAILY_URL, { cache: "no-store" }).then((res) => (res.ok ? res.text() : ""))
        ]);
        if (quickstatsText && ghcnText) {
            const quickstats = parseCsvText(quickstatsText);
            const ghcn = parseCsvText(ghcnText);
            const metrics = buildRealMetrics(quickstats.rows, ghcn.rows);
            if (metrics.sites.length && metrics.latestBySite.length) {
                renderPresenterCharts(metrics);
                if (status) {
                    status.textContent = `Loaded real data for ${metrics.latestBySite.length} states`;
                }
                return;
            }
        }
        const response = await fetch(CSV_SAMPLE_DATA_URL, { cache: "no-store" });
        if (!response.ok) {
            throw new Error("CSV load failed.");
        }
        const text = await response.text();
        const parsed = parseCsvText(text);
        const metrics = buildSampleMetrics(parsed.rows);
        if (!metrics.sites.length) {
            if (status) {
                status.textContent = "No sample rows found in CSV.";
            }
            return;
        }
        renderPresenterCharts(metrics);
        if (status) {
            status.textContent = `Loaded ${metrics.sites.length} sites from sample_data.csv`;
        }
    } catch (error) {
        if (status) {
            status.textContent = "CSV load failed. Check /assets/data/*.csv.";
        }
    }
}

function renderSpeakerNotes(notes) {
    const textElement = document.querySelector("[data-speaker-notes]");
    const listElement = document.querySelector("[data-speaker-notes-list]");

    if (Array.isArray(notes)) {
        if (listElement) {
            clearElement(listElement);
            notes.forEach((item) => addListItem(listElement, item));
        }
        setHidden(listElement, false);
        setHidden(textElement, true);
        return;
    }

    if (typeof notes === "string" && notes.trim().length > 0) {
        setText("[data-speaker-notes]", notes);
        setHidden(textElement, false);
        setHidden(listElement, true);
        return;
    }

    setText("[data-speaker-notes]", "No speaker notes provided.");
    setHidden(textElement, false);
    setHidden(listElement, true);
}

function renderAgenda(items, activeIndex) {
    const listElement = document.querySelector("[data-agenda-list]");
    const emptyElement = document.querySelector("[data-agenda-empty]");
    if (!listElement) {
        return;
    }

    clearElement(listElement);
    if (!items || !items.length) {
        setHidden(listElement, true);
        setHidden(emptyElement, false);
        return;
    }

    setHidden(listElement, false);
    setHidden(emptyElement, true);
    items.forEach((item, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        if (typeof activeIndex === "number" && index === activeIndex) {
            listItem.classList.add("is-active");
        }
        listElement.appendChild(listItem);
    });
}

function renderAgendaChips(items, activeIndex) {
    const chipRow = document.querySelector("[data-agenda-row]");
    const chipsElement = document.querySelector("[data-agenda-chips]");
    const emptyElement = document.querySelector("[data-agenda-chips-empty]");
    if (!chipsElement || !chipRow) {
        return;
    }

    clearElement(chipsElement);
    if (!items || !items.length) {
        setHidden(chipsElement, true);
        setHidden(emptyElement, false);
        return;
    }

    setHidden(chipsElement, false);
    setHidden(emptyElement, true);
    items.forEach((item, index) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.classList.add("agenda-chip");
        chip.textContent = item;
        chip.dataset.agendaIndex = index.toString();
        chip.setAttribute("role", "listitem");
        chip.setAttribute("aria-haspopup", "dialog");
        if (typeof activeIndex === "number" && index === activeIndex) {
            chip.classList.add("is-active");
            chip.setAttribute("aria-current", "true");
        }
        chipsElement.appendChild(chip);
    });
}

function setAgendaMessage(message) {
    const messageElement = document.querySelector("[data-agenda-message]");
    if (!messageElement) {
        return;
    }
    if (!message) {
        setHidden(messageElement, true);
        messageElement.textContent = "";
        return;
    }
    messageElement.textContent = message;
    setHidden(messageElement, false);
}

function getAgendaSlideMatches(sectionIndex) {
    if (!Array.isArray(hmiState.slides)) {
        return [];
    }
    return hmiState.slides
        .map((slide, index) => ({ slide, index }))
        .filter((entry) => Number.isInteger(entry.slide.agenda_index) && entry.slide.agenda_index - 1 === sectionIndex);
}

function positionAgendaPopover(anchor) {
    const popover = document.querySelector("[data-agenda-popover]");
    const row = document.querySelector("[data-agenda-row]");
    if (!popover || !row || !anchor) {
        return;
    }
    const rowRect = row.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth || 300;
    const leftBase = anchorRect.left - rowRect.left;
    const maxLeft = rowRect.width - popoverWidth - 12;
    const safeLeft = Math.max(8, Math.min(leftBase, maxLeft));
    popover.style.left = `${safeLeft}px`;
}

function closeAgendaPopover() {
    const popover = document.querySelector("[data-agenda-popover]");
    if (!popover) {
        return;
    }
    popover.hidden = true;
}

function openAgendaPopover(sectionLabel, matches, anchor, openedSlideList) {
    const popover = document.querySelector("[data-agenda-popover]");
    const titleElement = document.querySelector("[data-agenda-popover-title]");
    const countElement = document.querySelector("[data-agenda-popover-count]");
    const listElement = document.querySelector("[data-agenda-popover-list]");
    const emptyElement = document.querySelector("[data-agenda-popover-empty]");
    const tipElement = document.querySelector("[data-agenda-popover-tip]");
    if (!popover || !listElement || !emptyElement) {
        return;
    }

    clearElement(listElement);
    if (titleElement) {
        titleElement.textContent = sectionLabel || "Agenda detail";
    }
    if (countElement) {
        countElement.textContent = matches.length ? `${matches.length} slides` : "No slides";
    }
    if (!matches.length) {
        setHidden(listElement, true);
        setHidden(emptyElement, false);
    } else {
        setHidden(listElement, false);
        setHidden(emptyElement, true);
        matches.forEach((entry) => {
            const item = document.createElement("li");
            const title = entry.slide.title ? entry.slide.title : "Untitled slide";
            item.textContent = `Slide ${entry.index + 1}: ${title}`;
            listElement.appendChild(item);
        });
    }
    if (tipElement) {
        setHidden(tipElement, !openedSlideList);
    }
    popover.hidden = false;
    positionAgendaPopover(anchor);
}

function openSlideListFallback() {
    if (isConsoleLayout()) {
        setCarouselHidden(false);
        const jumpInput = document.querySelector("[data-slide-jump-input]");
        if (jumpInput) {
            jumpInput.focus();
        }
        return true;
    }
    setPanelHidden("slide-list-panel", "layout-hide-list", false);
    const slideList = document.querySelector("[data-slide-list]");
    if (slideList && typeof slideList.scrollIntoView === "function") {
        slideList.scrollIntoView({ block: "nearest" });
    }
    return true;
}

function getRailPanels() {
    return Array.from(document.querySelectorAll("[data-rail-panel]"));
}

function getRailTabs() {
    return Array.from(document.querySelectorAll("[data-rail-tab]"));
}

function updateRailCollapsedState() {
    const stageBody = document.querySelector(".stage-body");
    const stageRail = document.querySelector(".stage-rail");
    if (!stageBody || !stageRail) {
        return;
    }
    const panels = getRailPanels();
    const tabs = getRailTabs();
    const hasVisibleTab = tabs.some((tab) => !tab.hidden);
    const hasActivePanel = panels.some(
        (panel) => panel.classList.contains("is-active") && !panel.classList.contains("is-hidden")
    );
    const shouldCollapse = !(hasVisibleTab && hasActivePanel);
    stageBody.classList.toggle("rail-collapsed", shouldCollapse);
    stageRail.hidden = shouldCollapse;
}

function isRailPanelAllowed(panel) {
    if (!panel || panel.classList.contains("is-hidden")) {
        return false;
    }
    const height = window.innerHeight || 0;
    if (panel.classList.contains("rail-focus") && height <= 980) {
        return false;
    }
    if (panel.classList.contains("rail-workflow") && height <= 880) {
        return false;
    }
    if (panel.classList.contains("rail-notes") && height <= 860) {
        return false;
    }
    if (panel.classList.contains("rail-live") && height <= 760) {
        return false;
    }
    if (panel.classList.contains("rail-next") && height <= 680) {
        return false;
    }
    return true;
}

function findFirstAvailableRailPanel(panels) {
    return panels.find((panel) => isRailPanelAllowed(panel)) || null;
}

function setActiveRailPanel(panelId) {
    const panels = getRailPanels();
    if (!panels.length) {
        return;
    }
    let activePanel = panels.find((panel) => panel.dataset.railPanel === panelId && isRailPanelAllowed(panel));
    if (!activePanel) {
        activePanel = findFirstAvailableRailPanel(panels);
    }
    if (!activePanel) {
        return;
    }
    hmiState.activeRailPanel = activePanel.dataset.railPanel || "next";
    panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel === activePanel);
    });
    getRailTabs().forEach((tab) => {
        const panel = panels.find((item) => item.dataset.railPanel === tab.dataset.railTab);
        const allowed = isRailPanelAllowed(panel);
        tab.hidden = !allowed;
        const isActive = allowed && tab.dataset.railTab === hmiState.activeRailPanel;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
}

function updateRailTabs() {
    setActiveRailPanel(hmiState.activeRailPanel || "next");
    updateRailCollapsedState();
}

function setupRailTabs() {
    const tabs = getRailTabs();
    if (!tabs.length) {
        return;
    }
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.railTab;
            if (!target) {
                return;
            }
            setActiveRailPanel(target);
        });
    });
    updateRailTabs();
}

function updateLiveCues(liveCues) {
    const pace = liveCues && liveCues.pace ? liveCues.pace : "not set";
    const audience = liveCues && liveCues.audience ? liveCues.audience : "not set";
    const focus = liveCues && liveCues.focus ? liveCues.focus : "";
    const plan = liveCues && liveCues.plan ? liveCues.plan : "";
    const success = liveCues && liveCues.success ? liveCues.success : "";

    setText("[data-live-pace]", `Pace: ${pace}`);
    setText("[data-live-audience]", `Audience: ${audience}`);
    setLiveTargetLabel(liveCues);

    const focusElement = document.querySelector("[data-live-focus]");
    if (focus) {
        setText("[data-live-focus]", `Focus: ${focus}`);
        setHidden(focusElement, false);
    } else {
        setHidden(focusElement, true);
    }

    const planElement = document.querySelector("[data-live-plan]");
    if (plan) {
        setText("[data-live-plan]", `Plan: ${plan}`);
        setHidden(planElement, false);
    } else {
        setHidden(planElement, true);
    }

    const successElement = document.querySelector("[data-live-success]");
    if (success) {
        setText("[data-live-success]", `Success: ${success}`);
        setHidden(successElement, false);
    } else {
        setHidden(successElement, true);
    }

    hmiState.lastLiveCues = liveCues || {};
}

function renderSlideList(slides, currentIndex) {
    const listElement = document.querySelector("[data-slide-list]");
    if (!listElement) {
        return;
    }
    clearElement(listElement);
    if (!slides || !slides.length) {
        return;
    }

    slides.forEach((slide, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "slide-list-item";
        button.dataset.slideJump = index.toString();
        if (index === currentIndex) {
            button.classList.add("is-active");
        }

        const number = document.createElement("div");
        number.className = "slide-list-number";
        number.textContent = `Slide ${index + 1}`;

        const title = document.createElement("div");
        title.className = "slide-list-title";
        title.textContent = slide.title || "Untitled slide";

        button.append(number, title);
        listElement.appendChild(button);
    });
}

function renderSlideJumpOptions(slides, currentIndex) {
    const input = document.querySelector("[data-slide-jump-input]");
    const list = document.querySelector("[data-slide-jump-list]");
    if (!input || !list) {
        return;
    }
    clearElement(list);
    if (!slides || !slides.length) {
        input.value = "";
        input.placeholder = "1";
        return;
    }
    slides.forEach((slide, index) => {
        const option = document.createElement("option");
        option.value = String(index + 1);
        option.label = `Slide ${index + 1}: ${slide.title || "Untitled"}`;
        list.appendChild(option);
    });
    input.value = String(currentIndex + 1);
    input.placeholder = String(slides.length);
    input.dataset.slideJumpMax = String(slides.length);
}

function updateCarouselMeta(slides, currentIndex) {
    setText("[data-carousel-index]", slides && slides.length ? `${currentIndex + 1}` : "0");
    setText("[data-carousel-count]", slides && slides.length ? `${slides.length}` : "0");
    const currentTitle = slides && slides.length ? slides[currentIndex].title || "Untitled slide" : "Not loaded";
    setText("[data-carousel-title]", currentTitle);
}

function getCarouselRange() {
    const width = window.innerWidth || 0;
    if (width && width < 960) {
        return 1;
    }
    return 2;
}

function getCarouselIndices(slides, currentIndex, range = 2) {
    if (!slides || !slides.length) {
        return [];
    }
    const total = slides.length;
    const indices = [];
    const seen = new Set();
    const safeRange = Math.min(Math.max(range, 1), Math.floor(total / 2));
    for (let offset = -safeRange; offset <= safeRange; offset += 1) {
        const index = (currentIndex + offset + total) % total;
        if (seen.has(index)) {
            continue;
        }
        indices.push({ index, offset });
        seen.add(index);
    }
    return indices;
}

function renderSlideCarousel(slides, currentIndex) {
    const track = document.querySelector("[data-slide-carousel]");
    if (!track) {
        return;
    }
    clearElement(track);
    if (!slides || !slides.length) {
        updateCarouselMeta(slides, currentIndex);
        renderSlideJumpOptions(slides, currentIndex);
        return;
    }
    const indices = getCarouselIndices(slides, currentIndex, getCarouselRange());
    const total = slides.length;
    indices.forEach((entry) => {
        const index = entry.index;
        const slide = slides[index];
        const button = document.createElement("button");
        button.type = "button";
        button.className = "carousel-item";
        button.dataset.slideJump = index.toString();
        if (entry.offset === 0) {
            button.classList.add("is-active");
            button.classList.add("carousel-item--current");
            button.setAttribute("aria-current", "true");
        } else if (entry.offset === -1) {
            button.classList.add("carousel-item--prev");
        } else if (entry.offset === 1) {
            button.classList.add("carousel-item--next");
        } else {
            button.classList.add("carousel-item--far");
        }

        const number = document.createElement("div");
        number.className = "carousel-item-number";
        number.textContent = `Slide ${index + 1}`;

        const title = document.createElement("div");
        title.className = "carousel-item-title";
        title.textContent = buildShortTitle(slide.title || "Untitled slide");

        button.append(number, title);
        track.appendChild(button);
    });
    updateCarouselMeta(slides, currentIndex);
    renderSlideJumpOptions(slides, currentIndex);
}

function parseSlideJumpValue(rawValue, total) {
    if (!rawValue || !total) {
        return null;
    }
    const match = String(rawValue).match(/(\d+)/);
    if (!match) {
        return null;
    }
    const number = Number.parseInt(match[1], 10);
    if (Number.isNaN(number) || number < 1 || number > total) {
        return null;
    }
    return number - 1;
}

function renderMarkdownBlock(container, markdown) {
    if (!container) {
        return;
    }
    clearElement(container);
    if (typeof markdown !== "string" || !markdown.trim()) {
        return;
    }
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    let list = null;

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            list = null;
            return;
        }
        const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
        if (headingMatch) {
            list = null;
            const level = headingMatch[1].length;
            const heading = document.createElement(`h${Math.min(level, 3)}`);
            heading.textContent = headingMatch[2];
            container.appendChild(heading);
            return;
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            if (!list) {
                list = document.createElement("ul");
                container.appendChild(list);
            }
            const item = document.createElement("li");
            item.textContent = trimmed.slice(2);
            list.appendChild(item);
            return;
        }
        list = null;
        const paragraph = document.createElement("p");
        paragraph.textContent = trimmed;
        container.appendChild(paragraph);
    });
}

function renderSlideBody(slide) {
    const bodyElement = document.querySelector("[data-slide-body]");
    if (!bodyElement) {
        return;
    }
    if (typeof slide.markdown === "string" && slide.markdown.trim()) {
        renderMarkdownBlock(bodyElement, slide.markdown);
        return;
    }
    setText("[data-slide-body]", slide.notes || slide.callout || slide.body || "");
}

function getSlideListItems(slide) {
    if (Array.isArray(slide.bullets)) {
        return slide.bullets;
    }
    if (Array.isArray(slide.metrics)) {
        return slide.metrics.map((metric) => {
            const label = metric.label || "Metric";
            const value = metric.value || "";
            return value ? `${label}: ${value}` : label;
        });
    }
    if (Array.isArray(slide.callouts)) {
        return slide.callouts;
    }
    return [];
}

function getAgendaItems(slides) {
    const agendaSlide = slides.find((slide) => slide.type === "agenda");
    if (agendaSlide && Array.isArray(agendaSlide.bullets)) {
        return agendaSlide.bullets;
    }
    return [];
}

function setupHelpDialog() {
    const helpButton = document.getElementById("help-button");
    const helpDialog = document.getElementById("help-dialog");
    const helpClose = document.getElementById("help-close");

    if (helpButton && helpDialog) {
        helpButton.addEventListener("click", () => {
            if (typeof helpDialog.showModal === "function") {
                helpDialog.showModal();
            } else {
                helpDialog.setAttribute("open", "open");
            }
        });
    }

    if (helpClose && helpDialog) {
        helpClose.addEventListener("click", () => {
            helpDialog.close();
        });
    }
}

function runMenuAction(action) {
    const deckInput = document.getElementById("deck-file-input");
    const deckSelect = document.getElementById("deck-select");
    const editor = document.getElementById("deck-editor-input");
    const loadButton = document.querySelector("[data-deck-load]");
    const applyButton = document.querySelector("[data-deck-apply]");
    const downloadButton = document.querySelector("[data-deck-download]");
    const jumpInput = document.querySelector("[data-slide-jump-input]");

    switch (action) {
        case "file-open":
            if (deckInput) {
                deckInput.click();
            }
            break;
        case "nav-prev":
            goToSlide(-1);
            break;
        case "nav-next":
            goToSlide(1);
            break;
        case "nav-first":
            goToSlideIndex(0);
            break;
        case "nav-last":
            goToSlideIndex(hmiState.scopeSlides.length - 1);
            break;
        case "nav-jump":
            if (jumpInput) {
                jumpInput.scrollIntoView({ behavior: "smooth", block: "center" });
                jumpInput.focus();
            }
            break;
        case "file-select":
            if (deckSelect) {
                deckSelect.scrollIntoView({ behavior: "smooth", block: "center" });
                deckSelect.focus();
            }
            break;
        case "file-reload":
            void reloadCurrentDeck();
            break;
        case "file-close":
            resetDeckState("Deck closed. Use File -> Open JSON... to load another.");
            break;
        case "file-download":
            if (downloadButton) {
                downloadButton.click();
            }
            break;
        case "edit-load":
            if (loadButton) {
                loadButton.click();
            }
            break;
        case "edit-apply":
            if (applyButton) {
                applyButton.click();
            }
            break;
        case "edit-clear":
            if (editor) {
                editor.value = "";
                updateEditorStatus("Editor cleared.");
            }
            break;
        case "view-toggle-list":
            if (isNewspaperLayout()) {
                return;
            }
            if (isConsoleLayout()) {
                toggleCarouselRow();
            } else {
                togglePanel("slide-list-panel", "layout-hide-list");
            }
            break;
        case "view-toggle-side":
            togglePanel("side-panel", "layout-hide-side");
            break;
        case "view-toggle-agenda":
            if (isConsoleLayout()) {
                toggleAgendaRow();
            } else {
                toggleDetails("agenda-panel");
            }
            break;
        case "view-toggle-notes":
            toggleRailCard("[data-rail-notes]");
            break;
        case "view-toggle-motion":
            applyReducedMotion(!hmiState.reducedMotion);
            updateReducedMotionToggle();
            break;
        case "view-toggle-insights":
            applyInsightsVisibility(!hmiState.insightsEnabled, true, true);
            break;
        case "view-toggle-media":
            applyMediaVisibility(!hmiState.mediaHidden);
            break;
        case "view-toggle-chart":
            applyChartVisibility(!hmiState.chartHidden);
            break;
        case "view-fullscreen":
            void toggleFullscreen(getFullscreenTargetElement());
            break;
        case "view-open-fullscreen":
            openFullscreenWindow();
            break;
        case "view-open-presenter":
            openPresenterWindow();
            break;
        case "view-layout-console":
            applyLayoutMode("console");
            resetLayout();
            adjustLayout();
            break;
        case "view-layout-newspaper":
            applyLayoutMode("newspaper");
            resetLayout();
            adjustLayout();
            break;
        case "view-layout-landscape":
            applyLayoutMode("landscape");
            resetLayout();
            adjustLayout();
            break;
        case "view-layout-portrait":
            applyLayoutMode("portrait");
            resetLayout();
            adjustLayout();
            break;
        case "view-theme-light":
            applyTheme("light");
            break;
        case "view-theme-dark":
            applyTheme("dark");
            break;
        case "view-theme-blues_green":
            applyTheme("blues_green");
            break;
        case "view-theme-quality_irrigation":
            applyTheme("quality_irrigation");
            break;
        case "view-theme-futuristic":
            applyTheme("futuristic");
            break;
        case "view-theme-soil_field":
            applyTheme("soil_field");
            break;
        case "view-theme-night_ops":
            applyTheme("night_ops");
            break;
        case "view-theme-high_contrast":
            applyTheme("high_contrast");
            break;
        case "view-theme-retro":
            applyTheme("retro");
            break;
        case "view-reset":
            resetLayout();
            break;
        case "help-open":
            openHelpDialog();
            break;
        default:
            break;
    }
}

function setupMenuBar() {
    const menuBar = document.querySelector(".menu-bar");
    if (!menuBar) {
        return;
    }

    menuBar.addEventListener("click", (event) => {
        const target = event.target.closest("[data-menu-action]");
        if (!target) {
            return;
        }
        runMenuAction(target.dataset.menuAction);
        closeOpenMenus();
    });

    document.addEventListener("click", (event) => {
        if (menuBar.contains(event.target)) {
            return;
        }
        closeOpenMenus();
    });
}

function updateInsightsToggle() {
    const toggles = document.querySelectorAll("[data-insights-toggle]");
    const label = hmiState.insightsEnabled ? "Insights: On" : "Insights: Off";
    toggles.forEach((toggle) => {
        toggle.textContent = label;
        toggle.classList.toggle("is-active", hmiState.insightsEnabled);
        toggle.setAttribute("aria-pressed", hmiState.insightsEnabled ? "true" : "false");
    });
}

function updateGamepadToggle() {
    const toggles = document.querySelectorAll("[data-gamepad-toggle]");
    const label = hmiState.gamepadEnabled ? "Gamepad input: On" : "Gamepad input: Off";
    toggles.forEach((toggle) => {
        toggle.textContent = label;
        toggle.setAttribute("aria-pressed", hmiState.gamepadEnabled ? "true" : "false");
    });
}

function applyPanelDefaultsFromConfig() {
    const config = readStoredConfig() || {};
    if (typeof config.carousel_hidden === "boolean") {
        setCarouselHidden(config.carousel_hidden);
    }
    if (typeof config.agenda_hidden === "boolean") {
        setAgendaRowHidden(config.agenda_hidden);
    }
    if (typeof config.slide_list_hidden === "boolean") {
        setPanelHidden("slide-list-panel", "layout-hide-list", config.slide_list_hidden);
    }
    if (typeof config.side_panel_hidden === "boolean") {
        setPanelHidden("side-panel", "layout-hide-side", config.side_panel_hidden);
    } else if (isConsoleLayout() && !isNewspaperLayout()) {
        setPanelHidden("side-panel", "layout-hide-side", true);
    }
    if (typeof config.notes_hidden === "boolean") {
        setRailHidden("[data-rail-notes]", config.notes_hidden);
    }
}

function setupWorkflowActions() {
    const openButtons = Array.from(document.querySelectorAll("[data-action=\"workflow-file-open\"]"));
    const selectButtons = Array.from(document.querySelectorAll("[data-action=\"workflow-file-select\"]"));
    openButtons.forEach((button) => {
        button.addEventListener("click", () => {
            runMenuAction("file-open");
        });
    });
    selectButtons.forEach((button) => {
        button.addEventListener("click", () => {
            runMenuAction("file-select");
        });
    });
}

function updateChartMetadataBadge(deckId, chartMetadata) {
    const badge = document.querySelector("[data-chart-metadata-badge]");
    if (!badge) {
        return;
    }
    if (!Array.isArray(chartMetadata) || chartMetadata.length === 0) {
        badge.classList.add("is-hidden");
        badge.removeAttribute("title");
        return;
    }
    const count = chartMetadata.length;
    badge.textContent = `Charts: DB (${count})`;
    if (deckId) {
        badge.title = `Chart metadata loaded from DB for ${deckId}`;
    }
    badge.classList.remove("is-hidden");
}

async function loadSlideCharts(deckId) {
    if (!deckId) {
        return [];
    }
    const response = await fetch(
        `${SLIDE_CHARTS_ENDPOINT}?deck_id=${encodeURIComponent(deckId)}`,
        { cache: "no-store" }
    );
    if (!response.ok) {
        return [];
    }
    const payload = await response.json();
    return Array.isArray(payload.charts) ? payload.charts : [];
}

function buildPlotlyChartFromMetadata(item) {
    if (!item) {
        return null;
    }
    const library = (item.chart_library || "plotly").toLowerCase();
    if (library !== "plotly") {
        return null;
    }
    const dataSpec = item.data_spec || {};
    const layoutSpec = item.layout_spec || {};
    const configSpec = item.config_spec || {};
    const data = Array.isArray(dataSpec)
        ? dataSpec
        : Array.isArray(dataSpec.data)
            ? dataSpec.data
            : [];
    const layout = layoutSpec && layoutSpec.layout ? layoutSpec.layout : layoutSpec;
    const config = configSpec && configSpec.config ? configSpec.config : configSpec;
    return {
        library: "plotly",
        title: item.chart_title || "",
        alt_text: item.alt_text || "",
        plotly: {
            data,
            layout,
            config
        }
    };
}

function mergeChartMetadataIntoSlides(data, chartMetadata) {
    if (!data || !Array.isArray(data.slides) || !Array.isArray(chartMetadata)) {
        return data;
    }
    const chartMap = new Map();
    chartMetadata.forEach((item) => {
        if (item && Number.isFinite(Number(item.slide_index))) {
            chartMap.set(Number(item.slide_index), item);
        }
    });
    if (!chartMap.size) {
        return data;
    }
    const slides = data.slides.map((slide, index) => {
        const item = chartMap.get(index + 1);
        if (!item) {
            return slide;
        }
        const chart = buildPlotlyChartFromMetadata(item);
        if (!chart) {
            return slide;
        }
        return { ...slide, chart };
    });
    return { ...data, slides };
}

async function loadSlideData() {
    const deckParam = hmiState.deckId ? `?deck=${encodeURIComponent(hmiState.deckId)}` : "";
    const response = await fetch(`${SLIDE_ENDPOINT}${deckParam}`, { cache: "no-store" });
    if (!response.ok) {
        throw new Error("Slide data request failed");
    }
    const data = await response.json();
    const resolvedDeckId = data && data.deck_id ? data.deck_id : hmiState.deckId;
    if (!resolvedDeckId) {
        updateChartMetadataBadge(null, []);
        return data;
    }
    try {
        const chartMetadata = await loadSlideCharts(resolvedDeckId);
        hmiState.chartMetadata = chartMetadata;
        updateChartMetadataBadge(resolvedDeckId, chartMetadata);
        return mergeChartMetadataIntoSlides(data, chartMetadata);
    } catch (error) {
        hmiState.chartMetadata = [];
        updateChartMetadataBadge(resolvedDeckId, []);
        return data;
    }
}

function updateCommon(slides, currentIndex) {
    setText("[data-slide-count]", slides.length.toString());
    setText("[data-slide-index]", (currentIndex + 1).toString());

    const nextIndex = (currentIndex + 1) % slides.length;
    const nextSlide = slides[nextIndex];
    if (nextSlide && nextSlide.title) {
        setText("[data-next-slide]", nextSlide.title);
    }
}

function normalizeDisplayTarget(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["presenter", "presenter_only", "presenter-only"].includes(normalized)) {
        return "presenter";
    }
    if (["projector", "audience", "audience_only", "projector_only", "projector-only"].includes(normalized)) {
        return "projector";
    }
    if (["both", "all", "default"].includes(normalized)) {
        return "both";
    }
    return "both";
}

function resolveDisplayTarget(item) {
    if (!item || typeof item !== "object") {
        return "both";
    }
    const displayValue = item.display || item.visibility || item.audience;
    return normalizeDisplayTarget(displayValue);
}

function isPresenterOnlyItem(item) {
    if (!item || typeof item !== "object") {
        return false;
    }
    if (item.presenter_only === true) {
        return true;
    }
    return resolveDisplayTarget(item) === "presenter";
}

function shouldShowPresenterItem(item, options = {}) {
    const defaultPresenterOnly = options.defaultPresenterOnly === true;
    if (!isProjectorView()) {
        return true;
    }
    const target = resolveDisplayTarget(item);
    if (defaultPresenterOnly && target === "both") {
        return false;
    }
    if (target === "projector") {
        return true;
    }
    if (target === "presenter") {
        return false;
    }
    return !isPresenterOnlyItem(item);
}

function updateSlideContent(slide) {
    setText("[data-slide-title]", slide.title);
    setText("[data-slide-subtitle]", slide.subtitle);
    updateSlideFocus(slide);
    const bodyElement = document.querySelector("[data-slide-body]");
    renderMarkdown(bodyElement, getMarkdownSource(slide), "No description provided.");
    setText("[data-qa-prompt]", slide.qa_prompt);
    setText("[data-photo-caption]", slide.caption);

    const bulletList = document.querySelector("[data-slide-bullets]");
    renderList(bulletList, getSlideListItems(slide));

    const mediaContainer = document.querySelector("[data-slide-media]");
    renderMedia(mediaContainer, slide.media);

    const chartContainer = document.querySelector("[data-slide-chart]");
    if (chartContainer) {
        disposeECharts(chartContainer);
        clearElement(chartContainer);
        if (slide.chart && shouldShowPresenterItem(slide.chart)) {
            renderChart(chartContainer, slide.chart);
        } else {
            setHidden(chartContainer, true);
        }
    }

    const qaContainer = document.querySelector("[data-slide-qa]");
    renderQA(qaContainer, slide.qa_prompt, slide.qa_options);

    const contactList = document.querySelector("[data-contact-list]");
    if (contactList) {
        clearElement(contactList);
        if (Array.isArray(slide.contacts)) {
            slide.contacts.forEach((contact) => addContactCard(contactList, contact));
        }
    }

    const metricList = document.querySelector("[data-metric-list]");
    if (metricList) {
        clearElement(metricList);
        if (Array.isArray(slide.metrics) && slide.metrics.length) {
            const visibleMetrics = slide.metrics.filter((metric) => shouldShowPresenterItem(metric, { defaultPresenterOnly: true }));
            visibleMetrics.forEach((metric) => addMetricCard(metricList, metric));
            setHidden(metricList, visibleMetrics.length === 0);
        } else {
            setHidden(metricList, true);
        }
    }

    const calloutList = document.querySelector("[data-callout-list]");
    if (calloutList) {
        clearElement(calloutList);
        if (Array.isArray(slide.callouts) && slide.callouts.length) {
            const visibleCallouts = slide.callouts.filter((callout) => shouldShowPresenterItem(callout, { defaultPresenterOnly: true }));
            visibleCallouts.forEach((callout) => addCallout(calloutList, callout));
            setHidden(calloutList, visibleCallouts.length === 0);
        } else {
            setHidden(calloutList, true);
        }
    }

    const slideAside = document.querySelector(".slide-preview-aside");
    if (slideAside) {
        const asideTitle = slideAside.querySelector("[data-slide-aside-title]");
        const asideCharts = slideAside.querySelector("[data-slide-aside-charts]");
        const chartList = Array.isArray(slide.aside_charts)
            ? slide.aside_charts
            : Array.isArray(slide.charts)
                ? slide.charts
                : (slide.chart ? [slide.chart] : []);
        const charts = chartList.filter((chart) => Boolean(chart) && shouldShowPresenterItem(chart, { defaultPresenterOnly: true })).slice(0, 2);
        const chartsEnabled = !hmiState.chartHidden;
        if (asideCharts) {
            clearElement(asideCharts);
            charts.forEach((chart) => {
                const card = document.createElement("div");
                card.className = "slide-preview-aside-card";
                const canvas = document.createElement("div");
                canvas.className = "slide-preview-aside-chart";
                card.appendChild(canvas);
                renderChart(canvas, chart);
                asideCharts.appendChild(card);
            });
            setHidden(asideCharts, charts.length === 0 || !chartsEnabled);
        }
        if (charts.length && chartsEnabled) {
            if (metricList) {
                setHidden(metricList, true);
            }
            if (calloutList) {
                setHidden(calloutList, true);
            }
        }
        const hasMetrics = metricList && !metricList.hidden;
        const hasCallouts = calloutList && !calloutList.hidden;
        const hasCharts = charts.length > 0 && chartsEnabled;
        if (asideTitle) {
            asideTitle.textContent = hasCharts ? "Slide charts" : "Key highlights";
        }
        setHidden(slideAside, !(hasCharts || hasMetrics || hasCallouts));
    }

    renderSpeakerNotes(slide.speaker_notes || slide.notes);
    updateLiveCues(slide.live_cues || {});
    updateActMarker(slide);
}

function updateSlideFocus(slide) {
    const focusElement = document.querySelector("[data-slide-focus]");
    if (!focusElement) {
        return;
    }
    const focus = slide && (slide.focus || (slide.live_cues && slide.live_cues.focus))
        ? (slide.focus || slide.live_cues.focus)
        : "";
    if (focus) {
        focusElement.textContent = `Focus: ${focus}`;
        setHidden(focusElement, false);
    } else {
        setHidden(focusElement, true);
    }
}

function updateDeckFocus(data) {
    const goalElement = document.querySelector("[data-deck-goal]");
    const focusElement = document.querySelector("[data-deck-focus]");
    const prioritiesElement = document.querySelector("[data-deck-priorities]");
    const successElement = document.querySelector("[data-deck-success]");

    const goal = data && data.deck_goal ? `Goal: ${data.deck_goal}` : "Goal: not set.";
    const focus = data && data.deck_focus ? `Focus: ${data.deck_focus}` : "Focus: not set.";
    setText("[data-deck-goal]", goal);
    setText("[data-deck-focus]", focus);

    renderList(prioritiesElement, data && Array.isArray(data.deck_priorities) ? data.deck_priorities : []);
    renderList(successElement, data && Array.isArray(data.deck_success_criteria) ? data.deck_success_criteria : []);
}

function setWorkflowStepState(step, isComplete) {
    const element = document.querySelector(`[data-workflow-step=\"${step}\"]`);
    if (!element) {
        return;
    }
    element.classList.toggle("is-complete", Boolean(isComplete));
}

function countSlidesWithNotes(slides) {
    if (!Array.isArray(slides)) {
        return 0;
    }
    return slides.filter((slide) => {
        if (!slide) {
            return false;
        }
        if (Array.isArray(slide.speaker_notes) && slide.speaker_notes.length) {
            return true;
        }
        if (slide.notes && String(slide.notes).trim()) {
            return true;
        }
        if (slide.markdown && String(slide.markdown).trim()) {
            return true;
        }
        if (slide.body && String(slide.body).trim()) {
            return true;
        }
        return false;
    }).length;
}

function updateWorkflowStatus() {
    const deckLoaded = Boolean(hmiState.deckData && Array.isArray(hmiState.slides) && hmiState.slides.length);
    const deckLabel = deckLoaded ? (hmiState.deckTitle || "Deck loaded") : "Not loaded";
    const agendaCount = hmiState.agendaItems ? hmiState.agendaItems.length : 0;
    const counts = hmiState.slides.reduce(
        (acc, slide) => {
            const media = slide && slide.media ? slide.media : null;
            if (media && media.type === "image") {
                acc.images += 1;
            }
            if (media && media.type === "video") {
                acc.videos += 1;
            }
            return acc;
        },
        { images: 0, videos: 0 }
    );
    const notesCount = countSlidesWithNotes(hmiState.slides);

    setText("[data-workflow-deck]", deckLabel);
    setText("[data-workflow-agenda]", `${agendaCount} sections`);
    setText("[data-workflow-media]", `Images: ${counts.images} · Videos: ${counts.videos}`);
    setText("[data-workflow-notes]", `Notes: ${notesCount}`);
    setText("[data-workflow-live]", hmiState.timerPaused ? "Timer paused" : "Timer ready");

    setWorkflowStepState("load", deckLoaded);
    setWorkflowStepState("agenda", agendaCount > 0);
    setWorkflowStepState("media", counts.images + counts.videos > 0);
    setWorkflowStepState("notes", notesCount > 0);
    setWorkflowStepState("live", !hmiState.timerPaused);
}

function getRunId() {
    const input = document.getElementById("presentation-run-id");
    if (!input) {
        return null;
    }
    const value = input.value.trim();
    if (!value) {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

function getPresentationVersionId() {
    const input = document.getElementById("presentation-version-id");
    if (!input) {
        return null;
    }
    const value = input.value.trim();
    if (!value) {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

function getPresenterName() {
    const input = document.getElementById("presenter-name");
    if (!input) {
        return null;
    }
    const value = input.value.trim();
    return value ? value : null;
}

function getPresentationId() {
    const input = document.getElementById("presentation-id");
    if (!input) {
        return null;
    }
    const value = input.value.trim();
    if (!value) {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

function getPresentationTitle() {
    const input = document.getElementById("presentation-title");
    if (!input) {
        return "";
    }
    return input.value.trim();
}

function getPresentationDescription() {
    const input = document.getElementById("presentation-description");
    if (!input) {
        return "";
    }
    return input.value.trim();
}

function getVersionLabel() {
    const input = document.getElementById("presentation-version-label");
    if (!input) {
        return "";
    }
    return input.value.trim();
}

function getVersionNotes() {
    const input = document.getElementById("presentation-version-notes");
    if (!input) {
        return "";
    }
    return input.value.trim();
}

async function logPresenterAction(eventType, slide) {
    const runId = getRunId();
    if (!runId) {
        return;
    }

    const payload = {
        slide_id: slide.id,
        slide_type: slide.type,
        slide_index: hmiState.currentIndex + 1
    };

    try {
        await fetch(PRESENTER_ACTION_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                presentation_run_id: runId,
                event_type: eventType,
                payload
            })
        });
    } catch (error) {
        console.warn("Presenter action logging failed.");
    }
}

async function createPresentationRun() {
    const versionId = getPresentationVersionId();
    if (!versionId) {
        updateRunStatus("Enter a presentation version ID first.");
        return;
    }

    const payload = {
        presentation_version_id: versionId
    };
    const presenterName = getPresenterName();
    if (presenterName) {
        payload.presenter_name = presenterName;
    }

    updateRunStatus("Creating run log...");
    try {
        const response = await fetch(PRESENTATION_RUN_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            updateRunStatus("Run log create failed.");
            return;
        }
        const data = await response.json();
        const runIdInput = document.getElementById("presentation-run-id");
        if (runIdInput && data.presentation_run_id) {
            runIdInput.value = data.presentation_run_id;
        }
        updateRunStatus(`Run log created (ID ${data.presentation_run_id}).`);
    } catch (error) {
        updateRunStatus("Run log create failed.");
    }
}

async function createPresentationVersion() {
    const versionLabel = getVersionLabel();
    if (!versionLabel) {
        updateVersionStatus("Enter a version label first.");
        return;
    }

    const payload = {
        version_label: versionLabel
    };

    const presentationId = getPresentationId();
    if (presentationId) {
        payload.presentation_id = presentationId;
    } else {
        const title = getPresentationTitle();
        if (!title) {
            updateVersionStatus("Enter a presentation title or ID.");
            return;
        }
        payload.presentation_title = title;
        const description = getPresentationDescription();
        if (description) {
            payload.presentation_description = description;
        }
    }

    const notes = getVersionNotes();
    if (notes) {
        payload.notes = notes;
    }

    updateVersionStatus("Creating version...");
    try {
        const response = await fetch(PRESENTATION_VERSION_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            updateVersionStatus("Version create failed.");
            return;
        }
        const data = await response.json();
        const versionInput = document.getElementById("presentation-version-id");
        if (versionInput && data.presentation_version_id) {
            versionInput.value = data.presentation_version_id;
        }
        const presentationInput = document.getElementById("presentation-id");
        if (presentationInput && data.presentation_id) {
            presentationInput.value = data.presentation_id;
        }
        updateVersionStatus(`Version created (ID ${data.presentation_version_id}).`);
    } catch (error) {
        updateVersionStatus("Version create failed.");
    }
}

function formatTimestamp(value) {
    if (!value) {
        return "";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value.toString();
    }
    return parsed.toLocaleString();
}

function renderPresentationVersions(versions) {
    const list = document.querySelector("[data-version-list]");
    if (!list) {
        return;
    }
    clearElement(list);

    if (!Array.isArray(versions) || versions.length === 0) {
        updateVersionListStatus("No versions found.");
        return;
    }

    versions.forEach((version) => {
        const item = document.createElement("div");
        item.className = "version-item";

        const title = document.createElement("div");
        title.className = "version-title";
        title.textContent = version.presentation_title || "Untitled presentation";

        const meta = document.createElement("div");
        meta.className = "version-meta";
        meta.textContent = `Version ${version.version_label} (ID ${version.presentation_version_id})`;

        let created = null;
        const createdText = formatTimestamp(version.created_at);
        if (createdText) {
            created = document.createElement("div");
            created.className = "version-meta";
            created.textContent = `Created: ${createdText}`;
        }

        const actions = document.createElement("div");
        actions.className = "version-actions";
        const useButton = document.createElement("button");
        useButton.type = "button";
        useButton.className = "version-use";
        useButton.dataset.versionId = version.presentation_version_id;
        useButton.textContent = "Use version ID";
        actions.appendChild(useButton);

        if (created) {
            item.append(title, meta, created, actions);
        } else {
            item.append(title, meta, actions);
        }
        list.appendChild(item);
    });

    updateVersionListStatus("List updated.");
}

async function loadPresentationVersions() {
    updateVersionListStatus("Loading versions...");
    try {
        const response = await fetch(PRESENTATION_VERSION_ENDPOINT);
        if (!response.ok) {
            updateVersionListStatus("Version list failed.");
            return;
        }
        const data = await response.json();
        renderPresentationVersions(data.versions || []);
    } catch (error) {
        updateVersionListStatus("Version list failed.");
    }
}

function getScopeSlides(slides, slideType, slideScope) {
    if (slideScope === "type") {
        const filtered = slides.filter((item) => item.type === slideType);
        if (filtered.length) {
            return filtered;
        }
    }
    return slides;
}

function renderSlide() {
    if (!hmiState.scopeSlides.length) {
        return;
    }
    const slide = hmiState.scopeSlides[hmiState.currentIndex];
    document.body.dataset.activeSlideType = slide.type || "";
    applySlideClampMode(slide);
    const agendaIndex = Number.isInteger(slide.agenda_index) ? slide.agenda_index - 1 : null;
    renderAgenda(hmiState.agendaItems, agendaIndex);
    renderAgendaChips(hmiState.agendaItems, agendaIndex);
    renderSlideList(hmiState.scopeSlides, hmiState.currentIndex);
    renderSlideCarousel(hmiState.scopeSlides, hmiState.currentIndex);
    updateCommon(hmiState.scopeSlides, hmiState.currentIndex);
    updateSlideContent(slide);
    if (shouldRenderPresenterPanel()) {
        renderPresenterPanel(buildSlidePayload());
    }
    fitSlidePreview();
    hmiState.slideStart = Date.now();
    broadcastSlideState();
}

function goToSlideIndex(index) {
    const total = hmiState.scopeSlides.length;
    if (!total) {
        return;
    }
    const nextIndex = Math.max(0, Math.min(total - 1, index));
    hmiState.currentIndex = nextIndex;
    const slide = hmiState.scopeSlides[hmiState.currentIndex];
    renderSlide();
    void logPresenterAction("jump", slide);
}

function goToSlide(delta) {
    const total = hmiState.scopeSlides.length;
    if (!total) {
        return;
    }
    hmiState.currentIndex = (hmiState.currentIndex + delta + total) % total;
    const slide = hmiState.scopeSlides[hmiState.currentIndex];
    renderSlide();
    void logPresenterAction(delta > 0 ? "next" : "previous", slide);
}

function setupNavigation() {
    const prevButton = document.querySelector("[data-action=\"prev\"]");
    const nextButton = document.querySelector("[data-action=\"next\"]");
    const slideList = document.querySelector("[data-slide-list]");
    const carouselTrack = document.querySelector("[data-slide-carousel]");
    const jumpInput = document.querySelector("[data-slide-jump-input]");

    if (prevButton) {
        prevButton.addEventListener("click", () => goToSlide(-1));
    }
    if (nextButton) {
        nextButton.addEventListener("click", () => goToSlide(1));
    }
    if (slideList) {
        slideList.addEventListener("click", (event) => {
            const target = event.target.closest("[data-slide-jump]");
            if (!target) {
                return;
            }
            const index = Number.parseInt(target.dataset.slideJump, 10);
            if (Number.isNaN(index)) {
                return;
            }
            hmiState.currentIndex = index;
            const slide = hmiState.scopeSlides[hmiState.currentIndex];
            renderSlide();
            void logPresenterAction("jump", slide);
        });
    }
    if (carouselTrack) {
        carouselTrack.addEventListener("click", (event) => {
            const target = event.target.closest("[data-slide-jump]");
            if (!target) {
                return;
            }
            const index = Number.parseInt(target.dataset.slideJump, 10);
            if (Number.isNaN(index)) {
                return;
            }
            hmiState.currentIndex = index;
            const slide = hmiState.scopeSlides[hmiState.currentIndex];
            renderSlide();
            void logPresenterAction("jump", slide);
        });
    }
    if (jumpInput) {
        const jumpToInputValue = () => {
            const total = Array.isArray(hmiState.scopeSlides) ? hmiState.scopeSlides.length : 0;
            const index = parseSlideJumpValue(jumpInput.value, total);
            if (index === null) {
                return;
            }
            hmiState.currentIndex = index;
            const slide = hmiState.scopeSlides[hmiState.currentIndex];
            renderSlide();
            void logPresenterAction("jump", slide);
        };
        jumpInput.addEventListener("change", jumpToInputValue);
        jumpInput.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") {
                return;
            }
            event.preventDefault();
            jumpToInputValue();
        });
    }
}

function setupAgendaPopoverControls() {
    const chipsElement = document.querySelector("[data-agenda-chips]");
    if (!chipsElement) {
        return;
    }

    chipsElement.addEventListener("click", (event) => {
        const target = event.target.closest("[data-agenda-index]");
        if (!target) {
            return;
        }
        const index = Number.parseInt(target.dataset.agendaIndex, 10);
        if (Number.isNaN(index)) {
            return;
        }
        if (!hmiState.agendaDetailsEnabled) {
            hmiState.activeAgendaIndex = index;
            closeAgendaPopover();
            setAgendaMessage("");
            return;
        }
        if (hmiState.activeAgendaIndex === index && !document.querySelector("[data-agenda-popover]")?.hidden) {
            hmiState.activeAgendaIndex = null;
            closeAgendaPopover();
            setAgendaMessage("");
            return;
        }
        hmiState.activeAgendaIndex = index;
        const label = target.textContent ? target.textContent.trim() : "Agenda detail";
        const matches = getAgendaSlideMatches(index);
        let openedList = false;
        if (!matches.length) {
            openedList = openSlideListFallback();
            setAgendaMessage("No slides found. Slide list opened.");
        } else {
            setAgendaMessage("");
        }
        openAgendaPopover(label, matches, target, openedList);
    });

    document.addEventListener("click", (event) => {
        const popover = document.querySelector("[data-agenda-popover]");
        if (!popover || popover.hidden) {
            return;
        }
        if (event.target.closest("[data-agenda-popover]") || event.target.closest("[data-agenda-index]")) {
            return;
        }
        hmiState.activeAgendaIndex = null;
        closeAgendaPopover();
    });

    window.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }
        const popover = document.querySelector("[data-agenda-popover]");
        if (!popover || popover.hidden) {
            return;
        }
        hmiState.activeAgendaIndex = null;
        closeAgendaPopover();
        setAgendaMessage("");
    });
}

function startLiveTimer() {
    const elapsedElement = document.querySelector("[data-live-elapsed]");
    const clockElement = document.querySelector("[data-live-clock]");
    const slideElement = document.querySelector("[data-live-slide]");
    if (!elapsedElement && !clockElement) {
        return;
    }
    updateLiveTimerToggle();
    if (hmiState.timerPaused) {
        return;
    }

    if (!hmiState.presentationStart) {
        hmiState.presentationStart = Date.now();
    }
    setLiveTargetLabel({});

    const update = () => {
        const elapsedSeconds = Math.floor((Date.now() - hmiState.presentationStart) / 1000);
        if (elapsedElement) {
            elapsedElement.textContent = `Elapsed: ${formatElapsed(elapsedSeconds)}`;
        }
        const slideSeconds = hmiState.slideStart ? Math.floor((Date.now() - hmiState.slideStart) / 1000) : 0;
        if (slideElement) {
            slideElement.textContent = `Slide: ${formatElapsed(slideSeconds)}`;
        }
        let clockText = "";
        if (clockElement) {
            const now = new Date();
            const formatted = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            clockElement.textContent = `Clock: ${formatted}`;
            clockText = formatted;
        }
        const liveState = {
            elapsedSeconds,
            slideSeconds,
            clock: clockText,
            liveCues: hmiState.lastLiveCues || {}
        };
        broadcastLiveState(liveState);
        renderPresenterLiveState(liveState);
    };

    if (hmiState.timerInterval) {
        clearInterval(hmiState.timerInterval);
    }
    update();
    hmiState.timerInterval = window.setInterval(update, 1000);
}

function updateLiveTimerToggle() {
    const toggle = document.querySelector("[data-live-toggle]");
    const status = document.querySelector("[data-live-toggle-status]");
    if (!toggle && !status) {
        return;
    }
    const isPaused = hmiState.timerPaused;
    if (toggle) {
        toggle.textContent = isPaused ? "Resume timer" : "Pause timer";
        toggle.classList.toggle("is-paused", isPaused);
        toggle.setAttribute("aria-pressed", isPaused ? "true" : "false");
    }
    if (status) {
        status.textContent = isPaused ? "Timer paused" : "Timer running";
    }
    updateWorkflowStatus();
}

function pauseLiveTimer() {
    if (hmiState.timerPaused) {
        return;
    }
    hmiState.timerPaused = true;
    hmiState.timerPausedAt = Date.now();
    if (hmiState.timerInterval) {
        clearInterval(hmiState.timerInterval);
        hmiState.timerInterval = null;
    }
    updateLiveTimerToggle();
}

function resumeLiveTimer() {
    if (!hmiState.timerPaused) {
        return;
    }
    const pausedAt = hmiState.timerPausedAt || Date.now();
    const pauseDuration = Date.now() - pausedAt;
    if (hmiState.presentationStart) {
        hmiState.presentationStart += pauseDuration;
    }
    if (hmiState.slideStart) {
        hmiState.slideStart += pauseDuration;
    }
    hmiState.timerPaused = false;
    hmiState.timerPausedAt = null;
    startLiveTimer();
}

function toggleLiveTimer() {
    if (hmiState.timerPaused) {
        resumeLiveTimer();
        return;
    }
    pauseLiveTimer();
}

function setupLiveTimerControls() {
    const toggle = document.querySelector("[data-live-toggle]");
    if (!toggle) {
        return;
    }
    toggle.addEventListener("click", () => {
        toggleLiveTimer();
    });
    updateLiveTimerToggle();
}

function updateDeckStatus(message) {
    const statusElement = document.querySelector("[data-deck-file-status]");
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function updateDeckSelectStatus(message) {
    const statusElement = document.querySelector("[data-deck-select-status]");
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function updateDeckDetails(deckInfo) {
    const description = deckInfo && deckInfo.description
        ? deckInfo.description
        : "Deck description not available.";
    setText("[data-deck-description]", description);

    const fileLabel = deckInfo && deckInfo.file
        ? `File: ${deckInfo.file}`
        : "File: not set";
    setText("[data-deck-file]", fileLabel);
}

function updateEditorStatus(message) {
    const statusElement = document.querySelector("[data-deck-editor-status]");
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function updateRunStatus(message) {
    const statusElement = document.querySelector("[data-run-status]");
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function updateVersionStatus(message) {
    const statusElement = document.querySelector("[data-version-status]");
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function updateVersionListStatus(message) {
    const statusElement = document.querySelector("[data-version-list-status]");
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function serializeDeckData() {
    if (!hmiState.deckData) {
        return "";
    }
    return JSON.stringify(hmiState.deckData, null, 2);
}

function applySlideData(data, sourceLabel) {
    hmiState.slides = Array.isArray(data.slides) ? data.slides : [];
    hmiState.deckData = data;
    if (data && data.deck_title) {
        hmiState.deckTitle = data.deck_title;
        setText("[data-deck-title]", `Deck: ${data.deck_title}`);
    }
    updateDeckFocus(data);
    if (!hmiState.slides.length) {
        clearSlideView("Slide data unavailable (local file missing or invalid).");
        setBootstrapWarning("Slide data missing. Check /api/slides.");
        updateWorkflowStatus();
        return;
    }

    hmiState.agendaItems = getAgendaItems(hmiState.slides);
    hmiState.scopeSlides = getScopeSlides(
        hmiState.slides,
        hmiState.slideType,
        hmiState.slideScope
    );
    const requestedIndex = resolveRequestedSlideIndex(hmiState.scopeSlides.length);
    hmiState.currentIndex = requestedIndex !== null ? requestedIndex : 0;
    renderSlide();
    fitSlidePreview();
    updateWorkflowStatus();
    clearBootstrapWarning();
    if (sourceLabel) {
        updateDeckStatus(sourceLabel);
    }
}

function setupDeckEditor() {
    const editor = document.getElementById("deck-editor-input");
    const loadButton = document.querySelector("[data-deck-load]");
    const applyButton = document.querySelector("[data-deck-apply]");
    const downloadButton = document.querySelector("[data-deck-download]");

    if (!editor) {
        return;
    }

    if (loadButton) {
        loadButton.addEventListener("click", () => {
            const content = serializeDeckData();
            if (!content) {
                updateEditorStatus("No deck loaded yet.");
                return;
            }
            editor.value = content;
            updateEditorStatus("Loaded current deck into editor.");
        });
    }

    if (applyButton) {
        applyButton.addEventListener("click", () => {
            if (!editor.value.trim()) {
                updateEditorStatus("Editor is empty.");
                return;
            }
            try {
                const data = JSON.parse(editor.value);
                applySlideData(data, "Using editor deck.");
                updateEditorStatus("Editor applied.");
            } catch (error) {
                updateEditorStatus("Invalid JSON. Fix errors and try again.");
            }
        });
    }

    if (downloadButton) {
        downloadButton.addEventListener("click", () => {
            const content = editor.value.trim() || serializeDeckData();
            if (!content) {
                updateEditorStatus("Nothing to download.");
                return;
            }
            const blob = new Blob([content], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = hmiState.deckFileName || "master_irrigator_slide_deck.json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            updateEditorStatus("JSON download started.");
        });
    }
}

function setupDeckFileLoader() {
    const input = document.getElementById("deck-file-input");
    if (!input) {
        return;
    }
    input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) {
            return;
        }
        hmiState.deckId = null;
        hmiState.deckFileName = file.name;
        updateDeckSelectStatus("Using custom file.");
        updateDeckDetails({
            description: "Custom deck loaded from file.",
            file: file.name
        });
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                applySlideData(data, `Loaded ${file.name}`);
            } catch (error) {
                updateDeckStatus("Invalid JSON file.");
            }
            input.value = "";
        };
        reader.readAsText(file);
    });
}

function getDeckInfo(deckId) {
    if (!hmiState.deckCatalog || !Array.isArray(hmiState.deckCatalog.decks)) {
        return null;
    }
    return hmiState.deckCatalog.decks.find((deck) => deck.id === deckId) || null;
}

async function loadDeckCatalog() {
    const response = await fetch(DECK_LIST_ENDPOINT, { cache: "no-store" });
    if (!response.ok) {
        throw new Error("Deck list request failed");
    }
    return response.json();
}

async function setupDeckSelector() {
    const select = document.getElementById("deck-select");
    if (!select) {
        return;
    }
    try {
        const catalog = await loadDeckCatalog();
        hmiState.deckCatalog = catalog;
        const decks = Array.isArray(catalog.decks) ? catalog.decks : [];
        if (!decks.length) {
            updateDeckSelectStatus("No decks available.");
            return;
        }
        clearElement(select);
        decks.forEach((deck) => {
            const option = document.createElement("option");
            option.value = deck.id;
            option.textContent = deck.title || deck.id;
            select.appendChild(option);
        });
        const initialDeckId = catalog.default_deck_id || decks[0].id;
        select.value = initialDeckId;
        const activeDeck = getDeckInfo(initialDeckId);
        if (activeDeck) {
            hmiState.deckId = activeDeck.id;
            hmiState.deckFileName = activeDeck.file || hmiState.deckFileName;
            hmiState.deckTitle = activeDeck.title || "";
            updateDeckSelectStatus(`Selected: ${activeDeck.title || activeDeck.id}`);
            if (activeDeck.title) {
                setText("[data-deck-title]", `Deck: ${activeDeck.title}`);
            }
            updateDeckDetails(activeDeck);
        }
        select.addEventListener("change", async () => {
            const deckId = select.value;
            const deckInfo = getDeckInfo(deckId);
            hmiState.deckId = deckId;
            if (deckInfo) {
                hmiState.deckFileName = deckInfo.file || hmiState.deckFileName;
                hmiState.deckTitle = deckInfo.title || "";
                updateDeckSelectStatus(`Selected: ${deckInfo.title || deckId}`);
                if (deckInfo.title) {
                    setText("[data-deck-title]", `Deck: ${deckInfo.title}`);
                }
                updateDeckDetails(deckInfo);
            }
            try {
                const data = await loadSlideData(deckId);
                applySlideData(data, `Using deck: ${deckInfo ? deckInfo.title : deckId}`);
            } catch (error) {
                updateDeckStatus("Failed to load selected deck.");
            }
        });
    } catch (error) {
        updateDeckSelectStatus("Deck list unavailable (API only).");
        updateDeckDetails(null);
    }
}

function setupRunLogControls() {
    const startButton = document.querySelector("[data-run-start]");
    if (!startButton) {
        return;
    }
    startButton.addEventListener("click", () => {
        void createPresentationRun();
    });
}

function setupPresentationVersionControls() {
    const createButton = document.querySelector("[data-version-create]");
    if (!createButton) {
        return;
    }
    createButton.addEventListener("click", () => {
        void createPresentationVersion();
    });
}

function setupPresentationVersionList() {
    const refreshButton = document.querySelector("[data-version-refresh]");
    const list = document.querySelector("[data-version-list]");

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            void loadPresentationVersions();
        });
    }

    if (list) {
        list.addEventListener("click", (event) => {
            const target = event.target.closest("[data-version-id]");
            if (!target) {
                return;
            }
            const value = Number.parseInt(target.dataset.versionId, 10);
            if (Number.isNaN(value)) {
                return;
            }
            const versionInput = document.getElementById("presentation-version-id");
            if (versionInput) {
                versionInput.value = value;
            }
            updateRunStatus(`Version ID set to ${value}.`);
        });
    }

    void loadPresentationVersions();
}

async function initHmi() {
    applyViewModeFromUrl();
    applyLayoutMode(getInitialLayout(), false);
    applyTheme(getInitialTheme());
    applyReducedMotion(getInitialReducedMotion());
    applyContentDensity(getInitialContentDensity());
    applyInsightsVisibility(getInitialInsightsEnabled(), false, false);
    applyMediaVisibility(getInitialMediaHidden(), false);
    applyChartVisibility(getInitialChartHidden(), false);
    applyGamepadEnabled(getInitialGamepadEnabled(), false);
    applyAgendaDetails(false);
    adjustLayout();
    updateReducedMotionToggle();
    updateInsightsToggle();
    updateMediaToggle();
    updateChartToggle();
    updateGamepadToggle();
    applyPanelDefaultsFromConfig();
    setupFullscreenControls();
    setupPresenterControls();
    setupKeyboardShortcuts();
    setupGamepadControls();
    setupPresentationChannel();
    setupHelpDialog();
    setupMenuBar();
    setupThemeMenuSelect();
    setupDeckToolsFloatingPanel();
    setupWorkflowActions();
    setupNavigation();
    setupAgendaDetailsToggle();
    setupAgendaPopoverControls();
    setupRailTabs();
    setupDeckFileLoader();
    setupDeckEditor();
    await setupDeckSelector();
    setupPresentationVersionControls();
    setupPresentationVersionList();
    setupRunLogControls();
    setupLiveTimerControls();
    startLiveTimer();
    if (shouldOpenHelpFromUrl()) {
        openHelpDialog();
    }

    hmiState.slideType = document.body.dataset.slideType || "title";
    hmiState.slideScope = document.body.dataset.slideScope || "deck";
    try {
        const data = await loadSlideData(hmiState.deckId);
        const label = data && data.deck_title ? `Using deck: ${data.deck_title}` : "Using server deck.";
        applySlideData(data, label);
    } catch (error) {
        updateDeckStatus("Slide data unavailable (load failed).");
        if (!hmiState.deckData || !(Array.isArray(hmiState.deckData.slides) && hmiState.deckData.slides.length)) {
            setBootstrapWarning("Slide data unavailable (load failed).");
        }
    }
    // Safety: if slides cleared, rehydrate from deckData.
    if ((!hmiState.slides || !hmiState.slides.length) && hmiState.deckData && Array.isArray(hmiState.deckData.slides) && hmiState.deckData.slides.length) {
        applySlideData(hmiState.deckData, "Recovered deck data.");
    }
    void setupPresenterInsights();
    // Hide bootstrap warning after load attempt.
    clearBootstrapWarning();
}

document.addEventListener("DOMContentLoaded", () => {
    setBootstrapWarning(BOOTSTRAP_LOADING_MESSAGE);
    checkStyleHealth();
    window.setTimeout(checkStyleHealth, 500);
    void initHmi();
});

window.addEventListener("load", () => {
    checkStyleHealth();
});

window.addEventListener("resize", () => {
    adjustLayout();
    updateRailTabs();
    resizeECharts();
    if (hmiState.contentDensity === "auto") {
        applyContentDensity("auto", false);
    }
});

window.addEventListener("error", (event) => {
    if (event && event.message) {
        setBootstrapWarning(`HMI error: ${event.message}`);
    }
});

window.addEventListener("unhandledrejection", (event) => {
    if (event && event.reason) {
        setBootstrapWarning(`HMI error: ${event.reason}`);
    }
});
