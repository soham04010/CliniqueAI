from flask import Flask, request, jsonify
import pickle
import numpy as np

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
    # Order: age, hypertension, heart_disease, bmi, HbA1c, glucose, 
    #        gender_Male, smoke_current, smoke_ever, smoke_former, smoke_never, smoke_not_current
    features = [
        age, 
        hypertension, 
        heart_disease, 
        bmi, 
        hba1c, 
        glucose, 
        gender_male,
        smoke_current, 
        smoke_ever, 
        smoke_former, 
        smoke_never, 
        smoke_not_current
    ]

    try:
        if model:
            features_arr = np.array([features])
            prediction = model.predict(features_arr)
            probability = model.predict_proba(features_arr)[0][1]
            score = float(probability) * 100 # Exact score, no rounding
        else:
            # Fallback Logic
            score = 15.0 + (bmi/2) if glucose < 140 else 85.0

        return jsonify({
            'prediction': int(prediction[0]),
            'probability': float(probability),
            'risk_level': "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low"
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(port=5001, debug=True)
