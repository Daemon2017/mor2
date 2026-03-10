import os

import joblib
import numpy as np
import pandas as pd
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis


def load_csv(path):
    if not os.path.exists(path):
        print(f"Файл не найден: {path}")
        return [], np.empty((0, 25))
    df = pd.read_csv(path, header=None)
    return df.iloc[:, 0].values.tolist(), df.iloc[:, 1:26].values


def build_model(output_name, train_groups, n_components=1, train_colors=None):
    print('Строим модель...')
    train_names, train_coords, train_labels = [], [], []
    train_target_names = list(train_groups.keys())
    for idx, (name, paths) in enumerate(train_groups.items()):
        paths = [paths] if isinstance(paths, str) else paths
        for p in paths:
            n, c = load_csv(p)
            if n:
                train_names.extend(n)
                train_coords.append(c)
                train_labels.extend([idx] * len(n))
    X_train = np.vstack(train_coords)
    y_train = np.array(train_labels)
    lda = LinearDiscriminantAnalysis(n_components=n_components)
    lda.fit(X_train, y_train)
    exp_var = lda.explained_variance_ratio_ * 100
    for i, var in enumerate(exp_var):
        print(f"Ось {i + 1}: {var:.2f}% дисперсии")
    proj_means = lda.transform(lda.means_)
    bias = np.mean(proj_means, axis=0)
    projs_raw = lda.transform(X_train) - bias
    projs = projs_raw.flatten().tolist() if n_components == 1 else projs_raw.tolist()
    final_colors = (train_colors or ["#0000FF"] * len(train_target_names))
    payload = {
        "model": lda,
        "bias": bias.tolist(),
        "target_names": train_target_names,
        "base_projections": projs,
        "base_names": train_names,
        "base_labels": train_labels,
        "colors": final_colors
    }
    joblib.dump(payload, output_name)


if __name__ == "__main__":
    build_model(
        output_name="lda_nations.pkl",
        n_components=1,
        train_groups={
            "Эрзя": "data/erzya_all.csv",
            "Мокша": "data/moksha_all.csv"
        },
        train_colors=["#0000FF", "#FF0000"],
    )
    build_model(
        output_name="lda_groups.pkl",
        n_components=2,
        train_groups={
            "Мокша": "data/Moksha.csv",
            "Эрзя Зап-Юг": "data/ErzyaWestSouth.csv",
            "Эрзя Вост-Юг": "data/ErzyaEastSouth.csv",
            "Эрзя Зап-Центр": "data/ErzyaWestMiddle.csv",
            "Эрзя Вост-Центр": "data/ErzyaEastMiddle.csv",
        },
        train_colors=["#FF0000", "#00BFFF", "#0000FF", "#27AEB9", "#191970"],
    )
