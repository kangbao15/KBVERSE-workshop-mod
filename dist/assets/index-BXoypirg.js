(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function n(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(s){if(s.ep)return;s.ep=!0;const i=n(s);fetch(s.href,i)}})();const b="/api/v1".replace(/\/+$/,""),f=[{id:"mod",name:"Mods",icon:"🧩",description:"Mở rộng chức năng KBVERSE"},{id:"shader",name:"Shaders",icon:"✨",description:"Hiệu ứng hình ảnh và ánh sáng"},{id:"asset",name:"Assets",icon:"🏗️",description:"Model, texture và vật liệu"},{id:"tool",name:"Tools",icon:"🔧",description:"Công cụ dành cho creator"}],r={page:"discover",query:"",sort:"popular",items:[],loading:!1,error:"",detail:null},d=e=>document.querySelector(e),o=e=>String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);async function u(e,t={}){const n=await fetch(b+e,{credentials:"include",...t}),a=await n.json().catch(()=>({}));if(!n.ok)throw new Error(a.message||a.error||`Server returned ${n.status}`);return a}function m(e){return f.find(t=>t.id===e)?.icon||"📦"}function y(e){const t=Number(e);return Number.isFinite(t)?new Intl.NumberFormat("vi-VN").format(t):"0"}function k(e){if(!e||typeof e!="string")return"";if(e.startsWith("/"))return o(e);try{const t=new URL(e);return["https:","http:"].includes(t.protocol)?o(t.href):""}catch{return""}}function M(e,t=!1){const n=o(e.id||e.slug||""),a=o(e.name||e.title||"Untitled"),s=o(e.category||"mod"),i=o(e.author?.name||e.author||"Unknown creator"),l=o(e.description||""),c=k(e.coverUrl||e.cover),p=o(e.latestVersion||e.version||"Unknown"),g=c?`<img src="${c}" alt="${a}" loading="lazy" onerror="this.style.display='none'">`:`<div class="card-placeholder">${m(s)}</div>`;return`
    <article class="mod-card">
      <button class="card-image" data-action="detail" data-id="${n}" aria-label="View ${a}">
        ${g}
        <span class="card-category">${m(s)} ${s}</span>
      </button>
      <div class="card-body">
        <div class="card-heading">
          <h3>${a}</h3>
          <span class="version">v${p}</span>
        </div>
        <p class="card-description">${l}</p>
        <div class="creator">by ${i}</div>
        <div class="card-footer">
          <span>↓ ${y(e.downloads)}</span>
          <span>★ ${e.rating==null?"No rating":o(e.rating)}</span>
          ${t?`<span class="upload-status">${o(e.status||"Pending")}</span>`:""}
        </div>
      </div>
    </article>
  `}function w(e,t=!1){return e.length?`<div class="mod-grid">${e.map(n=>M(n,t)).join("")}</div>`:`
      <div class="empty-state">
        <div class="empty-icon">◇</div>
        <h3>${t?"Chưa có nội dung đã đăng":"Chưa có mod được xuất bản"}</h3>
        <p>${t?"Các nội dung bạn đăng sẽ xuất hiện tại đây.":"Danh mục này sẽ hiển thị nội dung thật khi Workshop Backend được kết nối."}</p>
        ${t?'<button class="primary-button" data-page="upload">Đăng nội dung đầu tiên</button>':""}
      </div>
    `}function L(){const e={discover:["Discover","Khám phá những sáng tạo dành cho KBVERSE."],mods:["Mods","Mod mở rộng chức năng và trải nghiệm."],shaders:["Shaders","Hiệu ứng ánh sáng và hình ảnh."],assets:["Assets","Model 3D, texture và vật liệu."],tools:["Tools","Công cụ dành cho nhà sáng tạo."],uploads:["My Uploads","Quản lý nội dung bạn đã đăng."],upload:["Publish","Đưa sáng tạo của bạn lên KB Workshop."]};return e[r.page]||e.discover}function E(){d("#app").innerHTML=`
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
  `,document.addEventListener("click",O),d("#search").addEventListener("input",e=>{r.query=e.target.value,!(r.page!=="discover"&&r.page!=="mods"&&r.page!=="shaders"&&r.page!=="assets"&&r.page!=="tools")&&(clearTimeout(window.__kbSearchTimer),window.__kbSearchTimer=setTimeout(v,300))})}function C(){document.querySelectorAll("[data-page]").forEach(e=>{e.classList.toggle("active",e.dataset.page===r.page)})}function h(e,t){return`
    <div class="page-header">
      <div>
        <div class="eyebrow">KBVERSE COMMUNITY PLATFORM</div>
        <h1>${o(e)}</h1>
        <p>${o(t)}</p>
      </div>
    </div>
  `}function T(){const[e,t]=L(),n=r.page==="discover";d("#page-content").innerHTML=`
    ${n?`
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
          ${f.map(a=>`
            <button class="category-card" data-page="${a.id==="mod"?"mods":a.id+"s"}">
              <span class="category-icon">${a.icon}</span>
              <span><strong>${a.name}</strong><small>${a.description}</small></span>
              <b>↗</b>
            </button>
          `).join("")}
        </div>
      </section>
    `:h(e,t)}

    <section class="listing-section">
      <div class="section-heading">
        <div><div class="eyebrow">${r.page==="discover"?"COMMUNITY RELEASES":"CATALOG"}</div>
        <h2>${r.page==="discover"?"Explore creations":"Browse "+o(e)}</h2></div>
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
  `,d("#sort").value=r.sort,d("#sort").addEventListener("change",a=>{r.sort=a.target.value,v()})}async function v(){const e=d("#listing-result");if(!e)return;e.innerHTML='<div class="loading-state">Loading...</div>';const t={mods:"mod",shaders:"shader",assets:"asset",tools:"tool"},n=new URLSearchParams({query:r.query,sort:r.sort,page:"1",limit:"24"});t[r.page]&&n.set("category",t[r.page]);try{const a=await u("/mods?"+n.toString()),s=Array.isArray(a)?a:a.items||a.mods||[];r.items=s,d("#connection").innerHTML="<i></i> API Connected",d("#connection").classList.add("online"),e.innerHTML=w(s)}catch(a){r.items=[],d("#connection").innerHTML="<i></i> API Offline",d("#connection").classList.remove("online"),e.innerHTML=`
      <div class="api-state">
        <div class="api-symbol">⌁</div>
        <h3>Workshop Backend chưa kết nối</h3>
        <p>Website riêng đã sẵn sàng. Để tải và hiển thị các mod đã xuất bản, cần kết nối Workshop API.</p>
        <span>${o(a.message)}</span>
      </div>
    `}}async function S(){d("#page-content").innerHTML=`
    ${h("My Uploads","Quản lý nội dung bạn đã đăng.")}
    <section class="listing-section"><div id="listing-result">
      <div class="loading-state">Loading your uploads...</div>
    </div></section>
  `;try{const e=await u("/me/uploads"),t=Array.isArray(e)?e:e.items||e.mods||[];d("#listing-result").innerHTML=w(t,!0)}catch(e){d("#listing-result").innerHTML=`
      <div class="api-state">
        <div class="api-symbol">♙</div>
        <h3>Chưa thể tải My Uploads</h3>
        <p>Chức năng này cần Workshop Backend và phiên đăng nhập hợp lệ.</p>
        <span>${o(e.message)}</span>
      </div>
    `}}function x(){d("#page-content").innerHTML=`
    ${h("Publish content","Chia sẻ sáng tạo của bạn với cộng đồng KBVERSE.")}
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
  `;const e=d("#upload-form");e.querySelector('[name="package"]').addEventListener("change",t=>{const n=t.target.files[0];d("#file-name").textContent=n?n.name:"Chọn package để tải lên"}),e.addEventListener("submit",P)}async function P(e){e.preventDefault();const t=e.currentTarget,n=new FormData(t),a=n.get("package"),s=n.get("category"),i=d("#package-feedback");if(!(a instanceof File)||!a.size){i.textContent="Chưa chọn package.";return}if(a.size>100*1024*1024){i.textContent="Package vượt quá giới hạn 100 MB.";return}if(s==="mod")try{const c=JSON.parse(await a.text()),p=c.manifest;if(!p||typeof p.id!="string"||!p.name||!/^\d+\.\d+\.\d+$/.test(p.version||"")||p.apiVersion!==1||typeof c.source!="string")throw new Error("Manifest không đúng định dạng KB Loader API v1.")}catch(c){i.textContent="Package mod không hợp lệ: "+c.message;return}else if(!a.name.toLowerCase().endsWith(".zip")){i.textContent="Danh mục này cần package .zip.";return}i.textContent="Đang gửi package lên Workshop...";const l=t.querySelector('[type="submit"]');l.disabled=!0;try{await u("/mods",{method:"POST",body:n}),i.textContent="Đã gửi nội dung. Chờ hệ thống kiểm duyệt.",t.reset(),d("#file-name").textContent="Chọn package để tải lên"}catch(c){i.textContent="Chưa thể đăng: "+c.message+". Cần Workshop Backend và tài khoản được xác thực."}finally{l.disabled=!1}}async function R(e){try{const t=await u("/mods/"+encodeURIComponent(e)),n=t.mod||t,a=o(n.name||n.title),s=k(n.coverUrl||n.cover),i=o(n.author?.name||n.author||"Unknown"),l=o(n.description||""),c=o(n.latestVersion||n.version||""),p=o(n.changelog||"No changelog provided."),g=b+"/mods/"+encodeURIComponent(e)+"/download";d("#modal-root").innerHTML=`
      <div class="modal-backdrop" data-action="close-modal">
        <section class="detail-modal" role="dialog" aria-modal="true">
          <button class="modal-close" data-action="close-modal">✕</button>
          ${s?`<img class="detail-cover" src="${s}" alt="">`:""}
          <div class="eyebrow">${o(n.category||"MOD")}</div>
          <h2>${a}</h2>
          <p class="creator">by ${i} · v${c}</p>
          <p>${l}</p>
          <div class="detail-meta">
            <span>Downloads: ${y(n.downloads)}</span>
            <span>Rating: ${n.rating==null?"Not rated":o(n.rating)}</span>
            <span>KBVERSE: ${o(n.compatibility||"Not specified")}</span>
          </div>
          <h3>Changelog</h3>
          <p>${p}</p>
          <a class="primary-button large download-button" href="${o(g)}">Download package ↓</a>
          <p class="detail-note">Chỉ tải và cài mod từ nguồn bạn tin tưởng.</p>
        </section>
      </div>
    `}catch(t){B("Không thể tải chi tiết mod: "+t.message)}}function B(e){const t=document.createElement("div");t.className="notice",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),4e3)}async function O(e){const t=e.target.closest("[data-page], [data-action]");if(t){if(t.dataset.page){e.preventDefault(),r.page=t.dataset.page,C(),$();return}if(t.dataset.action==="close-modal"){d("#modal-root").innerHTML="";return}t.dataset.action==="detail"&&await R(t.dataset.id)}}function $(){C(),r.page==="upload"?x():r.page==="uploads"?S():(T(),v())}E();$();
