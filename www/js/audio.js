// Un solo reproductor: iniciar un audio detiene el anterior, así nunca se superponen.
// Reproducción automática: se INTENTA al entrar a cada pantalla. Android/WebView puede bloquearla
// hasta que el niño toque algo; en ese caso queda en silencio y el botón 🔊 permite escuchar.
(function () {
  "use strict";
  var PK = window.PK;
  var A = "assets/audio/";

  // Para cambiar un audio: pon tu archivo en esa ruta (o cambia "src").
  // "text" es la voz provisional del teléfono (speechSynthesis): se usa SOLO si el archivo no existe.
  PK.AUDIO = {
    presentacion: { src: A + "educadora/presentacion.mp3", text: "¡Bienvenidos, corazones! Yo soy ProteKids. ¿Comenzamos?" },
    // CAMBIAR AUDIO DE BIENVENIDA AQUÍ (identificador: bienvenida)
    bienvenida: { src: A + "bienvenida.mp3", text: "¡Hola, hola! ¿Cómo estás? Yo muy bien, ¿y tú qué tal? ¿Cómo te sientes hoy?" },
    // CAMBIAR AUDIO DEL NIVEL 1 AQUÍ (identificador: nivel1)
    nivel1: { src: A + "educadora/nivel1.mp3", text: "¡Vamos a elegir! ¿Quieres jugar con el niño o con la niña?" },
    // CAMBIAR AUDIO DE CONFIRMACIÓN AQUÍ (identificador: listo)
    listo: { src: A + "educadora/listo.mp3", text: "¿Estás listo para comenzar? Elige sí si quieres empezar o todavía no si necesitas un poquito más de tiempo." },
    // CAMBIAR AUDIO DEL NIVEL 2 AQUÍ (identificador: nivel2)
    nivel2: { src: A + "educadora/nivel2.mp3", text: "¡Vamos a vestir a nuestro personaje! Elige las prendas que más te gusten." },
    // Nivel 3 (una pregunta por persona)
    nivel3mama: { src: A + "educadora/nivel3-mama.mp3", text: "¿Qué partes de tu cuerpo puede tocar tu mamá? Toca el cuerpo." },
    nivel3educadora: { src: A + "educadora/nivel3-educadora.mp3", text: "¿Qué partes de tu cuerpo puede tocar tu profesora? Toca el cuerpo." },
    nivel3extrano: { src: A + "educadora/nivel3-extrano.mp3", text: "¿Qué partes de tu cuerpo puede tocar una persona desconocida? Toca el cuerpo." },
    // Rompecabezas
    puzzle: { src: A + "educadora/puzzle.mp3", text: "¡Hora de jugar! Toca una pieza y luego otra para cambiarlas de lugar y armar al gatito." },
    puzzlewin: { src: A + "educadora/puzzle-fin.mp3", text: "¡Lo lograste! ¡Qué bien armaste al gatito!" },
    // Nivel 4
    nivel4: { src: A + "educadora/nivel4.mp3", text: "Si alguien te toca aquí o hace algo que te incomoda, ¿a quién se lo contarías? Puedes elegir a una o más personas." },
    sentiste: { src: A + "educadora/sentiste.mp3", text: "¿Y cómo te sientes ahora? Toca la carita que se parezca a ti." },
    // Actividad: ¿Qué situación te incomoda?
    situaciones: { src: A + "educadora/situaciones.mp3", text: "Mira las situaciones. ¿Cuál haría sentir incómodo a nuestro personaje? Toca la que no te gusta." },
    // Despedida (RECURSO PROPIO: reemplaza por la grabación original)
    despedida: { src: A + "educadora/despedida.mp3", text: "ProteKids te enseña a amar, respetar y cuidar tu cuerpo. Si algo te incomoda, ¡cuéntaselo a un adulto de confianza! ¡Protege tu cuerpo, alza tu voz y vive feliz y seguro! ¡Gracias por visitarnos! ¡Hasta una próxima aventura con ProteKids!" }
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

  function speak(text, my, done) {
    try {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || !text) { if (done) { done(); } return; }
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "es-ES"; u.rate = 0.9; u.pitch = 1.2;
      u.onstart = function () { if (my === token) { talking(true); if (PK.Educadora.speakStart) { PK.Educadora.speakStart(text, null, null, u.rate); } } };
      u.onend = u.onerror = function () { if (my !== token) { return; } talking(false); if (done) { done(); } };
      window.speechSynthesis.speak(u);
    } catch (e) { talking(false); }
  }

  // item = { src, text }. Sin "src" se usa directamente la voz del teléfono.
  function play(item, done) {
    if (!item) { return; }
    stop();
    var my = token, fell = false;
    function fallback() { if (fell || my !== token) { return; } fell = true; speak(item.text, my, done); }
    if (!item.src) { fallback(); return; }
    el.onerror = fallback;
    el.onplaying = function () { if (my === token) { talking(true); if (PK.Educadora.speakStart) { PK.Educadora.speakStart(item.text, el, item.src); } } };
    el.onended = function () { if (my !== token) { return; } talking(false); if (done) { done(); } };
    try {
      el.src = item.src;
      var p = el.play();
      if (p && p.catch) {
        p.catch(function (err) {
          if (err && err.name === "NotAllowedError") { return; } // bloqueado por el sistema: queda en silencio
          fallback();
        });
      }
    } catch (e) { fallback(); }
  }

  PK.Audio = { play: play, stop: stop, say: function (text) { play({ text: text }); } };
})();
