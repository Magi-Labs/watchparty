/* === Huddle — Sidebar === */

/* ---------- UI Sidebar Visibility Helpers ---------- */
function openSidebar() {
  const s = document.getElementById("huddle-sidebar");
  const b = document.getElementById("huddle-open-btn");
  if (s && b) {
    s.classList.add("huddle-visible");
    b.classList.add("sidebar-open");
  }
}

function closeSidebar() {
  const s = document.getElementById("huddle-sidebar");
  const b = document.getElementById("huddle-open-btn");
  if (s && b) {
    s.classList.remove("huddle-visible");
    b.classList.remove("sidebar-open");
  }
}

function addSidebarResizeHandle(sidebar) {
  const handle = document.createElement("div");
  handle.className = "huddle-resize-handle";
  handle.tabIndex = 0;
  handle.setAttribute("role", "separator");
  handle.setAttribute("aria-label", "Huddle panel width");
  handle.setAttribute("aria-orientation", "vertical");
  handle.setAttribute("aria-controls", sidebar.id);
  handle.title = "Drag to resize Huddle";
  sidebar.appendChild(handle);

  let width = 340;
  let drag = null;
  const maxWidth = () => Math.min(720, Math.floor(window.innerWidth * 0.65));
  const minWidth = () => Math.min(240, maxWidth());
  const clampWidth = (value) => Math.max(minWidth(), Math.min(maxWidth(), Math.round(value)));

  function applyWidth() {
    document.documentElement.style.setProperty("--huddle-preferred-width", `${width}px`);
    handle.setAttribute("aria-valuemin", minWidth());
    handle.setAttribute("aria-valuemax", maxWidth());
    handle.setAttribute("aria-valuenow", clampWidth(width));
  }

  function saveWidth() {
    chrome.storage.local.set({ huddle_panel_width: width });
  }

  applyWidth();
  chrome.storage.local.get({ huddle_panel_width: 340 }, ({ huddle_panel_width }) => {
    if (!drag && Number.isFinite(huddle_panel_width) && huddle_panel_width > 0) {
      width = huddle_panel_width;
      applyWidth();
    }
  });
  window.addEventListener("resize", applyWidth);

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || drag) return;
    event.preventDefault();
    handle.focus({ preventScroll: true });
    drag = { id: event.pointerId, x: event.clientX, width, renderedWidth: sidebar.getBoundingClientRect().width };
    handle.setPointerCapture(event.pointerId);
    document.documentElement.classList.add("huddle-resizing");
  });
  handle.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    if (event.clientX === drag.x && width === drag.width) return;
    width = clampWidth(drag.renderedWidth + drag.x - event.clientX);
    applyWidth();
  });

  function finishResize(event) {
    if (drag?.id !== event.pointerId) return;
    if (event.type !== "pointerup") width = drag.width;
    if (width !== drag.width) saveWidth();
    drag = null;
    document.documentElement.classList.remove("huddle-resizing");
    applyWidth();
  }

  handle.addEventListener("pointerup", finishResize);
  handle.addEventListener("pointercancel", finishResize);
  handle.addEventListener("lostpointercapture", finishResize);
  handle.addEventListener("keydown", (event) => {
    const steps = { ArrowLeft: 20, ArrowRight: -20 };
    const step = steps[event.key];
    if (typeof step !== "number") return;
    event.preventDefault();
    event.stopPropagation();
    width = clampWidth(clampWidth(width) + step);
    applyWidth();
    saveWidth();
  });
}

/* ---------- UI: Build Sidebar ---------- */
function buildSidebar() {
  if (document.getElementById("huddle-sidebar")) return;

  // Sidebar container (built first so openBtn closure can reference it)
  const sidebar = document.createElement("div");
  sidebar.className = "huddle-sidebar"; // Starts closed by default via CSS (translateX 100%)
  sidebar.id = "huddle-sidebar";
  addSidebarResizeHandle(sidebar);

  // Header
  const header = document.createElement("div");
  header.className = "huddle-header";
  header.innerHTML = `
    <div class="huddle-logo">
      <span class="huddle-logo-icon" id="huddle-logo-icon">🎬</span>
      <span class="huddle-logo-text">Huddle</span>
    </div>
  `;

  addThemeToggle(sidebar, header);

  const dockBtn = document.createElement("button");
  dockBtn.type = "button";
  dockBtn.className = "huddle-dock-btn";
  dockBtn.setAttribute("aria-label", "Dock panel");
  dockBtn.dataset.tooltip = "Dock panel";
  dockBtn.innerHTML = `
    <!-- Lucide panel-right icon. See vendor/LUCIDE-LICENSE.txt. -->
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
    </svg>
  `;
  dockBtn.setAttribute("aria-pressed", localStorage.getItem("huddle_docked") === "true");
  sidebar.classList.toggle("huddle-docked", dockBtn.getAttribute("aria-pressed") === "true");
  dockBtn.addEventListener("click", () => {
    const docked = sidebar.classList.toggle("huddle-docked");
    dockBtn.setAttribute("aria-pressed", docked);
    localStorage.setItem("huddle_docked", docked);
  });
  header.appendChild(dockBtn);

  const closeBtn = document.createElement("div");
  closeBtn.className = "huddle-close-btn";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", closeSidebar);
  header.appendChild(closeBtn);
  sidebar.appendChild(header);

  // Pages Container
  const mainPage = document.createElement("div");
  mainPage.className = "huddle-page active";
  mainPage.id = "huddle-page-main";
  sidebar.appendChild(mainPage);

  const twitchPage = document.createElement("div");
  twitchPage.className = "huddle-page";
  twitchPage.id = "huddle-page-twitch";
  sidebar.appendChild(twitchPage);

  const roomPage = document.createElement("div");
  roomPage.className = "huddle-page";
  roomPage.id = "huddle-page-room";
  sidebar.appendChild(roomPage);

  // Open/toggle button
  const openBtn = document.createElement("div");
  openBtn.className = "huddle-open-btn";
  openBtn.id = "huddle-open-btn";
  openBtn.innerHTML = `<span class="huddle-btn-icon-wrapper" style="display:inline-block; writing-mode:horizontal-tb; line-height:1;">🎬</span>`;

  // Apply saved visibility preference
  if (localStorage.getItem("huddle_show_floating_btn") === "false") {
    openBtn.style.display = "none";
  }

  openBtn.addEventListener("click", () => {
    sidebar.classList.toggle("huddle-visible");
    openBtn.classList.toggle("sidebar-open");
  });

  // Handle fullscreen changes to hide/show the floating button and sidebar
  const handleFullscreenChange = () => {
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    if (isFullscreen) {
      openBtn.classList.add("huddle-fullscreen-hide");
      sidebar.classList.add("huddle-fullscreen-hide");
    } else {
      openBtn.classList.remove("huddle-fullscreen-hide");
      sidebar.classList.remove("huddle-fullscreen-hide");
    }
  };

  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  document.addEventListener("MSFullscreenChange", handleFullscreenChange);

  // Extension Icon Click Listener (from background.js)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "HUDDLE_TOGGLE_SIDEBAR") {
      const s = document.getElementById("huddle-sidebar");
      const b = document.getElementById("huddle-open-btn");
      if (s && b) {
        s.classList.toggle("huddle-visible");
        b.classList.toggle("sidebar-open");
      }
    }
  });

  // Append both to DOM together to avoid reflow between inserts
  // Keep the panel outside the page area it resizes when docked.
  document.documentElement.append(sidebar, openBtn);

  // Render initial view
  renderMainView();

  // Apply initial dynamic theme based on page context
  applyDynamicTheme(getVideoMetadata().source);
}

/* ---------- UI: Page Navigation ---------- */
function showPage(page) {
  currentPage = page;
  document
    .querySelectorAll(".huddle-page")
    .forEach((p) => p.classList.remove("active"));
  const target = document.getElementById(`huddle-page-${page}`);
  if (target) target.classList.add("active");
}
