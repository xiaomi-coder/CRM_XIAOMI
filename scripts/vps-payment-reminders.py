#!/usr/bin/env python3
"""To'lov eslatmalarini yuborish (VPS'da kunlik timer chaqiradi).

Oqim: bazadagi public.due_payment_reminders() bugungi nomzodlarni beradi
(5/3/1 kun qolganlar va bugun to'lov kuni bo'lganlar, hali yuborilmaganlari),
har biriga markazning O'Z boti orqali Telegram xabar ketadi, muvaffaqiyatlisi
reminder_log'ga yoziladi — ertaga qayta ketmaydi.

Ishlatish:
  python3 crm-payment-reminders.py           # yuboradi
  python3 crm-payment-reminders.py --dry-run # faqat ro'yxatni ko'rsatadi

Joyi VPS'da: /root/crm-payment-reminders.py (systemd: crm-payment-reminders.timer, 09:00).
Repodagi nusxa: scripts/vps-payment-reminders.py — o'zgartirsangiz VPS'ga qayta nusxalang.
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
    name, date, center = r['name'], r['nextPaymentDate'], r['centerName']
    days = r['days_left']
    if days == 0:
        return (f"⚠️ <b>To'lov eslatmasi</b>\n\nHurmatli ota-ona!\n"
                f"Farzandingiz <b>{name}</b> uchun <b>bugun</b> to'lov kuni. "
                f"Iltimos, o'z vaqtida to'lang!\n\n"
                f"📅 To'lov sanasi: <b>{date}</b>\n\n<i>{center}</i>")
    emoji = '⚠️' if days == 1 else '⏰'
    urgency = " Iltimos, o'z vaqtida to'lang!" if days == 1 else ''
    return (f"{emoji} <b>To'lov eslatmasi</b>\n\nHurmatli ota-ona!\n"
            f"Farzandingiz <b>{name}</b> oylik to'loviga <b>{days} kun</b> "
            f"qoldi.{urgency}\n\n"
            f"📅 To'lov sanasi: <b>{date}</b>\n\n<i>{center}</i>")


def main():
    batch = json.loads(psql('SELECT public.due_payment_reminders();') or '[]')
    print(f'Nomzodlar: {len(batch)} ta' + (' (DRY RUN)' if DRY_RUN else ''))

    sent = failed = 0
    for r in batch:
        kind = f"D{r['days_left']}"
        label = f"{r['centerName']} / {r['name']} ({kind}, {r['nextPaymentDate']})"
        if DRY_RUN:
            print(f'  YUBORILARDI: {label}')
            continue
        if send_telegram(r['botToken'], r['tgChatId'], build_message(r)):
            psql(
                "SELECT public.mark_reminder_sent("
                f"'{r['studentId']}', '{r['centerId']}', "
                f"'{r['nextPaymentDate']}', '{kind}');"
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
