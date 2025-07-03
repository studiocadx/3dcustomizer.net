export class OpenSCADWASMManager {
    constructor() {
        this.openscad = null;
        this.isInitialized = false;
        this.isInitializing = false;
    }

    async init() {
        if (this.isInitialized) return;
        if (this.isInitializing) {
            // Wait for existing initialization to complete
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        this.isInitializing = true;

        try {
            // Dynamically import OpenSCAD module from src directory
            const openscadModule = await import('../openscad/openscad.js');
            const OpenSCAD = openscadModule.default || openscadModule.OpenSCAD || openscadModule;

            if (!OpenSCAD || typeof OpenSCAD !== 'function') {
                throw new Error('OpenSCAD module not found after loading script');
            }

            // Initialize OpenSCAD instance
            this.openscad = await OpenSCAD({
                noInitialRun: true,
                print: (text) => console.log('OpenSCAD:', text),
                printErr: (text) => console.error('OpenSCAD Error:', text),
                locateFile: (path, prefix) => {
                    // Ensure WASM files are loaded from the correct path in src
                    if (path.endsWith('.wasm')) {
                        return new URL(`../openscad/${path}`, import.meta.url).href;
                    }
                    return prefix + path;
                }
            });

            // Add fonts support if available
            await this.addFontsSupport();
            
            // Add MCAD support if available
            await this.addMCADSupport();

            this.isInitialized = true;
            console.log('OpenSCAD WASM initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize OpenSCAD WASM:', error);
            throw new Error(`OpenSCAD WASM initialization failed: ${error.message}`);
        } finally {
            this.isInitializing = false;
        }
    }

    async addFontsSupport() {
        try {
            const fontsModule = await import('../openscad/openscad.fonts.js').catch(() => null);
            
            if (fontsModule && fontsModule.addFonts && this.openscad) {
                fontsModule.addFonts(this.openscad);
                console.log('OpenSCAD fonts support added');
            } else {
                console.warn('OpenSCAD fonts module not found or invalid, continuing without font support');
            }
        } catch (error) {
            console.warn('Failed to load fonts support:', error);
        }
    }

    async addMCADSupport() {
        try {
            const mcadModule = await import('../openscad/openscad.mcad.js').catch(() => null);
            
            if (mcadModule && mcadModule.addMCAD && this.openscad) {
                mcadModule.addMCAD(this.openscad);
                console.log('OpenSCAD MCAD support added');
            } else {
                console.warn('OpenSCAD MCAD module not found or invalid, continuing without MCAD support');
            }
        } catch (error) {
            console.warn('Failed to load MCAD support:', error);
        }
    }

    async compileToSTL(openscadCode, options = {}) {
        if (!this.isInitialized) {
            throw new Error('OpenSCAD WASM not initialized. Call init() first.');
        }

        const {
            enableManifold = true,
            segments = 32,
            facetAngle = 12,
            facetSize = 2
        } = options;

        try {
            // Clean up any existing files
            this.cleanupFiles();

            // Write the OpenSCAD code to the virtual filesystem
            this.openscad.FS.writeFile('/input.scad', openscadCode);

            // Prepare command line arguments
            const args = [
                '/input.scad',
                '-o', '/output.stl'
            ];

            // Add optional parameters
            if (enableManifold) {
                args.push('--enable=manifold');
            }
            
            args.push('--render');
            args.push(`--segments=${segments}`);
            args.push(`--fa=${facetAngle}`);
            args.push(`--fs=${facetSize}`);

            // Execute OpenSCAD compilation
            const startTime = performance.now();
            const exitCode = this.openscad.callMain(args);
            const endTime = performance.now();

            if (exitCode !== 0) {
                throw new Error(`OpenSCAD compilation failed with exit code ${exitCode}`);
            }

            // Read the generated STL file
            let stlData;
            try {
                stlData = this.openscad.FS.readFile('/output.stl');
            } catch (error) {
                throw new Error('Failed to read generated STL file. Compilation may have failed.');
            }

            // Convert to ArrayBuffer
            const arrayBuffer = stlData.buffer.slice(
                stlData.byteOffset,
                stlData.byteOffset + stlData.byteLength
            );

            console.log(`OpenSCAD compilation completed in ${(endTime - startTime).toFixed(2)}ms`);
            console.log(`Generated STL size: ${arrayBuffer.byteLength} bytes`);

            return arrayBuffer;

        } catch (error) {
            console.error('OpenSCAD compilation error:', error);
            throw error;
        } finally {
            // Clean up files
            this.cleanupFiles();
        }
    }

    async compileToFormat(openscadCode, format = 'stl', options = {}) {
        if (!this.isInitialized) {
            throw new Error('OpenSCAD WASM not initialized. Call init() first.');
        }

        const supportedFormats = ['stl', 'obj', 'off', 'amf'];
        if (!supportedFormats.includes(format.toLowerCase())) {
            throw new Error(`Unsupported format: ${format}. Supported formats: ${supportedFormats.join(', ')}`);
        }

        try {
            // Clean up any existing files
            this.cleanupFiles();

            // Write the OpenSCAD code to the virtual filesystem
            this.openscad.FS.writeFile('/input.scad', openscadCode);

            // Prepare command line arguments
            const outputFile = `/output.${format.toLowerCase()}`;
            const args = [
                '/input.scad',
                '-o', outputFile,
                '--render'
            ];

            // Add format-specific options
            if (options.enableManifold && format.toLowerCase() === 'stl') {
                args.push('--enable=manifold');
            }

            // Execute OpenSCAD compilation
            const startTime = performance.now();
            const exitCode = this.openscad.callMain(args);
            const endTime = performance.now();

            if (exitCode !== 0) {
                throw new Error(`OpenSCAD compilation failed with exit code ${exitCode}`);
            }

            // Read the generated file
            let fileData;
            try {
                fileData = this.openscad.FS.readFile(outputFile);
            } catch (error) {
                throw new Error(`Failed to read generated ${format.toUpperCase()} file. Compilation may have failed.`);
            }

            // Convert to ArrayBuffer
            const arrayBuffer = fileData.buffer.slice(
                fileData.byteOffset,
                fileData.byteOffset + fileData.byteLength
            );

            console.log(`OpenSCAD compilation to ${format.toUpperCase()} completed in ${(endTime - startTime).toFixed(2)}ms`);
            console.log(`Generated file size: ${arrayBuffer.byteLength} bytes`);

            return arrayBuffer;

        } catch (error) {
            console.error(`OpenSCAD compilation to ${format.toUpperCase()} error:`, error);
            throw error;
        } finally {
            // Clean up files
            this.cleanupFiles();
        }
    }

    cleanupFiles() {
        if (!this.openscad) return;

        const filesToClean = ['/input.scad', '/output.stl', '/output.obj', '/output.off', '/output.amf'];
        
        filesToClean.forEach(file => {
            try {
                this.openscad.FS.unlink(file);
            } catch (error) {
                // File doesn't exist, ignore
            }
        });
    }

    validateOpenSCADCode(code) {
        // Basic validation
        if (!code || typeof code !== 'string') {
            throw new Error('Invalid OpenSCAD code: must be a non-empty string');
        }

        // Check for potentially problematic constructs
        const warnings = [];
        
        if (code.includes('import(') && !code.includes('use <')) {
            warnings.push('Import statements may not work without proper file setup');
        }

        if (code.includes('$fn') && !/\$fn\s*=\s*\d+/.test(code)) {
            warnings.push('$fn should be set to a numeric value for proper rendering');
        }

        return {
            isValid: true,
            warnings
        };
    }

    getCapabilities() {
        return {
            initialized: this.isInitialized,
            supportedFormats: ['stl', 'obj', 'off', 'amf'],
            features: [
                'All OpenSCAD primitives (cube, sphere, cylinder, polyhedron)',
                'CSG operations (union, difference, intersection)',
                'Transformations (translate, rotate, scale, mirror)',
                'Advanced operations (hull, minkowski, offset)',
                'Extrusions (linear_extrude, rotate_extrude)',
                'Control structures (for loops, if statements)',
                'Functions and modules',
                'Text rendering (with font support)',
                'MCAD library support'
            ]
        };
    }

    dispose() {
        if (this.openscad) {
            try {
                this.cleanupFiles();
                // Note: OpenSCAD WASM doesn't provide a cleanup method
                // The instance will be garbage collected
                this.openscad = null;
            } catch (error) {
                console.warn('Error during OpenSCAD cleanup:', error);
            }
        }
        this.isInitialized = false;
        this.isInitializing = false;
    }
}