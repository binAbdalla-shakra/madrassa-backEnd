const Parent = require('../models/Parent');
const Student = require('../models/Student'); // Make sure to import the Student model

exports.getAllParents = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      search,
      name, 
      email, 
      contactNumber, 
      gender, 
      status,
      address,
      isDiscountPercent,
      madrassaId
    } = req.query;

    // Build filter object
    const filter = {};
    
  if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (name) filter.name = { $regex: name, $options: 'i' };
    if (email) filter.email = { $regex: email, $options: 'i' };
    if (contactNumber) filter.contactNumber = { $regex: contactNumber, $options: 'i' };
    if (gender) filter.gender = gender;
    if (status) filter.status = status;
    if (address) filter.address = { $regex: address, $options: 'i' };
    if (isDiscountPercent) filter.isDiscountPercent = isDiscountPercent === 'true';
    if (madrassaId) filter.madrassaId = madrassaId;

    const parents = await Parent.find(filter)
      .populate('madrassaId', 'name');

    res.json({ 
      success: true,
      data: parents 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get Single Parent by ID
exports.getParentById = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id)
      .populate('madrassaId', 'name');

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json(parent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.createParent = async (req, res) => {
  try {
    const { contactNumber } = req.body;


     // Check if phone number already exists
    if (contactNumber) {
      const existing = await Parent.findOne({ contactNumber });
      if (existing) {
        return res.status(500).json({
          success: false,
          message: "A parent with this Contact Number already exists."
        });
      }
    }

    await Parent.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Parent created successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create parent"
    });
  }
};


exports.updateParent = async (req, res) => {
  try {
    const { contactNumber } = req.body;
    const parentId = req.params.id;

    // Check if contactNumber already exists for another parent
    if (contactNumber) {
      const existingContact = await Parent.findOne({ contactNumber, _id: { $ne: parentId } });
      if (existingContact) {
        return res.status(500).json({
          success: false,
          message: "Contact number is already in use by another parent",
        });
      }
    }

    // Proceed with update
    const parent = await Parent.findByIdAndUpdate(parentId, req.body, {
      new: true,
    });

    if (!parent) {
      return res.status(500).json({
        success: false,
        message: "Parent not found",
      });
    }

    res.json({
      success: true,
      message: "Parent updated successfully",
      data: parent,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update parent",
      error: error.message,
    });
  }
};

// Delete Parent

exports.deleteParent = async (req, res) => {
  try {
    const parent = req.params.id;

    // Check if any student is assigned to this parent
    const studentWithParent = await Student.findOne({ parent });

    if (studentWithParent) {
      return res.status(500).json({
        success: false,
        message: "Cannot delete parent. It is assigned to one or more students.",
      });
    }

    await Parent.findByIdAndDelete(parent);

    return res.status(200).json({
      success: true,
      message: "Parent deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred.",
    });
  }
};
