-- =============================================================================
-- Suivi des acquis — initial schema + RLS + RPC
-- Apply once in Supabase → SQL Editor → New query → Run.
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- 1. Enums
-- =============================================================================
create type user_role as enum ('teacher', 'student');

-- =============================================================================
-- 2. profiles  (mirrors auth.users, adds name + role)
-- =============================================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  role        user_role not null,
  created_at  timestamptz default now()
);

-- Auto-create a profile row when a user signs up.
-- The frontend must pass { name, role } in `options.data` of supabase.auth.signUp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used in RLS policies
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- =============================================================================
-- 3. Domain tables
-- =============================================================================
create table classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  year        text not null,
  teacher_id  uuid not null references profiles(id) on delete cascade,
  code        text not null unique,
  created_at  timestamptz default now()
);

create table students (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  class_id    uuid not null references classes(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  created_at  timestamptz default now()
);
create index students_class_id_idx on students(class_id);
create index students_user_id_idx  on students(user_id);

create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table competences (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  control_points  jsonb not null default '[]'::jsonb,
  category_id     uuid not null references categories(id) on delete cascade,
  created_by      uuid not null references profiles(id) on delete cascade,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index competences_category_id_idx on competences(category_id);

create table formulaires (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  competences  jsonb not null default '[]'::jsonb,
  created_by   uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- New tables to close the form-delivery gap left in the Express version
create table form_assignments (
  id        uuid primary key default gen_random_uuid(),
  form_id   uuid not null references formulaires(id) on delete cascade,
  class_id  uuid not null references classes(id) on delete cascade,
  sent_at   timestamptz default now(),
  unique (form_id, class_id)
);

create table submissions (
  id                  uuid primary key default gen_random_uuid(),
  form_assignment_id  uuid not null references form_assignments(id) on delete cascade,
  student_id          uuid not null references students(id) on delete cascade,
  responses           jsonb not null default '{}'::jsonb,
  submitted_at        timestamptz default now(),
  unique (form_assignment_id, student_id)
);

-- =============================================================================
-- 4. Row Level Security
-- =============================================================================
alter table profiles         enable row level security;
alter table classes          enable row level security;
alter table students         enable row level security;
alter table categories       enable row level security;
alter table competences      enable row level security;
alter table formulaires      enable row level security;
alter table form_assignments enable row level security;
alter table submissions      enable row level security;

-- profiles ---------------------------------------------------------------
create policy "read own profile"   on profiles for select using (id = auth.uid());
create policy "update own profile" on profiles for update using (id = auth.uid());

-- classes ----------------------------------------------------------------
create policy "teacher reads own classes" on classes
  for select using (teacher_id = auth.uid());

create policy "student reads joined classes" on classes
  for select using (
    exists (select 1 from students s
            where s.class_id = classes.id and s.user_id = auth.uid())
  );

create policy "teacher inserts classes" on classes
  for insert with check (teacher_id = auth.uid() and is_teacher());

create policy "teacher updates own classes" on classes
  for update using (teacher_id = auth.uid());

create policy "teacher deletes own classes" on classes
  for delete using (teacher_id = auth.uid());

-- students ---------------------------------------------------------------
create policy "teacher reads class students" on students
  for select using (
    exists (select 1 from classes c
            where c.id = students.class_id and c.teacher_id = auth.uid())
  );

create policy "student reads own record" on students
  for select using (user_id = auth.uid());

create policy "teacher inserts students" on students
  for insert with check (
    exists (select 1 from classes c
            where c.id = class_id and c.teacher_id = auth.uid())
  );

create policy "teacher updates students" on students
  for update using (
    exists (select 1 from classes c
            where c.id = students.class_id and c.teacher_id = auth.uid())
  );

create policy "teacher deletes students" on students
  for delete using (
    exists (select 1 from classes c
            where c.id = students.class_id and c.teacher_id = auth.uid())
  );

-- categories  (shared read, creator owns writes) -------------------------
create policy "anyone reads categories" on categories
  for select to authenticated using (true);

create policy "teacher inserts categories" on categories
  for insert with check (created_by = auth.uid() and is_teacher());

create policy "creator updates categories" on categories
  for update using (created_by = auth.uid());

create policy "creator deletes categories" on categories
  for delete using (created_by = auth.uid());

-- competences  (same shape as categories) --------------------------------
create policy "anyone reads competences" on competences
  for select to authenticated using (true);

create policy "teacher inserts competences" on competences
  for insert with check (created_by = auth.uid() and is_teacher());

create policy "creator updates competences" on competences
  for update using (created_by = auth.uid());

create policy "creator deletes competences" on competences
  for delete using (created_by = auth.uid());

-- formulaires ------------------------------------------------------------
create policy "creator reads formulaires" on formulaires
  for select using (created_by = auth.uid());

create policy "student reads assigned formulaires" on formulaires
  for select using (
    exists (
      select 1 from form_assignments fa
      join students s on s.class_id = fa.class_id
      where fa.form_id = formulaires.id and s.user_id = auth.uid()
    )
  );

create policy "teacher inserts formulaires" on formulaires
  for insert with check (created_by = auth.uid() and is_teacher());

create policy "creator updates formulaires" on formulaires
  for update using (created_by = auth.uid());

create policy "creator deletes formulaires" on formulaires
  for delete using (created_by = auth.uid());

-- form_assignments -------------------------------------------------------
create policy "teacher reads own assignments" on form_assignments
  for select using (
    exists (select 1 from formulaires f
            where f.id = form_assignments.form_id and f.created_by = auth.uid())
  );

create policy "student reads own assignments" on form_assignments
  for select using (
    exists (select 1 from students s
            where s.class_id = form_assignments.class_id and s.user_id = auth.uid())
  );

create policy "teacher inserts assignments" on form_assignments
  for insert with check (
    exists (select 1 from formulaires f
            where f.id = form_id and f.created_by = auth.uid())
    and exists (select 1 from classes c
                where c.id = class_id and c.teacher_id = auth.uid())
  );

create policy "teacher deletes assignments" on form_assignments
  for delete using (
    exists (select 1 from formulaires f
            where f.id = form_assignments.form_id and f.created_by = auth.uid())
  );

-- submissions ------------------------------------------------------------
create policy "teacher reads submissions" on submissions
  for select using (
    exists (
      select 1 from form_assignments fa
      join formulaires f on f.id = fa.form_id
      where fa.id = submissions.form_assignment_id and f.created_by = auth.uid()
    )
  );

create policy "student reads own submissions" on submissions
  for select using (
    exists (select 1 from students s
            where s.id = submissions.student_id and s.user_id = auth.uid())
  );

create policy "student inserts own submissions" on submissions
  for insert with check (
    exists (select 1 from students s
            where s.id = student_id and s.user_id = auth.uid())
  );

create policy "student updates own submissions" on submissions
  for update using (
    exists (select 1 from students s
            where s.id = submissions.student_id and s.user_id = auth.uid())
  );

-- =============================================================================
-- 5. RPC — the non-CRUD bits, called from the frontend via supabase.rpc(...)
-- =============================================================================

create or replace function public.generate_class_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists boolean;
begin
  -- N'utilise que des built-ins (pas pgcrypto) : sur les projets Supabase
  -- récents, pgcrypto vit dans le schéma `extensions` et n'est pas dans le
  -- search_path par défaut des fonctions SECURITY DEFINER.
  loop
    v_code := upper(
      substring(
        md5(random()::text || clock_timestamp()::text)
        for 6
      )
    );
    select exists(select 1 from classes where code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

create or replace function public.create_class(p_name text, p_year text)
returns classes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class classes;
begin
  if not is_teacher() then
    raise exception 'Only teachers can create classes';
  end if;
  insert into classes (name, year, teacher_id, code)
  values (p_name, p_year, auth.uid(), generate_class_code())
  returning * into v_class;
  return v_class;
end;
$$;

create or replace function public.regenerate_class_code(p_class_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not exists (
    select 1 from classes where id = p_class_id and teacher_id = auth.uid()
  ) then
    raise exception 'Class not found or not owned';
  end if;
  v_code := generate_class_code();
  update classes set code = v_code where id = p_class_id;
  return v_code;
end;
$$;

-- Used by a logged-in student to look up their pre-loaded row in a class
create or replace function public.search_students_in_class(
  p_class_code        text,
  p_last_name_prefix  text
)
returns table (id uuid, first_name text, last_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(p_last_name_prefix) < 3 then
    raise exception 'last name prefix must be at least 3 characters';
  end if;
  return query
    select s.id, s.first_name, s.last_name
    from students s
    join classes c on c.id = s.class_id
    where c.code = p_class_code
      and s.user_id is null
      and s.last_name ilike p_last_name_prefix || '%';
end;
$$;

-- Link the logged-in user to a pre-loaded student row
create or replace function public.join_class(
  p_class_code  text,
  p_first_name  text,
  p_last_name   text
)
returns classes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class    classes;
  v_student  students;
begin
  select * into v_class from classes where code = p_class_code;
  if not found then raise exception 'Invalid class code'; end if;

  select * into v_student
  from students
  where class_id = v_class.id
    and first_name = p_first_name
    and last_name  = p_last_name
    and user_id is null
  limit 1;

  if not found then raise exception 'Student not found or already claimed'; end if;

  update students set user_id = auth.uid() where id = v_student.id;
  return v_class;
end;
$$;
