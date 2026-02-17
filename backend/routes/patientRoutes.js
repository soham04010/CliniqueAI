const express = require('express');
const router = express.Router();
const {
  predictRisk,
  getPatients,
  getPatientById,
  getPatientHistory,
  simulateRisk,
  copilotRequest,
  getCoPilotHistory,
  deletePatient,
  updatePatientDetails
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');

// Prediction & Simulation
router.post('/predict', protect, predictRisk);
router.post('/simulate', protect, simulateRisk);

// CoPilot Chat (Friend's logic)
router.post('/copilot', protect, copilotRequest);
router.get('/copilot/history/:patientId', protect, getCoPilotHistory);

// Patient Data Retrieval
router.get('/', protect, getPatients);
router.get('/:id', protect, getPatientById);
router.get('/history/:name', protect, getPatientHistory);

// Data Management (Your logic)
router.put('/:id', protect, updatePatientDetails);
router.delete('/:name', protect, deletePatient);

module.exports = router;