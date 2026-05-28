-- =============================================================================
-- Fix infinite recursion in RLS policies.
--
-- Symptom: "infinite recursion detected in policy for relation X"
-- Cause:   classes policies query students, and students policies query
--          classes (same with formulaires ↔ form_assignments).
-- Fix:     wrap the cross-table lookups in SECURITY DEFINER functions, which
--          bypass RLS for the inner query and break the cycle.
-- =============================================================================

-- 1. Helper functions ---------------------------------------------------------

create or replace function public.is_class_teacher(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from classes
    where id = p_class_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.is_student_in_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from students
    where class_id = p_class_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_form_creator(p_form_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from formulaires
    where id = p_form_id and created_by = auth.uid()
  );
$$;

-- 2. Replace the recursive policies ------------------------------------------

-- classes
drop policy if exists "student reads joined classes" on classes;
create policy "student reads joined classes" on classes
  for select using (is_student_in_class(id));

-- students
drop policy if exists "teacher reads class students" on students;
create policy "teacher reads class students" on students
  for select using (is_class_teacher(class_id));

drop policy if exists "teacher inserts students" on students;
create policy "teacher inserts students" on students
  for insert with check (is_class_teacher(class_id));

drop policy if exists "teacher updates students" on students;
create policy "teacher updates students" on students
  for update using (is_class_teacher(class_id));

drop policy if exists "teacher deletes students" on students;
create policy "teacher deletes students" on students
  for delete using (is_class_teacher(class_id));

-- form_assignments
drop policy if exists "teacher reads own assignments" on form_assignments;
create policy "teacher reads own assignments" on form_assignments
  for select using (is_form_creator(form_id));

drop policy if exists "student reads own assignments" on form_assignments;
create policy "student reads own assignments" on form_assignments
  for select using (is_student_in_class(class_id));

drop policy if exists "teacher inserts assignments" on form_assignments;
create policy "teacher inserts assignments" on form_assignments
  for insert with check (
    is_form_creator(form_id) and is_class_teacher(class_id)
  );

drop policy if exists "teacher deletes assignments" on form_assignments;
create policy "teacher deletes assignments" on form_assignments
  for delete using (is_form_creator(form_id));

-- formulaires
drop policy if exists "student reads assigned formulaires" on formulaires;
create policy "student reads assigned formulaires" on formulaires
  for select using (
    exists (
      select 1 from form_assignments fa
      where fa.form_id = formulaires.id
        and is_student_in_class(fa.class_id)
    )
  );

-- submissions
drop policy if exists "teacher reads submissions" on submissions;
create policy "teacher reads submissions" on submissions
  for select using (
    exists (
      select 1 from form_assignments fa
      where fa.id = submissions.form_assignment_id
        and is_form_creator(fa.form_id)
    )
  );
