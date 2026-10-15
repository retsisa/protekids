(function () {
  "use strict";

  var STORIES = [
    {
      title: "Mi cuerpo es mío",
      pages: [
        "Luna tiene un cuerpo muy especial. Tiene manitas, piernas, cabeza y un corazón grande.",
        "Luna sabe que su cuerpo es suyo. Nadie puede tocarla si ella no quiere.",
        "Un día, alguien quiso tocarla y ella dijo: ¡NO! y se alejó rápidamente.",
        "Luna corrió a contarle a su mamá. Su mamá la abrazó y le dijo: ¡Qué valiente eres!"
      ]
    },
    {
      title: "Mis personas de confianza",
      pages: [
        "Tomás tiene personas que lo cuidan: mamá, papá, su abuela y su profesora.",
        "Si algo lo hace sentir triste, asustado o incómodo, Tomás se lo cuenta a alguien de confianza.",
        "Tomás sabe que contar no es chismear. Contar es cuidarse.",
        "Y siempre hay alguien que lo escucha con mucho cariño."
      ]
    },
    {
      title: "El semáforo del cuerpo",
      pages: [
        "Verde: un abrazo de mamá o un saludo de manos. Se puede si tú quieres y te sientes bien.",
        "Amarillo: si alguien necesita tocar una zona, como el doctor, debe avisarte y debe estar un adulto de confianza.",
        "Rojo: las partes privadas son solo tuyas. Nadie debe tocarlas ni verlas.",
        "Si alguien lo intenta, di NO fuerte, aléjate y cuéntaselo a tu adulto de confianza."
      ]
    }
  ];

  var current = { story: 0, page: 0 };

  function $(id) { return document.getElementById(id); }

  function show(id) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove("active");
    }
    $(id).classList.add("active");
    window.scrollTo(0, 0);
  }

  function renderList() {
    var list = $("story-list");
    list.textContent = "";
    STORIES.forEach(function (story, index) {
      var btn = document.createElement("button");
      btn.className = "big";
      btn.textContent = story.title;
      btn.addEventListener("click", function () {
        current.story = index;
        current.page = 0;
        renderPage();
        show("reader");
      });
      list.appendChild(btn);
    });
  }

  function renderPage() {
    var story = STORIES[current.story];
    $("story-title").textContent = story.title;
    $("story-text").textContent = story.pages[current.page];
    $("story-page").textContent = (current.page + 1) + " / " + story.pages.length;
  }

  $("btn-stories").addEventListener("click", function () { show("stories"); });
  $("btn-back-home").addEventListener("click", function () { show("home"); });
  $("btn-back-stories").addEventListener("click", function () { show("stories"); });

  $("btn-prev").addEventListener("click", function () {
    if (current.page > 0) {
      current.page -= 1;
      renderPage();
    }
  });

  $("btn-next").addEventListener("click", function () {
    var story = STORIES[current.story];
    if (current.page < story.pages.length - 1) {
      current.page += 1;
      renderPage();
    } else {
      show("stories");
    }
  });

  renderList();
})();
