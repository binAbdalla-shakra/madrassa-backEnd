const Teacher = require('../models/Teacher');



// Get All Teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const { 
      search,
      gender, 
      status,
      specialization
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Search across multiple fields if search term exists
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Add other filters
    if (gender) filter.gender = gender;
    if (status) filter.status = status;
    if (specialization) filter.specialization = { $regex: specialization, $options: 'i' };

    const teachers = await Teacher.find(filter)
      .populate('madrassaId', 'name');

    res.json({ 
      success: true,
      data: teachers 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
// Get Teacher by ID
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('madrassaId');
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create Teacher
exports.createTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.create(req.body);
    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: teacher,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to create teacher",
    });
  }
};

// Update Teacher
exports.updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      message: "Teacher updated successfully",
      data: teacher,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to update teacher",
    });
  }
};

// Delete Teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const deleted = await Teacher.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error?.message || "Failed to delete teacher",
    });
  }
};
