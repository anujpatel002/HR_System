const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');

const getWorkSettings = async (req, res) => {
  try {
    let settings = await prisma.work_settings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.work_settings.create({
        data: {}
      });
    }

    success(res, settings, 'Work settings retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get work settings', 500);
  }
};

const updateWorkSettings = async (req, res) => {
  try {
    const {
      workStartTime,
      workEndTime,
      workingDays,
      lunchBreakStart,
      lunchBreakEnd,
      checkInPopup,
      popupStartTime,
      popupEndTime
    } = req.body;

    let settings = await prisma.work_settings.findFirst();
    
    if (!settings) {
      settings = await prisma.work_settings.create({
        data: req.body
      });
    } else {
      settings = await prisma.work_settings.update({
        where: { id: settings.id },
        data: req.body
      });
    }

    success(res, settings, 'Work settings updated successfully');
  } catch (err) {
    error(res, 'Failed to update work settings', 500);
  }
};

module.exports = { getWorkSettings, updateWorkSettings };