const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');

router.post('/', lessonController.createLesson);
router.get('/', lessonController.getLessons);
router.put('/:id', lessonController.updateLesson);

module.exports = router;