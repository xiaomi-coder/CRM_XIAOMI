
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
