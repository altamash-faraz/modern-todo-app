// Todo App JavaScript
class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        // Input elements
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        
        // Filter elements
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        // Task list
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
        
        // Action buttons
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        
        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.editTaskInput = document.getElementById('editTaskInput');
        this.editPrioritySelect = document.getElementById('editPrioritySelect');
        this.closeBtn = document.querySelector('.close-btn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.saveEditBtn = document.getElementById('saveEditBtn');
        
        // Task template
        this.taskTemplate = document.getElementById('taskTemplate');
    }

    bindEvents() {
        // Add task events
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Clear actions
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Modal events
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeModal());
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        
        // Close modal on outside click
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeModal();
        });

        // Edit modal input events
        this.editTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEdit();
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTask() {
        const text = this.taskInput.value.trim();
        const priority = this.prioritySelect.value;

        if (!text) {
            this.showNotification('Please enter a task!', 'error');
            this.taskInput.focus();
            return;
        }

        const task = {
            id: this.generateId(),
            text: text,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveToStorage();
        this.render();
        
        // Reset form
        this.taskInput.value = '';
        this.prioritySelect.value = 'medium';
        this.taskInput.focus();

        this.showNotification('Task added successfully!', 'success');
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveToStorage();
            this.render();
            
            const message = task.completed ? 'Task completed! 🎉' : 'Task marked as pending';
            this.showNotification(message, task.completed ? 'success' : 'info');
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveToStorage();
            this.render();
            this.showNotification('Task deleted!', 'info');
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            this.editTaskInput.value = task.text;
            this.editPrioritySelect.value = task.priority;
            this.showModal();
        }
    }

    saveEdit() {
        const text = this.editTaskInput.value.trim();
        
        if (!text) {
            this.showNotification('Please enter a task!', 'error');
            this.editTaskInput.focus();
            return;
        }

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = text;
            task.priority = this.editPrioritySelect.value;
            task.updatedAt = new Date().toISOString();
            
            this.saveToStorage();
            this.render();
            this.closeModal();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    showModal() {
        this.editModal.classList.add('show');
        this.editTaskInput.focus();
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.editModal.classList.remove('show');
        this.editingTaskId = null;
        document.body.style.overflow = '';
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            default:
                return this.tasks;
        }
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'info');
            return;
        }

        if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveToStorage();
            this.render();
            this.showNotification(`${completedCount} completed task(s) cleared!`, 'success');
        }
    }

    clearAll() {
        if (this.tasks.length === 0) {
            this.showNotification('No tasks to clear!', 'info');
            return;
        }

        if (confirm(`Are you sure you want to delete all ${this.tasks.length} task(s)?`)) {
            this.tasks = [];
            this.saveToStorage();
            this.render();
            this.showNotification('All tasks cleared!', 'success');
        }
    }

    createTaskElement(task) {
        const template = this.taskTemplate.content.cloneNode(true);
        const taskElement = template.querySelector('.task-item');
        
        // Set task data
        taskElement.dataset.taskId = task.id;
        taskElement.dataset.priority = task.priority;
        
        // Set task content
        const checkbox = taskElement.querySelector('.task-checkbox');
        const taskText = taskElement.querySelector('.task-text');
        const taskPriority = taskElement.querySelector('.task-priority');
        const editBtn = taskElement.querySelector('.edit-btn');
        const deleteBtn = taskElement.querySelector('.delete-btn');
        
        checkbox.checked = task.completed;
        taskText.textContent = task.text;
        taskPriority.textContent = task.priority;
        taskPriority.className = `task-priority ${task.priority}`;
        
        if (task.completed) {
            taskElement.classList.add('completed');
        }
        
        // Bind events
        checkbox.addEventListener('change', () => this.toggleTask(task.id));
        editBtn.addEventListener('click', () => this.editTask(task.id));
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        
        return taskElement;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        // Animate counters
        this.animateCounter(this.totalTasksEl, total);
        this.animateCounter(this.completedTasksEl, completed);
        this.animateCounter(this.pendingTasksEl, pending);
    }

    animateCounter(element, target) {
        const current = parseInt(element.textContent) || 0;
        const increment = target > current ? 1 : -1;
        const step = () => {
            const value = parseInt(element.textContent) + increment;
            element.textContent = value;
            if (value !== target) {
                setTimeout(step, 50);
            }
        };
        if (current !== target) step();
    }

    render() {
        const filteredTasks = this.getFilteredTasks();
        
        // Clear tasks list
        this.tasksList.innerHTML = '';
        
        // Show/hide empty state
        if (filteredTasks.length === 0) {
            this.emptyState.classList.add('show');
            this.tasksList.style.display = 'none';
        } else {
            this.emptyState.classList.remove('show');
            this.tasksList.style.display = 'flex';
            
            // Render tasks
            filteredTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                this.tasksList.appendChild(taskElement);
            });
        }
        
        // Update stats
        this.updateStats();
        
        // Update action buttons visibility
        const hasCompleted = this.tasks.some(t => t.completed);
        const hasTasks = this.tasks.length > 0;
        
        this.clearCompletedBtn.style.display = hasCompleted ? 'flex' : 'none';
        this.clearAllBtn.style.display = hasTasks ? 'flex' : 'none';
    }

    saveToStorage() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add notification styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            transform: 'translateX(300px)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '250px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        });
        
        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };
        notification.style.background = colors[type] || colors.info;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '18px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '0';
        closeBtn.style.marginLeft = 'auto';
        
        const removeNotification = () => {
            notification.style.transform = 'translateX(300px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };
        
        closeBtn.addEventListener('click', removeNotification);
        
        // Auto remove after 3 seconds
        setTimeout(removeNotification, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
    
    // Add some keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to add task
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            document.getElementById('taskInput').focus();
        }
        
        // Escape to close modal
        if (e.key === 'Escape' && window.todoApp.editModal.classList.contains('show')) {
            window.todoApp.closeModal();
        }
    });
    
    // Focus task input on page load
    document.getElementById('taskInput').focus();
    
    console.log('🎉 Todo App initialized successfully!');
});

// Add some sample tasks for demonstration (only if no tasks exist)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.todoApp.tasks.length === 0) {
            const sampleTasks = [
                {
                    id: 'sample1',
                    text: 'Welcome to your new Todo App! 🎉',
                    priority: 'high',
                    completed: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'sample2',
                    text: 'Try editing this task by clicking the edit button',
                    priority: 'medium',
                    completed: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'sample3',
                    text: 'Mark this task as complete by checking the box',
                    priority: 'low',
                    completed: false,
                    createdAt: new Date().toISOString()
                }
            ];
            
            window.todoApp.tasks = sampleTasks;
            window.todoApp.saveToStorage();
            window.todoApp.render();
        }
    }, 1000);
});