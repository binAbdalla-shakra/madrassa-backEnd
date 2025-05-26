// const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
// exports.signin = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // 1. Check if user exists
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         // 2. Verify password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ error: "Invalid credentials" });
//         }

//         // 4. Send response (exclude password)
//         const { password: _, ...userData } = user.toObject();
//         res.json({ user: userData });

//     } catch (error) {
//         res.status(500).json({ error: "Server error: " + error.message });
//     }
// };



// Login controller
exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ status: "error", error: "User not found" });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: "error", error: "Invalid password" });
    }

    // On success
    res.status(200).json({
      status: "success",  // ← Critical for frontend condition
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });

  } catch (error) {
    res.status(500).json({ status: "error", error: "Server error" });
  }
};