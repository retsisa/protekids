// Nivel 3 (semáforo), rompecabezas, Nivel 4, emociones y despedida.
(function () {
  "use strict";
  var PK = window.PK, $ = PK.$, S = PK.state, byId = PK.byId;
  var CHARS = PK.CHARACTERS;
  function cid() { return S.character || "nino"; }

  // ====================== CUERPO ======================
  // Zonas tocables medidas sobre los dibujos reales assets/images/cuerpo/silueta-nino.png y silueta-nina.png.
  // Cada zona: [id, zona, etiqueta, centroX %, centroY %, ancho %, alto %]  (% del PNG de la silueta).
  // ratio = ancho / alto del PNG (132x386 y 175x515). Si cambias una silueta, actualiza ratio y estos números.
  var BODY = {
    nino: { ratio: 132 / 386, zones: [
      ["cabeza", "cabeza", "Cabeza", 51, 16.7, 78, 30.5],
      ["hombro_i", "hombros", "Hombro", 19, 37.5, 22, 9], ["hombro_d", "hombros", "Hombro", 81, 37.5, 22, 9],
      ["pecho", "pecho", "Pecho", 50, 42.7, 44, 11.5],
      ["estomago", "estomago", "Estómago", 50, 54.2, 44, 11.5],
      ["intima", "intima", "Parte íntima", 50, 66.2, 32, 9.5],
      ["brazo_i", "brazos", "Brazo", 17.5, 51.5, 19, 17], ["brazo_d", "brazos", "Brazo", 85, 51.5, 20, 17],
      ["mano_i", "manos", "Mano", 13.5, 66.5, 15, 13], ["mano_d", "manos", "Mano", 88, 66.5, 16, 13],
      ["pierna_i", "piernas", "Pierna", 38, 81, 22, 16], ["pierna_d", "piernas", "Pierna", 67.5, 81, 22, 16],
      ["pie_i", "pies", "Pie", 27, 94.5, 34, 10], ["pie_d", "pies", "Pie", 76.5, 94.5, 33, 10]
    ] },
    nina: { ratio: 175 / 515, zones: [
      ["cabeza", "cabeza", "Cabeza", 47, 16.5, 87, 30],
      ["hombro_i", "hombros", "Hombro", 30, 38.5, 16, 11], ["hombro_d", "hombros", "Hombro", 84.5, 38.5, 17, 11],
      ["pecho", "pecho", "Pecho", 59, 41, 40, 10],
      ["estomago", "estomago", "Estómago", 59, 51.8, 40, 10.5],
      ["intima", "intima", "Parte íntima", 59, 62, 30, 10],
      ["brazo_i", "brazos", "Brazo", 24, 50.5, 17, 11], ["brazo_d", "brazos", "Brazo", 88, 50.5, 16, 11],
      ["mano_i", "manos", "Mano", 13, 61, 16, 10], ["mano_d", "manos", "Mano", 94, 61, 12, 10],
      ["pierna_i", "piernas", "Pierna", 43, 77, 18, 18], ["pierna_d", "piernas", "Pierna", 69, 77, 18, 18],
      ["pie_i", "pies", "Pie", 36, 94.5, 28, 9], ["pie_d", "pies", "Pie", 77.5, 94.5, 29, 9]
    ] }
  };

  function buildBody(st, id, opts) {
    st.textContent = "";
    var body = BODY[id] || BODY.nino;
    st.style.aspectRatio = String(body.ratio);     // el recuadro toma la forma exacta de la silueta
    // CAMBIAR IMAGEN DE LA SILUETA AQUÍ: assets/images/cuerpo/silueta-nino.png y silueta-nina.png
    st.appendChild(PK.img("assets/images/cuerpo/silueta-" + id + ".png", "Silueta", function () { return PK.silhouette(id); }, "base"));
    body.zones.forEach(function (zz) {
      var z = { id: zz[0], zone: zz[1], label: zz[2] };
      if (opts.highlight && opts.highlight.indexOf(z.zone) === -1) { return; }
      var b = document.createElement("button");
      b.type = "button";
      b.className = "zone";
      b.setAttribute("data-zone", z.id);
      b.setAttribute("aria-label", z.label);
      b.style.left = zz[3] + "%"; b.style.top = zz[4] + "%"; b.style.width = zz[5] + "%"; b.style.height = zz[6] + "%";
      if (opts.highlight) { b.disabled = true; b.classList.add("z-here"); }
      else { b.addEventListener("click", function () { opts.tap(z, b); }); }
      st.appendChild(b);
    });
  }

  // ====================== NIVEL 3: SEMÁFORO ======================
  // REGLAS PROVISIONALES: el equipo educativo debe revisarlas. Solo edita esta tabla.
  // v = verde, a = amarillo, r = rojo. (pecho de la educadora: se resuelve por niño/niña más abajo.)
  var RULES = {
    mama:      { cabeza: "v", hombros: "v", brazos: "v", manos: "v", pecho: "a", estomago: "v", intima: "a", piernas: "v", pies: "v" },
    educadora: { cabeza: "v", hombros: "v", brazos: "v", manos: "v", pecho: "*", estomago: "a", intima: "r", piernas: "v", pies: "v" },
    extrano:   { cabeza: "r", hombros: "r", brazos: "r", manos: "a", pecho: "r", estomago: "r", intima: "r", piernas: "r", pies: "r" }
  };
  var LIGHTS = {
    v: { cls: "verde",    title: "✔ Luz verde" },
    a: { cls: "amarillo", title: "✋ Luz amarilla" },
    r: { cls: "rojo",     title: "⛔ Luz roja" }
  };
  var TEXTS = {
    mama: {
      v: "Tu mamá puede abrazarte y cuidarte con cariño y respeto, si tú te sientes bien.",
      a: "Tu mamá puede ayudarte con el baño o a curarte, con respeto y avisándote antes. Si algo te incomoda, di NO y cuéntalo."
    },
    educadora: {
      v: "Tu profesora puede saludarte o ayudarte con respeto, si tú quieres.",
      a: "Solo si es necesario, tu profesora debe avisarte y debe haber otro adulto cerca. Puedes decir NO.",
      r: "¡Alto! Esta parte es solo tuya. Tu profesora no debe tocarla. Di NO y cuéntale a tu mamá u otro adulto de confianza."
    },
    extrano: {
      a: "Solo un saludo, si tú quieres y tu adulto de confianza está contigo. Puedes decir NO.",
      r: "¡Alto! Una persona desconocida no debe tocarte aquí. Di NO, aléjate y cuéntale a un adulto de confianza. ¡No es tu culpa!"
    }
  };
  var COMMON_RED = "¡Alto! Esta parte es solo tuya. Nadie debe tocarla. Di NO, aléjate y cuéntale a un adulto de confianza. ¡No es tu culpa!";
  var AUDIO_KEY = { mama: "nivel3mama", educadora: "nivel3educadora", extrano: "nivel3extrano" };

  function rule(persona, zone) {
    var l = RULES[persona][zone];
    if (l === "*") { l = (cid() === "nina") ? "r" : "v"; }   // pecho de la educadora
    var t = (TEXTS[persona] && TEXTS[persona][l]) || (l === "r" ? COMMON_RED : "Esto está bien si tú quieres y te sientes cómodo.");
    return { light: l, text: t };
  }

  var persona = "mama";
  function showResult(l, text) {
    var r = $("l3-result");
    r.className = "panel result" + (l ? " res-" + LIGHTS[l].cls : "");
    r.textContent = "";
    if (l) { var h = document.createElement("strong"); h.textContent = LIGHTS[l].title; r.appendChild(h); r.appendChild(document.createElement("br")); }
    r.appendChild(document.createTextNode(text));
  }
  function setPersona(p, speak) {
    persona = p;
    var btns = document.querySelectorAll("[data-persona]");
    for (var i = 0; i < btns.length; i++) { btns[i].classList.toggle("on", btns[i].getAttribute("data-persona") === p); }
    var item = PK.AUDIO[AUDIO_KEY[p]];
    $("l3-question").textContent = item.text;
    buildBody($("body-stage"), cid(), { tap: function (z, b) {
      var res = rule(persona, z.zone);
      b.classList.remove("z-verde", "z-amarillo", "z-rojo");
      b.classList.add("z-" + LIGHTS[res.light].cls);
      showResult(res.light, res.text);
      PK.Audio.say(res.text);
    } });
    showResult(null, "Toca una parte del cuerpo.");
    if (speak) { PK.Audio.play(item); }
  }
  PK.hooks.level3 = function () { setPersona(persona, true); };
  var pbtns = document.querySelectorAll("[data-persona]");
  for (var i = 0; i < pbtns.length; i++) {
    pbtns[i].addEventListener("click", function (e) { setPersona(e.currentTarget.getAttribute("data-persona"), true); });
  }
  $("btn-l3-say").addEventListener("click", function () { PK.Audio.play(PK.AUDIO[AUDIO_KEY[persona]]); });
  $("btn-l3-next").addEventListener("click", function () { PK.go("level3b"); });

  // ====================== ROMPECABEZAS DEL GATO ======================
  // CAMBIAR IMAGEN DEL ROMPECABEZAS AQUÍ (cuadrada; se corta en 3 x 3). Se prueba primero la ruta 1; si no existe, la 2.
  var PUZZLE_IMGS = ["assets/images/rompecabezas-protekids.png", "assets/images/gato.png"];
  var PUZZLE_IMG = PUZZLE_IMGS[0];
  var P = { order: [], sel: -1, solved: false, imgOk: true };
  function probeImg(i) {
    var pr = new Image();
    pr.onload = function () { PUZZLE_IMG = PUZZLE_IMGS[i]; P.imgOk = true; if (P.order.length) { renderPuzzle(); } };
    pr.onerror = function () {
      if (i + 1 < PUZZLE_IMGS.length) { probeImg(i + 1); }
      else { P.imgOk = false; if (P.order.length) { renderPuzzle(); } }   // sin imagen: piezas de colores con número
    };
    pr.src = PUZZLE_IMGS[i];
  }
  probeImg(0);

  function isSolved() { return P.order.every(function (v, i) { return v === i; }); }
  function shufflePuzzle() {
    do {
      P.order = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      for (var i = 8; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = P.order[i]; P.order[i] = P.order[j]; P.order[j] = t; }
    } while (isSolved());
    P.sel = -1; P.solved = false;
    $("puzzle-msg").textContent = "";
    $("btn-pz-next").disabled = true;
    renderPuzzle();
  }
  function renderPuzzle() {
    var board = $("puzzle-board");
    board.textContent = "";
    var correct = 0;
    P.order.forEach(function (piece, pos) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "piece";
      b.setAttribute("aria-label", "Pieza " + (pos + 1));
      if (P.imgOk) {
        b.style.backgroundImage = "url('" + PUZZLE_IMG + "')";
        b.style.backgroundPosition = ((piece % 3) * 50) + "% " + (Math.floor(piece / 3) * 50) + "%";
      } else {
        b.style.backgroundColor = "hsl(" + (piece * 40) + ", 70%, 65%)";   // alternativa sin imagen
        b.textContent = String(piece + 1);
      }
      if (piece === pos) { b.classList.add("ok"); correct += 1; }
      if (pos === P.sel) { b.classList.add("sel"); }
      b.disabled = P.solved;
      b.addEventListener("click", function () { tapPiece(pos); });
      board.appendChild(b);
    });
    $("puzzle-progress").textContent = correct + " de 9 piezas en su lugar";
  }
  function tapPiece(pos) {
    if (P.solved) { return; }
    if (P.sel === -1) { P.sel = pos; }
    else if (P.sel === pos) { P.sel = -1; }
    else { var t = P.order[P.sel]; P.order[P.sel] = P.order[pos]; P.order[pos] = t; P.sel = -1; }
    if (isSolved()) {
      P.solved = true;
      $("puzzle-msg").textContent = "🎉 ¡Lo lograste! ¡Qué bien armaste al gatito!";
      $("btn-pz-next").disabled = false;
      PK.Audio.play(PK.AUDIO.puzzlewin);
    }
    renderPuzzle();
  }
  PK.hooks.puzzle = function () { if (!P.order.length || P.solved) { shufflePuzzle(); } else { renderPuzzle(); } PK.Audio.play(PK.AUDIO.puzzle); };
  $("btn-shuffle").addEventListener("click", shufflePuzzle);
  $("btn-pz-next").addEventListener("click", function () { PK.go("end"); });
  $("btn-pz-skip").addEventListener("click", function () { PK.go("end"); });

  // ====================== NIVEL 4 ======================
  // CAMBIAR IMAGEN DE CADA FAMILIAR AQUÍ (campo img). Alternativa: emoji.
  var TRUST = [
    { id: "mama", label: "Mamá", img: "assets/images/familia/mama.png", emoji: "👩" },
    { id: "papa", label: "Papá", img: "assets/images/familia/papa.png", emoji: "👨" },
    { id: "hermano", label: "Hermano", img: "assets/images/familia/hermano.png", emoji: "👦" },
    { id: "hermana", label: "Hermana", img: "assets/images/familia/hermana.png", emoji: "👧" },
    { id: "tio", label: "Tío", img: "assets/images/familia/tio.png", emoji: "🧔" },
    { id: "tia", label: "Tía", img: "assets/images/familia/tia.png", emoji: "👩‍🦰" },
    { id: "abuelo", label: "Abuelo", img: "assets/images/familia/abuelo.png", emoji: "👴" },
    { id: "abuela", label: "Abuela", img: "assets/images/familia/abuela.png", emoji: "👵" },
    { id: "profesora", label: "Profesora", img: "assets/images/familia/profesora.png", emoji: "👩‍🏫" }
  ];
  function refreshTrust() {
    var btns = $("trust-list").querySelectorAll("[data-t]");
    for (var i = 0; i < btns.length; i++) {
      var on = S.trusted.indexOf(btns[i].getAttribute("data-t")) !== -1;
      btns[i].classList.toggle("selected", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    $("btn-l4-next").disabled = S.trusted.length === 0;
    $("trust-msg").textContent = S.trusted.length ? "¡Muy bien! Contarle a un adulto de confianza te cuida. Si no te escucha o no te ayuda, busca a otro. Nunca es tu culpa." : "";
  }
  TRUST.forEach(function (p) {
    var b = document.createElement("button");
    b.className = "choice";
    b.setAttribute("data-t", p.id);
    b.setAttribute("aria-pressed", "false");
    b.appendChild(PK.img(p.img, "", p.emoji, "ico"));
    var t = document.createElement("span"); t.textContent = p.label; b.appendChild(t);
    b.addEventListener("click", function () {
      var i = S.trusted.indexOf(p.id);
      if (i === -1) { S.trusted.push(p.id); } else { S.trusted.splice(i, 1); }
      refreshTrust();
    });
    $("trust-list").appendChild(b);
  });
  PK.hooks.level4 = function () {
    // Según las indicaciones: niña = pecho y piernas; niño = parte íntima/pompis y estómago (silueta de frente).
    buildBody($("mini-stage"), cid(), { highlight: cid() === "nina" ? ["pecho", "piernas"] : ["intima", "estomago"] });
    refreshTrust();
    PK.Audio.play(PK.AUDIO.nivel4);
  };
  $("btn-l4-next").addEventListener("click", function () { if (S.trusted.length) { PK.go("feelings"); } });

  // ====================== EMOCIONES ======================
  // CAMBIAR IMAGEN DE LAS EMOCIONES AQUÍ: assets/images/emociones/nino-feliz.png, nina-triste.png, etc.
  var FEELINGS = [
    { id: "feliz", label: "Feliz", emoji: "😊", reply: "¡Qué bonito! Me alegra que te sientas feliz. Recuerda: si algo te incomoda, siempre puedes contarlo." },
    { id: "triste", label: "Triste", emoji: "😢", reply: "Gracias por decírmelo. Está bien sentirse triste. Cuéntale a un adulto de confianza: te va a escuchar con cariño." },
    { id: "enojado", label: "Enojado", emoji: "😠", reply: "Está bien sentir enojo. Respira hondo y cuéntale a un adulto de confianza lo que pasó." },
    { id: "aburrido", label: "Aburrido", emoji: "🥱", reply: "¡Gracias por contármelo! Vamos a seguir con una actividad divertida." }
  ];
  function refreshFeel() {
    var btns = $("feel-list").querySelectorAll("[data-f]");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-f") === S.feeling;
      btns[i].classList.toggle("selected", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    $("btn-f-next").disabled = !S.feeling;
    var fo = byId(FEELINGS, S.feeling);
    $("feel-msg").textContent = fo ? fo.reply : "";
  }
  function buildFeel() {
    var box = $("feel-list");
    box.textContent = "";
    FEELINGS.forEach(function (f) {
      var b = document.createElement("button");
      b.className = "choice";
      b.setAttribute("data-f", f.id);
      b.setAttribute("aria-pressed", "false");
      b.appendChild(PK.img("assets/images/emociones/" + cid() + "-" + f.id + ".png", "", f.emoji, "ico"));
      var t = document.createElement("span"); t.textContent = f.label; b.appendChild(t);
      b.addEventListener("click", function () { S.feeling = f.id; refreshFeel(); PK.Audio.say(f.reply); });
      box.appendChild(b);
    });
  }
  PK.hooks.feelings = function () { buildFeel(); refreshFeel(); PK.Audio.play(PK.AUDIO.sentiste); };
  $("btn-f-next").addEventListener("click", function () { if (S.feeling) { PK.go("situations"); } });


  // ====================== NIVEL 3 (parte 2): PREGUNTAS ======================
  // Retroalimentación amable: no hay respuestas "castigadas"; si falla, se explica y se puede continuar.
  var QUIZ = [
    { q: "¿Qué partes del cuerpo son privadas?",
      opts: [ { t: "Las que cubre mi ropa de baño", ok: true }, { t: "Mis manos y mi cabeza" }, { t: "Todas las partes de mi cuerpo" } ],
      good: "¡Muy bien! Las partes privadas son las que cubre tu ropa de baño. Son solo tuyas.",
      help: "Casi. Las partes privadas son las que cubre tu ropa de baño. Son solo tuyas, ¡y ya lo estás aprendiendo!" },
    { q: "¿Qué pasa si alguien toca una parte privada o te pide guardar un secreto que te hace sentir incómodo?",
      opts: [ { t: "Guardo el secreto para no meterme en problemas" }, { t: "Digo NO, me alejo si puedo y se lo cuento a un adulto de confianza", ok: true }, { t: "Pienso que es mi culpa" } ],
      good: "¡Eso es! Los secretos que te incomodan no se guardan: se cuentan. Y nunca es tu culpa.",
      help: "Recuerda: los secretos que te incomodan no se guardan, se cuentan a un adulto de confianza. Y nunca es tu culpa." },
    { q: "¿Qué puedes hacer si algo no te gusta?",
      opts: [ { t: "Quedarme callado" }, { t: "Decir NO, alejarme si puedo y pedir ayuda", ok: true }, { t: "Esperar a que se pase solo" } ],
      good: "¡Muy bien! Tienes derecho a decir NO y a pedir ayuda.",
      help: "Tienes derecho a decir NO, alejarte si puedes y pedir ayuda a un adulto de confianza." }
  ];
  var Q = { i: 0, answered: false };
  function quizItem() {
    // CAMBIAR AUDIO DE LAS PREGUNTAS AQUÍ: assets/audio/educadora/quiz-1.mp3, quiz-2.mp3, quiz-3.mp3
    return { src: "assets/audio/educadora/quiz-" + (Q.i + 1) + ".mp3", text: QUIZ[Q.i].q };
  }
  function renderQuiz() {
    var q = QUIZ[Q.i];
    $("quiz-progress").textContent = "Pregunta " + (Q.i + 1) + " de " + QUIZ.length;
    $("quiz-q").textContent = q.q;
    var box = $("quiz-opts");
    box.textContent = "";
    q.opts.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "opt"; b.textContent = o.t;
      b.addEventListener("click", function () {
        var all = box.querySelectorAll(".opt");
        for (var k = 0; k < all.length; k++) { all[k].classList.remove("selected"); }
        b.classList.add("selected");
        var fb = $("quiz-fb");
        var msg = o.ok ? q.good : q.help;
        fb.hidden = false;
        fb.className = "panel result " + (o.ok ? "res-verde" : "res-amarillo");
        fb.textContent = msg;
        S.quiz[Q.i] = !!o.ok;
        Q.answered = true;
        $("btn-quiz-next").disabled = false;
        PK.Audio.say(msg);
      });
      box.appendChild(b);
    });
    $("quiz-fb").hidden = true;
    Q.answered = false;
    $("btn-quiz-next").disabled = true;
    $("btn-quiz-next").textContent = (Q.i === QUIZ.length - 1) ? "Continuar ➡" : "Siguiente ➡";
    PK.Audio.play(quizItem());
  }
  PK.hooks.level3b = function () { Q.i = 0; renderQuiz(); };
  $("btn-quiz-say").addEventListener("click", function () { PK.Audio.play(quizItem()); });
  $("btn-quiz-next").addEventListener("click", function () {
    if (!Q.answered) { return; }
    if (Q.i < QUIZ.length - 1) { Q.i += 1; renderQuiz(); } else { PK.go("level4"); }
  });

  // ====================== ACTIVIDAD: ¿QUÉ SITUACIÓN TE INCOMODA? ======================
  // Se evalúa el COMPORTAMIENTO, no la identidad de la persona.
  // CAMBIAR IMAGEN DE CADA SITUACIÓN AQUÍ (campo img). Alternativa: emoji + texto.
  var SITS = [
    { id: "cuidado", img: "assets/images/situaciones/cuidado.png", emoji: "🧥", bad: false,
      text: "Papá te ayuda a abrigarte porque hace frío y te pregunta si estás bien." },
    { id: "desconocida", img: "assets/images/situaciones/desconocida.png", emoji: "🧍", bad: true,
      text: "Una persona que no conoces te pide un abrazo y tú no quieres." },
    { id: "profesora", img: "assets/images/situaciones/profesora.png", emoji: "✋", bad: false,
      text: "Tu profesora te choca la mano para saludarte." },
    { id: "espacio", img: "assets/images/situaciones/espacio.png", emoji: "🚫", bad: true,
      text: "Alguien se acerca demasiado y te toca aunque dijiste que no." }
  ];
  var SIT_BAD = "Si algo te incomoda, no importa quién sea: puedes decir NO, alejarte si puedes y contárselo a un adulto de confianza. No es tu culpa.";
  var SIT_OK = "Esta situación parece un cuidado o un saludo con respeto. Pero recuerda: si alguna vez algo te incomoda, aunque sea con alguien que conoces, puedes decir NO y contarlo.";
  var ACT_MSG = "¡Muy bien! Esa es una buena idea. Puedes hacer una, dos o las tres cosas.";

  SITS.forEach(function (s) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "card"; b.setAttribute("data-s", s.id); b.setAttribute("aria-pressed", "false");
    b.appendChild(PK.img(s.img, "", s.emoji, "ico"));
    var t = document.createElement("span"); t.textContent = s.text; b.appendChild(t);
    b.addEventListener("click", function () {
      var all = $("sit-list").querySelectorAll(".card");
      for (var k = 0; k < all.length; k++) { all[k].classList.remove("selected"); all[k].setAttribute("aria-pressed", "false"); }
      b.classList.add("selected"); b.setAttribute("aria-pressed", "true");
      if (S.situations.indexOf(s.id) === -1) { S.situations.push(s.id); }
      var r = $("sit-result"), msg = s.bad ? SIT_BAD : SIT_OK;
      r.hidden = false; r.className = "panel result " + (s.bad ? "res-rojo" : "res-verde"); r.textContent = msg;
      $("sit-actions").hidden = !s.bad;
      $("btn-sit-next").disabled = false;
      PK.Audio.say(msg);
    });
    $("sit-list").appendChild(b);
  });
  var acts = document.querySelectorAll("[data-act]");
  for (var a = 0; a < acts.length; a++) {
    acts[a].addEventListener("click", function (e) {
      var id = e.currentTarget.getAttribute("data-act"), i = S.actions.indexOf(id);
      if (i === -1) { S.actions.push(id); } else { S.actions.splice(i, 1); }
      e.currentTarget.classList.toggle("selected", i === -1);
      $("act-msg").textContent = ACT_MSG;
      PK.Audio.say(ACT_MSG);
    });
  }
  PK.hooks.situations = function () {
    $("sit-result").hidden = true; $("sit-actions").hidden = true; $("act-msg").textContent = "";
    var all = $("sit-list").querySelectorAll(".card");
    for (var k = 0; k < all.length; k++) { all[k].classList.remove("selected"); all[k].setAttribute("aria-pressed", "false"); }
    $("btn-sit-next").disabled = true;
    PK.Audio.play(PK.AUDIO.situaciones);
  };
  $("btn-sit-next").addEventListener("click", function () { PK.go("puzzle"); });

  // ====================== DESPEDIDA ======================
  PK.hooks.end = function () { PK.Educadora.saludar($("edu-end")); PK.Audio.play(PK.AUDIO.despedida); };
  $("btn-again").addEventListener("click", function () { PK.resetState(); P.order = []; PK.go("welcome"); });
  $("btn-end-stories").addEventListener("click", function () { PK.go("stories"); });
})();
