import joblib
import numpy as np
import sys

try:
    with open('scaler.pkl', 'rb') as f:
        scaler = joblib.load(f)

    with open('scaler_stats_utf8.txt', 'w', encoding='utf-8') as f_out:
        f_out.write("SCALER STATISTICS ANALYSIS\n")
        f_out.write("------------------------------------------------------------\n")
        
        means = scaler.mean_
        scales = scaler.scale_

        f_out.write(f"Number of Features: {len(means)}\n")
        f_out.write("Index | Mean       | Scale      | Inference Guess\n")
        f_out.write("------+------------+------------+-----------------\n")
        
        for i, (m, s) in enumerate(zip(means, scales)):
            guess = "?"
            if m > 20 and m < 80 and s > 10: guess = "Age?"
            if m > 100: guess = "Glucose?"
            if m > 15 and m < 40 and s > 3 and s < 10: guess = "BMI?"
            if m > 4 and m < 9 and s < 2: guess = "HbA1c?"
            if m < 1.0: guess = "Binary (Gender/Hyp/Heart/Smoke)?"
            
            f_out.write(f"{i:5} | {m:10.4f} | {s:10.4f} | {guess}\n")

    print("Successfully wrote to scaler_stats_utf8.txt")

except Exception as e:
    print(f"Error: {e}")
