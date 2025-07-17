const Group = require('../models/Group');
const GroupWithStudent = require('../models/GroupWithStudent');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Log = require('../models/Log'); // hypothetical log model
const mongoose = require('mongoose');

// Utility to log actions
async function logAction({action, entity, entityId, performedBy, details,madrassaId}) {
    try {
        await Log.create({
            action,
            entity,
            entityId,
            performedBy,
            details,
            // branchId,
            madrassaId,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Logging failed:', err);
    }
}

// Create Group
exports.createGroup = async (req, res) => {
    try {
        const group = await Group.create(req.body);
        await logAction({
            action: 'CREATE',
            entity: 'Group',
            entityId: group._id,
            performedBy: req.body.createdBy || 'unknown',
            // branchId: req.body.branchId,
            madrassaId: req.body.madrassaId,
            details: `Created group ${group.name}`
        });
        res.status(201).json({ success: true, message: 'Group created successfully', data: group });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update Group
exports.updateGroup = async (req, res) => {
    try {
        const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        await logAction({
            action: 'UPDATE',
            entity: 'Group',
            entityId: group._id,
            performedBy: req.body.modifiedBy || 'unknown',
            // branchId: req.body.branchId,
            madrassaId: req.body.madrassaId,
            details: `Updated group ${group.name}`
        });
        res.json({ success: true, message: 'Group updated successfully', data: group });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete Group (only if no members)
exports.deleteGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { madrassaId, ModifiedBy } = req.body;

        // Check if group has active members (students without leaveDate)
        const activeMembersCount = await GroupWithStudent.aggregate([
            { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
            { $unwind: "$students" },
            { $match: { "students.leaveDate": { $exists: false } } },
            { $count: "activeStudents" }
        ]);

        if (activeMembersCount.length > 0 && activeMembersCount[0].activeStudents > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete group with active members. Transfer or remove members first.' 
            });
        }

        // Delete the group and its associations
        const [group, deletedAssociations] = await Promise.all([
            Group.findByIdAndDelete(groupId),
            GroupWithStudent.deleteMany({ groupId })
        ]);

        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: 'Group not found' 
            });
        }

        await logAction({
            action: 'DELETE',
            entity: 'Group',
            entityId: groupId,
            performedBy: ModifiedBy || 'unknown',
            madrassaId: madrassaId,
            details: `Deleted group ${group.name} and ${deletedAssociations.deletedCount} associations`
        });

        res.json({ 
            success: true, 
            message: 'Group deleted successfully',
            deletedAssociations: deletedAssociations.deletedCount
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message,
            error: error.stack 
        });
    }
};

exports.getAllGroupsInfo = async (req, res) => {
  try {
    // Get all groups, populating teacher name
    const groups = await Group.find({}).populate('teacherId', 'name');

    // For each group, get total active students count (students without leaveDate)
    const groupsInfo = await Promise.all(
      groups.map(async (group) => {
        const result = await GroupWithStudent.aggregate([
          { $match: { groupId: group._id } },
          { $unwind: "$students" },
          { $match: { "students.leaveDate": { $exists: false } } },
          { $group: { _id: null, totalStudents: { $sum: 1 } } }
        ]);

        const totalStudents = result[0]?.totalStudents || 0;

        return {
          _id: group._id,
          name: group.name,
          description: group.description,
          teacherId: group.teacherId?._id || null,
          teacherName: group.teacherId?.name || null,
          totalStudents
        };
      })
    );

    res.json({
      success: true,
      data: groupsInfo
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


exports.getUngroupedStudents = async (req, res) => {
  try {
    // Get all students who are currently active in any group
    const activeStudents = await GroupWithStudent.aggregate([
      { $unwind: "$students" },
      { $match: { "students.leaveDate": { $exists: false } } },
      { $group: { _id: "$students.studentId" } }
    ]);

    // Convert ObjectIds to strings for comparison
    // Convert string IDs to ObjectIds for proper comparison
    const activeStudentObjectIds = activeStudents.map(s => 
      new mongoose.Types.ObjectId(s._id.toString())
    );

    console.log("got",activeStudentObjectIds)
    // Get students who are either:
    // 1. Not in any group at all, OR
    // 2. Only exist in groups with leaveDate set
    const ungroupedStudents = await Student.aggregate([
      {
        $match: {
          _id: { $nin: activeStudentObjectIds}
        }
      },
      {
        $lookup: {
          from: "groupwithstudents",
          let: { studentId: "$_id" },
          pipeline: [
            { $unwind: "$students" },
            { $match: { $expr: { $eq: ["$students.studentId", "$$studentId"] } } }
          ],
          as: "groupHistory"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          // rollNumber: 1,
          wasEverInGroup: { $gt: [{ $size: "$groupHistory" }, 0] }
        }
      }
    ]);

    res.json({
      success: true,
      data: ungroupedStudents,
      count: ungroupedStudents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ungrouped students",
      error: error.message
    });
  }
};
// Add Students To Group
exports.addStudentsToGroup = async (req, res) => {
  try {
    const { groupId, studentIds, madrassaId, CreatedBy } = req.body;

    if (!groupId || !studentIds?.length || !madrassaId) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const groupObjId = new mongoose.Types.ObjectId(groupId);
    const madrassaObjId = new mongoose.Types.ObjectId(madrassaId);

    // Get current date for joinDate
    const joinDate = new Date();

    // Prepare student entries with join dates
    const studentsToAdd = studentIds.map(studentId => ({
      studentId: new mongoose.Types.ObjectId(studentId),
      joinDate
    }));

    // Find or create the GroupWithStudent document
    const groupDoc = await GroupWithStudent.findOneAndUpdate(
      { groupId: groupObjId, madrassaId: madrassaObjId },
      { 
        $addToSet: { students: { $each: studentsToAdd } },
        $set: { updatedAt: new Date() }
      },
      { upsert: true, new: true }
    );

    await logAction({
      action: 'ADD_STUDENTS',
      entity: 'Group',
      entityId: groupId,
      performedBy: CreatedBy || 'unknown',
      madrassaId,
      details: `Added students: [${studentIds.join(', ')}] to group ${groupId}`
    });

    res.json({ success: true, message: 'Students added to group successfully', data: groupDoc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Remove Student From Group
exports.removeStudentFromGroup = async (req, res) => {
  try {
    const { groupId, studentId, madrassaId, DeletedBy, transferredTo } = req.body;

    if (!groupId || !studentId || !madrassaId) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    // Remove from ALL active groups (not just the specified group)
    const updateResult = await GroupWithStudent.updateMany(
      {
        madrassaId,
        'students.studentId': studentId,
        'students.leaveDate': null 
      },
      {
        $set: {
          'students.$[elem].leaveDate': new Date(),
          ...(transferredTo && { 'students.$[elem].transferredTo': transferredTo }),
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [{ 'elem.studentId': studentId }],
        multi: true
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Active student not found in any group' 
      });
    }

    await logAction({
      action: transferredTo ? 'TRANSFER_STUDENT' : 'REMOVE_STUDENT',
      entity: 'Group',
      entityId: groupId,
      performedBy: DeletedBy || 'unknown',
      madrassaId,
      details: transferredTo 
        ? `Transferred student ${studentId} to group ${transferredTo}`
        : `Removed student ${studentId} from all groups`
    });

    res.json({ 
      success: true, 
      message: 'Student removed from all groups successfully',
      groupsAffected: updateResult.modifiedCount
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message,
      error: error.stack 
    });
  }
};

// Transfer Students Between Groups
exports.transferStudentsToGroup = async (req, res) => {
  try {
    const { sourceGroupId, targetGroupId, studentIds, madrassaId, PerformedBy } = req.body;

    // Validate required parameters
    if (!sourceGroupId || !targetGroupId || !studentIds?.length || !madrassaId) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    // Prevent transferring to the same group
    if (sourceGroupId === targetGroupId) {
      return res.status(400).json({ success: false, message: 'Cannot transfer to the same group' });
    }

    // 1. First check if any students are already active in the target group
    const existingActiveInTarget = await GroupWithStudent.findOne({
      groupId: targetGroupId,
      'students.studentId': { $in: studentIds },
      'students.leaveDate': { $exists: false }
    });

    if (existingActiveInTarget) {
      return res.status(400).json({ 
        success: false, 
        message: 'One or more students are already active in the target group' 
      });
    }

// 2. Mark students as transferred in ALL their current active groups
const leaveResult = await GroupWithStudent.updateMany(
  {
    'students.studentId': { $in: studentIds },
    // Remove the leaveDate check so we can update existing transfers
    // 'students.leaveDate': { $exists: false } // REMOVE THIS LINE
  },
  {
    $set: {
      'students.$[elem].leaveDate': new Date(),
      'students.$[elem].transferredTo': targetGroupId,
      updatedAt: new Date()
    }
  },
  {
    // Also remove the leaveDate check from arrayFilters
    arrayFilters: [{ 'elem.studentId': { $in: studentIds } }]
  }
);

// Modified check to verify students exist (regardless of active status)
if (leaveResult.matchedCount === 0) {
  return res.status(404).json({ 
    success: false, 
    message: 'No students found with the provided IDs' 
  });
}

    // 3. Add students to the target group
    const joinDate = new Date();
    const studentsToAdd = studentIds.map(studentId => ({
      studentId,
      joinDate
    }));

    const addResult = await GroupWithStudent.findOneAndUpdate(
      { groupId: targetGroupId, madrassaId },
      { 
        $addToSet: { students: { $each: studentsToAdd } },
        $set: { updatedAt: new Date() }
      },
      { upsert: true, new: true }
    );

    // Log the action
    await logAction({
      action: 'TRANSFER_STUDENTS',
      entity: 'Group',
      entityId: targetGroupId,
      performedBy: PerformedBy || 'unknown',
      madrassaId,
      details: `Transferred students: [${studentIds.join(', ')}] from group ${sourceGroupId} to group ${targetGroupId}`
    });

    res.json({ 
      success: true, 
      message: 'Students transferred successfully',
      data: {
        leftGroups: leaveResult.modifiedCount,
        addedToGroup: addResult ? addResult._id : null
      }
    });

  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message,
      error: error.stack 
    });
  }
};
// Get Student Group History
exports.getStudentGroupHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const history = await GroupWithStudent.aggregate([
      { $match: { 'students.studentId': new mongoose.Types.ObjectId(studentId) } },
      { $unwind: '$students' },
      { $match: { 'students.studentId': new mongoose.Types.ObjectId(studentId) } },
      { $lookup: {
          from: 'groups',
          localField: 'groupId',
          foreignField: '_id',
          as: 'group'
        }
      },
      { $unwind: '$group' },
      { $project: {
          groupId: 1,
          groupName: '$group.name',
          joinDate: '$students.joinDate',
          leaveDate: '$students.leaveDate',
          transferredTo: '$students.transferredTo',
          isCurrent: { $cond: [{ $eq: ['$students.leaveDate', null] }, true, false] }
        }
      },
      { $sort: { joinDate: 1 } }
    ]);

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get Group Students with Join Dates
exports.getGroupStudentsInfo = async (req, res) => {
  try {
    const { groupId, madrassaId } = req.query;

    if (!groupId || !madrassaId) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const groupStudents = await GroupWithStudent.aggregate([
      { $match: { 
          groupId: new mongoose.Types.ObjectId(groupId),
          madrassaId: new mongoose.Types.ObjectId(madrassaId)
        }
      },
      { $unwind: '$students' },
      { $match: { 'students.leaveDate': { $exists: false } } },
      { $lookup: {
          from: 'students',
          localField: 'students.studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $project: {
          _id: '$student._id',
          name: '$student.name',
          status: { $cond: [{ $eq: ['$student.isActive', true] }, 'Active', 'Inactive'] },
          joinDate: '$students.joinDate'
        }
      },
      { $sort: { joinDate: 1 } }
    ]);

    res.json({ success: true, data: groupStudents });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};