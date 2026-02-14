import joblib
import numpy as np
import sys

try:
    with open('scaler.pkl', 'rb') as f:
        scaler = joblib.load(f)

    with open('scaler_inspection.txt', 'w') as out:
        out.write("SCALER STATISTICS ANALYSIS\n")
        out.write("------------------------------------------------------------\n")
        
        means = scaler.mean_
        scales = scaler.scale_

        out.write(f"Number of Features: {len(means)}\n")
        out.write("\nIndex | Mean       | Scale      | Inference Guess\n")
        out.write("------+------------+------------+-----------------\n")
        
        for i, (m, s) in enumerate(zip(means, scales)):
            guess = "?"
            if m > 15 and m < 90 and s > 10: guess = "Age?"
            if m > 80 and m < 300: guess = "Glucose?"
            if m > 15 and m < 60 and s > 3 and s < 10: guess = "BMI?"
            if m > 3 and m < 10 and s < 3: guess = "HbA1c?"
            if m < 1.0: guess = "Binary"
            
            out.write(f"{i:5} | {m:10.4f} | {s:10.4f} | {guess}\n")

    print("Done writing to scaler_inspection.txt")

except Exception as e:
    print(f"Error: {e}")
