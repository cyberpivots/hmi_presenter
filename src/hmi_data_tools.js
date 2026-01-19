const MAX_JSON_BYTES = 2_000_000;
const MAX_CSV_ROWS = 50;
const MAX_CSV_COLUMNS = 12;
const THEME_STORAGE_KEY = "mi_hmi_theme";
const DEFAULT_THEME = "quality_irrigation";
const SERVER_DATA_URL = "/api/data-sources";
const FLOW_REPORT_URL = "/api/slide-flow-report";
const FLOW_REPORT_CSV_URL = "/api/slide-flow-report.csv";
const SLIDE_CHARTS_URL = "/api/slide-charts";

const dataFileInput = document.getElementById("data_file_input");
const dataClearButton = document.getElementById("data_clear");
const dataFileInfo = document.getElementById("data_file_info");
const dataError = document.getElementById("data_error");
const jsonBlock = document.getElementById("json_block");
const jsonPreview = document.getElementById("json_preview");
const csvBlock = document.getElementById("csv_block");
const csvPreview = document.getElementById("csv_preview");
const csvNote = document.getElementById("csv_note");

const pdfFileInput = document.getElementById("pdf_file_input");
const pdfFileInfo = document.getElementById("pdf_file_info");
const pdfOpenButton = document.getElementById("pdf_open_button");
const pdfPreview = document.getElementById("pdf_preview");
const pdfPathInput = document.getElementById("pdf_path_input");
const pdfOutputInput = document.getElementById("pdf_output_input");
const tabulaJarInput = document.getElementById("tabula_jar_input");
const pdfCommands = document.getElementById("pdf_commands");

const serverDataSelect = document.getElementById("server_data_select");
const serverDataRefresh = document.getElementById("server_data_refresh");
const serverEntryRow = document.getElementById("server_entry_row");
const serverEntrySelect = document.getElementById("server_entry_select");
const serverDataStatus = document.getElementById("server_data_status");
const serverDataError = document.getElementById("server_data_error");
const serverCsvBlock = document.getElementById("server_csv_block");
const serverCsvPreview = document.getElementById("server_csv_preview");
const serverCsvNote = document.getElementById("server_csv_note");
const serverPdfBlock = document.getElementById("server_pdf_block");
const serverPdfMeta = document.getElementById("server_pdf_meta");
const serverPdfText = document.getElementById("server_pdf_text");

const flowRunIdInput = document.getElementById("flow_run_id");
const flowLimitSelect = document.getElementById("flow_limit_select");
const flowRefresh = document.getElementById("flow_refresh");
const flowDownloadCsv = document.getElementById("flow_download_csv");
const flowStatus = document.getElementById("flow_status");
const flowError = document.getElementById("flow_error");
const flowBlock = document.getElementById("flow_block");
const flowTable = document.getElementById("flow_table");

const chartDeckIdInput = document.getElementById("chart_deck_id");
const chartRefresh = document.getElementById("chart_refresh");
const chartStatus = document.getElementById("chart_status");
const chartError = document.getElementById("chart_error");
const chartBlock = document.getElementById("chart_block");
const chartTable = document.getElementById("chart_table");

let currentPdfUrl = null;
let serverSources = [];

const setText = (element, value) => {
    if (element) {
        element.textContent = value;
    }
};

const toggle = (element, show) => {
    if (!element) {
        return;
    }
    element.classList.toggle("is_hidden", !show);
};

const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) {
        return "--";
    }
    if (bytes < 1024) {
        return `${bytes} bytes`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatNumber = (value, digits = 2) => {
    if (!Number.isFinite(value)) {
        return "--";
    }
    return value.toFixed(digits);
};

const clearTable = (table) => {
    if (!table) {
        return;
    }
    const head = table.querySelector("thead");
    const body = table.querySelector("tbody");
    if (head) {
        head.innerHTML = "";
    }
    if (body) {
        body.innerHTML = "";
    }
};

const renderCsvTable = (table, headers, rows) => {
    if (!table) {
        return;
    }
    const head = table.querySelector("thead");
    const body = table.querySelector("tbody");
    if (!head || !body) {
        return;
    }
    head.innerHTML = "";
    body.innerHTML = "";

    const headerRow = headers.slice(0, MAX_CSV_COLUMNS);
    const headRow = document.createElement("tr");
    headerRow.forEach((cell, index) => {
        const th = document.createElement("th");
        th.textContent = cell || `Column ${index + 1}`;
        headRow.appendChild(th);
    });
    head.appendChild(headRow);

    rows.slice(0, MAX_CSV_ROWS).forEach((row) => {
        const tr = document.createElement("tr");
        row.slice(0, MAX_CSV_COLUMNS).forEach((cell) => {
            const td = document.createElement("td");
            td.textContent = cell;
            tr.appendChild(td);
        });
        body.appendChild(tr);
    });
};

const resetDataPreview = () => {
    setText(dataFileInfo, "No file selected.");
    setText(dataError, "");
    setText(csvNote, "");
    setText(jsonPreview, "");
    clearTable(csvPreview);
    toggle(jsonBlock, false);
    toggle(csvBlock, false);
};

const resetServerPreview = () => {
    clearTable(serverCsvPreview);
    setText(serverCsvNote, "");
    setText(serverDataError, "");
    if (serverPdfMeta) {
        serverPdfMeta.innerHTML = "";
    }
    setText(serverPdfText, "");
    toggle(serverCsvBlock, false);
    toggle(serverPdfBlock, false);
};

const resetFlowReport = () => {
    if (flowTable) {
        clearTable(flowTable);
    }
    setText(flowStatus, "Loading flow scores.");
    setText(flowError, "");
    toggle(flowBlock, false);
};

const resetChartMetadata = () => {
    if (chartTable) {
        clearTable(chartTable);
    }
    setText(chartStatus, "Enter a deck id to load charts.");
    setText(chartError, "");
    toggle(chartBlock, false);
};

const resetPdfPreview = () => {
    if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
        currentPdfUrl = null;
    }
    if (pdfFileInput) {
        pdfFileInput.value = "";
    }
    if (pdfPreview) {
        pdfPreview.removeAttribute("src");
        pdfPreview.title = "PDF preview";
    }
    if (pdfOpenButton) {
        pdfOpenButton.disabled = true;
    }
    setText(pdfFileInfo, "No PDF selected.");
};

const applyTheme = (theme) => {
    if (!theme || !document.body) {
        return;
    }
    document.body.dataset.theme = theme;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        return;
    }
};

const getInitialTheme = () => {
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
};

const closeOpenMenus = () => {
    document.querySelectorAll(".menu[open]").forEach((menu) => {
        menu.removeAttribute("open");
    });
};

const runMenuAction = (action) => {
    switch (action) {
        case "file-open-data":
            dataFileInput?.click();
            break;
        case "file-open-pdf":
            pdfFileInput?.click();
            break;
        case "file-clear":
            resetDataPreview();
            resetPdfPreview();
            break;
        case "file-open-hmi":
            window.open("master_irrigator_presentation_hmi.html", "_blank", "noopener");
            break;
        case "edit-clear-data":
            resetDataPreview();
            if (dataFileInput) {
                dataFileInput.value = "";
            }
            break;
        case "edit-clear-pdf":
            resetPdfPreview();
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
        case "help-local": {
            const target = document.getElementById("local_server_help");
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            break;
        }
        case "help-hmi":
            window.open("master_irrigator_presentation_hmi.html", "_blank", "noopener");
            break;
        default:
            break;
    }
};

const setupMenuBar = () => {
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
};

const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const next = text[index + 1];

        if (char === "\"") {
            if (inQuotes && next === "\"") {
                field += "\"";
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            row.push(field);
            field = "";
            continue;
        }

        if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") {
                index += 1;
            }
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
            if (rows.length >= MAX_CSV_ROWS + 1) {
                break;
            }
            continue;
        }

        field += char;
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows;
};

const renderCsv = (rows) => {
    if (!rows.length) {
        setText(dataError, "CSV file has no rows.");
        return;
    }

    const headerRow = rows[0].slice(0, MAX_CSV_COLUMNS);
    const dataRows = rows.slice(1, MAX_CSV_ROWS + 1);
    renderCsvTable(csvPreview, headerRow, dataRows);

    const rowCount = Math.max(rows.length - 1, 0);
    setText(
        csvNote,
        `Showing up to ${Math.min(rowCount, MAX_CSV_ROWS)} rows and ${MAX_CSV_COLUMNS} columns. First row is used as headers.`
    );
};

const handleDataFile = (file) => {
    const fileName = file.name || "(unnamed)";
    const fileType = file.type || "unknown type";
    setText(dataFileInfo, `${fileName} | ${formatBytes(file.size)} | ${fileType}`);

    const isJson = fileName.toLowerCase().endsWith(".json") || file.type.includes("json");
    const isCsv = fileName.toLowerCase().endsWith(".csv") || file.type.includes("csv");

    if (!isJson && !isCsv) {
        setText(dataError, "Please select a .json or .csv file.");
        return;
    }

    if (isJson && file.size > MAX_JSON_BYTES) {
        setText(dataError, "JSON file is too large for preview. Try a smaller file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const content = typeof reader.result === "string" ? reader.result : "";
        if (isJson) {
            try {
                const parsed = JSON.parse(content);
                setText(jsonPreview, JSON.stringify(parsed, null, 2));
                toggle(jsonBlock, true);
            } catch (error) {
                setText(dataError, "JSON parse failed. Check the file format.");
            }
            return;
        }

        const rows = parseCsv(content);
        if (rows.length === 0) {
            setText(dataError, "CSV parse failed. Check the file format.");
            return;
        }
        renderCsv(rows);
        toggle(csvBlock, true);
    };
    reader.onerror = () => {
        setText(dataError, "File read failed. Try again.");
    };
    reader.readAsText(file);
};

const setPdfPreview = (file) => {
    if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
        currentPdfUrl = null;
    }

    const fileName = file.name || "(unnamed)";
    setText(pdfFileInfo, `${fileName} | ${formatBytes(file.size)}`);

    const url = URL.createObjectURL(file);
    currentPdfUrl = url;
    if (pdfPreview) {
        pdfPreview.src = url;
        pdfPreview.title = `PDF preview: ${fileName}`;
    }
    if (pdfOpenButton) {
        pdfOpenButton.disabled = false;
    }
};

const buildPdfCommands = () => {
    const pdfPath = pdfPathInput?.value.trim() || "<PDF_PATH>";
    const outputDir = pdfOutputInput?.value.trim() || "<OUTPUT_DIR>";
    const tabulaJar = tabulaJarInput?.value.trim() || "<TABULA_JAR_PATH>";

    const lines = [
        `pdfinfo "${pdfPath}" > "${outputDir}/pdfinfo.txt"`,
        `pdftotext "${pdfPath}" "${outputDir}/text.txt"`,
        `pdfimages -png "${pdfPath}" "${outputDir}/images"`,
        `ocrmypdf "${pdfPath}" "${outputDir}/ocr.pdf"`,
        "# Tabula CLI example (requires tabula-java):",
        `java -jar "${tabulaJar}" -f CSV -p all -o "${outputDir}/tables.csv" "${pdfPath}"`,
    ];

    setText(pdfCommands, lines.join("\n"));
};

const buildServerOptions = (sources) => {
    if (!serverDataSelect) {
        return;
    }
    serverDataSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a data source";
    serverDataSelect.appendChild(placeholder);

    sources.forEach((source) => {
        const option = document.createElement("option");
        option.value = source.id;
        option.textContent = `${source.label} (${source.type})`;
        serverDataSelect.appendChild(option);
    });
};

const updateEntryOptions = (source) => {
    if (!serverEntryRow || !serverEntrySelect) {
        return;
    }
    serverEntrySelect.innerHTML = "";
    const entries = source?.entries || [];
    if (source?.type !== "csv_zip" || entries.length === 0) {
        serverEntryRow.classList.add("is_hidden");
        return;
    }

    entries.forEach((entry) => {
        const option = document.createElement("option");
        option.value = entry;
        option.textContent = entry;
        serverEntrySelect.appendChild(option);
    });
    serverEntryRow.classList.remove("is_hidden");
};

const renderServerCsvPreview = (preview) => {
    const headers = preview.headers || [];
    const rows = preview.rows || [];
    renderCsvTable(serverCsvPreview, headers, rows);
    const truncated = preview.truncated ? " Preview truncated." : "";
    setText(
        serverCsvNote,
        `Showing ${preview.preview_row_count || 0} rows and ${preview.preview_column_count || 0} columns.${truncated}`
    );
    toggle(serverCsvBlock, true);
};

const renderServerPdfPreview = (preview) => {
    if (serverPdfMeta) {
        serverPdfMeta.innerHTML = "";
        const metaItems = [
            ["Pages", preview.page_count ?? "--"],
            ["Title", preview.title || "--"],
            ["Author", preview.author || "--"],
            ["Subject", preview.subject || "--"],
        ];
        metaItems.forEach(([label, value]) => {
            const li = document.createElement("li");
            li.textContent = `${label}: ${value}`;
            serverPdfMeta.appendChild(li);
        });
    }
    const text = preview.text_excerpt || "(No text extracted)";
    setText(serverPdfText, text);
    toggle(serverPdfBlock, true);
};

const renderFlowReportTable = (decks) => {
    if (!flowTable) {
        return 0;
    }
    const head = flowTable.querySelector("thead");
    const body = flowTable.querySelector("tbody");
    if (!head || !body) {
        return 0;
    }
    head.innerHTML = "";
    body.innerHTML = "";

    const headers = [
        "Deck",
        "Slide",
        "Title",
        "Flow Score",
        "OCR Conf",
        "Text Density",
        "Font px",
        "Mean Luma",
        "Contrast",
    ];

    const headRow = document.createElement("tr");
    headers.forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
    });
    head.appendChild(headRow);

    let rowCount = 0;
    decks.forEach((deck) => {
        const deckTitle = deck.deck_title || deck.deck_id || "Deck";
        (deck.slides || []).forEach((slide) => {
            const tr = document.createElement("tr");
            const cells = [
                deckTitle,
                slide.slide_index ?? "--",
                slide.slide_title || "--",
                formatNumber(slide.similarity_score, 3),
                formatNumber(slide.ocr_confidence, 1),
                formatNumber(slide.text_density, 3),
                formatNumber(slide.avg_font_px, 1),
                formatNumber(slide.mean_luma, 1),
                formatNumber(slide.contrast_std, 1),
            ];
            cells.forEach((value) => {
                const td = document.createElement("td");
                td.textContent = value;
                tr.appendChild(td);
            });
            body.appendChild(tr);
            rowCount += 1;
        });
    });
    return rowCount;
};

const renderChartMetadataTable = (charts) => {
    if (!chartTable) {
        return 0;
    }
    const head = chartTable.querySelector("thead");
    const body = chartTable.querySelector("tbody");
    if (!head || !body) {
        return 0;
    }
    head.innerHTML = "";
    body.innerHTML = "";

    const headers = ["Slide", "Library", "Type", "Title", "Alt text"];
    const headRow = document.createElement("tr");
    headers.forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
    });
    head.appendChild(headRow);

    let rowCount = 0;
    charts.forEach((chart) => {
        const tr = document.createElement("tr");
        const altText = chart.alt_text || "";
        const cells = [
            chart.slide_index ?? "--",
            chart.chart_library || "--",
            chart.chart_type || "--",
            chart.chart_title || "--",
            altText.length > 120 ? `${altText.slice(0, 120)}…` : altText,
        ];
        cells.forEach((value) => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });
        body.appendChild(tr);
        rowCount += 1;
    });
    return rowCount;
};

const loadChartMetadata = async () => {
    resetChartMetadata();
    const deckId = chartDeckIdInput?.value.trim();
    if (!deckId) {
        setText(chartStatus, "Enter a deck id to load charts.");
        return;
    }
    setText(chartStatus, "Loading chart metadata...");
    try {
        const response = await fetch(
            `${SLIDE_CHARTS_URL}?deck_id=${encodeURIComponent(deckId)}`,
            { cache: "no-store" }
        );
        if (!response.ok) {
            const errorText = await response.text();
            setText(chartError, errorText || "Failed to load chart metadata.");
            setText(chartStatus, "Chart metadata failed.");
            return;
        }
        const payload = await response.json();
        const charts = Array.isArray(payload.charts) ? payload.charts : [];
        const rowCount = renderChartMetadataTable(charts);
        if (!rowCount) {
            setText(chartStatus, "No chart metadata found.");
            return;
        }
        toggle(chartBlock, true);
        setText(chartStatus, `Loaded ${rowCount} chart entries.`);
    } catch (error) {
        setText(chartError, "Failed to load chart metadata. Check the API server.");
        setText(chartStatus, "Chart metadata failed.");
    }
};

const buildFlowReportUrl = () => {
    const params = new URLSearchParams();
    const runId = flowRunIdInput?.value.trim();
    const limitValue = flowLimitSelect?.value || "5";
    if (runId) {
        params.set("run_id", runId);
    }
    params.set("limit", limitValue);
    return `${FLOW_REPORT_URL}?${params.toString()}`;
};

const buildFlowCsvUrl = () => {
    const params = new URLSearchParams();
    const runId = flowRunIdInput?.value.trim();
    if (runId) {
        params.set("run_id", runId);
    }
    const query = params.toString();
    return query ? `${FLOW_REPORT_CSV_URL}?${query}` : FLOW_REPORT_CSV_URL;
};

const loadFlowReport = async () => {
    resetFlowReport();
    if (!flowStatus) {
        return;
    }
    setText(flowStatus, "Loading flow scores.");
    try {
        const response = await fetch(buildFlowReportUrl(), { cache: "no-store" });
        if (!response.ok) {
            const errorText = await response.text();
            setText(flowError, errorText || "Failed to load flow report.");
            setText(flowStatus, "Flow report failed.");
            return;
        }
        const payload = await response.json();
        const decks = payload.decks || [];
        const rowCount = renderFlowReportTable(decks);
        if (rowCount === 0) {
            setText(flowStatus, "No flow scores found.");
            return;
        }
        toggle(flowBlock, true);
        setText(
            flowStatus,
            `Run: ${payload.run_id} | ${payload.limit_per_deck} per deck | OCR: prefer 1920x1080`
        );
    } catch (error) {
        setText(flowError, "Failed to load flow report. Check the API server.");
        setText(flowStatus, "Flow report failed.");
    }
};

const fetchServerPreview = async () => {
    resetServerPreview();
    if (!serverDataSelect) {
        return;
    }
    const sourceId = serverDataSelect.value;
    if (!sourceId) {
        setText(serverDataStatus, "Select a data source.");
        return;
    }
    const source = serverSources.find((item) => item.id === sourceId);
    if (!source) {
        setText(serverDataStatus, "Data source not found.");
        return;
    }

    let url = `${SERVER_DATA_URL}/${encodeURIComponent(sourceId)}/preview`;
    if (source.type === "csv_zip") {
        const entry = serverEntrySelect?.value;
        if (!entry) {
            setText(serverDataStatus, "Select a CSV entry.");
            return;
        }
        url += `?entry=${encodeURIComponent(entry)}`;
    }

    setText(serverDataStatus, "Loading preview...");
    try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            const errorText = await response.text();
            setText(serverDataError, errorText || "Failed to load preview.");
            setText(serverDataStatus, "Preview failed.");
            return;
        }
        const payload = await response.json();
        setText(serverDataStatus, `Source: ${payload.source?.filename || sourceId}`);
        if (payload.source?.type === "pdf") {
            renderServerPdfPreview(payload.preview || {});
        } else {
            renderServerCsvPreview(payload.preview || {});
        }
    } catch (error) {
        setText(serverDataError, "Failed to load preview. Check the API server.");
        setText(serverDataStatus, "Preview failed.");
    }
};

const loadServerSources = async () => {
    if (!serverDataSelect) {
        return;
    }
    setText(serverDataStatus, "Loading data sources.");
    setText(serverDataError, "");
    try {
        const response = await fetch(SERVER_DATA_URL, { cache: "no-store" });
        if (!response.ok) {
            setText(serverDataStatus, "Failed to load data sources.");
            return;
        }
        const payload = await response.json();
        serverSources = payload.sources || [];
        buildServerOptions(serverSources);
        setText(serverDataStatus, `${serverSources.length} sources available.`);
        updateEntryOptions(serverSources[0]);
    } catch (error) {
        setText(serverDataStatus, "Failed to load data sources.");
    }
};

if (dataClearButton) {
    dataClearButton.addEventListener("click", () => {
        if (dataFileInput) {
            dataFileInput.value = "";
        }
        resetDataPreview();
    });
}

if (dataFileInput) {
    dataFileInput.addEventListener("change", () => {
        resetDataPreview();
        const file = dataFileInput.files && dataFileInput.files[0];
        if (file) {
            handleDataFile(file);
        }
    });
}

if (pdfFileInput) {
    pdfFileInput.addEventListener("change", () => {
        const file = pdfFileInput.files && pdfFileInput.files[0];
        if (!file) {
            setText(pdfFileInfo, "No PDF selected.");
            return;
        }
        setPdfPreview(file);
    });
}

if (pdfOpenButton) {
    pdfOpenButton.addEventListener("click", () => {
        if (!currentPdfUrl) {
            return;
        }
        window.open(currentPdfUrl, "_blank", "noopener,noreferrer");
    });
}

if (serverDataSelect) {
    serverDataSelect.addEventListener("change", () => {
        const source = serverSources.find((item) => item.id === serverDataSelect.value);
        updateEntryOptions(source);
        fetchServerPreview();
    });
}

if (serverEntrySelect) {
    serverEntrySelect.addEventListener("change", () => {
        fetchServerPreview();
    });
}

if (serverDataRefresh) {
    serverDataRefresh.addEventListener("click", () => {
        loadServerSources();
    });
}

if (flowRefresh) {
    flowRefresh.addEventListener("click", () => {
        loadFlowReport();
    });
}

if (flowDownloadCsv) {
    flowDownloadCsv.addEventListener("click", () => {
        const url = buildFlowCsvUrl();
        window.open(url, "_blank", "noopener,noreferrer");
    });
}

if (chartRefresh) {
    chartRefresh.addEventListener("click", () => {
        loadChartMetadata();
    });
}

if (chartDeckIdInput) {
    chartDeckIdInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            loadChartMetadata();
        }
    });
}

if (pdfPathInput) {
    pdfPathInput.addEventListener("input", buildPdfCommands);
}

if (pdfOutputInput) {
    pdfOutputInput.addEventListener("input", buildPdfCommands);
}

if (tabulaJarInput) {
    tabulaJarInput.addEventListener("input", buildPdfCommands);
}

resetDataPreview();
resetChartMetadata();
buildPdfCommands();
applyTheme(getInitialTheme());
setupMenuBar();
loadServerSources();
loadFlowReport();
