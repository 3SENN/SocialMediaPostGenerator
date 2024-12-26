// renderer.js
const { ipcRenderer } = require('electron');

// The main container in index.html where we load partials
const appContainer = document.getElementById('appContainer');
const btnHome = document.getElementById('btnHome');
const btnNews = document.getElementById('btnNews');

/**
 * Loads a partial HTML from renderer/pages/<pageName>.html
 * and injects it into #appContainer.
 */
async function loadPage(pageName) {
    try {
        const response = await fetch(`pages/${pageName}.html`);
        const html = await response.text();

        // Inject the HTML partial into our main container
        appContainer.innerHTML = html;

        // After the DOM is replaced, attach event listeners for that partial
        if (pageName === 'home') {
            setupHomePage();
        } else if (pageName === 'news') {
            setupNewsPage();
        }
    } catch (err) {
        console.error(`Failed to load ${pageName}:`, err);
        appContainer.innerHTML = `<p class="text-danger">Error loading ${pageName} page.</p>`;
    }
}

// Load Home page by default on startup
window.addEventListener('DOMContentLoaded', () => {
    loadPage('home');
});

// Navigation button events
btnHome.addEventListener('click', () => loadPage('home'));
btnNews.addEventListener('click', () => loadPage('news'));

/* ========== HOME PAGE SETUP ========== */
function setupHomePage() {
    // Re-query elements from home.html
    const profileForm = document.getElementById('profileForm');
    const newProfileName = document.getElementById('newProfileName');
    const newProfileIndustry = document.getElementById('newProfileIndustry');
    const newProfileAudience = document.getElementById('newProfileAudience');

    const profilesList = document.getElementById('profilesList');
    const profileSelect = document.getElementById('profileSelect');

    const frameworksList = document.getElementById('frameworksList');
    const deleteFrameworkModal = document.getElementById('deleteFrameworkModal');
    const confirmDeleteFrameworkBtn = document.getElementById('confirmDeleteFrameworkBtn');

    const historyList = document.getElementById('historyList');
    const historyDetailCard = document.getElementById('historyDetailCard');
    const historyDetailBody = document.getElementById('historyDetailBody');
    const profileDetailCard = document.getElementById('profileDetailCard');
    const profileDetailBody = document.getElementById('profileDetailBody');

    // AI fields
    const platformSelect = document.getElementById('platform');
    const topicInput = document.getElementById('topicInput');
    const extraDescriptionInput = document.getElementById('extraDescription');
    const toneInput = document.getElementById('toneInput');
    const lengthInput = document.getElementById('lengthInput');
    const languageSelect = document.getElementById('languageSelect');
    const postResult = document.getElementById('postResult');

    // Buttons
    const generateBtn = document.getElementById('generateBtn');
    const saveFrameworkBtn = document.getElementById('saveFrameworkBtn');

    // In-memory arrays
    let frameworksToDelete = null;
    let profiles = [];
    let history = [];
    let frameworks = [];

    // Helper to hide detail cards
    function hideAllDetailCards() {
        if (profileDetailCard) profileDetailCard.classList.add('d-none');
        if (historyDetailCard) historyDetailCard.classList.add('d-none');
        // if you have another detail card, hide it too
    }

    // Load data on startup
    (async () => {
        await loadProfiles();
        await loadHistory();
        await loadFrameworks();
    })();

    /* ========== PROFILE LOGIC ========== */
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newProfile = {
                name: newProfileName.value.trim(),
                industry: newProfileIndustry.value.trim(),
                audience: newProfileAudience.value.trim(),
            };
            if (!newProfile.name) {
                alert('Bedrijfsnaam is verplicht!');
                return;
            }
            profiles = await ipcRenderer.invoke('add-profile', newProfile);
            renderProfiles();
            // Clear form
            newProfileName.value = '';
            newProfileIndustry.value = '';
            newProfileAudience.value = '';
        });
    }

    async function loadProfiles() {
        profiles = await ipcRenderer.invoke('get-profiles');
        renderProfiles();
    }

    function renderProfiles() {
        if (!profilesList || !profileSelect) return;
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

    async function showProfileDetail(profileName) {
        hideAllDetailCards();
        const detail = await ipcRenderer.invoke('get-profile-detail', profileName);
        if (!detail || !profileDetailCard || !profileDetailBody) return;
        profileDetailCard.classList.remove('d-none');
        profileDetailBody.innerHTML = `
      <p><strong>Naam:</strong> ${detail.name}</p>
      <p><strong>Industrie:</strong> ${detail.industry}</p>
      <p><strong>Doelgroep:</strong> ${detail.audience}</p>
    `;
    }

    /* ========== HISTORY LOGIC ========== */
    async function loadHistory() {
        history = await ipcRenderer.invoke('get-history');
        renderHistory();
    }

    function renderHistory() {
        if (!historyList) return;
        historyList.innerHTML = '';
        history.forEach((item) => {
            const li = document.createElement('li');
            li.classList.add('list-group-item');
            li.textContent = `(${item.platform}) ${item.topic} - ${item.timestamp}`;
            li.addEventListener('click', () => showHistoryDetail(item.id));
            historyList.appendChild(li);
        });
    }

    async function showHistoryDetail(historyId) {
        hideAllDetailCards();
        const item = await ipcRenderer.invoke('get-history-item', historyId);
        if (item && historyDetailCard && historyDetailBody) {
            historyDetailCard.classList.remove('d-none');
            historyDetailBody.textContent = item.text;
        }
    }

    /* ========== FRAMEWORKS LOGIC ========== */
    async function loadFrameworks() {
        frameworks = await ipcRenderer.invoke('get-frameworks');
        renderFrameworks();
    }

    function renderFrameworks() {
        if (!frameworksList) return;
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

            // Clicking text loads the framework into the form
            li.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() === 'i') return;
                loadFrameworkToForm(fw);
            });

            // Clicking heart icon => delete
            const heartIcon = li.querySelector('i');
            heartIcon.addEventListener('click', () => {
                frameworksToDelete = fw.id;
                if (deleteFrameworkModal) {
                    const bsModal = new bootstrap.Modal(deleteFrameworkModal);
                    bsModal.show();
                }
            });

            frameworksList.appendChild(li);
        });
    }

    if (confirmDeleteFrameworkBtn) {
        confirmDeleteFrameworkBtn.addEventListener('click', async () => {
            if (!frameworksToDelete) return;
            frameworks = await ipcRenderer.invoke('delete-framework', frameworksToDelete);
            frameworksToDelete = null;
            renderFrameworks();
            // Hide modal
            const bsModal = bootstrap.Modal.getInstance(deleteFrameworkModal);
            bsModal.hide();
        });
    }

    function loadFrameworkToForm(fw) {
        if (topicInput) topicInput.value = fw.topic;
        if (extraDescriptionInput) extraDescriptionInput.value = fw.extraDescription;
        if (toneInput) toneInput.value = fw.tone;
        if (lengthInput) lengthInput.value = fw.length;
        if (platformSelect) platformSelect.value = fw.platform;
    }

    if (saveFrameworkBtn) {
        saveFrameworkBtn.addEventListener('click', async () => {
            const newFw = {
                id: `fw-${Date.now()}`,
                topic: topicInput.value.trim() || 'Onderwerp Onbekend',
                extraDescription: extraDescriptionInput.value.trim(),
                tone: toneInput.value.trim(),
                length: lengthInput.value.trim(),
                platform: platformSelect.value
            };
            frameworks = await ipcRenderer.invoke('add-framework', newFw);
            renderFrameworks();
            alert('Framework is opgeslagen!');
        });
    }

    /* ========== AI GENERATION ========== */
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const selectedProfileName = profileSelect?.value;
            const selectedProfile = profiles.find((p) => p.name === selectedProfileName);

            const companyName = selectedProfile ? selectedProfile.name : 'Not Specified';
            const industry = selectedProfile ? selectedProfile.industry : 'Not Specified';
            const audience = selectedProfile ? selectedProfile.audience : 'Not Specified';

            const platform = platformSelect?.value || 'LinkedIn';
            const topic = topicInput?.value.trim() || 'AI en toekomst';
            const extraDescription = extraDescriptionInput?.value.trim() || 'Geen extra details';
            const tone = toneInput?.value.trim() || 'professioneel';
            const length = lengthInput?.value.trim() || '200';
            const language = languageSelect?.value || 'Dutch';

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
                    language
                });
                if (postResult) {
                    postResult.textContent = response.text;
                }
                await loadHistory();
            } catch (err) {
                console.error('Fout bij genereren post:', err);
                if (postResult) {
                    postResult.textContent = `Er trad een fout op: ${err.message}`;
                }
            }
        });
    }
}

/* ========== NEWS PAGE SETUP ========== */
function setupNewsPage() {
    // DOM references
    const fetchTrendingBtn = document.getElementById('fetchTrendingBtn');
    const trendingResults = document.getElementById('trendingResults');

    const eventTopicInput = document.getElementById('eventTopicInput');
    const fetchTopicEventsBtn = document.getElementById('fetchTopicEventsBtn');
    const topicResults = document.getElementById('topicResults');
    const saveSummarizeBtn = document.getElementById('saveSummarizeBtn');
    const analysisContainer = document.getElementById('analysisContainer');

    // Summaries
    const refreshSummariesBtn = document.getElementById('refreshSummariesBtn');
    const savedSummariesList = document.getElementById('savedSummariesList');

    // detail modal for events
    const eventDetailModal = document.getElementById('eventDetailModal');
    const eventDetailBody = document.getElementById('eventDetailBody');

    // detail modal for summaries
    const summaryDetailModal = document.getElementById('summaryDetailModal');
    const summaryDetailBody = document.getElementById('summaryDetailBody');

    // In-memory
    let currentEvents = [];
    let currentTopic = null;

    // 1) Fetch events for a user-chosen topic
    if (fetchTopicEventsBtn && eventTopicInput && topicResults) {
        fetchTopicEventsBtn.addEventListener('click', async () => {
            const topic = eventTopicInput.value.trim() || 'AI';
            try {
                const eventsData = await ipcRenderer.invoke('fetch-events-for-topic', { topic });
                currentEvents = eventsData;
                currentTopic = topic;
                renderTopicEvents(eventsData, topicResults);

                // Clear out any previous summary
                if (analysisContainer) {
                    analysisContainer.innerHTML = `<p class="small text-muted">Awaiting summary...</p>`;
                }
            } catch (err) {
                console.error('Error fetching events for topic:', err);
                topicResults.innerHTML = `<p class="text-danger">Error: ${err.message}</p>`;
            }
        });
    }

    // 2) Trending topics
    if (fetchTrendingBtn && trendingResults) {
        fetchTrendingBtn.addEventListener('click', async () => {
            try {
                const trendingData = await ipcRenderer.invoke('fetch-trending-topics');
                renderTrendingTopics(trendingData, trendingResults);
            } catch (err) {
                console.error('Error fetching trending topics:', err);
                trendingResults.innerHTML = `<p class="text-danger">Error: ${err.message}</p>`;
            }
        });
    }

    // 3) Save & Summarize
    if (saveSummarizeBtn) {
        saveSummarizeBtn.addEventListener('click', async () => {
            if (!currentEvents || currentEvents.length === 0) {
                if (analysisContainer) {
                    analysisContainer.innerHTML = `<p class="text-danger">No events to save/summarize. Search a topic first!</p>`;
                }
                return;
            }
            if (!currentTopic) currentTopic = 'Unknown Topic';
            try {
                const result = await ipcRenderer.invoke('save-and-summarize-topic', {
                    topic: currentTopic,
                    events: currentEvents
                });

                if (result.success) {
                    if (analysisContainer) {
                        analysisContainer.innerHTML = `
              <h5>Summary for "${currentTopic}"</h5>
              <p class="small text-muted">Date Searched: ${result.dateSearched}</p>
              <div>${result.summary.replace(/\n/g, '<br/>')}</div>
            `;
                    }
                    // Refresh the saved summaries list so we see the new summary
                    await loadTopicSummaries();
                } else {
                    if (analysisContainer) {
                        analysisContainer.innerHTML = `<p class="text-danger">Summary error: ${result.error}</p>`;
                    }
                }
            } catch (err) {
                console.error('Error saving/summarizing:', err);
                if (analysisContainer) {
                    analysisContainer.innerHTML = `<p class="text-danger">${err.message}</p>`;
                }
            }
        });
    }

    // 4) Refresh Summaries
    if (refreshSummariesBtn) {
        refreshSummariesBtn.addEventListener('click', async () => {
            await loadTopicSummaries();
        });
    }

    // Load the saved summaries on startup
    loadTopicSummaries();

    // ================== RENDERING FUNCTIONS ==================

    // Summaries
    async function loadTopicSummaries() {
        try {
            const allSummaries = await ipcRenderer.invoke('get-topic-summaries');
            renderSavedSummaries(allSummaries);
        } catch (err) {
            console.error('Error loading topic summaries:', err);
            if (savedSummariesList) {
                savedSummariesList.innerHTML = `<p class="text-danger">Error: ${err.message}</p>`;
            }
        }
    }

    function renderSavedSummaries(summariesArray) {
        if (!savedSummariesList) return;
        savedSummariesList.innerHTML = '';

        if (!Array.isArray(summariesArray) || summariesArray.length === 0) {
            savedSummariesList.innerHTML = `<p class="text-muted">No saved summaries yet.</p>`;
            return;
        }

        summariesArray.forEach((rec) => {
            const div = document.createElement('div');
            div.classList.add('mb-2', 'p-2', 'border', 'rounded');

            // The label will show "Topic: rec.topic" + date
            div.innerHTML = `
        <strong>${rec.topic}</strong>
        <br />
        <small class="text-muted">${rec.dateSearched}</small>
        <button class="btn btn-sm btn-outline-info float-end viewSummaryBtn" data-record-id="${rec.id}">
          <i class="bi bi-eye"></i> View
        </button>
      `;
            savedSummariesList.appendChild(div);
        });

        // Attach event for "View" button
        const viewBtns = savedSummariesList.querySelectorAll('.viewSummaryBtn');
        viewBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const recId = btn.getAttribute('data-record-id');
                showSummaryDetail(recId, summariesArray);
            });
        });
    }

    function showSummaryDetail(recordId, summariesArray) {
        const found = summariesArray.find((r) => r.id === recordId);
        if (!found) return;

        // Select the modal elements
        const summaryDetailBody = document.getElementById('summaryDetailBody');
        const summaryDetailModal = document.getElementById('summaryDetailModal');

        // Convert newlines to <br> for better formatting
        const convertedSummary = found.summary.replace(/\n/g, '<br/>');

        // Populate modal content
        summaryDetailBody.innerHTML = `
        <h5>Summary for "${found.topic}"</h5>
        <p class="small text-muted">Date: ${found.dateSearched}</p>
        <div>${convertedSummary}</div>
    `;

        // Instantiate and show the modal
        const bsModal = new bootstrap.Modal(summaryDetailModal, {
            keyboard: true,
        });
        bsModal.show();
    }

    // Render trending topics
    function renderTrendingTopics(trendingData, container) {
        container.innerHTML = '';
        if (!Array.isArray(trendingData) || trendingData.length === 0) {
            container.innerHTML = '<p class="text-muted">No trending topics.</p>';
            return;
        }
        trendingData.forEach((concept) => {
            const col = document.createElement('div');
            col.classList.add('col-12', 'col-md-6', 'col-lg-4');

            const labelText = concept.label?.eng || 'Unknown Topic';
            const trendingScore = concept.trendingScore?.news?.score?.toFixed(2) || 'N/A';

            col.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${labelText}</h5>
            <p class="card-text">Score: ${trendingScore}</p>
          </div>
        </div>
      `;
            container.appendChild(col);
        });
    }

    // Render topic events
    function renderTopicEvents(eventsArray, container) {
        container.innerHTML = '';
        if (!Array.isArray(eventsArray) || eventsArray.length === 0) {
            container.innerHTML = '<p class="text-muted">No events found.</p>';
            return;
        }
        eventsArray.forEach((ev, index) => {
            const eventTitle = typeof ev.title === 'object'
                ? ev.title.eng || '(No Title)'
                : ev.title || '(No Title)';
            const eventSummary = typeof ev.summary === 'object'
                ? ev.summary.eng || ''
                : ev.summary || '';

            const col = document.createElement('div');
            col.classList.add('col-12', 'col-md-6', 'col-lg-6');

            col.innerHTML = `
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title">${eventTitle}</h6>
            <p class="card-text flex-grow-1">${eventSummary}</p>
            <p class="text-muted">
              ${ev.eventDate ? 'Event Date: ' + ev.eventDate : ''}
            </p>
            <button class="btn btn-outline-secondary mt-auto" data-event-index="${index}">
              <i class="bi bi-eye me-1"></i>Details
            </button>
          </div>
        </div>
      `;
            container.appendChild(col);
        });

        // Detail buttons
        const detailButtons = container.querySelectorAll('button[data-event-index]');
        detailButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const idx = btn.getAttribute('data-event-index');
                showEventDetail(idx);
            });
        });
    }

    function showEventDetail(index) {
        const ev = currentEvents[index];
        if (!ev) return;

        const eventTitle = typeof ev.title === 'object'
            ? ev.title.eng || '(No Title)'
            : ev.title || '(No Title)';
        const eventSummary = typeof ev.summary === 'object'
            ? ev.summary.eng || 'No summary available.'
            : ev.summary || 'No summary available.';

        const detailHtml = `
      <h5>${eventTitle}</h5>
      <p><strong>Date:</strong> ${ev.eventDate || 'N/A'}</p>
      <p>${eventSummary}</p>
    `;
        if (eventDetailBody) eventDetailBody.innerHTML = detailHtml;

        if (eventDetailModal) {
            const bsModal = new bootstrap.Modal(eventDetailModal);
            bsModal.show();
        }
    }
}