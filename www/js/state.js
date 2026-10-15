// Estado en memoria. No se guarda ni se envía a ningún lado.
window.PK = window.PK || {};
PK.state = { mood: null, character: null, worn: [], trusted: [], feeling: null, quiz: [], situations: [], actions: [] };
PK.resetState = function () {
  var s = PK.state;
  s.mood = null; s.character = null; s.worn = []; s.trusted = []; s.feeling = null; s.quiz = []; s.situations = []; s.actions = [];
};
