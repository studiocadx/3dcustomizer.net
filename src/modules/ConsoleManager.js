export class ConsoleManager {
    constructor() {
        this.container = document.getElementById('console-output');
        this.maxLines = 1000;
        this.lineCount = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const line = document.createElement('div');
        line.className = `console-line console-${type}`;
        line.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${this.escapeHtml(message)}`;
        
        this.container.appendChild(line);
        this.lineCount++;
        
        // Limit number of lines
        if (this.lineCount > this.maxLines) {
            this.container.removeChild(this.container.firstChild);
            this.lineCount--;
        }
        
        // Auto-scroll to bottom
        this.container.scrollTop = this.container.scrollHeight;
    }

    error(message) {
        this.log(message, 'error');
    }

    warning(message) {
        this.log(message, 'warning');
    }

    info(message) {
        this.log(message, 'info');
    }

    clear() {
        this.container.innerHTML = '';
        this.lineCount = 0;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}