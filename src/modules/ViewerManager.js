import * as THREE from 'three';

export class ViewerManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMesh = null;
        this.wireframeMode = false;
        this.container = null;
        
        this.animationId = null;
    }

    init() {
        this.container = document.getElementById('viewer-container');
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2a2a2a);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 5, 5);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Add lights
        this.setupLighting();

        // Add orbit controls (simplified version)
        this.setupControls();

        // Add grid
        this.addGrid();

        // Start render loop
        this.animate();

        // Handle resize
        window.addEventListener('resize', () => this.resize());
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point light
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-10, 10, -10);
        this.scene.add(pointLight);
    }

    setupControls() {
        // Simple orbit controls implementation
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;
        let distance = 10;

        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;

            const deltaX = e.clientX - mouseX;
            const deltaY = e.clientY - mouseY;

            targetX += deltaX * 0.01;
            targetY += deltaY * 0.01;

            mouseX = e.clientX;
            mouseY = e.clientY;

            this.updateCameraPosition();
        });

        canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            distance += e.deltaY * 0.01;
            distance = Math.max(2, Math.min(50, distance));
            this.updateCameraPosition();
        });

        this.updateCameraPosition = () => {
            this.camera.position.x = Math.cos(targetX) * Math.cos(targetY) * distance;
            this.camera.position.y = Math.sin(targetY) * distance;
            this.camera.position.z = Math.sin(targetX) * Math.cos(targetY) * distance;
            this.camera.lookAt(0, 0, 0);
        };
    }

    addGrid() {
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
        this.scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    renderFromCode(code) {
        // Clear existing mesh
        this.clearScene();

        // Parse OpenSCAD code and create geometry
        // This is a simplified parser - in a real implementation, 
        // you'd use the OpenSCAD WASM module
        const geometry = this.parseOpenSCADCode(code);
        
        if (geometry) {
            const material = new THREE.MeshLambertMaterial({ 
                color: 0x00ff88,
                transparent: true,
                opacity: 0.9
            });
            
            this.currentMesh = new THREE.Mesh(geometry, material);
            this.currentMesh.castShadow = true;
            this.currentMesh.receiveShadow = true;
            this.scene.add(this.currentMesh);

            // Update model info
            this.updateModelInfo(geometry);
        }
    }

    parseOpenSCADCode(code) {
        // Simplified OpenSCAD parser
        // In a real implementation, this would use the OpenSCAD WASM module
        
        // Look for basic shapes
        if (code.includes('cube')) {
            const sizeMatch = code.match(/cube\s*\(\s*\[?(\d+(?:\.\d+)?),?\s*(\d+(?:\.\d+)?)?,?\s*(\d+(?:\.\d+)?)?\]?\s*\)/);
            if (sizeMatch) {
                const x = parseFloat(sizeMatch[1]) || 1;
                const y = parseFloat(sizeMatch[2]) || x;
                const z = parseFloat(sizeMatch[3]) || x;
                return new THREE.BoxGeometry(x, y, z);
            }
            return new THREE.BoxGeometry(1, 1, 1);
        }
        
        if (code.includes('sphere')) {
            const radiusMatch = code.match(/sphere\s*\(\s*r?\s*=?\s*(\d+(?:\.\d+)?)\s*\)/);
            const radius = radiusMatch ? parseFloat(radiusMatch[1]) : 1;
            return new THREE.SphereGeometry(radius, 32, 16);
        }
        
        if (code.includes('cylinder')) {
            const hMatch = code.match(/h\s*=\s*(\d+(?:\.\d+)?)/);
            const rMatch = code.match(/r\s*=\s*(\d+(?:\.\d+)?)/);
            const height = hMatch ? parseFloat(hMatch[1]) : 1;
            const radius = rMatch ? parseFloat(rMatch[1]) : 0.5;
            return new THREE.CylinderGeometry(radius, radius, height, 32);
        }

        // Default to a cube if no recognizable shape is found
        return new THREE.BoxGeometry(2, 2, 2);
    }

    loadSTL(arrayBuffer) {
        // Simple STL loader
        const geometry = this.parseSTL(arrayBuffer);
        
        if (geometry) {
            this.clearScene();
            
            const material = new THREE.MeshLambertMaterial({ 
                color: 0x888888,
                side: THREE.DoubleSide
            });
            
            this.currentMesh = new THREE.Mesh(geometry, material);
            this.currentMesh.castShadow = true;
            this.currentMesh.receiveShadow = true;
            this.scene.add(this.currentMesh);

            // Center the model
            const box = new THREE.Box3().setFromObject(this.currentMesh);
            const center = box.getCenter(new THREE.Vector3());
            this.currentMesh.position.sub(center);

            this.updateModelInfo(geometry);
        }
    }

    parseSTL(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        
        // Check if it's binary STL
        if (arrayBuffer.byteLength < 84) return null;
        
        const numTriangles = dataView.getUint32(80, true);
        const expectedLength = 84 + numTriangles * 50;
        
        if (arrayBuffer.byteLength !== expectedLength) {
            // Try ASCII STL
            return this.parseASCIISTL(arrayBuffer);
        }
        
        // Parse binary STL
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        
        let offset = 84;
        for (let i = 0; i < numTriangles; i++) {
            // Normal vector
            const nx = dataView.getFloat32(offset, true);
            const ny = dataView.getFloat32(offset + 4, true);
            const nz = dataView.getFloat32(offset + 8, true);
            offset += 12;
            
            // Vertices
            for (let j = 0; j < 3; j++) {
                const x = dataView.getFloat32(offset, true);
                const y = dataView.getFloat32(offset + 4, true);
                const z = dataView.getFloat32(offset + 8, true);
                offset += 12;
                
                vertices.push(x, y, z);
                normals.push(nx, ny, nz);
            }
            
            offset += 2; // Skip attribute byte count
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        
        return geometry;
    }

    parseASCIISTL(arrayBuffer) {
        const text = new TextDecoder().decode(arrayBuffer);
        const lines = text.split('\n');
        
        const vertices = [];
        const normals = [];
        let currentNormal = [0, 0, 0];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('facet normal')) {
                const parts = trimmed.split(/\s+/);
                currentNormal = [
                    parseFloat(parts[2]) || 0,
                    parseFloat(parts[3]) || 0,
                    parseFloat(parts[4]) || 0
                ];
            } else if (trimmed.startsWith('vertex')) {
                const parts = trimmed.split(/\s+/);
                vertices.push(
                    parseFloat(parts[1]) || 0,
                    parseFloat(parts[2]) || 0,
                    parseFloat(parts[3]) || 0
                );
                normals.push(...currentNormal);
            }
        }
        
        if (vertices.length === 0) return null;
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        
        return geometry;
    }

    clearScene() {
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
            if (this.currentMesh.geometry) {
                this.currentMesh.geometry.dispose();
            }
            if (this.currentMesh.material) {
                this.currentMesh.material.dispose();
            }
            this.currentMesh = null;
        }
    }

    resetCamera() {
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
    }

    toggleWireframe() {
        if (this.currentMesh && this.currentMesh.material) {
            this.wireframeMode = !this.wireframeMode;
            this.currentMesh.material.wireframe = this.wireframeMode;
        }
    }

    getCurrentGeometry() {
        return this.currentMesh ? this.currentMesh.geometry : null;
    }

    updateModelInfo(geometry) {
        if (!geometry) return;
        
        const vertices = geometry.attributes.position.count;
        const faces = vertices / 3;
        
        document.getElementById('model-info').textContent = 
            `Vertices: ${vertices}, Faces: ${faces}`;
    }

    resize() {
        if (!this.container || !this.camera || !this.renderer) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.clearScene();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}