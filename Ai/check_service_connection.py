import requests
import json

url = 'http://127.0.0.1:5001/predict'

# Sample data based on app.py expectations
data = {
    'gender': 'Male',
    'age': 45,
    'hypertension': 0,
    'heart_disease': 0,
    'smoking_history': 'never',
    'bmi': 28.5,
    'HbA1c_level': 5.7,
    'blood_glucose_level': 100
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=data)
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ Success! Response received:")
        print(json.dumps(result, indent=2))
        
        if 'prediction' in result and 'probability' in result:
             print("\n✅ Verification Passed: Model returned prediction and probability.")
        else:
             print("\n⚠️ Verification Warning: Response format unexpected.")
    else:
        print(f"\n❌ Request failed with status code: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"\n❌ Connection Error: {e}")
    print("Ensure app.py is running on port 5001.")
