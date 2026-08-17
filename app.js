const mic = document.getElementById("mic"),
  status = document.getElementById("status"),
  transcript = document.getElementById("transcript"),
  answer = document.getElementById("answer"),
  orb = document.getElementById("orb");

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function speak(t) {
  if (!("speechSynthesis" in window)) {
    status.textContent = "Sprachausgabe nicht verfügbar";
    return;
  }

  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(t);
  u.lang = "de-DE";
  u.rate = 0.95;
  u.pitch = 1;

  setTimeout(() => {
    window.speechSynthesis.speak(u);
  }, 100);
}

async function weather(city) {
  let g = await fetch(
    "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(city) +
      "&count=1&language=de&format=json"
  ).then(r => r.json());

  if (!g.results?.length) {
    return `Ich konnte ${city} nicht finden.`;
  }

  let p = g.results[0];

  let d = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,weather_code&timezone=auto`
  ).then(r => r.json());

  let c = d.current;

  let x = {
    0: "klaren Himmel",
    1: "überwiegend klaren Himmel",
    2: "teilweise bewölkten Himmel",
    3: "bedeckten Himmel",
    45: "Nebel",
    48: "Nebel",
    51: "leichten Nieselregen",
    53: "Nieselregen",
    55: "starken Nieselregen",
    61: "leichten Regen",
    63: "Regen",
    65: "starken Regen",
    71: "leichten Schneefall",
    73: "Schneefall",
    75: "starken Schneefall",
    80: "Regenschauer",
    81: "Regenschauer",
    82: "starke Regenschauer",
    95: "Gewitter",
    96: "Gewitter mit Hagel",
    99: "Gewitter mit starkem Hagel"
  };

  return `In ${p.name} sind es gerade ${c.temperature_2m.toFixed(
    1
  )} Grad bei ${x[c.weather_code] || "unbekanntem Wetter"}.`;
}

async function command(t) {
  t = t.toLowerCase().trim();

  let n = new Date();

  if (t.includes("beenden") || t.includes("tschüss")) {
    return "Bis später.";
  }

  if (t.includes("uhr") || t.includes("spät")) {
    return `Es ist ${n.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    })} Uhr.`;
  }

  if (t.includes("datum") || t.includes("welcher tag")) {
    return `Heute ist ${n.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })}.`;
  }

  if (t.includes("wetter") || t.includes("temperatur")) {
    let m = t.match(/(?:wetter|temperatur).*?(?:in|für)\s+(.+)/);
    let city = m
      ? m[1].replace(/[?.!]+$/, "").trim()
      : "Müllheim";

    try {
      return await weather(city);
    } catch {
      return "Das Wetter konnte ich gerade nicht abrufen.";
    }
  }

  return "Diesen Befehl kenne ich in Jarvis 0.1 noch nicht.";
}

if (!SR) {
  status.textContent =
    "Spracherkennung in diesem Browser nicht verfügbar";
  mic.disabled = true;
} else {
  let r = new SR();

  r.lang = "de-DE";
  r.interimResults = false;
  r.continuous = false;

  r.onstart = () => {
    status.textContent = "Ich höre zu …";
    orb.classList.add("listening");
    mic.textContent = "⏺️";
  };

  r.onend = () => {
    status.textContent = "Bereit";
    orb.classList.remove("listening");
    mic.textContent = "🎙️";
  };

  r.onerror = e => {
    status.textContent = "Fehler: " + e.error;
  };

  r.onresult = async e => {
    let t = e.results[0][0].transcript;

    transcript.textContent = "Du: " + t;
    status.textContent = "Denke nach …";

    let a = await command(t);

    answer.textContent = "Jarvis: " + a;

    speak(a);

    status.textContent = "Bereit";
  };

  mic.onclick = () => {
    transcript.textContent = "";
    answer.textContent = "";

    r.start();
  };
}
