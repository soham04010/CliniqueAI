import joblib
import sklearn
import numpy as np

try:
    scaler = joblib.load('scaler.pkl')
    print(f"Scaler type: {type(scaler)}")
    
    if hasattr(scaler, 'n_features_in_'):
        print(f"Expected number of features: {scaler.n_features_in_}")
    
    if hasattr(scaler, 'feature_names_in_'):
        print("Feature names found:")
        print(scaler.feature_names_in_)
    else:
        print("No feature names stored in scaler.")
        
    print(f"Mean: {scaler.mean_}")
    print(f"Scale: {scaler.scale_}")

except Exception as e:
    print(f"Error: {e}")
