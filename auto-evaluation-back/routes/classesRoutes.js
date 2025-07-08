// backend/routes/classesRoutes.js
const express = require('express');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize')
const crypto  = require('crypto');
const router  = express.Router();
const authenticateToken = require('../middleware/auth');
const isTeacher       = require('../middleware/isTeacher');
const Class   = require('../models/Class');
const Student = require('../models/Student');

// helper: unique code
async function generateClassCode() {
  let code, exists;
  do {
    code   = crypto.randomBytes(3).toString('hex').toUpperCase();
    exists = await Class.findOne({ where: { code } });
  } while (exists);
  return code;
}

// POST /api/classes
router.post('/', authenticateToken, isTeacher, async (req, res) => {
  try {
    const { name, year } = req.body;
    const code = await generateClassCode();
    const cls = await Class.create({
      name,
      year,
      teacherId: req.user.id,
      code
    });
    res.status(201).json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/classes/:classId
router.delete('/:classId', authenticateToken, isTeacher, async (req, res) => {
  try {
    const cls = await Class.findByPk(req.params.classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (cls.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await cls.destroy();
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/classes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    let classes;
    if (role === 'teacher') {
      classes = await Class.findAll({
        where: { teacherId: userId },
        attributes: {
          include: [
            [ Sequelize.fn('COUNT', Sequelize.col('Students.id')), 'studentCount' ]
          ]
        },
        include: [{
          model: Student,
          attributes: [],
        }],
        group: ['Class.id']
      })
    } else if (role === 'student') {
      const studs = await Student.findAll({ where: { userId } });
      const studIds = studs.map(s => s.id);
      classes = await Class.findAll({
        where: { students: { [Op.overlap]: studIds } }
      });
    } else {
      return res.status(403).json({ message: 'Role not allowed' });
    }
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/classes/:classId/generate-code
router.post('/:classId/generate-code', authenticateToken, isTeacher, async (req, res) => {
  try {
    const cls = await Class.findByPk(req.params.classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (cls.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const newCode = await generateClassCode();
    await cls.update({ code: newCode });
    res.json({ code: newCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/classes/:classId/students
router.post('/:classId/students', authenticateToken, isTeacher, async (req, res) => {
  try {
    console.log('[BACK] ▶️ POST /api/classes/:classId/students params:', req.params, 'body:', req.body);
    const { students } = req.body;
    const cls = await Class.findByPk(req.params.classId);
    console.log('[BACK] found class before adding students:', cls ? cls.toJSON() : null);

    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (cls.teacherId !== req.user.id) {
      console.warn('[BACK] ❌ Not authorized to add students to class:', req.params.classId);
      return res.status(403).json({ message: 'Not authorized' });
    }

    const created = await Promise.all(students.map(s =>
      Student.create({
        firstName: s.firstName,
        lastName:  s.lastName,
        classId:   cls.id
      })
    ));
    const ids = created.map(s => s.id);
    await cls.update({ students: [...(cls.students||[]), ...ids] });
    console.log('[BACK] ✅ students added, new class.students:', cls.students);
    res.json({ message: 'Students added', class: cls });
  } catch (err) {
    console.error('[BACK] ❌ Error in POST /api/classes/:classId/students:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/classes/:classId/students
router.get('/:classId/students', authenticateToken, async (req, res) => {
  console.log('[BACK] ▶️  GET /api/classes/:classId/students params:', req.params);
  try {
    const classId = parseInt(req.params.classId, 10);
    console.log('[BACK] 🔍 Looking up class by PK with id =', classId);
    const cls = await Class.findByPk(classId);
    if (!cls) {
      console.warn('[BACK] ⚠️  Class not found for id:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }
    console.log('[BACK] ✅  Found class:', cls.toJSON());

    console.log('[BACK] 🔍  Fetching students via Student model where classId =', classId);
    const studs = await Student.findAll({
      where: { classId }
    });
    const studsData = studs.map(s => ({
      id:        s.id,
      firstName: s.firstName,
      lastName:  s.lastName,
      email:     s.email || null   // if you have email on Student
    }));
    console.log('[BACK] ✅  Retrieved students:', studsData);

    return res.json(studs);
  } catch (err) {
    console.error('[BACK] ❌  Error fetching students:', err);
    return res.status(500).json({ message: err.message });
  }
});


// GET /api/classes/search-students?classCode=…&lastNamePrefix=…
router.get('/search-students', async (req, res) => {
  try {
    const { classCode, lastNamePrefix } = req.query;
    const cls = await Class.findOne({ where: { code: classCode } });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    const studs = await Student.findAll({
      where: {
        id:        { [Op.in]: cls.students||[] },
        lastName:  { [Op.iLike]: `${lastNamePrefix}%` }
      },
      attributes: ['id','firstName','lastName']
    });
    res.json(studs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/classes/join
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { classCode, firstName, lastName } = req.body;
    const cls = await Class.findOne({ where: { code: classCode } });
    if (!cls) return res.status(404).json({ message: 'Invalid class code' });
    const stud = await Student.findOne({
      where: { classId: cls.id, firstName, lastName }
    });
    if (!stud) return res.status(404).json({ message: 'Student not found' });
    await stud.update({ userId: req.user.id });
    res.status(201).json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/classes/:classId/add-pending-student
router.post('/:classId/add-pending-student', authenticateToken, isTeacher, async (req, res) => {
  try {
    const { name, email } = req.body;
    const cls = await Class.findByPk(req.params.classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (cls.teacherId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await cls.update({
      pendingStudents: [...(cls.pendingStudents||[]), { name, email }]
    });
    res.status(201).json({ message: 'Pending student added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/classes/:classId/pending-students
router.get('/:classId/pending-students', authenticateToken, async (req, res) => {
  try {
    const cls = await Class.findByPk(req.params.classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls.pendingStudents||[]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
