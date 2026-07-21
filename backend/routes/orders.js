const express = require('express');
const { createOrder } = require('../store');

const router = express.Router();

function escapeMd(str) {
  return String(str || '').replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

async function sendToTelegram(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN یا TELEGRAM_CHAT_ID تنظیم نشده؛ سفارش فقط ذخیره شد.');
    return false;
  }

  const text =
    `📩 *سفارش جدید از سایت FRMZI*\n\n` +
    `👤 نام: ${escapeMd(order.name)}\n` +
    `📞 تماس: ${escapeMd(order.contact)}\n` +
    `🎯 نوع خدمت: ${escapeMd(order.service)}\n` +
    (order.budget ? `💰 بودجه تقریبی: ${escapeMd(order.budget)}\n` : '') +
    `\n📝 توضیحات:\n${escapeMd(order.message)}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'MarkdownV2' }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram API error:', data);
      return false;
    }
    return true;
  } catch (err) {
    console.error('خطا در ارتباط با تلگرام:', err.message);
    return false;
  }
}

// ثبت سفارش جدید — عمومی (بدون نیاز به ورود)
router.post('/', async (req, res) => {
  const { name, contact, service, message, budget } = req.body || {};

  if (!name || !contact || !service || !message) {
    return res.status(400).json({ message: 'پر کردن نام، راه تماس، نوع خدمت و توضیحات الزامی است' });
  }

  const orderInput = {
    name: String(name).slice(0, 200),
    contact: String(contact).slice(0, 200),
    service: String(service).slice(0, 100),
    budget: budget ? String(budget).slice(0, 100) : '',
    message: String(message).slice(0, 3000),
  };

  let order;
  try {
    order = await createOrder(orderInput);
  } catch (err) {
    console.error('خطا در ذخیره سفارش:', err.message);
    return res.status(500).json({ message: 'خطا در ثبت سفارش' });
  }

  const sent = await sendToTelegram(order);

  res.status(201).json({
    message: sent
      ? 'سفارش شما با موفقیت ثبت و برای تیم FRMZI ارسال شد'
      : 'سفارش شما ثبت شد؛ به‌زودی از طریق راه‌های ارتباطی با شما تماس می‌گیریم',
    telegramSent: sent,
  });
});

module.exports = router;
