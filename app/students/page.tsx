'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Search, Users, UserRound, Eye, Pencil, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Student, StudentStatus, STATUS_LABELS } from '../../lib/student-types';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | StudentStatus>('all');

  const load = useCallback(async () => {
    if (!supabase) { setError('إعدادات Supabase غير مكتملة.'); setLoading(false); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace('/'); return; }
    const { data, error: queryError } = await supabase.from('students').select('*').order('joined_at', { ascending: false }).order('full_name');
    if (queryError) setError(`تعذر تحميل الطلبة: ${queryError.message}`);
    else { setStudents((data || []) as Student[]); setError(''); }
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => students.filter(s =>
    s.full_name.toLocaleLowerCase('ar').includes(search.trim().toLocaleLowerCase('ar')) &&
    (status === 'all' || s.status === status)
  ), [students, search, status]);

  return <main className="management-page">
    <div className="page-breadcrumb"><Link href="/">لوحة التحكم</Link><ArrowRight size={14}/><span>إدارة الطلبة</span></div>
    <div className="page-heading"><div><p className="eyebrow">إدارة بيانات الفوج</p><h1>إدارة الطلبة</h1><p className="muted">قائمة الطلبة وملفاتهم الشخصية ومعلوماتهم الأساسية.</p></div><Link className="primary-link compact-link" href="/students/new"><Plus size={17}/> إضافة طالب</Link></div>
    <div className="student-summary"><div className="summary-icon"><Users size={22}/></div><div><strong>{students.length}</strong><span>إجمالي الطلبة</span></div><div className="summary-divider"/><div><strong>{students.filter(s=>s.status==='active').length}</strong><span>نشطون</span></div><div><strong>{students.filter(s=>s.status==='pending').length}</strong><span>قيد الانتظار</span></div></div>
    <section className="panel list-panel">
      <div className="list-toolbar"><div className="search-box"><Search size={17}/><input aria-label="البحث عن طالب" placeholder="ابحث باسم الطالب..." value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="تصفية حسب الحالة" value={status} onChange={e=>setStatus(e.target.value as 'all'|StudentStatus)}><option value="all">كل الحالات</option><option value="active">نشط</option><option value="pending">قيد الانتظار</option><option value="inactive">غير نشط</option></select><button className="icon-button refresh-button" onClick={()=>{setLoading(true);void load();}} title="تحديث القائمة"><RefreshCw size={17}/></button></div>
      {error && <p className="form-error">{error}</p>}
      {loading ? <div className="loading-state">جارٍ تحميل قائمة الطلبة...</div> : filtered.length ? <div className="table-wrap"><table className="students-table"><thead><tr><th>الطالب</th><th>نقطة بداية الحفظ</th><th>تاريخ الانضمام</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{filtered.map(student=><tr key={student.id}><td><div className="student-name-cell"><span className="student-avatar"><UserRound size={17}/></span><b>{student.full_name}</b></div></td><td>{student.memorization_start_point || 'غير محددة'}</td><td>{formatDate(student.joined_at || student.created_at)}</td><td><span className={`status-pill status-${student.status}`}>{STATUS_LABELS[student.status]}</span></td><td><div className="row-actions"><Link href={`/students/${student.id}`} title="الملف الشخصي"><Eye size={17}/></Link><Link href={`/students/${student.id}/edit`} title="تعديل البيانات"><Pencil size={16}/></Link></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><Users size={30}/><b>{students.length?'لا توجد نتائج مطابقة':'لا يوجد طلبة مسجلون'}</b><span>{students.length?'جرّب تغيير عبارة البحث أو عامل التصفية.':'ابدأ بإضافة أول طالب إلى الفوج.'}</span>{!students.length&&<Link href="/students/new" className="secondary-button">إضافة طالب</Link>}</div>}
      <div className="list-footer">عرض {filtered.length} من أصل {students.length} طالب</div>
    </section>
  </main>;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(`${value.slice(0,10)}T00:00:00`);
  return new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
