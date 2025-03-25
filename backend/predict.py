import sys
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

if len(sys.argv) < 2:
    print("Usage: python predict.py [train|predict] [hour] [day]")
    sys.exit(1)

mode = sys.argv[1]

if mode == "train":
    # Training code
    data = pd.read_csv('../data/data_historikal.csv')
    data['kepadatan'] = data['kepadatan'].map({'kosong':0, 'ramai':1, 'penuh':2})
    X = data[['jam', 'hari']]
    y = data['kepadatan']
    
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X, y)
    
    joblib.dump(model, 'model_parkir.pkl')
    print("Model trained!")

elif mode == "predict":
    # Prediction code
    hour = int(sys.argv[2])
    day = int(sys.argv[3])
    
    model = joblib.load('model_parkir.pkl')
    prediction = model.predict([[hour, day]])[0]
    
    print(prediction)

else:
    print("Mode tidak valid. Pilih 'train' atau 'predict'")