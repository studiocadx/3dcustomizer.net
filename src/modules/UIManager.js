export class UIManager {
    constructor() {
        this.modal = document.getElementById('modal-overlay');
        this.modalTitle = document.getElementById('modal-title');
        this.modalContent = document.getElementById('modal-content');
        this.modalConfirm = document.getElementById('modal-confirm');
        this.modalCancel = document.getElementById('modal-cancel');
        this.modalClose = document.getElementById('modal-close');
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        this.setupModalEvents();
    }

    setupModalEvents() {
        this.modalClose.addEventListener('click', () => this.hideModal());
        this.modalCancel.addEventListener('click', () => this.hideModal());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.hideModal();
            }
        });
    }

    showModal(title, content, confirmText = 'OK', cancelText = 'Cancel') {
        this.modalTitle.textContent = title;
        this.modalContent.innerHTML = content;
        this.modalConfirm.textContent = confirmText;
        this.modalCancel.textContent = cancelText;
        this.modal.classList.remove('hidden');
        
        return new Promise((resolve) => {
            const handleConfirm = () => {
                this.hideModal();
                resolve(true);
                this.modalConfirm.removeEventListener('click', handleConfirm);
            };
            
            const handleCancel = () => {
                this.hideModal();
                resolve(false);
                this.modalCancel.removeEventListener('click', handleCancel);
            };
            
            this.modalConfirm.addEventListener('click', handleConfirm);
            this.modalCancel.addEventListener('click', handleCancel);
        });
    }

    showConfirmDialog(title, message, onConfirm, onCancel) {
        this.showModal(title, `<p>${message}</p>`, 'Confirm', 'Cancel')
            .then((confirmed) => {
                if (confirmed && onConfirm) {
                    onConfirm();
                } else if (!confirmed && onCancel) {
                    onCancel();
                }
            });
    }

    showInfoDialog(title, message) {
        return this.showModal(title, `<p>${message}</p>`, 'OK', '');
    }

    hideModal() {
        this.modal.classList.add('hidden');
    }

    showLoading(show = true) {
        if (show) {
            this.loadingIndicator.classList.remove('hidden');
        } else {
            this.loadingIndicator.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: var(--radius);
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Set background color based on type
        const colors = {
            info: 'var(--primary-color)',
            success: 'var(--success-color)',
            warning: 'var(--warning-color)',
            error: 'var(--error-color)'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}