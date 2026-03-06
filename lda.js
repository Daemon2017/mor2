class LDA {
    constructor(X, y) {
        const class0 = X.filter((_, i) => y[i] === 0);
        const class1 = X.filter((_, i) => y[i] === 1);

        this.mean0 = this._getMean(class0);
        this.mean1 = this._getMean(class1);

        const dim = X[0].length;
        this.weights = new Array(dim).fill(0);

        for (let i = 0; i < dim; i++) {
            this.weights[i] = this.mean1[i] - this.mean0[i];
        }

        const p0_all = class0.map(s => this._projectOne(s));
        const p1_all = class1.map(s => this._projectOne(s));

        const maxP0 = Math.max(...p0_all);
        const minP1 = Math.min(...p1_all);

        this.threshold = (maxP0 + minP1) / 2;
    }

    project(samples) {
        return samples.map(s => this._projectOne(s) - this.threshold);
    }

    predict(samples) {
        return samples.map(s => (this._projectOne(s) - this.threshold < 0 ? 0 : 1));
    }

    _projectOne(sample) {
        return sample.reduce((sum, val, i) => sum + val * this.weights[i], 0);
    }

    _getMean(data) {
        if (data.length === 0) return [];
        const dim = data[0].length;
        const mean = new Array(dim).fill(0);
        data.forEach(row => row.forEach((v, i) => {
            if (i < dim) mean[i] += v;
        }));
        return mean.map(v => v / data.length);
    }
}
