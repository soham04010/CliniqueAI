from flask import Flask, request, jsonify
import pickle
import numpy as np
import joblib
import os
import requests 
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

app = Flask(__name__)

# Load Model & Scaler
try:
    with open('diabetes_model.pkl', 'rb') as f:
        model = joblib.load(f)
    print("✅ AI Model Loaded (Expects 12 Features)")
except Exception as e:
    print(f"❌ Error loading model/scaler: {e}")
    model = None
    scaler = None

try:
    with open('scaler.pkl', 'rb') as f:
        scaler = joblib.load(f)
    print("✅ Scaler Loaded")
except Exception as e:
    print(f"❌ Scaler Load Failed: {e}")
    scaler = None

# Load Scaler
print("⏳ Loading Scaler...")
try:
    with open('scaler.pkl', 'rb') as f:
        scaler = joblib.load(f)
    print("✅ Scaler Loaded")
except Exception as e:
    print(f"❌ Scaler Load Failed: {e}")
    scaler = None

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    
    # INPUTS (8 Raw Features)
    gender = data.get('gender', 'Female')
    age = float(data.get('age', 0))
    hypertension = int(data.get('hypertension', 0))
    heart_disease = int(data.get('heart_disease', 0))
    smoking = data.get('smoking_history', 'No Info')
    bmi = float(data.get('bmi', 0))
    hba1c = float(data.get('HbA1c_level', 0))
    glucose = int(data.get('blood_glucose_level', 0))

    # TRANSFORM TO 12 FEATURES (One-Hot Encoding Logic)
    # 1. gender_Male (Male=1, Female=0)
    gender_male = 1 if gender == 'Male' else 0
    
    # 2. Smoking Categories (Reference: 'No Info' is 0 for all)
    smoke_current = 1 if smoking == 'current' else 0
    smoke_ever = 1 if smoking == 'ever' else 0
    smoke_former = 1 if smoking == 'former' else 0
    smoke_never = 1 if smoking == 'never' else 0
    smoke_not_current = 1 if smoking == 'not current' else 0

    # FINAL FEATURE ARRAY (12 Columns)
    # Corrected Order based on Scaler Analysis:
    # gender, age, hypertension, heart_disease, bmi, HbA1c, glucose, 
    # smoke_current, smoke_ever, smoke_former, smoke_never, smoke_not_current
    features = [
        gender_male,
        age, 
        hypertension, 
        heart_disease, 
        bmi, 
        hba1c, 
        glucose, 
        smoke_current, 
        smoke_ever, 
        smoke_former, 
        smoke_never, 
        smoke_not_current
    ]

    try:
        if model and scaler:
            features_arr = np.array([features])
            
            # SCALING INPUT
            features_scaled = scaler.transform(features_arr)
            
            prediction = model.predict(features_scaled)
            probability = model.predict_proba(features_scaled)[0][1]
            score = float(probability) * 100 # Exact score, no rounding
        else:
            # Fallback Logic
            score = 15.0 + (bmi/2) if glucose < 140 else 85.0

        return jsonify({
            'prediction': int(prediction[0]),
            'probability': float(probability),
            'risk_score': float(score),
            'risk_level': "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low"
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

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

    # SYSTEM PROMPT
    system_prompt = f"""
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

    RISK HISTORY (Trend Analysis):
    {history_text}
    
    User Query: {user_message}
    
    Provide a professional, concise clinical response.
    """

    if not api_key:
        # FALLBACK MOCK RESPONSE (If no API Key)
        reply = "⚠️ **System Note:** No LLM API Key found. Returning rule-based response.\n\n"
        
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
            "max_tokens": 1024
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
    app.run(port=5001, debug=True)
