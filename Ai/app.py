from flask import Flask, request, jsonify
import pickle
import numpy as np
import joblib
import os
import logging
import requests 
from dotenv import load_dotenv
from flask_cors import CORS
from pydantic import BaseModel, ValidationError, Field
from waitress import serve

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv() # Load environment variables from .env file

app = Flask(__name__)
CORS(app) # Enable CORS for all routes (Production Requirement)

# Load Model
try:
    with open('diabetes_model.pkl', 'rb') as f:
        model = joblib.load(f)
    logger.info("✅ AI Model Loaded (Expects 12 Features)")
except Exception as e:
    logger.error(f"❌ Error loading model: {e}")
    model = None

# Load Scaler
try:
    with open('scaler.pkl', 'rb') as f:
        scaler = joblib.load(f)
    logger.info("✅ Scaler Loaded")
except Exception as e:
    logger.error(f"❌ Scaler Load Failed: {e}")
    scaler = None

# --- Pydantic Models for Validation ---
class PredictInput(BaseModel):
    gender: str = Field(..., pattern="^(Male|Female)$")
    age: float = Field(..., ge=0, le=120)
    hypertension: int = Field(..., ge=0, le=1)
    heart_disease: int = Field(..., ge=0, le=1)
    smoking_history: str = Field(..., pattern="^(current|ever|former|never|not current|No Info)$")
    bmi: float = Field(..., ge=10, le=100)
    HbA1c_level: float = Field(..., ge=3, le=20)
    blood_glucose_level: int = Field(..., ge=50, le=500)

class CopilotInput(BaseModel):
    message: str
    context: dict
    role: str = "doctor"

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "CliniqueAI-Model"}), 200

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. Validate Input using Pydantic
        body = request.get_json()
        input_data = PredictInput(**body)
        
        # 2. Extract Validated Data
        gender = input_data.gender
        age = input_data.age
        hypertension = input_data.hypertension
        heart_disease = input_data.heart_disease
        smoking = input_data.smoking_history
        bmi = input_data.bmi
        hba1c = input_data.HbA1c_level
        glucose = input_data.blood_glucose_level

        logger.info(f"Predicting for: Age={age}, BMI={bmi}, Glucose={glucose}")

        # TRANSFORM TO 12 FEATURES (One-Hot Encoding Logic)
        gender_male = 1 if gender == 'Male' else 0
        
        smoke_current = 1 if smoking == 'current' else 0
        smoke_ever = 1 if smoking == 'ever' else 0
        smoke_former = 1 if smoking == 'former' else 0
        smoke_never = 1 if smoking == 'never' else 0
        smoke_not_current = 1 if smoking == 'not current' else 0

        features = [
            gender_male, age, hypertension, heart_disease, bmi, hba1c, glucose, 
            smoke_current, smoke_ever, smoke_former, smoke_never, smoke_not_current
        ]

        if model and scaler:
            features_arr = np.array([features])
            features_scaled = scaler.transform(features_arr)
            prediction = model.predict(features_scaled)
            probability = model.predict_proba(features_scaled)[0][1]
            score = float(probability) * 100 
        else:
            logger.warning("Model/Scaler missing. Using fallback logic.")
            score = 15.0 + (bmi/2) if glucose < 140 else 85.0
            prediction = [1] if score > 50 else [0]
            probability = score / 100

        return jsonify({
            'prediction': int(prediction[0]),
            'probability': float(probability),
            'risk_score': float(score),
            'risk_level': "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low",
            'confidence_score': round(abs(float(probability) - 0.5) * 2, 2),
            'confidence_label': "High" if abs(float(probability) - 0.5) * 2 >= 0.7 else "Moderate" if abs(float(probability) - 0.5) * 2 >= 0.4 else "Low"
        })

    except ValidationError as e:
        logger.error(f"Validation Error: {e.errors()}")
        return jsonify({'error': "Invalid Input Data", 'details': e.errors()}), 422
    except Exception as e:
        logger.error(f"Prediction Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/copilot', methods=['POST'])
def copilot():
    data = request.json
    user_message = data.get('message', '')
    context = data.get('context', {})
    
    api_key = os.getenv('GROQ_API_KEY')
    
    # Format History if available
    history_text = "No historical data available."
    if 'history' in context and context['history']:
        history_text = ""
        for record in context['history']:
            date = record.get('createdAt', 'Unknown Date')[:10]
            score = record.get('prediction', {}).get('riskScore', 'N/A')
            history_text += f"- Date: {date}, Risk Score: {score}%\n"

    role = data.get('role', 'doctor') # Default to doctor if not specified

    # --- DOCTOR PERSONA ---
    doctor_prompt = f"""
    You are an AI Clinical Co-Pilot assisting a doctor.
    You are NOT diagnosing, but interpreting AI risk predictions based on structured data.
    
    PATIENT CONTEXT:
    Name: {context.get('name', 'Unknown')}
    Risk Score: {context.get('prediction', {}).get('riskScore', 'N/A')}%
    Risk Level: {context.get('prediction', {}).get('riskLevel', 'N/A')}
    
    VITALS:
    BMI: {context.get('inputs', {}).get('bmi', 'N/A')}
    Glucose: {context.get('inputs', {}).get('blood_glucose_level', 'N/A')}
    HbA1c: {context.get('inputs', {}).get('HbA1c_level', 'N/A')}
    Smoking: {context.get('inputs', {}).get('smoking_history', 'N/A')}

    PREDICTION CONFIDENCE: {context.get('prediction', {}).get('confidenceLabel', 'N/A')} (Score: {context.get('prediction', {}).get('confidenceScore', 'N/A')})

    RISK HISTORY (Trend Analysis):
    {history_text}
    
    User Query: {user_message}
    
    Provide extremely short, bulleted answers. Max 2-3 sentences. Focus strictly on key insights. No filler words.
    """

    # --- PATIENT PERSONA ---
    patient_prompt = f"""
    You are a friendly, empathetic AI Health Assistant talking directly to the patient, {context.get('name', 'friend')}.
    Your goal is to explain their health data simply, without causing alarm, and motivate positive lifestyle changes.

    PATIENT DATA:
    Risk Score: {context.get('prediction', {}).get('riskScore', 'N/A')}% (This is a statistical estimate, not a diagnosis)
    Risk Level: {context.get('prediction', {}).get('riskLevel', 'N/A')}
    
    VITALS:
    BMI: {context.get('inputs', {}).get('bmi', 'N/A')}
    Glucose: {context.get('inputs', {}).get('blood_glucose_level', 'N/A')}
    HbA1c: {context.get('inputs', {}).get('HbA1c_level', 'N/A')}
    Smoking: {context.get('inputs', {}).get('smoking_history', 'N/A')}

    YOUR GUIDELINES:
    1. Tone: Warm but very direct.
    2. Length: Max 2-3 short sentences. No fluff.
    3. Focus: One key insight or action.

    User Query: {user_message}
    
    Response:
    """

    # Select Prompt based on Role
    system_prompt = doctor_prompt if role == 'doctor' else patient_prompt

    if not api_key:
        # FALLBACK MOCK RESPONSE (If no API Key)
        reply = "⚠️ **System Note:** No LLM API Key found. Returning rule-based response.\n\n"
        
        if role == 'patient':
             if "risk" in user_message.lower():
                reply += f"Your current health data suggests a **{context.get('prediction', {}).get('riskLevel', 'Unknown')}** risk level. This is mainly influenced by weight and sugar levels."
             elif "trend" in user_message.lower():
                reply += "Your health indicators have been fluctuating. It's a great time to focus on consistent healthy habits."
             elif "interven" in user_message.lower():
                reply += "Here are a few steps you can take:\n1. Try a 15-minute walk daily.\n2. Swap sugary drinks for water.\n3. Keep track of your meals."
             else:
                reply += "I'm here to help you understand your health. Ask me about your risk factors or simple steps to improve."
        else:
            # DOCTOR FALLBACK
            if "risk" in user_message.lower():
                reply += f"The patient has a **{context.get('prediction', {}).get('riskLevel', 'Unknown')}** risk of diabetes ({context.get('prediction', {}).get('riskScore', 0)}%). Major drivers likely include BMI ({context.get('inputs', {}).get('bmi')}) and Glucose levels."
            elif "trend" in user_message.lower():
                reply += "Risk capability is increasing. Monitor HbA1c trends closely over the next 3 months."
            elif "interven" in user_message.lower():
                reply += "Suggested interventions: \n1. Lifestyle modification (Diet/Exercise).\n2. Regular Glucose monitoring.\n3. Smoking cessation if applicable."
            else:
                reply += "I am ready to analyze this patient. Please ask about Risk, Trends, or Interventions."
            
        return jsonify({'reply': reply})

    try:
        # CALL GROQ API
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.5,
            "max_tokens": 500
        }
        
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
        
        if response.status_code == 200:
            ai_reply = response.json()['choices'][0]['message']['content']
            return jsonify({'reply': ai_reply})
        else:
            return jsonify({'reply': f"LLM Error: {response.text}"})

    except Exception as e:
        return jsonify({'reply': f"Error generating insight: {str(e)}"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    logger.info(f"🚀 Starting Production Server on Port {port}")
    serve(app, host="0.0.0.0", port=port)
