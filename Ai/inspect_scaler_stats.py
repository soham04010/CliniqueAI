import joblib
import numpy as np

try:
    with open('scaler.pkl', 'rb') as f:
        scaler = joblib.load(f)

    print("\n------------------------------------------------------------")
    print("SCALER STATISTICS ANALYSIS")
    print("------------------------------------------------------------")
    
    means = scaler.mean_
    scales = scaler.scale_

    print(f"Number of Features: {len(means)}")
    print("\nIndex | Mean       | Scale      | Inference Guess")
    print("------+------------+------------+-----------------")
    
    for i, (m, s) in enumerate(zip(means, scales)):
        guess = "?"
        if m > 20 and m < 80 and s > 10: guess = "Age?"
        if m > 100: guess = "Glucose?"
        if m > 15 and m < 40 and s > 3 and s < 10: guess = "BMI?"
        if m > 4 and m < 9 and s < 2: guess = "HbA1c?"
        if m < 1.0: guess = "Binary (Gender/Hyp/Heart/Smoke)?"
        
        print(f"{i:5} | {m:10.4f} | {s:10.4f} | {guess}")

except Exception as e:
    print(f"Error: {e}")
