import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from waitress import serve

import utils

app = Flask(__name__)
CORS(app)

try:
    nations_data = joblib.load("lda_nations.pkl")
    groups_data = joblib.load("lda_groups.pkl")
except Exception as e:
    print(e)
    nations_data = None
    groups_data = None


@app.route('/nations/graph', methods=['GET'])
def get_nations_graph():
    return utils.get_generic_graph(nations_data)


@app.route('/groups/graph', methods=['GET'])
def get_groups_graph():
    return utils.get_generic_graph(groups_data)


@app.route('/nations/predict', methods=['GET'])
def predict_nation():
    res = utils.make_prediction(nations_data, request.args.get('name', 'User'), request.args.get('coords'))
    return jsonify(res) if res else (jsonify({"error": "Invalid data"}), 400)


@app.route('/groups/predict', methods=['GET'])
def predict_group():
    res = utils.make_prediction(groups_data, request.args.get('name', 'User'), request.args.get('coords'))
    return jsonify(res) if res else (jsonify({"error": "Invalid data"}), 400)


if __name__ == '__main__':
    print('mor2 ready!')
    serve(app, host='0.0.0.0', port=8080)
