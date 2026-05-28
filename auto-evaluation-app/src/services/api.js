import { supabase } from './supabaseClient';

// =============================================================================
// Mappers (snake_case in DB ↔ camelCase in app)
// =============================================================================
const mapCategory = (r) => r && {
  id: r.id, name: r.name, description: r.description, createdBy: r.created_by,
};
const mapCompetence = (r) => r && {
  id: r.id, name: r.name, description: r.description,
  controlPoints: r.control_points ?? [],
  categoryId: r.category_id, createdBy: r.created_by,
};
const mapFormulaire = (r) => r && {
  id: r.id, title: r.title, competences: r.competences ?? [], createdBy: r.created_by,
};
const mapClass = (r) => r && {
  id: r.id, name: r.name, year: r.year, teacherId: r.teacher_id, code: r.code,
  studentCount: r.students?.[0]?.count ?? r.studentCount ?? 0,
};
const mapStudent = (r) => r && {
  id: r.id, firstName: r.first_name, lastName: r.last_name,
  classId: r.class_id, userId: r.user_id,
};

const throwIf = (error, msg) => { if (error) throw new Error(error.message || msg); };

const currentUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

// =============================================================================
// CATEGORIES
// =============================================================================
export const fetchCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*');
  throwIf(error, 'Failed to fetch categories');
  return data.map(mapCategory);
};

export const saveCategory = async ({ name, description }) => {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, description, created_by: userId })
    .select()
    .single();
  throwIf(error, 'Failed to create category');
  return mapCategory(data);
};

export const updateCategory = async (id, { name, description }) => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name, description })
    .eq('id', id)
    .select()
    .single();
  throwIf(error, 'Failed to update category');
  return mapCategory(data);
};

export const deleteCategory = async (id) => {
  // Block deletion if the category still has competences (mirrors old backend rule)
  const { count, error: countErr } = await supabase
    .from('competences')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);
  throwIf(countErr, 'Failed to check category usage');
  if (count > 0) throw new Error('Cannot delete: category has competences');

  const { error } = await supabase.from('categories').delete().eq('id', id);
  throwIf(error, 'Failed to delete category');
  return { message: 'Category deleted' };
};

// =============================================================================
// COMPETENCES
// =============================================================================
export const fetchCompetences = async () => {
  const { data, error } = await supabase.from('competences').select('*');
  throwIf(error, 'Failed to fetch competences');
  return data.map(mapCompetence);
};

export const fetchCompetencesByCategory = async (categoryId) => {
  const { data, error } = await supabase
    .from('competences').select('*').eq('category_id', categoryId);
  throwIf(error, 'Failed to fetch competences for category');
  return data.map(mapCompetence);
};

export const saveCompetence = async ({ name, description, categoryId, controlPoints }) => {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('competences')
    .insert({
      name, description,
      category_id: categoryId,
      control_points: controlPoints ?? [],
      created_by: userId,
    })
    .select()
    .single();
  throwIf(error, 'Failed to create competence');
  return mapCompetence(data);
};

export const updateCompetence = async (id, { name, description, categoryId, controlPoints }) => {
  const { data, error } = await supabase
    .from('competences')
    .update({
      name, description,
      category_id: categoryId,
      ...(controlPoints !== undefined && { control_points: controlPoints }),
    })
    .eq('id', id)
    .select()
    .single();
  throwIf(error, 'Failed to update competence');
  return mapCompetence(data);
};

export const deleteCompetence = async (id) => {
  const { error } = await supabase.from('competences').delete().eq('id', id);
  throwIf(error, 'Failed to delete competence');
  return { message: 'Competence deleted' };
};

// =============================================================================
// FORMULAIRES
// =============================================================================
export const fetchFormulaires = async () => {
  const { data, error } = await supabase.from('formulaires').select('*');
  throwIf(error, 'Failed to fetch formulaires');
  return data.map(mapFormulaire);
};

export const saveFormulaire = async ({ title, competences }) => {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('formulaires')
    .insert({ title, competences: competences ?? [], created_by: userId })
    .select()
    .single();
  throwIf(error, 'Failed to create formulaire');
  return mapFormulaire(data);
};

export const updateFormulaire = async (id, { title, competences }) => {
  const { data, error } = await supabase
    .from('formulaires')
    .update({ title, competences: competences ?? [] })
    .eq('id', id)
    .select()
    .single();
  throwIf(error, 'Failed to update formulaire');
  return mapFormulaire(data);
};

export const deleteFormulaire = async (id) => {
  const { error } = await supabase.from('formulaires').delete().eq('id', id);
  throwIf(error, 'Failed to delete formulaire');
  return true;
};

// =============================================================================
// CLASSES
// =============================================================================
export const fetchClasses = async () => {
  // RLS handles the teacher-vs-student scoping. We embed students(count) so
  // teachers get a studentCount; students just see the classes they're in.
  const { data, error } = await supabase
    .from('classes')
    .select('*, students(count)');
  throwIf(error, 'Failed to fetch classes');
  return data.map(mapClass);
};

export const saveClass = async ({ name, year }) => {
  const { data, error } = await supabase.rpc('create_class', {
    p_name: name, p_year: year,
  });
  throwIf(error, 'Failed to create class');
  return mapClass(data);
};

export const updateClass = async (classId, { name, year }) => {
  const { data, error } = await supabase
    .from('classes')
    .update({ name, year })
    .eq('id', classId)
    .select()
    .single();
  throwIf(error, 'Failed to update class');
  return mapClass(data);
};

export const deleteClass = async (classId) => {
  const { error } = await supabase.from('classes').delete().eq('id', classId);
  throwIf(error, 'Failed to delete class');
};

export const getClassDetails = async (classId) => {
  const { data, error } = await supabase
    .from('classes').select('*, students(count)')
    .eq('id', classId).single();
  throwIf(error, 'Failed to fetch class');
  return mapClass(data);
};

export const addStudentsToClass = async (classId, students) => {
  const rows = students.map((s) => ({
    class_id: classId,
    first_name: s.firstName,
    last_name: s.lastName,
  }));
  const { error } = await supabase.from('students').insert(rows);
  throwIf(error, 'Failed to add students');
  // Return the class with the refreshed studentCount so the context can update.
  return getClassDetails(classId);
};

export const getStudentsByClass = async (classId) => {
  const { data, error } = await supabase
    .from('students').select('*').eq('class_id', classId)
    .order('last_name', { ascending: true });
  throwIf(error, 'Failed to fetch students');
  return data.map(mapStudent);
};

export const generateClassCode = async (classId) => {
  const { data, error } = await supabase.rpc('regenerate_class_code', {
    p_class_id: classId,
  });
  throwIf(error, 'Failed to regenerate code');
  return data; // the new code (text)
};

export const getStudentsByClassCode = async (classCode) => {
  // RLS prevents direct cross-class reads, so this is intentionally not
  // implemented here. Use searchStudentsInClass via the RPC instead.
  throw new Error('Use searchStudentsInClass(classCode, lastNamePrefix) instead');
};

export const searchStudentsInClass = async (classCode, lastNamePrefix) => {
  const { data, error } = await supabase.rpc('search_students_in_class', {
    p_class_code: classCode,
    p_last_name_prefix: lastNamePrefix,
  });
  throwIf(error, 'Failed to search students');
  // RPC returns rows with first_name / last_name, map to camelCase.
  return data.map((r) => ({ id: r.id, firstName: r.first_name, lastName: r.last_name }));
};

export const joinClass = async (classCode, firstName, lastName) => {
  const { data, error } = await supabase.rpc('join_class', {
    p_class_code: classCode,
    p_first_name: firstName,
    p_last_name: lastName,
  });
  throwIf(error, 'Failed to join class');
  return mapClass(data);
};

// =============================================================================
// FORM ASSIGNMENTS + SUBMISSIONS
// =============================================================================
export const sendFormToClass = async (classId, formId) => {
  const { data, error } = await supabase
    .from('form_assignments')
    .insert({ class_id: classId, form_id: formId })
    .select()
    .single();
  throwIf(error, 'Failed to send form to class');
  return data;
};

export const getPendingFormsForStudent = async (/* studentId — ignored, RLS uses auth.uid() */) => {
  // Pending = there is a form_assignment for a class I belong to, and I have
  // no submission for it yet. We compose two queries to keep it simple.
  const userId = await currentUserId();

  const { data: myStudentRows, error: studErr } = await supabase
    .from('students').select('id, class_id').eq('user_id', userId);
  throwIf(studErr, 'Failed to fetch own student rows');
  if (!myStudentRows.length) return [];

  const classIds  = myStudentRows.map((s) => s.class_id);
  const studentIds = myStudentRows.map((s) => s.id);

  const { data: assignments, error: aErr } = await supabase
    .from('form_assignments')
    .select('id, form_id, class_id, formulaire:formulaires(id, title, competences)')
    .in('class_id', classIds);
  throwIf(aErr, 'Failed to fetch assignments');
  if (!assignments.length) return [];

  const { data: submissions, error: sErr } = await supabase
    .from('submissions')
    .select('form_assignment_id, student_id')
    .in('student_id', studentIds);
  throwIf(sErr, 'Failed to fetch submissions');

  const submitted = new Set(submissions.map((s) => `${s.form_assignment_id}:${s.student_id}`));
  const studentByClass = Object.fromEntries(myStudentRows.map((s) => [s.class_id, s.id]));

  return assignments
    .filter((a) => !submitted.has(`${a.id}:${studentByClass[a.class_id]}`))
    .map((a) => ({
      id: a.id,              // form_assignment id (used by the student form route)
      formId: a.form_id,
      classId: a.class_id,
      studentId: studentByClass[a.class_id],
      title: a.formulaire?.title,
      competences: a.formulaire?.competences ?? [],
    }));
};

export const submitStudentForm = async (formAssignmentId, studentId, responses) => {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      form_assignment_id: formAssignmentId,
      student_id: studentId,
      responses,
    })
    .select()
    .single();
  throwIf(error, 'Failed to submit form');
  return data;
};

// Direct teacher override of a single competence rating — not implemented yet.
// Kept as a no-op so old callers don't crash; real grading flows through
// submissions.
export const updateStudentEvaluation = async () => {
  throw new Error('Direct evaluation updates not implemented in the Supabase migration yet');
};
