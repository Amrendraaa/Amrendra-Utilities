# Amrendra's Utilities

Amrendra's Utilities is a modular web application designed to help users manage daily tasks, study plans, recipes, and creative ideas in one place. The application is organized into four main sections: To-Do List, Study Planner, Recipe Organizer, and Idea Board. Each section is built for ease of use, with persistent storage and a clean, responsive interface.

## Features

- **To-Do List:** Create, edit, and manage tasks with labels and priorities. Tasks are saved in local storage for persistence.
- **Study Planner:** Organize study sessions, import relevant tasks from the To-Do List, and track progress.
- **Recipe Organizer:** Add, edit, and categorize recipes with ingredients and instructions.
- **Idea Board:** Capture ideas with titles, descriptions, and notes. Includes character counters, validation, and user-friendly display.
- **Shared Utilities:** Common logic and styles are centralized in `shared/utils.js` and `shared/styles.css` for maintainability and code reuse.
- **Responsive Design:** Works well on both desktop and mobile devices.
- **Dark Mode:** Toggle between light and dark themes for comfortable viewing.

## Project Structure

```
Amrendra's Utilities/
  ├── index.html                # Home page
  ├── styles.css                # Global styles
  ├── script.js                 # Home page logic
  ├── shared/
  │     ├── utils.js            # Shared JavaScript utilities and base classes
  │     └── styles.css          # Shared CSS for common components
  ├── todo/
  │     ├── todo.html           # To-Do List UI
  │     ├── todo.js             # To-Do List logic (section-specific)
  │     └── todo.css            # To-Do List styles (section-specific)
  ├── study/
  │     ├── study.html          # Study Planner UI
  │     ├── study.js            # Study Planner logic (section-specific)
  │     └── study.css           # Study Planner styles (section-specific)
  ├── recipes/
  │     ├── recipes.html        # Recipe Organizer UI
  │     ├── recipes.js          # Recipe Organizer logic (section-specific)
  │     └── recipes.css         # Recipe Organizer styles (section-specific)
  └── ideas/
        ├── ideas.html          # Idea Board UI
        ├── ideas.js            # Idea Board logic (section-specific)
        └── ideas.css           # Idea Board styles (section-specific)
```

## Setup and Usage

1. **Clone or Download the Repository**
   - Download the project as a ZIP file and extract it, or clone the repository using:
     ```
     git clone https://github.com/Amrendraaa/Amrendra-Utilities
     ```

2. **Open the Application**
   - Open `index.html` in your web browser. All features are available client-side; no server setup is required.

3. **Navigating the Application**
   - Use the home page to access each section: To-Do List, Study Planner, Recipe Organizer, and Idea Board.
   - Each section has its own HTML, CSS, and JavaScript files, relying on shared utilities for common functionality.

4. **Persistence**
   - All data is stored in the browser's localStorage. Your tasks, study plans, recipes, and ideas will remain available even after closing the browser.

## Development Notes

- **Modularity:** All base classes and shared logic are defined in `shared/utils.js` and `shared/styles.css`. Section-specific files only contain unique logic and styles.
- **No External Dependencies:** The application uses only vanilla JavaScript, HTML, and CSS. No frameworks or build tools are required.
- **Extensibility:** New sections or features can be added by following the modular structure and utilizing the shared utilities.

