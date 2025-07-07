// All base classes and utilities (AppSettings, BaseStorage, BaseForm, Utils, MessageUtils, etc.) are imported from ../shared/utils.js
// Only section-specific code is defined below.

// ===== IDEA BOARD FUNCTIONALITY =====

// Idea Manager - extends BaseStorage for idea management
class IdeaManager extends BaseStorage {
    constructor() {
        super('ideas');
        this.load();
        this.setupForm();
        this.setupDescriptionCounter();
        this.render();
        this.updateFilters();
    }

    setupForm() {
        this.form = new BaseForm('ideaForm', [
            'ideaTitle', 'ideaCategory', 'ideaDescription', 
            'ideaPriority', 'ideaStatus', 'ideaTags', 'ideaNotes'
        ]);
        this.form.onSuccess = (data) => this.addIdea(data);
    }

    setupDescriptionCounter() {
        const descriptionField = document.getElementById('ideaDescription');
        const notesField = document.getElementById('ideaNotes');
        
        if (descriptionField) {
            // Create character counter
            const counter = document.createElement('div');
            counter.className = 'char-counter';
            counter.style.cssText = 'font-size: 0.8rem; color: #666; text-align: right; margin-top: 5px;';
            descriptionField.parentNode.appendChild(counter);
            
            const updateCounter = () => {
                const length = descriptionField.value.length;
                const maxLength = 1000; // Reasonable limit for descriptions
                counter.textContent = `${length}/${maxLength} characters`;
                counter.style.color = length > maxLength ? '#dc3545' : '#666';
                
                if (length > maxLength) {
                    descriptionField.style.borderColor = '#dc3545';
                } else {
                    descriptionField.style.borderColor = '';
                }
            };
            
            descriptionField.addEventListener('input', updateCounter);
            updateCounter(); // Initial count
        }
        
        if (notesField) {
            // Create character counter for notes
            const counter = document.createElement('div');
            counter.className = 'char-counter';
            counter.style.cssText = 'font-size: 0.8rem; color: #666; text-align: right; margin-top: 5px;';
            notesField.parentNode.appendChild(counter);
            
            const updateCounter = () => {
                const length = notesField.value.length;
                const maxLength = 500; // Shorter limit for notes
                counter.textContent = `${length}/${maxLength} characters`;
                counter.style.color = length > maxLength ? '#dc3545' : '#666';
                
                if (length > maxLength) {
                    notesField.style.borderColor = '#dc3545';
                } else {
                    notesField.style.borderColor = '';
                }
            };
            
            notesField.addEventListener('input', updateCounter);
            updateCounter(); // Initial count
        }
    }

    addIdea(data) {
        // Validate description length
        if (data.ideaDescription && data.ideaDescription.length > 1000) {
            MessageUtils.showMessage('Description is too long. Please keep it under 1000 characters.', 'error');
            return;
        }
        
        // Validate notes length
        if (data.ideaNotes && data.ideaNotes.length > 500) {
            MessageUtils.showMessage('Notes are too long. Please keep them under 500 characters.', 'error');
            return;
        }

        const idea = {
            id: Utils.generateId(),
            title: data.ideaTitle || '',
            category: data.ideaCategory || '',
            description: data.ideaDescription || '',
            priority: data.ideaPriority || 'medium',
            status: data.ideaStatus || 'new',
            tags: data.ideaTags ? data.ideaTags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            notes: data.ideaNotes || '',
            createdAt: new Date().toISOString()
        };

        this.add(idea);
        this.render();
        this.updateFilters();
        this.form.showSuccess('Idea captured successfully!');
    }

    deleteIdea(id) {
        if (confirm('Are you sure you want to delete this idea?')) {
            this.delete(id);
            this.render();
            this.updateFilters();
            MessageUtils.showMessage('Idea deleted successfully!');
        }
    }

    editIdea(id) {
        const idea = this.find(id);
        if (idea) {
            this.populateForm(idea);
            MessageUtils.showMessage('Idea loaded for editing!');
        }
    }

    populateForm(idea) {
        document.getElementById('ideaTitle').value = idea.title;
        document.getElementById('ideaCategory').value = idea.category;
        document.getElementById('ideaDescription').value = idea.description;
        document.getElementById('ideaPriority').value = idea.priority;
        document.getElementById('ideaStatus').value = idea.status;
        document.getElementById('ideaTags').value = idea.tags.join(', ');
        document.getElementById('ideaNotes').value = idea.notes;
        
        // Update character counters
        const descriptionField = document.getElementById('ideaDescription');
        const notesField = document.getElementById('ideaNotes');
        
        if (descriptionField) {
            descriptionField.dispatchEvent(new Event('input'));
        }
        if (notesField) {
            notesField.dispatchEvent(new Event('input'));
        }
    }

    updateIdeaStatus(id, newStatus) {
        const idea = this.find(id);
        if (idea) {
            this.update(id, { status: newStatus });
            this.render();
            MessageUtils.showMessage('Idea status updated!');
        }
    }

    render() {
        const container = document.getElementById('ideasContainer');
        if (!container) return;

        if (this.data.length === 0) {
            container.innerHTML = '<div class="empty-state">No ideas yet. Capture your first idea above!</div>';
            return;
        }

        container.innerHTML = this.data
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(idea => this.createIdeaCard(idea))
            .join('');
    }

    createIdeaCard(idea) {
        const formattedDate = Utils.formatDate(idea.createdAt);
        
        // Ensure description and notes are strings, handle undefined/null values
        const description = idea.description || '';
        const notes = idea.notes || '';
        
        // Truncate description if too long for display
        const displayDescription = description.length > 200 
            ? description.substring(0, 200) + '...' 
            : description;

        return `
            <div class="idea-card priority-${idea.priority}">
                <div class="idea-header">
                    <h3 class="idea-title">${idea.title}</h3>
                    <div class="idea-meta">
                        <span class="idea-category">${idea.category}</span>
                        <span class="idea-priority priority-${idea.priority}">${idea.priority}</span>
                        <span class="idea-status status-${idea.status}">${idea.status}</span>
                    </div>
                </div>
                
                <div class="idea-body">
                    <div class="idea-description">
                        ${displayDescription}
                        ${description.length > 200 ? 
                            `<button class="btn btn-link btn-sm" onclick="ideaManager.showFullDescription('${idea.id}')">Read more</button>` 
                            : ''}
                    </div>
                    
                    ${idea.tags && idea.tags.length > 0 ? `
                        <div class="idea-tags">
                            ${idea.tags.map(tag => `<span class="idea-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    ${notes ? `
                        <div class="idea-notes">
                            ${notes.length > 100 ? 
                                notes.substring(0, 100) + '...' : 
                                notes}
                            ${notes.length > 100 ? 
                                `<button class="btn btn-link btn-sm" onclick="ideaManager.showFullNotes('${idea.id}')">Read more</button>` 
                                : ''}
                        </div>
                    ` : ''}
                    
                    <div class="idea-actions">
                        <button class="btn btn-primary" onclick="ideaManager.editIdea('${idea.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="ideaManager.deleteIdea('${idea.id}')">Delete</button>
                        <select class="form-control" onchange="ideaManager.updateIdeaStatus('${idea.id}', this.value)">
                            <option value="new" ${idea.status === 'new' ? 'selected' : ''}>New</option>
                            <option value="in-progress" ${idea.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="completed" ${idea.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="on-hold" ${idea.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                            <option value="archived" ${idea.status === 'archived' ? 'selected' : ''}>Archived</option>
                        </select>
                    </div>
                    
                    <div class="idea-date">Added on ${formattedDate}</div>
                </div>
            </div>
        `;
    }

    showFullDescription(id) {
        const idea = this.find(id);
        if (idea && idea.description) {
            alert(`Full Description:\n\n${idea.description}`);
        } else {
            alert('No description available.');
        }
    }

    showFullNotes(id) {
        const idea = this.find(id);
        if (idea && idea.notes) {
            alert(`Full Notes:\n\n${idea.notes}`);
        } else {
            alert('No notes available.');
        }
    }

    updateFilters() {
        const categories = [...new Set(this.data.map(idea => idea.category))];
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (categoryFilter) {
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                if (category === currentValue) option.selected = true;
                categoryFilter.appendChild(option);
            });
        }
    }

    filterIdeas() {
        const searchTerm = document.getElementById('searchIdeas').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const sortBy = document.getElementById('sortIdeas').value;

        let filtered = this.data.filter(idea => {
            const matchesSearch = idea.title.toLowerCase().includes(searchTerm) ||
                                idea.description.toLowerCase().includes(searchTerm) ||
                                idea.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                                idea.notes.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || idea.category === categoryFilter;
            const matchesPriority = !priorityFilter || idea.priority === priorityFilter;
            const matchesStatus = !statusFilter || idea.status === statusFilter;

            return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
        });

        // Sort filtered results
        switch (sortBy) {
            case 'title':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'priority':
                const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
                filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                break;
            default: // date
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        this.renderFilteredIdeas(filtered);
    }

    renderFilteredIdeas(filteredIdeas) {
        const container = document.getElementById('ideasContainer');
        if (!container) return;

        if (filteredIdeas.length === 0) {
            container.innerHTML = '<div class="empty-state">No ideas match your filters.</div>';
            return;
        }

        container.innerHTML = filteredIdeas.map(idea => this.createIdeaCard(idea)).join('');
    }

    // Override gatherAllData for export functionality
    gatherAllData() {
        const userName = appSettings.userName || 'User';
        const exportDate = new Date().toLocaleString();
        
        let data = `=== ${userName}'s Idea Board Backup ===\nExported on: ${exportDate}\n\n`;

        if (this.data.length > 0) {
            this.data.forEach((idea, index) => {
                data += `${index + 1}. ${idea.title}\n`;
                data += `   Category: ${idea.category}\n`;
                data += `   Priority: ${idea.priority}\n`;
                data += `   Status: ${idea.status}\n`;
                data += `   Description: ${idea.description}\n`;
                if (idea.tags.length > 0) {
                    data += `   Tags: ${idea.tags.join(', ')}\n`;
                }
                if (idea.notes) {
                    data += `   Notes: ${idea.notes}\n`;
                }
                data += `   Created: ${Utils.formatDateTime(idea.createdAt)}\n\n`;
            });
        } else {
            data += 'No ideas found.\n\n';
        }

        data += '=== End of Backup ===\n';
        return data;
    }
}

// Filter Manager for handling search and filters
class FilterManager {
    static init() {
        const searchInput = document.getElementById('searchIdeas');
        const categoryFilter = document.getElementById('categoryFilter');
        const priorityFilter = document.getElementById('priorityFilter');
        const statusFilter = document.getElementById('statusFilter');
        const sortSelect = document.getElementById('sortIdeas');

        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => ideaManager.filterIdeas(), 300));
        }
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => ideaManager.filterIdeas());
        }
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => ideaManager.filterIdeas());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => ideaManager.filterIdeas());
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', () => ideaManager.filterIdeas());
        }
    }
}

// ===== INITIALIZATION =====
let appSettings, ideaManager;

document.addEventListener('DOMContentLoaded', function() {
    appSettings = new AppSettings();
    ideaManager = new IdeaManager();
    FilterManager.init();
    
    // Override the export data method to use idea-specific data
    appSettings.gatherAllData = () => ideaManager.gatherAllData();
}); 