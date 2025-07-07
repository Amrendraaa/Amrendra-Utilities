// ===== SHARED UTILITIES =====

// Base Storage Class for localStorage operations
class BaseStorage {
    constructor(storageKey) {
        this.storageKey = storageKey;
        this.data = [];
    }

    load() {
        const saved = localStorage.getItem(this.storageKey);
        this.data = saved ? JSON.parse(saved) : [];
        return this.data;
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    add(item) {
        this.data.push(item);
        this.save();
    }

    delete(id) {
        this.data = this.data.filter(item => item.id !== id);
        this.save();
    }

    update(id, updates) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates };
            this.save();
        }
    }

    find(id) {
        return this.data.find(item => item.id === id);
    }

    getAll() {
        return this.data;
    }

    clear() {
        this.data = [];
        this.save();
    }
}

// Base Form Class for form handling
class BaseForm {
    constructor(formId, fields) {
        this.form = document.getElementById(formId);
        this.fields = fields;
        this.setupForm();
    }

    setupForm() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {};
        
        this.fields.forEach(field => {
            data[field] = formData.get(field)?.trim() || '';
        });

        if (this.validate(data)) {
            this.onSuccess(data);
            this.reset();
        }
    }

    validate(data) {
        const required = this.fields.filter(field => {
            const element = this.form.querySelector(`[name="${field}"]`);
            return element && element.hasAttribute('required');
        });
        
        for (const field of required) {
            if (!data[field]) {
                this.showError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }
        return true;
    }

    reset() {
        if (this.form) {
            this.form.reset();
        }
    }

    showError(message) {
        MessageUtils.showMessage(message, 'error');
    }

    showSuccess(message) {
        MessageUtils.showMessage(message, 'success');
    }

    onSuccess(data) {
        // Override in child classes
    }
}

// App Settings Class for user preferences
class AppSettings {
    constructor() {
        this.userName = '';
        this.darkMode = false;
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.applySettings();
    }

    setupEventListeners() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const profileBtn = document.getElementById('profileBtn');
        const saveNameBtn = document.getElementById('saveNameBtn');
        const exportDataBtn = document.getElementById('exportDataBtn');
        const userNameInput = document.getElementById('userNameInput');

        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }
        
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.toggleProfileDropdown());
        }
        
        if (saveNameBtn) {
            saveNameBtn.addEventListener('click', () => this.saveUserName());
        }
        
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportDataAsTextFile());
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('profileDropdown');
            const profileBtn = document.getElementById('profileBtn');
            if (dropdown && profileBtn && !profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        // Handle Enter key
        if (userNameInput) {
            userNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.saveUserName();
            });
        }
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.saveSettings();
        this.applySettings();
        MessageUtils.showMessage(this.darkMode ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️');
    }

    applySettings() {
        document.body.classList.toggle('dark-mode', this.darkMode);
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.classList.toggle('dark', this.darkMode);
        }
        this.updateAppTitle();
        this.updateUserInitial();
    }

    toggleProfileDropdown() {
        const dropdown = document.getElementById('profileDropdown');
        const input = document.getElementById('userNameInput');
        if (dropdown && input) {
            dropdown.classList.toggle('active');
            if (dropdown.classList.contains('active')) {
                input.value = this.userName;
                input.focus();
            }
        }
    }

    saveUserName() {
        const input = document.getElementById('userNameInput');
        if (!input) return;
        
        const newName = input.value.trim();
        
        if (newName) {
            this.userName = newName;
            this.saveSettings();
            this.updateAppTitle();
            this.updateUserInitial();
            const dropdown = document.getElementById('profileDropdown');
            if (dropdown) {
                dropdown.classList.remove('active');
            }
            MessageUtils.showMessage('Name updated successfully! 👤');
        } else {
            MessageUtils.showMessage('Please enter a valid name.', 'error');
        }
    }

    updateAppTitle() {
        const appTitle = document.querySelector('h1');
        if (appTitle) {
            const sectionName = this.getSectionName();
            appTitle.textContent = this.userName ? `${this.userName}'s ${sectionName}` : sectionName;
        }
    }

    updateUserInitial() {
        const userInitial = document.getElementById('userInitial');
        if (userInitial) {
            userInitial.textContent = this.userName ? this.userName.charAt(0).toUpperCase() : 'U';
        }
    }

    getSectionName() {
        const path = window.location.pathname;
        if (path.includes('todo')) return 'To-Do List';
        if (path.includes('study')) return 'Study Planner';
        if (path.includes('recipes')) return 'Recipe Organizer';
        if (path.includes('ideas')) return 'Idea Board';
        return 'Utilities';
    }

    exportDataAsTextFile() {
        try {
            const data = this.gatherAllData();
            const blob = new Blob([data], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.getSectionName().toLowerCase().replace(/\s+/g, '_')}_backup.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            MessageUtils.showMessage('Data exported successfully! 📄');
        } catch (error) {
            MessageUtils.showMessage('Error exporting data. Please try again.', 'error');
            console.error('Export error:', error);
        }
    }

    gatherAllData() {
        const userName = this.userName || 'User';
        const exportDate = new Date().toLocaleString();
        const sectionName = this.getSectionName();
        
        let data = `=== ${userName}'s ${sectionName} Backup ===\nExported on: ${exportDate}\n\n`;
        
        // This will be overridden by specific sections
        data += 'No data found.\n\n';
        data += '=== End of Backup ===\n';
        return data;
    }

    saveSettings() {
        localStorage.setItem('appSettings', JSON.stringify({
            userName: this.userName,
            darkMode: this.darkMode
        }));
    }

    loadSettings() {
        const saved = localStorage.getItem('appSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.userName = settings.userName || '';
            this.darkMode = settings.darkMode || false;
        }
    }
}

// Utility Functions
const Utils = {
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    },

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-GB');
    },

    formatDateTime(date) {
        return new Date(date).toLocaleString('en-GB');
    },

    createElement(tag, className, content) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.innerHTML = content;
        return element;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Message Utilities
const MessageUtils = {
    showMessage(message, type = 'success') {
        const messageDiv = Utils.createElement('div', 'message', message);
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            font-weight: 500;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }
};

// Navigation Utility
function navigateTo(url) {
    window.location.href = url;
}

// Add CSS animations for messages
if (!document.getElementById('message-animations')) {
    const style = document.createElement('style');
    style.id = 'message-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
} 