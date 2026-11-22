const API_BASE = (import.meta.env.VITE_WORKSHOP_API_URL || "/api/v1").replace(/\/+$/, "");

const categories = [
  { id: "mod", name: "Mods", icon: "🧩", description: "Mở rộng chức năng KBVERSE" },
  { id: "shader", name: "Shaders", icon: "✨", description: "Hiệu ứng hình ảnh và ánh sáng" },
  { id: "asset", name: "Assets", icon: "🏗️", description: "Model, texture và vật liệu" },
  { id: "tool", name: "Tools", icon: "🔧", description: "Công cụ dành cho creator" }
];

const state = {
  page: "discover",
  query: "",
  sort: "popular",
  items: [],
  loading: false,
  error: "",
  detail: null
};

const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

async function api(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    credentials: "include",
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Server returned ${response.status}`);
  }

  return data;
}

function iconFor(category) {
  return categories.find(item => item.id === category)?.icon || "📦";
}

function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? new Intl.NumberFormat("vi-VN").format(n) : "0";
}

function coverURL(value) {
  if (!value || typeof value !== "string") return "";
  if (value.startsWith("/")) return escapeHTML(value);

  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? escapeHTML(url.href) : "";
  } catch {
    return "";
  }
}

function listingCard(item, uploads = false) {
  const id = escapeHTML(item.id || item.slug || "");
  const name = escapeHTML(item.name || item.title || "Untitled");
  const category = escapeHTML(item.category || "mod");
  const author = escapeHTML(item.author?.name || item.author || "Unknown creator");
  const description = escapeHTML(item.description || "");
  const cover = coverURL(item.coverUrl || item.cover);
  const version = escapeHTML(item.latestVersion || item.version || "Unknown");

  const image = cover
    ? `<img src="${cover}" alt="${name}" loading="lazy" onerror="this.style.display='none'">`
    : `<div class="card-placeholder">${iconFor(category)}</div>`;

  return `
    <article class="mod-card">
      <button class="card-image" data-action="detail" data-id="${id}" aria-label="View ${name}">
        ${image}
        <span class="card-category">${iconFor(category)} ${category}</span>
      </button>
      <div class="card-body">
        <div class="card-heading">
          <h3>${name}</h3>
          <span class="version">v${version}</span>
        </div>
        <p class="card-description">${description}</p>
        <div class="creator">by ${author}</div>
        <div class="card-footer">
          <span>↓ ${formatNumber(item.downloads)}</span>
          <span>★ ${item.rating == null ? "No rating" : escapeHTML(item.rating)}</span>
          ${uploads ? `<span class="upload-status">${escapeHTML(item.status || "Pending")}</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderCards(items, uploads = false) {
  if (!items.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">◇</div>
        <h3>${uploads ? "Chưa có nội dung đã đăng" : "Chưa có mod được xuất bản"}</h3>
        <p>${uploads
          ? "Các nội dung bạn đăng sẽ xuất hiện tại đây."
          : "Danh mục này sẽ hiển thị nội dung thật khi Workshop Backend được kết nối."}</p>
        ${uploads ? `<button class="primary-button" data-page="upload">Đăng nội dung đầu tiên</button>` : ""}
      </div>
    `;
  }

  return `<div class="mod-grid">${items.map(item => listingCard(item, uploads)).join("")}</div>`;
}

function pageTitle() {
  const titles = {
    discover: ["Discover", "Khám phá những sáng tạo dành cho KBVERSE."],
    mods: ["Mods", "Mod mở rộng chức năng và trải nghiệm."],
    shaders: ["Shaders", "Hiệu ứng ánh sáng và hình ảnh."],
    assets: ["Assets", "Model 3D, texture và vật liệu."],
    tools: ["Tools", "Công cụ dành cho nhà sáng tạo."],
    uploads: ["My Uploads", "Quản lý nội dung bạn đã đăng."],
    upload: ["Publish", "Đưa sáng tạo của bạn lên KB Workshop."]
  };

  return titles[state.page] || titles.discover;
}

function renderShell() {
  $("#app").innerHTML = `
    <header class="topbar">
      <a href="#" class="brand" data-page="discover">
        <span class="brand-mark">KB</span>
        <span>KB<span class="brand-light">WORKSHOP</span></span>
      </a>

      <div class="top-search">
        <span>⌕</span>
        <input id="search" placeholder="Tìm mods, shaders, assets..." autocomplete="off">
        <kbd>SEARCH</kbd>
      </div>

      <div class="top-actions">
        <span id="connection" class="connection"><i></i> Checking API</span>
        <button class="outline-button" data-page="uploads">My Uploads</button>
        <button class="primary-button" data-page="upload">+ Publish</button>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <div class="side-label">WORKSHOP</div>
        <button class="side-link active" data-page="discover"><span>◈</span> Discover</button>
        <button class="side-link" data-page="mods"><span>🧩</span> Mods</button>
        <button class="side-link" data-page="shaders"><span>✧</span> Shaders</button>
        <button class="side-link" data-page="assets"><span>▦</span> Assets</button>
        <button class="side-link" data-page="tools"><span>⚙</span> Tools</button>

        <div class="side-divider"></div>
        <div class="side-label">CREATOR</div>
        <button class="side-link" data-page="uploads"><span>▤</span> My Uploads</button>
        <button class="side-link" data-page="upload"><span>＋</span> Publish content</button>

        <div class="sidebar-bottom">
          <div class="sidebar-logo">KBVERSE</div>
          <p>One world. Endless creations.</p>
          <span>KB Workshop · v0.1.0</span>
        </div>
      </aside>

      <main class="content">
        <div id="page-content"></div>
        <footer>
          <span>KB WORKSHOP</span>
          <span>Independent community platform for KBVERSE</span>
        </footer>
      </main>
    </div>
    <div id="modal-root"></div>
  `;

  document.addEventListener("click", handleClick);
  $("#search").addEventListener("input", event => {
    state.query = event.target.value;
    if (state.page !== "discover" && state.page !== "mods" &&
        state.page !== "shaders" && state.page !== "assets" &&
        state.page !== "tools") return;

    clearTimeout(window.__kbSearchTimer);
    window.__kbSearchTimer = setTimeout(loadListings, 300);
  });
}

function updateNavigation() {
  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === state.page);
  });
}

function pageHeader(title, description) {
  return `
    <div class="page-header">
      <div>
        <div class="eyebrow">KBVERSE COMMUNITY PLATFORM</div>
        <h1>${escapeHTML(title)}</h1>
        <p>${escapeHTML(description)}</p>
      </div>
    </div>
  `;
}

function renderListingPage() {
  const [title, description] = pageTitle();
  const showCategories = state.page === "discover";

  $("#page-content").innerHTML = `
    ${showCategories ? `
      <section class="hero">
        <div class="hero-content">
          <div class="eyebrow">THE CREATOR COMMUNITY</div>
          <h1>Build beyond<br><span>your world.</span></h1>
          <p>Discover, share and expand KBVERSE with community-made creations.</p>
          <button class="primary-button large" data-page="mods">Explore Workshop <span>↗</span></button>
        </div>
        <div class="hero-art">
          <div class="orbit orbit-one"></div>
          <div class="orbit orbit-two"></div>
          <div class="hero-core">KB</div>
          <div class="floating-symbol symbol-one">◇</div>
          <div class="floating-symbol symbol-two">✦</div>
          <div class="floating-symbol symbol-three">▦</div>
        </div>
      </section>
      <section class="category-section">
        <div class="section-heading">
          <div><div class="eyebrow">EXPLORE</div><h2>Browse categories</h2></div>
        </div>
        <div class="category-grid">
          ${categories.map(category => `
            <button class="category-card" data-page="${category.id === "mod" ? "mods" : category.id + "s"}">
              <span class="category-icon">${category.icon}</span>
              <span><strong>${category.name}</strong><small>${category.description}</small></span>
              <b>↗</b>
            </button>
          `).join("")}
        </div>
      </section>
    ` : pageHeader(title, description)}

    <section class="listing-section">
      <div class="section-heading">
        <div><div class="eyebrow">${state.page === "discover" ? "COMMUNITY RELEASES" : "CATALOG"}</div>
        <h2>${state.page === "discover" ? "Explore creations" : "Browse " + escapeHTML(title)}</h2></div>
        <select id="sort">
          <option value="popular">Most popular</option>
          <option value="newest">Recently added</option>
          <option value="top-rated">Top rated</option>
          <option value="downloads">Most downloaded</option>
        </select>
      </div>
      <div id="listing-result">
        <div class="loading-state">Loading Workshop catalog...</div>
      </div>
    </section>
  `;

  $("#sort").value = state.sort;
  $("#sort").addEventListener("change", event => {
    state.sort = event.target.value;
    loadListings();
  });
}

async function loadListings() {
  const output = $("#listing-result");
  if (!output) return;

  output.innerHTML = `<div class="loading-state">Loading...</div>`;

  const categoryMap = {
    mods: "mod",
    shaders: "shader",
    assets: "asset",
    tools: "tool"
  };

  const params = new URLSearchParams({
    query: state.query,
    sort: state.sort,
    page: "1",
    limit: "24"
  });

  if (categoryMap[state.page]) params.set("category", categoryMap[state.page]);

  try {
    const result = await api("/mods?" + params.toString());
    const items = Array.isArray(result) ? result : (result.items || result.mods || []);
    state.items = items;

    $("#connection").innerHTML = "<i></i> API Connected";
    $("#connection").classList.add("online");

    output.innerHTML = renderCards(items);
  } catch (error) {
    state.items = [];
    $("#connection").innerHTML = "<i></i> API Offline";
    $("#connection").classList.remove("online");

    output.innerHTML = `
      <div class="api-state">
        <div class="api-symbol">⌁</div>
        <h3>Workshop Backend chưa kết nối</h3>
        <p>Website riêng đã sẵn sàng. Để tải và hiển thị các mod đã xuất bản, cần kết nối Workshop API.</p>
        <span>${escapeHTML(error.message)}</span>
      </div>
    `;
  }
}

async function loadUploads() {
  $("#page-content").innerHTML = `
    ${pageHeader("My Uploads", "Quản lý nội dung bạn đã đăng.")}
    <section class="listing-section"><div id="listing-result">
      <div class="loading-state">Loading your uploads...</div>
    </div></section>
  `;

  try {
    const result = await api("/me/uploads");
    const items = Array.isArray(result) ? result : (result.items || result.mods || []);
    $("#listing-result").innerHTML = renderCards(items, true);
  } catch (error) {
    $("#listing-result").innerHTML = `
      <div class="api-state">
        <div class="api-symbol">♙</div>
        <h3>Chưa thể tải My Uploads</h3>
        <p>Chức năng này cần Workshop Backend và phiên đăng nhập hợp lệ.</p>
        <span>${escapeHTML(error.message)}</span>
      </div>
    `;
  }
}

function renderUploadPage() {
  $("#page-content").innerHTML = `
    ${pageHeader("Publish content", "Chia sẻ sáng tạo của bạn với cộng đồng KBVERSE.")}
    <form id="upload-form" class="upload-form">
      <div class="form-section">
        <div class="form-section-heading"><span>01</span><div><h2>Content details</h2><p>Thông tin hiển thị trên Workshop.</p></div></div>

        <label>Content name<input name="name" required maxlength="100" placeholder="Tên nội dung"></label>
        <label>Category
          <select name="category" required>
            <option value="mod">Mod</option>
            <option value="shader">Shader</option>
            <option value="asset">Asset</option>
            <option value="tool">Tool</option>
          </select>
        </label>
        <label>Description<textarea name="description" required maxlength="3000" rows="5" placeholder="Mô tả nội dung của bạn..."></textarea></label>
        <div class="form-row">
          <label>KBVERSE compatibility<input name="compatibility" required placeholder="Ví dụ: 2.0.x"></label>
          <label>Hardware requirements<input name="hardware" placeholder="Ví dụ: GPU requirements"></label>
        </div>
        <label>Changelog<textarea name="changelog" rows="3" placeholder="Thay đổi trong phiên bản này..."></textarea></label>
      </div>

      <div class="form-section">
        <div class="form-section-heading"><span>02</span><div><h2>Upload package</h2><p>File phân phối cho người dùng.</p></div></div>
        <label class="file-drop">
          <span class="file-icon">⇧</span>
          <strong id="file-name">Chọn package để tải lên</strong>
          <small>Mod: .kbmod.json · Các danh mục khác: .zip</small>
          <input name="package" type="file" accept=".json,.kbmod.json,.zip" required>
        </label>
        <label>Cover image (optional)<input name="cover" type="file" accept="image/png,image/jpeg,image/webp"></label>
        <div id="package-feedback" class="feedback"></div>
      </div>

      <div class="form-actions">
        <p>Việc đăng công khai cần được Workshop Backend xác thực và kiểm duyệt.</p>
        <button type="submit" class="primary-button large">Submit for review ↗</button>
      </div>
    </form>
  `;

  const form = $("#upload-form");
  form.querySelector('[name="package"]').addEventListener("change", event => {
    const file = event.target.files[0];
    $("#file-name").textContent = file ? file.name : "Chọn package để tải lên";
  });

  form.addEventListener("submit", submitUpload);
}

async function submitUpload(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const file = formData.get("package");
  const category = formData.get("category");
  const feedback = $("#package-feedback");

  if (!(file instanceof File) || !file.size) {
    feedback.textContent = "Chưa chọn package.";
    return;
  }

  if (file.size > 100 * 1024 * 1024) {
    feedback.textContent = "Package vượt quá giới hạn 100 MB.";
    return;
  }

  if (category === "mod") {
    try {
      const pkg = JSON.parse(await file.text());
      const m = pkg.manifest;

      if (!m || typeof m.id !== "string" || !m.name ||
          !/^\d+\.\d+\.\d+$/.test(m.version || "") ||
          m.apiVersion !== 1 || typeof pkg.source !== "string") {
        throw new Error("Manifest không đúng định dạng KB Loader API v1.");
      }
    } catch (error) {
      feedback.textContent = "Package mod không hợp lệ: " + error.message;
      return;
    }
  } else if (!file.name.toLowerCase().endsWith(".zip")) {
    feedback.textContent = "Danh mục này cần package .zip.";
    return;
  }

  feedback.textContent = "Đang gửi package lên Workshop...";
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;

  try {
    await api("/mods", {
      method: "POST",
      body: formData
    });

    feedback.textContent = "Đã gửi nội dung. Chờ hệ thống kiểm duyệt.";
    form.reset();
    $("#file-name").textContent = "Chọn package để tải lên";
  } catch (error) {
    feedback.textContent =
      "Chưa thể đăng: " + error.message +
      ". Cần Workshop Backend và tài khoản được xác thực.";
  } finally {
    button.disabled = false;
  }
}

async function openDetails(id) {
  try {
    const result = await api("/mods/" + encodeURIComponent(id));
    const item = result.mod || result;

    const name = escapeHTML(item.name || item.title);
    const cover = coverURL(item.coverUrl || item.cover);
    const author = escapeHTML(item.author?.name || item.author || "Unknown");
    const description = escapeHTML(item.description || "");
    const version = escapeHTML(item.latestVersion || item.version || "");
    const changelog = escapeHTML(item.changelog || "No changelog provided.");
    const downloadURL = API_BASE + "/mods/" + encodeURIComponent(id) + "/download";

    $("#modal-root").innerHTML = `
      <div class="modal-backdrop" data-action="close-modal">
        <section class="detail-modal" role="dialog" aria-modal="true">
          <button class="modal-close" data-action="close-modal">✕</button>
          ${cover ? `<img class="detail-cover" src="${cover}" alt="">` : ""}
          <div class="eyebrow">${escapeHTML(item.category || "MOD")}</div>
          <h2>${name}</h2>
          <p class="creator">by ${author} · v${version}</p>
          <p>${description}</p>
          <div class="detail-meta">
            <span>Downloads: ${formatNumber(item.downloads)}</span>
            <span>Rating: ${item.rating == null ? "Not rated" : escapeHTML(item.rating)}</span>
            <span>KBVERSE: ${escapeHTML(item.compatibility || "Not specified")}</span>
          </div>
          <h3>Changelog</h3>
          <p>${changelog}</p>
          <a class="primary-button large download-button" href="${escapeHTML(downloadURL)}">Download package ↓</a>
          <p class="detail-note">Chỉ tải và cài mod từ nguồn bạn tin tưởng.</p>
        </section>
      </div>
    `;
  } catch (error) {
    showNotice("Không thể tải chi tiết mod: " + error.message);
  }
}

function showNotice(message) {
  const node = document.createElement("div");
  node.className = "notice";
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 4000);
}

async function handleClick(event) {
  const button = event.target.closest("[data-page], [data-action]");
  if (!button) return;

  if (button.dataset.page) {
    event.preventDefault();
    state.page = button.dataset.page;
    updateNavigation();
    renderPage();
    return;
  }

  if (button.dataset.action === "close-modal") {
    $("#modal-root").innerHTML = "";
    return;
  }

  if (button.dataset.action === "detail") {
    await openDetails(button.dataset.id);
  }
}

function renderPage() {
  updateNavigation();

  if (state.page === "upload") {
    renderUploadPage();
  } else if (state.page === "uploads") {
    void loadUploads();
  } else {
    renderListingPage();
    void loadListings();
  }
}

renderShell();
renderPage();
