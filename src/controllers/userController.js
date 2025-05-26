const User = require('../models/User');
const Role = require('../models/Role'); // Import Role model
const bcrypt = require('bcrypt'); // Add this line to import bcrypt
// Create User
exports.createUser = async (req, res) => {
    try {
        const { username, password, email, roleId,CreatedBy } = req.body;

        // Optionally, you may want to hash the password before saving
         const hashedPassword = await bcrypt.hash(password, 10); 

        const user = new User({
            username:username,
            password:hashedPassword, // Use hashedPassword in production
            // password: password,
            email:email,
            roleId:roleId,
            CreatedBy:CreatedBy,
        });

        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('roleId');

    // Rename roleId to role for frontend clarity
    const formattedUsers = users.map(user => {
      const userObj = user.toObject();
      userObj.role = userObj.roleId;
      delete userObj.roleId;
      return userObj;
    });

    res.json({ data: formattedUsers });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// Update User
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params; // Get user ID from URL
        const updateData = { ...req.body };

        // Check if the password field exists and is not empty
        if (updateData.password && updateData.password.trim() !== '') {
            // Hash the new password
            updateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
            // Remove the password field to retain the existing password
            delete updateData.password;
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({data: updatedUser});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete User
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params; // Get user ID from URL
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(204).send(); // No content to send back
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
