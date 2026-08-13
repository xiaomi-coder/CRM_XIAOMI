/**
 * Telegram Bot API — ota-onaga xabar yuborish.
 * Veb'dagi `services/telegramService.ts` bilan bir xil.
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<boolean> {
  if (!botToken || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = await res.json();
    return !!data?.ok;
  } catch {
    return false;
  }
}
