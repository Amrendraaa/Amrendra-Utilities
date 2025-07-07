// ===== TODO LIST FUNCTIONALITY =====

// TodoList Class - extends BaseStorage for task management
class TodoList extends BaseStorage {
    constructor() {
        super('todoTasks');
        this.load();
        this.setupForm();
        this.render();
    }

    setupForm() {
        this.form = new BaseForm('taskForm', ['taskName', 'dueDate', 'taskLabel']);
        this.form.onSuccess = (data) => this.addTask(data);
        
        // Setup clear completed button
        const clearCompletedBtn = document.getElementById('clearCompleted');
        if (clearCompletedBtn) {
            clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        }
    }

    addTask(data) {
        const task = {
            id: Utils.generateId(),
            name: data.taskName,
            dueDate: data.dueDate,
            label: data.taskLabel,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.add(task);
        this.render();
        this.form.showSuccess('Task added successfully!');
    }

    toggleTask(id) {
        const task = this.find(id);
        if (task) {
            this.update(id, { completed: !task.completed });
            this.render();
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.delete(id);
            this.render();
            MessageUtils.showMessage('Task deleted successfully!');
        }
    }

    clearCompleted() {
        if (confirm('Are you sure you want to delete all completed tasks?')) {
            this.data = this.data.filter(task => !task.completed);
            this.save();
            this.render();
            MessageUtils.showMessage('Completed tasks cleared successfully!');
        }
    }

    render() {
        this.renderSection('pendingTasks', this.data.filter(task => !task.completed));
        this.renderSection('completedTasks', this.data.filter(task => task.completed));
    }

    renderSection(containerId, tasks) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks found</div>';
            return;
        }

        container.innerHTML = tasks.map(task => this.createTaskCard(task)).join('');
    }

    createTaskCard(task) {
        const isOverdue = !task.completed && new Date(task.dueDate) < new Date();
        const dueDateClass = isOverdue ? 'task-due-date overdue' : 'task-due-date';
        const formattedDate = Utils.formatDate(task.dueDate);

        return `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="todoList.toggleTask('${task.id}')">
                <div class="task-content">
                    <div class="task-name">${task.name}</div>
                    <div class="task-details">
                        <span class="${dueDateClass}">Due: ${formattedDate}</span>
                        <span class="task-label ${task.label.toLowerCase()}">${task.label}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-danger" onclick="todoList.deleteTask('${task.id}')">Delete</button>
                </div>
            </div>
        `;
    }

    // Override gatherAllData for export functionality
    gatherAllData() {
        const userName = appSettings.userName || 'User';
        const exportDate = new Date().toLocaleString();
        
        let data = `=== ${userName}'s To-Do List Backup ===\nExported on: ${exportDate}\n\n`;

        if (this.data.length > 0) {
            this.data.forEach((task, index) => {
                data += `${index + 1}. ${task.name}\n`;
                data += `   Due: ${task.dueDate}\n`;
                data += `   Label: ${task.label}\n`;
                data += `   Status: ${task.completed ? 'Completed' : 'Pending'}\n`;
                data += `   Created: ${Utils.formatDateTime(task.createdAt)}\n\n`;
            });
        } else {
            data += 'No tasks found.\n\n';
        }

        data += '=== End of Backup ===\n';
        return data;
    }
}

// ===== INITIALIZATION =====
let appSettings, todoList;

document.addEventListener('DOMContentLoaded', function() {
    appSettings = new AppSettings();
    todoList = new TodoList();
    
    // Override the export data method to use todo-specific data
    appSettings.gatherAllData = () => todoList.gatherAllData();
}); 