export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const BOT_TOKEN = '8965941902:AAEVj55WHiPmhlCKsMqaIXkqEqcrLZx_8Zo';
    const CHAT_ID   = '646330520';

    const cors = { 'Access-Control-Allow-Origin': '*' };
    const json = (body, status) => new Response(JSON.stringify(body), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json', ...cors }
    });

    // Екранування для Telegram parse_mode: HTML
    const esc = (v) => String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const clean = (v, max) => esc((v == null ? '' : v)).trim().slice(0, max);

    try {
      const data = await request.json();

      // Honeypot: реальні користувачі не заповнюють це поле.
      // Вдаємо успіх, щоб бот не намагався інакше.
      if (data.website) {
        return json({ success: true });
      }

      const name    = clean(data.name, 120);
      const contact = clean(data.contact, 120);

      // Обовʼязкові поля — без них заявка марна.
      if (!name || !contact) {
        return json({ success: false, error: 'missing fields' }, 400);
      }

      const service = clean(data.service, 80) || 'не вказано';
      const comment = clean(data.comment, 1500) || 'не вказано';

      const text = `📋 <b>Новий запис до нотаріуса</b>\n\n`
        + `👤 <b>Ім'я:</b> ${name}\n`
        + `📞 <b>Телефон / Email:</b> ${contact}\n`
        + `📄 <b>Тип послуги:</b> ${service}\n`
        + `💬 <b>Коментар:</b> ${comment}`;

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
      });

      if (!tgRes.ok) {
        const err = await tgRes.text();
        throw new Error(err);
      }

      return json({ success: true });

    } catch (err) {
      return json({ success: false, error: err.message }, 500);
    }
  }
};
