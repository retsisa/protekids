// Etapa 1: bienvenida, confirmación, Nivel 1 y Nivel 2.
(function () {
  "use strict";
  var PK = window.PK, $ = PK.$, S = PK.state;

  // RECURSO PROPIO: personajes del Nivel 1 y del vestidor. Cambia "img" por el nombre de tu archivo.
  var CHARACTERS = [
    { id: "nino", label: "Niño", img: "assets/images/nino.png" },
    { id: "nina", label: "Niña", img: "assets/images/nina.png" }
  ];

  // RECURSO PROPIO: prendas. Cambia "img" por tus PNG (con fondo transparente, del mismo tamaño que el personaje
  // para que encajen). top/left/w/h son porcentajes del personaje. Para añadir prendas, agrega otra línea aquí.
  // "emoji" y "color" son la imagen provisional si el archivo no existe.
  var GARMENTS = [
    { id: "visera",   label: "Visera",   img: "assets/images/prendas/visera.png",   emoji: "🧢", color: "#ffb74d", top: 1,  left: 22, w: 56, h: 9 },
    { id: "polera",   label: "Polera",   img: "assets/images/prendas/polera.png",   emoji: "👕", color: "#4aa3df", top: 22, left: 18, w: 64, h: 26 },
    { id: "pantalon", label: "Pantalón", img: "assets/images/prendas/pantalon.png", emoji: "👖", color: "#5c6bc0", top: 48, left: 24, w: 52, h: 36 },
    { id: "falda",    label: "Falda",    img: "assets/images/prendas/falda.png",    emoji: "👗", color: "#f06292", top: 48, left: 19, w: 62, h: 22 },
    { id: "tenis",    label: "Tenis",    img: "assets/images/prendas/tenis.png",    emoji: "👟", color: "#66bb6a", top: 86, left: 20, w: 60, h: 12 }
  ];

  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  // ----- Bienvenida -----
  PK.hooks.welcome = function () { PK.Educadora.saludar($("edu-welcome")); };
  $("btn-listen").addEventListener("click", function () {
    PK.Educadora.saludar($("edu-welcome"));
    PK.Audio.play(PK.AUDIO.presentacion, function () { PK.Audio.play(PK.AUDIO.bienvenida); });
  });
  var moods = document.querySelectorAll("[data-mood]");
  for (var m = 0; m < moods.length; m++) {
    moods[m].addEventListener("click", function (e) {
      S.mood = e.currentTarget.getAttribute("data-mood");
      PK.go("confirm");
    });
  }

  // ----- Confirmación -----
  PK.hooks.confirm = function () { $("notready").hidden = true; $("wait-msg").hidden = true; };
  $("btn-ready-yes").addEventListener("click", function () { PK.go("level1"); });
  $("btn-ready-no").addEventListener("click", function () { $("notready").hidden = false; });
  $("btn-wait").addEventListener("click", function () { $("wait-msg").hidden = false; });
  $("btn-retry").addEventListener("click", function () { $("notready").hidden = true; $("wait-msg").hidden = true; });

  // ----- Nivel 1 -----
  function buildCharacters() {
    var box = $("char-list");
    CHARACTERS.forEach(function (c) {
      var b = document.createElement("button");
      b.className = "choice";
      b.setAttribute("data-char", c.id);
      b.setAttribute("aria-pressed", "false");
      var holder = document.createElement("span");
      holder.className = "charbox";
      holder.appendChild(PK.img(c.img, "", function () { return PK.silhouette(c.id); }, ""));
      var t = document.createElement("span");
      t.textContent = c.label;
      b.appendChild(holder); b.appendChild(t);
      b.addEventListener("click", function () { S.character = c.id; refreshLevel1(); });
      box.appendChild(b);
    });
  }
  function refreshLevel1() {
    var btns = $("char-list").querySelectorAll("[data-char]");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-char") === S.character;
      btns[i].classList.toggle("selected", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    var c = byId(CHARACTERS, S.character);
    $("char-msg").textContent = c ? "Elegiste: " + c.label + ". ¡Puedes cambiarlo cuando quieras!" : "";
    $("btn-l1-next").disabled = !c;
  }
  PK.hooks.level1 = refreshLevel1;
  $("btn-l1-next").addEventListener("click", function () { if (S.character) { PK.go("level2"); } });

  // ----- Nivel 2 -----
  function renderStage() {
    var st = $("stage");
    st.textContent = "";
    var c = byId(CHARACTERS, S.character || "nino");
    st.appendChild(PK.img(c.img, c.label, function () { return PK.silhouette(c.id); }, "base"));
    S.worn.forEach(function (gid) {
      var g = byId(GARMENTS, gid);
      var d = document.createElement("div");
      d.className = "g";
      d.style.top = g.top + "%"; d.style.left = g.left + "%";
      d.style.width = g.w + "%"; d.style.height = g.h + "%";
      d.style.setProperty("--c", g.color);
      d.appendChild(PK.img(g.img, g.label, g.emoji, ""));
      st.appendChild(d);
    });
    var btns = $("tray").querySelectorAll("[data-g]");
    for (var i = 0; i < btns.length; i++) {
      var on = S.worn.indexOf(btns[i].getAttribute("data-g")) !== -1;
      btns[i].classList.toggle("selected", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    $("btn-undo").disabled = S.worn.length === 0;
  }
  function buildTray() {
    GARMENTS.forEach(function (g) {
      var b = document.createElement("button");
      b.className = "choice";
      b.setAttribute("data-g", g.id);
      b.setAttribute("aria-pressed", "false");
      b.appendChild(PK.img(g.img, "", g.emoji, "ico"));
      var t = document.createElement("span");
      t.textContent = g.label;
      b.appendChild(t);
      b.addEventListener("click", function () {   // cada prenda se pone/quita sin bloquear a las demás
        var i = S.worn.indexOf(g.id);
        if (i === -1) { S.worn.push(g.id); } else { S.worn.splice(i, 1); }
        renderStage();
      });
      $("tray").appendChild(b);
    });
  }
  PK.hooks.level2 = renderStage;
  $("btn-undo").addEventListener("click", function () { S.worn.pop(); renderStage(); });
  $("btn-reset").addEventListener("click", function () { S.worn = []; renderStage(); });
  $("btn-l2-next").addEventListener("click", function () { PK.go("soon"); });
  $("btn-soon-home").addEventListener("click", function () { PK.go("welcome"); });

  buildCharacters();
  buildTray();
})();
