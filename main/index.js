// main/index.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();

const {
    generateLinkedInPost,
    generateTwitterPost,
    generateInstagramPost
} = require('../backend/prompt-engineering');

const { getProfiles, addProfile } = require('./profiles');
const {
    getFrameworks,
    addFramework,
    deleteFramework
} = require('./frameworks');

// NEW: Import history functions
const {
    getHistory,
    addHistoryItem,
    getHistoryItemById,
    // deleteHistoryItemById // If you want to remove history
} = require('./history');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ============== AI-GENERATIE ==============
ipcMain.handle('generate-post', async (event, args) => {
    const { companyName, industry, targetAudience, platform, topic } = args;
    const { extraDescription, tone, length } = args;

    let result = '';

    if (platform === 'LinkedIn') {
        result = await generateLinkedInPost({
            companyName,
            industry,
            targetAudience,
            topic,
            extraDescription,
            tone,
            length,
        });
    } else if (platform === 'Twitter') {
        result = await generateTwitterPost({
            companyName,
            industry,
            targetAudience,
            topic,
        });
    } else if (platform === 'Instagram') {
        result = await generateInstagramPost({
            companyName,
            industry,
            targetAudience,
            topic,
        });
    }

    // Maak een history-item
    const newHistoryItem = {
        id: `hist-${Date.now()}`,  // of gebruik uuid
        text: result,
        timestamp: new Date().toISOString(),
        platform,
        topic
    };

    // Sla op in history.json
    addHistoryItem(newHistoryItem);

    // Return het item terug naar renderer
    return newHistoryItem;
});

// Haal de gehele geschiedenis op
ipcMain.handle('get-history', () => {
    return getHistory();
});

// Haal 1 item op
ipcMain.handle('get-history-item', (event, historyId) => {
    return getHistoryItemById(historyId);
});

// ============== PROFIELEN ==============
ipcMain.handle('get-profiles', async () => {
    return getProfiles();
});

ipcMain.handle('add-profile', async (event, newProfile) => {
    addProfile(newProfile);
    return getProfiles();
});

// Profiel detail
ipcMain.handle('get-profile-detail', async (event, profileName) => {
    const profiles = getProfiles();
    return profiles.find((p) => p.name === profileName) || null;
});

// ============== FRAMEWORKS ==============
ipcMain.handle('get-frameworks', () => {
    return getFrameworks();
});

ipcMain.handle('add-framework', (event, newFramework) => {
    addFramework(newFramework);
    return getFrameworks();
});

ipcMain.handle('delete-framework', (event, frameworkId) => {
    deleteFramework(frameworkId);
    return getFrameworks();
});

// (Optional) Delete history item
/*
ipcMain.handle('delete-history-item', (event, historyId) => {
  deleteHistoryItemById(historyId);
  return getHistory();
});
*/