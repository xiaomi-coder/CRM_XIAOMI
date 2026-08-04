#!/usr/bin/env python3
"""Oylik davomat hisobotini yuborish (VPS'da oylik timer chaqiradi).

Bazadagi public.monthly_report_data() o'tgan oy davomati bo'yicha har bir
Telegram ulangan o'quvchining statistikasini beradi (hali yuborilmaganlarini),
markazning o'z boti orqali ota-onaga hisobot ketadi va reminder_log'ga
kind='MONTHLY' bilan belgilanadi — takror ketmaydi.

Ishlatish:
  python3 crm-monthly-report.py           # yuboradi
  python3 crm-monthly-report.py --dry-run # faqat ro'yxat

Joyi VPS'da: /root/crm-monthly-report.py (systemd: crm-monthly-report.timer,
har oy 1-sanada 10:00). Repodagi nusxa: scripts/vps-monthly-report.py.
"""
import json
import subprocess
import sys
import urllib.request
import urllib.parse

DRY_RUN = '--dry-run' in sys.argv

MONTH_NAMES_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
                  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']


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
    year, month = r['month_key'].split('-')
    month_name = f'{MONTH_NAMES_UZ[int(month) - 1]} {year}'
    present, absent, late, total = r['present'], r['absent'], r['late'], r['total']
    percent = round(present / total * 100) if total else 0
    emoji = '🌟' if percent >= 90 else '✅' if percent >= 75 else '⚠️' if percent >= 50 else '❌'
    comment = ("Ajoyib! Davomati zo'r!" if percent >= 90 else
               'Yaxshi natija!' if percent >= 75 else
               'Davomatini yaxshilash kerak.' if percent >= 50 else
               "Darslarni ko'p o'tkazib yubormoqda!")
    late_line = f'⏰ Kech keldi: <b>{late} kun</b>\n' if late > 0 else ''
    return (f'📊 <b>{month_name} — Oylik Davomat Hisoboti</b>\n\n'
            f"👤 O'quvchi: <b>{r['name']}</b>\n"
            f"🏫 Markaz: <b>{r['centerName']}</b>\n\n"
            f'━━━━━━━━━━━━━━━━━━\n'
            f'✅ Keldi: <b>{present} kun</b>\n'
            f'❌ Kelmadi: <b>{absent} kun</b>\n'
            f'{late_line}'
            f'📅 Jami: <b>{total} kun</b>\n'
            f'━━━━━━━━━━━━━━━━━━\n'
            f'{emoji} Davomat: <b>{percent}%</b>\n\n'
            f'<i>{comment}</i>')


def main():
    batch = json.loads(psql('SELECT public.monthly_report_data();') or '[]')
    print(f'Nomzodlar: {len(batch)} ta' + (' (DRY RUN)' if DRY_RUN else ''))

    sent = failed = 0
    for r in batch:
        label = f"{r['centerName']} / {r['name']} ({r['month_key']})"
        if DRY_RUN:
            print(f'  YUBORILARDI: {label}')
            continue
        if send_telegram(r['botToken'], r['tgChatId'], build_message(r)):
            psql(
                "SELECT public.mark_reminder_sent("
                f"'{r['studentId']}', '{r['centerId']}', "
                f"'{r['month_key']}', 'MONTHLY');"
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
