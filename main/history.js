// main/history.js
const fs = require('fs');
const path = require('path');

// Adjust the path as needed
const historyFilePath = path.join(__dirname, '../history.json');

// Haal de gehele history op
function getHistory() {
    try {
        if (!fs.existsSync(historyFilePath)) {
            return [];
        }
        const data = fs.readFileSync(historyFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Fout bij inlezen van history.json:', err);
        return [];
    }
}

// Voeg één nieuw history-item toe (bovenaan de lijst, unshift)
function addHistoryItem(item) {
    const currentHistory = getHistory();
    currentHistory.unshift(item);
    saveHistory(currentHistory);
}

// Vind één item op basis van ID
function getHistoryItemById(id) {
    const currentHistory = getHistory();
    return currentHistory.find((h) => h.id === id) || null;
}

// Eventueel: verwijder item (if you want a “delete history” feature)
function deleteHistoryItemById(id) {
    let currentHistory = getHistory();
    currentHistory = currentHistory.filter((h) => h.id !== id);
    saveHistory(currentHistory);
}

// Sla de hele array in JSON op
function saveHistory(historyArray) {
    try {
        fs.writeFileSync(historyFilePath, JSON.stringify(historyArray, null, 2));
    } catch (err) {
        console.error('Fout bij opslaan van history.json:', err);
    }
}

module.exports = {
    getHistory,
    addHistoryItem,
    getHistoryItemById,
    deleteHistoryItemById, // only if you need it
};