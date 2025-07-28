const User = require('../models/User');
const Role = require('../models/Role'); // Import Role model
const bcrypt = require('bcrypt'); // Add this line to import bcrypt
// Create User
exports.createUser = async (req, res) => {
  try {
    const { username, password, email, roleId, madrassaId, CreatedBy } = req.body;

    // Optionally, you may want to hash the password before saving
    //  const hashedPassword = await bcrypt.hash(password, 10); 

    const user = new User({
      username: username,
      // password:hashedPassword, // Use hashedPassword in production
      password: password,
      email: email,
      roleId: roleId,
      madrassaId: madrassaId,
      CreatedBy: CreatedBy,
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

    // // Check if the password field exists and is not empty
    // if (updateData.password && updateData.password.trim() !== '') {
    //     // Hash the new password
    //     updateData.password = await bcrypt.hash(updateData.password, 10);
    // } else {
    //     // Remove the password field to retain the existing password
    //     delete updateData.password;
    // }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: updatedUser });
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


exports.getUserMenu = async (req, res) => {
  try {
    console.log("userId", req.params.userId)
    const user = await User.findById(req.params.userId)
      .populate({
        path: 'roleId',
        populate: { path: 'permissions' }
      })
      .populate('additionalPermissions');

    // Combine role permissions and additional permissions
    const allPermissions = [
      ...(user.roleId?.permissions || []),
      ...(user.additionalPermissions || [])
    ];

    // Format to match your frontend structure
    const menuItems = allPermissions.map(p => ({
      id: p._id,
      label: p.label,
      icon: p.icon,
      link: p.path || "/#",
      subItems: p.subItems?.map(sub => ({
        id: `${p._id}-${sub.path}`,
        label: sub.label,
        link: sub.path,
        parentId: p._id
      }))
    }));

    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Login controller
exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // SUPER ADMIN LOGIN (hardcoded fallback)
    if (username === "wllka" && password === "#dh@#$KDffSUJHIDF") {
      return res.status(200).json({
        status: "success",
        data: {
          user: {
            _id: "superadmin-id",
            username: "wllka",
            email: "superadmin@example.com",
            madrassaId: "687a0e5a907e6d1c2e0862b3",
            roleId: "superAdmin"
          }
        }
      });
    }

    // Regular user lookup
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(201).json({ status: "error", error: "Incorrect username!" });
    }

    const isMatch = password == user.password ? true : false;
    if (!isMatch) {
      return res.status(201).json({ status: "error", error: "Invalid password" });
    }

    res.status(200).json({
      status: "success",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          madrassaId: user.madrassaId,
          roleId: user.roleId
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", error: "Server error" });
  }
};
