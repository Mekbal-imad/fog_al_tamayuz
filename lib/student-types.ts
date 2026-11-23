export type StudentStatus = 'active' | 'inactive' | 'pending';

export type Student = {
  id: string;
  full_name: string;
  status: StudentStatus;
  date_of_birth: string | null;
  phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  previous_hizb: number | null;
  previous_memorization_notes: string | null;
  memorization_start_point: string | null;
  revision_start_point: string | null;
  notes: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
};

export const STATUS_LABELS: Record<StudentStatus, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  pending: 'قيد الانتظار',
};

export const EMPTY_STUDENT = {
  full_name: '', date_of_birth: '', phone: '', guardian_name: '', guardian_phone: '',
  guardian_email: '', previous_hizb: '0', previous_memorization_notes: '',
  memorization_start_point: '', revision_start_point: '', notes: '',
  joined_at: new Date().toISOString().slice(0, 10), status: 'active' as StudentStatus,
};
