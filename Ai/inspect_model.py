import pickle
import warnings
warnings.filterwarnings("ignore")

try:
    with open('diabetes_model.pkl', 'rb') as f:
        model = pickle.load(f)
    
    if hasattr(model, 'feature_names_in_'):
        print("FEATURES_START")
        print(list(model.feature_names_in_))
        print("FEATURES_END")
    else:
        print("NO_FEATURE_NAMES")
        print(f"Expected Features: {model.n_features_in_}")

except Exception as e:
    print(f"ERROR: {e}")
