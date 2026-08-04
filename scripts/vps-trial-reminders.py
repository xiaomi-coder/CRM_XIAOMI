#!/usr/bin/env python3
"""Sinov muddati tugayotgan markazlarga eslatma (VPS'da kunlik timer chaqiradi).

Faqat platforma bot yoqilgan (db/12-platform-bot.sql) va ro'yxatdan o'tishda
Telegram tasdiqlangan markazlarga ishlaydi (settings.platformChatId bor).
3 va 1 kun qolganda direktorga platforma boti orqali eslatma ketadi.

Ishlatish:
  python3 crm-trial-reminders.py           # yuboradi
  python3 crm-trial-reminders.py --dry-run # faqat ro'yxat

Joyi VPS'da: /root/crm-trial-reminders.py (systemd: crm-trial-reminders.timer,
har kuni 09:30). Repodagi nusxa: scripts/vps-trial-reminders.py.
"""
import json
import subprocess
import sys
import urllib.request
import urllib.parse

DRY_RUN = '--dry-run' in sys.argv


def psql(sql: str) -> str:
    out = subprocess.run(
        ['sudo', '-u', 'postgres', 'psql', '-d', 'crm', '-At', '-c', sql],
        capture_output=True, text=True, timeout=60,
    )
    if out.returncode != 0:
        raise RuntimeError(f'psql xatosi: {out.stderr.strip()}')
    return out.stdout.strip()


def platform_bot_token() -> str | None:
    out = psql("SELECT value FROM platform_config WHERE key = 'bot_token';")
    return out or None


def send_telegram(token: str, chat_id: str, text: str) -> bool:
    data = urllib.parse.urlencode({
        'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML',
    }).encode()
    req = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/sendMessage', data=data)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read()).get('ok', False)
    except Exception as e:
        print(f'  Telegram xatosi: {e}')
        return False


def build_message(r: dict) -> str:
    days = r['days_left']
    if days == 1:
        return (f"⏰ <b>Sinov muddati ertaga tugaydi!</b>\n\n"
                f"🏫 {r['centerName']}\n"
                f"📅 Tugash sanasi: <b>{r['licenseExpiry']}</b>\n\n"
                f"Ishlashda davom etish uchun to'lov qiling — aloqa: "
                f"@bakoev_71 yoki +998 90 612 71 71.")
    return (f"⏰ <b>Sinov muddati {days} kundan keyin tugaydi</b>\n\n"
            f"🏫 {r['centerName']}\n"
            f"📅 Tugash sanasi: <b>{r['licenseExpiry']}</b>\n\n"
            f"Ishlashda uzluksiz davom etish uchun oldindan bog'laning — "
            f"@bakoev_71 yoki +998 90 612 71 71.")


def main():
    token = platform_bot_token()
    if not token:
        print('Platforma bot hali sozlanmagan — chiqilmoqda.')
        return

    batch = json.loads(psql('SELECT public.trial_expiring_centers();') or '[]')
    print(f'Nomzodlar: {len(batch)} ta' + (' (DRY RUN)' if DRY_RUN else ''))

    sent = failed = 0
    for r in batch:
        kind = f"TRIAL{r['days_left']}"
        label = f"{r['centerName']} ({kind}, {r['licenseExpiry']})"
        if DRY_RUN:
            print(f'  YUBORILARDI: {label}')
            continue
        if send_telegram(token, r['platformChatId'], build_message(r)):
            psql(
                "SELECT public.mark_reminder_sent("
                f"'center_{r['centerId']}', '{r['centerId']}', "
                f"'{r['licenseExpiry']}', '{kind}');"
            )
            print(f'  YUBORILDI: {label}')
            sent += 1
        else:
            print(f'  XATO: {label}')
            failed += 1

    if not DRY_RUN:
        print(f'Yakun: {sent} yuborildi, {failed} xato.')


if __name__ == '__main__':
    main()
