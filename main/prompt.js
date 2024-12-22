// main/prompts.js
const fs = require('fs');
const path = require('path');

// We'll store prompts in a local JSON file.
const promptsFilePath = path.join(__dirname, '../prompts.json');

/**
 * Read all prompts from JSON file.
 */
function getPrompts() {
    try {
        if (!fs.existsSync(promptsFilePath)) {
            return [];
        }
        const data = fs.readFileSync(promptsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading prompts.json:', err);
        return [];
    }
}

/**
 * Write the entire prompts array to file.
 */
function savePrompts(prompts) {
    try {
        fs.writeFileSync(promptsFilePath, JSON.stringify(prompts, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error writing prompts.json:', err);
    }
}

/**
 * Add a new prompt to the JSON.
 */
function addPrompt(promptData) {
    const prompts = getPrompts();
    const newPrompt = {
        id: Date.now().toString(),
        title: promptData.title || 'Untitled Prompt',
        text: promptData.text || '',
        isFavorite: false,
        createdAt: Date.now()
    };
    prompts.push(newPrompt);
    savePrompts(prompts);
    return newPrompt;
}

/**
 * Toggle a prompt's favorite status by ID.
 */
function toggleFavoritePrompt(promptId) {
    const prompts = getPrompts();
    const idx = prompts.findIndex((p) => p.id === promptId);
    if (idx >= 0) {
        prompts[idx].isFavorite = !prompts[idx].isFavorite;
        savePrompts(prompts);
        return prompts[idx];
    }
    return null;
}

/**
 * Delete a prompt by ID.
 */
function removePrompt(promptId) {
    let prompts = getPrompts();
    prompts = prompts.filter((p) => p.id !== promptId);
    savePrompts(prompts);
    return prompts;
}

module.exports = {
    getPrompts,
    addPrompt,
    toggleFavoritePrompt,
    removePrompt
};