// main/profiles.js
const fs = require('fs');
const path = require('path');

// Pad naar het JSON-bestand in de hoofdmap
const profilesFilePath = path.join(__dirname, '../profiles.json');

// Profielen uitlezen
function getProfiles() {
    try {
        // Als het bestand niet bestaat, maak een leeg array
        if (!fs.existsSync(profilesFilePath)) {
            return [];
        }
        const data = fs.readFileSync(profilesFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Fout bij inlezen van profiles.json:', err);
        return [];
    }
}

// Nieuw profiel toevoegen
function addProfile(profile) {
    const profiles = getProfiles();
    // Je kunt hier validatie toevoegen (bv. geen dubbele bedrijfsnamen).
    profiles.push(profile);
    saveProfiles(profiles);
}

// Profielen opslaan
function saveProfiles(profiles) {
    try {
        fs.writeFileSync(profilesFilePath, JSON.stringify(profiles, null, 2));
    } catch (err) {
        console.error('Fout bij opslaan van profiles.json:', err);
    }
}

module.exports = {
    getProfiles,
    addProfile
};