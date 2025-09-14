export default async function handler(req, res) {
  // CORS: consenti SOLO dal tuo sito
  res.setHeader("Access-Control-Allow-Origin", "https://pixelup.it");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).send("");

  if (req.method !== "POST") {
    return res.status(405).json({ ok:false, error:"Use POST" });
  }

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ ok:false, error:"Missing server API key" });

  try {
    const { tpl, messages } = req.body || {};
    if (!tpl || !Array.isArray(messages)) {
      return res.status(400).json({ ok:false, error:"Bad payload" });
    }

    const systems = {
      "neo-mamme": `Sei "PixelUp AI – Neo Mamme", un assistente dedicato a consigli pratici per neo genitori.
OBIETTIVO: spiegazioni chiare ed empatiche (no diagnosi mediche).
LIMITI: rifiuta fuori tema o diagnosi; invita a consultare un professionista.
STILE: italiano semplice, esempi concreti, elenchi se utile, 120–250 parole.`,
      "wedding": `Sei "PixelUp AI – Wedding Planner", rispondi solo su organizzazione matrimoni (timeline, budget, fornitori, checklist).
Stile professionale e pratico, passo-passo. RIFIUTA fuori tema.`,
      "cv": `Sei "PixelUp AI – CV Assistant", aiuti solo su CV e lettere motivazionali.
Bullet con KPI, suggerimenti ATS, riscritture sintetiche. RIFIUTA argomenti non HR.`
    };
    const systemPrompt = systems[tpl] || systems["neo-mamme"];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role:"system", content: systemPrompt }].concat(messages),
        temperature: 0.6
      })
    });

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "Nessuna risposta.";
    return res.status(200).json({ ok:true, output:text });

  } catch (e) {
    return res.status(500).json({ ok:false, error: e.message });
  }
}
