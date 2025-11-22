create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attendance_date date not null,
  scheduled_start time not null,
  scheduled_end time not null,
  check_in timestamptz,
  check_out timestamptz,
  status text not null default 'pendiente',
  minutes_late integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists attendance_records_attendance_date_idx on attendance_records(attendance_date);
create index if not exists attendance_records_user_id_idx on attendance_records(user_id);

alter table attendance_records enable row level security;

create policy "Attendance admin full access" on attendance_records
for all to authenticated
using (
  public.has_role(auth.uid(), 'superadmin')
  or public.has_role(auth.uid(), 'admin_rrhh')
)
with check (
  public.has_role(auth.uid(), 'superadmin')
  or public.has_role(auth.uid(), 'admin_rrhh')
);

create policy "Users view own attendance" on attendance_records
for select to authenticated
using (auth.uid() = user_id);

create policy "Users update own attendance" on attendance_records
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users insert own attendance" on attendance_records
for insert to authenticated
with check (auth.uid() = user_id);

create or replace function attendance_records_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger attendance_records_set_timestamp
before update on attendance_records
for each row execute function attendance_records_set_timestamp();

insert into attendance_records (user_id, attendance_date, scheduled_start, scheduled_end, check_in, check_out, status, minutes_late, notes)
select user_id,
       current_date,
       time '09:00',
       time '18:00',
       timezone('utc', (current_date::timestamp + time '09:05')),
       timezone('utc', (current_date::timestamp + time '18:10')),
       'puntual',
       5,
       'Registro inicial automático'
from profiles
order by created_at nulls last
limit 2;

insert into attendance_records (user_id, attendance_date, scheduled_start, scheduled_end, check_in, check_out, status, minutes_late, notes)
select user_id,
       current_date,
       time '09:00',
       time '18:00',
       timezone('utc', (current_date::timestamp + time '09:20')),
       null,
       'tarde',
       20,
       'Entrada tardía sin registro de salida'
from profiles
order by created_at nulls last
offset 2 limit 1;
