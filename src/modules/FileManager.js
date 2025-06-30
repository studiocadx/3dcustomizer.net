import { saveAs } from 'file-saver';

export class FileManager {
    constructor() {
        this.fileInput = document.querySelector('#file-input input');
    }

    async openFile(acceptedExtensions = []) {
        return new Promise((resolve) => {
            this.fileInput.accept = acceptedExtensions.join(',');
            this.fileInput.onchange = (e) => {
                const file = e.target.files[0];
                resolve(file);
                // Reset input
                this.fileInput.value = '';
            };
            this.fileInput.click();
        });
    }

    async saveFile(content, filename) {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            saveAs(blob, filename);
        } catch (error) {
            // Fallback for browsers that don't support file-saver
            this.downloadFallback(content, filename);
        }
    }

    downloadFallback(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    async readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    }
}