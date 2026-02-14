const express = require('express');
const router = express.Router();
const { predictRisk, getPatients, getPatientById, getPatientHistory, simulateRisk } = require('../controllers/patientController');
const { protect } = require('../middleware/auth'); 

router.post('/predict', protect, predictRisk);
router.post('/simulate', protect, simulateRisk);
router.get('/', protect, getPatients);
router.get('/:id', protect, getPatientById);
router.get('/history/:name', protect, getPatientHistory); // NEW ROUTE

module.exports = router;