import { EditorManager } from './modules/EditorManager.js';
import { ViewerManager } from './modules/ViewerManager.js';
import { FileManager } from './modules/FileManager.js';
import { ConsoleManager } from './modules/ConsoleManager.js';
import { UIManager } from './modules/UIManager.js';
import { STLConverter } from './modules/STLConverter.js';
import { OpenSCADWASMManager } from './modules/OpenSCADWASMManager.js';

class App {
    constructor() {
        this.editorManager = null;
        this.viewerManager = null;
        this.fileManager = null;
        this.consoleManager = null;
        this.uiManager = null;
        this.stlConverter = null;
        this.openscadManager = null;
        
        this.currentFile = null;
        this.isDarkTheme = false;
        this.isOpenSCADAvailable = false;
        
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
            
            // Initialize OpenSCAD WASM manager
            this.openscadManager = new OpenSCADWASMManager();
            try {
                this.consoleManager.log('Loading OpenSCAD WASM module...', 'info');
                await this.openscadManager.init();
                this.isOpenSCADAvailable = true;
                this.consoleManager.log('OpenSCAD WASM loaded successfully! Full OpenSCAD features available.', 'info');
                
                // Log capabilities
                const capabilities = this.openscadManager.getCapabilities();
                this.consoleManager.log(`Supported formats: ${capabilities.supportedFormats.join(', ')}`, 'info');
            } catch (error) {
                this.consoleManager.log(`OpenSCAD WASM not available: ${error.message}`, 'warning');
                this.consoleManager.log('Falling back to basic shape rendering', 'warning');
                this.isOpenSCADAvailable = false;
            }
            
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
        const defaultCode = `// Welcome to 3D Customizer with OpenSCAD!
// This example demonstrates advanced OpenSCAD features

// Parameters
height = 20;
width = 30;
depth = 10;
corner_radius = 2;
wall_thickness = 2;

// Main object with advanced CSG operations
difference() {
    // Outer shape using minkowski for rounded corners
    minkowski() {
        cube([width-corner_radius*2, depth-corner_radius*2, height-corner_radius*2], center=true);
        sphere(r=corner_radius, $fn=16);
    }
    
    // Inner cutout
    translate([0, 0, wall_thickness])
    cube([width-wall_thickness*2, depth-wall_thickness*2, height], center=true);
    
    // Decorative holes using for loop
    for(i = [0:2]) {
        for(j = [0:1]) {
            translate([
                (i-1) * (width/4), 
                (j-0.5) * (depth/3), 
                -height/2
            ])
            cylinder(h=height+2, r=1.5, center=true, $fn=12);
        }
    }
}

// Add text label (requires font support)
translate([0, 0, height/2 + 1])
linear_extrude(height=1)
text("3D", size=6, halign="center", valign="center", $fn=16);

// Decorative elements using hull operation
for(i = [0:3]) {
    rotate([0, 0, i*90])
    translate([width/2-2, 0, height/2-2])
    hull() {
        cylinder(h=2, r=0.5, center=true, $fn=8);
        translate([0, 0, 2])
        cylinder(h=2, r=1, center=true, $fn=8);
    }
}`;

        this.editorManager.setContent(defaultCode);
        this.currentFile = null;
        this.updateFileStatus(this.isOpenSCADAvailable ? 'OpenSCAD example loaded' : 'Basic example loaded');
    }

    newFile() {
        if (this.hasUnsavedChanges()) {
            this.uiManager.showConfirmDialog(
                'Unsaved Changes',
                'You have unsaved changes. Are you sure you want to create a new file?',
                () => {
                    const newContent = this.isOpenSCADAvailable 
                        ? '// New OpenSCAD file\n// Full OpenSCAD features available!\n\ncube([10, 10, 10]);\n'
                        : '// New OpenSCAD file\n// Basic shapes only\n\ncube([10, 10, 10]);\n';
                    this.editorManager.setContent(newContent);
                    this.currentFile = null;
                    this.updateFileStatus('New file');
                    this.viewerManager.clearScene();
                }
            );
        } else {
            const newContent = this.isOpenSCADAvailable 
                ? '// New OpenSCAD file\n// Full OpenSCAD features available!\n\ncube([10, 10, 10]);\n'
                : '// New OpenSCAD file\n// Basic shapes only\n\ncube([10, 10, 10]);\n';
            this.editorManager.setContent(newContent);
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
            
            if (this.isOpenSCADAvailable) {
                // Use OpenSCAD WASM for full compilation
                this.consoleManager.log('Compiling with OpenSCAD WASM...', 'info');
                
                // Validate code first
                const validation = this.openscadManager.validateOpenSCADCode(code);
                if (validation.warnings.length > 0) {
                    validation.warnings.forEach(warning => {
                        this.consoleManager.log(`Warning: ${warning}`, 'warning');
                    });
                }
                
                const startTime = performance.now();
                const stlArrayBuffer = await this.openscadManager.compileToSTL(code, {
                    enableManifold: true,
                    segments: 32,
                    facetAngle: 12,
                    facetSize: 2
                });
                const endTime = performance.now();
                
                // Load the compiled STL into the viewer
                this.viewerManager.loadSTL(stlArrayBuffer);
                
                this.updateFileStatus('Render complete');
                this.consoleManager.log(`Model compiled successfully in ${(endTime - startTime).toFixed(2)}ms`, 'info');
                this.consoleManager.log(`STL size: ${(stlArrayBuffer.byteLength / 1024).toFixed(2)} KB`, 'info');
                
            } else {
                // Fallback to basic shape rendering
                this.consoleManager.log('Using basic shape renderer (OpenSCAD WASM not available)', 'warning');
                
                // Simulate some processing time
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Use the existing basic parser
                this.viewerManager.renderFromCode(code);
                
                this.updateFileStatus('Basic render complete');
                this.consoleManager.log('Model rendered with basic shapes', 'info');
            }
            
        } catch (error) {
            this.consoleManager.log(`Render error: ${error.message}`, 'error');
            this.updateFileStatus('Render failed');
            
            // Show detailed error information
            if (error.message.includes('compilation failed')) {
                this.consoleManager.log('Check your OpenSCAD syntax and try again', 'error');
            }
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    async exportSTL() {
        try {
            const code = this.editorManager.getContent();
            
            if (this.isOpenSCADAvailable) {
                // Use OpenSCAD WASM to compile and export
                this.consoleManager.log('Compiling for STL export...', 'info');
                this.uiManager.showLoading(true);
                
                const stlArrayBuffer = await this.openscadManager.compileToSTL(code);
                const stlText = new TextDecoder().decode(stlArrayBuffer);
                
                await this.fileManager.saveFile(stlText, 'model.stl');
                this.consoleManager.log('STL exported successfully via OpenSCAD compilation', 'info');
                
            } else {
                // Fallback to geometry-based export
                const geometry = this.viewerManager.getCurrentGeometry();
                if (!geometry) {
                    this.consoleManager.log('No model to export. Please render a model first.', 'warning');
                    return;
                }
                
                const stlData = this.stlConverter.geometryToSTL(geometry);
                await this.fileManager.saveFile(stlData, 'model.stl');
                this.consoleManager.log('STL exported from rendered geometry', 'info');
            }
            
        } catch (error) {
            this.consoleManager.log(`Export error: ${error.message}`, 'error');
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    async exportFormat(format) {
        if (!this.isOpenSCADAvailable) {
            this.consoleManager.log(`${format.toUpperCase()} export requires OpenSCAD WASM`, 'error');
            return;
        }

        try {
            const code = this.editorManager.getContent();
            this.consoleManager.log(`Compiling for ${format.toUpperCase()} export...`, 'info');
            this.uiManager.showLoading(true);
            
            const fileArrayBuffer = await this.openscadManager.compileToFormat(code, format);
            const fileData = new TextDecoder().decode(fileArrayBuffer);
            
            await this.fileManager.saveFile(fileData, `model.${format}`);
            this.consoleManager.log(`${format.toUpperCase()} exported successfully`, 'info');
            
        } catch (error) {
            this.consoleManager.log(`${format.toUpperCase()} export error: ${error.message}`, 'error');
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    formatCode() {
        // Enhanced OpenSCAD code formatting
        let content = this.editorManager.getContent();
        
        // More sophisticated formatting rules for OpenSCAD
        content = content
            // Fix spacing around operators
            .replace(/([=<>!+\-*\/])/g, ' $1 ')
            .replace(/\s+([=<>!+\-*\/])\s+/g, ' $1 ')
            // Fix braces
            .replace(/\s*{\s*/g, ' {\n    ')
            .replace(/\s*}\s*/g, '\n}\n')
            // Fix semicolons
            .replace(/;\s*/g, ';\n')
            // Fix function calls
            .replace(/(\w+)\s*\(/g, '$1(')
            // Remove excessive newlines
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Fix indentation (basic)
            .split('\n')
            .map((line, index, lines) => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                
                let indent = 0;
                for (let i = 0; i < index; i++) {
                    const prevLine = lines[i].trim();
                    if (prevLine.includes('{') && !prevLine.includes('}')) indent++;
                    if (prevLine.includes('}') && !prevLine.includes('{')) indent--;
                }
                
                if (trimmed.includes('}') && !trimmed.includes('{')) {
                    indent = Math.max(0, indent - 1);
                }
                
                return '    '.repeat(indent) + trimmed;
            })
            .join('\n')
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
        const statusElement = document.getElementById('file-status');
        statusElement.textContent = status;
        
        // Add OpenSCAD availability indicator
        if (this.isOpenSCADAvailable && !status.includes('OpenSCAD')) {
            statusElement.textContent += ' (OpenSCAD)';
        }
    }

    hasUnsavedChanges() {
        // Simple check - in a real app, you'd track this more carefully
        return document.getElementById('file-status').textContent.includes('Modified');
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

    // Cleanup method
    dispose() {
        if (this.openscadManager) {
            this.openscadManager.dispose();
        }
        if (this.viewerManager) {
            this.viewerManager.dispose();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.dispose();
    }
});