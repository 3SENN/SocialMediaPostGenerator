// renderer.js
const { ipcRenderer } = require('electron');

/* DOM Elements */
const generateBtn = document.getElementById('generateBtn');
const postResult = document.getElementById('postResult');

// History
const historyList = document.getElementById('historyList');
const historyDetailCard = document.getElementById('historyDetailCard');
const historyDetailBody = document.getElementById('historyDetailBody');

// Profiles
const profileForm = document.getElementById('profileForm');
const newProfileName = document.getElementById('newProfileName');
const newProfileIndustry = document.getElementById('newProfileIndustry');
const newProfileAudience = document.getElementById('newProfileAudience');
const profilesList = document.getElementById('profilesList');
const profileSelect = document.getElementById('profileSelect');

// Profile Detail
const profileDetailCard = document.getElementById('profileDetailCard');
const profileDetailBody = document.getElementById('profileDetailBody');

// AI fields
const platformSelect = document.getElementById('platform');
const topicInput = document.getElementById('topicInput');
const extraDescriptionInput = document.getElementById('extraDescription');
const toneInput = document.getElementById('toneInput');
const lengthInput = document.getElementById('lengthInput');

// Frameworks
const frameworksList = document.getElementById('frameworksList');
const saveFrameworkBtn = document.getElementById('saveFrameworkBtn');
const deleteFrameworkModal = document.getElementById('deleteFrameworkModal');
const confirmDeleteFrameworkBtn = document.getElementById('confirmDeleteFrameworkBtn');

// Let's store frameworks in memory (fetched from main)
let frameworks = [];
let frameworksToDelete = null; // keep track of which framework we're deleting

// Local arrays
let profiles = [];
let history = [];

// ================== LOAD ON STARTUP ==================
window.addEventListener('DOMContentLoaded', async () => {
    await loadProfiles();
    await loadHistory();
    await loadFrameworks();
});

// ============== PROFIEL-BEHEER ==============
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

    profiles = await ipcRenderer.invoke('add-profile', profile);
    renderProfiles();

    // Clear form
    newProfileName.value = '';
    newProfileIndustry.value = '';
    newProfileAudience.value = '';
});

async function loadProfiles() {
    profiles = await ipcRenderer.invoke('get-profiles');
    renderProfiles();
}

function renderProfiles() {
    profilesList.innerHTML = '';
    profileSelect.innerHTML = '';

    profiles.forEach((p) => {
        // For the list
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.textContent = `${p.name} (${p.industry})`;
        li.addEventListener('click', () => showProfileDetail(p.name));
        profilesList.appendChild(li);

        // For the select
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        profileSelect.appendChild(opt);
    });
}

// Detail view for a profile
async function showProfileDetail(profileName) {
    // Hide other detail cards
    hideAllDetailCards();

    const detail = await ipcRenderer.invoke('get-profile-detail', profileName);

    if (!detail) {
        console.error('Geen profiel gevonden');
        return;
    }

    profileDetailCard.classList.remove('d-none');
    profileDetailBody.innerHTML = `
    <p><strong>Naam:</strong> ${detail.name}</p>
    <p><strong>Industrie:</strong> ${detail.industry}</p>
    <p><strong>Doelgroep:</strong> ${detail.audience}</p>
  `;
}

// ============== HISTORY ==============
async function loadHistory() {
    history = await ipcRenderer.invoke('get-history');
    renderHistory();
}

// Render
function renderHistory() {
    historyList.innerHTML = '';
    history.forEach((item) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.textContent = `(${item.platform}) ${item.topic} - ${item.timestamp}`;
        li.addEventListener('click', () => showHistoryDetail(item.id));
        historyList.appendChild(li);
    });
}

// Show one item
async function showHistoryDetail(historyId) {
    hideAllDetailCards();
    const item = await ipcRenderer.invoke('get-history-item', historyId);
    if (item) {
        historyDetailCard.classList.remove('d-none');
        historyDetailBody.textContent = item.text;
    }
}

// ============== FRAMEWORKS ==============
async function loadFrameworks() {
    frameworks = await ipcRenderer.invoke('get-frameworks');
    renderFrameworks();
}

function renderFrameworks() {
    frameworksList.innerHTML = '';
    frameworks.forEach((fw) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

        li.innerHTML = `
      <div>
        <strong>${fw.topic}</strong>
        <br />
        <small>${fw.tone} | ${fw.length} woorden</small>
      </div>
      <i class="bi bi-heart-fill text-danger" style="cursor:pointer;"></i>
    `;

        // If clicking the text, we can load the framework (optional) or show detail
        li.addEventListener('click', (e) => {
            // Prevent the heart icon from triggering
            if (e.target.tagName.toLowerCase() === 'i') return;
            loadFrameworkToForm(fw);
        });

        // If clicking the heart icon, open modal to delete
        const heartIcon = li.querySelector('i');
        heartIcon.addEventListener('click', () => {
            frameworksToDelete = fw.id;
            const bsModal = new bootstrap.Modal(deleteFrameworkModal);
            bsModal.show();
        });

        frameworksList.appendChild(li);
    });
}

// Delete framework
confirmDeleteFrameworkBtn.addEventListener('click', async () => {
    if (!frameworksToDelete) return;
    frameworks = await ipcRenderer.invoke('delete-framework', frameworksToDelete);
    frameworksToDelete = null;
    renderFrameworks();

    // Hide modal
    const bsModal = bootstrap.Modal.getInstance(deleteFrameworkModal);
    bsModal.hide();
});

// Load a framework into the generator form
function loadFrameworkToForm(fw) {
    topicInput.value = fw.topic;
    extraDescriptionInput.value = fw.extraDescription;
    toneInput.value = fw.tone;
    lengthInput.value = fw.length;
    platformSelect.value = fw.platform; // if you store platform in the framework
}

// Save current form as a framework
saveFrameworkBtn.addEventListener('click', async () => {
    const newFw = {
        id: `fw-${Date.now()}`,
        topic: topicInput.value.trim() || 'Onderwerp Onbekend',
        extraDescription: extraDescriptionInput.value.trim(),
        tone: toneInput.value.trim(),
        length: lengthInput.value.trim(),
        platform: platformSelect.value,
    };

    frameworks = await ipcRenderer.invoke('add-framework', newFw);
    renderFrameworks();

    alert('Framework is opgeslagen!');
});

// ============== AI GENERATIE ==============
generateBtn.addEventListener('click', async () => {
    const selectedProfileName = profileSelect.value;
    const selectedProfile = profiles.find((p) => p.name === selectedProfileName);

    const companyName = selectedProfile ? selectedProfile.name : 'Mijn Bedrijf';
    const industry = selectedProfile ? selectedProfile.industry : 'Digitalisering';
    const audience = selectedProfile ? selectedProfile.audience : 'MKB';

    const platform = platformSelect.value;
    const topic = topicInput.value.trim() || 'AI en toekomst';
    const extraDescription = extraDescriptionInput.value.trim() || 'Geen extra details';
    const tone = toneInput.value.trim() || 'professioneel';
    const length = lengthInput.value.trim() || '200';

    try {
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

        // response is the historyItem with id, text, ...
        postResult.textContent = response.text;

        // Refresh local history
        await loadHistory();
    } catch (err) {
        console.error('Fout bij genereren post:', err);
        postResult.textContent = `Er trad een fout op: ${err.message}`;
    }
});

// Helper to hide all detail cards
function hideAllDetailCards() {
    profileDetailCard.classList.add('d-none');
    historyDetailCard.classList.add('d-none');
    // frameworkDetailCard.classList.add('d-none'); // if you have a separate detail
}

