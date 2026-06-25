const state = {
    currentUser: null,
    users: [],
    tracks: [],
    schedule: [],
    djProfile: {
        name: '',
        about: '',
        showName: '',
        bgUrl: ''
    }
};

const LS_KEY = 'artMusicRadioState';
const audioPlayer = document.getElementById('radioPlayer');
const liveStatus = document.getElementById('liveStatus');
const trackListElement = document.getElementById('trackList');
const scheduleTrackSelect = document.getElementById('scheduleTrack');
const scheduleList = document.getElementById('scheduleList');
const daySchedule = document.getElementById('daySchedule');
const currentUserStatus = document.getElementById('currentUserStatus');
const logoutButton = document.getElementById('logoutButton');
const profileBanner = document.getElementById('profileBanner');
const profileName = document.getElementById('profileName');
const profileBio = document.getElementById('profileBio');
const profileShowName = document.getElementById('profileShowName');

const defaultTracks = [
    {
        id: 'sample-1',
        name: 'Demolåt - SoundHelix',
        source: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        type: 'remote'
    },
    {
        id: 'sample-2',
        name: 'Demolåt 2 - SoundHelix',
        source: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        type: 'remote'
    }
];

const defaultStations = [
    { id: 'station-dice', name: 'Dice Radio (diceradio.gr)', url: '' },
    { id: 'station-radioq37', name: 'Radio Q37 (radioq37.com)', url: '' },
    { id: 'station-ozora', name: 'Ozora Radio', url: '' }
];

// Record labels
if (!state.labels) state.labels = [];

if (!state.stations) state.stations = [];

const sections = document.querySelectorAll('.page-section');
const navButtons = document.querySelectorAll('.nav-button');
const quickLinks = document.querySelectorAll('.link-card');

function loadState() {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            state.users = parsed.users || [];
            state.schedule = parsed.schedule || [];
            state.djProfile = parsed.djProfile || state.djProfile;
            state.currentUser = parsed.currentUser || null;
            state.tracks = (parsed.tracks || []).map(track => ({
                ...track,
                url: track.source && track.type === 'remote' ? track.source : track.url || track.source
            }));
            state.stations = parsed.stations || [];
            state.labels = parsed.labels || [];
        } catch (error) {
            console.warn('Kunne ikke laste state:', error);
        }
    }
    if (!state.tracks.length) {
        state.tracks = [...defaultTracks];
    }
    if (!state.stations.length) state.stations = [...defaultStations];
}

function saveState() {
    const stateToSave = {
        users: state.users,
        schedule: state.schedule,
        djProfile: state.djProfile,
        currentUser: state.currentUser,
        tracks: state.tracks.map(track => ({
            id: track.id,
            name: track.name,
            source: track.source,
            type: track.type
        }))
        ,stations: state.stations,
        labels: state.labels
    };
    localStorage.setItem(LS_KEY, JSON.stringify(stateToSave));
}

function switchSection(targetId) {
    sections.forEach(section => {
        section.classList.toggle('active', section.id === targetId);
    });
    navButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.target === targetId);
    });
}

navButtons.forEach(button => {
    button.addEventListener('click', () => switchSection(button.dataset.target));
});

quickLinks.forEach(link => {
    link.addEventListener('click', () => switchSection(link.dataset.target));
});

function renderTrackList() {
    scheduleTrackSelect.innerHTML = '';
    trackListElement.innerHTML = '';
    state.tracks.forEach(track => {
        const option = document.createElement('option');
        option.value = track.id;
        option.textContent = track.name;
        scheduleTrackSelect.appendChild(option);

        const item = document.createElement('div');
        item.className = 'track-item';
        item.innerHTML = `<strong>${track.name}</strong><span>${track.type === 'remote' ? 'URL eller strømming' : 'Lokal fil'}</span>`;
        const buttonGroup = document.createElement('div');
        buttonGroup.style.display = 'flex';
        buttonGroup.style.gap = '0.5rem';
        const playBtn = document.createElement('button');
        playBtn.textContent = 'Spill';
        playBtn.addEventListener('click', () => playTrack(track.id));
        buttonGroup.appendChild(playBtn);
        item.appendChild(buttonGroup);
        trackListElement.appendChild(item);
    });
}

function renderStations() {
    const select = document.getElementById('stationSelect');
    select.innerHTML = '';
    state.stations.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
}

function playSelectedStation() {
    const sel = document.getElementById('stationSelect').value;
    const station = state.stations.find(s => s.id === sel);
    if (!station) return alert('Velg en stasjon.');
    if (!station.url) return alert('Ingen stream-URL er satt for denne stasjonen. Klikk Rediger og legg inn stream-URL.');
    audioPlayer.src = station.url;
    audioPlayer.play().catch(err => alert('Kunne ikke starte stasjonen: ' + err.message));
}

function stopStation() {
    audioPlayer.pause();
    audioPlayer.src = '';
}

function addStationFromForm() {
    const name = document.getElementById('stationName').value.trim();
    const url = document.getElementById('stationUrl').value.trim();
    if (!name || !url) return alert('Fyll inn både navn og stream-URL.');
    const id = `station-${Date.now()}`;
    state.stations.push({ id, name, url });
    saveState();
    renderStations();
    document.getElementById('stationName').value = '';
    document.getElementById('stationUrl').value = '';
}

function renderLabels() {
    const el = document.getElementById('labelsList');
    el.innerHTML = '';
    if (!state.labels.length) {
        el.innerHTML = '<p>Ingen plateselskaper lagt til.</p>';
        return;
    }
    state.labels.forEach((lab, idx) => {
        const item = document.createElement('div');
        item.className = 'track-item';
        item.innerHTML = `<strong>${lab.name}</strong> ${lab.url ? `<a href="${lab.url}" target="_blank">nett</a>` : ''} <button data-idx="${idx}">Fjern</button>`;
        item.querySelector('button').addEventListener('click', () => { state.labels.splice(idx,1); saveState(); renderLabels(); });
        el.appendChild(item);
    });
}

function addLabelFromForm() {
    const name = document.getElementById('labelName').value.trim();
    const url = document.getElementById('labelUrl').value.trim();
    if (!name) return alert('Navn på plateselskap kreves.');
    state.labels.push({ name, url });
    saveState();
    renderLabels();
    document.getElementById('labelName').value = '';
    document.getElementById('labelUrl').value = '';
}

function playTrack(trackId) {
    const track = state.tracks.find(item => item.id === trackId);
    if (!track) return;
    audioPlayer.src = track.url || track.source;
    audioPlayer.play().catch(() => {
        alert('Kunne ikke spille av sangen. Sjekk URL eller filstøtte.');
    });
}

function addLocalTrack(file) {
    const id = `local-${Date.now()}`;
    const url = URL.createObjectURL(file);
    const track = {
        id,
        name: file.name,
        source: url,
        url,
        type: 'local'
    };
    state.tracks.push(track);
    renderTrackList();
    saveState();
}

function addUrlTrack(url) {
    const id = `remote-${Date.now()}`;
    const track = {
        id,
        name: url.split('/').pop() || `Track ${state.tracks.length + 1}`,
        source: url,
        type: 'remote'
    };
    state.tracks.push(track);
    renderTrackList();
    saveState();
}

function renderSchedule() {
    scheduleList.innerHTML = '';
    if (!state.schedule.length) {
        scheduleList.innerHTML = '<p>Ingen planlagte sanger ennå.</p>';
        return;
    }
    state.schedule.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    state.schedule.forEach(item => {
        const track = state.tracks.find(t => t.id === item.trackId);
        const element = document.createElement('div');
        element.className = 'schedule-item';
        element.innerHTML = `<strong>${track ? track.name : 'Ukjent sang'}</strong>
            <span>${item.date} kl. ${item.time} - ${item.duration} min</span>
            <button data-id="${item.id}">Fjern</button>`;
        element.querySelector('button').addEventListener('click', () => removeScheduleItem(item.id));
        scheduleList.appendChild(element);
    });
}

function removeScheduleItem(id) {
    state.schedule = state.schedule.filter(item => item.id !== id);
    renderSchedule();
    saveState();
}

function renderDaySchedule(date) {
    daySchedule.innerHTML = '';
    const dayItems = state.schedule.filter(item => item.date === date);
    if (!dayItems.length) {
        daySchedule.innerHTML = '<p>Ingen sanger planlagt for denne dagen.</p>';
        return;
    }
    dayItems.sort((a, b) => a.time.localeCompare(b.time));
    dayItems.forEach(item => {
        const track = state.tracks.find(t => t.id === item.trackId);
        const element = document.createElement('div');
        element.className = 'day-item';
        element.innerHTML = `<strong>${item.time} — ${track ? track.name : 'Ukjent sang'}</strong>
            <span>${item.duration} min</span>`;
        daySchedule.appendChild(element);
    });
}

function updateUserStatus() {
    if (state.currentUser) {
        currentUserStatus.textContent = `Logget inn som ${state.currentUser.username} (${state.currentUser.role})`;
        logoutButton.classList.remove('hidden');
    } else {
        currentUserStatus.textContent = 'Ingen bruker er logget inn.';
        logoutButton.classList.add('hidden');
    }
    renderDjPreview();
}

function registerUser(username, password, role) {
    if (!username || !password) {
        alert('Skriv inn brukernavn og passord.');
        return;
    }
    const exists = state.users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
        alert('Brukernavnet er allerede tatt.');
        return;
    }
    state.users.push({ username, password, role });
    saveState();
    alert('Bruker opprettet! Logg inn for å bruke funksjonene.');
}

function loginUser(username, password) {
    const user = state.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) {
        alert('Feil brukernavn eller passord.');
        return;
    }
    state.currentUser = { username: user.username, role: user.role };
    saveState();
    updateLiveStatus();
    updateUserStatus();
    alert(`Velkommen tilbake, ${user.username}!`);
    if (user.role === 'dj') {
        switchSection('dj');
    }
}

function logout() {
    state.currentUser = null;
    saveState();
    updateLiveStatus();
    updateUserStatus();
}

function updateLiveStatus() {
    if (state.currentUser && state.currentUser.role === 'dj') {
        liveStatus.innerHTML = 'Live status: <span>DJ ' + state.currentUser.username + ' er klar til å spille live</span>';
    } else {
        liveStatus.innerHTML = 'Live status: <span>Ingen live DJ</span>';
    }
}

function renderDjPreview() {
    // Banner background (image or color)
    if (state.djProfile.bannerVideoUrl) {
        const bannerVideo = document.getElementById('bannerVideo');
        bannerVideo.src = state.djProfile.bannerVideoUrl;
        bannerVideo.classList.remove('hidden');
        profileBanner.style.backgroundImage = '';
    } else {
        const bannerVideo = document.getElementById('bannerVideo');
        bannerVideo.classList.add('hidden');
        profileBanner.style.backgroundImage = state.djProfile.bgUrl ? `url('${state.djProfile.bgUrl}')` : 'linear-gradient(160deg, rgba(111,157,255,0.35), rgba(255,255,255,0.04))';
    }
    // Avatar
    const avatarEl = document.getElementById('profileAvatar');
    if (state.djProfile.avatarUrl) {
        avatarEl.style.backgroundImage = `url('${state.djProfile.avatarUrl}')`;
    } else {
        avatarEl.style.backgroundImage = '';
    }
    // Text
    profileName.textContent = state.djProfile.name || 'Ingen';
    profileBio.textContent = state.djProfile.about || 'Lag din DJ-profil for å vise om deg selv.';
    profileShowName.textContent = state.djProfile.showName || 'Ingen program';
    // Brightness and accent
    profileBanner.style.filter = `brightness(${state.djProfile.bannerBrightness || 0.9})`;
    // accent color usage could be applied to elements
}

function handleDjMediaInputs() {
    const profileInput = document.getElementById('djProfileImage');
    const bannerInput = document.getElementById('djBannerImage');
    const bannerVideoInput = document.getElementById('djBannerVideo');
    const brightness = document.getElementById('bannerBrightness');
    const accent = document.getElementById('bannerAccent');

    profileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        state.djProfile.avatarUrl = url;
        saveState();
        renderDjPreview();
    });

    bannerInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        state.djProfile.bgUrl = url;
        saveState();
        renderDjPreview();
    });

    bannerVideoInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        state.djProfile.bannerVideoUrl = url;
        saveState();
        renderDjPreview();
    });

    brightness.addEventListener('input', e => {
        state.djProfile.bannerBrightness = e.target.value;
        saveState();
        renderDjPreview();
    });

    accent.addEventListener('input', e => {
        state.djProfile.accent = e.target.value;
        saveState();
    });
}

function saveDjProfile(name, about, showName, bgUrl) {
    if (!state.currentUser || state.currentUser.role !== 'dj') {
        alert('Du må være logget inn som DJ for å lagre profil.');
        return;
    }
    state.djProfile = { name, about, showName, bgUrl };
    saveState();
    renderDjPreview();
    alert('DJ-profil lagret!');
}

function setupEventListeners() {
    document.getElementById('trackFile').addEventListener('change', event => {
        const file = event.target.files[0];
        if (file) {
            addLocalTrack(file);
            event.target.value = '';
        }
    });

    document.getElementById('addUrlTrack').addEventListener('click', () => {
        const trackUrl = document.getElementById('trackUrl').value.trim();
        if (!trackUrl) {
            alert('Lim inn en URL til en lydfil.');
            return;
        }
        addUrlTrack(trackUrl);
        document.getElementById('trackUrl').value = '';
    });

    document.getElementById('scheduleForm').addEventListener('submit', event => {
        event.preventDefault();
        const trackId = scheduleTrackSelect.value;
        const date = document.getElementById('scheduleDate').value;
        const time = document.getElementById('scheduleTime').value;
        const duration = document.getElementById('scheduleDuration').value;
        if (!trackId || !date || !time || !duration) {
            alert('Fyll inn alle feltene for å legge til i plan.');
            return;
        }
        const id = `schedule-${Date.now()}`;
        state.schedule.push({ id, trackId, date, time, duration });
        saveState();
        renderSchedule();
        alert('Sang lagt til i tidsplanen.');
        event.target.reset();
    });

    document.getElementById('showDaySchedule').addEventListener('click', () => {
        const selected = document.getElementById('calendarDate').value;
        if (!selected) {
            alert('Velg en dato.');
            return;
        }
        renderDaySchedule(selected);
    });

    document.getElementById('djProfileForm').addEventListener('submit', event => {
        event.preventDefault();
        const name = document.getElementById('djName').value.trim();
        const about = document.getElementById('djBackground').value.trim();
        const showName = document.getElementById('djShowName').value.trim();
        const bgUrl = document.getElementById('djBgUrl').value.trim();
        saveDjProfile(name, about, showName, bgUrl);
    });

    document.getElementById('signupForm').addEventListener('submit', event => {
        event.preventDefault();
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value.trim();
        const role = document.getElementById('signupRole').value;
        registerUser(username, password, role);
        event.target.reset();
    });

    document.getElementById('loginForm').addEventListener('submit', event => {
        event.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        loginUser(username, password);
        event.target.reset();
    });

    logoutButton.addEventListener('click', logout);

    document.getElementById('playNext').addEventListener('click', () => {
        const currentIndex = state.tracks.findIndex(track => track.source === audioPlayer.src || track.url === audioPlayer.src);
        const nextIndex = (currentIndex + 1) % state.tracks.length;
        playTrack(state.tracks[nextIndex].id);
    });

    document.getElementById('playRandom').addEventListener('click', () => {
        const random = Math.floor(Math.random() * state.tracks.length);
        playTrack(state.tracks[random].id);
    });

    // station controls
    if (document.getElementById('stationSelect')) {
        renderStations();
        document.getElementById('playStationBtn').addEventListener('click', playSelectedStation);
        document.getElementById('stopStationBtn').addEventListener('click', stopStation);
        document.getElementById('addStationBtn').addEventListener('click', addStationFromForm);
    }

    // labels
    if (document.getElementById('addLabelBtn')) {
        renderLabels();
        document.getElementById('addLabelBtn').addEventListener('click', addLabelFromForm);
    }
}

function init() {
    loadState();
    setupEventListeners();
    renderTrackList();
    renderSchedule();
    updateUserStatus();
    updateLiveStatus();
    renderDjPreview();
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('scheduleDate').value = today;
    document.getElementById('calendarDate').value = today;
}

init();
