// Núcleo: recursos con alternativa, navegación con historial y Cuentos (se conserva).
(function () {
  "use strict";
  var PK = window.PK;
  function $(id) { return document.getElementById(id); }
  PK.$ = $;

  // Imagen con alternativa: si el archivo no existe, se muestra "fb" (texto o función que crea un elemento).
  PK.img = function (src, alt, fb, cls) {
    var img = new Image();
    img.alt = alt || "";
    if (cls) img.className = cls;
    img.onerror = function () {
      var el;
      if (typeof fb === "function") { el = fb(); }
      else {
        el = document.createElement("span");
        el.className = "fb";
        el.textContent = fb || "";
        el.setAttribute("role", "img");
        el.setAttribute("aria-label", alt || "");
      }
      if (cls) { cls.split(" ").forEach(function (c) { if (c) el.classList.add(c); }); }
      if (img.parentNode) img.parentNode.replaceChild(el, img);
    };
    img.src = src;
    return img;
  };

  // Silueta provisional en ropa de baño (cuando no existe nino.png / nina.png).
  PK.silhouette = function (id) {
    var d = document.createElement("div");
    d.className = "sil " + id;
    d.setAttribute("role", "img");
    d.innerHTML = "<u></u><i></i><b></b>";
    return d;
  };

  // Silueta con carita encima (alternativa de la pantalla de confirmación).
  PK.silhouetteWithFace = function (id, face) {
    var w = document.createElement("div");
    w.className = "sil-wrap";
    w.appendChild(PK.silhouette(id));
    var b = document.createElement("span");
    b.className = "badge";
    b.textContent = face || "";
    w.appendChild(b);
    return w;
  };

  PK.hydrate = function (root) {
    var nodes = (root || document).querySelectorAll("[data-img]");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var img = PK.img(n.getAttribute("data-img"), n.getAttribute("data-alt") || "",
        n.getAttribute("data-fb") || "", n.getAttribute("data-cls") || "");
      n.parentNode.replaceChild(img, n);
    }
  };

  // ----- Navegación (usa el historial: el botón atrás del teléfono también funciona) -----
  PK.hooks = {};
  var depth = 0;

  function render(id) {
    PK.Audio.stop();
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) { screens[i].classList.remove("active"); }
    $(id).classList.add("active");
    if (PK.hooks[id]) { PK.hooks[id](); }
    window.scrollTo(0, 0);
  }
  PK.go = function (id) {
    depth += 1;
    history.pushState({ id: id, depth: depth }, "");
    render(id);
  };
  PK.back = function () {
    if (depth > 0) { history.back(); } else { PK.go("welcome"); }
  };
  window.addEventListener("popstate", function (e) {
    var st = e.state || { id: "welcome", depth: 0 };
    depth = st.depth;
    render(st.id);
  });

  // ----- Cuentos (se conserva sin cambios de contenido) -----
  var STORIES = [
    { title: "Mi cuerpo es mío", pages: [
      "Luna tiene un cuerpo muy especial. Tiene manitas, piernas, cabeza y un corazón grande.",
      "Luna sabe que su cuerpo es suyo. Nadie puede tocarla si ella no quiere.",
      "Un día, alguien quiso tocarla y ella dijo: ¡NO! y se alejó rápidamente.",
      "Luna corrió a contarle a su mamá. Su mamá la abrazó y le dijo: ¡Qué valiente eres!"] },
    { title: "Mis personas de confianza", pages: [
      "Tomás tiene personas que lo cuidan: mamá, papá, su abuela y su profesora.",
      "Si algo lo hace sentir triste, asustado o incómodo, Tomás se lo cuenta a alguien de confianza.",
      "Tomás sabe que contar no es chismear. Contar es cuidarse.",
      "Y siempre hay alguien que lo escucha con mucho cariño."] },
    { title: "El semáforo del cuerpo", pages: [
      "Verde: un abrazo de mamá o un saludo de manos. Se puede si tú quieres y te sientes bien.",
      "Amarillo: si alguien necesita tocar una zona, como el doctor, debe avisarte y debe estar un adulto de confianza.",
      "Rojo: las partes privadas son solo tuyas. Nadie debe tocarlas ni verlas.",
      "Si alguien lo intenta, di NO fuerte, aléjate y cuéntaselo a tu adulto de confianza."] }
  ];
  var current = { story: 0, page: 0 };

  function renderList() {
    var list = $("story-list");
    list.textContent = "";
    STORIES.forEach(function (story, index) {
      var btn = document.createElement("button");
      btn.className = "big";
      btn.textContent = story.title;
      btn.addEventListener("click", function () { current.story = index; current.page = 0; renderPage(); PK.go("reader"); });
      list.appendChild(btn);
    });
  }
  function renderPage() {
    var s = STORIES[current.story];
    $("story-title").textContent = s.title;
    $("story-text").textContent = s.pages[current.page];
    $("story-page").textContent = (current.page + 1) + " / " + s.pages.length;
  }

  document.addEventListener("DOMContentLoaded", function () {
    PK.hydrate();
    renderList();
    $("btn-stories").addEventListener("click", function () { PK.go("stories"); });
    $("btn-back-home").addEventListener("click", function () { PK.go("welcome"); });
    $("btn-back-stories").addEventListener("click", function () { PK.go("stories"); });
    $("btn-prev").addEventListener("click", function () { if (current.page > 0) { current.page -= 1; renderPage(); } });
    $("btn-next").addEventListener("click", function () {
      if (current.page < STORIES[current.story].pages.length - 1) { current.page += 1; renderPage(); }
      else { PK.go("stories"); }
    });
    var backs = document.querySelectorAll("[data-back]");
    for (var i = 0; i < backs.length; i++) { backs[i].addEventListener("click", PK.back); }
    var says = document.querySelectorAll("[data-say]");
    for (var j = 0; j < says.length; j++) {
      says[j].addEventListener("click", function (e) { PK.Audio.play(PK.AUDIO[e.currentTarget.getAttribute("data-say")]); });
    }
    history.replaceState({ id: "welcome", depth: 0 }, "");
    render("welcome");
  });
})();
