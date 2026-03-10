let mainTraces = [];
let currentTab = 'nations';
const API_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:8080'
    : 'https://bbau9gd7dc5gd2g15t1h.containers.yandexcloud.net';

window.onload = init;

async function switchTab(tab) {
    if (currentTab === tab) return;
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn =>
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tab))
    );
    await init();
}

async function init() {
    const status = document.getElementById('result');
    status.innerText = "⌛ Загрузка...";
    const is2D = currentTab === 'groups';
    const endpoint = is2D ? '/groups/graph' : '/nations/graph';
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        const data = await response.json();
        mainTraces = preparePlotlyData(data, is2D);
        updateGraph();
        status.innerText = `✅ Модель [${currentTab}] загружена.`;
    } catch (err) {
        status.innerText = "❌ Ошибка соединения.";
    }
}

function preparePlotlyData(data, is2D) {
    const uniqueLabels = [...new Set(data.labels)];
    return uniqueLabels.map(labelIdx => {
        const indices = data.labels.flatMap((l, i) => l === labelIdx ? i : []);
        return {
            x: indices.map(i => is2D ? data.projections[i][0] : data.projections[i]),
            y: indices.map(i => is2D ? data.projections[i][1] : (Math.random() - 0.5) * 0.5),
            mode: 'markers',
            name: data.target_names[labelIdx],
            text: indices.map(i => data.names[i]),
            hovertemplate: `<b>%{text}</b><br>LD1: %{x:.4f}${is2D ? '<br>LD2: %{y:.4f}' : ''}<extra></extra>`,
            marker: {
                color: data.colors[labelIdx],
                size: is2D ? 8 : 10,
                opacity: is2D ? 0.7 : 0.6
            }
        };
    });
}

function updateGraph() {
    const is2D = currentTab === 'groups';
    const layout = {
        title: is2D ? 'Подгруппы (LD1 vs LD2)' : 'Народы (LD1)',
        xaxis: { title: 'LD1', zeroline: true, gridcolor: '#eee' },
        yaxis: {
            title: is2D ? 'LD2' : '',
            range: is2D ? null : [-1, 1],
            showticklabels: is2D,
            gridcolor: '#eee'
        },
        legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center' },
        template: 'plotly_white',
        margin: { t: 60, b: 100, l: 60, r: 60 },
        hovermode: 'closest'
    };
    Plotly.react('graph', mainTraces, layout);
}

async function addUserSample() {
    const rawInput = document.getElementById('userData').value.trim();
    if (!rawInput) return;
    const lines = rawInput.split('\n').filter(line => line.trim() !== "");
    const status = document.getElementById('result');
    status.innerText = `⌛ Анализ ${lines.length} образцов...`;
    for (let line of lines) {
        try {
            const parts = line.split(',').map(item => item.replace(/\s+/g, ''));
            const [name, ...coords] = parts;
            if (coords.length < 25) continue;
            const endpoint = currentTab === 'nations' ? '/nations/predict' : '/groups/predict';
            const res = await fetch(`${API_URL}${endpoint}?name=${encodeURIComponent(name)}&coords=${coords.join(',')}`);
            const result = await res.json();
            mainTraces.push({
                x: [currentTab === 'groups' ? result.x : result.ld1],
                y: [currentTab === 'groups' ? result.y : (Math.random() - 0.5) * 0.5],
                mode: 'markers+text',
                name: `User: ${result.name}`,
                showlegend: false,
                text: [result.name],
                textposition: 'top center',
                marker: {
                    color: 'yellow', size: 12, symbol: 'star',
                    line: {color: 'black', width: 1}
                }
            });
        } catch (e) {
            console.error("Ошибка в строке:", line);
        }
    }
    updateGraph();
    status.innerText = `✅ Добавлено ${lines.length} образцов.`;
    document.getElementById('userData').value = "";
}
