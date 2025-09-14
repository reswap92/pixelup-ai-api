// api/chatAI.js — Vercel Serverless Function (Node runtime)
// ⛔️ Nessun HTML qui. Chiave OpenAI letta da process.env.OPENAI_API_KEY

export default async function handler(req, res) {
  // --- CORS: consenti richieste solo dal tuo sito (allarga a "*" solo per test) ---
  res.setHeader("Access-Control-Allow-Origin", "https://pixelup.it");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Use POST" });
  }

  try {
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return res.status(500).json({ ok: false, error: "Missing server API key" });
    }

    const { tpl, messages } = req.body || {};
    if (!tpl || !Array.isArray(messages)) {
      return res.status(400).json({ ok: false, error: "Bad payload" });
    }

    // ---- Prompt di sistema per template ----
    const systems = {
      "neo-mamme": `Sei "PixelUp AI – Neo Mamme", un assistente dedicato a consigli pratici per neo genitori.
OBIETTIVO: spiegazioni chiare ed empatiche (no diagnosi mediche).
LIMITI: rifiuta fuori tema o diagnosi; invita a consultare un professionista.
STILE: italiano semplice, esempi concreti, elenchi quando utile, 120–250 parole.`,

      "wedding": `Sei "PixelUp AI – Wedding Planner". Rispondi solo su organizzazione matrimoni
(timeline, budget, fornitori, checklist). Stile pratico, passo-passo. Rifiuta fuori tema.`,

      "cv": `Sei "PixelUp AI – CV Assistant". Aiuti solo su CV/lettere: bullet con KPI, ATS friendly,
riscritture sintetiche. Rifiuta argomenti non HR.`,

      // 👉 facoltativo: attiva anche il template fitness
      "fitness": `Sei "PixelUp AI – Fitness Coach". Fornisci piani di allenamento e consigli generali
(non medici). Tono motivazionale, esercizi a corpo libero o in palestra, progressioni settimanali.
Avvisa di consultare un medico in caso di condizioni particolari.`
    };
    const systemPrompt = systems[tpl] || systems["neo-mamme"];

    // ---- Chiamata a OpenAI ----
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }].concat(messages),
        temperature: 0.6
      })
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return res.status(500).json({ ok: false, error: `OpenAI error: ${r.status} ${errText}` });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "Nessuna risposta.";
    return res.status(200).json({ ok: true, output: text });

  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
}
