import { createClient } from '@supabase/supabase-js';

// VPS backend (PostgreSQL + PostgREST).
const supabaseUrl = "https://api.eduprocrm.uz";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImNybS12cHMiLCJpYXQiOjE3ODIzMzQ3NTcsImV4cCI6MjQxMzA1NDc1N30.f1UCrcbJ-G0_q9-wFn9BIyMLPNBgzk2MYpxzU1IC4xw";

/**
 * Platforma boti — ro'yxatdan o'tishda Telegram raqam tasdig'i.
 *
 * Har markazning o'z ota-ona boti bilan ALOHISHI: bu bitta umumiy bot,
 * webhook URL'i o'zining bot tokenini o'z ichiga oladi
 * (https://eduprocrm.uz/api/platform-bot?token=<BOT_TOKEN>), token esa
 * bazadagi RPC'larga "sir" sifatida uzatiladi — shu orqali faqat bu
 * webhook'ning o'zi bazani yozishi mumkinligi tasdiqlanadi.
 *
 * Oqim: sayt start_tg_verification() bilan token yaratadi → foydalanuvchi
 * t.me/<bot>?start=<token> ga o'tadi → /start kelganda attach_tg_chat() bilan
 * chatId tokenga bog'lanadi va "raqamni ulashish" tugmasi so'raladi →
 * kontakt kelganda confirm_tg_verification() raqamni yozib VERIFIED qiladi.
 */
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const botToken = req.query.token;
    if (!botToken) {
        return res.status(200).json({ ok: true });
    }

    try {
        const update = req.body;
        const message = update.message;
        if (!message) return res.status(200).json({ ok: true });

        const chatId = message.chat.id.toString();
        const supabase = createClient(supabaseUrl, supabaseKey);

        // /start <token>
        const text: string | undefined = message.text;
        if (text && text.startsWith('/start')) {
            const parts = text.trim().split(/\s+/);
            const verifyToken = parts[1];

            if (!verifyToken) {
                await sendTelegramMessage(botToken, chatId,
                    `Assalomu alaykum! 👋\n\nBu bot EduControl CRM'da ro'yxatdan o'tishni tasdiqlash uchun ishlatiladi.\n\nSaytdan ro'yxatdan o'tishni boshlang: https://eduprocrm.uz/register`
                );
                return res.status(200).json({ ok: true });
            }

            const { data: attachResult } = await supabase.rpc('attach_tg_chat', {
                p_token: verifyToken, p_chat_id: chatId, p_secret: botToken,
            });

            if (!attachResult || attachResult.error) {
                await sendTelegramMessage(botToken, chatId,
                    `⚠️ Tasdiqlash muddati tugagan yoki havola noto'g'ri.\n\nSaytga qaytib, ro'yxatdan o'tishni qaytadan boshlang.`
                );
                return res.status(200).json({ ok: true });
            }

            await sendTelegramMessage(botToken, chatId,
                `Raqamingizni tasdiqlash uchun quyidagi tugmani bosing 👇`,
                {
                    keyboard: [[{ text: '📱 Raqamni ulashish', request_contact: true }]],
                    one_time_keyboard: true,
                    resize_keyboard: true,
                }
            );
            return res.status(200).json({ ok: true });
        }

        // Kontakt (raqam) keldi
        const contact = message.contact;
        if (contact && contact.phone_number) {
            const { data: confirmResult } = await supabase.rpc('confirm_tg_verification', {
                p_chat_id: chatId,
                p_phone: contact.phone_number,
                p_name: [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' '),
                p_secret: botToken,
            });

            if (!confirmResult || confirmResult.error) {
                await sendTelegramMessage(botToken, chatId,
                    `⚠️ Avval saytda ro'yxatdan o'tishni boshlang, keyin bu tugmani bosing.`,
                    { remove_keyboard: true }
                );
                return res.status(200).json({ ok: true });
            }

            if (confirmResult.match) {
                await sendTelegramMessage(botToken, chatId,
                    `✅ Raqamingiz tasdiqlandi!\n\nEndi saytga qaytib, ro'yxatdan o'tishni yakunlang.`,
                    { remove_keyboard: true }
                );
            } else {
                await sendTelegramMessage(botToken, chatId,
                    `✅ Raqamingiz tasdiqlandi: +${confirmResult.phone}\n\n` +
                    `(Saytda boshqa raqam kiritilgan edi — markaz raqami sifatida shu tasdiqlangan raqam ishlatiladi.)\n\n` +
                    `Endi saytga qaytib, ro'yxatdan o'tishni yakunlang.`,
                    { remove_keyboard: true }
                );
            }

            // Egaga (siz) yangi tasdiq haqida xabar
            const { data: ownerData } = await supabase.rpc('platform_owner_chat', { p_secret: botToken });
            if (ownerData?.chatId) {
                await sendTelegramMessage(botToken, ownerData.chatId,
                    `🆕 <b>Yangi ro'yxat tasdiqlandi</b>\n\n` +
                    `👤 ${confirmResult.tgName || message.from?.first_name || 'Noma\'lum'}\n` +
                    `📱 +${confirmResult.phone}\n\n` +
                    `Tez orada markaz ro'yxatdan o'tadi.`
                );
            }
            return res.status(200).json({ ok: true });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Platform bot webhook error:', error);
        return res.status(200).json({ ok: true });
    }
}

async function sendTelegramMessage(
    botToken: string, chatId: string, text: string, replyMarkup?: any
): Promise<boolean> {
    try {
        const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
        if (replyMarkup) body.reply_markup = replyMarkup;
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return data.ok === true;
    } catch (error) {
        console.error('Telegram send error:', error);
        return false;
    }
}
