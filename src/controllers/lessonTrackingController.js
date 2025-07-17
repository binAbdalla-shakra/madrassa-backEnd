const LessonTracking = require('../models/LessonTracking');

// CREATE LessonTracking
exports.createLessonTracking = async (req, res) => {
  try {
    const newLesson = await LessonTracking.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: newLesson
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// READ Today's LessonTracking
exports.getTodayLessons = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const lessons = await LessonTracking.find({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    }).populate('studentId groupId');

    res.json({ success: true, data: lessons });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE LessonTracking
exports.updateLessonTracking = async (req, res) => {
  try {
    const updated = await LessonTracking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }
    res.json({ success: true, message: 'Lesson updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE LessonTracking
exports.deleteLessonTracking = async (req, res) => {
  try {
    const deleted = await LessonTracking.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }
    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
