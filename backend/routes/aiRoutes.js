const express = require('express');
const router = express.Router();
const aiService = require('../utils/aiService');

router.post('/assess-risk', async (req, res) => {
    try {
        // Expecting { patientData: {...}, role: 'doctor' | 'patient' }
        const { patientData, role } = req.body;

        if (!patientData) {
            return res.status(400).json({ message: "Patient data is required" });
        }

        // Default to 'patient' if role is missing or invalid
        const validRole = (role === 'doctor' || role === 'patient') ? role : 'patient';

        const assessment = await aiService.getRiskAssessment(patientData, validRole);
        res.json(assessment);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
