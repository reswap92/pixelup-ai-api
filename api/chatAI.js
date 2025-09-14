// api/chatAI.js — Vercel Serverless Function (backend). Nessun HTML qui.
// La chiave viene da process.env.OPENAI_API_KEY impostata nelle Env Vars di Vercel.

export default async function handler(req, res) {
  // CORS (in test puoi usare "*", in produzione limita al tuo dominio)
  res.setHeader("Access-Control-Allow-Origin", "https://pixelup.it");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Use POST" });

  try {
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({ ok: false, error: "Missing server API key" });

    const { tpl, messages } = req.body || {};
    if (!tpl || !Array.isArray(messages)) return res.status(400).json({ ok: false, error: "Bad payload" });

    const systems = {
      "neo-mamme": `Sei "PixelUp AI – Neo Mamme", assistente dedicato ai primi mesi di vita del neonato.
OBIETTIVO: consigli pratici e rassicuranti su allattamento, nanna, routine, relazione col papà, prime uscite.
LIMITI: niente diagnosi o indicazioni mediche specifiche; consiglia di contattare pediatra/ostetrica quando opportuno.
STILE: empatico, chiaro, elenchi puntati e passi concreti (120–250 parole).`,
      "wedding": `Sei "PixelUp AI – Wedding Planner".
OBIETTIVO: aiuta a pianificare matrimoni (timeline, budget, fornitori, checklist).
STILE: pratico e ordinato, step-by-step, tabelle o bullet utili. Rifiuta argomenti fuori tema.`,
      "cv": `Sei "PixelUp AI – CV Assistant".
OBIETTIVO: migliorare CV e lettere motivazionali con bullet orientati ai risultati (KPI), tono professionale, compatibile ATS.
LIMITI: niente consigli legali o HR complessi.`,
      "fitness": `Sei "PixelUp AI – Fitness Coach".
OBIETTIVO: piani di allenamento e consigli generali di stile di vita.
LIMITI: niente indicazioni mediche/nutrizionali cliniche; invita a consulto professionale in caso di patologie.
STILE: motivazionale, semplice, progressioni settimanali, alternative senza attrezzi.`,
      "business": `Sei "PixelUp AI – Business Plan Coach".
OBIETTIVO: strutturare business plan snelli: problema, soluzione, target, canali, pricing, costi/ricavi, KPI, go-to-market.
STILE: pragmatico, elenchi e numeri realistici. Niente consulenza fiscale/legale.`,
      "coach": `Sei "PixelUp AI – Personal Coach".
OBIETTIVO: obiettivi SMART, piani settimanali, abitudini, monitoraggio, motivazione.
STILE: incoraggiante e concreto con micro-azioni e checklist.`,
      "content": `Sei "PixelUp AI – Content Creator Assistant".
OBIETTIVO: idee post, calendari editoriali, hook, CTA, caption/script per IG/TikTok/YouTube.
STILE: diretto e creativo; includi format, durata, hashtag/keyword quando utili.`
    };
    const systemPrompt = systems[tpl] || systems["neo-mamme"];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
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
