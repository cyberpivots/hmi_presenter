const DATA_URL = "../assets/irrigation_eyes_mock_data.json";
const THEME_STORAGE_KEY = "mi_hmi_theme";
const DEFAULT_THEME = "quality_irrigation";

const tabs = document.querySelectorAll(".tab_button");
const panels = document.querySelectorAll(".panel");

const state = {
  activeIndex: "ndvi",
  data: null,
};

const setupHelpDialog = () => {
  const helpButton = document.getElementById("help_button");
  const helpDialog = document.getElementById("help_dialog");
  const helpClose = document.getElementById("help_close");

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

const resetView = () => {
  tabs.forEach((btn) => btn.classList.remove("is_active"));
  panels.forEach((panel) => panel.classList.remove("is_active"));
  const firstTab = document.querySelector(".tab_button[data-tab=\"analysis\"]");
  const firstPanel = document.getElementById("analysis");
  if (firstTab) {
    firstTab.classList.add("is_active");
  }
  if (firstPanel) {
    firstPanel.classList.add("is_active");
  }
};

const runMenuAction = (action) => {
  switch (action) {
    case "file-open-tools":
      window.open("hmi_data_tools.html", "_blank", "noopener");
      break;
    case "file-open-hmi":
      window.open("master_irrigator_presentation_hmi.html", "_blank", "noopener");
      break;
    case "edit-reset-view":
      resetView();
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
    case "help-open": {
      const helpDialog = document.getElementById("help_dialog");
      if (helpDialog) {
        if (typeof helpDialog.showModal === "function") {
          helpDialog.showModal();
        } else {
          helpDialog.setAttribute("open", "open");
        }
      }
      break;
    }
    case "help-tools":
      window.open("hmi_data_tools.html", "_blank", "noopener");
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

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((btn) => btn.classList.remove("is_active"));
    panels.forEach((panel) => panel.classList.remove("is_active"));
    tab.classList.add("is_active");
    const target = document.getElementById(tab.dataset.tab);
    if (target) {
      target.classList.add("is_active");
    }
  });
});

const setText = (id, value) => {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
};

const formatNumber = (value, digits = 2) => {
  if (value === null || value === undefined) {
    return "--";
  }
  return Number(value).toFixed(digits);
};

const buildMetaList = (items, targetId) => {
  const container = document.getElementById(targetId);
  if (!container || !items) {
    return;
  }
  container.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "meta_item";
    row.innerHTML = `<span>${item.label}</span><strong>${item.value ?? "--"}</strong>`;
    container.appendChild(row);
  });
};

const buildSteps = (steps) => {
  const container = document.getElementById("processing_steps");
  if (!container || !steps) {
    return;
  }
  container.innerHTML = "";
  steps.forEach((step) => {
    const row = document.createElement("div");
    row.className = "step_item";
    row.innerHTML = `<div><p class="stat_label">${step.step}</p><span>${step.duration_s ?? "--"}s</span></div><span class="status_tag">${step.status}</span>`;
    container.appendChild(row);
  });
};

const buildQuality = (checks) => {
  const container = document.getElementById("quality_checks");
  if (!container || !checks) {
    return;
  }
  container.innerHTML = "";
  checks.forEach((check) => {
    const row = document.createElement("div");
    row.className = "quality_item";
    row.innerHTML = `<div><p class="stat_label">${check.check}</p><span>${check.note || "--"}</span></div><span class="status_tag">${check.status}</span>`;
    container.appendChild(row);
  });
};

const buildExports = (exportsList) => {
  const container = document.getElementById("export_list");
  if (!container || !exportsList) {
    return;
  }
  container.innerHTML = "";
  exportsList.forEach((item) => {
    const row = document.createElement("div");
    row.className = "export_item";
    row.innerHTML = `<div><p class="stat_label">${item.label}</p><span>${item.format}</span></div><span class="status_tag">${item.status}</span>`;
    container.appendChild(row);
  });
};

const buildSceneList = (scenes) => {
  const container = document.getElementById("scene_list");
  if (!container || !scenes) {
    return;
  }
  container.innerHTML = "";
  scenes.forEach((scene) => {
    const card = document.createElement("div");
    card.className = "scene_card";
    card.innerHTML = `
      <div class="scene_title">${scene.scene_id || "--"}</div>
      <div class="scene_meta">
        <span>${scene.date_acquired || "--"}</span>
        <span>Cloud ${scene.cloud_cover ?? "--"}</span>
        <span>Path ${scene.wrs_path || "--"} Row ${scene.wrs_row || "--"}</span>
      </div>
    `;
    container.appendChild(card);
  });
};

const buildArtifacts = (artifacts) => {
  const container = document.getElementById("artifact_list");
  if (!container || !artifacts) {
    return;
  }
  container.innerHTML = "";
  Object.entries(artifacts).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "artifact_item";
    row.innerHTML = `<div><p class="stat_label">${key}</p><span>${value}</span></div>`;
    container.appendChild(row);
  });
};

const buildHistogram = (hist, targetId) => {
  const container = document.getElementById(targetId);
  if (!container || !hist) {
    return;
  }
  container.innerHTML = "";
  const max = Math.max(...hist.counts, 1);
  hist.counts.forEach((count) => {
    const bar = document.createElement("div");
    bar.className = "histogram_bar";
    bar.style.height = `${Math.max(6, (count / max) * 100)}%`;
    container.appendChild(bar);
  });
};

const buildForecast = (forecast) => {
  const container = document.getElementById("weather_forecast");
  if (!container || !forecast) {
    return;
  }
  container.innerHTML = "";
  forecast.forEach((day) => {
    const card = document.createElement("div");
    card.className = "forecast_card";
    card.innerHTML = `
      <p class="stat_label">${day.day}</p>
      <p class="stat_value">${day.high_c}°</p>
      <p class="stat_hint">${day.rain_probability_percent}% rain</p>
    `;
    container.appendChild(card);
  });
};

const buildValves = (valves) => {
  const container = document.getElementById("valve_list");
  if (!container || !valves) {
    return;
  }
  container.innerHTML = "";
  Object.entries(valves).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "valve_item";
    const left = document.createElement("div");
    left.innerHTML = `<p class="stat_label">${key}</p><p class="stat_hint">Last open: ${value.last_opened_at || "--"}</p>`;
    const dot = document.createElement("span");
    dot.className = "status_dot";
    dot.style.background = value.is_open ? "var(--blue-500)" : "#9aa6b2";
    row.appendChild(left);
    row.appendChild(dot);
    container.appendChild(row);
  });
};

const buildSchedules = (schedules) => {
  const container = document.getElementById("flight_schedules");
  if (!container || !schedules) {
    return;
  }
  container.innerHTML = "";
  schedules.forEach((item) => {
    const row = document.createElement("div");
    row.className = "valve_item";
    row.innerHTML = `
      <div>
        <p class="stat_label">${item.schedule_id}</p>
        <p class="stat_hint">Every ${item.interval_days} days at ${item.time_local}</p>
      </div>
      <div class="pill">${item.manual_override ? "Manual" : "Auto"}</div>
    `;
    container.appendChild(row);
  });
};

const updateActiveIndex = () => {
  const analysis = state.data?.imagery_analysis;
  if (!analysis) {
    return;
  }
  const summary = analysis.index_overview?.[state.activeIndex] || {};
  const hist = analysis.histograms?.[state.activeIndex];

  setText("active_index_mean", formatNumber(summary.mean, 4));
  setText("active_index_range", `${formatNumber(summary.min, 4)} to ${formatNumber(summary.max, 4)}`);
  setText("active_index_note", state.data?.meta?.notes || "--");
  setText("canvas_index_label", state.activeIndex.toUpperCase());

  buildHistogram(hist, "index_histogram");
  setText("histogram_range", `Range ${formatNumber(summary.min, 4)} to ${formatNumber(summary.max, 4)}`);
};

const bindToggleButtons = () => {
  const toggles = document.querySelectorAll(".toggle_button");
  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      toggles.forEach((item) => item.classList.remove("is_active"));
      btn.classList.add("is_active");
      state.activeIndex = btn.dataset.index;
      updateActiveIndex();
    });
  });
};

applyTheme(getInitialTheme());
setupHelpDialog();
setupMenuBar();

fetch(DATA_URL)
  .then((resp) => resp.json())
  .then((data) => {
    state.data = data;
    setText("meta_source", data.meta?.source || "mock");

    const analysis = data.imagery_analysis;
    if (analysis) {
      const activeScene = analysis.scene_library?.find((scene) => scene.scene_id === analysis.active_scene_id)
        || analysis.scene_library?.[0];

      if (activeScene) {
        buildMetaList([
          { label: "Scene", value: activeScene.scene_id },
          { label: "Date", value: activeScene.date_acquired },
          { label: "Cloud", value: activeScene.cloud_cover },
          { label: "Path/Row", value: `${activeScene.wrs_path || "--"}/${activeScene.wrs_row || "--"}` },
          { label: "Sun Elev", value: activeScene.sun_elevation },
        ], "scene_meta");
        setText("canvas_scene_id", activeScene.scene_id || "--");
        buildArtifacts(activeScene.artifacts || {});
      }

      buildSteps(analysis.processing_steps || []);
      buildQuality(analysis.quality_checks || []);
      buildExports(analysis.exports || []);
      buildSceneList(analysis.scene_library || []);
    }

    const ndvi = analysis?.index_overview?.ndvi || {};
    const ndmi = analysis?.index_overview?.ndmi || {};
    setText("ndvi_mean", formatNumber(ndvi.mean, 4));
    setText("ndvi_range", `${formatNumber(ndvi.min, 4)} to ${formatNumber(ndvi.max, 4)}`);
    setText("ndmi_mean", formatNumber(ndmi.mean, 4));
    setText("ndmi_range", `${formatNumber(ndmi.min, 4)} to ${formatNumber(ndmi.max, 4)}`);
    setText("analysis_notes", data.meta?.notes || "--");

    updateActiveIndex();
    bindToggleButtons();

    const water = data.water_consumption_daily?.slice(-1)[0];
    setText("water_today", water ? `${water.liters}` : "--");

    setText("telemetry_status", data.telemetry?.status || "--");
    setText("telemetry_lat", formatNumber(data.telemetry?.lat, 4));
    setText("telemetry_lon", formatNumber(data.telemetry?.lon, 4));
    setText("telemetry_alt", `${formatNumber(data.telemetry?.alt, 1)} m`);
    setText("telemetry_batt", `${data.telemetry?.battery ?? "--"}%`);

    setText("weather_condition", data.weather?.current?.condition || "--");
    setText("weather_humidity", `${data.weather?.current?.humidity_percent ?? "--"}%`);
    setText("weather_wind", `${data.weather?.current?.wind_speed_kph ?? "--"} kph`);
    setText("weather_rain", `${data.weather?.current?.rain_probability_percent ?? "--"}%`);
    buildForecast(data.weather?.forecast_next_3_days || []);

    buildValves(data.irrigation_status?.valves || {});
    buildSchedules(data.flight_schedules || []);
  })
  .catch((error) => {
    console.error("Failed to load mock data", error);
  });
