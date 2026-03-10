import numpy as np
from flask import jsonify


def get_generic_graph(data):
    if not data: return jsonify({"error": "Data missing"}), 500
    return jsonify({
        "projections": data["base_projections"],
        "names": data["base_names"],
        "labels": data["base_labels"],
        "target_names": data["target_names"],
        "colors": data["colors"]
    })


def make_prediction(data, name, raw_coords):
    if not raw_coords or not data:
        return None
    try:
        coords = np.array([float(x) for x in raw_coords.split(',')]).reshape(1, -1)
        proj = (data["model"].transform(coords) - data["bias"])[0]
        pred_idx = int(data["model"].predict(coords)[0])
        result = {
            "name": name,
            "classification": data["target_names"][pred_idx]
        }
        if len(proj) == 1:
            result["ld1"] = float(proj[0])
        else:
            result["x"], result["y"] = float(proj[0]), float(proj[1])
        return result
    except Exception as e:
        print(f"Prediction error: {e}")
        return None
