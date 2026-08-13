
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
  SUPER_ADMIN = 'SUPER_ADMIN',
  STUDENT = 'STUDENT'
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
  // IELTS Mock Exam
  examBand?: number;
  examType?: 'academic' | 'general';
  examAttemptId?: string;
}

// ========================
// IELTS MOCK EXAM TYPES
// ========================

export enum IELTSExamType {
  ACADEMIC = 'academic',
  GENERAL = 'general'
}

export enum IELTSAttemptStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

export enum IELTSQuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE_NOT_GIVEN = 'true_false_not_given',
  YES_NO_NOT_GIVEN = 'yes_no_not_given',
  MATCHING_HEADINGS = 'matching_headings',
  MATCHING_FEATURES = 'matching_features',
  SENTENCE_COMPLETION = 'sentence_completion',
  SUMMARY_COMPLETION = 'summary_completion',
  SHORT_ANSWER = 'short_answer',
  FORM_COMPLETION = 'form_completion',
  NOTE_COMPLETION = 'note_completion',
  TABLE_COMPLETION = 'table_completion',
  FLOW_CHART = 'flow_chart_completion',
  DIAGRAM_LABEL = 'diagram_label_completion'
}

export interface IELTSAttempt {
  id: string;
  centerId: string;
  studentId?: string;
  studentName: string;
  examType: IELTSExamType;
  startTime: string;
  endTime?: string;
  readingStatus: IELTSAttemptStatus;
  listeningStatus: IELTSAttemptStatus;
  writingStatus: IELTSAttemptStatus;
  speakingStatus: IELTSAttemptStatus;
  readingScore?: number;
  listeningScore?: number;
  writingScore?: number;
  speakingScore?: number;
  overallScore?: number;
  readingAnswers?: Record<number, string>;
  listeningAnswers?: Record<number, string>;
  writingTask1Text?: string;
  writingTask2Text?: string;
  writingTask1Scores?: IELTSWritingScore;
  writingTask2Scores?: IELTSWritingScore;
  speakingScores?: IELTSSpeakingScore;
  status: IELTSAttemptStatus;
  leadId?: string;
  testId?: string;
  pinCode?: string;
}

export interface IELTSTest {
  id: string;
  centerId: string;
  title: string;
  examType: IELTSExamType;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  itemsCount?: {
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
  };
}

export interface IELTSTestPin {
  id: string;
  testId: string;
  pinCode: string;
  status: 'active' | 'inactive';
  usedCount: number;
  createdBy: string;
  expiresAt?: string;
  createdAt: string;
}

export interface IELTSWritingScore {
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overallBand: number;
  feedback: string;
  suggestions: string[];
  wordCount: number;
}

export interface IELTSSpeakingScore {
  fluencyCoherence: number;
  lexicalResource: number;
  grammaticalRange: number;
  pronunciation: number;
  overallBand: number;
  transcription: string;
  feedback: string;
  suggestions: string[];
}

export interface IELTSReadingQuestion {
  id: string;
  centerId: string;
  examType: IELTSExamType;
  passageNumber: 1 | 2 | 3;
  passageTitle: string;
  passageText: string;
  questionNumber: number;
  questionType: IELTSQuestionType;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface IELTSListeningQuestion {
  id: string;
  centerId: string;
  examType: IELTSExamType;
  sectionNumber: 1 | 2 | 3 | 4;
  sectionTitle: string;
  audioUrl: string;
  questionNumber: number;
  questionType: IELTSQuestionType;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface IELTSWritingTask {
  id: string;
  centerId: string;
  examType: IELTSExamType;
  taskNumber: 1 | 2;
  taskPrompt: string;
  taskImageUrl?: string;
  wordLimitMin: number;
  timeMinutes: number;
}

export interface IELTSSpeakingQuestion {
  id: string;
  centerId: string;
  partNumber: 1 | 2 | 3;
  questionText: string;
  cueCardTopic?: string;
  cueCardPoints?: string[];
  preparationTime?: number;
  speakingTime?: number;
}

export interface SystemSettings {
  centerId: string;
  centerName: string;
  address: string;
  phone: string;
  botToken: string;
  /** Bot @username — ota-onaga beriladigan ulanish havolasini yasash uchun */
  botUsername?: string;
  notifyAttendance: boolean;
  notifyPayment: boolean;
  standardTeacherPercentage: number;
  licenseExpiry?: string;
  isBlocked?: boolean;
  geminiApiKey?: string;
  reportChatId?: string;
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
