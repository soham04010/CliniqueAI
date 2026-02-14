from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

# Load Model & Scaler
try:
    with open('diabetes_model.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✅ Model Loaded")
    
    with open('scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    print("✅ Scaler Loaded")
except Exception as e:
    print(f"❌ Error loading model/scaler: {e}")
    model = None
    scaler = None

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not scaler:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.json
        # Expected features based on inspection (order matters!)
        # We will parse features from json.
        # Ensure the frontend sends them in this EXACT order or we map them here.
        
        features = [
            data.get('HighBP', 0),
            data.get('HighChol', 0),
            data.get('CholCheck', 0),
            data.get('BMI', 0),
            data.get('Smoker', 0),
            data.get('Stroke', 0),
            data.get('HeartDiseaseorAttack', 0),
            data.get('PhysActivity', 0),
            data.get('Fruits', 0),
            data.get('Veggies', 0),
            data.get('HvyAlcoholConsump', 0),
            data.get('GenHlth', 0),
            data.get('MentHlth', 0),
            data.get('PhysHlth', 0),
            data.get('DiffWalk', 0),
            data.get('Sex', 0),
            data.get('Age', 0),
            data.get('Education', 0),
            data.get('Income', 0)
        ]
        # Wait, I need to know the EXACT 12 features. I will update this file after reading output.txt
        # For now, this is a placeholder structure.
        
        final_features = np.array([features])
        scaled_features = scaler.transform(final_features)
        prediction = model.predict(scaled_features)
        probability = model.predict_proba(scaled_features)[0][1] # Probability of Class 1 (Diabetes)

        return jsonify({
            'prediction': int(prediction[0]),
            'probability': float(probability),
            'risk_level': "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low"
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(port=5001, debug=True)
