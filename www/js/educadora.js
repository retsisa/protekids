// Animación de la educadora con movimientos CSS (entrada, balanceo, saludo, "rebote" al hablar).
// OJO: esto NO es sincronización labial; la imagen no mueve la boca.
(function () {
  "use strict";
  window.PK.Educadora = {
    setTalking: function (on) {
      var els = document.querySelectorAll(".edu");
      for (var i = 0; i < els.length; i++) { els[i].classList.toggle("talking", !!on); }
    },
    saludar: function (el) {
      if (!el) { return; }
      el.classList.remove("wave");
      void el.offsetWidth; // reinicia la animación
      el.classList.add("wave");
    }
  };
})();
