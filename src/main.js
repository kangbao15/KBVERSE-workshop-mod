import {
  isFirebaseConfigured,
  watchAuth,
  loginWithGoogle,
  loginWithGithub,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  fetchMods,
  fetchMyUploads,
  fetchModById,
  createMod,
  deleteMod,
  incrementDownload
} from "./firebase.js";

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
  user: null,
  authReady: false,
  authMode: "login"
};

const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

function iconFor(category) {
  return categories.find(item => item.id === category)?.icon || "📦";
}

function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? new Intl.NumberFormat("vi-VN").format(n) : "0";
}

function formatPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return "Free";
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function safeURL(value) {
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
  const id = escapeHTML(item.id || "");
  const name = escapeHTML(item.name || "Untitled");
  const category = escapeHTML(item.category || "mod");
  const author = escapeHTML(item.authorName || item.author || "Creator");
  const description = escapeHTML(item.description || "");
  const cover = safeURL(item.coverUrl || item.cover);
  const version = escapeHTML(item.latestVersion || item.version || "1.0.0");
  const priceLabel = formatPrice(item.price);

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
          <span class="version">v${version} · ${escapeHTML(priceLabel)}</span>
        </div>
        <p class="card-description">${description}</p>
        <div class="creator">by ${author}</div>
        <div class="card-footer">
          <span>↓ ${formatNumber(item.downloads)}</span>
          <span>★ ${item.rating == null ? "New" : escapeHTML(item.rating)}</span>
          ${uploads
            ? `<button class="outline-button" style="padding:4px 10px;font-size:12px" data-action="delete-mod" data-id="${id}">Xóa</button>`
            : `<span class="upload-status">${escapeHTML(priceLabel)}</span>`}
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
          : "Hãy là người đầu tiên chia sẻ mod lên KB Workshop!"}</p>
        <button class="primary-button" data-page="upload">Đăng nội dung đầu tiên</button>
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

function renderAuthArea() {
  const container = $("#auth-actions");
  if (!container) return;

  if (!state.user) {
    container.innerHTML = `
      <button class="outline-button" data-action="open-auth">Đăng nhập</button>
      <button class="primary-button" data-page="upload">+ Publish</button>
    `;
    return;
  }

  const name = escapeHTML(state.user.displayName || state.user.email?.split("@")[0] || "Creator");
  container.innerHTML = `
    <button class="outline-button" data-page="uploads">${name}</button>
    <button class="primary-button" data-page="upload">+ Publish</button>
    <button class="outline-button" data-action="logout" title="Đăng xuất">Thoát</button>
  `;
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
        <span id="connection" class="connection ${isFirebaseConfigured ? "online" : ""}">
          <i></i> ${isFirebaseConfigured ? "Firebase Online" : "Thiếu config"}
        </span>
        <div id="auth-actions" style="display:flex;gap:8px;align-items:center"></div>
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
          <span>KB Workshop · v0.2.0</span>
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

  renderAuthArea();
  document.addEventListener("click", handleClick);
  $("#search").addEventListener("input", event => {
    state.query = event.target.value;
    if (!["discover", "mods", "shaders", "assets", "tools"].includes(state.page)) return;
    clearTimeout(window.__kbSearchTimer);
    window.__kbSearchTimer = setTimeout(loadListings, 250);
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

  try {
    const items = await fetchMods({
      category: categoryMap[state.page] || "",
      search: state.query,
      sort: state.sort
    });
    state.items = items;
    $("#connection").innerHTML = "<i></i> Firebase Online";
    $("#connection").classList.add("online");
    output.innerHTML = renderCards(items);
  } catch (error) {
    state.items = [];
    $("#connection").innerHTML = "<i></i> Lỗi kết nối";
    $("#connection").classList.remove("online");
    output.innerHTML = `
      <div class="api-state">
        <div class="api-symbol">⌁</div>
        <h3>Không thể tải danh sách mod</h3>
        <p>Kiểm tra cấu hình Firebase hoặc Firestore Security Rules.</p>
        <span>${escapeHTML(error.message)}</span>
      </div>
    `;
  }
}

async function loadUploads() {
  if (!state.user) {
    $("#page-content").innerHTML = `
      ${pageHeader("My Uploads", "Quản lý nội dung bạn đã đăng.")}
      <div class="api-state">
        <div class="api-symbol">♙</div>
        <h3>Đăng nhập để xem My Uploads</h3>
        <p>Đăng nhập bằng GitHub, Google hoặc Email để quản lý mod của bạn.</p>
        <button class="primary-button" data-action="open-auth">Đăng nhập / Đăng ký</button>
      </div>
    `;
    return;
  }

  $("#page-content").innerHTML = `
    ${pageHeader("My Uploads", "Quản lý nội dung bạn đã đăng.")}
    <section class="listing-section"><div id="listing-result">
      <div class="loading-state">Loading your uploads...</div>
    </div></section>
  `;

  try {
    const items = await fetchMyUploads(state.user.uid);
    $("#listing-result").innerHTML = renderCards(items, true);
  } catch (error) {
    $("#listing-result").innerHTML = `
      <div class="api-state">
        <div class="api-symbol">⌁</div>
        <h3>Không tải được My Uploads</h3>
        <span>${escapeHTML(error.message)}</span>
      </div>
    `;
  }
}

function renderUploadPage() {
  if (!state.user) {
    $("#page-content").innerHTML = `
      ${pageHeader("Publish content", "Chia sẻ sáng tạo của bạn với cộng đồng KBVERSE.")}
      <div class="api-state">
        <div class="api-symbol">＋</div>
        <h3>Đăng nhập để đăng mod lên Workshop</h3>
        <p>Hỗ trợ đăng nhập nhanh bằng GitHub, Google hoặc Email.</p>
        <button class="primary-button" data-action="open-auth">Đăng nhập / Đăng ký ngay</button>
      </div>
    `;
    return;
  }

  $("#page-content").innerHTML = `
    ${pageHeader("Publish content", "Chia sẻ sáng tạo của bạn với cộng đồng KBVERSE.")}
    <form id="upload-form" class="upload-form">
      <div class="form-section">
        <div class="form-section-heading"><span>01</span><div><h2>Content details</h2><p>Thông tin hiển thị trên Workshop.</p></div></div>

        <label>Content name<input name="name" required maxlength="100" placeholder="Tên mod / shader / asset"></label>
        <div class="form-row">
          <label>Category
            <select name="category" required>
              <option value="mod">Mod</option>
              <option value="shader">Shader</option>
              <option value="asset">Asset</option>
              <option value="tool">Tool</option>
            </select>
          </label>
          <label>Version<input name="version" required value="1.0.0" placeholder="1.0.0"></label>
        </div>
        <label>Description<textarea name="description" required maxlength="3000" rows="4" placeholder="Mô tả tính năng nội dung của bạn..."></textarea></label>
        <div class="form-row">
          <label>KBVERSE compatibility<input name="compatibility" required value="1.0.x" placeholder="Ví dụ: 1.0.x"></label>
          <label>Giá bán (VNĐ — nhập 0 nếu Miễn phí)<input name="price" type="number" min="0" step="1000" value="0"></label>
        </div>
        <label>Link thanh toán / liên hệ mua (nếu đặt giá > 0)<input name="purchaseUrl" type="url" placeholder="https://... (để trống nếu miễn phí)"></label>
        <label>Cover image URL (tùy chọn)<input name="coverUrl" type="url" placeholder="https://...png hoặc .jpg"></label>
        <label>Changelog<textarea name="changelog" rows="2" placeholder="Thay đổi trong phiên bản này..."></textarea></label>
      </div>

      <div class="form-section">
        <div class="form-section-heading"><span>02</span><div><h2>Package source</h2><p>Chọn file .kbmod.json (lưu trực tiếp) hoặc dán link tải gói (.zip / GitHub Release).</p></div></div>
        <label class="file-drop">
          <span class="file-icon">⇧</span>
          <strong id="file-name">Chọn file .kbmod.json (tùy chọn nếu đã có link tải)</strong>
          <small>Mod JSON dưới 700 KB sẽ được lưu trực tiếp trên Workshop</small>
          <input name="package" type="file" accept=".json,.kbmod.json">
        </label>
        <label>Hoặc link tải trực tiếp (.zip / GitHub Release)<input name="downloadUrl" type="url" placeholder="https://github.com/.../releases/download/..."></label>
        <div id="package-feedback" class="feedback"></div>
      </div>

      <div class="form-actions">
        <p>Đăng dưới tên: <strong>${escapeHTML(state.user.displayName || state.user.email)}</strong></p>
        <button type="submit" class="primary-button large">Publish ngay ↗</button>
      </div>
    </form>
  `;

  const form = $("#upload-form");
  form.querySelector('[name="package"]').addEventListener("change", event => {
    const file = event.target.files[0];
    $("#file-name").textContent = file ? file.name : "Chọn file .kbmod.json (tùy chọn nếu đã có link tải)";
  });

  form.addEventListener("submit", submitUpload);
}

async function submitUpload(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const file = formData.get("package");
  const downloadUrl = String(formData.get("downloadUrl") || "").trim();
  const feedback = $("#package-feedback");

  let inlineJson = "";
  let fileName = "";

  if (file instanceof File && file.size > 0) {
    if (file.size > 700 * 1024) {
      feedback.textContent = "File JSON vượt 700 KB. Hãy up lên GitHub Release rồi dán link vào ô bên dưới.";
      return;
    }
    try {
      const rawText = await file.text();
      JSON.parse(rawText);
      inlineJson = rawText;
      fileName = file.name;
    } catch (error) {
      feedback.textContent = "File JSON không hợp lệ: " + error.message;
      return;
    }
  }

  if (!inlineJson && !downloadUrl) {
    feedback.textContent = "Hãy chọn file .kbmod.json hoặc nhập link tải package.";
    return;
  }

  feedback.textContent = "Đang xuất bản lên KB Workshop...";
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;

  try {
    await createMod({
      name: String(formData.get("name") || "").trim(),
      category: String(formData.get("category") || "mod"),
      latestVersion: String(formData.get("version") || "1.0.0").trim(),
      description: String(formData.get("description") || "").trim(),
      compatibility: String(formData.get("compatibility") || "1.0.x").trim(),
      price: Number(formData.get("price") || 0),
      purchaseUrl: String(formData.get("purchaseUrl") || "").trim(),
      coverUrl: String(formData.get("coverUrl") || "").trim(),
      changelog: String(formData.get("changelog") || "").trim(),
      inlineJson,
      fileName,
      downloadUrl
    });

    showNotice("Đã xuất bản thành công!");
    state.page = "uploads";
    renderPage();
  } catch (error) {
    feedback.textContent = "Lỗi khi đăng: " + error.message;
  } finally {
    button.disabled = false;
  }
}

function openAuthModal(mode = "login") {
  state.authMode = mode;
  const isRegister = mode === "register";

  $("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="detail-modal" role="dialog" aria-modal="true" style="max-width:420px">
        <button class="modal-close" data-action="close-modal">✕</button>
        <div class="eyebrow">KBVERSE ACCOUNT</div>
        <h2>${isRegister ? "Tạo tài khoản Creator" : "Đăng nhập KB Workshop"}</h2>
        <p class="creator" style="margin-bottom:16px">Đăng nhập nhanh để đăng và quản lý mod của bạn.</p>

        <div style="display:grid;gap:10px;margin-bottom:16px">
          <button type="button" class="primary-button" style="justify-content:center;width:100%" data-action="auth-github">
            Tiếp tục với GitHub
          </button>
          <button type="button" class="outline-button" style="justify-content:center;width:100%" data-action="auth-google">
            Tiếp tục với Google
          </button>
        </div>

        <form id="auth-form" style="display:grid;gap:10px">
          ${isRegister ? `<input name="name" required placeholder="Tên hiển thị (ví dụ: KangBao15)" style="padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);color:inherit">` : ""}
          <input name="email" type="email" required placeholder="Email" style="padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);color:inherit">
          <input name="password" type="password" required minlength="6" placeholder="Mật khẩu (tối thiểu 6 ký tự)" style="padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);color:inherit">
          <div id="auth-feedback" class="feedback" style="color:#ff8a8a;font-size:13px"></div>
          <button type="submit" class="primary-button" style="justify-content:center;width:100%">
            ${isRegister ? "Đăng ký bằng Email" : "Đăng nhập bằng Email"}
          </button>
        </form>

        <p style="margin-top:14px;font-size:13px;text-align:center">
          ${isRegister
            ? `Đã có tài khoản? <a href="#" data-action="switch-auth" data-mode="login">Đăng nhập</a>`
            : `Chưa có tài khoản? <a href="#" data-action="switch-auth" data-mode="register">Đăng ký ngay</a>`}
        </p>
      </section>
    </div>
  `;

  $("#auth-form").addEventListener("submit", async event => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const fb = $("#auth-feedback");
    fb.textContent = "Đang xử lý...";

    try {
      if (isRegister) {
        await registerWithEmail(
          String(fd.get("name") || ""),
          String(fd.get("email") || ""),
          String(fd.get("password") || "")
        );
      } else {
        await loginWithEmail(
          String(fd.get("email") || ""),
          String(fd.get("password") || "")
        );
      }
      $("#modal-root").innerHTML = "";
      showNotice("Đăng nhập thành công!");
    } catch (error) {
      fb.textContent = error.message;
    }
  });
}

async function openDetails(id) {
  try {
    const item = await fetchModById(id);

    const name = escapeHTML(item.name || "Untitled");
    const cover = safeURL(item.coverUrl || item.cover);
    const author = escapeHTML(item.authorName || item.author || "Creator");
    const description = escapeHTML(item.description || "");
    const version = escapeHTML(item.latestVersion || item.version || "1.0.0");
    const changelog = escapeHTML(item.changelog || "No changelog provided.");
    const isPaid = Number(item.price) > 0;
    const purchaseUrl = safeURL(item.purchaseUrl);
    const downloadUrl = safeURL(item.downloadUrl);

    let actionButton = "";
    if (isPaid && purchaseUrl) {
      actionButton = `<a class="primary-button large download-button" href="${purchaseUrl}" target="_blank" rel="noopener">Mua gói (${escapeHTML(formatPrice(item.price))}) ↗</a>`;
    } else if (item.inlineJson) {
      actionButton = `<button class="primary-button large download-button" data-action="download-inline" data-id="${escapeHTML(item.id)}">Download ${escapeHTML(item.fileName || "mod.kbmod.json")} ↓</button>`;
    } else if (downloadUrl) {
      actionButton = `<a class="primary-button large download-button" data-action="track-download" data-id="${escapeHTML(item.id)}" href="${downloadUrl}" target="_blank" rel="noopener">Download package ↓</a>`;
    } else {
      actionButton = `<span class="detail-note">Creator chưa đính kèm link tải.</span>`;
    }

    $("#modal-root").innerHTML = `
      <div class="modal-backdrop" data-action="close-modal">
        <section class="detail-modal" role="dialog" aria-modal="true">
          <button class="modal-close" data-action="close-modal">✕</button>
          ${cover ? `<img class="detail-cover" src="${cover}" alt="">` : ""}
          <div class="eyebrow">${escapeHTML(item.category || "MOD")} · ${escapeHTML(formatPrice(item.price))}</div>
          <h2>${name}</h2>
          <p class="creator">by ${author} · v${version}</p>
          <p>${description}</p>
          <div class="detail-meta">
            <span>Downloads: ${formatNumber(item.downloads)}</span>
            <span>Price: ${escapeHTML(formatPrice(item.price))}</span>
            <span>KBVERSE: ${escapeHTML(item.compatibility || "Not specified")}</span>
          </div>
          <h3>Changelog</h3>
          <p>${changelog}</p>
          ${actionButton}
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

  const action = button.dataset.action;

  if (action === "close-modal") {
    if (event.target === button || button.classList.contains("modal-close")) {
      $("#modal-root").innerHTML = "";
    }
    return;
  }

  if (action === "open-auth") {
    openAuthModal("login");
    return;
  }

  if (action === "switch-auth") {
    event.preventDefault();
    openAuthModal(button.dataset.mode || "login");
    return;
  }

  if (action === "auth-google") {
    try {
      await loginWithGoogle();
      $("#modal-root").innerHTML = "";
      showNotice("Đã đăng nhập bằng Google!");
    } catch (error) {
      const fb = $("#auth-feedback");
      if (fb) fb.textContent = error.message;
    }
    return;
  }

  if (action === "auth-github") {
    try {
      await loginWithGithub();
      $("#modal-root").innerHTML = "";
      showNotice("Đã đăng nhập bằng GitHub!");
    } catch (error) {
      const fb = $("#auth-feedback");
      if (fb) fb.textContent = error.message;
    }
    return;
  }

  if (action === "logout") {
    await logoutUser();
    showNotice("Đã đăng xuất.");
    renderPage();
    return;
  }

  if (action === "detail") {
    await openDetails(button.dataset.id);
    return;
  }

  if (action === "download-inline") {
    const item = await fetchModById(button.dataset.id);
    if (!item.inlineJson) return;
    const blob = new Blob([item.inlineJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.fileName || "mod.kbmod.json";
    a.click();
    URL.revokeObjectURL(url);
    void incrementDownload(item.id);
    return;
  }

  if (action === "track-download") {
    void incrementDownload(button.dataset.id);
    return;
  }

  if (action === "delete-mod") {
    if (!confirm("Xóa nội dung này khỏi Workshop?")) return;
    try {
      await deleteMod(button.dataset.id);
      showNotice("Đã xóa nội dung.");
      await loadUploads();
    } catch (error) {
      showNotice("Lỗi khi xóa: " + error.message);
    }
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
watchAuth(user => {
  state.user = user;
  state.authReady = true;
  renderAuthArea();
  if (state.page === "upload" || state.page === "uploads") {
    renderPage();
  }
});
renderPage();
