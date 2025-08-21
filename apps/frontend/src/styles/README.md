# CSS Architecture

This directory contains a modular CSS architecture that replaces the monolithic `index.css` file.

## Structure

- **`main.css`** - Main entry point that imports all other CSS files
- **`base.css`** - Global styles, CSS variables, and base elements
- **`components.css`** - Reusable UI components (buttons, cards, containers)
- **`forms.css`** - Form elements, inputs, and form-related styling
- **`diagrams.css`** - Flowchart, Mermaid, and diagram styling
- **`marimo.css`** - Marimo notebook interface styling

## Benefits

1. **Modularity** - Each file has a single responsibility
2. **Maintainability** - Easier to find and modify specific styles
3. **Reusability** - Components can be easily reused across the app
4. **Performance** - Better tree-shaking and caching
5. **Team Collaboration** - Multiple developers can work on different CSS files

## Usage

The main entry point is `main.css` which imports all other files. To add new styles:

1. **Global/base styles** → `base.css`
2. **Reusable components** → `components.css`
3. **Form elements** → `forms.css`
4. **Diagram/flowchart styles** → `diagrams.css`
5. **Marimo-specific styles** → `marimo.css`
6. **New feature styles** → Create a new file and import in `main.css`

## File Sizes

- **Old monolithic file**: 847 lines
- **New modular structure**: 
  - `base.css`: ~80 lines
  - `components.css`: ~70 lines
  - `forms.css`: ~60 lines
  - `diagrams.css`: ~100 lines
  - `marimo.css`: ~80 lines
  - `main.css`: ~30 lines

**Total**: ~420 lines (50% reduction) with better organization!
