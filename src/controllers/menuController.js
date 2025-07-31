const Menu = require('../models/Menu');

// Create a new menu item
exports.createMenuItem = async (req, res) => {
    try {

        const { label, icon, link, parentId, order, isActive } = req.body;

        // Validate that parent exists if parentId is provided
        if (parentId) {
            const parent = await Menu.findById(parentId);
            if (!parent) {
                return res.status(400).json({ error: 'Parent menu item not found' });
            }
        }

        const menuItem = new Menu({
            label,
            icon: parentId ? null : icon, // Only set icon if it's a parent item
            link,
            parentId: parentId || null,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
            createdBy: "wllka"
        });

        await menuItem.save();
        res.status(201).json({ success: true, menuItem });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all menu items in hierarchical structure
exports.getAllMenuItems = async (req, res) => {
    try {
        const menuItems = await Menu.find().sort({ order: 1 });

        // Build hierarchical structure
        const buildHierarchy = (items, parentId = null) => {
            return items
                .filter(item => (item.parentId && item.parentId.equals(parentId)) || (!item.parentId && !parentId))
                .map(item => ({
                    ...item.toObject(),
                    children: buildHierarchy(items, item._id)
                }));
        };

        const hierarchicalMenu = buildHierarchy(menuItems);
        res.json(hierarchicalMenu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get flat list of menu items (for admin panel)
exports.getFlatMenuItems = async (req, res) => {
    try {
        const menuItems = await Menu.find().sort({ order: 1 }).populate('parentId', 'label');
        res.json({ success: true, data: menuItems });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single menu item
exports.getMenuItem = async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a menu item
exports.updateMenuItem = async (req, res) => {
    try {
        const { label, icon, link, parentId, order, isActive } = req.body;
        const menuItem = await Menu.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        // Validate parent exists if changing parentId
        if (parentId && (!menuItem.parentId || !menuItem.parentId.equals(parentId))) {
            const parent = await Menu.findById(parentId);
            if (!parent) {
                return res.status(400).json({ error: 'Parent menu item not found' });
            }
        }

        // Update fields
        menuItem.label = label || menuItem.label;
        menuItem.icon = (!parentId && icon) ? icon : null; // Only keep icon if it's a parent
        menuItem.link = link || menuItem.link;
        menuItem.parentId = parentId || menuItem.parentId;
        menuItem.order = order || menuItem.order;
        menuItem.isActive = isActive !== undefined ? isActive : menuItem.isActive;
        menuItem.updatedBy = "wllka";

        await menuItem.save();
        res.json({ success: true, menuItem });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a menu item
exports.deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        // Check if this item has children
        const childItems = await Menu.find({ parentId: menuItem._id });
        if (childItems.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete menu item with children. Delete children first.'
            });
        }

        await menuItem.remove();
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};