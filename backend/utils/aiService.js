const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Python Flask API URL
const ML_API_URL = 'http://127.0.0.1:5001/predict';

exports.getRiskAssessment = async (patientData, role = 'patient') => {
    try {
        // 1. Get Prediction from Python Model
        console.log("Sending data to ML Model:", patientData);
        const mlResponse = await axios.post(ML_API_URL, patientData);
        const { prediction, probability, risk_level } = mlResponse.data;

        // 2. Generate Explanation with Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        let prompt = "";

        if (role === 'doctor') {
            prompt = `
        You are a clinical decision support system reporting to a DOCTOR.
        
        Patient Data: ${JSON.stringify(patientData)}
        Model Prediction: ${risk_level} Risk (Probability: ${(probability * 100).toFixed(1)}%)
        
        Task: Provide a technical, data-driven clinical summary.
        Tone: Professional, precise, medical terminology.
        
        Required Output Sections (JSON keys):
        - clinical_summary: "${risk_level} risk (${(probability * 100).toFixed(1)}%). Significant markers: ...".
        - contributing_factors: List of specific metrics contributing to risk (e.g., "BMI: 31 (Obese class I)").
        - suggested_actions: Clinical next steps (e.g., "Confirmatory HbA1c", "Endocrinology referral").
        
        Format as JSON.
      `;
        } else {
            // Patient Prompt
            prompt = `
        You are a supportive medical assistant explaining health risks to a PATIENT.
        
        Patient Data: ${JSON.stringify(patientData)}
        Model Prediction: ${risk_level} Risk
        
        Task: Explain the health risk in simple, encouraging language.
        Tone: Compassionate, non-alarmist, clear.
        
        Required Output Sections (JSON keys):
        - explanation: "Your recent health indicators suggest a ${risk_level.toLowerCase()} chance... Main reasons..."
        - functional_advice: "What you can do..."
        - actionable_advice: List 3 simple steps (e.g., "Consult your doctor", "30 mins daily walk").
        
        Format as JSON.
      `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean JSON markdown if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');

        let aiInsights = {};
        try {
            aiInsights = JSON.parse(jsonStr);
        } catch (e) {
            console.error("JSON Parse Error on AI response:", text);
            aiInsights = {
                explanation: "Could not generate structured explanation.",
                raw_response: text
            };
        }

        return {
            risk_level,
            probability,
            role_context: role,
            ...aiInsights
        };

    } catch (error) {
        console.error("AI Service Error:", error.message);
        // Fallback if ML model is down but we want to test AI part (Mocking for dev)
        if (error.code === 'ECONNREFUSED') {
            return {
                error: "ML Service Unavailable",
                risk_level: "Unknown",
                explanation: "The risk analysis service is currently offline."
            }
        }
        throw new Error("Failed to generate risk assessment");
    }
};
