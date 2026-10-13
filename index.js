const token = process.env.TELEGRAM_BOT_TOKEN || '8957687602:AAFl5wxW1yjCInHWWD7iaZXvy2-ADZqSrzo';
const openaiKey = process.env.OPENAI_API_KEY;

let offset = 0;

console.log('🤖 PepesiyoBot cloud nativo arrancado y escuchando mensajes...');

async function pollTelegram() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();

    if (data.ok && data.result) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text = update.message.text;
          const userName = update.message.from.first_name || 'Amigo';

          console.log(`Mensaje de ${userName}: ${text}`);

          // Llamada a OpenAI
          const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: 'Eres Pepe, un asistente amable y divertido.' },
                { role: 'user', content: text }
              ]
            })
          });

          const aiData = await aiRes.json();
          const reply = aiData.choices && aiData.choices[0] ? aiData.choices[0].message.content : '¡Hola! Recibido.';

          // Enviar respuesta a Telegram
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: reply })
          });
        }
      }
    }
  } catch (err) {
    console.error('Error en polling:', err.message);
  }

  // Siguiente ciclo de escucha
  setTimeout(pollTelegram, 1000);
}

pollTelegram();
