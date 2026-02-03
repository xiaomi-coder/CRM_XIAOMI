/**
 * Telegram Bot API orqali xabar yuborish servisi
 */
export const sendTelegramMessage = async (botToken: string, chatId: string, text: string): Promise<boolean> => {
  if (!botToken || !chatId) {
    console.error("Telegram bot token yoki Chat ID mavjud emas.");
    return false;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      }),
    });

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Telegram Error:", error);
    return false;
  }
};

/**
 * Telegram Bot webhook URL ni sozlash
 * Har bir markaz o'z bot tokenini kiritganda chaqiriladi
 */
export const setTelegramWebhook = async (botToken: string): Promise<{ success: boolean; webhookUrl?: string; error?: string }> => {
  if (!botToken) {
    return { success: false, error: "Bot token kiritilmagan" };
  }

  // Get current domain (production URL)
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://eduprocrm.uz';

  const webhookUrl = `${baseUrl}/api/telegram-webhook?token=${encodeURIComponent(botToken)}`;

  try {
    // Set webhook
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });

    const data = await response.json();

    if (data.ok) {
      return { success: true, webhookUrl };
    } else {
      return { success: false, error: data.description || "Webhook sozlashda xatolik" };
    }
  } catch (error: any) {
    console.error("Webhook sozlash xatosi:", error);
    return { success: false, error: error.message || "Tarmoq xatosi" };
  }
};

/**
 * Bot ma'lumotlarini olish (username va boshqalar)
 */
export const getTelegramBotInfo = async (botToken: string): Promise<{ success: boolean; username?: string; error?: string }> => {
  if (!botToken) {
    return { success: false, error: "Bot token kiritilmagan" };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();

    if (data.ok) {
      return { success: true, username: data.result.username };
    } else {
      return { success: false, error: data.description || "Bot ma'lumotlarini olishda xatolik" };
    }
  } catch (error: any) {
    console.error("Bot info xatosi:", error);
    return { success: false, error: error.message || "Tarmoq xatosi" };
  }
};
