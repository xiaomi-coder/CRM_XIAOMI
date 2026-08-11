import { createClient } from '@supabase/supabase-js';

// VPS backend (PostgreSQL + PostgREST). Eski Supabase o'rnini bosadi.
const supabaseUrl = "https://api.eduprocrm.uz";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImNybS12cHMiLCJpYXQiOjE3ODIzMzQ3NTcsImV4cCI6MjQxMzA1NDc1N30.f1UCrcbJ-G0_q9-wFn9BIyMLPNBgzk2MYpxzU1IC4xw";

export default async function handler(req: any, res: any) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const update = req.body;

        // Extract message details
        const message = update.message;
        if (!message || !message.text) {
            return res.status(200).json({ ok: true });
        }

        const chatId = message.chat.id.toString();
        const text = message.text.trim();
        const firstName = message.from?.first_name || 'Ota-ona';

        // Get bot token from query parameter (each center has unique webhook URL)
        const botToken = req.query.token;
        if (!botToken) {
            console.error('Bot token not provided in webhook URL');
            return res.status(200).json({ ok: true });
        }

        // /start — havola bilan kelgan bo'lsa kod ichida bo'ladi:
        //   https://t.me/<bot>?start=<KOD>  →  Telegram "/start <KOD>" yuboradi
        // Shunda ota-ona hech narsa termaydi. Kodsiz /start bo'lsa — ko'rsatma.
        let studentCode = '';
        if (text.startsWith('/start')) {
            const payload = text.slice('/start'.length).trim();
            if (!payload) {
                await sendTelegramMessage(botToken, chatId,
                    `Assalomu alaykum, ${firstName}! 👋\n\n` +
                    `Farzandingizni tizimga ulash uchun o'quv markazidan olgan ` +
                    `<b>ulanish havolasini</b> bosing.\n\n` +
                    `Havola bo'lmasa, o'quvchi kodini shu yerga yozing.`
                );
                return res.status(200).json({ ok: true });
            }
            studentCode = payload.toUpperCase();
        } else {
            // Kodni qo'lda yozgan bo'lsa ham ishlaydi
            studentCode = text.toUpperCase().trim();
        }

        // RLS yoqilgandan beri anon kalit jadvallarni to'g'ridan-to'g'ri o'qiy
        // olmaydi (avval shu yerda o'qirdi va oqim jimgina buzilgan edi).
        // Endi hammasi bazadagi tg_connect() ichida: markazni bot token bo'yicha
        // topadi, o'quvchini kod bo'yicha qidiradi va chatId ni bog'laydi.
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: result, error: rpcError } = await supabase.rpc('tg_connect', {
            p_bot_token: botToken,
            p_chat_id: chatId,
            p_code: studentCode,
        });

        if (rpcError || !result) {
            console.error('tg_connect error:', rpcError);
            await sendTelegramMessage(botToken, chatId,
                `⚠️ Tizim xatosi. Iltimos, keyinroq urinib ko'ring.`
            );
            return res.status(200).json({ ok: true });
        }

        if (result.status === 'no_center') {
            await sendTelegramMessage(botToken, chatId,
                `⚠️ Bot sozlanmagan. Iltimos, o'quv markazi administratoriga murojaat qiling.`
            );
            return res.status(200).json({ ok: true });
        }

        if (result.status === 'not_found') {
            await sendTelegramMessage(botToken, chatId,
                `❌ O'quvchi topilmadi!\n\n` +
                `"${studentCode}" kodi bilan ${result.centerName || "o'quv markazi"} da o'quvchi yo'q.\n\n` +
                `Iltimos, kodni tekshirib qaytadan kiriting.`
            );
            return res.status(200).json({ ok: true });
        }

        if (result.status === 'already') {
            await sendTelegramMessage(botToken, chatId,
                `✅ Siz allaqachon ${result.name} ga bog'langansiz!\n\n` +
                `Davomat va to'lov haqida xabarlar shu yerga keladi.`
            );
            return res.status(200).json({ ok: true });
        }

        // status === 'ok'
        await sendTelegramMessage(botToken, chatId,
            `✅ Muvaffaqiyatli bog'landingiz!\n\n` +
            `👤 O'quvchi: ${result.name}\n` +
            `🏫 Markaz: ${result.centerName || "O'quv markazi"}\n\n` +
            `Endi siz quyidagi xabarlarni olasiz:\n` +
            `📋 Davomat holati\n` +
            `💰 To'lov qabul qilindi\n` +
            `⏰ To'lov eslatmalari\n\n` +
            `Rahmat! 🙏`
        );

        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(200).json({ ok: true });
    }
}

// Helper function to send Telegram messages
async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });
        const data = await response.json();
        return data.ok === true;
    } catch (error) {
        console.error('Telegram send error:', error);
        return false;
    }
}
