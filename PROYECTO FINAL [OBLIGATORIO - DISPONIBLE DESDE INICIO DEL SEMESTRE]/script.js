// preguntas sugeridas 
const preguntas = [
  "¿Qué es la Universidad Autónoma de Santo Domingo?",
  "¿Cuál es la misión de la UASD?",
  "¿Cuáles son los fines de la Universidad?",
  "¿Qué es el Claustro Mayor?",
  "¿Qué es el Consejo Universitario?",
  "¿Cuáles son las funciones del Rector?",
  "¿Qué son las Facultades?",
  "¿Cuáles son los derechos de los estudiantes?",
  "¿Cuáles son los deberes del personal docente?",
  "¿Qué establece el Estatuto sobre el patrimonio universitario?"
];

let historial = [];  // guarda la conversacion para la ia

const chat = document.getElementById("chat");
const input = document.getElementById("pregunta");


// crea un mensaje y lo pone en pantalla
function crearMensaje(texto, tipo) {
  const div = document.createElement("div");
  div.className = "mensaje " + tipo;
  div.textContent = texto;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}



// botones de preguntas sugeridas
preguntas.forEach(p => {
  const b = document.createElement("button");
  b.textContent = p;
  b.onclick = () => enviar(p);   // al hacer clic, se envia sola
  document.getElementById("sugeridas").appendChild(b);
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

// busca los 6 pedazos que mas se parecen a la pregunta para usar menos memoria de la ia
function buscarPartes(pregunta) {
  const palabras = limpiar(pregunta).split(/\W+/).filter(p => p.length > 3);
  const puntos = partes.map(texto => {
    const t = limpiar(texto);
    let suma = 0;
    palabras.forEach(p => { suma += t.split(p).length - 1; });
    return { texto: texto, suma: suma };
  });
  puntos.sort((a, b) => b.suma - a.suma);
  return puntos.slice(0, 6).map(p => p.texto).join("\n---\n");
}

async function enviar(texto) {
  if (!texto || texto.trim() == "") return;

  crearMensaje(texto, "usuario");
  input.value = "";
  historial.push({ role: "user", parts: [{ text: texto }] });
  const espera = crearMensaje("Escribiendo...", "bot");

  try {



    // instruccion para que solo use el estatuto de la uasd y no invente cosas
    const instruccion = "Eres un asistente de la UASD. Responde SOLO con la informacion de este documento. " +
      "Si la respuesta no esta en el documento, di: No tengo informacion suficiente en el Estatuto para responder eso. " +
      "Responde claro y breve.\n\nDOCUMENTO:\n" + buscarPartes(texto);




    // llamada a la api de gemini
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" + API_KEY;
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
