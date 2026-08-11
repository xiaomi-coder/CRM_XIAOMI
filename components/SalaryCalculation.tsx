
import React, { useState, useMemo, useEffect } from 'react';
import { User, Group, Payment, Student, UserRole } from '../types';
import { Calculator, User as UserIcon, Calendar, Percent, TrendingUp, BookOpen, Wallet, Users, Target, Activity } from 'lucide-react';
import { PageHeader, Card, CardHeader, KpiCard, Field, Input, Select, Table, Th, Td, StatusBadge, EmptyState } from './ui';

interface SalaryCalculationProps {
  users: User[];
  groups: Group[];
  payments: Payment[];
  students: Student[];
  currentUser: User;
}

interface SalaryCalculationProps {
  t: any;
  users: User[];
  groups: Group[];
  payments: Payment[];
  students: Student[];
  currentUser: User;
}

const SalaryCalculation: React.FC<SalaryCalculationProps> = ({ t, users, groups, payments, students, currentUser }) => {
  const MONTHS = [
    t.jan, t.feb, t.mar, t.apr, t.may, t.jun,
    t.jul, t.aug, t.sep, t.oct, t.nov, t.dec
  ];

  const isDirector = currentUser.role === UserRole.DIRECTOR;
  const [selectedTeacherId, setSelectedTeacherId] = useState(isDirector ? '' : currentUser.id);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [percentage, setPercentage] = useState(40);

  useEffect(() => {
    if (!isDirector) {
      setSelectedTeacherId(currentUser.id);
      setPercentage(currentUser.salaryPercentage || 40);
    }
  }, [currentUser, isDirector]);

  useEffect(() => {
    // Agar til ozgarsa, tanlangan oyni ham yangilash kerak, aks holda eski tildagi oy qolib ketadi
    setSelectedMonth(MONTHS[new Date().getMonth()]);
  }, [t]);

  const teachers = users.filter(u => u.role === UserRole.TEACHER);

  const calculation = useMemo(() => {
    if (!selectedTeacherId) return null;

    const teacher = users.find(u => u.id === selectedTeacherId);
    if (!teacher) return null;

    const currentPercentage = isDirector ? percentage : (teacher.salaryPercentage || 40);
    const teacherGroupIds = teacher.groupIds || [];
    const teacherGroups = groups.filter(g =>
      teacherGroupIds.includes(g.id) || g.teacher === teacher.name
    );

    if (teacherGroups.length === 0) return { teacherName: teacher.name, groupsCount: 0 };

    let totalRevenue = 0;
    const groupDetails = teacherGroups.map(g => {
      const groupStudentIds = new Set(g.studentIds);
      const groupRev = payments
        .filter(p => groupStudentIds.has(p.studentId) && p.forMonth.toLowerCase() === selectedMonth.toLowerCase())
        .reduce((sum, p) => sum + p.amount, 0);

      totalRevenue += groupRev;

      return {
        name: g.name,
        subject: g.subject,
        revenue: groupRev,
        share: (groupRev * currentPercentage) / 100
      };
    });

    const teacherSalary = (totalRevenue * currentPercentage) / 100;
    const studentsCount = new Set(teacherGroups.flatMap(g => g.studentIds)).size;

    return {
      teacherName: teacher.name,
      groupsCount: teacherGroups.length,
      studentsCount,
      totalRevenue,
      teacherSalary,
      currentPercentage,
      groupDetails
    };
  }, [selectedTeacherId, selectedMonth, percentage, users, groups, payments, isDirector]);

  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader title={t.salary} subtitle={selectedMonth} />

      {/* Tanlov paneli */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          {isDirector && (
            <Field label={t.teacher} className="flex-1 min-w-[220px]">
              <Select
                value={selectedTeacherId}
                onChange={(e) => {
                  const uid = e.target.value;
                  setSelectedTeacherId(uid);
                  const u = users.find(x => x.id === uid);
                  if (u?.salaryPercentage) setPercentage(u.salaryPercentage);
                }}
              >
                <option value="">{t.select_teacher}</option>
                {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
              </Select>
            </Field>
          )}

          <Field label={t.month} className="w-full sm:w-48">
            <Select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>

          {isDirector && (
            <Field label={t.share} className="w-full sm:w-32">
              <Input type="number" value={percentage} onChange={e => setPercentage(Number(e.target.value))} />
            </Field>
          )}
        </div>
      </Card>

      {calculation && calculation.groupsCount > 0 ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <KpiCard label={t.salary} value={calculation.teacherSalary.toLocaleString()} hint="UZS" />
            <KpiCard label={t.revenue} value={calculation.totalRevenue.toLocaleString()} hint="UZS" />
            <KpiCard label={t.groups} value={calculation.groupsCount} />
            <KpiCard label={t.students} value={calculation.studentsCount} />
          </div>

          <Card padded={false}>
            <div className="px-5 pt-5">
              <CardHeader
                title={`${t.details} (${selectedMonth})`}
                actions={<StatusBadge label={`${t.share}: ${calculation.currentPercentage}%`} tone="brand" dot={false} />}
              />
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>{t.groups} / {t.subject}</Th>
                  <Th align="right">{t.revenue}</Th>
                  <Th align="right">{t.salary}</Th>
                </tr>
              </thead>
              <tbody>
                {calculation.groupDetails.map((group, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFAFB] transition-colors">
                    <Td>
                      <div className="font-semibold text-ink">{group.name}</div>
                      <div className="text-[12px] text-muted">{group.subject}</div>
                    </Td>
                    <Td align="right" className="tabular-nums text-ink-2">{group.revenue.toLocaleString()}</Td>
                    <Td align="right" className="tabular-nums font-semibold text-success">
                      +{group.share.toLocaleString()}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#FAFAFB]">
                  <Td className="font-semibold">{t.total}</Td>
                  <Td align="right" className="font-semibold tabular-nums">{calculation.totalRevenue.toLocaleString()} UZS</Td>
                  <Td align="right" className="font-bold tabular-nums text-success">{calculation.teacherSalary.toLocaleString()} UZS</Td>
                </tr>
              </tfoot>
            </Table>
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={<Calculator size={22} />}
            title={t.search_empty}
            description={t.salary_empty_hint || "O'qituvchini tanlang. Uning guruhlari borligiga va shu oyda to'lov qilinganiga ishonch hosil qiling."}
          />
        </Card>
      )}
    </div>
  );
};

export default SalaryCalculation;