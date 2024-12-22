// main/frameworks.js
const fs = require('fs');
const path = require('path');

const frameworksFilePath = path.join(__dirname, '../frameworks.json');

// Lees frameworks
function getFrameworks() {
    try {
        if (!fs.existsSync(frameworksFilePath)) {
            return [];
        }
        const data = fs.readFileSync(frameworksFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Fout bij inlezen van frameworks.json:', err);
        return [];
    }
}

// Nieuw framework toevoegen
function addFramework(framework) {
    const frameworks = getFrameworks();
    frameworks.push(framework);
    saveFrameworks(frameworks);
}

// Framework verwijderen
function deleteFramework(frameworkId) {
    let frameworks = getFrameworks();
    frameworks = frameworks.filter((fw) => fw.id !== frameworkId);
    saveFrameworks(frameworks);
}

// Opslaan
function saveFrameworks(frameworks) {
    try {
        fs.writeFileSync(frameworksFilePath, JSON.stringify(frameworks, null, 2));
    } catch (err) {
        console.error('Fout bij opslaan van frameworks.json:', err);
    }
}

module.exports = {
    getFrameworks,
    addFramework,
    deleteFramework,
};