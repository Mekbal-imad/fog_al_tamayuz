'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import StudentForm from '../../../../components/StudentForm';
import { supabase } from '../../../../lib/supabase';
import { Student } from '../../../../lib/student-types';

export default function EditStudentPage(){
  const params=useParams<{id:string}>();const router=useRouter();const [student,setStudent]=useState<Student|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const load=useCallback(async()=>{if(!supabase){setError('إعدادات Supabase غير مكتملة.');setLoading(false);return;}const {data:auth}=await supabase.auth.getUser();if(!auth.user){router.replace('/');return;}const {data,error:err}=await supabase.from('students').select('*').eq('id',params.id).single();if(err)setError(err.message);else setStudent(data as Student);setLoading(false);},[params.id,router]);
  useEffect(()=>{void load();},[load]);
  return <main className="management-page"><div className="page-breadcrumb"><Link href="/">لوحة التحكم</Link><ArrowRight size={14}/><Link href="/students">إدارة الطلبة</Link><ArrowRight size={14}/><span>تعديل البيانات</span></div><div className="page-heading"><div><p className="eyebrow">تحديث الملف</p><h1>تعديل بيانات الطالب</h1><p className="muted">{student?.full_name||'تحديث المعلومات المسجلة'}</p></div></div>{loading?<div className="loading-state">جارٍ تحميل بيانات الطالب...</div>:error?<p className="form-error">تعذر تحميل الطالب: {error}</p>:student?<section className="panel form-panel"><StudentForm mode="edit" student={student}/></section>:null}</main>;
}
