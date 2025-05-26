// const Plan = require('../models/Plan');

// // Create Plan
// exports.createPlan = async (req, res) => {
//     try {
//         const { name, price, durationInDays, discountPercentage } = req.body;

//         const plan = new Plan({
//             name:name,
//             price:price,
//             durationInDays:durationInDays,
//             discountPercentage: discountPercentage || 0,
//         });

//         await plan.save();
//         res.status(201).json(plan);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to create plan.' });
//     }
// };

// // Get All Plans
// exports.getAllPlans = async (req, res) => {
//     try {
//         const plans = await Plan.find();
//         res.status(200).json(plans);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to fetch plans.' });
//     }
// };

// // Get Plan by ID
// exports.getPlanById = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const plan = await Plan.findById(id);

//         if (!plan) {
//             return res.status(404).json({ error: 'Plan not found.' });
//         }

//         res.status(200).json(plan);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to fetch plan.' });
//     }
// };

// // Update Plan
// exports.updatePlan = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { name, price, durationInDays, discountPercentage } = req.body;

//         if (!name || !price || !durationInDays) {
//             return res.status(400).json({ error: 'Name, price, and duration are required.' });
//         }

//         const updatedPlan = await Plan.findByIdAndUpdate(
//             id,
//             { name, price, durationInDays, discountPercentage },
//             { new: true } // Return the updated document
//         );

//         if (!updatedPlan) {
//             return res.status(404).json({ error: 'Plan not found.' });
//         }

//         res.status(200).json(updatedPlan);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to update plan.' });
//     }
// };

// // Delete Plan
// exports.deletePlan = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const deletedPlan = await Plan.findByIdAndDelete(id);

//         if (!deletedPlan) {
//             return res.status(404).json({ error: 'Plan not found.' });
//         }

//         res.status(200).json({ message: 'Plan deleted successfully.' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to delete plan.' });
//     }
// };
