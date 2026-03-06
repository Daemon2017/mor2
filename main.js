    let ldaModel;
    let mainTraces = [];
    window.onload = init;
    async function init() {
        const status = document.getElementById('result');
        try {
            const erzyaSci = await fetchCSV('data/erzya_science.csv');
            const mokshaSci = await fetchCSV('data/moksha_science.csv');
            const X = [...erzyaSci.coords, ...mokshaSci.coords];
            const y = [...Array(erzyaSci.coords.length).fill(0), ...Array(mokshaSci.coords.length).fill(1)];
            ldaModel = new LDA(X, y);
            mainTraces = [
                createTrace(ldaModel.project(erzyaSci.coords), erzyaSci.names, 'Эрзя (Science)', 'rgba(0, 50, 255, 1)', 10, 'diamond'),
                createTrace(ldaModel.project(mokshaSci.coords), mokshaSci.names, 'Мокша (Science)', 'rgba(255, 0, 0, 1)', 10, 'diamond')
            ];
            await tryAddServerUserFile('data/erzya_custom.csv', 'Эрзя (Custom)', 'rgba(0, 80, 255, 0.2)');
            await tryAddServerUserFile('data/moksha_custom.csv', 'Мокша (Custom)', 'rgba(255, 50, 50, 0.2)');
            updateGraph();
            status.innerText = "✅ Файлы с эталонами успешнно загружены.";
        } catch (err) {
            status.innerText = "❌ Ошибка загрузки файлов с эталонами.";
            console.error(err);
        }
    }

    function addUserSample() {
        const input = document.getElementById('userData').value.trim();
        if (!input) return;
        const parts = input.split(',');
        const name = parts[0];
        const coords = parts.slice(1).map(Number);
        if (coords.length < 25) {
            alert("Нужно 25 координат!");
            return;
        }
        const proj = ldaModel.project([coords]);
        const pred = ldaModel.predict([coords]);
        const label = pred[0] === 0 ? "Эрзя" : "Мокша";
        mainTraces.push({
            x: [proj[0]],
            y: [0.1],
            mode: 'markers+text',
            name: `User: ${name}`,
            text: [name],
            hovertemplate: '<b>%{text}</b><extra></extra>',
            textposition: 'top center',
            marker: {
                color: 'black',
                size: 14,
                symbol: 'star'
            }
        });
        updateGraph();
        document.getElementById('result').innerText = `📊 Результат: ${name} классифицирован как ${label}`;
    }
    async function fetchCSV(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const text = await res.text();
        const parsed = Papa.parse(text, {
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;
        return {
            names: parsed.map(r => r[0]),
            coords: parsed.map(r => r.slice(1))
        };
    }
    async function tryAddServerUserFile(url, name, color) {
        try {
            const data = await fetchCSV(url);
            const projs = ldaModel.project(data.coords);
            mainTraces.push(createTrace(projs, data.names, name, color, 6, 'circle'));
        } catch (e) {}
    }

    function createTrace(xArr, names, groupName, color, size, symbol = 'circle') {
        return {
            x: xArr,
            y: xArr.map(() => (Math.random() - 0.5) * 0.5),
            mode: 'markers',
            name: groupName,
            text: names,
            hovertemplate: '<b>%{text}</b><extra></extra>',
            marker: {
                color,
                size,
                symbol
            }
        };
    }

    function updateGraph() {
        const allX = mainTraces.flatMap(t => t.x);
        const maxVal = Math.max(...allX.map(Math.abs));
        const rangeVal = maxVal * 1.10;
        const layout = {
            title: 'Генетическая граница: Эрзя (слева) vs Мокша (справа)',
            xaxis: {
                title: 'Смещение относительно границы (LD1)',
                range: [-rangeVal, rangeVal],
                zeroline: true,
                zerolinecolor: '#000',
                zerolinewidth: 2,
                gridcolor: '#eee'
            },
            yaxis: {
                showticklabels: false,
                range: [-0.3, 0.3],
                fixedrange: true,
                zeroline: true,
                zerolinecolor: '#ccc'
            },
            legend: {
                orientation: 'h',
                yanchor: 'center',
                y: -0.2,
                xanchor: 'center',
                x: 0.75
            },
            hovermode: 'closest',
            plot_bgcolor: '#fff',
            paper_bgcolor: '#fff',
            margin: { t: 80, b: 80, l: 50, r: 50 }
        };

        Plotly.newPlot('graph', mainTraces, layout, { responsive: true });
    }