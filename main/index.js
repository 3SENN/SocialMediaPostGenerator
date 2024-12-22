// main/index.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();

const { generateLinkedInPost, generateTwitterPost, generateInstagramPost }
    = require('../backend/prompt-engineering');
const { getProfiles, addProfile } = require('./profiles');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true, // voor prototyping
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    mainWindow.webContents.openDevTools(); // in productie verwijderen/uitzetten
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit als alle vensters dicht zijn (behalve macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ================== AI-GENERATIE ==================
ipcMain.handle('generate-post', async (event, args) => {
    const { companyName, industry, targetAudience, platform, topic } = args;

    let result = '';

    if (platform === 'LinkedIn') {
        result = await generateLinkedInPost({ companyName, industry, targetAudience, topic });
    } else if (platform === 'Twitter') {
        result = await generateTwitterPost({ companyName, industry, targetAudience, topic });
    } else if (platform === 'Instagram') {
        result = await generateInstagramPost({ companyName, industry, targetAudience, topic });
    }

    return result;
});

// ================== PROFIELBEHEER ==================
// 1) Profielen uitlezen
ipcMain.handle('get-profiles', async () => {
    return getProfiles();
});

// 2) Nieuw profiel toevoegen
ipcMain.handle('add-profile', async (event, newProfile) => {
    addProfile(newProfile);
    return getProfiles();
});