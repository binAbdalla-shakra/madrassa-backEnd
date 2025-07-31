const User = require('../models/User');
const MenuPermission = require('../models/MenuPermission'); // Import Role model
const bcrypt = require('bcrypt'); // Add this line to import bcrypt
// Create User
exports.createUser = async (req, res) => {
  try {
    const { username, password, email, roles, Teacher, madrassaId, CreatedBy } = req.body;

    // Validate at least one role is provided
    if (!roles || roles.length === 0) {
      return res.status(400).json({ error: "At least one role is required" });
    }

    const user = new User({
      username,
      password, // Remember to hash this in production
      email,
      roles,
      Teacher,
      madrassaId,
      CreatedBy,
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get All Users with populated roles
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('roles');
    res.json({ data: users });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update User (including roles)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If updating roles, ensure at least one role is provided
    if (updateData.roles && updateData.roles.length === 0) {
      return res.status(400).json({ error: "At least one role is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('roles');

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


//  get userAcccessible Menus
exports.getUserMenu = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('roles')
      .populate('roles', 'type');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return empty array if user has no roles
    if (!user.roles || user.roles.length === 0) {
      return res.json({ flatMenu: [] });
    }

    // Get all MenuPermission entries for the user's roles
    const menuPermissions = await MenuPermission.find({
      roleId: { $in: user.roles.map(role => role._id) }
    })
      .populate({
        path: 'menuId',
        select: 'label icon link parentId order',
        options: { sort: { order: 1 } }
      })
      .populate({
        path: 'subMenuIds',
        select: 'label link order',
        options: { sort: { order: 1 } }
      });

    // Return empty array if no permissions found
    if (!menuPermissions || menuPermissions.length === 0) {
      return res.json({ flatMenu: [] });
    }

    // Organize permissions by menuId with null checks
    const permissionsByMenu = {};
    menuPermissions.forEach(perm => {
      // Skip if menuId is null or undefined
      if (!perm.menuId) return;

      if (!permissionsByMenu[perm.menuId._id]) {
        permissionsByMenu[perm.menuId._id] = {
          menu: perm.menuId,
          subMenus: []
        };
      }

      // Add submenus only if they exist
      if (perm.subMenuIds && perm.subMenuIds.length > 0) {
        perm.subMenuIds.forEach(subMenu => {
          if (subMenu && !permissionsByMenu[perm.menuId._id].subMenus.some(s => s._id.equals(subMenu._id))) {
            permissionsByMenu[perm.menuId._id].subMenus.push(subMenu);
          }
        });
      }
    });

    // Get all parent menus (filter out null/undefined and sort)
    const parentMenus = Object.values(permissionsByMenu)
      .filter(item => item.menu && !item.menu.parentId)
      .map(item => item.menu)
      .sort((a, b) => a.order - b.order);

    // Build hierarchical menu structure
    const buildMenu = (parentId = null) => {
      return parentMenus
        .filter(menu =>
          (menu.parentId && menu.parentId.equals(parentId)) ||
          (!menu.parentId && !parentId)
        )
        .map(menu => {
          const permission = permissionsByMenu[menu._id];
          return {
            id: menu._id,
            label: menu.label,
            icon: menu.icon,
            link: menu.link,
            order: menu.order,
            subItems: (permission?.subMenus || []).map(subMenu => ({
              id: subMenu._id,
              label: subMenu.label,
              link: subMenu.link,
              parentId: menu._id,
              order: subMenu.order
            }))
          };
        });
    };

    const flatMenu = buildMenu();

    res.json({
      flatMenu: flatMenu || [] // Ensure we always return an array
    });
  } catch (error) {
    console.error('Error in getUserMenu:', error);
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
            roles: ["superAdmin"]
          }
        }
      });
    }

    // Regular user lookup
    const user = await User.findOne({ username }).populate('roles');
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
          roles: user.roles
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", error: "Server error" });
  }
};