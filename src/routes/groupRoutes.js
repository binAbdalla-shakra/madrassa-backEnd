const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// Create group
router.post('/', groupController.createGroup);

// Update group by ID
router.put('/:id', groupController.updateGroup);

// Delete group by ID
router.delete('/:id', groupController.deleteGroup);

// Get group info by ID
router.get('/', groupController.getAllGroupsInfo);
router.get('/ungrouped-students', groupController.getUngroupedStudents);


// Get group students info (query params: groupId, branchId, madrassaId)
router.get('/students', groupController.getGroupStudentsInfo);

// Add students to group
router.post('/add-students', groupController.addStudentsToGroup);


// Add students to group
router.post('/transfer-students', groupController.transferStudentsToGroup);

// Remove student from group
router.post('/remove-student', groupController.removeStudentFromGroup);
// routes.js
router.get('/student-group-history/:studentId', groupController.getStudentGroupHistory);



module.exports = router;
