'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Save, LoaderCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EMPTY_STUDENT, Student, StudentStatus } from '../lib/student-types';

type FormState = typeof EMPTY_STUDENT;

export default function StudentForm({ student, mode }: { student?: Student; mode: 'create' | 'edit' }) {
  const router = useRouter();
  const initial: FormState = student ? {
    full_name: student.full_name || '', date_of_birth: student.date_of_birth || '', phone: student.phone || '',
    guardian_name: student.guardian_name || '', guardian_phone: student.guardian_phone || '',
    guardian_email: student.guardian_email || '', previous_hizb: String(student.previous_hizb ?? 0),
    previous_memorization_notes: student.previous_memorization_notes || '',
    memorization_start_point: student.memorization_start_point || '', revision_start_point: student.revision_start_point || '',
    notes: student.notes || '', joined_at: student.joined_at || student.created_at?.slice(0, 10) || EMPTY_STUDENT.joined_at,
    status: student.status,
  } : EMPTY_STUDENT;
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setError('إعدادات الاتصال بقاعدة البيانات غير مكتملة.'); return; }
    if (!form.full_name.trim()) { setError('يرجى إدخال الاسم الكامل.'); return; }
    const hizb = Number(form.previous_hizb);
    if (!Number.isFinite(hizb) || hizb < 0) { setError('عدد الأحزاب السابقة يجب أن يكون رقمًا موجبًا أو صفرًا.'); return; }
    if (form.guardian_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guardian_email)) {
      setError('صيغة البريد الإلكتروني للولي غير صحيحة.'); return;
    }
    setSaving(true); setError('');
    const payload = {
      full_name: form.full_name.trim(), date_of_birth: form.date_of_birth || null, phone: form.phone.trim() || null,
      guardian_name: form.guardian_name.trim() || null, guardian_phone: form.guardian_phone.trim() || null,
      guardian_email: form.guardian_email.trim() || null, previous_hizb: hizb,
      previous_memorization_notes: form.previous_memorization_notes.trim() || null,
      memorization_start_point: form.memorization_start_point.trim() || null,
      revision_start_point: form.revision_start_point.trim() || null, notes: form.notes.trim() || null,
      joined_at: form.joined_at, status: form.status as StudentStatus, updated_at: new Date().toISOString(),
    };
    const result = mode === 'create'
      ? await supabase.from('students').insert(payload).select('id').single()
      : await supabase.from('students').update(payload).eq('id', student!.id).select('id').single();
    setSaving(false);
    if (result.error) { setError(`تعذر حفظ البيانات: ${result.error.message}`); return; }
    router.push(mode === 'create' ? `/students/${result.data.id}` : `/students/${student!.id}`);
    router.refresh();
  }

  return <form className="student-form" onSubmit={submit}>
    <div className="form-section"><h3>المعلومات الشخصية</h3><div className="form-grid">
      <Field label="الاسم الكامل *"><input required value={form.full_name} onChange={e=>update('full_name',e.target.value)} placeholder="الاسم واللقب" /></Field>
      <Field label="تاريخ الميلاد"><input type="date" value={form.date_of_birth} onChange={e=>update('date_of_birth',e.target.value)} /></Field>
      <Field label="رقم هاتف الطالب"><input type="tel" value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder="اختياري" /></Field>
    </div></div>
    <div className="form-section"><h3>معلومات ولي الأمر</h3><div className="form-grid">
      <Field label="اسم الولي"><input value={form.guardian_name} onChange={e=>update('guardian_name',e.target.value)} /></Field>
      <Field label="رقم هاتف الولي"><input type="tel" value={form.guardian_phone} onChange={e=>update('guardian_phone',e.target.value)} /></Field>
      <Field label="البريد الإلكتروني للولي"><input type="email" value={form.guardian_email} onChange={e=>update('guardian_email',e.target.value)} /></Field>
    </div></div>
    <div className="form-section"><h3>المعلومات التعليمية</h3><div className="form-grid">
      <Field label="المحفوظ السابق (بالأحزاب)"><input type="number" min="0" step="0.25" value={form.previous_hizb} onChange={e=>update('previous_hizb',e.target.value)} /></Field>
      <Field label="نقطة بداية الحفظ الجديد"><input value={form.memorization_start_point} onChange={e=>update('memorization_start_point',e.target.value)} placeholder="مثال: سورة النبأ، الآية 1" /></Field>
      <Field label="نقطة بداية المراجعة"><input value={form.revision_start_point} onChange={e=>update('revision_start_point',e.target.value)} placeholder="مثال: سورة الناس" /></Field>
      <Field label="ملاحظات حول الحفظ السابق" wide><textarea rows={3} value={form.previous_memorization_notes} onChange={e=>update('previous_memorization_notes',e.target.value)} /></Field>
    </div></div>
    <div className="form-section"><h3>المعلومات الإدارية</h3><div className="form-grid">
      <Field label="تاريخ الانضمام"><input type="date" value={form.joined_at} onChange={e=>update('joined_at',e.target.value)} /></Field>
      <Field label="حالة الطالب"><select value={form.status} onChange={e=>update('status',e.target.value as StudentStatus)}><option value="active">نشط</option><option value="pending">قيد الانتظار</option><option value="inactive">غير نشط</option></select></Field>
      <Field label="ملاحظات إدارية" wide><textarea rows={3} value={form.notes} onChange={e=>update('notes',e.target.value)} /></Field>
    </div></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button type="button" className="secondary-button" onClick={()=>router.back()}><ArrowRight size={16}/> رجوع</button><button className="primary-button form-submit" disabled={saving}>{saving?<LoaderCircle className="spin" size={16}/>:<Save size={16}/>} {saving?'جارٍ الحفظ...':mode==='create'?'حفظ الطالب':'حفظ التعديلات'}</button></div>
  </form>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`form-field ${wide ? 'wide' : ''}`}><span>{label}</span>{children}</label>;
}
