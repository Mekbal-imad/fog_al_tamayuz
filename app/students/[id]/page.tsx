'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Pencil, UserRound, Phone, Mail, BookOpen, CalendarDays, ShieldCheck, AlertTriangle, ClipboardList, CalendarCheck, ChartNoAxesCombined } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Student, STATUS_LABELS } from '../../../lib/student-types';

export default function StudentProfilePage() {
  const params = useParams<{id:string}>(); const router = useRouter();
  const [student,setStudent] = useState<Student|null>(null); const [loading,setLoading] = useState(true); const [error,setError] = useState(''); const [changing,setChanging] = useState(false);
  const load = useCallback(async()=>{
    if(!supabase){setError('إعدادات Supabase غير مكتملة.');setLoading(false);return;}
    const {data:auth}=await supabase.auth.getUser(); if(!auth.user){router.replace('/');return;}
    const {data,error:queryError}=await supabase.from('students').select('*').eq('id',params.id).single();
    if(queryError)setError(`تعذر تحميل ملف الطالب: ${queryError.message}`); else setStudent(data as Student);
    setLoading(false);
  },[params.id,router]);
  useEffect(()=>{void load();},[load]);

  async function changeStatus(){
    if(!student||!supabase)return;
    const next=student.status==='inactive'?'active':'inactive';
    const confirmed=window.confirm(next==='inactive'?'هل تريد نقل هذا الطالب إلى قائمة غير النشطين؟ لن تُحذف بياناته.':'هل تريد إعادة تفعيل هذا الطالب؟');
    if(!confirmed)return;
    setChanging(true);const {error:updateError}=await supabase.from('students').update({status:next,updated_at:new Date().toISOString()}).eq('id',student.id);
    setChanging(false);if(updateError){setError(`تعذر تغيير الحالة: ${updateError.message}`);return;}await load();
  }

  if(loading)return <main className="management-page"><div className="loading-state">جارٍ تحميل الملف الشخصي...</div></main>;
  if(error||!student)return <main className="management-page"><p className="form-error">{error||'لم يتم العثور على الطالب.'}</p><Link href="/students" className="secondary-button">العودة إلى قائمة الطلبة</Link></main>;
  return <main className="management-page">
    <div className="page-breadcrumb"><Link href="/">لوحة التحكم</Link><ArrowRight size={14}/><Link href="/students">إدارة الطلبة</Link><ArrowRight size={14}/><span>الملف الشخصي</span></div>
    <section className="profile-hero"><div className="profile-avatar"><UserRound size={34}/></div><div className="profile-main"><span className={`status-pill status-${student.status}`}>{STATUS_LABELS[student.status]}</span><h1>{student.full_name}</h1><p>طالب في فوج التميز · تاريخ الانضمام: {formatDate(student.joined_at)}</p></div><div className="profile-actions"><Link href={`/students/${student.id}/edit`} className="primary-link compact-link"><Pencil size={16}/> تعديل الملف</Link><button className="secondary-button" disabled={changing} onClick={changeStatus}>{changing?'جارٍ التحديث...':student.status==='inactive'?'إعادة التفعيل':'نقل إلى غير النشطين'}</button></div></section>
    <div className="profile-grid">
      <InfoCard title="المعلومات الشخصية" icon={<UserRound/>}><Info label="الاسم الكامل" value={student.full_name}/><Info label="تاريخ الميلاد" value={formatDate(student.date_of_birth)}/><Info label="رقم الهاتف" value={student.phone} icon={<Phone size={14}/>}/><Info label="تاريخ الانضمام" value={formatDate(student.joined_at)}/></InfoCard>
      <InfoCard title="معلومات ولي الأمر" icon={<ShieldCheck/>}><Info label="اسم الولي" value={student.guardian_name}/><Info label="رقم الهاتف" value={student.guardian_phone} icon={<Phone size={14}/>}/><Info label="البريد الإلكتروني" value={student.guardian_email} icon={<Mail size={14}/>}/></InfoCard>
      <InfoCard title="المعلومات التعليمية" icon={<BookOpen/>}><Info label="المحفوظ السابق" value={`${student.previous_hizb??0} حزب`}/><Info label="بداية الحفظ الجديد" value={student.memorization_start_point}/><Info label="بداية المراجعة" value={student.revision_start_point}/><Info label="ملاحظات الحفظ السابق" value={student.previous_memorization_notes} multiline/></InfoCard>
      <InfoCard title="المعلومات الإدارية" icon={<CalendarDays/>}><Info label="حالة الطالب" value={STATUS_LABELS[student.status]}/><Info label="آخر تحديث" value={formatDate(student.updated_at)}/><Info label="ملاحظات إدارية" value={student.notes} multiline/></InfoCard>
    </div>
    <section className="future-section"><div className="section-heading"><div><h2>سجل الطالب</h2><p>أقسام ستُفعّل في مراحل التطوير القادمة</p></div></div><div className="future-grid"><Future icon={<CalendarCheck/>} title="الحضور والغياب"/><Future icon={<BookOpen/>} title="الحفظ والمراجعة"/><Future icon={<ClipboardList/>} title="الاختبارات الشهرية"/><Future icon={<ChartNoAxesCombined/>} title="التقارير والتقدم"/></div><p className="future-note"><AlertTriangle size={15}/> هذه الأقسام واجهات تمهيدية فقط، ولا تُسجل أو تعرض بيانات في هذه المرحلة.</p></section>
  </main>;
}

function InfoCard({title,icon,children}:{title:string;icon:React.ReactNode;children:React.ReactNode}){return <section className="panel info-card"><h2>{icon}{title}</h2><div>{children}</div></section>}
function Info({label,value,icon,multiline=false}:{label:string;value:string|null|undefined;icon?:React.ReactNode;multiline?:boolean}){return <div className={`info-row ${multiline?'multiline':''}`}><span>{label}</span><strong>{icon}{value||'غير مسجل'}</strong></div>}
function Future({icon,title}:{icon:React.ReactNode;title:string}){return <div className="future-card">{icon}<span>{title}</span><small>قريبًا</small></div>}
function formatDate(value?:string|null){if(!value)return 'غير محدد';const d=new Date(`${value.slice(0,10)}T00:00:00`);return new Intl.DateTimeFormat('ar-DZ',{day:'numeric',month:'long',year:'numeric'}).format(d);}
