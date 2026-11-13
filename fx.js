/* AISSA CH — motion layer built on Motion (motion.dev). Runs after app.js on the home page only. */
(function () {
  "use strict";
  const M = window.Motion;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const hero = $(".fx-hero");
  if (!hero) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer:fine)").matches;
  const C = window.CONFIG, T = window.I18N, APPS = window.APPS || [];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ico = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  const wa = text => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`;
  const lang = () => (document.documentElement.lang === "fr" ? "fr" : "ar");
  const ease = [0.76, 0, 0.24, 1], out = [0.22, 1, 0.36, 1];

  const FX = {
    ar: { story: "ماذا أفعل؟", show: "أعمالي", swipe: "اسحب لتصفّح المشاريع",
          sk: ["تطبيقات أندرويد ومواقع ويب عربية، من الفكرة إلى يد المستخدم.",
               "أوثّق الأعراس والمناسبات بالكاميرا مع فريق VISION Pro.",
               "إصلاح الهواتف وصيانتها: أعرف كيف تعمل من الداخل."] },
    fr: { story: "CE QUE JE FAIS", show: "RÉALISATIONS", swipe: "Glissez pour parcourir",
          sk: ["Applications Android et sites web, de l'idée jusqu'à l'utilisateur.",
               "Je filme mariages et événements avec l'équipe VISION Pro.",
               "Réparation et entretien de téléphones : je les connais de l'intérieur."] }
  };
  const WORD = { zad: "ZAD", rehlat: "RIHLA", tashkila: "TASHKILA", darli: "DARLI", visionpro: "VISION", tasli7: "TASLI7" };

  /* ---------- helpers ---------- */
  function split(el, text, goldFrom = 99) {
    el.style.setProperty("--n", Math.max(text.length, 3));
    el.innerHTML = [...text].map((c, i) => `<span class="fx-ch${i >= goldFrom ? " gold" : ""}"><i>${c === " " ? "&nbsp;" : esc(c)}</i></span>`).join("");
    return $$("i", el);
  }
  function hex(c) { c = c.replace("#", ""); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); }
  function mix(c, k) { const a = hex(c), b = [6, 8, 15]; return `rgb(${a.map((v, i) => Math.round(v * (1 - k) + b[i] * k)).join(",")})`; }
  function primary(a) {
    const L = T[lang()];
    if (a.kind === "apk") return `<a class="btn gold sm fx-mag" href="${a.url}" target="_blank" rel="noopener">${ico("i-dl")}${L.download}</a>`;
    if (a.kind === "web") return `<a class="btn gold sm fx-mag" href="${a.url}" target="_blank" rel="noopener">${ico("i-ext")}${L.visit}</a>`;
    if (a.kind === "private") return `<a class="btn gold sm fx-mag" href="${wa(L.orderMsg(a.name[lang()]))}" target="_blank" rel="noopener">${ico("i-wa")}${L.order}</a>`;
    return `<span class="btn line sm" aria-disabled="true">${L.soon}</span>`;
  }

  /* ---------- static extras: grain, cursor ---------- */
  document.body.classList.add("fx");
  document.body.insertAdjacentHTML("beforeend", `<div class="fx-grain" aria-hidden="true"></div>`);

  /* ---------- hero ---------- */
  const heroWord = $("#heroWord");
  let heroChars = split(heroWord, "AISSACH", 5);

  /* ---------- showcase ---------- */
  const show = $("#showcase");
  let cur = 0, busy = false;
  APPS.forEach(a => { const im = new Image(); im.src = a.shots[0]; });
  function paintShow(a, i) {
    const L = T[lang()];
    show.style.setProperty("--sbg", mix(a.color, .25));
    show.style.setProperty("--sbg2", mix(a.color, .88));
    $$(".fx-show .fx-orb").forEach(o => o.style.setProperty("--oc", a.color));
    $("#sImg").src = a.shots[0]; $("#sImg").alt = a.name[lang()];
    $("#sLogo").src = a.logo; $("#sLogo").parentNode.style.background = a.logoBg;
    $("#sName").textContent = a.name[lang()];
    $("#sShort").textContent = a.short[lang()];
    $("#sChip").textContent = L.status[a.status] + (a.kind === "private" ? " · " + L.private : "");
    $("#sActs").innerHTML = `<button class="btn glass sm" type="button" data-open="${a.id}">${L.details}</button>${primary(a)}`;
    $("#sIdx").textContent = `${String(i + 1).padStart(2, "0")} / ${String(APPS.length).padStart(2, "0")}`;
    $$("#sDots i").forEach((d, k) => d.classList.toggle("on", k === i));
    bindMag();
  }
  function showText() {
    const L = T[lang()], F = FX[lang()];
    $("#sEy").textContent = F.show;
    $("#storyEy").textContent = F.story;
    $$(".fx-feat").forEach((f, i) => { $("h3", f).textContent = L.skills[i]; $("p", f).textContent = F.sk[i]; });
    $("#sPrev").setAttribute("aria-label", L.prev); $("#sNext").setAttribute("aria-label", L.next);
  }
  $("#sDots").innerHTML = APPS.map(() => "<i></i>").join("");
  const word = a => WORD[a.id] || a.name.fr.toUpperCase();
  let showChars = split($("#sWord"), word(APPS[0]));
  paintShow(APPS[0], 0); showText();

  async function go(dir, origin) {
    if (busy || !M || reduce) { if (!M || reduce) { cur = (cur + dir + APPS.length) % APPS.length; paintShow(APPS[cur], cur); split($("#sWord"), word(APPS[cur])); } return; }
    busy = true;
    const next = (cur + dir + APPS.length) % APPS.length, a = APPS[next];
    const r = show.getBoundingClientRect(), o = (origin || $("#sNext")).getBoundingClientRect();
    const x = o.left + o.width / 2 - r.left, y = o.top + o.height / 2 - r.top;
    const R = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
    const wipe = $("#sWipe");
    wipe.style.background = `radial-gradient(110% 85% at 50% 42%, ${mix(a.color, .25)} 0%, ${mix(a.color, .88)} 82%)`;
    const w = M.animate(0, 1, { duration: 1, ease, onUpdate: p => wipe.style.clipPath = `circle(${p * R}px at ${x}px ${y}px)` });
    await Promise.all([
      M.animate(showChars, { y: ["0%", dir > 0 ? "-110%" : "110%"] }, { duration: .5, delay: M.stagger(.035), ease }),
      M.animate("#sPw", { rotate: [0, dir * -120], scale: [1, .35], opacity: [1, 0] }, { duration: .5, ease: [.5, 0, .75, 0] }),
      M.animate(".fx-info", { opacity: [1, 0], y: [0, 16] }, { duration: .35 })
    ]);
    paintShow(a, next);
    showChars = split($("#sWord"), word(a));
    M.animate(showChars, { y: [dir > 0 ? "110%" : "-110%", "0%"] }, { duration: .85, delay: M.stagger(.045), ease: out });
    M.animate("#sPw", { rotate: [dir * 120, 0], scale: [.35, 1], opacity: [0, 1] }, { type: "spring", stiffness: 80, damping: 12 });
    M.animate(".fx-info", { opacity: [0, 1], y: [16, 0] }, { duration: .6, delay: .25, ease: out });
    await w;
    show.style.setProperty("--sbg", mix(a.color, .25)); show.style.setProperty("--sbg2", mix(a.color, .88));
    wipe.style.clipPath = "circle(0 at 50% 50%)";
    cur = next; busy = false;
  }
  let auto = null, showVisible = false;
  const stopAuto = () => { clearInterval(auto); auto = null; setTimeout(startAuto, 12000); };
  function startAuto() { if (!auto && !reduce) auto = setInterval(() => { if (showVisible && !document.hidden && $("#detail").hidden) go(1); }, 5200); }
  $("#sNext").onclick = e => { stopAuto(); go(1, e.currentTarget); };
  $("#sPrev").onclick = e => { stopAuto(); go(-1, e.currentTarget); };
  let tx0 = null;
  show.addEventListener("touchstart", e => tx0 = e.touches[0].clientX, { passive: true });
  show.addEventListener("touchend", e => {
    if (tx0 === null) return; const d = e.changedTouches[0].clientX - tx0; tx0 = null;
    if (Math.abs(d) > 50) { stopAuto(); const rtl = document.documentElement.dir === "rtl"; go((d > 0) === rtl ? 1 : -1, $("#sNext")); }
  });
  addEventListener("keydown", e => { if (!showVisible || !$("#detail").hidden || !$("#modal").hidden) return; if (e.key === "ArrowLeft" || e.key === "ArrowRight") { stopAuto(); go((e.key === "ArrowLeft") === (document.documentElement.dir === "rtl") ? 1 : -1); } });

  /* ---------- lead word light-up ---------- */
  function splitLead() {
    const p = $("#lead"); p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="wd">${esc(w)}</span>`).join(" ");
    return $$(".wd", p);
  }
  let wds = splitLead();

  /* ---------- language change from app.js ---------- */
  document.addEventListener("langchange", () => { paintShow(APPS[cur], cur); showText(); wds = splitLead(); });

  /* ---------- magnetic buttons ---------- */
  function bindMag() {
    if (!fine || !M) return;
    $$(".fx-mag, .fx-hb .btn, .contact .btn.gold").forEach(b => {
      if (b._mag) return; b._mag = 1;
      b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); M.animate(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .3 }, { duration: .3 }); });
      b.addEventListener("pointerleave", () => M.animate(b, { x: 0, y: 0 }, { type: "spring", stiffness: 220, damping: 10 }));
    });
  }

  if (!M || reduce) { $(".fx-loader") && $(".fx-loader").remove(); $$(".fx-v, .fx-feat").forEach(e => e.style.opacity = 1); return; }
  bindMag();

  /* ---------- cursor ---------- */
  if (fine) {
    const cu = document.createElement("div"); cu.className = "fx-cursor"; document.body.appendChild(cu);
    let cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; });
    (function f() { cx += (tx - cx) * .18; cy += (ty - cy) * .18; cu.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(f); })();
    document.addEventListener("pointerover", e => cu.classList.toggle("big", !!e.target.closest("a,button,.card,.fx-phone")));
  }

  /* ---------- hero parallax ---------- */
  const orbs = $$(".fx-orb");
  if (fine) {
    addEventListener("pointermove", e => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      orbs.forEach(o => o.style.transform = `translate(${nx * o.dataset.d}px,${ny * o.dataset.d}px)`);
      $("#ptilt").style.transform = `translate(${nx * -16}px,${ny * -8}px)`;
      $("#sTilt").style.transform = `perspective(900px) rotateY(${nx * 22}deg) rotateX(${-ny * 14}deg)`;
    });
  }

  /* ---------- scroll-linked ---------- */
  M.scroll(p => {
    heroWord.style.transform = `translateY(${p * 40}%) scale(${1 + p * .35})`;
    heroWord.style.opacity = 1 - p * 1.3;
    $(".fx-portrait").style.transform = `translateX(-50%) translateY(${p * 18}%) scale(${1 - p * .12})`;
  }, { target: hero, offset: ["start start", "end start"] });

  M.scroll(p => {
    const n = Math.floor(p * wds.length * 1.15);
    wds.forEach((w, i) => w.style.opacity = i < n ? 1 : .14);
  }, { target: $("#lead"), offset: ["start 85%", "end 45%"] });

  const feats = $$(".fx-feat"), vis = $$(".fx-v"), rings = $$(".fx-ring");
  M.scroll(p => {
    $("#storyBg").style.transform = `translateX(${(p - .5) * -60}%)`;
    rings.forEach((r, i) => r.style.transform = `translate(-50%,-50%) scale(${.6 + p * (.8 + i * .25)})`);
    $("#storyProg").style.transform = `scaleY(${p})`;
    const n = feats.length;
    feats.forEach((f, i) => {
      const c = (i + .5) / n, d = Math.abs(p - c) * n, o = clamp(1.5 - d * 2.8, 0, 1);
      f.style.opacity = o; f.style.transform = `translateY(${(p - c) * -160}px)`;
      const v = vis[i], local = (p - c) * n;
      v.style.opacity = o;
      v.style.transform = `rotate(${local * 30}deg) scale(${.75 + o * .25}) translateY(${local * -12}%)`;
      v.style.visibility = o > 0 ? "visible" : "hidden";
    });
  }, { target: $("#skills"), offset: ["start start", "end end"] });

  /* showcase visibility (for auto-play) */
  M.inView(show, () => { showVisible = true; startAuto(); return () => { showVisible = false; }; }, { amount: .5 });

  /* ---------- nav hide + marquee skew ---------- */
  let lastY = scrollY, skew = 0;
  const nav = $("#nav"), msk = $("#mskew");
  (function loop() {
    const y = scrollY, v = y - lastY; lastY = y;
    if (Math.abs(v) > 2 && $("#sheet").hidden) nav.classList.toggle("fx-hide", v > 0 && y > 240);
    skew += (clamp(v * .4, -14, 14) - skew) * .12;
    msk.style.transform = `skewX(${skew}deg)`;
    requestAnimationFrame(loop);
  })();

  /* ---------- contact big title ---------- */
  const rows = $$(".fx-cta-title .row");
  rows.forEach(r => split(r, r.textContent.trim()));
  const ctaChars = $$(".fx-cta-title i");
  ctaChars.forEach(c => c.style.transform = "translateY(110%)");
  M.inView(".fx-cta-title", () => { M.animate(ctaChars, { y: ["110%", "0%"], rotate: [10, 0] }, { duration: 1, delay: M.stagger(.05), ease: out }); });

  /* ---------- loader + intro ---------- */
  async function intro() {
    const loader = $(".fx-loader");
    heroChars.forEach(c => c.style.transform = "translateY(110%)");
    $(".fx-portrait img").style.opacity = 0;
    const seen = (() => { try { return sessionStorage.getItem("fxSeen"); } catch (e) { return 1; } })();
    if (loader && !seen && !location.hash && !document.documentElement.dataset.app) {
      document.body.style.overflow = "hidden";
      await M.animate(0, 100, { duration: 1.7, ease: [.65, 0, .35, 1], onUpdate: v => { $("#fxCount").textContent = Math.round(v); $("#fxBar").style.transform = `scaleX(${v / 100})`; } });
      await M.animate(loader, { clipPath: ["inset(0 0 0% 0)", "inset(0 0 100% 0)"] }, { duration: .9, ease });
      document.body.style.overflow = "";
      try { sessionStorage.setItem("fxSeen", 1); } catch (e) {}
    }
    loader && loader.remove();
    M.animate(heroChars, { y: ["110%", "0%"] }, { duration: 1.1, delay: M.stagger(.06), ease: out });
    M.animate(".fx-portrait img", { opacity: [0, 1], y: [80, 0] }, { duration: 1.2, delay: .2, ease: out });
    M.animate(".fx-hb > *, .fx-hint", { opacity: [0, 1], y: [30, 0] }, { duration: .9, delay: M.stagger(.1, { startDelay: .45 }), ease: out });
  }
  intro();
})();
