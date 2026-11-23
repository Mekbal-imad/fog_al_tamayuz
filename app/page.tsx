"use client";

import { useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  BookOpen, CalendarCheck, ChartNoAxesCombined, ClipboardList, GraduationCap,
  LayoutDashboard, LogOut, MessageCircle, Settings, Users, Menu, Search,
  Bell, ChevronLeft, CheckCircle2, Clock3, AlertCircle
} from "lucide-react";

type Student = {
  id: string; full_name: string; status: string;
  previous_hizb: number | null; guardian_name: string | null;
};
type Attendance = { id: string; status: string; session_date: string };
type Recitation = { id: string; type: string; total_score: number | null; session_date: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const nav = [
  { label: "لوحة التحكم", icon: LayoutDashboard, active: true },
  { label: "التلاميذ", icon: Users },
  { label: "الحفظ والمراجعة", icon: BookOpen },
  { label: "الحضور", icon: CalendarCheck },
  { label: "الاختبارات", icon: ClipboardList },
  { label: "التقارير", icon: ChartNoAxesCombined },
  { label: "الأولياء", icon: MessageCircle },
  { label: "الإعدادات", icon: Settings },
];

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [recitations, setRecitations] = useState<Recitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState("لوحة التحكم");
  const [mobileMenu, setMobileMenu] = useState(false);

  async function loadData() {
    if (!supabase) { setLoading(false); return; }
    setConfigured(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setLoading(false); return; }
    setUserEmail(auth.user.email || "");
    const [s, a, r] = await Promise.all([
      supabase.from("students").select("id,full_name,status,previous_hizb,guardian_name").order("created_at"),
      supabase.from("attendance").select("id,status,session_date").order("session_date", { ascending: false }).limit(20),
      supabase.from("recitations").select("id,type,total_score,session_date").order("session_date", { ascending: false }).limit(20)
    ]);
    if (s.data) setStudents(s.data as Student[]);
    if (a.data) setAttendance(a.data as Attendance[]);
    if (r.data) setRecitations(r.data as Recitation[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(() => loadData());
      return () => data.subscription.unsubscribe();
    }
  }, []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true); setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.");
    else await loadData();
    setBusy(false);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUserEmail(""); setStudents([]); setAttendance([]); setRecitations([]);
  }

  if (!supabase) {
    return <main className="setup-screen"><div className="setup-card">
      <div className="brand-mark"><BookOpen size={28}/></div>
      <p className="eyebrow">منصة الإدارة التربوية</p>
      <h1>منصة فوج التميز</h1>
      <p className="muted">الواجهة جاهزة. لإكمال الربط، أنشئ مشروع Supabase ثم أضف بيانات الاتصال في ملف <b>.env.local</b>.</p>
      <div className="setup-steps"><span>1</span> أنشئ مشروعًا في Supabase <span>2</span> نفّذ ملف database/schema.sql <span>3</span> انسخ مفاتيح المشروع إلى .env.local</div>
      <a className="primary-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">فتح Supabase <ChevronLeft size={16}/></a>
    </div></main>;
  }

  if (!userEmail) {
    return <main className="login-screen"><form className="login-card" onSubmit={signIn}>
      <div className="brand-mark"><BookOpen size={28}/></div>
      <p className="eyebrow">منصة الإدارة التربوية</p><h1>مرحبًا بعودتك</h1>
      <p className="muted">سجّل الدخول لإدارة فوج التميز.</p>
      <label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@example.com"/></label>
      <label>كلمة المرور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/></label>
      {loginError && <p className="error">{loginError}</p>}
      <button className="primary-button" disabled={busy}>{busy ? "جارٍ الدخول..." : "تسجيل الدخول"}</button>
      <small className="muted">يتم إنشاء حساب المشرف من لوحة Supabase، ولا يوجد تسجيل عام مفتوح.</small>
    </form></main>;
  }

  const present = attendance.filter(x => x.status === "present").length;
  const avg = recitations.length ? (recitations.reduce((n,x)=>n+(x.total_score || 0),0)/recitations.length).toFixed(1) : "—";

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "show" : ""}`}>
      <div className="brand"><div className="brand-mark"><BookOpen size={23}/></div><div><b>فوج التميز</b><small>منصة المتابعة التربوية</small></div></div>
      <div className="side-label">القائمة الرئيسية</div>
      <nav>{nav.map(item=><button key={item.label} onClick={()=>{setSection(item.label);setMobileMenu(false)}} className={`nav-item ${section===item.label?"selected":""}`}><item.icon size={18}/><span>{item.label}</span>{section===item.label&&<i/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="admin-avatar">م</div><div className="admin-info"><b>المشرف</b><small>{userEmail}</small></div><button className="icon-button" onClick={signOut} title="تسجيل الخروج"><LogOut size={17}/></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-toggle icon-button" onClick={()=>setMobileMenu(!mobileMenu)}><Menu/></button><div><p className="eyebrow">إدارة فوج التميز</p><h2>{section}</h2></div><div className="top-actions"><button className="icon-button"><Search size={18}/></button><button className="icon-button"><Bell size={18}/></button><span className="date-chip">الثلاثاء · الخميس</span></div></header>
      {section==="لوحة التحكم" ? <div className="content">
        <section className="welcome-panel"><div><span className="welcome-tag">العام الدراسي · البرنامج السنوي</span><h1>أهلًا بك في منصة فوج التميز</h1><p>تابع الحفظ والمراجعة والحضور، واطّلع على تقدم التلاميذ من مكان واحد.</p></div><div className="welcome-art"><GraduationCap size={68}/></div></section>
        <div className="stats-grid">
          <Stat icon={<Users/>} label="التلاميذ النشطون" value={String(students.length).padStart(2,"0")} note="في الفوج الحالي"/>
          <Stat icon={<CalendarCheck/>} label="عمليات الحضور المسجلة" value={String(attendance.length).padStart(2,"0")} note={`${present} حالة حضور مسجلة`}/>
          <Stat icon={<BookOpen/>} label="تقييمات الحفظ والمراجعة" value={String(recitations.length).padStart(2,"0")} note="آخر السجلات"/>
          <Stat icon={<ChartNoAxesCombined/>} label="متوسط العلامات المسجلة" value={avg} note="من 20 حسب السجلات"/>
        </div>
        <div className="section-heading"><div><h3>التلاميذ</h3><p>نظرة سريعة على أعضاء الفوج</p></div><button className="secondary-button" onClick={()=>setSection("التلاميذ")}>عرض الجميع <ChevronLeft size={16}/></button></div>
        <div className="panel student-panel"><div className="table-wrap"><table><thead><tr><th>التلميذ</th><th>المحفوظ السابق</th><th>ولي الأمر</th><th>الحالة</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={4}>جارٍ تحميل البيانات...</td></tr> : students.length ? students.map(s=><tr key={s.id}><td><b>{s.full_name}</b></td><td>{s.previous_hizb ?? "—"} أحزاب</td><td>{s.guardian_name || "غير مسجل"}</td><td><span className="status-pill"><i/> {s.status==="active"?"نشط":"غير نشط"}</span></td></tr>) : <tr><td colSpan={4}>لا توجد بيانات بعد. تحقق من تنفيذ ملف قاعدة البيانات.</td></tr>}
        </tbody></table></div></div>
        <div className="bottom-grid"><div className="panel"><div className="panel-title"><div><h3>آخر التقييمات</h3><p>الحفظ والمراجعة</p></div><ClipboardList size={19}/></div>{recitations.slice(0,5).map(r=><div className="activity-row" key={r.id}><div className="activity-icon"><BookOpen size={16}/></div><div><b>{r.type==="memorization"?"حفظ جديد":"مراجعة"}</b><small>{r.session_date}</small></div><strong>{r.total_score ?? "—"}/20</strong></div>)}{!recitations.length&&<p className="empty-note">ستظهر التقييمات هنا بعد تسجيل أول حصة.</p>}</div>
        <div className="panel"><div className="panel-title"><div><h3>مواعيد الفوج</h3><p>البرنامج الأسبوعي</p></div><Clock3 size={19}/></div><div className="schedule-row"><span className="day-badge">الثلاثاء</span><div><b>حصة المراجعة</b><small>ثُمنان من المحفوظ السابق</small></div></div><div className="schedule-row"><span className="day-badge gold">الخميس</span><div><b>حصة الحفظ الجديد</b><small>ثُمنان من المحفوظ الجديد</small></div></div><div className="notice"><AlertCircle size={16}/> يمكن تعديل المواعيد من إعدادات المشروع في النسخ اللاحقة.</div></div></div>
      </div> : <div className="content"><div className="placeholder-panel"><div className="placeholder-icon"><Settings size={30}/></div><h3>{section}</h3><p>هذا القسم ضمن خطة التطوير. النسخة الأولى تجهز البنية الأساسية ولوحة التحكم وقاعدة البيانات.</p><button className="secondary-button" onClick={()=>setSection("لوحة التحكم")}>العودة إلى لوحة التحكم</button></div></div>}
      <footer>منصة فوج التميز <span>·</span> نظام متابعة الحفظ والمراجعة</footer>
    </main>
  </div>;
}

function Stat({icon,label,value,note}:{icon:React.ReactNode;label:string;value:string;note:string}) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><div>{icon}</div></div><strong>{value}</strong><small>{note}</small></div>;
}
