
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  DISMISSED = 'DISMISSED'
}

export enum UserRole {
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  TRIAL = 'TRIAL',
  REGISTERED = 'REGISTERED',
  REJECTED = 'REJECTED'
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  DROPPED = 'DROPPED'
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface TestTemplate {
  id: string;
  centerId: string;
  subject: string;
  title: string;
  questions: Question[];
  durationMinutes: number;
}

export interface User {
  id: string;
  centerId: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  groupIds?: string[];
  salaryPercentage?: number;
  permissions?: {
    dashboard?: boolean;
    students?: boolean;
    groups?: boolean;
    attendance?: boolean;
    payments?: boolean;
    expenses?: boolean;
    salary?: boolean;
    leads?: boolean;
    archive?: boolean;
    results?: boolean;
    library?: boolean;
    settings?: boolean;
  };
}

export interface Student {
  id: string;
  centerId: string;
  name: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  balance: number;
  coins: number;
  joinedDate: string;
  nextPaymentDate?: string;
  tgEnabled: boolean;
  tgChatId?: string;
  tgConnectionCode: string;
  status: StudentStatus;
  lastGroup?: string;
  lastTeacher?: string;
  exitDate?: string;
  exitNote?: string;
}

export interface Group {
  id: string;
  centerId: string;
  name: string;
  teacher: string;
  subject: string;
  days: string[];
  time: string;
  fee: number;
  studentIds: string[];
}

export interface Attendance {
  id: string;
  centerId: string;
  date: string;
  studentId: string;
  groupId: string;
  status: AttendanceStatus;
}

export interface Payment {
  id: string;
  centerId: string;
  studentId: string;
  groupId?: string;
  amount: number;
  date: string;
  type: 'CASH' | 'CARD';
  forMonth: string;
}

export interface Expense {
  id: string;
  centerId: string;
  title: string;
  amount: number;
  date: string;
  category: 'RENT' | 'TAX' | 'ADVERTISING' | 'OTHER';
}

export interface Lead {
  id: string;
  centerId: string;
  name: string;
  phone: string;
  // Added parent details to fix App.tsx compilation errors
  parentName?: string;
  parentPhone?: string;
  subject: string;
  status: LeadStatus;
  createdAt: string;
  note?: string;
  testId?: string;
  testScore?: number;
  testStatus?: 'PENDING' | 'COMPLETED';
  testPin?: string;
}

export interface SystemSettings {
  centerId: string;
  centerName: string;
  address: string;
  phone: string;
  botToken: string;
  notifyAttendance: boolean;
  notifyPayment: boolean;
  standardTeacherPercentage: number;
  licenseExpiry?: string;
  isBlocked?: boolean;
}

export interface LibraryResource {
  id: string;
  centerId: string;
  title: string;
  description: string;
  category: string;
  fileData: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Result {
  id: string;
  centerId: string;
  studentId: string;
  studentName: string;
  type: 'IELTS' | 'CEFR' | 'UNIVERSITY' | 'OTHER';
  title: string;
  score: string;
  date: string;
  description: string;
  certificateImage?: string;
}
