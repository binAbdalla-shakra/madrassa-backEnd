const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Routes
router.post('/', studentController.createStudent);
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);
router.post('/bulk-import', studentController.bulkImportStudents);




module.exports = router;
