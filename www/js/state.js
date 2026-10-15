// Estado en memoria. No se guarda ni se envía a ningún lado.
window.PK = window.PK || {};
PK.state = {
  mood: null,        // "bien" | "mal" (estado emocional inicial)
  character: null,   // "nino" | "nina" (personaje elegido; es una preferencia, no un juicio)
  worn: []           // ids de prendas puestas, en orden
};
