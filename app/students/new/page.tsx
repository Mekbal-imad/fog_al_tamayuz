import Link from 'next/link';
import { ArrowRight, UserPlus } from 'lucide-react';
import StudentForm from '../../../components/StudentForm';

export default function NewStudentPage() {
  return <main className="management-page"><div className="page-breadcrumb"><Link href="/">لوحة التحكم</Link><ArrowRight size={14}/><Link href="/students">إدارة الطلبة</Link><ArrowRight size={14}/><span>إضافة طالب</span></div><div className="page-heading"><div><p className="eyebrow">ملف جديد</p><h1><UserPlus size={25}/> إضافة طالب جديد</h1><p className="muted">أدخل المعلومات الأساسية والتعليمية والإدارية للطالب.</p></div></div><section className="panel form-panel"><StudentForm mode="create"/></section></main>;
}
