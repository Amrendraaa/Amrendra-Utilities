// ===== HOME PAGE FUNCTIONALITY =====

// App Settings Class
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
        this.loadStats();
    }

    setupEventListeners() {
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('profileBtn').addEventListener('click', () => this.toggleProfileDropdown());
        document.getElementById('saveNameBtn').addEventListener('click', () => this.saveUserName());
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportDataAsTextFile());
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('profileDropdown');
            const profileBtn = document.getElementById('profileBtn');
            if (!dropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.applySettings();
        this.saveSettings();
    }

    applySettings() {
        const body = document.body;
        const toggle = document.getElementById('darkModeToggle');
        
        if (this.darkMode) {
            body.classList.add('dark-mode');
            toggle.classList.add('dark');
        } else {
            body.classList.remove('dark-mode');
            toggle.classList.remove('dark');
        }
    }

    toggleProfileDropdown() {
        const dropdown = document.getElementById('profileDropdown');
        dropdown.classList.toggle('active');
    }

    saveUserName() {
        const input = document.getElementById('userNameInput');
        this.userName = input.value.trim();
        
        if (this.userName) {
            this.updateAppTitle();
            this.updateUserInitial();
            this.saveSettings();
            this.showMessage('Name saved successfully!', 'success');
            document.getElementById('profileDropdown').classList.remove('active');
        } else {
            this.showMessage('Please enter a valid name', 'error');
        }
    }

    updateAppTitle() {
        const title = document.getElementById('appTitle');
        if (this.userName) {
            title.textContent = `${this.userName}'s Utilities`;
        } else {
            title.textContent = "Amrendra's Utilities";
        }
    }

    updateUserInitial() {
        const initial = document.getElementById('userInitial');
        if (this.userName) {
            initial.textContent = this.userName.charAt(0).toUpperCase();
        } else {
            initial.textContent = 'A';
        }
    }

    loadStats() {
        // Load stats from all sections
        const stats = this.gatherAllData();
        
        document.getElementById('totalTasks').textContent = stats.totalTasks;
        document.getElementById('completedTasks').textContent = stats.completedTasks;
        document.getElementById('focusMinutes').textContent = stats.focusMinutes;
        document.getElementById('totalRecipes').textContent = stats.totalRecipes;
    }

    exportDataAsTextFile() {
        const data = this.gatherAllData();
        const content = this.formatDataForExport(data);
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amrendra-utilities-export-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('Data exported successfully!', 'success');
    }

    gatherAllData() {
        const stats = {
            totalTasks: 0,
            completedTasks: 0,
            focusMinutes: 0,
            totalRecipes: 0,
            todos: [],
            studyTasks: [],
            recipes: [],
            ideas: []
        };

        // Load To-Do data
        try {
            const todos = JSON.parse(localStorage.getItem('todos') || '[]');
            stats.todos = todos;
            stats.totalTasks += todos.length;
            stats.completedTasks += todos.filter(task => task.completed).length;
        } catch (e) {
            console.error('Error loading todos:', e);
        }

        // Load Study Planner data
        try {
            const studyTasks = JSON.parse(localStorage.getItem('studyTasks') || '[]');
            const focusLogs = JSON.parse(localStorage.getItem('focusLogs') || '[]');
            stats.studyTasks = studyTasks;
            stats.totalTasks += studyTasks.length;
            stats.completedTasks += studyTasks.filter(task => task.completed).length;
            stats.focusMinutes = focusLogs.reduce((total, log) => total + (log.duration || 0), 0);
        } catch (e) {
            console.error('Error loading study data:', e);
        }

        // Load Recipe data
        try {
            const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
            stats.recipes = recipes;
            stats.totalRecipes = recipes.length;
        } catch (e) {
            console.error('Error loading recipes:', e);
        }

        // Load Idea Board data
        try {
            const ideas = JSON.parse(localStorage.getItem('ideas') || '[]');
            stats.ideas = ideas;
        } catch (e) {
            console.error('Error loading ideas:', e);
        }

        return stats;
    }

    formatDataForExport(data) {
        let content = `AMRENDRA'S UTILITIES - DATA EXPORT\n`;
        content += `Generated on: ${new Date().toLocaleString()}\n`;
        content += `User: ${this.userName || 'Not set'}\n\n`;
        
        content += `=== SUMMARY ===\n`;
        content += `Total Tasks: ${data.totalTasks}\n`;
        content += `Completed Tasks: ${data.completedTasks}\n`;
        content += `Focus Minutes: ${data.focusMinutes}\n`;
        content += `Total Recipes: ${data.totalRecipes}\n`;
        content += `Total Ideas: ${data.ideas.length}\n\n`;

        content += `=== TO-DO LIST ===\n`;
        if (data.todos.length === 0) {
            content += `No tasks found.\n\n`;
        } else {
            data.todos.forEach((task, index) => {
                content += `${index + 1}. ${task.name} ${task.completed ? '[COMPLETED]' : ''}\n`;
                if (task.description) content += `   Description: ${task.description}\n`;
                if (task.dueDate) content += `   Due: ${task.dueDate}\n`;
                if (task.label) content += `   Label: ${task.label}\n`;
                content += `\n`;
            });
        }

        content += `=== STUDY PLANNER ===\n`;
        if (data.studyTasks.length === 0) {
            content += `No study tasks found.\n\n`;
        } else {
            data.studyTasks.forEach((task, index) => {
                content += `${index + 1}. ${task.name} ${task.completed ? '[COMPLETED]' : ''}\n`;
                if (task.subject) content += `   Subject: ${task.subject}\n`;
                if (task.description) content += `   Description: ${task.description}\n`;
                content += `\n`;
            });
        }

        content += `=== RECIPES ===\n`;
        if (data.recipes.length === 0) {
            content += `No recipes found.\n\n`;
        } else {
            data.recipes.forEach((recipe, index) => {
                content += `${index + 1}. ${recipe.name}\n`;
                if (recipe.description) content += `   Description: ${recipe.description}\n`;
                if (recipe.cookingTime) content += `   Cooking Time: ${recipe.cookingTime}\n`;
                if (recipe.ingredients && recipe.ingredients.length > 0) {
                    content += `   Ingredients:\n`;
                    recipe.ingredients.forEach(ingredient => {
                        content += `     - ${ingredient}\n`;
                    });
                }
                if (recipe.steps && recipe.steps.length > 0) {
                    content += `   Steps:\n`;
                    recipe.steps.forEach((step, stepIndex) => {
                        content += `     ${stepIndex + 1}. ${step}\n`;
                    });
                }
                content += `\n`;
            });
        }

        content += `=== IDEAS ===\n`;
        if (data.ideas.length === 0) {
            content += `No ideas found.\n\n`;
        } else {
            data.ideas.forEach((idea, index) => {
                content += `${index + 1}. ${idea.title}\n`;
                if (idea.description) content += `   Description: ${idea.description}\n`;
                if (idea.category) content += `   Category: ${idea.category}\n`;
                if (idea.priority) content += `   Priority: ${idea.priority}\n`;
                content += `\n`;
            });
        }

        return content;
    }

    saveSettings() {
        const settings = {
            userName: this.userName,
            darkMode: this.darkMode
        };
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('appSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.userName = settings.userName || '';
                this.darkMode = settings.darkMode || false;
                
                // Update UI
                const input = document.getElementById('userNameInput');
                if (input) input.value = this.userName;
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }

    showMessage(message, type = 'success') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
        `;
        
        document.body.appendChild(messageEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
}

// Home Page Stats Manager
class HomeStatsManager {
    constructor() {
        this.loadStats();
    }

    loadStats() {
        const stats = this.gatherAllData();
        
        document.getElementById('totalTasks').textContent = stats.totalTasks;
        document.getElementById('completedTasks').textContent = stats.completedTasks;
        document.getElementById('focusMinutes').textContent = stats.focusMinutes;
        document.getElementById('totalRecipes').textContent = stats.totalRecipes;
    }

    gatherAllData() {
        const stats = {
            totalTasks: 0,
            completedTasks: 0,
            focusMinutes: 0,
            totalRecipes: 0,
            todos: [],
            studyTasks: [],
            recipes: [],
            ideas: []
        };

        // Load To-Do data
        try {
            const todos = JSON.parse(localStorage.getItem('todoTasks') || '[]');
            stats.todos = todos;
            stats.totalTasks += todos.length;
            stats.completedTasks += todos.filter(task => task.completed).length;
        } catch (e) {
            console.error('Error loading todos:', e);
        }

        // Load Study Planner data
        try {
            const studyTasks = JSON.parse(localStorage.getItem('studyTasks') || '[]');
            const focusLogs = JSON.parse(localStorage.getItem('focusLogs') || '[]');
            stats.studyTasks = studyTasks;
            stats.totalTasks += studyTasks.length;
            stats.completedTasks += studyTasks.filter(task => task.completed).length;
            stats.focusMinutes = focusLogs.reduce((total, log) => total + (log.duration || 0), 0);
        } catch (e) {
            console.error('Error loading study data:', e);
        }

        // Load Recipe data
        try {
            const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
            stats.recipes = recipes;
            stats.totalRecipes = recipes.length;
        } catch (e) {
            console.error('Error loading recipes:', e);
        }

        // Load Idea Board data
        try {
            const ideas = JSON.parse(localStorage.getItem('ideas') || '[]');
            stats.ideas = ideas;
        } catch (e) {
            console.error('Error loading ideas:', e);
        }

        return stats;
    }

    exportDataAsTextFile() {
        const data = this.gatherAllData();
        const content = this.formatDataForExport(data);
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amrendra-utilities-export-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        MessageUtils.showMessage('Data exported successfully!');
    }

    formatDataForExport(data) {
        let content = `AMRENDRA'S UTILITIES - DATA EXPORT\n`;
        content += `Generated on: ${new Date().toLocaleString()}\n`;
        content += `User: ${appSettings.userName || 'Not set'}\n\n`;
        
        content += `=== SUMMARY ===\n`;
        content += `Total Tasks: ${data.totalTasks}\n`;
        content += `Completed Tasks: ${data.completedTasks}\n`;
        content += `Focus Minutes: ${data.focusMinutes}\n`;
        content += `Total Recipes: ${data.totalRecipes}\n`;
        content += `Total Ideas: ${data.ideas.length}\n\n`;

        content += `=== TO-DO LIST ===\n`;
        if (data.todos.length === 0) {
            content += `No tasks found.\n\n`;
        } else {
            data.todos.forEach((task, index) => {
                content += `${index + 1}. ${task.name} ${task.completed ? '[COMPLETED]' : ''}\n`;
                if (task.description) content += `   Description: ${task.description}\n`;
                if (task.dueDate) content += `   Due: ${task.dueDate}\n`;
                if (task.label) content += `   Label: ${task.label}\n`;
                content += `\n`;
            });
        }

        content += `=== STUDY PLANNER ===\n`;
        if (data.studyTasks.length === 0) {
            content += `No study tasks found.\n\n`;
        } else {
            data.studyTasks.forEach((task, index) => {
                content += `${index + 1}. ${task.name} ${task.completed ? '[COMPLETED]' : ''}\n`;
                if (task.subject) content += `   Subject: ${task.subject}\n`;
                if (task.description) content += `   Description: ${task.description}\n`;
                content += `\n`;
            });
        }

        content += `=== RECIPES ===\n`;
        if (data.recipes.length === 0) {
            content += `No recipes found.\n\n`;
        } else {
            data.recipes.forEach((recipe, index) => {
                content += `${index + 1}. ${recipe.name}\n`;
                if (recipe.description) content += `   Description: ${recipe.description}\n`;
                if (recipe.cookingTime) content += `   Cooking Time: ${recipe.cookingTime}\n`;
                if (recipe.ingredients && recipe.ingredients.length > 0) {
                    content += `   Ingredients:\n`;
                    recipe.ingredients.forEach(ingredient => {
                        content += `     - ${ingredient}\n`;
                    });
                }
                if (recipe.steps && recipe.steps.length > 0) {
                    content += `   Steps:\n`;
                    recipe.steps.forEach((step, stepIndex) => {
                        content += `     ${stepIndex + 1}. ${step}\n`;
                    });
                }
                content += `\n`;
            });
        }

        content += `=== IDEAS ===\n`;
        if (data.ideas.length === 0) {
            content += `No ideas found.\n\n`;
        } else {
            data.ideas.forEach((idea, index) => {
                content += `${index + 1}. ${idea.title}\n`;
                if (idea.description) content += `   Description: ${idea.description}\n`;
                if (idea.category) content += `   Category: ${idea.category}\n`;
                if (idea.priority) content += `   Priority: ${idea.priority}\n`;
                content += `\n`;
            });
        }

        return content;
    }
}

// ===== INITIALIZATION =====
let appSettings, homeStatsManager;

document.addEventListener('DOMContentLoaded', function() {
    appSettings = new AppSettings();
    homeStatsManager = new HomeStatsManager();
    
    // Override the export data method to use home-specific data
    appSettings.gatherAllData = () => homeStatsManager.formatDataForExport(homeStatsManager.gatherAllData());
    appSettings.exportDataAsTextFile = () => homeStatsManager.exportDataAsTextFile();
});

// Navigation function
function navigateTo(url) {
    window.location.href = url;
}

// Add CSS animations for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 