// Planning Poker App

// Fibonacci sequence for planning poker cards
const cardValues = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'];

// Application state
let currentTask = '';
let selectedCard = null;
let estimationHistory = [];

// DOM Elements
const taskInput = document.getElementById('taskInput');
const currentTaskDisplay = document.getElementById('currentTaskDisplay');
const cardsContainer = document.getElementById('cardsContainer');
const selectedEstimate = document.getElementById('selectedEstimate');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Initialize the app
function init() {
    loadHistoryFromStorage();
    renderCards();
    renderHistory();
    attachEventListeners();
}

// Render planning poker cards
function renderCards() {
    cardsContainer.innerHTML = '';

    cardValues.forEach(value => {
        const card = document.createElement('div');
        card.className = 'card';
        card.textContent = value;
        card.dataset.value = value;

        card.addEventListener('click', () => selectCard(value, card));

        cardsContainer.appendChild(card);
    });
}

// Select a card
function selectCard(value, cardElement) {
    // Remove selection from all cards
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selection to clicked card
    cardElement.classList.add('selected');
    selectedCard = value;

    // Update selected estimate display
    selectedEstimate.textContent = `Selected: ${value} story points`;

    // Enable save button if task is entered
    updateSaveButtonState();
}

// Update save button state
function updateSaveButtonState() {
    const taskValue = taskInput.value.trim();
    saveBtn.disabled = !(taskValue && selectedCard);
}

// Save estimation and move to next task
function saveEstimation() {
    const taskValue = taskInput.value.trim();

    if (!taskValue || !selectedCard) {
        return;
    }

    // Create estimation record
    const estimation = {
        id: Date.now(),
        task: taskValue,
        estimate: selectedCard,
        timestamp: new Date().toLocaleString()
    };

    // Add to history
    estimationHistory.unshift(estimation);

    // Save to localStorage
    saveHistoryToStorage();

    // Render updated history
    renderHistory();

    // Clear for next task
    clearCurrentTask();

    // Show success feedback
    showSuccessMessage();
}

// Clear current task and selection
function clearCurrentTask() {
    taskInput.value = '';
    currentTaskDisplay.textContent = '';
    currentTaskDisplay.classList.remove('active');
    selectedCard = null;
    selectedEstimate.textContent = '';

    // Remove selection from all cards
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('selected');
    });

    // Disable save button
    saveBtn.disabled = true;

    // Focus on task input for next task
    taskInput.focus();
}

// Show success message
function showSuccessMessage() {
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.background = 'var(--success-color)';

    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
    }, 1500);
}

// Render estimation history
function renderHistory() {
    if (estimationHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No estimates saved yet. Start by entering a task and selecting a card!</p>';
        return;
    }

    historyList.innerHTML = '';

    estimationHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        historyItem.innerHTML = `
            <div class="history-item-content">
                <div class="history-item-task">${escapeHtml(item.task)}</div>
                <div class="history-item-meta">
                    <span class="history-item-estimate">${escapeHtml(item.estimate)}</span>
                    <span class="history-item-time">${escapeHtml(item.timestamp)}</span>
                </div>
            </div>
            <button class="history-item-delete" data-id="${item.id}">Delete</button>
        `;

        // Add delete functionality
        const deleteBtn = historyItem.querySelector('.history-item-delete');
        deleteBtn.addEventListener('click', () => deleteEstimation(item.id));

        historyList.appendChild(historyItem);
    });
}

// Delete a single estimation
function deleteEstimation(id) {
    if (confirm('Are you sure you want to delete this estimation?')) {
        estimationHistory = estimationHistory.filter(item => item.id !== id);
        saveHistoryToStorage();
        renderHistory();
    }
}

// Clear all history
function clearAllHistory() {
    if (estimationHistory.length === 0) {
        return;
    }

    if (confirm('Are you sure you want to clear all estimation history? This cannot be undone.')) {
        estimationHistory = [];
        saveHistoryToStorage();
        renderHistory();
    }
}

// Save history to localStorage
function saveHistoryToStorage() {
    try {
        localStorage.setItem('planningPokerHistory', JSON.stringify(estimationHistory));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

// Load history from localStorage
function loadHistoryFromStorage() {
    try {
        const saved = localStorage.getItem('planningPokerHistory');
        if (saved) {
            estimationHistory = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        estimationHistory = [];
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update current task display
function updateTaskDisplay() {
    const taskValue = taskInput.value.trim();

    if (taskValue) {
        currentTaskDisplay.textContent = taskValue;
        currentTaskDisplay.classList.add('active');
        currentTask = taskValue;
    } else {
        currentTaskDisplay.classList.remove('active');
        currentTask = '';
    }

    updateSaveButtonState();
}

// Attach event listeners
function attachEventListeners() {
    // Task input
    taskInput.addEventListener('input', updateTaskDisplay);

    // Enter key on task input to focus on cards
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstCard = document.querySelector('.card');
            if (firstCard && taskInput.value.trim()) {
                firstCard.focus();
            }
        }
    });

    // Save button
    saveBtn.addEventListener('click', saveEstimation);

    // Clear button
    clearBtn.addEventListener('click', () => {
        if (selectedCard || taskInput.value.trim()) {
            clearCurrentTask();
        }
    });

    // Clear history button
    clearHistoryBtn.addEventListener('click', clearAllHistory);

    // Keyboard shortcuts for cards
    document.addEventListener('keydown', (e) => {
        // Only if task input is not focused
        if (document.activeElement === taskInput) {
            return;
        }

        // Number keys for card selection
        const key = e.key;
        const cardIndex = cardValues.indexOf(key);

        if (cardIndex !== -1) {
            const cards = document.querySelectorAll('.card');
            const card = cards[cardIndex];
            if (card) {
                selectCard(key, card);
            }
        }

        // Enter key to save
        if (e.key === 'Enter' && !saveBtn.disabled) {
            saveEstimation();
        }

        // Escape key to clear
        if (e.key === 'Escape') {
            clearCurrentTask();
        }
    });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

