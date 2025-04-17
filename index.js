

       document.addEventListener('DOMContentLoaded', function() {  // Fixed syntax error: comma instead of parenthesis
   
    const taskInput = document.getElementById('task-input');
    const priorityBtn = document.getElementById('priority-btn');
    const priorityOptions = document.getElementById('priority-options');
    const selectedPriority = document.getElementById('selected-priority');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    
    // Edit Modal Elements
    const editModal = document.getElementById('edit-modal');
    const editTaskInput = document.getElementById('edit-task-input');
    const editPrioritySelect = document.getElementById('edit-priority-select');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveEditBtn = document.getElementById('save-edit-btn');
    
    // Notification Elements
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    const notificationClose = document.getElementById('notification-close');
    
    // Variables
    let tasks = [];
    let currentFilter = 'all';
    let currentPriority = 'medium';
    let editTaskId = null;
    
    // Initialize app
    init();
    
    // Functions
    function init() {
        loadTasksFromLocalStorage();
        renderTasks();
        updateTaskStats();
        
        // Add event listeners
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTask();
            }
        });
        
        priorityBtn.addEventListener('click', togglePriorityDropdown);
        addTaskBtn.addEventListener('click', addTask);
        clearAllBtn.addEventListener('click', clearAllTasks);
        
        // Priority options event listeners
        const priorityOptionElements = document.querySelectorAll('.priority-option');
        priorityOptionElements.forEach(option => {
            option.addEventListener('click', selectPriority);
        });
        
        // Filter buttons event listeners
        filterBtns.forEach(btn => {
            btn.addEventListener('click', applyFilter);
        });
        
        // Modal event listeners
        cancelEditBtn.addEventListener('click', closeEditModal);
        saveEditBtn.addEventListener('click', saveEditedTask);
        
        // Notification close event listener
        notificationClose.addEventListener('click', hideNotification);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!priorityBtn.contains(e.target) && !priorityOptions.contains(e.target)) {
                priorityOptions.classList.remove('show');
            }
        });
    }
    
    function loadTasksFromLocalStorage() {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    }
    
    function saveTasksToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        taskItem.dataset.id = task.id;
        
        taskItem.innerHTML = `
            <label class="task-checkbox">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="checkmark"></span>
            </label>
            <div class="task-content">
                <h3>${task.name}</h3>
                <div class="task-meta">
                    <div class="task-date">
                        <i class="far fa-calendar-alt"></i>
                        ${formatDate(task.createdAt)}
                    </div>
                    <div class="task-priority ${task.priority}">
                        <i class="fas fa-circle"></i>
                        ${capitalizeFirstLetter(task.priority)}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn" data-id="${task.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${task.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        return taskItem;
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        
        let filteredTasks = filterTasks(tasks, currentFilter);
        
        if (filteredTasks.length === 0) {
            const emptyList = document.createElement('div');
            emptyList.classList.add('empty-list');
            emptyList.innerHTML = `
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks found</p>
            `;
            taskList.appendChild(emptyList);
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
        
        // Add event listeners to task elements
        addTaskEventListeners();
    }
    
    function filterTasks(tasks, filter) {
        switch (filter) {
            case 'all':
                return tasks;
            case 'pending':
                return tasks.filter(task => !task.completed);
            case 'completed':
                return tasks.filter(task => task.completed);
            case 'high':
            case 'medium':
            case 'low':
                return tasks.filter(task => task.priority === filter);
            default:
                return tasks;
        }
    }
    
    function addTaskEventListeners() {
        // Checkbox event listeners
        const checkboxes = document.querySelectorAll('.task-checkbox input');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', toggleTaskStatus);
        });
        
        // Edit button event listeners
        const editBtns = document.querySelectorAll('.edit-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', openEditModal);
        });
        
        // Delete button event listeners
        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', deleteTask);
        });
    }
    
    function addTask() {
        const taskName = taskInput.value.trim();
        
        if (!taskName) {
            showNotification('Error', 'Task name cannot be empty!', 'error');
            return;
        }
        
        const newTask = {
            id: generateUniqueId(),
            name: taskName,
            completed: false,
            priority: currentPriority,
            createdAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        saveTasksToLocalStorage();
        renderTasks();
        updateTaskStats();
        
        // Reset input
        taskInput.value = '';
        
        showNotification('Success', 'Task added successfully!', 'success');
    }
    
    function toggleTaskStatus(e) {
        const taskItem = e.target.closest('.task-item');
        const taskId = taskItem.dataset.id;
        
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = e.target.checked;
            if (e.target.checked) {
                taskItem.classList.add('completed');
            } else {
                taskItem.classList.remove('completed');
            }
            
            saveTasksToLocalStorage();
            updateTaskStats();
        }
    }
    
    function deleteTask(e) {
        const taskId = e.currentTarget.dataset.id;
        
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasksToLocalStorage();
        renderTasks();
        updateTaskStats();
        
        showNotification('Success', 'Task deleted successfully!', 'success');
    }
    
    function clearAllTasks() {
        if (tasks.length === 0) {
            return;
        }
        
        const confirmed = confirm('Are you sure you want to clear all tasks?');
        if (confirmed) {
            tasks = [];
            saveTasksToLocalStorage();
            renderTasks();
            updateTaskStats();
            
            showNotification('Success', 'All tasks cleared successfully!', 'success');
        }
    }
    
    function updateTaskStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        
        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
        pendingTasksEl.textContent = pendingTasks;
    }
    
    function openEditModal(e) {
        const taskId = e.currentTarget.dataset.id;
        const task = tasks.find(task => task.id === taskId);
        
        if (task) {
            editTaskId = taskId;
            editTaskInput.value = task.name;
            editPrioritySelect.value = task.priority;
            
            editModal.classList.add('active');
        }
    }
    
    function closeEditModal() {
        editModal.classList.remove('active');
    }
    
    function saveEditedTask() {
        const taskName = editTaskInput.value.trim();
        const priority = editPrioritySelect.value;
        
        if (!taskName) {
            showNotification('Error', 'Task name cannot be empty!', 'error');
            return;
        }
        
        const taskIndex = tasks.findIndex(task => task.id === editTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].name = taskName;
            tasks[taskIndex].priority = priority;
            
            saveTasksToLocalStorage();
            renderTasks();
            closeEditModal();
            
            showNotification('Success', 'Task updated successfully!', 'success');
        }
    }
    
    // Helper functions
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('en-US', options);
    }
    
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    function togglePriorityDropdown() {
        priorityOptions.classList.toggle('show');
    }
    
    function selectPriority(e) {
        const option = e.currentTarget;
        const value = option.dataset.value;
        
        currentPriority = value;
        selectedPriority.textContent = capitalizeFirstLetter(value);
        
        priorityOptions.classList.remove('show');
    }
    
    function applyFilter(e) {
        const filterBtn = e.currentTarget;
        const filter = filterBtn.dataset.filter;
        
        currentFilter = filter;
        
        // Update active filter button
        filterBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        filterBtn.classList.add('active');
        
        renderTasks();
    }
    
    function showNotification(title, message, type) {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        
        notification.className = 'notification';
        notification.classList.add('active', type);
        
        setTimeout(hideNotification, 3000);
    }
    
    function hideNotification() {
        notification.classList.remove('active');
    }
});
    <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
