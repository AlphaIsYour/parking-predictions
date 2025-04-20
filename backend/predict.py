import sys
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import psycopg2
from psycopg2 import Error

def connect_db(db_url=None):
    try:
        if db_url:
            connection = psycopg2.connect(db_url)
        else:
            connection = psycopg2.connect(
                host="localhost",
                database="parkir_ub",
                user="postgres",
                password="password",
                port="5432"
            )
        return connection
    except Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        sys.exit(1)

def fetch_data_from_db(db_url=None):
    connection = connect_db(db_url)
    query = """
    SELECT 
        EXTRACT(HOUR FROM created_at) AS jam, 
        EXTRACT(DOW FROM created_at) AS hari, 
        kepadatan 
    FROM laporan_parkir
    """
    try:
        data = pd.read_sql_query(query, connection)
        connection.close()
        return data
    except Error as e:
        print(f"Error fetching data: {e}")
        sys.exit(1)

if len(sys.argv) < 2:
    print("Usage: python predict.py [train|predict] [hour] [day] [db_url (optional)]")
    sys.exit(1)

mode = sys.argv[1]

if mode == "train":

    db_url = sys.argv[2] if len(sys.argv) > 2 else None
    data = fetch_data_from_db(db_url)
    

    data['kepadatan'] = data['kepadatan'].map({'kosong': 0, 'ramai': 1, 'penuh': 2})
    
    X = data[['jam', 'hari']]
    y = data['kepadatan']
    
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X, y)
    
    joblib.dump(model, 'model_parkir.pkl')
    print("Model trained!")

elif mode == "predict":
    if len(sys.argv) < 4:
        print("Usage for predict: python predict.py predict [hour] [day] [db_url (optional)]")
        sys.exit(1)
    
    hour = int(sys.argv[2])
    day = int(sys.argv[3])
    db_url = sys.argv[4] if len(sys.argv) > 4 else None  
    
    model = joblib.load('model_parkir.pkl')
    prediction = model.predict([[hour, day]])[0]
    
    print(prediction)

else:
    print("Mode tidak valid. Pilih 'train' atau 'predict'")