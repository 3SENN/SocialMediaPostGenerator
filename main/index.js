// main/index.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const fs = require('fs');

// Import from the eventregistry package
const {
    EventRegistry,
    GetTrendingConcepts,
    QueryEvents
} = require('eventregistry');

// Provide your API key for newsapi.ai / eventregistry
const er = new EventRegistry({ apiKey: process.env.EVENT_REGISTRY_API_KEY || 'YOUR_API_KEY' });

// (Your existing imports for AI generator, profiles, frameworks, etc.)
const {
    generateLinkedInPost,
    generateTwitterPost,
    generateInstagramPost
} = require('../backend/prompt-engineering');

const { getProfiles, addProfile } = require('./profiles');
const { getFrameworks, addFramework, deleteFramework } = require('./frameworks');
const { getHistory, addHistoryItem, getHistoryItemById } = require('./history');

// =========== NEW: OpenAI for Summaries ===========
const { Configuration, OpenAIApi } = require('openai');
const openAiConfig = new Configuration({
    apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_KEY'
});
const openai = new OpenAIApi(openAiConfig);

// =========== NEW: Path for storing topic data + helper functions ==========
const topicDataFilePath = path.join(__dirname, '../topicData.json');

// Read JSON
function getTopicData() {
    try {
        if (!fs.existsSync(topicDataFilePath)) {
            return [];
        }
        const raw = fs.readFileSync(topicDataFilePath, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error reading topicData.json:', err);
        return [];
    }
}

// Write JSON
function saveTopicData(data) {
    try {
        fs.writeFileSync(topicDataFilePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing topicData.json:', err);
    }
}

/**
 * Summarize the events using OpenAI
 * We'll gather titles + summaries and ask GPT for a short summary.
 */
async function generateTopicSummary(events, topic) {
    // Build a combined text from event titles & summaries
    let combinedText = events.map((ev, i) => {
        const title = typeof ev.title === 'object' ? ev.title.eng || '(No Title)' : ev.title || '(No Title)';
        const summary = typeof ev.summary === 'object' ? ev.summary.eng || '' : ev.summary || '';
        return `Event #${i+1}: ${title}\n${summary}`;
    }).join('\n\n');

    const prompt = `
You are a skilled analyst. Please summarize the following news items about the topic "${topic}" in a concise way. Include key points, dates if relevant, and any major changes or trends:

${combinedText}

Create a short summary in English.
`;

    try {
        // Use GPT-3.5 or GPT-4 (whichever you prefer)
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that creates concise summaries.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.7
        });

        return response.data.choices[0].message.content.trim();
    } catch (err) {
        console.error('Error generating summary:', err);
        throw err;
    }
}

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
    mainWindow.webContents.openDevTools(); // optional
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

// ============== AI-GENERATIE (unchanged) ==============
ipcMain.handle('generate-post', async (event, args) => {
    const { companyName, industry, targetAudience, platform, topic } = args;
    const { extraDescription, tone, length, language } = args;

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
            language
        });
    } else if (platform === 'X') {
        result = await generateTwitterPost({
            companyName,
            industry,
            targetAudience,
            topic,
            language
        });
    } else if (platform === 'Instagram') {
        result = await generateInstagramPost({
            companyName,
            industry,
            targetAudience,
            topic,
            language
        });
    }

    const newHistoryItem = {
        id: `hist-${Date.now()}`,
        text: result,
        timestamp: new Date().toISOString(),
        platform,
        topic
    };

    addHistoryItem(newHistoryItem);
    return newHistoryItem;
});

// ============== EVENT REGISTRY HANDLERS ==============
ipcMain.handle('fetch-trending-topics', async () => {
    try {
        const trendingQuery = new GetTrendingConcepts({ source: 'news', count: 10 });
        const response = await er.execQuery(trendingQuery);

        // Return the array of concept objects
        const concepts = response?.trendingConcepts?.concepts || [];
        return concepts;
    } catch (err) {
        console.error('Error fetching trending topics:', err);
        throw new Error('Failed to fetch trending topics.');
    }
});

ipcMain.handle('fetch-events-for-topic', async (event, { topic }) => {
    try {
        const conceptUri = await er.getConceptUri(topic);
        const q = new QueryEvents({
            conceptUri,
            sortBy: 'date',
            count: 10,
            lang: 'eng'
        });

        const response = await er.execQuery(q);
        const events = response?.events?.results || [];
        return events;
    } catch (err) {
        console.error(`Error fetching events for topic "${topic}":`, err);
        throw new Error(`Failed to fetch events for "${topic}".`);
    }
});

// ============== NEW: Save & Summarize ==============
/**
 * Called from renderer: we pass { topic, events }.
 * We'll:
 * 1) Save the events to topicData.json with a timestamp
 * 2) Summarize them with OpenAI
 * 3) Store that summary in the same data record
 * 4) Return the summary to the renderer
 */
ipcMain.handle('save-and-summarize-topic', async (event, { topic, events }) => {
    try {
        // 1) Save data
        const now = new Date().toISOString();
        const allData = getTopicData();

        // Build new record
        const newRecord = {
            id: `topic-${Date.now()}`,
            topic: topic,
            dateSearched: now,
            events,  // store the array of events
            summary: null // we'll fill after we get from OpenAI
        };

        // 2) Generate summary
        const summaryText = await generateTopicSummary(events, topic);
        newRecord.summary = summaryText;

        // 3) Add to array + save
        allData.push(newRecord);
        saveTopicData(allData);

        // 4) Return summary
        return { success: true, summary: summaryText, dateSearched: now };
    } catch (err) {
        console.error('Error in save-and-summarize-topic:', err);
        return { success: false, error: err.message };
    }
});

// Return all topics from `topicData.json` (the saved summaries)
ipcMain.handle('get-topic-summaries', async () => {
    try {
        const allData = getTopicData(); // same helper used in 'save-and-summarize-topic'
        return allData; // array of {id, topic, dateSearched, events, summary}
    } catch (err) {
        console.error('Error in get-topic-summaries:', err);
        throw err;
    }
});

// ============== PROFILES, FRAMEWORKS, HISTORY (unchanged) ==============
ipcMain.handle('get-history', () => getHistory());
ipcMain.handle('get-history-item', (event, historyId) => getHistoryItemById(historyId));

ipcMain.handle('get-profiles', () => getProfiles());
ipcMain.handle('add-profile', async (event, newProfile) => {
    addProfile(newProfile);
    return getProfiles();
});
ipcMain.handle('get-profile-detail', async (event, profileName) => {
    const profiles = getProfiles();
    return profiles.find((p) => p.name === profileName) || null;
});

ipcMain.handle('get-frameworks', () => getFrameworks());
ipcMain.handle('add-framework', (event, newFramework) => {
    addFramework(newFramework);
    return getFrameworks();
});
ipcMain.handle('delete-framework', (event, frameworkId) => {
    deleteFramework(frameworkId);
    return getFrameworks();
});