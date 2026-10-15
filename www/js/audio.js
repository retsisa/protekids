// Un solo reproductor: iniciar un audio detiene el anterior, así nunca se superponen.
// Solo se llama tras un toque del usuario (los navegadores lo exigen).
(function () {
  "use strict";
  var PK = window.PK;

  // RECURSO PROPIO: cambia estas rutas por los nombres reales de tus audios (formato mp3 recomendado).
  // "text" es la voz provisional del teléfono, que se usa SOLO si el archivo no existe.
  PK.AUDIO = {
    presentacion: { src: "assets/audio/educadora/presentacion.mp3", text: "¡Bienvenidos, corazones! Yo soy ProteKids. ¿Comenzamos?" },
    bienvenida:   { src: "assets/audio/bienvenida.mp3", text: "¡Hola, hola! ¿Cómo estás? Yo muy bien, y tú, ¿qué tal?" },
    listo:        { src: "assets/audio/educadora/listo.mp3", text: "¿Estás listo para comenzar? Toca sí cuando quieras." },
    nivel1:       { src: "assets/audio/educadora/nivel1.mp3", text: "Elige el personaje con el que quieres jugar. Puedes cambiarlo cuando quieras." },
    nivel2:       { src: "assets/audio/educadora/nivel2.mp3", text: "Toca las prendas que quieras. Puedes combinarlas como más te guste." }
  };

  var el = new Audio();
  var token = 0;

  function talking(on) { if (PK.Educadora) { PK.Educadora.setTalking(on); } }

  function stop() {
    token += 1;
    try { el.pause(); } catch (e) {}
    try { if (window.speechSynthesis) { window.speechSynthesis.cancel(); } } catch (e2) {}
    talking(false);
  }

  // Voz provisional del teléfono (puede no estar disponible en todos los equipos).
  function speak(text, my, done) {
    try {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || !text) { if (done) { done(); } return; }
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "es-ES"; u.rate = 0.9; u.pitch = 1.2;
      u.onstart = function () { if (my === token) { talking(true); } };
      u.onend = u.onerror = function () { if (my !== token) { return; } talking(false); if (done) { done(); } };
      window.speechSynthesis.speak(u);
    } catch (e) { talking(false); }
  }

  function play(item, done) {
    if (!item) { return; }
    stop();
    var my = token, fell = false;
    function fallback() { if (fell || my !== token) { return; } fell = true; speak(item.text, my, done); }
    el.onerror = fallback;
    el.onplaying = function () { if (my === token) { talking(true); } };
    el.onended = function () { if (my !== token) { return; } talking(false); if (done) { done(); } };
    try {
      el.src = item.src;
      var p = el.play();
      if (p && p.catch) { p.catch(fallback); }
    } catch (e) { fallback(); }
  }

  PK.Audio = { play: play, stop: stop };
})();
