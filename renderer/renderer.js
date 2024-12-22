const { ipcRenderer } = require('electron');

const generateBtn = document.getElementById('generateBtn');
const postResult = document.getElementById('postResult');
const historyList = document.getElementById('historyList');

// Profielen
const profileForm = document.getElementById('profileForm');
const newProfileName = document.getElementById('newProfileName');
const newProfileIndustry = document.getElementById('newProfileIndustry');
const newProfileAudience = document.getElementById('newProfileAudience');
const profilesList = document.getElementById('profilesList');
const profileSelect = document.getElementById('profileSelect');

// AI-velden
const platformSelect = document.getElementById('platform');
const topicInput = document.getElementById('topicInput');
const extraDescriptionInput = document.getElementById('extraDescription');
const toneInput = document.getElementById('toneInput');
const lengthInput = document.getElementById('lengthInput');

let history = [];
let profiles = [];

/* ============== PROFIEL-BEHEER ============== */

// Form submit: nieuw profiel opslaan
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const profile = {
        name: newProfileName.value.trim(),
        industry: newProfileIndustry.value.trim(),
        audience: newProfileAudience.value.trim(),
    };

    if (!profile.name) {
        alert('Bedrijfsnaam is verplicht!');
        return;
    }

    // Stuur nieuwe profiel naar main process
    profiles = await ipcRenderer.invoke('add-profile', profile);
    renderProfiles();

    // Form leegmaken
    newProfileName.value = '';
    newProfileIndustry.value = '';
    newProfileAudience.value = '';
});

// Profielen ophalen bij startup
async function loadProfiles() {
    profiles = await ipcRenderer.invoke('get-profiles');
    renderProfiles();
}

// List en Select vullen
function renderProfiles() {
    // List
    profilesList.innerHTML = '';
    profiles.forEach((p) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.textContent = `${p.name} (${p.industry})`;
        profilesList.appendChild(li);
    });
    // Select
    profileSelect.innerHTML = '';
    profiles.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        profileSelect.appendChild(opt);
    });
}

/* ============== AI GENERATIE ============== */

// Generate-knop
generateBtn.addEventListener('click', async () => {
    // Profielinfo
    const selectedProfileName = profileSelect.value;
    const selectedProfile = profiles.find((p) => p.name === selectedProfileName);

    const companyName = selectedProfile ? selectedProfile.name : 'Mijn Bedrijf';
    const industry = selectedProfile ? selectedProfile.industry : 'Digitalisering';
    const audience = selectedProfile ? selectedProfile.audience : 'MKB';

    // Platform, onderwerp
    const platform = platformSelect.value;
    const topic = topicInput.value.trim() || 'AI en toekomst';

    // Extra inputs
    const extraDescription = extraDescriptionInput?.value?.trim() || 'Geen extra details';
    const tone = toneInput?.value?.trim() || 'professioneel';
    const length = lengthInput?.value?.trim() || '200';

    try {
        // Stuur alles naar de main-process via IPC
        const response = await ipcRenderer.invoke('generate-post', {
            companyName,
            industry,
            targetAudience: audience,
            platform,
            topic,
            extraDescription,
            tone,
            length,
        });

        // UI updaten
        postResult.textContent = response;

        // Toevoegen aan history
        history.unshift(response);
        renderHistory();
    } catch (err) {
        console.error('Fout bij genereren post:', err);
        postResult.textContent = `Er trad een fout op: ${err.message}`;
    }
});

function renderHistory() {
    historyList.innerHTML = '';
    history.forEach((item, index) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.textContent = `Post #${history.length - index}: ${item.slice(0, 50)}...`;
        historyList.appendChild(li);
    });
}

// ============= INIT =============
loadProfiles();