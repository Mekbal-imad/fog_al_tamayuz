-- المرحلة الثانية: استكمال بيانات ملفات الطلبة.
-- Migration آمنة وقابلة لإعادة التنفيذ، ولا تحذف أي بيانات أو سياسات RLS.

alter table public.students
  add column if not exists date_of_birth date,
  add column if not exists phone text,
  add column if not exists joined_at date;

-- تعبئة تاريخ الانضمام للسجلات القديمة اعتمادًا على created_at.
update public.students
set joined_at = coalesce(created_at::date, current_date)
where joined_at is null;

alter table public.students alter column joined_at set default current_date;
alter table public.students alter column joined_at set not null;

create index if not exists students_full_name_search_idx
  on public.students using gin (to_tsvector('simple', coalesce(full_name, '')));

create index if not exists students_status_idx on public.students(status);
create index if not exists students_joined_at_idx on public.students(joined_at desc);
