# OpenSCAD WASM Files

This directory should contain the OpenSCAD WASM files for full OpenSCAD functionality.

## Required Files

Download these files from the official OpenSCAD WASM releases:
https://github.com/openscad/openscad-wasm/releases

### Core Files (Required)
- `openscad.js` - Main OpenSCAD WASM module
- `openscad.wasm` - WebAssembly binary

### Optional Enhancement Files
- `openscad.fonts.js` - Font support for text() function
- `openscad.mcad.js` - MCAD library support

## Installation Instructions

1. Go to https://github.com/openscad/openscad-wasm/releases
2. Download the latest release (e.g., `openscad-wasm-2022.03.20.zip`)
3. Extract the files and copy them to this directory:
   ```
   src/openscad/
   ├── openscad.js
   ├── openscad.wasm
   ├── openscad.fonts.js (optional)
   └── openscad.mcad.js (optional)
   ```

**Important**: These files must be placed in `src/openscad/` (not `public/openscad/`) so that Vite can properly resolve the dynamic imports in the module system.

## Features Enabled

With these files in place, your 3D Customizer will support:

### Core OpenSCAD Features
- All primitives: `cube()`, `sphere()`, `cylinder()`, `polyhedron()`
- CSG operations: `union()`, `difference()`, `intersection()`
- Transformations: `translate()`, `rotate()`, `scale()`, `mirror()`
- Advanced operations: `hull()`, `minkowski()`, `offset()`

### Advanced Features
- Extrusions: `linear_extrude()`, `rotate_extrude()`
- Control structures: `for` loops, `if` statements
- Functions and modules
- Text rendering with `text()` (requires fonts.js)
- MCAD library functions (requires mcad.js)

### Export Formats
- STL (binary and ASCII)
- OBJ
- OFF
- AMF

## Fallback Behavior

If these files are not present, the application will:
- Fall back to basic shape rendering using Three.js
- Display a warning in the console
- Still allow basic cube, sphere, and cylinder shapes
- Provide limited STL export functionality

## File Sizes (Approximate)

- `openscad.js`: ~2MB
- `openscad.wasm`: ~8MB
- `openscad.fonts.js`: ~1MB
- `openscad.mcad.js`: ~500KB

Total: ~11.5MB for full functionality

## Troubleshooting

If OpenSCAD WASM fails to load:

1. Check browser console for error messages
2. Ensure all files are in the `src/openscad/` directory (not `public/openscad/`)
3. Verify files are not corrupted (re-download if needed)
4. Check that your web server serves .wasm files with correct MIME type
5. Ensure CORS is properly configured if serving from different domain

## Browser Compatibility

OpenSCAD WASM requires:
- WebAssembly support (all modern browsers)
- SharedArrayBuffer support (may require HTTPS and specific headers)
- Sufficient memory (recommend 4GB+ RAM)

For development with Vite, these requirements are automatically handled.

## Vite Configuration Notes

Since these files are now in `src/openscad/`, Vite will:
- Include them in the module graph for proper bundling
- Allow dynamic imports to resolve correctly
- Handle WASM files appropriately during build
- Ensure proper loading paths in both development and production