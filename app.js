/* AISSA CH — app logic (vanilla JS, no framework) */
(function () {
  "use strict";
  const C = window.CONFIG, T = window.I18N, APPS = window.APPS;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ico = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  const wa = text => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PAGE_APP = document.documentElement.dataset.app || "";
  const byId = id => APPS.find(a => a.id === id);
  let lang = "ar", filter = "all", lastFocus = null, savedScroll = 0;
  try { const l = localStorage.getItem("lang"); if (l === "fr" || l === "ar") lang = l; } catch (e) {}
  const t = () => T[lang];

  /* ---------- small builders ---------- */
  const img = (src, alt = "", cls = "", lazy = true) =>
    `<img src="${src}" alt="${esc(alt)}" ${cls ? `class="${cls}"` : ""} ${lazy ? 'loading="lazy"' : ""} decoding="async" onload="this.classList.add('ok');this.parentNode.classList.add('done')" onerror="this.parentNode.classList.add('done')">`;
  const phone = (a, src, i) =>
    `<div class="ph"><div class="scr">${a.host ? `<span class="url">${esc(a.host)}</span>` : ""}${img(src, `${a.name[lang]} — ${i + 1}`)}</div></div>`;
  const browser = (a, base, i) =>
    `<div class="br"><div class="tb"><i></i><i></i><i></i><span>${esc(a.host || a.name[lang])}</span></div><div class="scr"><img src="${base}-720.webp" srcset="${base}-720.webp 720w, ${base}-1280.webp 1280w" sizes="(max-width:720px) 90vw, 760px" alt="${esc(a.name[lang])} — ${i + 1}" loading="lazy" decoding="async" onload="this.classList.add('ok');this.parentNode.classList.add('done')"></div></div>`;
  const logo = (a, cls = "logo") =>
    `<div class="${cls}" style="--c:${a.color};background:${a.logoBg}"><img src="${a.logo}" alt="" width="96" height="96" loading="lazy"></div>`;
  const badges = a => {
    const s = t().status[a.status];
    return `<div class="badges"><span class="badge ${a.status}">${s}</span>${a.kind === "private" ? `<span class="badge priv">${ico("i-lock")}${t().private}</span>` : ""}</div>`;
  };
  const tags = a => `<div class="tags">${a.tech.map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>`;
  function primary(a, size = "") {
    const L = t();
    if (a.kind === "apk") return `<a class="btn gold ${size}" href="${a.url}" target="_blank" rel="noopener">${ico("i-dl")}${L.download}</a>`;
    if (a.kind === "web") return `<a class="btn gold ${size}" href="${a.url}" target="_blank" rel="noopener">${ico("i-ext")}${L.visit}</a>`;
    if (a.kind === "private") return `<a class="btn line ${size}" href="${wa(L.orderMsg(a.name[lang]))}" target="_blank" rel="noopener">${ico("i-wa")}${L.order}</a>`;
    return `<span class="btn line ${size}" aria-disabled="true">${L.soon}</span>`;
  }
  const pageUrl = a => `${C.siteUrl}/${a.id}/`;

  /* ---------- static text ---------- */
  function applyText() {
    const L = t(), H = document.documentElement;
    H.lang = lang; H.dir = lang === "ar" ? "rtl" : "ltr";
    $$("[data-t]").forEach(el => { const v = L[el.dataset.t]; if (typeof v === "string") el.textContent = v; });
    $$("[data-nav]").forEach(el => el.textContent = L.nav[el.dataset.nav]);
    $$("[data-request]").forEach(el => { if (el.id !== "fab") el.textContent = L.request; });
    $("#fabTxt").textContent = L.request; $("#fab").setAttribute("aria-label", L.request);
    $("#h1").innerHTML = `${esc(L.h1[0])}<br><em>${esc(L.h1[1])}</em>`;
    const sk = [["i-code", L.skills[0]], ["i-cam", L.skills[1]], ["i-tool", L.skills[2]]];
    $("#skillRows").innerHTML = sk.map(s => `<li><span class="ic">${ico(s[0])}</span><span>${esc(s[1])}</span></li>`).join("");
    renderStage(); typer();
    $("#aboutImg").alt = L.aboutH; $(".about-photo").setAttribute("aria-label", L.aboutH);
    $("#aboutWa").href = wa(L.hello); $("#ctaWa").href = wa(L.hello);
    $("#aboutWa").target = $("#ctaWa").target = "_blank"; $("#aboutWa").rel = $("#ctaWa").rel = "noopener";
    $("#numTxt").textContent = C.phoneDisplay; $("#copyNum").textContent = L.copy;
    $("#menuBtn").setAttribute("aria-label", L.menu); $("#sheetX").setAttribute("aria-label", L.close);
    $("#toTop").setAttribute("aria-label", L.toTop); $("#lbX").setAttribute("aria-label", L.close);
    $("#skip").textContent = lang === "ar" ? "تخطَّ إلى الأعمال" : "Aller aux réalisations";
    $$("[data-lang]").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  }


  /* ---------- hero stage: three floating phones with real screens ---------- */
  function renderStage() {
    const z = byId("zad"), d = byId("darli"), r = byId("rehlat");
    $("#rig").innerHTML = `<div class="halo"></div>
      <div class="p-c">${phone(d, d.shots[0], 0)}</div>
      <div class="p-b">${phone(r, r.shots[0], 0)}</div>
      <div class="p-a">${phone(z, z.shots[0], 0)}</div>`;
    $$("#rig img").forEach(i => { i.removeAttribute("loading"); });
  }
  let typeTimer;
  function typer() {
    clearTimeout(typeTimer);
    const el = $("#type"), roles = t().roles; if (!el) return;
    el.textContent = roles[0]; if (reduce) return;
    let r = 0, i = roles[0].length, del = true;
    const step = () => {
      if (del) { i--; if (i <= 0) { del = false; r = (r + 1) % roles.length; } }
      else { i++; if (i >= roles[r].length) { del = true; el.textContent = roles[r]; typeTimer = setTimeout(step, 1800); return; } }
      el.textContent = roles[r].slice(0, Math.max(i, 0)); typeTimer = setTimeout(step, del ? 45 : 85);
    };
    typeTimer = setTimeout(step, 2200);
  }
  function parallax() {
    const rig = $("#rig"), stage = $("#stage"); if (!rig || reduce) return;
    if (matchMedia("(hover:hover)").matches) {
      stage.onpointermove = e => { const b = stage.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5; rig.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`; };
      stage.onpointerleave = () => { rig.style.transform = ""; };
    }
    addEventListener("scroll", () => { if (scrollY < 900) rig.style.translate = `0 ${scrollY * .1}px`; }, { passive: true });
  }

  /* ---------- work ---------- */
  function renderWork() {
    const L = t();
    const types = ["all", "app", "web", "client"];
    $("#filters").innerHTML = types.map(k => `<button class="chip" type="button" data-filter="${k}" aria-pressed="${filter === k}">${L.filters[k]}</button>`).join("");
    const f = APPS.find(a => a.featured);
    const showFeat = filter === "all" && f;
    $("#featured").innerHTML = showFeat ? `
      <article class="feat rv" style="--c:${f.color}">
        <div>
          <span class="eyebrow">${L.featured}</span>
          <div class="top" style="margin-top:20px">${logo(f)}${badges(f)}</div>
          <h3>${esc(f.name[lang])}</h3>
          <p class="lead">${esc(f.long[lang])}</p>
          <div style="margin-top:16px">${tags(f)}</div>
          <div class="ctas"><button class="btn glass" type="button" data-open="${f.id}">${L.details}${ico("i-arrow").replace("<svg", '<svg class="fl"')}</button>${primary(f)}</div>
        </div>
        <div class="trio">${phone(f, f.shots[1], 1)}${phone(f, f.shots[0], 0)}${phone(f, f.shots[3], 3)}</div>
      </article>` : "";
    const list = APPS.filter(a => (filter === "all" ? !a.featured : a.type === filter));
    $("#grid").innerHTML = list.map(card).join("");
    bindCards(); reveal();
  }
  function card(a) {
    const L = t();
    const media = a.frame === "browser" && a.desk ? browser(a, a.desk[0], 0) : phone(a, a.shots[0], 0) + (a.shots[1] ? phone(a, a.shots[1], 1) : "");
    return `<article class="card rv" style="--c:${a.color}">
      <div class="media">${media}</div>
      <div class="body">
        <div class="top">${logo(a)}<div><h3>${esc(a.name[lang])}</h3>${badges(a)}</div></div>
        <p class="desc">${esc(a.short[lang])}</p>
        ${tags(a)}
        <div class="acts"><button class="btn glass sm" type="button" data-open="${a.id}">${L.details}${ico("i-arrow").replace("<svg", '<svg class="fl"')}</button>${a.kind !== "soon" ? primary(a, "sm") : ""}</div>
      </div></article>`;
  }
  function bindCards() {
    if (reduce || !matchMedia("(hover:hover)").matches) return;
    $$(".card").forEach(el => {
      el.onpointermove = e => { const r = el.getBoundingClientRect(); el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%"); el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%"); };
    });
  }

  /* ---------- reveal (only below the fold, content is visible at rest otherwise) ---------- */
  let io;
  function reveal() {
    if (reduce || !("IntersectionObserver" in window)) return;
    io && io.disconnect();
    io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.remove("pre"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -6% 0px" });
    $$(".rv").forEach(el => { if (el.getBoundingClientRect().top > innerHeight * 0.95) { el.classList.add("pre"); io.observe(el); } });
  }

  /* ---------- detail ---------- */
  function renderDetail(a) {
    const L = t(), priv = a.kind === "private", i = APPS.indexOf(a);
    const prev = APPS[(i - 1 + APPS.length) % APPS.length], next = APPS[(i + 1) % APPS.length];
    const slides = [...(a.desk || []).map((b, k) => browser(a, b, k)), ...(a.frame === "browser" ? [] : a.shots.map((s, k) => phone(a, s, k))), ...(a.promos || []).map(u => `<figure class="promo" data-zoom="${u}"><img src="${u}" alt="${esc(a.name[lang])}" loading="lazy"></figure>`)];
    const d = $("#detail");
    d.style.setProperty("--c", a.color);
    d.innerHTML = `<div class="d-glow"></div>
      <div class="d-top gutter"><div class="wrap">
        <button class="btn glass sm" type="button" data-close>${ico("i-arrow").replace("<svg", `<svg class="${lang === "ar" ? "" : "fl"}" style="transform:scaleX(${lang === "ar" ? 1 : -1})"`)}${L.back}</button>
        <span class="brand"><img src="img/emblem.webp" alt="" width="34" height="25"><span class="word">AISSA <b>CH</b></span></span>
      </div></div>
      <div class="gutter"><div class="wrap d-hero">
        ${logo(a)}
        ${badges(a)}
        <h2 id="dTitle" tabindex="-1">${esc(a.name[lang])}</h2>
        <p class="lead">${esc(a.long[lang])}</p>
        <div class="pills">${a.info[lang].map(x => `<span class="pill">${esc(x)}</span>`).join("")}</div>
        <div class="ctas" style="justify-content:center;margin-top:6px">
          ${priv ? `<a class="btn gold" href="${wa(L.orderMsg(a.name[lang]))}" target="_blank" rel="noopener">${ico("i-wa")}${L.order}</a>`
            : a.kind === "apk" ? `<a class="btn gold" href="${a.url}" target="_blank" rel="noopener">${ico("i-dl")}${L.dlApk}</a>`
            : a.kind === "web" ? `<a class="btn gold" href="${a.url}" target="_blank" rel="noopener">${ico("i-ext")}${L.openSite}</a>`
            : `<span class="btn line" aria-disabled="true">${L.soon}</span>`}
          ${!priv ? `<a class="btn glass" href="${wa(L.shareMsg(a.name[lang], pageUrl(a)))}" target="_blank" rel="noopener">${ico("i-share")}${L.share}</a>` : ""}
        </div>
        ${priv ? `<p class="lead" style="font-size:14.5px;max-width:32em">${L.privNote}</p>` : ""}
      </div></div>
      <div class="gallery">
        <div class="track${a.frame === "browser" ? " wide" : ""}" id="track" tabindex="0" aria-label="${esc(L.shots)}">${slides.join("")}</div>
        <div class="dots" id="dots">${slides.map((_, k) => `<button type="button" aria-label="${k + 1} / ${slides.length}" ${k === 0 ? 'aria-current="true"' : ""}></button>`).join("")}</div>
        <p class="g-note">${L.shots}</p>
      </div>
      <div class="gutter"><div class="wrap d-grid">
        <div class="panel"><h3>${priv ? L.genH : L.featH}</h3><div class="fgrid">${a.feats[lang].map((f, k) => `<div class="fitem"><b class="num">${k + 1}</b><span>${esc(f)}</span></div>`).join("")}</div>
          <h3 style="margin-top:22px">${L.techH}</h3>${tags(a)}</div>
        <div class="side">
          ${!priv && a.url ? `<div class="panel qr"><div class="box" id="qrbox"></div><p>${L.qrP}</p></div>` : ""}
          <div class="panel">
            ${a.kind === "apk" ? `<details><summary>${L.installH}</summary><ol>${L.install.map(s => `<li>${s}</li>`).join("")}</ol></details>` : ""}
            ${a.log ? `<details open><summary>${L.logH}</summary><ul>${a.log[lang].map(s => `<li>${esc(s)}</li>`).join("")}</ul></details>` : ""}
            ${!priv ? `<details><summary>${L.privH}</summary><p>${a.kind === "web" ? L.privWeb : L.privApp}</p></details>` : `<details open><summary>${L.private}</summary><p>${L.privNote}</p></details>`}
          </div>
          ${!priv ? `<div class="panel"><h3 style="font-size:18px">${L.fbH}</h3>
            <div class="field"><label for="fb">${L.fbLbl}</label><textarea id="fb" placeholder="${esc(L.fbPh)}"></textarea></div>
            <a class="btn wa sm" id="fbSend" style="margin-top:12px;width:100%" href="${wa("[" + a.name[lang] + "] ")}" target="_blank" rel="noopener">${ico("i-wa")}${L.fbB}</a></div>` : ""}
        </div>
      </div></div>
      <div class="wrap nextp gutter">
        <button type="button" data-open="${prev.id}"><small>${L.prev}</small><b>${esc(prev.name[lang])}</b></button>
        <button type="button" data-open="${next.id}"><small>${L.next}</small><b>${esc(next.name[lang])}</b></button>
      </div>`;
    const box = $("#qrbox");
    if (box) { try { if (!window.QRCode) throw 0; new QRCode(box, { text: a.url, width: 208, height: 208, correctLevel: QRCode.CorrectLevel.M }); box.setAttribute("aria-label", "QR " + a.url); } catch (e) { box.parentElement.hidden = true; } }
    const fb = $("#fb"); if (fb) fb.oninput = () => { $("#fbSend").href = wa("[" + a.name[lang] + "] " + fb.value); };
    const tr = $("#track"), dots = $$("#dots button");
    dots.forEach((b, k) => b.onclick = () => { const el = tr.children[k]; tr.scrollTo({ left: el.offsetLeft - (tr.clientWidth - el.clientWidth) / 2, behavior: reduce ? "auto" : "smooth" }); });
    tr.addEventListener("scroll", () => { const c = tr.scrollLeft + tr.clientWidth / 2; let best = 0, bd = 1e9; [...tr.children].forEach((el, k) => { const m = el.offsetLeft + el.clientWidth / 2, dd = Math.abs(m - c); if (dd < bd) { bd = dd; best = k; } }); dots.forEach((b, k) => b.setAttribute("aria-current", k === best)); }, { passive: true });
  }
  function openDetail(a, fromRoute) {
    if ($("#detail").hidden) { savedScroll = scrollY; lastFocus = document.activeElement; }
    renderDetail(a);
    const d = $("#detail");
    d.hidden = false; d.scrollTop = 0; d.classList.remove("enter"); void d.offsetWidth; d.classList.add("enter");
    document.body.style.overflow = "hidden"; $("#main").setAttribute("aria-hidden", "true");
    setTimeout(() => { const h = $("#dTitle"); h && h.focus({ preventScroll: true }); }, 60);
    document.title = `${a.name[lang]} — AISSA CH`;
  }
  function closeDetail() {
    const d = $("#detail"); if (d.hidden) return;
    d.hidden = true; d.innerHTML = ""; document.body.style.overflow = ""; $("#main").removeAttribute("aria-hidden");
    document.title = "AISSA CH";
    window.scrollTo(0, savedScroll);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  function route() {
    const id = (location.hash || "").slice(1), a = byId(id);
    if (a) openDetail(a, true);
    else if (PAGE_APP && !id && byId(PAGE_APP) && !route.done) { route.done = true; openDetail(byId(PAGE_APP)); }
    else closeDetail();
  }
  function goApp(id) { if (location.hash === "#" + id) route(); else location.hash = id; }
  function leaveApp() {
    if (PAGE_APP && !location.hash) { location.href = "./"; return; }
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    closeDetail();
  }

  /* ---------- service request modal ---------- */
  const SVC_ICONS = ["i-cam", "i-web", "i-phone", "i-tool", "i-bulb", "i-help"];
  let modalState = { step: 1, svc: 0, data: { name: "", details: "", phone: "", pref: 0 } };
  function openModal(svc) {
    lastFocus = document.activeElement;
    modalState = { step: svc == null ? 1 : 2, svc: svc || 0, data: { name: "", details: "", phone: "", pref: 0 } };
    renderModal();
    const m = $("#modal"); m.hidden = false; m.classList.remove("enter"); void m.offsetWidth; m.classList.add("enter");
    document.body.style.overflow = "hidden";
    setTimeout(() => { const f = $("#modalPanel button.svc, #modalPanel input"); f && f.focus(); }, 50);
  }
  function closeModal() {
    const m = $("#modal"); if (m.hidden) return;
    m.hidden = true; if ($("#detail").hidden) document.body.style.overflow = "";
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  function renderModal() {
    const M = t().modal, L = t(), p = $("#modalPanel"), s = modalState;
    const head = (title, sub) => `<div class="m-head"><div><h2 id="mTitle">${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div><button class="icon-btn" type="button" data-mclose aria-label="${L.close}">${ico("i-x")}</button></div>`;
    if (s.step === 1) {
      p.innerHTML = head(M.title, M.sub) + `<div class="svc-grid">${M.services.map((n, k) => `<button class="svc" type="button" data-svc="${k}"><span class="ic">${ico(SVC_ICONS[k])}</span><span>${esc(n)}</span></button>`).join("")}</div>`;
      return;
    }
    const d = s.data;
    p.innerHTML = head(M.title, "") + `
      <form class="m-form" id="reqForm" novalidate>
        <span class="m-chip">${ico(SVC_ICONS[s.svc])}${esc(M.services[s.svc])}</span>
        <div class="field" id="f-name"><label for="rq-name">${M.name} *</label><input type="text" id="rq-name" autocomplete="name" placeholder="${esc(M.phName)}" value="${esc(d.name)}" aria-describedby="e-name"><span class="err" id="e-name" role="alert"></span></div>
        <div class="field"><label for="rq-svc">${M.service}</label><select id="rq-svc">${M.services.map((n, k) => `<option value="${k}" ${k === s.svc ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
        <div class="field" id="f-details"><label for="rq-details">${M.details} *</label><textarea id="rq-details" placeholder="${esc(M.phDetails)}" aria-describedby="e-details">${esc(d.details)}</textarea><span class="err" id="e-details" role="alert"></span></div>
        <div class="field" id="f-phone"><label for="rq-phone">${M.phone} <small>(${M.optional})</small></label><input type="tel" id="rq-phone" inputmode="tel" autocomplete="tel" placeholder="${esc(M.phPhone)}" value="${esc(d.phone)}" dir="ltr" aria-describedby="e-phone"><span class="err" id="e-phone" role="alert"></span></div>
        <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="lbl" style="margin-bottom:6px">${M.pref}</legend>
          <div class="radios">${M.prefs.map((n, k) => `<label><input type="radio" name="rq-pref" value="${k}" ${k === d.pref ? "checked" : ""}><span>${esc(n)}</span></label>`).join("")}</div></fieldset>
        <a class="btn wa" id="rqSend" href="#" target="_blank" rel="noopener" style="width:100%">${ico("i-wa")}${M.send}</a>
        <p class="m-note">${M.note}</p>
        <button class="linkish" type="button" data-mback>${M.change}</button>
      </form>`;
    const form = $("#reqForm");
    form.addEventListener("input", () => { collect(); updateLink(); clearErr(); });
    form.addEventListener("change", () => { collect(); updateLink(); });
    form.addEventListener("submit", e => e.preventDefault());
    $("#rqSend").addEventListener("click", e => { collect(); if (!validate()) { e.preventDefault(); } else updateLink(); });
    updateLink();
  }
  function collect() {
    const s = modalState;
    s.data.name = ($("#rq-name") || {}).value || ""; s.data.details = ($("#rq-details") || {}).value || ""; s.data.phone = ($("#rq-phone") || {}).value || "";
    const sel = $("#rq-svc"); if (sel) s.svc = +sel.value;
    const r = $('input[name="rq-pref"]:checked'); if (r) s.data.pref = +r.value;
    const chip = $(".m-chip"); if (chip) chip.innerHTML = ico(SVC_ICONS[s.svc]) + esc(t().modal.services[s.svc]);
  }
  const phoneOk = v => { const d = v.replace(/[\s.\-()+]/g, ""); return /^\d{9,15}$/.test(d); };
  function setErr(f, msg) { const el = $("#e-" + f); if (el) el.textContent = msg; const w = $("#f-" + f); w && w.classList.toggle("bad", !!msg); }
  function clearErr() { ["name", "details", "phone"].forEach(f => { const el = $("#e-" + f); if (el && el.textContent) { /* re-check live */ } }); }
  function validate() {
    const M = t().modal, d = modalState.data; let ok = true, first = null;
    const chk = (f, cond, msg) => { if (cond) { setErr(f, ""); } else { setErr(f, msg); ok = false; first = first || f; } };
    chk("name", d.name.trim().length >= 2, M.errName);
    chk("details", d.details.trim().length >= 10, M.errDetails);
    if (d.phone.trim()) chk("phone", phoneOk(d.phone), M.errPhone);
    else chk("phone", d.pref === 0, M.errPhoneReq);
    if (first) { const el = $("#rq-" + first); el && el.focus(); }
    return ok;
  }
  function message() {
    const M = t().modal, d = modalState.data, s = modalState;
    const lines = [`*${M.msgTitle}*`, "", `${M.msg.service}: ${M.services[s.svc]}`, `${M.msg.name}: ${d.name.trim()}`];
    if (d.phone.trim()) lines.push(`${M.msg.phone}: ${d.phone.trim()}`);
    lines.push(`${M.msg.pref}: ${M.prefs[d.pref]}`, "", `${M.msg.details}:`, d.details.trim());
    return lines.join("\n");
  }
  function updateLink() { const a = $("#rqSend"); if (a) a.href = wa(message()); }

  /* ---------- focus trap for dialogs ---------- */
  function trap(e, root) {
    const f = $$('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])', root).filter(x => x.offsetParent !== null);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- floating controls ---------- */
  function floating() {
    const fab = $("#fab"), top = $("#toTop");
    const hide = new Set();
    if ("IntersectionObserver" in window) {
      const o = new IntersectionObserver(es => { es.forEach(en => en.isIntersecting ? hide.add(en.target.id) : hide.delete(en.target.id)); fab.classList.toggle("away", hide.size > 0); }, { threshold: 0.2 });
      ["heroCtas", "contactCtas"].forEach(id => { const el = document.getElementById(id); el && o.observe(el); });
      const secs = ["work", "about", "contact"].map(id => document.getElementById(id));
      const o2 = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) $$(`[data-nav]`).forEach(a => a.setAttribute("aria-current", a.dataset.nav === en.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
      secs.forEach(s => s && o2.observe(s));
    }
    addEventListener("scroll", () => { top.hidden = scrollY < innerHeight * 1.2; }, { passive: true });
    top.onclick = () => { scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); $("#nav a").focus({ preventScroll: true }); };
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    const q = e.target.closest("[data-request]"); if (q) { e.preventDefault(); closeSheet(); openModal(); return; }
    const sv = e.target.closest("[data-svc]"); if (sv) { modalState.svc = +sv.dataset.svc; modalState.step = 2; renderModal(); setTimeout(() => $("#rq-name") && $("#rq-name").focus(), 30); return; }
    if (e.target.closest("[data-mback]")) { collect(); modalState.step = 1; renderModal(); const b = $(`[data-svc="${modalState.svc}"]`); b && b.focus(); return; }
    if (e.target.closest("[data-mclose]") || e.target.id === "modal") { closeModal(); return; }
    const o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); goApp(o.dataset.open); return; }
    if (e.target.closest("[data-close]")) { e.preventDefault(); leaveApp(); return; }
    const z = e.target.closest("[data-zoom]"); if (z) { lastFocus = z; $("#lbImg").src = z.dataset.zoom; $("#lb").hidden = false; $("#lbX").focus(); return; }
    const f = e.target.closest("[data-filter]"); if (f) { filter = f.dataset.filter; renderWork(); $(`[data-filter="${filter}"]`).focus(); return; }
    const l = e.target.closest("[data-lang]"); if (l) { setLang(l.dataset.lang); return; }
    const n = e.target.closest(".sheet [data-nav]"); if (n) { closeSheet(); }
    const nav = e.target.closest("[data-nav], .brand[href]"); if (nav && !$("#detail").hidden) closeDetail();
  });
  $("#lb").addEventListener("click", e => { if (e.target.id !== "lbImg") { $("#lb").hidden = true; lastFocus && lastFocus.focus && lastFocus.focus(); } });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!$("#lb").hidden) { $("#lb").hidden = true; return; }
      if (!$("#modal").hidden) { closeModal(); return; }
      if (!$("#sheet").hidden) { closeSheet(); return; }
      if (!$("#detail").hidden) { leaveApp(); return; }
    }
    if (e.key === "Tab") {
      if (!$("#modal").hidden) trap(e, $("#modalPanel"));
      else if (!$("#detail").hidden) trap(e, $("#detail"));
      else if (!$("#sheet").hidden) trap(e, $("#sheet"));
    }
  });
  function openSheet() { $("#sheet").hidden = false; $("#menuBtn").setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; $("#sheetX").focus(); }
  function closeSheet() { if ($("#sheet").hidden) return; $("#sheet").hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); if ($("#detail").hidden && $("#modal").hidden) document.body.style.overflow = ""; }
  $("#menuBtn").onclick = openSheet; $("#sheetX").onclick = () => { closeSheet(); $("#menuBtn").focus(); };
  $("#copyNum").onclick = () => {
    const b = $("#copyNum"), L = t();
    (navigator.clipboard ? navigator.clipboard.writeText(C.phoneDisplay.replace(/\s/g, "")) : Promise.reject())
      .then(() => { b.textContent = L.copied; setTimeout(() => b.textContent = L.copy, 1600); })
      .catch(() => { const r = document.createRange(); r.selectNodeContents($("#numTxt")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  };
  addEventListener("hashchange", route);

  function setLang(l) {
    lang = l; try { localStorage.setItem("lang", l); } catch (e) {}
    applyText(); renderWork();
    if (!$("#detail").hidden) { const id = (location.hash || "").slice(1) || PAGE_APP; const a = byId(id); a && renderDetail(a); }
    if (!$("#modal").hidden) { collect(); renderModal(); }
    document.dispatchEvent(new CustomEvent("langchange", { detail: l }));
  }

  applyText(); renderWork(); floating(); parallax(); route();
  // hero image loaded state
})();
