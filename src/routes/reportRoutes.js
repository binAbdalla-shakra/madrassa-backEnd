const express = require('express');
const router = express.Router();
const lessonReportController = require('../controllers/lessonReportController');
const attendanceReportController = require('../controllers/attendanceReportController');

// Lesson Reports
router.get('/lessons/summary', lessonReportController.getLessonSummary);
router.get('/lessons/details', lessonReportController.getLessonDetails);
router.get('/students-without-lessons', lessonReportController.getStudentsWithoutLessons);

// Attendance Reports
router.get('/attendance/summary', attendanceReportController.getAttendanceSummary);
router.get('/attendance/details', attendanceReportController.getAttendanceDetails);

module.exports = router;