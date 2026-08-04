#!/usr/bin/env python3
"""Ketib qolish xavfi — haftalik hisobot (VPS'da dushanba 10:30 timer chaqiradi).

Bazadagi public.churn_risk_data() xavf ostidagi o'quvchilarni beradi
(qoidalar frontenddagi services/churnRisk.ts bilan bir xil), har markaz uchun
BITTA jamlama xabar direktorning botiga (settings.reportChatId) yuboriladi.
Yuborilgani reminder_log'ga kind='RISK', hafta kaliti bilan belgilanadi —
o'sha hafta ichida qayta ketmaydi.

Ishlatish:
  python3 crm-risk-report.py           # yuboradi
  python3 crm-risk-report.py --dry-run # faqat ro'yxat

Joyi VPS'da: /root/crm-risk-report.py (systemd: crm-risk-report.timer).
Repodagi nusxa: scripts/vps-risk-report.py.
"""
import json
import subprocess
import sys
import urllib.request
import urllib.parse
from collections import defaultdict
from datetime import date

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


def factors(r: dict) -> str:
    parts = []
    if r['absent_streak'] >= 3:
        parts.append(f"{r['absent_streak']} dars ketma-ket kelmagan")
    if r['recent_total'] >= 3 and r['recent_present'] * 100 < r['recent_total'] * 50:
        pct = round(r['recent_present'] / r['recent_total'] * 100)
        parts.append(f"2 haftalik davomat {pct}%")
    if r['overdue_days'] >= 7:
        parts.append(f"to'lov {r['overdue_days']} kun kechikkan")
    return '; '.join(parts)


def build_message(center_name: str, rows: list) -> str:
    lines = [f'⚠️ <b>Ketib qolish xavfi — haftalik tahlil</b>',
             f'🏫 {center_name}\n']
    for r in rows:
        dot = '🔴' if r['level'] == 'HIGH' else '🟡'
        phone = r.get('parentPhone') or r.get('phone') or ''
        phone_part = f' ({phone})' if phone else ''
        lines.append(f"{dot} <b>{r['name']}</b>{phone_part}\n    {factors(r)}")
    lines.append(f"\nJami: <b>{len(rows)} o'quvchi</b>. Ular bilan bog'lanib, "
                 f'sababini aniqlash tavsiya qilinadi.')
    return '\n'.join(lines)


def main():
    batch = json.loads(psql('SELECT public.churn_risk_data();') or '[]')
    by_center = defaultdict(list)
    for r in batch:
        by_center[r['centerId']].append(r)
    print(f"Markazlar: {len(by_center)} ta, o'quvchilar: {len(batch)} ta"
          + (' (DRY RUN)' if DRY_RUN else ''))

    week_key = date.today().strftime('%G-%V')
    sent = failed = 0
    for center_id, rows in by_center.items():
        first = rows[0]
        label = f"{first['centerName']} ({len(rows)} o'quvchi)"
        if DRY_RUN:
            print(f'  YUBORILARDI: {label}')
            for r in rows:
                print(f"    - {r['level']}: {r['name']} — {factors(r)}")
            continue
        if send_telegram(first['botToken'], first['reportChatId'],
                         build_message(first['centerName'], rows)):
            psql(
                "SELECT public.mark_reminder_sent("
                f"'center_{center_id}', '{center_id}', '{week_key}', 'RISK');"
            )
            print(f'  YUBORILDI: {label}')
            sent += 1
        else:
            print(f'  XATO: {label}')
            failed += 1

    if not DRY_RUN:
        print(f'Yakun: {sent} markaz, {failed} xato.')


if __name__ == '__main__':
    main()
