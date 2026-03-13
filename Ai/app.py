from flask import Flask, request, jsonify
import pickle
import numpy as np
import joblib
import pandas as pd
import os
import logging
import requests 
from dotenv import load_dotenv
from flask_cors import CORS
from pydantic import BaseModel, ValidationError, Field, field_validator
from waitress import serve
from typing import Union

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables from .env file (Robust Path)
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

# Verify API Key Presence
api_key = os.getenv('GROQ_API_KEY')
if api_key:
    logger.info("✅ GROQ API Key detected from .env")
else:
    logger.warning("⚠️ GROQ API Key NOT found in environment. Fallback mode active.")

app = Flask(__name__)
CORS(app) # Enable CORS for all routes (Production Requirement)

# --- Uptime Robot Health Check Route ---
@app.route('/', methods=['GET', 'HEAD'])
def health_check():
    """Simple route to keep Render instance awake via Uptime Robot."""
    return jsonify({
        "status": "online", 
        "message": "CliniqueAI Python Engine is awake."
    }), 200

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

# --- Smarter Pydantic Model ---
class PredictInput(BaseModel):
    # Accept either Int or String from Node.js
    gender: Union[int, str] 
    age: float = Field(..., ge=0, le=120)
    hypertension: int = Field(..., ge=0, le=1)
    heart_disease: int = Field(..., ge=0, le=1)
    bmi: float = Field(..., ge=10, le=100)
    HbA1c_level: float = Field(..., ge=3, le=20)
    blood_glucose_level: int = Field(..., ge=50, le=500)
    
    # Accept the raw string from Node.js (e.g., "never", "former")
    smoking_history: str = "never"

    # Convert String Gender to Integer
    @field_validator('gender')
    @classmethod
    def parse_gender(cls, v):
        if isinstance(v, str):
            return 1 if v.lower() == 'male' else 0
        return v

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. Validate & Parse Input using Pydantic
        body = request.get_json()
        input_data = PredictInput(**body)
        
        # 2. Translate "smoking_history" string into the 5 One-Hot fields the Model Needs
        smoke_curr = 1 if input_data.smoking_history == "current" else 0
        smoke_ever = 1 if input_data.smoking_history == "ever" else 0
        smoke_former = 1 if input_data.smoking_history == "former" else 0
        smoke_never = 1 if input_data.smoking_history == "never" else 0
        smoke_not_curr = 1 if input_data.smoking_history == "not current" else 0
        
        # 3. Extract Validated Data in Exact Order for Scaler
        feature_data = {
            "gender": [input_data.gender],
            "age": [input_data.age],
            "hypertension": [input_data.hypertension],
            "heart_disease": [input_data.heart_disease],
            "bmi": [input_data.bmi],
            "HbA1c_level": [input_data.HbA1c_level],
            "blood_glucose_level": [input_data.blood_glucose_level],
            "smoking_history_current": [smoke_curr],
            "smoking_history_ever": [smoke_ever],
            "smoking_history_former": [smoke_former],
            "smoking_history_never": [smoke_never],
            "smoking_history_not current": [smoke_not_curr]
        }

        # Create DataFrame with valid feature names
        features_df = pd.DataFrame(feature_data)

        logger.info(f"Predicting for Features: {features_df.to_dict(orient='records')[0]}")

        if model and scaler:
            # Transform using DataFrame to preserve feature names
            features_scaled = scaler.transform(features_df)
            prediction = model.predict(features_scaled)
            probability = model.predict_proba(features_scaled)[0][1]
            score = float(probability) * 100 
        else:
            logger.warning("Model/Scaler missing. Using fallback logic.")
            # Simple fallback based on BMI/Glucose
            score = 15.0 + (input_data.bmi/2) if input_data.blood_glucose_level < 140 else 85.0
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
    ### CLINICAL SPECIALIZATION: DIABETES ONLY ###
    You are an AI Clinical Co-Pilot specialized EXCLUSIVELY in DIABETES risk assessment.
    
    ### MANDATORY GUARDRAILS:
    - DISALLOW ANY OTHER DISEASE: If asked about Cancer, Heart Disease, Flu, Or ANY condition other than Diabetes, you MUST respond: "I am specialized only in Diabetes risk analysis and do not have data to evaluate other conditions."
    - DATA IS DIABETES-SPECIFIC: The 'Risk Score' and 'Vitals' provided are ONLY for Diabetes. Never associate them with other diseases.
    - NO HALLUCINATIONS: Do not provide news, general facts, or anything not in the patient's data.

    ### PATIENT DATA (DIABETES):
    Name: {context.get('name', 'Unknown')}
    Diabetes Risk Score: {context.get('prediction', {}).get('riskScore', 'N/A')}%
    Diabetes Risk Level: {context.get('prediction', {}).get('riskLevel', 'N/A')}
    
    ### DIABETES VITALS:
    BMI: {context.get('inputs', {}).get('bmi', 'N/A')}
    Glucose: {context.get('inputs', {}).get('blood_glucose_level', 'N/A')}
    HbA1c: {context.get('inputs', {}).get('HbA1c_level', 'N/A')}
    Smoking: {context.get('inputs', {}).get('smoking_history', 'N/A')}

    Prediction Confidence: {context.get('prediction', {}).get('confidenceLabel', 'N/A')}
    History: {history_text}
    
    User Query: {user_message}
    
<<<<<<< Updated upstream
    STRICT BOUNDARY:
    - Only answer questions related to the provided patient data, clinical indicators, or medical practice.
    - If the query is unrelated (e.g., general knowledge, jokes, programming, politics, or non-medical topics), you MUST respond with: "As a specialized Clinical Co-Pilot, I am restricted to providing insights on medical data and patient clinical context only."
    - Provide extremely short, bulleted answers. Max 2-3 sentences. Focus strictly on key insights. No filler words.
=======
    ### RESPONSE FORMAT:
    - Bullet points only.
    - Max 2-3 sentences.
    - Focus on Glucose and BMI trends related to Diabetes.
>>>>>>> Stashed changes
    """

    # --- PATIENT PERSONA ---
    patient_prompt = f"""
    ### HEALTH ASSISTANT ROLE: DIABETES SPECIALIST ###
    You are a friendly AI Diabetes Health Assistant talking directly to the patient, {context.get('name', 'friend')}.
    
    ### CRITICAL RULES:
    1. YOUR DATA IS ONLY ABOUT DIABETES. 
    2. REJECT NON-DIABETES QUERIES: If the user asks about cancer or other diseases, politely say you can only help with diabetes risk and they should see a doctor for other concerns.
    3. NEVER tell the patient they have a risk of cancer based on this score.

    ### DIABETES DATA:
    Risk Score: {context.get('prediction', {}).get('riskScore', 'N/A')}%
    Risk Level: {context.get('prediction', {}).get('riskLevel', 'N/A')}
    BMI: {context.get('inputs', {}).get('bmi', 'N/A')}
    Glucose: {context.get('inputs', {}).get('blood_glucose_level', 'N/A')}
    HbA1c: {context.get('inputs', {}).get('HbA1c_level', 'N/A')}
<<<<<<< Updated upstream
    Smoking: {context.get('inputs', {}).get('smoking_history', 'N/A')}

    STRICT BOUNDARY:
    - Only answer questions regarding your health data, vitals, or medical wellness.
    - If the user asks anything unrelated to their health (e.g., casual talk, non-medical advice, trivia), politely respond: "I am specifically designed to assist with your health management. Please ask me about your vitals or risk factors."
    
    YOUR GUIDELINES:
    1. Tone: Warm but very direct.
    2. Length: Max 2-3 short sentences. No fluff.
    3. Focus: One key insight or action.

    User Query: {user_message}
=======
>>>>>>> Stashed changes
    
    User Query: {user_message}
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
            "model": "openai/gpt-oss-120b",
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