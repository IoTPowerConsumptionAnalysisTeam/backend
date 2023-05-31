from keras.models import load_model
import numpy as np
import os
import json
import joblib
import sys

predict_time = int(sys.argv[1])

model = load_model(os.path.join('ai', 'model.h5'))
scaler = joblib.load(os.path.join('ai', 'scaler.save')) 

data = None
with open(os.path.join('data', 'data.json'), 'r') as f:
    data = json.load(f)

predicted = []
for i in range(predict_time):
    x = []
    for d in predicted[-60:]:
        x.append(d)
    if len(x) < 60:
        for i in data[-1 : -60 + len(x) - 1 : -1]:
            x.insert(0, i)
    if len(x) < 60:
        for i in range(60 - len(x)):
            x.insert(0, 0)
    x = np.array(x)
    x = scaler.transform(x.reshape(-1, 1))
    x = x.reshape(1, 1, 60)
    y = model.predict(x, verbose=0)
    predicted.append(scaler.inverse_transform(y)[0][0])

sum = 0
for i in predicted:
    sum += i
print(sum)