const SYSTEM_PROMPT = 'Eres Pepe, un asistente amable, divertido y cercano. Responde siempre en español salvo que el usuario use otro idioma.';

async function telegram(method, body) {
  const response = await fetch('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/' + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error('Telegram ' + method + ' failed: ' + response.status);
  return response.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('Pepe webhook active');

  const message = req.body?.message;
  if (!message?.text) return res.status(200).json({ ok: true });

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message.text }
        ]
      })
    });
    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || 'Ahora mismo no puedo responder, inténtalo de nuevo en un momento.';
    await telegram('sendMessage', { chat_id: message.chat.id, text: reply });
  } catch (error) {
    console.error(error);
    try {
      await telegram('sendMessage', { chat_id: message.chat.id, text: 'He tenido un problema momentáneo. Prueba otra vez en unos segundos.' });
    } catch (_) {}
  }
  return res.status(200).json({ ok: true });
};
