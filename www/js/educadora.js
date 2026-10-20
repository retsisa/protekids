// Educadora animada ("rig" 2D) a partir de UN solo PNG.
// El PNG se separó en capas (ver assets/images/educadora-rig/): cuerpo, antebrazo, boca cerrada y párpados.
// Todo lo demás se anima por código en un <canvas> a 60 fps:
//   - respiración, balanceo del cuerpo e inclinación de la cabeza (deformación suave por franjas)
//   - parpadeo natural (con doble parpadeo ocasional)
//   - boca que se abre y cierra con distintas formas (a, o, e...) mientras habla
//   - saludo: levanta el antebrazo y lo agita
// API (igual que antes): PK.Educadora.setTalking(bool), PK.Educadora.saludar(elemento)
// Si las capas no cargan, la app vuelve sola a la animación CSS anterior.
(function () {
  "use strict";
  var PK = window.PK;
  var P = "assets/images/educadora-rig/";
  var META = { W: 715, H: 1546,
    arm: { x: 0, y: 747 }, mouth: { x: 295, y: 325 },
    eyes: { l: { x: 228, y: 181, w: 130, h: 130 }, r: { x: 365, y: 249, w: 138, h: 118 } } };
  var PIVOT = { x: 152, y: 788 };          // codo (borde del puño): el antebrazo gira desde aquí
  var MOUTH_O = { x: 328.5, y: 342.5, ang: 24.7 * Math.PI / 180 }; // esquina a esquina de la sonrisa
  var PADX = 120, PADT = 24;                // margen del canvas para que la mano pueda subir/abrirse
  var CW = META.W + PADX * 2, CH = META.H + PADT;
  var STRIP = 5, FEET = 1500;

  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var IMG = {}, rigs = [], talking = false, running = false, loading = true, pending = [];

  // ---------- carga de capas ----------
  function loadAll(cb) {
    var names = { base: "base.png", arm: "forearm.png", mouth: "mouth_closed.png", eyeL: "eye_l_closed.png", eyeR: "eye_r_closed.png" };
    var left = 0, failed = false;
    Object.keys(names).forEach(function (k) {
      left += 1;
      var im = new Image();
      im.onload = function () { IMG[k] = im; left -= 1; if (!left && !failed) { cb(true); } };
      im.onerror = function () { if (!failed) { failed = true; cb(false); } };
      im.src = P + names[k];
    });
  }

  // ---------- utilidades ----------
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function easeOutBack(k) { var c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }
  function easeInOut(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  // formas de la boca (ancho / profundidad en px del PNG original)
  var VISEMES = [
    { w: 36, h: 0 },   // cerrada
    { w: 36, h: 6 },   // entreabierta (m, b, p)
    { w: 38, h: 24 },  // a
    { w: 24, h: 24 },  // o / u
    { w: 44, h: 12 },  // e / i
    { w: 30, h: 15 }   // intermedia
  ];
  var WEIGHTS = [1, 2, 4, 2, 3, 3];
  function pickViseme(prev) {
    var tot = 0, i; for (i = 0; i < WEIGHTS.length; i++) { tot += WEIGHTS[i]; }
    for (var tries = 0; tries < 6; tries++) {
      var r = Math.random() * tot, acc = 0;
      for (i = 0; i < WEIGHTS.length; i++) { acc += WEIGHTS[i]; if (r <= acc) { break; } }
      if (i !== prev) { return i; }
    }
    return (prev + 1) % VISEMES.length;
  }

  // ---------- un personaje por cada .edu de la app ----------
  function makeRig(edu) {
    var holder = edu.querySelector(".edu-img");
    if (!holder || !holder.parentNode) { return null; }
    var small = edu.classList.contains("small");
    var scale = small ? 0.3 : 0.55;
    var cv = document.createElement("canvas");
    cv.width = Math.round(CW * scale); cv.height = Math.round(CH * scale);
    cv.className = "edu-img edu-canvas";
    cv.setAttribute("role", "img");
    cv.setAttribute("aria-label", "Educadora ProteKids");
    holder.parentNode.replaceChild(cv, holder);
    edu.classList.add("rig");
    return {
      edu: edu, cv: cv, ctx: cv.getContext("2d"), scale: scale,
      wave: 0, blinkAt: rnd(1, 3), blinkT0: -1, blinkDouble: false,
      vis: 0, mw: 36, mh: 0, nextVis: 0, seed: Math.random() * 10, dbg: null
    };
  }

  // ---------- dibujo ----------
  function draw(r, now) {
    var t = now / 1000 + r.seed, ctx = r.ctx, d = r.dbg;
    if (d && d.t !== undefined) { t = d.t; }

    // saludo (ángulo del antebrazo) -------------------------------------------------
    var armA = Math.sin(t * 1.1) * 0.02, env = 0;
    if (r.wave) {
      var e = t - r.wave, D = 3.4, UP = 0.55, DOWN = 0.6, TOP = 1.95;
      if (e > D) { r.wave = 0; r.edu.classList.remove("wave"); }
      else if (e < UP) { env = easeOutBack(e / UP); armA = TOP * env; }
      else if (e > D - DOWN) { env = 1 - easeInOut((e - (D - DOWN)) / DOWN); armA = TOP * env; }
      else { env = 1; armA = TOP + 0.2 * Math.sin((e - UP) * 14); }
      env = Math.max(0, Math.min(1, env));
    }
    if (d && d.arm !== undefined) { armA = d.arm; env = d.arm / 1.95; }

    // movimiento del cuerpo ---------------------------------------------------------
    var sway = Math.sin(t * 0.9) * 5 + env * (Math.sin(t * 2.2) * 2.5 - 4);
    var tilt = Math.sin(t * 0.6) * 0.8 + (talking ? Math.sin(t * 5.1) * 0.45 : 0) - env * 1.1;
    var breath = (Math.sin(t * 1.7) + 1) / 2;
    var nod = talking ? (Math.sin(t * 8.3) + 1) / 2 : 0;
    if (d && d.talk !== undefined) { nod = d.talk; }
    if (reduce) { sway = 0; tilt = 0; breath = 0; nod = 0; }
    function dx(y) { return sway * Math.pow(Math.max(0, (FEET - y) / FEET), 1.5) + tilt * Math.max(0, 430 - y) * 0.025; }
    function dy(y) { return -(breath * 4 + nod * 3) * Math.max(0, Math.min(1, (1100 - y) / 1000)); }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, r.cv.width, r.cv.height);
    var s = r.scale;
    ctx.setTransform(s, 0, 0, s, PADX * s, PADT * s);
    ctx.imageSmoothingQuality = "high";

    // 1) antebrazo (va detrás del cuerpo: la manga lo tapa) -------------------------
    ctx.save();
    ctx.translate(PIVOT.x + dx(PIVOT.y), PIVOT.y + dy(PIVOT.y));
    ctx.rotate(armA);
    ctx.drawImage(IMG.arm, META.arm.x - PIVOT.x, META.arm.y - PIVOT.y);
    ctx.restore();

    // 2) cuerpo, deformado en franjas horizontales ----------------------------------
    var y = 0, y1, step, d0, d1;
    while (y < META.H) {
      step = y < 1130 ? STRIP : 26;
      y1 = Math.min(META.H, y + step);
      d0 = y + dy(y); d1 = y1 + dy(y1);
      ctx.drawImage(IMG.base, 0, y, META.W, y1 - y, dx((y + y1) / 2), d0, META.W, d1 - d0 + 0.7);
      y = y1;
    }

    // 3) parpadeo ------------------------------------------------------------------
    var lid = 0;
    if (d && d.lid !== undefined) { lid = d.lid; }
    else if (!reduce) {
      if (r.blinkT0 < 0 && t > r.blinkAt) { r.blinkT0 = t; }
      if (r.blinkT0 >= 0) {
        var be = t - r.blinkT0, C = 0.07, H = 0.05, O = 0.11;
        if (be < C) { lid = be / C; }
        else if (be < C + H) { lid = 1; }
        else if (be < C + H + O) { lid = 1 - (be - C - H) / O; }
        else {
          r.blinkT0 = -1;
          if (!r.blinkDouble && Math.random() < 0.18) { r.blinkDouble = true; r.blinkAt = t + 0.12; }
          else { r.blinkDouble = false; r.blinkAt = t + rnd(2.2, 5); }
        }
      }
    }
    if (lid > 0.02) {
      [["eyeL", META.eyes.l], ["eyeR", META.eyes.r]].forEach(function (p) {
        var b = p[1], yc = b.y + b.h / 2, hh = b.h * Math.min(1, lid);
        ctx.save();
        ctx.translate(dx(yc), dy(yc));
        ctx.beginPath(); ctx.rect(b.x, b.y, b.w, hh + (lid >= 1 ? 2 : 0)); ctx.clip();
        ctx.drawImage(IMG[p[0]], b.x, b.y);
        ctx.restore();
      });
    }

    // 4) boca ----------------------------------------------------------------------
    var tw, th;
    if (d && d.mouth) { r.mw = d.mouth.w; r.mh = d.mouth.h; }
    else {
      if (talking && !reduce) {
        if (t > r.nextVis) { r.vis = pickViseme(r.vis); r.nextVis = t + rnd(0.07, 0.14); }
        tw = VISEMES[r.vis].w; th = VISEMES[r.vis].h;
      } else { tw = 36; th = 0; }
      r.mw += (tw - r.mw) * 0.4; r.mh += (th - r.mh) * 0.4;
    }
    var my = MOUTH_O.y;
    ctx.save();
    ctx.translate(dx(my), dy(my));
    var closedA = r.mh < 0.8 ? 1 : (r.mh < 3 ? 1 - r.mh / 3 : 0);
    if (closedA > 0) {
      ctx.globalAlpha = closedA;
      ctx.drawImage(IMG.mouth, META.mouth.x, META.mouth.y);
      ctx.globalAlpha = 1;
    }
    if (r.mh >= 0.8) {
      var w = r.mw, h = r.mh;
      ctx.globalAlpha = r.mh < 3 ? r.mh / 3 : 1;
      ctx.translate(MOUTH_O.x, MOUTH_O.y);
      ctx.rotate(MOUTH_O.ang);
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.quadraticCurveTo(0, -2.5, w / 2, 0);
      ctx.bezierCurveTo(w * 0.42, h * 1.25, -w * 0.42, h * 1.25, -w / 2, 0);
      ctx.closePath();
      ctx.fillStyle = "#6b1f2e"; ctx.fill();
      ctx.save(); ctx.clip();
      if (h > 7) {                                   // dientes y lengua
        ctx.fillStyle = "#ffffff"; ctx.fillRect(-w / 2, -1, w, 4.2);
        ctx.fillStyle = "#ef8590";
        ctx.beginPath(); ctx.ellipse(0, h * 0.95, w * 0.3, h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      ctx.lineJoin = "round"; ctx.lineWidth = 2.6; ctx.strokeStyle = "#d9707f"; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- bucle (solo dibuja los personajes que se ven) ----------
  function frame(now) {
    if (!rigs.length) { running = false; return; }
    if (!document.hidden) {
      for (var i = 0; i < rigs.length; i++) {
        var r = rigs[i];
        if (r.cv.offsetParent !== null) { draw(r, now); }
      }
    }
    window.requestAnimationFrame(frame);
  }
  function start() {
    if (running) { return; }
    running = true;
    window.requestAnimationFrame(frame);
  }

  function attach() {
    var list = document.querySelectorAll(".edu");
    for (var i = 0; i < list.length; i++) {
      if (list[i].classList.contains("rig")) { continue; }
      var r = makeRig(list[i]);
      if (r) { rigs.push(r); draw(r, 0); }
    }
    if (rigs.length) { start(); }
    loading = false;
    var q = pending; pending = [];
    for (var j = 0; j < q.length; j++) { PK.Educadora.saludar(q[j]); }
  }

  // ---------- API pública ----------
  PK.Educadora = {
    setTalking: function (on) {
      talking = !!on;
      var els = document.querySelectorAll(".edu");
      for (var i = 0; i < els.length; i++) { els[i].classList.toggle("talking", talking); }
    },
    saludar: function (el) {
      if (!el) { return; }
      var edu = (el.classList && el.classList.contains("edu")) ? el : (el.closest ? el.closest(".edu") : null) || el;
      var found = false;
      for (var i = 0; i < rigs.length; i++) {
        if (rigs[i].edu === edu) { rigs[i].wave = performance.now() / 1000 + rigs[i].seed; found = true; }
      }
      if (!found && loading) { pending.push(edu); return; }   // aún cargando las capas: saluda al terminar
      if (!found) {                       // alternativa: animación CSS antigua
        edu.classList.remove("wave"); void edu.offsetWidth; edu.classList.add("wave");
      }
    },
    // solo para pruebas: PK.Educadora.pose({lid:1, mouth:{w:34,h:22}, arm:2, t:0})
    pose: function (o) { for (var i = 0; i < rigs.length; i++) { rigs[i].dbg = o || null; } },
    rigs: rigs
  };

  loadAll(function (ok) {
    if (!ok) {
      loading = false;
      for (var j = 0; j < pending.length; j++) { PK.Educadora.saludar(pending[j]); }
      pending = [];
      return;
    }
    function go() { window.setTimeout(attach, 0); }   // después de PK.hydrate()
    if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", go); }
    else { go(); }
  });
})();
