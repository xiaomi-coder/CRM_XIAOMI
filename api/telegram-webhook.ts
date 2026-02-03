import { createClient } from '@supabase/supabase-js';

// Supabase configuration (same as main app)
const supabaseUrl = "https://ndrynujcnzxkvhmrlemr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcnludWpjbnp4a3ZobXJsZW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODM0NDcsImV4cCI6MjA4Mzk1OTQ0N30.DrSYWDTgOVft-LH136GwJeyYdvyKMnZO_NwiegPwDr0";

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

        // Handle /start command
        if (text === '/start' || text.startsWith('/start')) {
            await sendTelegramMessage(botToken, chatId,
                `Assalomu alaykum, ${firstName}! 👋\n\n` +
                `Farzandingizni tizimga ulash uchun o'quvchi kodini kiriting.\n\n` +
                `📝 O'quvchi kodini o'quv markazidan so'rang.\n` +
                `(Kod 3-4 ta harf/raqamdan iborat, masalan: A1B yoki 4CQ5)\n\n` +
                `O'quvchi kodini kiriting:`
            );
            return res.status(200).json({ ok: true });
        }

        // Handle student code input
        const studentCode = text.toUpperCase().trim();

        // Connect to Supabase
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Find student by ID suffix (the code shown in UI is last 3 chars of id)
        // Also try tgConnectionCode as fallback
        const { data: allStudents, error: fetchError } = await supabase
            .from('students')
            .select('*');

        if (fetchError) {
            console.error('Fetch error:', fetchError);
            await sendTelegramMessage(botToken, chatId,
                `⚠️ Tizim xatosi. Iltimos, keyinroq urinib ko'ring.`
            );
            return res.status(200).json({ ok: true });
        }

        // Search by ID suffix (last 3-4 characters) or tgConnectionCode
        const student = allStudents?.find(s =>
            s.id.slice(-3).toUpperCase() === studentCode ||
            s.id.slice(-4).toUpperCase() === studentCode ||
            s.tgConnectionCode?.toUpperCase() === studentCode
        );

        if (!student) {
            await sendTelegramMessage(botToken, chatId,
                `❌ O'quvchi topilmadi!\n\n` +
                `"${studentCode}" kodi bilan o'quvchi tizimda yo'q.\n\n` +
                `Iltimos, kodni tekshirib qaytadan kiriting yoki o'quv markaziga murojaat qiling.`
            );
            return res.status(200).json({ ok: true });
        }

        // Check if already linked
        if (student.tgChatId && student.tgChatId === chatId) {
            await sendTelegramMessage(botToken, chatId,
                `✅ Siz allaqachon ${student.name} ga bog'langansiz!\n\n` +
                `Davomat va to'lov haqida xabarlar shu yerga keladi.`
            );
            return res.status(200).json({ ok: true });
        }

        // Update student with parent's Telegram chat ID
        const { error: updateError } = await supabase
            .from('students')
            .update({
                tgChatId: chatId,
                tgEnabled: true
            })
            .eq('id', student.id);

        if (updateError) {
            console.error('Update error:', updateError);
            await sendTelegramMessage(botToken, chatId,
                `⚠️ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.`
            );
            return res.status(200).json({ ok: true });
        }

        // Get center name for confirmation
        const { data: settings } = await supabase
            .from('settings')
            .select('centerName')
            .eq('centerId', student.centerId)
            .single();

        const centerName = settings?.centerName || "O'quv markazi";

        // Send success message
        await sendTelegramMessage(botToken, chatId,
            `✅ Muvaffaqiyatli bog'landingiz!\n\n` +
            `👤 O'quvchi: ${student.name}\n` +
            `🏫 Markaz: ${centerName}\n\n` +
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
