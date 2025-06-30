import { EditorManager } from './modules/EditorManager.js';
import { ViewerManager } from './modules/ViewerManager.js';
import { FileManager } from './modules/FileManager.js';
import { ConsoleManager } from './modules/ConsoleManager.js';
import { UIManager } from './modules/UIManager.js';
import { STLConverter } from './modules/STLConverter.js';

class App {
    constructor() {
        this.editorManager = null;
        this.viewerManager = null;
        this.fileManager = null;
        this.consoleManager = null;
        this.uiManager = null;
        this.stlConverter = null;
        
        this.currentFile = null;
        this.isDarkTheme = false;
        
        this.init();
    }

    async init() {
        try {
            // Initialize console first for logging
            this.consoleManager = new ConsoleManager();
            this.consoleManager.log('Initializing 3D Customizer...', 'info');

            // Initialize UI manager
            this.uiManager = new UIManager();
            
            // Initialize STL converter
            this.stlConverter = new STLConverter();
            
            // Initialize file manager
            this.fileManager = new FileManager();
            
            // Initialize editor
            this.editorManager = new EditorManager();
            await this.editorManager.init();
            
            // Initialize 3D viewer
            this.viewerManager = new ViewerManager();
            this.viewerManager.init();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load default example
            this.loadDefaultExample();
            
            this.consoleManager.log('3D Customizer initialized successfully!', 'info');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            if (this.consoleManager) {
                this.consoleManager.log(`Initialization error: ${error.message}`, 'error');
            }
        }
    }

    setupEventListeners() {
        // File operations
        document.getElementById('new-file').addEventListener('click', () => this.newFile());
        document.getElementById('open-file').addEventListener('click', () => this.openFile());
        document.getElementById('save-file').addEventListener('click', () => this.saveFile());
        
        // Rendering
        document.getElementById('render-model').addEventListener('click', () => this.renderModel());
        document.getElementById('export-stl').addEventListener('click', () => this.exportSTL());
        
        // Editor controls
        document.getElementById('format-code').addEventListener('click', () => this.formatCode());
        document.getElementById('toggle-theme').addEventListener('click', () => this.toggleTheme());
        
        // Viewer controls
        document.getElementById('reset-camera').addEventListener('click', () => this.resetCamera());
        document.getElementById('wireframe-toggle').addEventListener('click', () => this.toggleWireframe());
        document.getElementById('fullscreen-viewer').addEventListener('click', () => this.toggleFullscreen());
        
        // Console
        document.getElementById('clear-console').addEventListener('click', () => this.clearConsole());
        
        // Editor change events
        if (this.editorManager) {
            this.editorManager.onContentChange((content) => {
                this.onEditorContentChange(content);
            });
            
            this.editorManager.onCursorPositionChange((position) => {
                this.updateCursorPosition(position);
            });
        }
        
        // Window resize
        window.addEventListener('resize', () => {
            if (this.editorManager) this.editorManager.resize();
            if (this.viewerManager) this.viewerManager.resize();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    loadDefaultExample() {
        const defaultCode = `// Welcome to 3D Customizer!
// This is a simple OpenSCAD example

// Parameters
height = 20;
width = 30;
depth = 10;
corner_radius = 2;

// Main object
difference() {
    // Outer shape
    minkowski() {
        cube([width-corner_radius*2, depth-corner_radius*2, height-corner_radius*2], center=true);
        sphere(r=corner_radius);
    }
    
    // Inner cutout
    translate([0, 0, 2])
    cube([width-4, depth-4, height], center=true);
}

// Add some decorative elements
for(i = [0:3]) {
    rotate([0, 0, i*90])
    translate([width/2-2, 0, height/2-2])
    cylinder(h=4, r=1, center=true);
}`;

        this.editorManager.setContent(defaultCode);
        this.currentFile = null;
        this.updateFileStatus('Example loaded');
    }

    newFile() {
        if (this.hasUnsavedChanges()) {
            this.uiManager.showConfirmDialog(
                'Unsaved Changes',
                'You have unsaved changes. Are you sure you want to create a new file?',
                () => {
                    this.editorManager.setContent('// New OpenSCAD file\n\n');
                    this.currentFile = null;
                    this.updateFileStatus('New file');
                    this.viewerManager.clearScene();
                }
            );
        } else {
            this.editorManager.setContent('// New OpenSCAD file\n\n');
            this.currentFile = null;
            this.updateFileStatus('New file');
            this.viewerManager.clearScene();
        }
    }

    async openFile() {
        try {
            const file = await this.fileManager.openFile(['.scad', '.stl']);
            if (file) {
                if (file.name.endsWith('.stl')) {
                    // Handle STL file
                    const arrayBuffer = await file.arrayBuffer();
                    this.viewerManager.loadSTL(arrayBuffer);
                    this.consoleManager.log(`Loaded STL file: ${file.name}`, 'info');
                } else {
                    // Handle SCAD file
                    const content = await file.text();
                    this.editorManager.setContent(content);
                    this.currentFile = file;
                    this.updateFileStatus(`Opened: ${file.name}`);
                    this.consoleManager.log(`Opened file: ${file.name}`, 'info');
                }
            }
        } catch (error) {
            this.consoleManager.log(`Error opening file: ${error.message}`, 'error');
        }
    }

    async saveFile() {
        try {
            const content = this.editorManager.getContent();
            const filename = this.currentFile ? this.currentFile.name : 'untitled.scad';
            
            await this.fileManager.saveFile(content, filename);
            this.updateFileStatus(`Saved: ${filename}`);
            this.consoleManager.log(`File saved: ${filename}`, 'info');
        } catch (error) {
            this.consoleManager.log(`Error saving file: ${error.message}`, 'error');
        }
    }

    async renderModel() {
        try {
            this.uiManager.showLoading(true);
            this.updateFileStatus('Rendering...');
            
            const code = this.editorManager.getContent();
            
            // Simulate OpenSCAD rendering (in a real implementation, this would use OpenSCAD WASM)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For now, create a simple geometric representation
            this.viewerManager.renderFromCode(code);
            
            this.updateFileStatus('Render complete');
            this.consoleManager.log('Model rendered successfully', 'info');
            
        } catch (error) {
            this.consoleManager.log(`Render error: ${error.message}`, 'error');
            this.updateFileStatus('Render failed');
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    async exportSTL() {
        try {
            const geometry = this.viewerManager.getCurrentGeometry();
            if (!geometry) {
                this.consoleManager.log('No model to export', 'warning');
                return;
            }
            
            const stlData = this.stlConverter.geometryToSTL(geometry);
            await this.fileManager.saveFile(stlData, 'model.stl');
            
            this.consoleManager.log('STL exported successfully', 'info');
        } catch (error) {
            this.consoleManager.log(`Export error: ${error.message}`, 'error');
        }
    }

    formatCode() {
        // Basic OpenSCAD code formatting
        let content = this.editorManager.getContent();
        
        // Simple formatting rules
        content = content
            .replace(/\s*{\s*/g, ' {\n    ')
            .replace(/\s*}\s*/g, '\n}\n')
            .replace(/;\s*/g, ';\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
        
        this.editorManager.setContent(content);
        this.consoleManager.log('Code formatted', 'info');
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.documentElement.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
        this.editorManager.setTheme(this.isDarkTheme ? 'vs-dark' : 'vs');
        this.consoleManager.log(`Switched to ${this.isDarkTheme ? 'dark' : 'light'} theme`, 'info');
    }

    resetCamera() {
        this.viewerManager.resetCamera();
        this.consoleManager.log('Camera reset', 'info');
    }

    toggleWireframe() {
        this.viewerManager.toggleWireframe();
        this.consoleManager.log('Wireframe toggled', 'info');
    }

    toggleFullscreen() {
        const viewerContainer = document.getElementById('viewer-container');
        if (!document.fullscreenElement) {
            viewerContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    clearConsole() {
        this.consoleManager.clear();
    }

    onEditorContentChange(content) {
        // Auto-save or validation could go here
        this.updateFileStatus('Modified');
    }

    updateCursorPosition(position) {
        document.getElementById('cursor-position').textContent = 
            `Line ${position.lineNumber}, Column ${position.column}`;
    }

    updateFileStatus(status) {
        document.getElementById('file-status').textContent = status;
    }

    hasUnsavedChanges() {
        // Simple check - in a real app, you'd track this more carefully
        return document.getElementById('file-status').textContent === 'Modified';
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    this.newFile();
                    break;
                case 'o':
                    e.preventDefault();
                    this.openFile();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveFile();
                    break;
                case 'r':
                    e.preventDefault();
                    this.renderModel();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportSTL();
                    break;
            }
        }
        
        if (e.key === 'F5') {
            e.preventDefault();
            this.renderModel();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});