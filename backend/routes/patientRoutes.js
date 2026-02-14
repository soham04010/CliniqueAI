const express = require('express');
const router = express.Router();
const { predictRisk, getPatients, getPatientById, getPatientHistory, simulateRisk, copilotRequest, getCoPilotHistory } = require('../controllers/patientController');
const { protect } = require('../middleware/auth');

router.post('/predict', protect, predictRisk);
router.post('/simulate', protect, simulateRisk);
router.post('/copilot', protect, copilotRequest);
router.get('/copilot/history/:patientId', protect, getCoPilotHistory); // NEW LISTENER
router.get('/', protect, getPatients);
router.get('/:id', protect, getPatientById);
router.get('/history/:name', protect, getPatientHistory); // NEW ROUTE

module.exports = router;