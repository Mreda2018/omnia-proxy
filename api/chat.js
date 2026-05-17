// Vercel Serverless Function — OMNIA AI Chat (FREE - Google Gemini)
// Free API key from: aistudio.google.com
// Set environment variable: GEMINI_API_KEY=AIza...

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://omniaft.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { system, messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid request' });

  try {
    const geminiMessages = messages.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system || 'You are a helpful assistant.' }] },
          contents: geminiMessages,
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Sorry, I could not process that. Please contact support@omniaft.com';

    return res.status(200).json({ content });
  } catch (error) {
    console.error('Gemini error:', error);
    return res.status(500).json({ content: 'Sorry, something went wrong. Contact support@omniaft.com' });
  }
}
