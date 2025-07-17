const express = require('express');
const router = express.Router();
const lessonCtrl = require('../controllers/lessonTrackingController');

// POST: Create a lesson
router.post('/', lessonCtrl.createLessonTracking);

// GET: Get today's lessons
router.get('/today', lessonCtrl.getTodayLessons);

// PUT: Update a lesson
router.put('/:id', lessonCtrl.updateLessonTracking);

// DELETE: Delete a lesson
router.delete('/:id', lessonCtrl.deleteLessonTracking);

module.exports = router;
