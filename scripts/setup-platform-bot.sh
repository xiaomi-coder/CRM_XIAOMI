#!/usr/bin/env bash
# Platforma botini yoqish — VPS'da @BotFather'dan token kelganda ISHGA TUSHIRILADI.
#
# Qiladi:
#   1. Bazaga bot_token, bot_username, owner_chat_id yozadi (platform_config)
#   2. Telegram webhook'ni Vercel'dagi api/platform-bot.ts ga ulaydi
#   3. Sinov muddati eslatmalari uchun systemd timer o'rnatadi (09:30, har kuni)
#
# Ishlatish (VPS'da, root sifatida):
#   ./setup-platform-bot.sh <BOT_TOKEN> <BOT_USERNAME> <OWNER_CHAT_ID>
#
# OWNER_CHAT_ID — sizning shaxsiy Telegram chat ID'ingiz (yangi ro'yxatlar
# haqida xabar shu yerga keladi). Bilmasangiz: @userinfobot ga /start yozing.
set -euo pipefail

BOT_TOKEN="${1:?BOT_TOKEN kerak}"
BOT_USERNAME="${2:?BOT_USERNAME kerak (masalan: educontrol_crm_bot)}"
OWNER_CHAT_ID="${3:?OWNER_CHAT_ID kerak}"
WEBHOOK_URL="https://eduprocrm.uz/api/platform-bot?token=${BOT_TOKEN}"

echo "1) Bazaga yozilmoqda..."
sudo -u postgres psql -d crm -v ON_ERROR_STOP=1 <<SQL
INSERT INTO platform_config (key, value) VALUES
  ('bot_token', '${BOT_TOKEN}'),
  ('bot_username', '${BOT_USERNAME}'),
  ('owner_chat_id', '${OWNER_CHAT_ID}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
SQL

echo "2) Telegram webhook ulanmoqda..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${WEBHOOK_URL}" -d "allowed_updates=[\"message\"]"
echo

echo "3) Sinov eslatmalari timer'i o'rnatilmoqda..."
cat > /etc/systemd/system/crm-trial-reminders.service <<EOF
[Unit]
Description=CRM sinov muddati eslatmalari (platforma bot)

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /root/crm-trial-reminders.py
EOF
cat > /etc/systemd/system/crm-trial-reminders.timer <<EOF
[Unit]
Description=Har kuni 09:30 da sinov muddati eslatmalari

[Timer]
OnCalendar=*-*-* 09:30:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now crm-trial-reminders.timer

echo
echo "Tayyor. Tekshirish uchun:"
echo "  curl -s https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
echo "  python3 /root/crm-trial-reminders.py --dry-run"
