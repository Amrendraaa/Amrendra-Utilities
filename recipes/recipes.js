// ===== GLOBAL VARIABLES =====
let recipes = [];
let filteredRecipes = [];

// ===== UTILITY FUNCTIONS =====
function navigateTo(url) {
    window.location.href = url;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== STORAGE MANAGEMENT =====
class StorageManager {
    static save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    static load(key, defaultValue = []) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    }

    static clear(key) {
        localStorage.removeItem(key);
    }
}

// ===== FORM HANDLING =====
class FormHandler {
    static handleSubmit(formId, callback) {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                // Handle arrays (ingredients and instructions)
                data.ingredients = Array.from(form.querySelectorAll('input[name="ingredients[]"]'))
                    .map(input => input.value.trim())
                    .filter(value => value !== '');
                
                data.instructions = Array.from(form.querySelectorAll('textarea[name="instructions[]"]'))
                    .map(textarea => textarea.value.trim())
                    .filter(value => value !== '');
                
                callback(data);
                form.reset();
                this.resetDynamicFields();
            });
        }
    }

    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) form.reset();
    }

    static resetDynamicFields() {
        // Reset ingredients to one field
        const ingredientsList = document.getElementById('ingredientsList');
        ingredientsList.innerHTML = `
            <div class="ingredient-item">
                <input type="text" name="ingredients[]" class="form-control ingredient-input" placeholder="e.g., 2 cups flour" required>
                <button type="button" class="btn btn-danger remove-ingredient" onclick="removeIngredient(this)">×</button>
            </div>
        `;

        // Reset instructions to one field
        const instructionsList = document.getElementById('instructionsList');
        instructionsList.innerHTML = `
            <div class="instruction-item">
                <textarea name="instructions[]" class="form-control instruction-input" rows="2" placeholder="Step 1: ..." required></textarea>
                <button type="button" class="btn btn-danger remove-instruction" onclick="removeInstruction(this)">×</button>
            </div>
        `;
    }
}

// ===== DYNAMIC FORM FIELDS =====
function addIngredient() {
    const ingredientsList = document.getElementById('ingredientsList');
    const newIngredient = document.createElement('div');
    newIngredient.className = 'ingredient-item';
    newIngredient.innerHTML = `
        <input type="text" name="ingredients[]" class="form-control ingredient-input" placeholder="e.g., 2 cups flour" required>
        <button type="button" class="btn btn-danger remove-ingredient" onclick="removeIngredient(this)">×</button>
    `;
    ingredientsList.appendChild(newIngredient);
}

function removeIngredient(button) {
    const ingredientsList = document.getElementById('ingredientsList');
    const ingredientItems = ingredientsList.querySelectorAll('.ingredient-item');
    
    if (ingredientItems.length > 1) {
        button.closest('.ingredient-item').remove();
    }
}

function addInstruction() {
    const instructionsList = document.getElementById('instructionsList');
    const newInstruction = document.createElement('div');
    newInstruction.className = 'instruction-item';
    newInstruction.innerHTML = `
        <textarea name="instructions[]" class="form-control instruction-input" rows="2" placeholder="Step ${instructionsList.children.length + 1}: ..." required></textarea>
        <button type="button" class="btn btn-danger remove-instruction" onclick="removeInstruction(this)">×</button>
    `;
    instructionsList.appendChild(newInstruction);
}

function removeInstruction(button) {
    const instructionsList = document.getElementById('instructionsList');
    const instructionItems = instructionsList.querySelectorAll('.instruction-item');
    
    if (instructionItems.length > 1) {
        button.closest('.instruction-item').remove();
    }
}

// ===== RECIPE ORGANIZER FUNCTIONALITY =====

// Recipe Manager - extends BaseStorage for recipe management
class RecipeManager extends BaseStorage {
    constructor() {
        super('recipes');
        this.load();
        this.setupForm();
        this.setupDynamicFields();
        this.render();
        this.updateFilters();
    }

    setupForm() {
        this.form = new BaseForm('recipeForm', [
            'recipeName', 'recipeCategory', 'recipeDescription', 
            'prepTime', 'cookTime', 'servings', 'recipeNotes'
        ]);
        this.form.onSuccess = (data) => this.addRecipe(data);
    }

    setupDynamicFields() {
        // Setup add ingredient button
        const addIngredientBtn = document.getElementById('addIngredient');
        if (addIngredientBtn) {
            addIngredientBtn.addEventListener('click', () => this.addIngredient());
        }

        // Setup add instruction button
        const addInstructionBtn = document.getElementById('addInstruction');
        if (addInstructionBtn) {
            addInstructionBtn.addEventListener('click', () => this.addInstruction());
        }
    }

    addRecipe(data) {
        // Get ingredients and instructions from dynamic fields
        const ingredients = Array.from(document.querySelectorAll('input[name="ingredients[]"]'))
            .map(input => input.value.trim())
            .filter(value => value !== '');
        
        const instructions = Array.from(document.querySelectorAll('textarea[name="instructions[]"]'))
            .map(textarea => textarea.value.trim())
            .filter(value => value !== '');

        const recipe = {
            id: Utils.generateId(),
            name: data.recipeName,
            category: data.recipeCategory,
            description: data.recipeDescription || '',
            prepTime: parseInt(data.prepTime) || 0,
            cookTime: parseInt(data.cookTime) || 0,
            servings: parseInt(data.servings) || 1,
            ingredients: ingredients,
            instructions: instructions,
            notes: data.recipeNotes || '',
            createdAt: new Date().toISOString()
        };

        this.add(recipe);
        this.render();
        this.updateFilters();
        this.form.showSuccess('Recipe added successfully!');
        this.resetDynamicFields();
    }

    deleteRecipe(id) {
        if (confirm('Are you sure you want to delete this recipe?')) {
            this.delete(id);
            this.render();
            this.updateFilters();
            MessageUtils.showMessage('Recipe deleted successfully!');
        }
    }

    editRecipe(id) {
        const recipe = this.find(id);
        if (recipe) {
            this.populateForm(recipe);
            MessageUtils.showMessage('Recipe loaded for editing!');
        }
    }

    populateForm(recipe) {
        document.getElementById('recipeName').value = recipe.name;
        document.getElementById('recipeCategory').value = recipe.category;
        document.getElementById('recipeDescription').value = recipe.description;
        document.getElementById('prepTime').value = recipe.prepTime;
        document.getElementById('cookTime').value = recipe.cookTime;
        document.getElementById('servings').value = recipe.servings;
        document.getElementById('recipeNotes').value = recipe.notes;
        
        this.populateIngredients(recipe.ingredients);
        this.populateInstructions(recipe.instructions);
    }

    populateIngredients(ingredients) {
        const ingredientsList = document.getElementById('ingredientsList');
        ingredientsList.innerHTML = '';
        
        ingredients.forEach((ingredient, index) => {
            const ingredientItem = document.createElement('div');
            ingredientItem.className = 'ingredient-item';
            ingredientItem.innerHTML = `
                <input type="text" name="ingredients[]" class="form-control ingredient-input" 
                       value="${ingredient}" placeholder="e.g., 2 cups flour" required>
                <button type="button" class="btn btn-danger remove-ingredient" onclick="recipeManager.removeIngredient(this)">×</button>
            `;
            ingredientsList.appendChild(ingredientItem);
        });
    }

    populateInstructions(instructions) {
        const instructionsList = document.getElementById('instructionsList');
        instructionsList.innerHTML = '';
        
        instructions.forEach((instruction, index) => {
            const instructionItem = document.createElement('div');
            instructionItem.className = 'instruction-item';
            instructionItem.innerHTML = `
                <textarea name="instructions[]" class="form-control instruction-input" rows="2" 
                          placeholder="Step ${index + 1}: ..." required>${instruction}</textarea>
                <button type="button" class="btn btn-danger remove-instruction" onclick="recipeManager.removeInstruction(this)">×</button>
            `;
            instructionsList.appendChild(instructionItem);
        });
    }

    addIngredient() {
        const ingredientsList = document.getElementById('ingredientsList');
        const newIngredient = document.createElement('div');
        newIngredient.className = 'ingredient-item';
        newIngredient.innerHTML = `
            <input type="text" name="ingredients[]" class="form-control ingredient-input" placeholder="e.g., 2 cups flour" required>
            <button type="button" class="btn btn-danger remove-ingredient" onclick="recipeManager.removeIngredient(this)">×</button>
        `;
        ingredientsList.appendChild(newIngredient);
    }

    removeIngredient(button) {
        const ingredientsList = document.getElementById('ingredientsList');
        const ingredientItems = ingredientsList.querySelectorAll('.ingredient-item');
        
        if (ingredientItems.length > 1) {
            button.closest('.ingredient-item').remove();
        }
    }

    addInstruction() {
        const instructionsList = document.getElementById('instructionsList');
        const newInstruction = document.createElement('div');
        newInstruction.className = 'instruction-item';
        newInstruction.innerHTML = `
            <textarea name="instructions[]" class="form-control instruction-input" rows="2" placeholder="Step ${instructionsList.children.length + 1}: ..." required></textarea>
            <button type="button" class="btn btn-danger remove-instruction" onclick="recipeManager.removeInstruction(this)">×</button>
        `;
        instructionsList.appendChild(newInstruction);
    }

    removeInstruction(button) {
        const instructionsList = document.getElementById('instructionsList');
        const instructionItems = instructionsList.querySelectorAll('.instruction-item');
        
        if (instructionItems.length > 1) {
            button.closest('.instruction-item').remove();
        }
    }

    resetDynamicFields() {
        // Reset ingredients to one field
        const ingredientsList = document.getElementById('ingredientsList');
        ingredientsList.innerHTML = `
            <div class="ingredient-item">
                <input type="text" name="ingredients[]" class="form-control ingredient-input" placeholder="e.g., 2 cups flour" required>
                <button type="button" class="btn btn-danger remove-ingredient" onclick="recipeManager.removeIngredient(this)">×</button>
            </div>
        `;

        // Reset instructions to one field
        const instructionsList = document.getElementById('instructionsList');
        instructionsList.innerHTML = `
            <div class="instruction-item">
                <textarea name="instructions[]" class="form-control instruction-input" rows="2" placeholder="Step 1: ..." required></textarea>
                <button type="button" class="btn btn-danger remove-instruction" onclick="recipeManager.removeInstruction(this)">×</button>
            </div>
        `;
    }

    render() {
        const container = document.getElementById('recipesContainer');
        if (!container) return;

        if (this.data.length === 0) {
            container.innerHTML = '<div class="empty-state">No recipes yet. Add your first recipe above!</div>';
            return;
        }

        container.innerHTML = this.data
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(recipe => this.createRecipeCard(recipe))
            .join('');
    }

    createRecipeCard(recipe) {
        const formattedDate = Utils.formatDate(recipe.createdAt);
        const totalTime = recipe.prepTime + recipe.cookTime;

        return `
            <div class="recipe-card">
                <div class="recipe-header">
                    <h3 class="recipe-title">${recipe.name}</h3>
                    <div class="recipe-meta">
                        <span class="recipe-category">${recipe.category}</span>
                        <span class="recipe-time">${totalTime} min</span>
                        <span class="recipe-servings">${recipe.servings} servings</span>
                    </div>
                </div>
                
                <div class="recipe-body">
                    ${recipe.description ? `<div class="recipe-description">${recipe.description}</div>` : ''}
                    
                    <div class="recipe-actions">
                        <button class="btn btn-primary" onclick="recipeManager.viewRecipe('${recipe.id}')">View</button>
                        <button class="btn btn-secondary" onclick="recipeManager.editRecipe('${recipe.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="recipeManager.deleteRecipe('${recipe.id}')">Delete</button>
                    </div>
                    
                    <div class="recipe-date">Added on ${formattedDate}</div>
                </div>
            </div>
        `;
    }

    viewRecipe(id) {
        const recipe = this.find(id);
        if (recipe) {
            this.showRecipeModal(recipe);
        }
    }

    showRecipeModal(recipe) {
        const modal = document.createElement('div');
        modal.className = 'recipe-modal';
        modal.innerHTML = `
            <div class="recipe-modal-content">
                <div class="recipe-modal-header">
                    <h2>${recipe.name}</h2>
                    <button class="modal-close" onclick="this.closest('.recipe-modal').remove()">×</button>
                </div>
                
                <div class="recipe-modal-body">
                    <div class="recipe-info">
                        <div class="recipe-meta-grid">
                            <div class="recipe-meta-item">
                                <strong>Category:</strong> ${recipe.category}
                            </div>
                            <div class="recipe-meta-item">
                                <strong>Prep Time:</strong> ${recipe.prepTime} min
                            </div>
                            <div class="recipe-meta-item">
                                <strong>Cook Time:</strong> ${recipe.cookTime} min
                            </div>
                            <div class="recipe-meta-item">
                                <strong>Servings:</strong> ${recipe.servings}
                            </div>
                        </div>
                        
                        ${recipe.description ? `<div class="recipe-description">${recipe.description}</div>` : ''}
                    </div>
                    
                    <div class="recipe-ingredients">
                        <h3>Ingredients</h3>
                        <ul>
                            ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="recipe-instructions">
                        <h3>Instructions</h3>
                        <ol>
                            ${recipe.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                        </ol>
                    </div>
                    
                    ${recipe.notes ? `
                        <div class="recipe-notes">
                            <h3>Notes</h3>
                            <p>${recipe.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    updateFilters() {
        const categories = [...new Set(this.data.map(recipe => recipe.category))];
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

    filterRecipes() {
        const searchTerm = document.getElementById('searchRecipes').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortRecipes').value;

        let filtered = this.data.filter(recipe => {
            const matchesSearch = recipe.name.toLowerCase().includes(searchTerm) ||
                                recipe.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || recipe.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        // Sort recipes
        switch (sortBy) {
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'date':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'time':
                filtered.sort((a, b) => (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime));
                break;
        }

        const container = document.getElementById('recipesContainer');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state">No recipes match your filters</div>';
            return;
        }

        container.innerHTML = filtered.map(recipe => this.createRecipeCard(recipe)).join('');
    }

    // Override gatherAllData for export functionality
    gatherAllData() {
        const userName = appSettings.userName || 'User';
        const exportDate = new Date().toLocaleString();
        
        let data = `=== ${userName}'s Recipe Organizer Backup ===\nExported on: ${exportDate}\n\n`;

        if (this.data.length > 0) {
            this.data.forEach((recipe, index) => {
                data += `${index + 1}. ${recipe.name}\n`;
                data += `   Category: ${recipe.category}\n`;
                if (recipe.description) data += `   Description: ${recipe.description}\n`;
                data += `   Prep Time: ${recipe.prepTime} min\n`;
                data += `   Cook Time: ${recipe.cookTime} min\n`;
                data += `   Servings: ${recipe.servings}\n`;
                
                if (recipe.ingredients.length > 0) {
                    data += `   Ingredients:\n`;
                    recipe.ingredients.forEach(ingredient => {
                        data += `     - ${ingredient}\n`;
                    });
                }
                
                if (recipe.instructions.length > 0) {
                    data += `   Instructions:\n`;
                    recipe.instructions.forEach((instruction, stepIndex) => {
                        data += `     ${stepIndex + 1}. ${instruction}\n`;
                    });
                }
                
                if (recipe.notes) data += `   Notes: ${recipe.notes}\n`;
                data += `   Created: ${Utils.formatDateTime(recipe.createdAt)}\n\n`;
            });
        } else {
            data += 'No recipes found.\n\n';
        }

        data += '=== End of Backup ===\n';
        return data;
    }
}

// ===== SEARCH AND FILTER MANAGEMENT =====
class FilterManager {
    static init() {
        const searchInput = document.getElementById('recipeSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');

        searchInput.addEventListener('input', () => RecipeManager.updateFilters());
        categoryFilter.addEventListener('change', () => RecipeManager.updateFilters());
        sortFilter.addEventListener('change', () => RecipeManager.updateFilters());
    }
}

// ===== USER PROFILE MANAGEMENT =====
class UserProfile {
    static init() {
        this.loadUserData();
        this.setupEventListeners();
    }

    static loadUserData() {
        const userName = StorageManager.load('userName', 'Amrendra');
        const userInitial = userName.charAt(0).toUpperCase();
        document.getElementById('userInitial').textContent = userInitial;
        document.getElementById('userNameInput').value = userName;
    }

    static setupEventListeners() {
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        const saveNameBtn = document.getElementById('saveNameBtn');

        profileBtn.addEventListener('click', () => {
            profileDropdown.classList.toggle('active');
        });

        saveNameBtn.addEventListener('click', () => {
            const userName = document.getElementById('userNameInput').value.trim();
            if (userName) {
                StorageManager.save('userName', userName);
                document.getElementById('userInitial').textContent = userName.charAt(0).toUpperCase();
                profileDropdown.classList.remove('active');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }
}

// ===== DARK MODE MANAGEMENT =====
class DarkModeManager {
    static init() {
        this.loadDarkMode();
        this.setupToggle();
    }

    static loadDarkMode() {
        const isDark = StorageManager.load('darkMode', false);
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeToggle').classList.add('dark');
        }
    }

    static setupToggle() {
        const toggle = document.getElementById('darkModeToggle');
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            toggle.classList.toggle('dark');
            StorageManager.save('darkMode', document.body.classList.contains('dark-mode'));
        });
    }
}

// ===== EXPORT FUNCTIONALITY =====
class DataExporter {
    static exportData() {
        const data = {
            recipes: recipes,
            userName: StorageManager.load('userName', 'Amrendra'),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recipe-organizer-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// ===== INITIALIZATION =====
let appSettings, recipeManager;

document.addEventListener('DOMContentLoaded', function() {
    appSettings = new AppSettings();
    recipeManager = new RecipeManager();
    
    // Setup filter event listeners
    const searchInput = document.getElementById('searchRecipes');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortSelect = document.getElementById('sortRecipes');
    
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce(() => recipeManager.filterRecipes(), 300));
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => recipeManager.filterRecipes());
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => recipeManager.filterRecipes());
    }
    
    // Override the export data method to use recipe-specific data
    appSettings.gatherAllData = () => recipeManager.gatherAllData();
}); 