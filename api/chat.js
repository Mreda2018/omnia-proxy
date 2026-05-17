// OMNIA AI Chat Proxy — CommonJS version for Vercel
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { system, messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ content: 'API key not configured.' });
  }

  try {
    const geminiMessages = messages.slice(-10).map(function(m) {
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      };
    });

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: system || 'You are a helpful assistant.' }]
        },
        contents: geminiMessages,
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.7
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Gemini error:', JSON.stringify(data.error));
      return res.status(500).json({ content: 'API error: ' + data.error.message });
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Sorry, I could not process that. Please contact support@omniaft.com';

    return res.status(200).json({ content });

  } catch (error) {
    console.error('Handler error:', error.message);
    return res.status(500).json({ content: 'Error: ' + error.message });
  }
};
