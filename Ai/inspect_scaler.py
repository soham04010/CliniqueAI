import joblib
import sklearn
import numpy as np

print(f"Sklearn version: {sklearn.__version__}")

try:
    scaler = joblib.load('scaler.pkl')
    print("\n✅ Scaler Loaded Successfully")
    print(f"Type: {type(scaler)}")
    
    if hasattr(scaler, 'n_features_in_'):
        print(f"Number of features expected: {scaler.n_features_in_}")
    
    if hasattr(scaler, 'feature_names_in_'):
        print("\nExpected Feature Names (Order matters!):")
        for i, name in enumerate(scaler.feature_names_in_):
            print(f"{i}: {name}")
    else:
        print("\n⚠️ 'feature_names_in_' not found. Scaler was likely fitted on a numpy array or older sklearn version.")
        print("We must infer the order from the training code or assume standard order.")
        
    print(f"\nMean: {scaler.mean_}")
    print(f"Scale: {scaler.scale_}")

except Exception as e:
    print(f"❌ Error loading scaler: {e}")
