import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ndrynujcnzxkvhmrlemr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcnludWpjbnp4a3ZobXJsZW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODM0NDcsImV4cCI6MjA4Mzk1OTQ0N30.DrSYWDTgOVft-LH136GwJeyYdvyKMnZO_NwiegPwDr0";

const MONTH_NAMES_UZ = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

export default async function handler(req: any, res: any) {
    // Faqat GET (Vercel Cron) yoki POST (qo'lda yuborish) so'rovlarini qabul qilamiz
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // POST so'rovlar uchun secret token tekshirish (qo'lda yuborishda)
    if (req.method === 'POST') {
        const authToken = req.headers['x-report-token'] || req.query.token;
        const expectedToken = process.env.REPORT_SECRET || 'monthly-report-secret-2025';
        if (authToken !== expectedToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // O'tgan oyni aniqlash
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthName = `${MONTH_NAMES_UZ[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;

    let totalSent = 0;
    let totalCenters = 0;
    const errors: string[] = [];

    try {
        // Barcha markazlar sozlamalarini olish
        const { data: allSettings, error: settingsError } = await supabase
            .from('settings')
            .select('centerId, centerName, botToken, isBlocked');

        if (settingsError || !allSettings) {
            return res.status(500).json({ error: 'Settings olishda xatolik', details: settingsError });
        }

        // Faqat botToken bor va bloklanmagan markazlar
        const activeCenters = allSettings.filter(s => s.botToken && !s.isBlocked);
        totalCenters = activeCenters.length;

        for (const center of activeCenters) {
            try {
                const { centerId, centerName, botToken } = center;

                // Bu markaz o'quvchilarini olish (faqat Telegram ulangan)
                const { data: students } = await supabase
                    .from('students')
                    .select('id, name, tgChatId, tgEnabled')
                    .eq('centerId', centerId)
                    .eq('tgEnabled', true)
                    .not('tgChatId', 'is', null);

                if (!students || students.length === 0) continue;

                // O'tgan oy davomati
                const { data: attendance } = await supabase
                    .from('attendance')
                    .select('studentId, status, date')
                    .eq('centerId', centerId)
                    .like('date', `${lastMonthKey}%`);

                const attendanceList = attendance || [];

                // Har bir o'quvchiga hisobot yuborish
                for (const student of students) {
                    if (!student.tgChatId) continue;

                    const studentAtt = attendanceList.filter((a: any) => a.studentId === student.id);

                    const present = studentAtt.filter((a: any) =>
                        a.status === 'PRESENT' || a.status === 'DISMISSED' || a.status === 'LATE'
                    ).length;
                    const absent = studentAtt.filter((a: any) => a.status === 'ABSENT').length;
                    const late = studentAtt.filter((a: any) => a.status === 'LATE').length;
                    const total = studentAtt.length;

                    if (total === 0) continue; // Bu oy davomati yo'q — yubormaymiz

                    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

                    // Emoji tanlash
                    const emoji = percent >= 90 ? '🌟' : percent >= 75 ? '✅' : percent >= 50 ? '⚠️' : '❌';
                    const comment =
                        percent >= 90 ? 'Ajoyib! Davomati zo\'r!' :
                        percent >= 75 ? 'Yaxshi natija!' :
                        percent >= 50 ? 'Davomatini yaxshilash kerak.' :
                        'Darslarni ko\'p o\'tkazib yubormoqda!';

                    const message =
                        `📊 <b>${lastMonthName} — Oylik Davomat Hisoboti</b>\n\n` +
                        `👤 O'quvchi: <b>${student.name}</b>\n` +
                        `🏫 Markaz: <b>${centerName}</b>\n\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `✅ Keldi: <b>${present} kun</b>\n` +
                        `❌ Kelmadi: <b>${absent} kun</b>\n` +
                        (late > 0 ? `⏰ Kech keldi: <b>${late} kun</b>\n` : '') +
                        `📅 Jami: <b>${total} kun</b>\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `${emoji} Davomat: <b>${percent}%</b>\n\n` +
                        `<i>${comment}</i>`;

                    const sent = await sendTelegramMessage(botToken, student.tgChatId, message);
                    if (sent) totalSent++;
                }

            } catch (centerErr: any) {
                errors.push(`${center.centerName}: ${centerErr.message}`);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Oylik hisobot yuborildi`,
            month: lastMonthName,
            totalCenters,
            totalSent,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('Monthly report error:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
        });
        const data = await response.json();
        return data.ok === true;
    } catch {
        return false;
    }
}
