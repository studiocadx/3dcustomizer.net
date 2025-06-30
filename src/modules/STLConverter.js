export class STLConverter {
    constructor() {}

    geometryToSTL(geometry) {
        if (!geometry || !geometry.attributes.position) {
            throw new Error('Invalid geometry provided');
        }

        const vertices = geometry.attributes.position.array;
        const normals = geometry.attributes.normal ? geometry.attributes.normal.array : null;
        
        let stlString = 'solid model\n';
        
        for (let i = 0; i < vertices.length; i += 9) {
            // Calculate normal if not provided
            let nx = 0, ny = 0, nz = 1;
            if (normals && normals.length > i) {
                nx = normals[i];
                ny = normals[i + 1];
                nz = normals[i + 2];
            } else {
                // Calculate normal from vertices
                const v1 = [vertices[i], vertices[i + 1], vertices[i + 2]];
                const v2 = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
                const v3 = [vertices[i + 6], vertices[i + 7], vertices[i + 8]];
                
                const u = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
                const v = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
                
                nx = u[1] * v[2] - u[2] * v[1];
                ny = u[2] * v[0] - u[0] * v[2];
                nz = u[0] * v[1] - u[1] * v[0];
                
                const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (length > 0) {
                    nx /= length;
                    ny /= length;
                    nz /= length;
                }
            }
            
            stlString += `  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\n`;
            stlString += '    outer loop\n';
            
            for (let j = 0; j < 9; j += 3) {
                const x = vertices[i + j].toFixed(6);
                const y = vertices[i + j + 1].toFixed(6);
                const z = vertices[i + j + 2].toFixed(6);
                stlString += `      vertex ${x} ${y} ${z}\n`;
            }
            
            stlString += '    endloop\n';
            stlString += '  endfacet\n';
        }
        
        stlString += 'endsolid model\n';
        return stlString;
    }

    binaryToAsciiSTL(binaryData) {
        // Use the existing STL converter from the original code
        const binaryStlFile = new Uint8Array(binaryData);
        const decoder = new TextDecoder('utf-8');
        
        if (decoder.decode(binaryStlFile.subarray(0, 5)).toString() === "solid") {
            throw new Error("File appears to be ASCII STL already");
        }
        
        let asciiStlFile = "solid\n";
        
        const temp = binaryStlFile.subarray(80, 84);
        const numTris = temp[0] + (temp[1] << 8) + (temp[2] << 16) + (temp[3] << 24);
        
        const data = binaryStlFile.subarray(84);
        const modes = ['facet normal', 'vertex1', 'vertex2', 'vertex3'];
        let mode = 0;
        
        for (let i = 0; i < data.length; i += 12) {
            if (mode === 0) {
                asciiStlFile += " facet normal ";
            } else if (mode === 1) {
                asciiStlFile += "  outer loop \n";
            }
            
            if (mode === 1 || mode === 2 || mode === 3) {
                asciiStlFile += "   vertex";
            }
            
            asciiStlFile += " " + this.arrayBuffer4toReal32(data[i], data[i + 1], data[i + 2], data[i + 3]);
            asciiStlFile += " " + this.arrayBuffer4toReal32(data[i + 4], data[i + 5], data[i + 6], data[i + 7]);
            asciiStlFile += " " + this.arrayBuffer4toReal32(data[i + 8], data[i + 9], data[i + 10], data[i + 11]);
            asciiStlFile += "\n";
            
            if (mode === 3) {
                asciiStlFile += "  endloop\n";
                asciiStlFile += " endfacet\n";
                i += 2; // skip the mysterious UINT16 - Attribute byte count
            }
            
            mode = (mode + 1) % modes.length;
        }
        
        asciiStlFile += "endsolid";
        return asciiStlFile;
    }

    arrayBuffer4toReal32(a, b, c, d) {
        const buf = new ArrayBuffer(4);
        const view = new DataView(buf);
        view.setUint8(3, a);
        view.setUint8(2, b);
        view.setUint8(1, c);
        view.setUint8(0, d);
        const r1 = view.getFloat32(0);
        return r1.toFixed(6);
    }
}