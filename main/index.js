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

let historyStore = []; // In-memory array to store generated responses
let historyCounter = 1;

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

    // Store in history
    const historyItem = {
        id: `hist-${historyCounter++}`,
        text: result,
        timestamp: new Date().toISOString(),
        platform,
        topic
    };
    historyStore.unshift(historyItem);

    return historyItem;
});

// Geschiedenis opvragen
ipcMain.handle('get-history', () => {
    return historyStore;
});

// 1) Profielen uitlezen
ipcMain.handle('get-profiles', async () => {
    return getProfiles();
});

// 2) Nieuw profiel toevoegen
ipcMain.handle('add-profile', async (event, newProfile) => {
    addProfile(newProfile);
    return getProfiles();
});

// 3) Profiel detail (optioneel: we can load from same getProfiles or do a separate method)
ipcMain.handle('get-profile-detail', async (event, profileName) => {
    const profiles = getProfiles();
    const found = profiles.find((p) => p.name === profileName);
    return found || null;
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

// ============== HISTORY DETAILS ==============
ipcMain.handle('get-history-item', (event, historyId) => {
    return historyStore.find((h) => h.id === historyId) || null;
});