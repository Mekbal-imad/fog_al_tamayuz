-- منصة فوج التميز | Supabase PostgreSQL
-- نفّذ هذا الملف في SQL Editor داخل مشروع Supabase.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'supervisor' check (role in ('supervisor','admin','guardian')),
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  status text not null default 'active' check (status in ('active','inactive','pending')),
  previous_hizb numeric(5,2) default 0,
  previous_memorization_notes text,
  memorization_start_point text,
  revision_start_point text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  session_type text not null check (session_type in ('revision','memorization','exam','other')),
  title text,
  assigned_eighths numeric(4,1) not null default 2,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('present','absent_excused','absent_unexcused','late')),
  excuse text,
  makeup_due boolean not null default false,
  makeup_completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique(session_id, student_id)
);

create table if not exists public.recitations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  type text not null check (type in ('revision','memorization')),
  portion text not null,
  assigned_eighths numeric(4,1) not null default 2,
  completed_eighths numeric(4,1) not null default 0,
  quality_score numeric(4,2) not null default 0 check (quality_score between 0 and 10),
  tajweed_score numeric(4,2) not null default 0 check (tajweed_score between 0 and 10),
  total_score numeric(5,2) generated always as (quality_score + tajweed_score) stored,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_tests (
  id uuid primary key default gen_random_uuid(),
  test_date date not null,
  hizb_label text not null,
  title text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_test_scores (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.monthly_tests(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  eighth_1 numeric(3,2) not null default 0 check (eighth_1 between 0 and 2.5),
  eighth_2 numeric(3,2) not null default 0 check (eighth_2 between 0 and 2.5),
  eighth_3 numeric(3,2) not null default 0 check (eighth_3 between 0 and 2.5),
  eighth_4 numeric(3,2) not null default 0 check (eighth_4 between 0 and 2.5),
  eighth_5 numeric(3,2) not null default 0 check (eighth_5 between 0 and 2.5),
  eighth_6 numeric(3,2) not null default 0 check (eighth_6 between 0 and 2.5),
  eighth_7 numeric(3,2) not null default 0 check (eighth_7 between 0 and 2.5),
  eighth_8 numeric(3,2) not null default 0 check (eighth_8 between 0 and 2.5),
  total_score numeric(4,2) generated always as (
    eighth_1+eighth_2+eighth_3+eighth_4+eighth_5+eighth_6+eighth_7+eighth_8
  ) stored,
  notes text,
  created_at timestamptz not null default now(),
  unique(test_id, student_id)
);

create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  project_name text not null default 'منصة فوج التميز',
  launch_date date,
  revision_day text not null default 'الثلاثاء',
  memorization_day text not null default 'الخميس',
  weekly_revision_eighths numeric(3,1) not null default 2,
  weekly_memorization_eighths numeric(3,1) not null default 2,
  monthly_test_pass_mark numeric(4,2) default 10,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, launch_date)
values (1, '2026-12-10')
on conflict (id) do nothing;

-- أعضاء الفوج الأوليون
insert into public.students (full_name, status) values
('عبد الرحيم جودي','active'),
('أيوب سنّاج','active'),
('أدم خادر','active'),
('عبد الله ڤاتار','active'),
('نزيم بوخمال','active')
on conflict do nothing;

-- تفعيل RLS على الجداول الحساسة
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.recitations enable row level security;
alter table public.monthly_tests enable row level security;
alter table public.monthly_test_scores enable row level security;
alter table public.app_settings enable row level security;

-- دالة التحقق من صلاحية المشرف أو المدير
create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('supervisor','admin')
  );
$$;

-- سياسات الوصول: لا يستطيع قراءة البيانات أو تعديلها إلا المستخدم المسجل كعضو فريق.
create policy "staff reads profiles" on public.profiles for select to authenticated using (public.is_staff() or id = auth.uid());
create policy "staff manages students" on public.students for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manages sessions" on public.sessions for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manages attendance" on public.attendance for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manages recitations" on public.recitations for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manages tests" on public.monthly_tests for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manages test scores" on public.monthly_test_scores for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manages settings" on public.app_settings for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- بعد إنشاء حساب المشرف في Authentication > Users، أضف ملفه الشخصي:
-- insert into public.profiles (id, full_name, role)
-- values ('AUTH_USER_UUID_HERE', 'اسم المشرف', 'supervisor');
