// Leuchtfreunde – Shop-Vorschau ohne Backend. Warenkorb liegt im localStorage.

const FIGURES = {
  draco: { name: "Draco", tag: "Der kleine Drache, der auf dein Kind aufpasst.", badge: "Bestseller" },
  fina: { name: "Fina", tag: "Die Füchsin, die jeden Weg im Dunkeln kennt.", badge: "Neu" },
  momo: { name: "Momo", tag: "Das freundlichste Monster gegen Monster unterm Bett.", badge: "Gegen Monster" },
  luna: { name: "Luna", tag: "Das Einhorn, das nachts schöne Träume verteilt.", badge: "Beliebt" },
  benny: { name: "Benny", tag: "Der Bär, der zuhört, wenn der Tag zu viel war.", badge: "Zum Trösten" },
};
const BUNDLES = { 1: { price: 39.9, old: null }, 2: { price: 69.9, old: 79.8 }, 3: { price: 99.9, old: 119.7 } };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const eur = (n) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const img = (fig) => `img/f-${fig}.jpg`;

let current = "draco";

// Laufband oben: Inhalt verdoppeln, damit es mobil nahtlos läuft
const ticker = $(".ticker");
$$("span", ticker).forEach((s) => { const c = s.cloneNode(true); c.classList.add("dup"); ticker.append(c); });

// Hero: Licht-Schalter
const heroPhoto = $("#hero-photo");
const lightSwitch = $("#light-switch");
// Intro: Zimmer startet dunkel, dann geht das Licht an
heroPhoto.classList.add("intro");
setTimeout(() => heroPhoto.classList.remove("dark"), 900);
setTimeout(() => heroPhoto.classList.remove("intro"), 3600);
lightSwitch.addEventListener("click", () => {
  const dark = heroPhoto.classList.toggle("dark");
  lightSwitch.setAttribute("aria-pressed", dark);
  $(".ls-label", lightSwitch).textContent = dark ? "Licht an" : "Licht aus – probier’s!";
});

// Figur wählen
function selectFigure(fig) {
  current = fig;
  const f = FIGURES[fig];
  $$(".swatch").forEach((s) => s.classList.toggle("active", s.dataset.fig === fig));
  $("#fig-name").textContent = f.name;
  $("#fig-legend").textContent = f.name;
  $("#fig-tag").textContent = f.tag;
  $("#main-badge").textContent = f.badge;
  $("#thumb-fig").src = img(fig);
  $("#sticky-img").src = img(fig);
  $("#sticky-name").textContent = f.name;
  setMain(img(fig));
  $$(".thumb").forEach((t, i) => t.classList.toggle("active", i === 0));
}

const mainImg = $("#main-img");
function setMain(src, contain = true) {
  mainImg.classList.add("swap");
  setTimeout(() => {
    mainImg.src = src;
    mainImg.classList.toggle("contain", contain);
    mainImg.classList.remove("swap");
  }, 180);
}

$$(".swatch").forEach((s) => s.addEventListener("click", () => selectFigure(s.dataset.fig)));
$$(".thumb").forEach((t) => t.addEventListener("click", () => {
  $$(".thumb").forEach((x) => x.classList.toggle("active", x === t));
  if (t.dataset.src === "figure") setMain(img(current));
  else setMain(t.dataset.src, false);
}));
$$("[data-pick]").forEach((b) => b.addEventListener("click", () => {
  selectFigure(b.dataset.pick);
  $("#shop").scrollIntoView({ behavior: "smooth" });
}));

// Bundle-Preis
function bundleValue() { return Number($("input[name=bundle]:checked").value); }
function updatePrice() {
  const b = BUNDLES[bundleValue()];
  $("#price-now").textContent = eur(b.price);
  const old = $("#price-old"), save = $("#price-save");
  old.hidden = save.hidden = !b.old;
  if (b.old) {
    old.textContent = eur(b.old);
    save.textContent = `Du sparst ${eur(b.old - b.price)}`;
  }
  $("#add-to-cart").textContent = `In den Warenkorb – ${eur(b.price)}`;
}
$$("input[name=bundle]").forEach((r) => r.addEventListener("change", updatePrice));
updatePrice();

// Lieferdatum: 2 Werktage
function deliveryDate() {
  const d = new Date();
  let added = 0;
  while (added < 2) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}
$("#delivery-date").textContent = `am ${deliveryDate()}`;

// Warenkorb
let cart = JSON.parse(localStorage.getItem("lf-cart") || "[]");
const save = () => localStorage.setItem("lf-cart", JSON.stringify(cart));

function renderCart() {
  const list = $("#cart-items");
  list.innerHTML = "";
  let sum = 0, count = 0;
  cart.forEach((item, i) => {
    const b = BUNDLES[item.bundle];
    sum += b.price * item.qty;
    count += item.bundle * item.qty;
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <img src="${img(item.fig)}" alt="">
      <div class="ci-body">
        <b>Leuchtfreund ${FIGURES[item.fig].name}</b>
        <small>${item.bundle === 1 ? "Einzeln" : `${item.bundle}er-Set`} · Geschenkbox gratis</small>
        <span class="qty"><button data-i="${i}" data-d="-1" aria-label="weniger">−</button>${item.qty}<button data-i="${i}" data-d="1" aria-label="mehr">+</button></span>
      </div>
      <span class="ci-price">${eur(b.price * item.qty)}</span>`;
    list.append(li);
  });
  $("#cart-sum").textContent = eur(sum);
  const badge = $("#cart-count");
  badge.textContent = count;
  badge.classList.toggle("show", count > 0);
  $("#cart-empty").hidden = cart.length > 0;
  $("#drawer-foot").hidden = cart.length === 0;
}

$("#cart-items").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-i]");
  if (!btn) return;
  const item = cart[btn.dataset.i];
  item.qty += Number(btn.dataset.d);
  if (item.qty <= 0) cart.splice(btn.dataset.i, 1);
  save();
  renderCart();
});

function openCart() { document.body.classList.add("cart-open"); $("#drawer").setAttribute("aria-hidden", "false"); }
function closeCart() { document.body.classList.remove("cart-open"); $("#drawer").setAttribute("aria-hidden", "true"); }
$("#cart-open").addEventListener("click", openCart);
$("#cart-close").addEventListener("click", closeCart);
$("#drawer-bg").addEventListener("click", closeCart);
$("#cart-browse").addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

$("#add-to-cart").addEventListener("click", () => {
  const bundle = bundleValue();
  const hit = cart.find((c) => c.fig === current && c.bundle === bundle);
  if (hit) hit.qty++;
  else cart.push({ fig: current, bundle, qty: 1 });
  save();
  renderCart();
  const cb = $("#cart-open");
  cb.classList.remove("bump"); void cb.offsetWidth; cb.classList.add("bump");
  setTimeout(openCart, 250);
});

$("#checkout").addEventListener("click", () => toast("Vorschau: Die Kasse ist noch nicht angebunden 💛"));

let toastTimer;
function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

renderCart();

// Timer-Grafik: zählt im Takt der Glow-Animation von 30 auf 0
const timerMin = $("#timer-min");
let t0 = performance.now();
function tick(now) {
  const p = ((now - t0) % 8000) / 8000; // 8 s Zyklus wie CSS
  let min;
  if (p < 0.2) min = 30;
  else if (p < 0.8) min = Math.round(30 * (1 - (p - 0.2) / 0.6));
  else min = 0;
  timerMin.textContent = min;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Mobile Kaufleiste nach dem Hero einblenden, im Shop ausblenden
const sticky = $("#sticky-buy");
const heroEl = $(".hero"), shopEl = $("#shop");
let heroVisible = true, shopVisible = false;
const stickyObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.target === heroEl) heroVisible = e.isIntersecting;
    if (e.target === shopEl) shopVisible = e.isIntersecting;
  });
  sticky.classList.toggle("show", !heroVisible && !shopVisible);
});
stickyObs.observe(heroEl);
stickyObs.observe(shopEl);

// Einblenden beim Scrollen
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); } });
}, { threshold: 0.15 });
$$(".pain-card, .how-step, .feature, .fig, .review, .safe, .promise-card, .founder-card, .table-wrap, .stats-grid > div").forEach((el, i) => {
  el.classList.add("reveal");
  el.style.transitionDelay = `${(i % 3) * 90}ms`;
  revealObs.observe(el);
});

// Zahlen hochzählen
const countObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, target = Number(el.dataset.count), start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / 1400, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString("de-DE") + (el.dataset.count === "12000" ? "+" : "");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    countObs.unobserve(el);
  });
});
$$("[data-count]").forEach((el) => countObs.observe(el));

// Atem-Licht: Rhythmus von 12 auf 6 Atemzüge/Min., Zeitraffer 10 Min. → 60 s
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const rateAt = (p) => 12 - 6 * Math.min(p, 1);
const level = (phase) => (1 - Math.cos(2 * Math.PI * phase)) / 2; // 0 = ausgeatmet, 1 = eingeatmet

// Hero: Bauchlicht atmet per JS, wird über eine Minute langsamer
const heroGlow = $(".belly-glow");
if (heroGlow && !reduceMotion) {
  heroGlow.style.animation = "none";
  let ph = 0, last = performance.now(), t0h = last;
  (function heroLoop(now) {
    const dt = (now - last) / 1000; last = now;
    ph += dt * rateAt((now - t0h) / 60000) / 60;
    const l = level(ph);
    heroGlow.style.opacity = (0.3 + 0.6 * l).toFixed(3);
    heroGlow.style.transform = `translate(-50%, -50%) scale(${(0.88 + 0.22 * l).toFixed(3)})`;
    heroPhoto.style.setProperty("--aura", l.toFixed(3));
    requestAnimationFrame(heroLoop);
  })(last);
}

// Demo-Abschnitt
const stage = $("#breath-stage");
const glow = $("#breath-glow"), dark = $("#breath-dark"), cue = $("#breath-cue");
const rateEl = $("#breath-rate"), barEl = $("#breath-bar"), timeEl = $("#breath-time"), btn = $("#breath-btn");
const DEMO = 60000, FADE = 5000;
let running = false, start = 0, phase = 0, prev = 0;

function paint(l, fade = 1) {
  stage.style.setProperty("--o", ((0.15 + 0.85 * l) * fade).toFixed(3));
  stage.style.setProperty("--s", (0.85 + 0.25 * l).toFixed(3));
  stage.style.setProperty("--halo", `${Math.round((20 + 70 * l) * fade)}px`);
  dark.style.opacity = (0.75 - 0.35 * l * fade).toFixed(3);
}

function breathLoop(now) {
  if (!running) return;
  const t = now - start, dt = (now - prev) / 1000; prev = now;
  if (t < DEMO) {
    const p = t / DEMO;
    phase += dt * rateAt(p) / 60; // Atemzug in Echtzeit, nur die Verlangsamung ist gerafft
    const frac = phase % 1;
    paint(level(phase));
    cue.textContent = frac < 0.5 ? "Einatmen …" : "Ausatmen …";
    rateEl.textContent = rateAt(p).toFixed(0);
    barEl.style.width = `${p * 100}%`;
    timeEl.textContent = `Minute ${Math.floor(p * 10)} von 10`;
  } else if (t < DEMO + FADE) {
    const f = 1 - (t - DEMO) / FADE;
    paint(0.6, f);
    cue.textContent = "Schlaf gut, kleiner Drache";
    barEl.style.width = "100%";
    timeEl.textContent = "Geschafft – Licht dimmt aus";
  } else {
    running = false;
    btn.textContent = "Nochmal atmen";
    btn.disabled = false;
    return;
  }
  requestAnimationFrame(breathLoop);
}

function startBreath() {
  if (running) return;
  running = true; phase = 0.75; // beginnt ausgeatmet
  start = prev = performance.now();
  btn.textContent = "Atmet …"; btn.disabled = true;
  requestAnimationFrame(breathLoop);
}
paint(0.4);
cue.textContent = "Drück auf Start";
btn.addEventListener("click", startBreath);
stage.addEventListener("click", startBreath);
if (!reduceMotion) {
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { startBreath(); obs.disconnect(); }
  }, { threshold: 0.6 }).observe(stage);
}

// Hero-Bild neigt sich leicht zur Maus (nur Desktop)
const heroVis = $(".hero-visual");
if (heroVis && matchMedia("(hover: hover)").matches && !reduceMotion) {
  heroVis.addEventListener("mousemove", (e) => {
    const r = heroVis.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    heroPhoto.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
    heroPhoto.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
  });
  heroVis.addEventListener("mouseleave", () => {
    heroPhoto.style.setProperty("--rx", "0deg");
    heroPhoto.style.setProperty("--ry", "0deg");
  });
}

// Scroll-Fortschritt unter der Navigation
const progress = $("#progress");
const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();
