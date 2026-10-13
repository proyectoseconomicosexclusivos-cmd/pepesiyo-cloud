const http = require('http');
const token = '8957687602:AAFl5wxW1yjCInHWWD7iaZXvy2-ADZqSrzo';
const openaiKey = 'TU_OPENAI_API_KEY';
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!');
}).listen(PORT);

let offset = 0;
async function poll() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();
    if (data.ok && data.result) {
      for (const u of data.result) {
        offset = u.update_id + 1;
        if (u.message?.text) {
          const chatId = u.message.chat.id;
          const text = u.message.text;
          const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
            body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: 'Eres Pepe, un asistente amable y divertido.' }, { role: 'user', content: text }] })
          });
          const aiData = await aiRes.json();
          const reply = aiData.choices?.[0]?.message?.content || '¡Hola!';
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: reply })
          });
        }
      }
    }
  } catch (e) { console.error(e); }
  setImmediate(poll);
}
poll();