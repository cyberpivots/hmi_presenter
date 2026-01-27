const SLIDES_ENDPOINT = "/api/slides";
const SLIDE_CHARTS_ENDPOINT = "/api/slide-charts";

const byRole = (role) => document.querySelector(`.js-hmi[data-role="${role}"]`);

const deckInput = byRole("deck-input");
const loadDeckButton = byRole("load-deck");
const prevSlideButton = byRole("prev-slide");
const nextSlideButton = byRole("next-slide");
const slideStatus = byRole("slide-status");
const slideList = byRole("slide-list");
const stageTitle = byRole("stage-title");
const stageBody = byRole("stage-body");
const stageMedia = byRole("stage-media");
const stageChart = byRole("stage-chart");
const rawJson = byRole("slide-raw");

let slideData = [];
let chartMap = new Map();
let currentSlideIndex = 0;

const setText = (el, value) => {
    if (el) {
        el.textContent = value;
    }
};

const isProjector = () => document.body.classList.contains("hmi-projector");

const sanitizeEChartsOption = (option) => {
    if (!option || typeof option !== "object") {
        return null;
    }
    if (!isProjector()) {
        return option;
    }
    let updated = option;
    if (Object.prototype.hasOwnProperty.call(option, "dataZoom")) {
        updated = { ...updated, dataZoom: [] };
    }
    const toolbox = option.toolbox;
    if (toolbox && typeof toolbox === "object") {
        const feature = toolbox.feature;
        if (feature && typeof feature === "object" && Object.prototype.hasOwnProperty.call(feature, "dataZoom")) {
            const nextFeature = { ...feature };
            delete nextFeature.dataZoom;
            updated = { ...updated, toolbox: { ...toolbox, feature: nextFeature } };
        }
    }
    return updated;
};

const parseSlideTitle = (slide) => slide?.title || slide?.slide_title || slide?.heading || "Untitled slide";
const parseSlideBody = (slide) => slide?.body || slide?.slide_body || slide?.text || "";

const parseMediaUrl = (slide) => {
    const candidate = slide?.media || slide?.image || slide?.photo || slide?.media_url || "";
    return typeof candidate === "string" ? candidate : "";
};

const renderChart = (chartMeta) => {
    if (!stageChart) {
        return;
    }
    stageChart.innerHTML = "";
    if (!chartMeta || chartMeta.chart_library?.toLowerCase() !== "echarts") {
        return;
    }
    if (typeof window.echarts !== "object") {
        setText(slideStatus, "ECharts is not available.");
        return;
    }
    const option = sanitizeEChartsOption(chartMeta.data_spec);
    if (!option) {
        return;
    }
    const canvas = document.createElement("div");
    canvas.className = "stage-chart";
    stageChart.appendChild(canvas);
    const instance = window.echarts.init(canvas);
    instance.setOption(option, true);
};

const renderSlide = () => {
    const slide = slideData[currentSlideIndex];
    if (!slide) {
        setText(stageTitle, "No slide data");
        setText(stageBody, "");
        if (stageMedia) {
            stageMedia.style.display = "none";
        }
        if (rawJson) {
            rawJson.textContent = "";
        }
        renderChart(null);
        return;
    }
    setText(stageTitle, parseSlideTitle(slide));
    setText(stageBody, parseSlideBody(slide));

    const mediaUrl = parseMediaUrl(slide);
    if (stageMedia) {
        if (mediaUrl) {
            stageMedia.src = mediaUrl;
            stageMedia.alt = slide?.media_alt || slide?.alt_text || "Slide media";
            stageMedia.style.display = "block";
        } else {
            stageMedia.removeAttribute("src");
            stageMedia.style.display = "none";
        }
    }

    if (rawJson && !isProjector()) {
        rawJson.textContent = JSON.stringify(slide, null, 2);
    }

    const chartMeta = chartMap.get(currentSlideIndex + 1);
    renderChart(chartMeta || null);
    setText(slideStatus, `Slide ${currentSlideIndex + 1} of ${slideData.length}`);

    const items = slideList ? slideList.querySelectorAll('.js-hmi[data-role="slide-item"]') : [];
    items.forEach((item, index) => {
        item.classList.toggle("is-active", index === currentSlideIndex);
    });
};

const renderSlideList = () => {
    if (!slideList) {
        return;
    }
    slideList.innerHTML = "";
    slideData.forEach((slide, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "slide-item js-hmi";
        button.dataset.role = "slide-item";
        button.textContent = `${index + 1}. ${parseSlideTitle(slide)}`;
        button.addEventListener("click", () => {
            currentSlideIndex = index;
            renderSlide();
        });
        slideList.appendChild(button);
    });
};

const loadCharts = async (deckId) => {
    chartMap = new Map();
    if (!deckId) {
        return;
    }
    try {
        const response = await fetch(`${SLIDE_CHARTS_ENDPOINT}?deck_id=${encodeURIComponent(deckId)}`, { cache: "no-store" });
        if (!response.ok) {
            return;
        }
        const payload = await response.json();
        const charts = Array.isArray(payload.charts) ? payload.charts : [];
        charts.forEach((chart) => {
            if (chart && Number.isFinite(Number(chart.slide_index))) {
                chartMap.set(Number(chart.slide_index), chart);
            }
        });
    } catch (error) {
        return;
    }
};

const loadSlides = async (overrideDeckId) => {
    const deckId = overrideDeckId || deckInput?.value.trim();
    if (!deckId) {
        setText(slideStatus, "Enter a deck id to load slides.");
        return;
    }
    setText(slideStatus, "Loading slides...");
    try {
        const response = await fetch(`${SLIDES_ENDPOINT}?deck=${encodeURIComponent(deckId)}`, { cache: "no-store" });
        if (!response.ok) {
            const text = await response.text();
            setText(slideStatus, text || "Slide request failed.");
            return;
        }
        const payload = await response.json();
        slideData = Array.isArray(payload.slides) ? payload.slides : [];
        currentSlideIndex = 0;
        await loadCharts(deckId);
        renderSlideList();
        renderSlide();
        if (!slideData.length) {
            setText(slideStatus, "No slides found for this deck.");
        }
    } catch (error) {
        setText(slideStatus, "Slide request failed.");
    }
};

if (loadDeckButton) {
    loadDeckButton.addEventListener("click", () => {
        loadSlides();
    });
}

if (prevSlideButton) {
    prevSlideButton.addEventListener("click", () => {
        if (!slideData.length) {
            return;
        }
        currentSlideIndex = Math.max(0, currentSlideIndex - 1);
        renderSlide();
    });
}

if (nextSlideButton) {
    nextSlideButton.addEventListener("click", () => {
        if (!slideData.length) {
            return;
        }
        currentSlideIndex = Math.min(slideData.length - 1, currentSlideIndex + 1);
        renderSlide();
    });
}

if (deckInput) {
    deckInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            loadSlides();
        }
    });
}

const params = new URLSearchParams(window.location.search);
const deckParam = params.get("deck");
if (deckParam) {
    if (deckInput) {
        deckInput.value = deckParam;
    }
    loadSlides(deckParam);
} else {
    setText(slideStatus, "Enter a deck id to load slides.");
}
