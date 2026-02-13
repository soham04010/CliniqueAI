const express = require('express');
const router = express.Router();
const { getPatients, addRecord, getPatientHistory } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.get('/', protect, getPatients); // Doctor gets list
router.post('/record', protect, addRecord); // Add new vitals
router.get('/:id/history', protect, getPatientHistory); // Get specific patient data

module.exports = router;