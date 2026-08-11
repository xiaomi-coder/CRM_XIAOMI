
import React, { useState } from 'react';
import { Search, GraduationCap, UserMinus, Download, History } from 'lucide-react';
import { Student, StudentStatus, Group } from '../types';
import { PageHeader, Card, Button, Field, Input, Select, Table, Th, Td, StatusBadge, Avatar, EmptyState } from './ui';

interface ArchiveProps {
  students: Student[];
  groups: Group[];
}

interface ArchiveProps {
  t: any;
  students: Student[];
  groups: Group[];
}

const Archive: React.FC<ArchiveProps> = ({ t, students, groups }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StudentStatus>('ALL');

  // Faqat faol bo'lmagan (Bitirgan yoki Tark etgan) o'quvchilarni filtrlaymiz
  const archivedStudents = students.filter(s =>
    s.status === StudentStatus.GRADUATED || s.status === StudentStatus.DROPPED
  );

  const filteredArchive = archivedStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);

    const matchesFilter = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const exportArchive = () => {
    const headers = [t.student_name, t.parent_phone, t.status, t.groups, t.teacher, t.exit_date, t.note];
    const rows = filteredArchive.map(s => [
      s.name,
      s.phone,
      s.status === StudentStatus.GRADUATED ? t.graduated : t.dropped,
      s.lastGroup || "—",
      s.lastTeacher || "—",
      s.exitDate || "—",
      s.exitNote || "—"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Archive_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader
        title={t.archive}
        subtitle={`${filteredArchive.length} / ${archivedStudents.length}`}
        actions={
          <Button variant="secondary" size="sm" onClick={exportArchive}>
            <Download size={15} /> {t.excel_csv || 'Excel (CSV)'}
          </Button>
        }
      />

      <Card className="mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <Field label={t.search_label || 'Qidirish'} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
              <Input
                className="pl-9"
                placeholder={t.search_placeholder}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </Field>
          <Field label={t.status} className="sm:w-56">
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
              <option value="ALL">{t.all_categories || 'Barchasi'}</option>
              <option value={StudentStatus.GRADUATED}>{t.graduated}</option>
              <option value={StudentStatus.DROPPED}>{t.dropped}</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>{t.student_name}</Th>
              <Th>{t.status}</Th>
              <Th>{t.groups} / {t.teacher}</Th>
              <Th>{t.exit_date}</Th>
              <Th>{t.note}</Th>
            </tr>
          </thead>
          <tbody>
            {filteredArchive.length > 0 ? filteredArchive.map(s => (
              <tr key={s.id} className="hover:bg-[#FAFAFB] transition-colors">
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={s.name} size={32} />
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate">{s.name}</div>
                      <div className="text-[12px] text-muted truncate">{s.phone}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <StatusBadge
                    label={s.status === StudentStatus.GRADUATED ? t.graduated : t.dropped}
                    tone={s.status === StudentStatus.GRADUATED ? 'info' : 'danger'}
                  />
                </Td>
                <Td>
                  <div className="text-ink">{s.lastGroup || '—'}</div>
                  <div className="text-[12px] text-muted">{s.lastTeacher || '—'}</div>
                </Td>
                <Td className="text-ink-2 tabular-nums">
                  {s.exitDate ? s.exitDate.split('-').reverse().join('.') : '—'}
                </Td>
                <Td className="text-ink-2 max-w-[240px]">{s.exitNote || '—'}</Td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={<History size={22} />} title={t.search_empty} />
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};

export default Archive;