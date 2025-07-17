const Student = require('../models/Student');



// Get All Students
// exports.getAllStudents = async (req, res) => {
//   try {
//     const students = await Student.find()
//       .populate({
//         path: 'parent',
//         select: 'name contactNumber' // Only include name and _id
//       })

//     res.json({success: true, data: students });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };
// Updated controller (studentsController.js)
exports.getAllStudents = async (req, res) => {
  try {
    const { 
      search,
      gender, 
      isActive,
      parent
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Search across multiple fields if search term exists
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'parent.name': { $regex: search, $options: 'i' } },
        { 'parent.contactNumber': { $regex: search, $options: 'i' } }
      ];
    }

    // Add other filters
    if (gender) filter.gender = gender;
    if (isActive) filter.isActive = isActive === 'true';
    if (parent) filter.parent = parent;

    const students = await Student.find(filter)
      .populate({
        path: 'parent',
        select: 'name contactNumber'
      });

    res.json({ 
      success: true,
      data: students 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get Single Student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('parent')
      .populate('groupId')
      .populate('madrassaId')
      .populate('branchId');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create Student
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create student",
    });
  }
};

// Update Student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update student",
    });
  }
};

// Delete Student
exports.deleteStudent = async (req, res) => {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete student",
    });
  }
};
