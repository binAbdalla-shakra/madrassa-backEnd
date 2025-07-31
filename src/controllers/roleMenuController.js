const Role = require('../models/Role');
const Menu = require('../models/Menu');
const MenuPermission = require('../models/MenuPermission');

// Get all menus with hierarchy for role assignment
exports.getMenusForRole = async (req, res) => {
    try {
        const { roleId } = req.params;

        // Get all menus in hierarchical structure
        const menus = await Menu.find().sort({ order: 1 });

        // Get existing permissions for this role
        const existingPermissions = await MenuPermission.find({ roleId });

        // Build hierarchical structure with permission info
        const buildMenuWithPermissions = (items, parentId = null) => {
            return items
                .filter(item => (item.parentId && item.parentId.equals(parentId)) || (!item.parentId && !parentId))
                .map(item => {
                    const existingPermission = existingPermissions.find(p => p.menuId.equals(item._id));

                    return {
                        ...item.toObject(),
                        hasAccess: existingPermission ? true : false,
                        subMenus: buildMenuWithPermissions(items, item._id),
                        selectedSubMenus: existingPermission ? existingPermission.subMenuIds : []
                    };
                });
        };

        const hierarchicalMenus = buildMenuWithPermissions(menus);
        res.json(hierarchicalMenus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update role menu permissions
exports.updateRoleMenuPermissions = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { menuPermissions } = req.body;

        // Validate input
        if (!Array.isArray(menuPermissions)) {
            return res.status(400).json({ error: 'Invalid permissions format' });
        }

        // Delete all existing permissions for this role
        await MenuPermission.deleteMany({ roleId });

        // Create new permissions
        const newPermissions = menuPermissions
            .filter(perm => perm.hasAccess)
            .map(perm => ({
                roleId,
                menuId: perm.menuId,
                subMenuIds: perm.selectedSubMenus || [],
                createdBy: req.body.createdBy
            }));

        if (newPermissions.length > 0) {
            await MenuPermission.insertMany(newPermissions);
        }

        // Update role permissions array
        await Role.findByIdAndUpdate(roleId, {
            $set: {
                permissions: menuPermissions.map(perm => ({
                    menu: perm.menuId,
                    subMenus: perm.selectedSubMenus || [],
                    hasAccess: perm.hasAccess
                })),
                updatedAt: Date.now(),
                updatedBy: req.body.createdBy
            }
        });

        res.json({ success: true, message: 'Menu permissions updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get permissions for a specific role
exports.getRolePermissions = async (req, res) => {
    try {
        const { roleId } = req.params;

        const permissions = await MenuPermission.find({ roleId })
            .populate('menuId')
            .populate('subMenuIds');

        res.json(permissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};