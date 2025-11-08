const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');

const getActiveUserScreens = async (req, res) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    success(res, sessions, 'Active user screens retrieved');
  } catch (err) {
    error(res, 'Failed to get user screens', 500);
  }
};

const updateUserScreen = async (req, res) => {
  try {
    const { currentPage, screenData } = req.body;
    
    await prisma.userSession.updateMany({
      where: { 
        userId: req.user.id,
        isActive: true
      },
      data: { 
        lastActivity: new Date(),
        attendanceStatus: JSON.stringify({ currentPage, screenData })
      }
    });

    success(res, null, 'Screen updated');
  } catch (err) {
    error(res, 'Failed to update screen', 500);
  }
};

const updateScreenshot = async (req, res) => {
  try {
    const { screenshot, timestamp } = req.body;
    
    console.log('Screenshot received from user:', req.user.id);
    
    // Store screenshot in memory for real-time viewing
    global.userScreenshots = global.userScreenshots || new Map();
    global.userScreenshots.set(req.user.id, {
      screenshot,
      timestamp,
      userId: req.user.id
    });

    success(res, null, 'Screenshot updated');
  } catch (err) {
    error(res, 'Failed to update screenshot', 500);
  }
};

const getUserScreenshot = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Admin requesting screenshot for user:', userId);
    console.log('Available screenshots:', Array.from(global.userScreenshots?.keys() || []));
    
    const screenshot = global.userScreenshots?.get(userId);
    if (!screenshot) {
      console.log('No screenshot found for user:', userId);
      return error(res, 'No screenshot available', 404);
    }

    console.log('Screenshot found, sending to admin');
    success(res, screenshot, 'Screenshot retrieved');
  } catch (err) {
    error(res, 'Failed to get screenshot', 500);
  }
};

const requestScreenShare = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Screen share request for user:', userId);
    
    // Store screen share request
    global.screenShareRequests = global.screenShareRequests || new Map();
    global.screenShareRequests.set(userId, {
      requestedBy: req.user.id,
      requestedAt: new Date(),
      status: 'pending'
    });

    console.log('Request stored:', global.screenShareRequests.get(userId));

    success(res, null, 'Screen share request sent');
  } catch (err) {
    error(res, 'Failed to send request', 500);
  }
};

const getScreenShareRequest = async (req, res) => {
  try {
    const request = global.screenShareRequests?.get(req.user.id);
    console.log('Getting request for user:', req.user.id, 'Found:', request);
    success(res, request || null, 'Request status retrieved');
  } catch (err) {
    error(res, 'Failed to get request', 500);
  }
};

const respondToScreenShare = async (req, res) => {
  try {
    const { response } = req.body; // 'accept' or 'deny'
    
    const request = global.screenShareRequests?.get(req.user.id);
    if (request) {
      request.status = response;
      request.respondedAt = new Date();
    }

    success(res, null, `Screen share ${response}ed`);
  } catch (err) {
    error(res, 'Failed to respond', 500);
  }
};

module.exports = { getActiveUserScreens, updateUserScreen, updateScreenshot, getUserScreenshot, requestScreenShare, getScreenShareRequest, respondToScreenShare };