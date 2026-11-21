// preguntas sugeridas
const preguntas = [
  "¿Qué es la Universidad Autónoma de Santo Domingo?",
  "¿Cuál es la misión de la UASD?",
  "¿Cuáles son los fines de la Universidad?",
  "¿Cuáles son las funciones fundamentales de la UASD?",
  "¿Qué establece el Estatuto sobre la autonomía universitaria?",
  "¿Cuáles son los principios que orientan a la Universidad?",
  "¿Cómo está organizada la Universidad?",
  "¿Cuáles son los organismos de gobierno de la UASD?",
  "¿Qué es el Claustro Mayor?",
  "¿Qué es el Claustro Menor?",
  "¿Qué es el Consejo Universitario?",
  "¿Quiénes integran el Consejo Universitario?",
  "¿Cuáles son las atribuciones del Consejo Universitario?",
  "¿Cuáles son las funciones del Rector?",
  "¿Cuáles son las funciones de los Vicerrectores?",
  "¿Qué son las Facultades?",
  "¿Cómo se organizan las Facultades?",
  "¿Qué son los Consejos Directivos de Facultad?",
  "¿Cuáles son las funciones de los Decanos?",
  "¿Qué son las Escuelas?",
  "¿Cuáles son las funciones de los Directores de Escuela?",
  "¿Qué establece el Estatuto sobre los Recintos, Centros y Subcentros Universitarios?",
  "¿Qué establece el Estatuto sobre el personal docente?",
  "¿Cuáles son los derechos del personal docente?",
  "¿Cuáles son los deberes del personal docente?",
  "¿Qué establece el Estatuto sobre los estudiantes?",
  "¿Cuáles son los derechos de los estudiantes?",
  "¿Cuáles son los deberes de los estudiantes?",
  "¿Qué establece el Estatuto sobre la representación estudiantil?",
  "¿Qué establece el Estatuto sobre la investigación?",
  "¿Qué establece el Estatuto sobre el postgrado?",
  "¿Qué establece el Estatuto sobre la extensión universitaria?",
  "¿Qué establece el Estatuto sobre el bienestar universitario?",
  "¿Qué establece el Estatuto sobre el régimen disciplinario?",
  "¿Qué establece el Estatuto sobre el patrimonio universitario?"
];

const MODELO = "gemini-3.5-flash-lite";
let historial = []; // guarda la conversacion para la ia

const chat = document.getElementById("chat");
const input = document.getElementById("pregunta");
const btnSugeridas = document.getElementById("btn-sugeridas");
const contenedorSugeridas = document.getElementById("sugeridas");

// abre o cierra la lista de preguntas sugeridas
btnSugeridas.onclick = (e) => {
  e.stopPropagation();
  contenedorSugeridas.classList.toggle("oculto");
};

// cierra la lista si haces clic fuera
document.addEventListener("click", (e) => {
  if (!contenedorSugeridas.contains(e.target) && e.target !== btnSugeridas) {
    contenedorSugeridas.classList.add("oculto");
  }
});

// crea un mensaje y lo pone en pantalla
function crearMensaje(texto, tipo) {
  const div = document.createElement("div");
  div.className = "mensaje " + tipo;
  div.textContent = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

// elementos de la lista de preguntas sugeridas
preguntas.forEach(p => {
  const item = document.createElement("li");
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = p;
  b.onclick = () => {
    contenedorSugeridas.classList.add("oculto");
    enviar(p); // al hacer clic, se envia sola y cierra la lista
  };
  item.appendChild(b);
  contenedorSugeridas.appendChild(item);
});

// parte el estatuto en pequeñas partes
const partes = [];
for (let i = 0; i < ESTATUTO.length; i += 2500) {
  partes.push(ESTATUTO.substring(i, i + 2500));
}

// quita tildes y pone minusculas para comparar
function limpiar(t) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// busca los 8 pedazos que mas se parecen a la pregunta (con sinonimos basicos del Estatuto)
function buscarPartes(pregunta) {
  const sinonimos = {
    mision: ["mision", "proposito", "naturaleza"],
    fines: ["fines", "propositos", "objetivos", "funciones"],
    funciones: ["funciones", "atribuciones", "facultades", "deberes"],
    autonomia: ["autonomia", "independencia", "regimen"],
    organizacion: ["organizacion", "estructura", "organismos", "gobierno"],
    claustro: ["claustro", "asamblea", "electoral"],
    consejo: ["consejo", "universitario", "directivo", "gobierno"],
    rector: ["rector", "rectoria", "autoridad"],
    vicerrectores: ["vicerrector", "vicerrectores", "vicerrectoria"],
    facultades: ["facultad", "facultades", "decano", "decanos"],
    escuelas: ["escuela", "escuelas", "director", "directores"],
    docentes: ["docente", "docentes", "profesor", "profesores", "academico"],
    estudiantes: ["estudiante", "estudiantes", "alumno", "alumnos", "estudiantil"],
    investigacion: ["investigacion", "cientifica", "investigar"],
    postgrado: ["postgrado", "posgrado", "maestria", "doctorado"],
    extension: ["extension", "vinculacion", "social", "comunidad"],
    bienestar: ["bienestar", "servicios", "estudiantil"],
    disciplinario: ["disciplinario", "sancion", "falta", "faltas", "regimen"],
    patrimonio: ["patrimonio", "bienes", "recursos", "presupuesto", "economico"]
  };

  const basePalabras = limpiar(pregunta)
    .split(/\W+/)
    .filter(p => p.length > 3);

  const terminos = new Set(basePalabras);
  basePalabras.forEach(palabra => {
    Object.entries(sinonimos).forEach(([clave, lista]) => {
      if (palabra.includes(clave) || lista.includes(palabra)) {
        terminos.add(clave);
        lista.forEach(s => terminos.add(s));
      }
    });
  });

  const listaTerminos = Array.from(terminos);

  const puntos = partes.map(texto => {
    const t = limpiar(texto);
    let suma = 0;
    listaTerminos.forEach(p => {
      const coincidencias = t.split(p).length - 1;
      if (coincidencias > 0) {
        suma += basePalabras.includes(p) ? coincidencias * 2 : coincidencias;
      }
    });
    return { texto: texto, suma: suma };
  });

  puntos.sort((a, b) => b.suma - a.suma);

  const seleccionados = puntos[0]?.suma > 0
    ? puntos.slice(0, 8).map(p => p.texto)
    : partes.slice(0, 8);

  return seleccionados.join("\n---\n");
}

async function enviar(texto) {
  if (!texto || texto.trim() == "") return;

  crearMensaje(texto, "usuario");
  input.value = "";
  historial.push({ role: "user", parts: [{ text: texto }] });
  const espera = crearMensaje("Escribiendo...", "bot");

  try {
    // revisa primero los fragmentos del estatuto; si no esta ahi, usa su conocimiento del Estatuto de la UASD sin inventar
    const instruccion =
      "Eres un asistente especializado en el Estatuto Orgánico de la Universidad Autónoma de Santo Domingo (UASD). " +
      "Primero revisa los fragmentos adjuntos del Estatuto. Si la respuesta no aparece completa o clara en esos fragmentos, " +
      "apóyate en el contenido oficial del Estatuto Orgánico de la UASD que conozcas y respóndela de forma natural, " +
      "como parte del documento, sin decir que no tienes información ni mencionar fragmentos faltantes. " +
      "Mantente siempre en el marco del Estatuto y la normativa de la UASD, sin inventar datos falsos. " +
      "Responde claro y breve.\n\nFRAGMENTOS DEL DOCUMENTO:\n" +
      buscarPartes(texto);

    // llamada a la api de gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruccion }] },
        contents: historial
      })
    });

    const datos = await res.json();
    if (datos.error) throw new Error(datos.error.message);
    const respuesta = datos.candidates[0].content.parts[0].text;

    espera.textContent = respuesta;
    historial.push({ role: "model", parts: [{ text: respuesta }] });

  } catch (error) {
    // si algo falla
    espera.textContent = "Hubo un error: " + error.message;
    historial.pop();
    console.log(error);
  }
}

// boton enviar y tecla enter
document.getElementById("enviar").onclick = () => enviar(input.value);
input.addEventListener("keypress", e => { if (e.key == "Enter") enviar(input.value); });