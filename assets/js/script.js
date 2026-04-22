const STORAGE_KEY = 'hm_records';

const feelingLabels = {
    1: 'Muito mal',
    2: 'Mal',
    3: 'Ok',
    4: 'Bem',
    5: 'Muito bem'
};

const anxietyLabels = {
    1: 'Muito baixo',
    2: 'Baixo',
    3: 'Um pouco baixo',
    4: 'Moderado',
    5: 'Um pouco alto',
    6: 'Alto',
    7: 'Muito alto',
    8: 'Extremamente alto',
    9: 'Severo',
    10: 'Crítico'
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setCurrentDate();
    setupEmojiOptions();
    setupScaleOptions();
    setupEnergyOptions();
    setupTagsOptions();
    setupSaveButton();
    setupExportButton();
    setupModal();
    loadHistory();
}

function setCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const formattedDate = now.toLocaleDateString('pt-BR', options);
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    document.getElementById('currentDate').textContent = capitalizedDate;
}

function setupEmojiOptions() {
    const buttons = document.querySelectorAll('.emoji-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const value = btn.dataset.value;
            document.getElementById('feelingLabel').textContent = feelingLabels[value];
        });
    });
}

function setupScaleOptions() {
    const buttons = document.querySelectorAll('.scale-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const value = btn.dataset.value;
            document.getElementById('anxietyLabel').textContent = `Nível ${value} - ${anxietyLabels[value]}`;
        });
    });
}

function setupEnergyOptions() {
    const buttons = document.querySelectorAll('.energy-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function setupTagsOptions() {
    const buttons = document.querySelectorAll('.tag-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });
}

function getSelectedValues(selector) {
    const buttons = document.querySelectorAll(`${selector}.active`);
    return Array.from(buttons).map(btn => btn.dataset.value);
}

function setupSaveButton() {
    document.getElementById('saveBtn').addEventListener('click', () => {
        const record = collectFormData();
        
        if (!record.feeling) {
            showNotification('Por favor, selecione como você está se sentindo!');
            return;
        }
        
        saveRecord(record);
        showSaveModal();
        resetForm();
        loadHistory();
    });
}

function collectFormData() {
    const feelingBtn = document.querySelector('.emoji-btn.active');
    const anxietyBtn = document.querySelector('.scale-btn.active');
    const energyBtn = document.querySelector('.energy-btn.active');
    const tags = getSelectedValues('.tag-btn');
    const notes = document.getElementById('notes').value;
    
    return {
        id: generateId(),
        date: new Date().toISOString(),
        feeling: feelingBtn ? feelingBtn.dataset.value : null,
        anxiety: anxietyBtn ? anxietyBtn.dataset.value : null,
        energy: energyBtn ? energyBtn.dataset.value : null,
        tags: tags,
        notes: notes
    };
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveRecord(record) {
    const records = getRecords();
    records.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getRecords() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function resetForm() {
    document.querySelectorAll('.emoji-btn, .scale-btn, .energy-btn, .tag-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('feelingLabel').textContent = '';
    document.getElementById('anxietyLabel').textContent = '';
    document.getElementById('notes').value = '';
}

function showSaveModal() {
    document.getElementById('saveModal').classList.add('show');
}

function setupModal() {
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('saveModal').classList.remove('show');
    });
    
    document.getElementById('saveModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('saveModal')) {
            document.getElementById('saveModal').classList.remove('show');
        }
    });
}

function showNotification(message) {
    alert(message);
}

function setupExportButton() {
    document.getElementById('exportBtn').addEventListener('click', () => {
        const records = getRecords();
        
        if (records.length === 0) {
            showNotification('Nenhum registro para exportar!');
            return;
        }
        
        const csv = generateCSV(records);
        downloadCSV(csv);
    });
}

function generateCSV(records) {
    const headers = ['Data', 'Sentimento', 'Ansiedade', 'Energia', 'Tags', 'Notas'];
    const rows = records.map(record => {
        const date = new Date(record.date).toLocaleDateString('pt-BR');
        const feeling = feelingLabels[record.feeling] || '';
        const anxiety = record.anxiety || '';
        const energy = getEnergyLabel(record.energy) || '';
        const tags = (record.tags || []).join(', ');
        const notes = (record.notes || '').replace(/,/g, ';');
        
        return [date, feeling, anxiety, energy, tags, notes].map(cell => 
            `"${cell}"`
        ).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
}

function getEnergyLabel(value) {
    const labels = {
        1: 'Muito baixa',
        2: 'Baixa',
        3: 'Moderada',
        4: 'Alta',
        5: 'Muito alta'
    };
    return labels[value] || '';
}

function downloadCSV(csv) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `hm_registros_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function loadHistory() {
    const historyList = document.getElementById('historyList');
    const records = getRecords();
    
    if (records.length === 0) {
        historyList.innerHTML = '<p class="empty-history">Nenhum registro ainda. Comece hoje!</p>';
        return;
    }
    
    const historyHTML = records.slice(0, 10).map(record => {
        const date = new Date(record.date);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const emoji = getFeelingEmoji(record.feeling);
        const feeling = feelingLabels[record.feeling] || 'Não especificado';
        const tagsHTML = (record.tags || []).map(tag => 
            `<span class="history-tag">${getTagLabel(tag)}</span>`
        ).join('');
        
        return `
            <div class="history-item">
                <p class="history-date">${formattedDate}</p>
                <div class="history-emoji">${emoji}</div>
                <p class="history-feeling">${feeling}</p>
                ${tagsHTML ? `<div class="history-tags">${tagsHTML}</div>` : ''}
            </div>
        `;
    }).join('');
    
    historyList.innerHTML = historyHTML;
}

function getFeelingEmoji(value) {
    const emojis = {
        1: '😢',
        2: '😔',
        3: '😐',
        4: '🙂',
        5: '😄'
    };
    return emojis[value] || '❓';
}

function getTagLabel(tag) {
    const labels = {
        trabalho: '💼 Trabalho',
        estudo: '📚 Estudo',
        familia: '👨‍👩‍👧 Família',
        amigos: '👥 Amigos',
        exercicio: '🏃 Exercício',
        sono: '😴 Sono',
        alimentacao: '🥗 Alimentação',
        stress: '😰 Stress',
        ansiedade: '😟 Ansiedade',
        feliz: '😊 Feliz',
        calmo: '🧘 Calmo',
        cansado: '😴 Cansado'
    };
    return labels[tag] || tag;
}