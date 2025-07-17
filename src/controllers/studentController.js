const Student = require('../models/Student');
const Parent = require('../models/Parent');


// Get All Students
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


exports.bulkImportStudents = async (req, res) => {
    try {
        const { studentsData, madrassaId, createdBy } = req.body;

        if (!studentsData || !Array.isArray(studentsData)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid students data format' 
            });
        }

        // 1. Process parent data - only find existing parents
        const parentContacts = [];
        const parentMap = {}; // {contactNumber: parentId}

        // Extract unique parent contacts
        studentsData.forEach(student => {
            if (student.parentContactNumber) {
                parentContacts.push(student.parentContactNumber);
            }
        });

        // Find only existing parents
        const existingParents = await Parent.find({
            contactNumber: { $in: [...new Set(parentContacts)] },
            madrassaId
        });

        // Create mapping of existing parents
        existingParents.forEach(parent => {
            parentMap[parent.contactNumber] = parent._id;
        });

        // 2. Prepare and create students (only those with known parents)
        const createdStudents = [];
        const skippedStudents = [];
        const errors = [];
        
        for (const [index, student] of studentsData.entries()) {
            try {
                // Skip if parent contact provided but not found
                if (student.parentContactNumber && !parentMap[student.parentContactNumber]) {
                    skippedStudents.push({
                        row: index + 1,
                        name: student.name || 'Unknown',
                        reason: `Parent with contact ${student.parentContactNumber} not found`
                    });
                    continue;
                }

                const studentDoc = {
                    name: student.name,
                    gender: student.gender,
                    birthdate: student.birthdate,
                    address: student.address,
                    admissionDate: student.admissionDate || new Date(),
                    // registrationNumber: student.registrationNumber,
                    monthlyFee: student.monthlyFee || 15,
                    madrassaId,
                    createdBy,
                    isActive: true,
                    createdAt: new Date()
                };

                // Add parent reference if exists
                if (student.parentContactNumber) {
                    studentDoc.parent = parentMap[student.parentContactNumber];
                }

                const createdStudent = await Student.create(studentDoc);
                createdStudents.push(createdStudent);
            } catch (error) {
                errors.push({
                    row: index + 1,
                    name: student.name || 'Unknown',
                    error: error.message
                });
            }
        }

        // 3. Return results
        res.json({
            success: true,
            message: 'Bulk import completed',
            stats: {
                totalProcessed: studentsData.length,
                successCount: createdStudents.length,
                skippedCount: skippedStudents.length,
                errorCount: errors.length
            },
            skippedStudents: skippedStudents.length > 0 ? skippedStudents : undefined,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Bulk import failed',
            error: error.message
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
