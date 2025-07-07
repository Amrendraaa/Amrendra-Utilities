// All base classes and utilities (AppSettings, BaseStorage, BaseForm, Utils, MessageUtils, etc.) are imported from ../shared/utils.js
// Only section-specific code is defined below.

// ===== STUDY PLANNER FUNCTIONALITY =====

// Study Task Manager - extends BaseStorage for study task management
class StudyTaskManager extends BaseStorage {
    constructor() {
        super('studyTasks');
        this.load();
        this.setupForm();
        this.render();
    }

    setupForm() {
        this.form = new BaseForm('studyTaskForm', ['studyTaskName', 'subject', 'studyDueDate']);
        this.form.onSuccess = (data) => this.addTask(data);
    }

    addTask(data) {
        const task = {
            id: Utils.generateId(),
            name: data.studyTaskName,
            subject: data.subject,
            dueDate: data.studyDueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.add(task);
        this.render();
        this.form.showSuccess('Study task added successfully!');
    }

    toggleTask(id) {
        const task = this.find(id);
        if (task) {
            this.update(id, { completed: !task.completed });
            this.render();
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this study task?')) {
            this.delete(id);
            this.render();
            MessageUtils.showMessage('Study task deleted successfully!');
        }
    }

    render() {
        const container = document.getElementById('studyTasks');
        if (!container) return;

        if (this.data.length === 0) {
            container.innerHTML = '<div class="empty-state">No study tasks yet. Add your first task above!</div>';
            return;
        }

        container.innerHTML = this.data
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .map(task => this.createTaskCard(task))
            .join('');
    }

    createTaskCard(task) {
        const isOverdue = !task.completed && new Date(task.dueDate) < new Date();
        const dueDateClass = isOverdue ? 'task-due-date overdue' : 'task-due-date';
        const formattedDate = Utils.formatDate(task.dueDate);

        return `
            <div class="study-task-card ${task.completed ? 'completed' : ''}">
                <input type="checkbox" class="task-checkbox" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="studyTaskManager.toggleTask('${task.id}')">
                <div class="task-content">
                    <div class="task-name">${task.name}</div>
                    <div class="task-details">
                        <span class="study-task-subject">${task.subject}</span>
                        <span class="${dueDateClass}">
                            Due: ${formattedDate}
                            ${isOverdue ? ' (Overdue)' : ''}
                        </span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-danger" onclick="studyTaskManager.deleteTask('${task.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    // Override gatherAllData for export functionality
    gatherAllData() {
        const userName = appSettings.userName || 'User';
        const exportDate = new Date().toLocaleString();
        
        let data = `=== ${userName}'s Study Planner Backup ===\nExported on: ${exportDate}\n\n`;

        if (this.data.length > 0) {
            this.data.forEach((task, index) => {
                data += `${index + 1}. ${task.name}\n`;
                data += `   Subject: ${task.subject}\n`;
                data += `   Due: ${task.dueDate}\n`;
                data += `   Status: ${task.completed ? 'Completed' : 'Pending'}\n`;
                data += `   Created: ${Utils.formatDateTime(task.createdAt)}\n\n`;
            });
        } else {
            data += 'No study tasks found.\n\n';
        }

        data += '=== End of Backup ===\n';
        return data;
    }
}

// Imported Tasks Manager
class ImportedTaskManager {
    constructor() {
        this.importedTasks = [];
        this.setupImportButton();
    }

    setupImportButton() {
        const importBtn = document.getElementById('importFromTodo');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importFromTodo());
        }
    }

    importFromTodo() {
        const todoTasks = JSON.parse(localStorage.getItem('todoTasks') || '[]');
        this.importedTasks = todoTasks.filter(task => {
            const taskName = task.name.toLowerCase();
            const taskLabel = (task.label || '').toLowerCase();
            
            const studyKeywords = ['study', 'read', 'learn', 'practice', 'homework', 
                                 'assignment', 'exam', 'test', 'quiz', 'research'];
            
            const nameMatches = studyKeywords.some(keyword => taskName.includes(keyword));
            const labelMatches = taskLabel === 'study';
            
            return nameMatches || labelMatches;
        });
        
        this.renderImportedTasks();
        MessageUtils.showMessage(`Imported ${this.importedTasks.length} study-related tasks!`);
    }

    renderImportedTasks() {
        const container = document.getElementById('importedTasks');
        if (!container) return;

        if (this.importedTasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No study-related tasks found in To-Do list</div>';
            return;
        }

        container.innerHTML = this.importedTasks.map(task => this.createImportedTaskCard(task)).join('');
    }

    createImportedTaskCard(task) {
        const isOverdue = new Date(task.dueDate) < new Date();
        const dueDateClass = isOverdue ? 'task-due-date overdue' : 'task-due-date';
        const formattedDate = Utils.formatDate(task.dueDate);

        return `
            <div class="imported-task-card">
                <div class="task-content">
                    <div class="task-name">${task.name}</div>
                    <div class="task-details">
                        <span class="task-label ${task.label.toLowerCase()}">${task.label}</span>
                        <span class="${dueDateClass}">
                            Due: ${formattedDate}
                            ${isOverdue ? ' (Overdue)' : ''}
                        </span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-primary" onclick="importedTaskManager.addToStudyTasks('${task.id}')">
                        Add to Study Tasks
                    </button>
                </div>
            </div>
        `;
    }

    addToStudyTasks(taskId) {
        const task = this.importedTasks.find(t => t.id === taskId);
        if (task) {
            const studyTask = {
                id: Utils.generateId(),
                name: task.name,
                subject: task.label,
                dueDate: task.dueDate,
                completed: false,
                createdAt: new Date().toISOString()
            };

            studyTaskManager.add(studyTask);
            studyTaskManager.render();
            this.importedTasks = this.importedTasks.filter(t => t.id !== taskId);
            this.renderImportedTasks();
            MessageUtils.showMessage('Task added to study tasks!');
        }
    }
}

// Pomodoro Timer
class PomodoroTimer {
    constructor() {
        this.currentTime = 25 * 60; // 25 minutes in seconds
        this.originalTime = 25 * 60;
        this.isRunning = false;
        this.isPaused = false;
        this.timerInterval = null;
        this.setupTimer();
        this.setupPresets();
        this.setupControls();
    }

    setupTimer() {
        this.updateDisplay();
    }

    setupPresets() {
        const presets = [
            { name: 'Pomodoro', time: 25 * 60 },
            { name: 'Short Break', time: 5 * 60 },
            { name: 'Long Break', time: 15 * 60 },
            { name: 'Custom', time: 30 * 60 }
        ];

        const presetsContainer = document.getElementById('timerPresets');
        if (presetsContainer) {
            presetsContainer.innerHTML = presets.map(preset => 
                `<button class="btn btn-secondary" onclick="pomodoroTimer.setTime(${preset.time})">${preset.name}</button>`
            ).join('');
        }
    }

    setupControls() {
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        const resetBtn = document.getElementById('resetTimer');
        const completeBtn = document.getElementById('completeTimer');

        if (startBtn) startBtn.addEventListener('click', () => this.start());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (completeBtn) completeBtn.addEventListener('click', () => this.complete());
    }

    setTime(seconds) {
        this.currentTime = seconds;
        this.originalTime = seconds;
        this.updateDisplay();
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.timerInterval = setInterval(() => {
                this.currentTime--;
                this.updateDisplay();
                
                if (this.currentTime <= 0) {
                    this.complete();
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.isPaused = true;
            clearInterval(this.timerInterval);
        }
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        this.currentTime = this.originalTime;
        this.updateDisplay();
    }

    complete() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        this.currentTime = 0;
        this.updateDisplay();
        this.showNotification();
        MessageUtils.showMessage('Pomodoro session completed! 🎉');
    }

    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = timeDisplay;
        }
    }

    showNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', {
                body: 'Your session is complete!',
                icon: '/favicon.ico'
            });
        }
    }
}

// Focus Time Logger
class FocusTimeLogger extends BaseStorage {
    constructor() {
        super('focusLogs');
        this.load();
        this.render();
    }

    addEntry(minutes) {
        const entry = {
            id: Utils.generateId(),
            duration: minutes,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        this.add(entry);
        this.render();
    }

    render() {
        const container = document.getElementById('focusLogs');
        if (!container) return;

        if (this.data.length === 0) {
            container.innerHTML = '<div class="empty-state">No focus sessions logged yet</div>';
            return;
        }

        const recentLogs = this.data
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        container.innerHTML = recentLogs.map(entry => this.createEntryCard(entry)).join('');
    }

    createEntryCard(entry) {
        const formattedDate = Utils.formatDateTime(entry.date);
        return `
            <div class="focus-log-entry">
                <div class="focus-duration">${entry.duration} minutes</div>
                <div class="focus-date">${formattedDate}</div>
            </div>
        `;
    }
}

// ===== INITIALIZATION =====
let appSettings, studyTaskManager, importedTaskManager, pomodoroTimer, focusLogger;

document.addEventListener('DOMContentLoaded', function() {
    appSettings = new AppSettings();
    studyTaskManager = new StudyTaskManager();
    importedTaskManager = new ImportedTaskManager();
    pomodoroTimer = new PomodoroTimer();
    focusLogger = new FocusTimeLogger();
    
    // Override the export data method to use study-specific data
    appSettings.gatherAllData = () => studyTaskManager.gatherAllData();
});