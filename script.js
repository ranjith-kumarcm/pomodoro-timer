// DOM Elements
const timeDisplay = document.getElementById('time-display');
const sessionStatus = document.getElementById('session-status');
const progressBar = document.getElementById('progress-bar');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const settingsForm = document.getElementById('settings-form');
const workInput = document.getElementById('work-duration');
const breakInput = document.getElementById('break-duration');
const presetSelect = document.getElementById('preset-select');
const errorMsg = document.getElementById('error-message');
const sessionCountDisplay = document.getElementById('session-count');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');

// State Variables
let timerInterval;
let timeLeft = 25 * 60; // in seconds
let totalTime = 25 * 60; // for progress calculation
let isRunning = false;
let isWorkSession = true;
let sessionCount = 0;
let historyData = [];
let settings = { work: 25, break: 5 };

// --- Audio Notification (Web Audio API for zero dependencies) ---
function playNotification() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // Beep pitch
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1);
    oscillator.stop(audioCtx.currentTime + 1);
}

// --- Local Storage Management ---
function saveToLocal() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    localStorage.setItem('pomodoroSessions', sessionCount);
    localStorage.setItem('pomodoroHistory', JSON.stringify(historyData));
}

function loadFromLocal() {
    const savedSettings = JSON.parse(localStorage.getItem('pomodoroSettings'));
    if (savedSettings) {
        settings = savedSettings;
        workInput.value = settings.work;
        breakInput.value = settings.break;
    }
    
    sessionCount = parseInt(localStorage.getItem('pomodoroSessions')) || 0;
    historyData = JSON.parse(localStorage.getItem('pomodoroHistory')) || [];
    
    sessionCountDisplay.textContent = sessionCount;
    renderHistory();
    resetTimer(); // Apply loaded settings to timer
}

// --- Core Timer Functions ---
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update Progress Bar
    const progressPercent = (timeLeft / totalTime) * 100;
    progressBar.style.width = `${progressPercent}%`;
}

function switchSession() {
    playNotification();
    
    if (isWorkSession) {
        sessionCount++;
        sessionCountDisplay.textContent = sessionCount;
        addHistoryEntry('Work completed');
        isWorkSession = false;
        timeLeft = settings.break * 60;
        totalTime = timeLeft;
        sessionStatus.textContent = 'Break Session';
        document.body.classList.add('break-mode');
    } else {
        addHistoryEntry('Break completed');
        isWorkSession = true;
        timeLeft = settings.work * 60;
        totalTime = timeLeft;
        sessionStatus.textContent = 'Work Session';
        document.body.classList.remove('break-mode');
    }
    
    saveToLocal();
    updateDisplay();
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft <= 0) {
            switchSession();
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    isWorkSession = true;
    document.body.classList.remove('break-mode');
    sessionStatus.textContent = 'Work Session';
    timeLeft = settings.work * 60;
    totalTime = timeLeft;
    updateDisplay();
}

// --- Tracking/History Functions ---
function addHistoryEntry(message) {
    const date = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const entry = `${date} - ${message}`;
    historyData.unshift(entry); // Add to beginning
    if (historyData.length > 10) historyData.pop(); // Keep last 10
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    historyData.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        historyList.appendChild(li);
    });
}

function clearHistory() {
    sessionCount = 0;
    historyData = [];
    sessionCountDisplay.textContent = sessionCount;
    renderHistory();
    saveToLocal();
}

// --- Validation & Form Handling ---
settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const workVal = parseInt(workInput.value);
    const breakVal = parseInt(breakInput.value);
    
    // Validation
    if (isNaN(workVal) || isNaN(breakVal) || workVal <= 0 || breakVal <= 0) {
        errorMsg.classList.remove('hidden');
        return;
    }
    
    errorMsg.classList.add('hidden');
    settings.work = workVal;
    settings.break = breakVal;
    presetSelect.value = 'custom'; // Reset dropdown to custom
    
    saveToLocal();
    resetTimer(); // Apply new times immediately
});

presetSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val !== 'custom') {
        const [work, brk] = val.split(',').map(Number);
        workInput.value = work;
        breakInput.value = brk;
    }
});

// --- Event Listeners ---
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
clearHistoryBtn.addEventListener('click', clearHistory);

// Initialize application
document.addEventListener('DOMContentLoaded', loadFromLocal);