document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const timeBtn = document.getElementById('timeBtn');
    const currentTimeElement = document.getElementById('currentTime');
    const addReminderBtn = document.getElementById('addReminderBtn');
    const reminderModal = document.getElementById('reminderModal');
    const closeReminderModal = document.getElementById('closeReminderModal');
    const cancelReminder = document.getElementById('cancelReminder');
    const saveReminder = document.getElementById('saveReminder');
    const reminderForm = document.getElementById('reminderForm');
    const remindersContainer = document.getElementById('remindersContainer');
    const upcomingList = document.getElementById('upcomingList');
    const profileBtn = document.getElementById('profileBtn');
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const cancelProfile = document.getElementById('cancelProfile');
    const saveProfile = document.getElementById('saveProfile');
    const profileForm = document.getElementById('profileForm');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const cancelSettings = document.getElementById('cancelSettings');
    const saveSettings = document.getElementById('saveSettings');
    const settingsForm = document.getElementById('settingsForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const alertNotification = document.getElementById('alertNotification');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const closeAlert = document.getElementById('closeAlert');
    const totalMedsElement = document.getElementById('totalMeds');
    const takenMedsElement = document.getElementById('takenMeds');
    const pendingMedsElement = document.getElementById('pendingMeds');
    const profileNameElement = document.getElementById('profileName');
    const profileNameInput = document.getElementById('profileNameInput');
    const profileInitial = document.getElementById('profileInitial');
    const playButtons = document.querySelectorAll('.play-btn');
    const gameModal = document.getElementById('gameModal');
    const closeGameModal = document.getElementById('closeGameModal');
    const gameIframe = document.getElementById('gameIframe');
    const gameModalTitle = document.getElementById('gameModalTitle');
    const modalReminderTitle = document.getElementById('modalReminderTitle');
    const saveReminderText = document.getElementById('saveReminderText');

    // App State
    let reminders = JSON.parse(localStorage.getItem('medReminders')) || [];
    let userProfile = JSON.parse(localStorage.getItem('medUserProfile')) || {
        name: "User",
        age: "",
        email: "",
        phone: "",
        altPhone: "",
        notifications: true
    };
    
    let appSettings = JSON.parse(localStorage.getItem('medSettings')) || {
        theme: "light",
        notifications: true,
        reminderSound: "default",
        language: "en"
    };
    
    let editingReminderId = null;
    let activeReminderAlert = null;
    let alertAudio = null;

    // Game URLs
    const games = {
        memory: {
            title: "Medication Memory Match",
            path: "games/memory.html",
            img: "assets/memory-game.jpg",
            desc: "Match medication pairs to boost your memory"
        },
        pills: {
            title: "Pill Sorting Challenge", 
            path: "games/pills.html",
            img: "assets/pill-game.jpg",
            desc: "Sort falling pills into correct containers"
        },
        puzzle: {
            title: "Prescription Puzzle",
            path: "games/puzzle.html",
            img: "assets/puzzle-game.jpg",
            desc: "Drag-and-drop to complete medication puzzles"
        },
        food: {
            title: "Healthy Food Catch",
            path: "games/food.html",
            img: "assets/food-game.jpg",
            desc: "Catch healthy foods while avoiding junk"
        }
    };

    // Initialize the app
    initApp();

    function initApp() {
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
        setInterval(checkForReminders, 5000);
        
        renderReminders();
        updateUpcomingReminders();
        updateStats();
        loadProfile();
        loadSettings();
        setupEventListeners();
        
        // Request notification permission
        requestNotificationPermission();
    }

   function setupEventListeners() {
    // Robust element verification and listener attachment
    const addListener = (element, event, handler) => {
        if (!element) {
            console.error(`Element not found for ${event} event`);
            return false;
        }
        if (typeof handler !== 'function') {
            console.error(`Handler is not a function for ${event} event on`, element);
            return false;
        }
        element.addEventListener(event, handler);
        return true;
    };

    // 1. First ensure closeAlert exists
    if (!closeAlert) {
        console.error('closeAlert element not found in DOM');
        // Optionally create it if missing
        const existingAlert = document.getElementById('alertNotification');
        if (existingAlert) {
            closeAlert = existingAlert.querySelector('#closeAlert');
            if (!closeAlert) {
                console.error('Could not find close button within alert notification');
            }
        }
    }

    // 2. Ensure closeAlertHandler exists
    if (typeof closeAlertHandler !== 'function') {
        console.error('closeAlertHandler is not defined');
        // Define it if missing
        closeAlertHandler = function() {
            console.warn('Default closeAlertHandler called');
            if (alertNotification) {
                alertNotification.classList.remove('show', 'pulse');
            }
            if (alertAudio) {
                alertAudio.pause();
                alertAudio = null;
            }
            activeReminderAlert = null;
        };
    }

    // adding all listeners
    try {
        // Time button
        addListener(timeBtn, 'click', updateCurrentTime);
        
        // Add reminder button
        addListener(addReminderBtn, 'click', openAddReminderModal);
        
        // Reminder modal
        addListener(closeReminderModal, 'click', closeReminderModalHandler);
        addListener(cancelReminder, 'click', closeReminderModalHandler);
        addListener(saveReminder, 'click', saveReminderHandler);
        
        // Profile modal
        addListener(profileBtn, 'click', openProfileModal);
        addListener(closeProfileModal, 'click', closeProfileModalHandler);
        addListener(cancelProfile, 'click', closeProfileModalHandler);
        addListener(saveProfile, 'click', saveProfileHandler);
        
        // Settings modal
        addListener(settingsBtn, 'click', openSettingsModal);
        addListener(closeSettingsModal, 'click', closeSettingsModalHandler);
        addListener(cancelSettings, 'click', closeSettingsModalHandler);
        addListener(saveSettings, 'click', saveSettingsHandler);
        
        // Logout button
        addListener(logoutBtn, 'click', logoutHandler);
        
        // Alert notification - with extra verification
        if (closeAlert) {
            if (!addListener(closeAlert, 'click', closeAlertHandler)) {
                console.warn('Failed to add closeAlert listener, adding fallback');
                alertNotification?.addEventListener('click', (e) => {
                    if (e.target.closest('#closeAlert')) {
                        closeAlertHandler();
                    }
                });
            }
        }
        
        // Game buttons
        if (playButtons?.length) {
            playButtons.forEach(button => {
                addListener(button, 'click', playGameHandler);
            });
        }
        
        // Game modal
        addListener(closeGameModal, 'click', closeGameModalHandler);
        
        // Click outside modals to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                const activeModal = document.querySelector('.modal-overlay.active');
                activeModal?.classList.remove('active');
                if (activeModal?.id === 'gameModal') {
                    gameIframe.src = '';
                }
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.active');
                activeModal?.classList.remove('active');
                if (activeModal?.id === 'gameModal') {
                    gameIframe.src = '';
                }
            }
        });

    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}


function closeAlertHandler() {
    alertNotification?.classList.remove('show', 'pulse');
    if (alertAudio) {
        alertAudio.pause();
        alertAudio.currentTime = 0;
        alertAudio = null;
    }
    activeReminderAlert = null;
}

    function updateCurrentTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        currentTimeElement.textContent = now.toLocaleDateString('en-US', options);
    }

    function openAddReminderModal() {
        editingReminderId = null;
        reminderForm.reset();
        modalReminderTitle.textContent = 'Add New Medication';
        saveReminderText.textContent = 'Save Medication';
        reminderForm.dataset.editingId = '';
        reminderModal.classList.add('active');
    }

    function closeReminderModalHandler() {
        reminderModal.classList.remove('active');         
        setInterval(updateCurrentTime, 1000);
        setInterval(checkForReminders, 5000); 
       
    }

    function saveReminderHandler(e) {
        e.preventDefault();
        
        const medicineName = document.getElementById('medicineName').value.trim();
        const dosage = document.getElementById('dosage').value.trim();
        const reminderTime = document.getElementById('reminderTime').value;
        const frequency = document.getElementById('frequency').value;
        const instructions = document.getElementById('instructions').value.trim();
        
        if (!medicineName || !dosage || !reminderTime || !frequency) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        // Check for duplicate medications at the same time
        const duplicateReminder = reminders.find(r => 
            r.medicineName.toLowerCase() === medicineName.toLowerCase() && 
            r.time === reminderTime && 
            r.status !== 'deleted' &&
            (!editingReminderId || r.id !== editingReminderId)
        );
        
        if (duplicateReminder) {
            showAlert(`You already have a reminder for ${medicineName} at ${formatTime(reminderTime)}`, 'warning');
            return;
        }
        
        if (editingReminderId) {
            // Update existing reminder
            const reminderIndex = reminders.findIndex(r => r.id === editingReminderId);
            if (reminderIndex !== -1) {
                reminders[reminderIndex] = {
                    ...reminders[reminderIndex],
                    medicineName,
                    dosage,
                    time: reminderTime,
                    frequency,
                    instructions
                };
                
                showAlert(`${medicineName} reminder updated successfully!`, 'success');
            }
        } else {
            // Add new reminder
            const newReminder = {
                id: Date.now(),
                medicineName,
                dosage,
                time: reminderTime,
                frequency,
                instructions,
                status: 'pending',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            reminders.push(newReminder);
            showAlert(`${medicineName} reminder added successfully!`, 'success');
            
            // Check if this new reminder is due
            checkReminderTime(newReminder);
        }
        
        saveReminders();
        renderReminders();
        updateUpcomingReminders();
        updateStats();
        reminderModal.classList.remove('active');
    }

    function renderReminders() {
        if (reminders.length === 0 || !reminders.some(r => r.status !== 'deleted')) {
            remindersContainer.innerHTML = `
                <div class="empty-state">
                    <img src="https://cdn-icons-png.flaticon.com/512/4476/4476876.png" alt="No reminders">
                    <p>No reminders added yet. Click the button above to add your first reminder.</p>
                </div>
            `;
            return;
        }
        
        remindersContainer.innerHTML = '';
        
        // Filter and sort reminders
        const activeReminders = reminders
            .filter(r => r.status !== 'deleted')
            .sort((a, b) => a.time.localeCompare(b.time));
        
        activeReminders.forEach(reminder => {
            const reminderElement = document.createElement('div');
            reminderElement.className = 'reminder-card slide-in';
            reminderElement.innerHTML = `
                <span class="status-badge status-${reminder.status}">${reminder.status}</span>
                <div class="reminder-header">
                    <h3 class="medicine-name">${reminder.medicineName}</h3>
                </div>
                <p class="medicine-dosage"><i class="fas fa-prescription-bottle-alt"></i> ${reminder.dosage}</p>
                <div class="reminder-time">
                    <i class="far fa-clock"></i>
                    ${formatTime(reminder.time)} - ${formatFrequency(reminder.frequency)}
                </div>
                <p class="reminder-frequency">${reminder.frequency.replace('_', ' ')}</p>
                ${reminder.instructions ? `
                    <div class="reminder-instructions">
                        <i class="fas fa-info-circle"></i> ${reminder.instructions}
                    </div>
                ` : ''}
                <div class="reminder-actions">
                    ${reminder.status === 'pending' ? `
                        <button class="action-btn taken-btn" data-id="${reminder.id}" data-action="taken">
                            <i class="fas fa-check"></i> Taken
                        </button>
                        <button class="action-btn missed-btn" data-id="${reminder.id}" data-action="missed">
                            <i class="fas fa-times"></i> Missed
                        </button>
                    ` : ''}
                    <button class="action-btn edit-btn" data-id="${reminder.id}" data-action="edit">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" data-id="${reminder.id}" data-action="delete">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            remindersContainer.appendChild(reminderElement);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('[data-action="taken"]').forEach(btn => {
            btn.addEventListener('click', () => markAsTaken(parseInt(btn.dataset.id)));
        });
        
        document.querySelectorAll('[data-action="missed"]').forEach(btn => {
            btn.addEventListener('click', () => markAsMissed(parseInt(btn.dataset.id)));
        });
        
        document.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => editReminder(parseInt(btn.dataset.id)));
        });
        
        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => deleteReminder(parseInt(btn.dataset.id)));
        });
    }

    function updateUpcomingReminders() {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        
        const upcomingReminders = reminders
            .filter(r => r.status === 'pending' && r.time >= currentTime)
            .sort((a, b) => a.time.localeCompare(b.time))
            .slice(0, 3);
        
        if (upcomingReminders.length === 0) {
            upcomingList.innerHTML = `
                <div class="empty-state">
                    <p>No upcoming medications</p>
                </div>
            `;
            return;
        }
        
        upcomingList.innerHTML = '';
        
        upcomingReminders.forEach(reminder => {
            const upcomingItem = document.createElement('div');
            upcomingItem.className = 'upcoming-item slide-in-right';
            upcomingItem.innerHTML = `
                <div class="upcoming-time">${formatTime(reminder.time)}</div>
                <div class="upcoming-details">
                    <div class="upcoming-medicine">${reminder.medicineName}</div>
                    <div class="upcoming-dosage">${reminder.dosage}</div>
                </div>
            `;
            upcomingList.appendChild(upcomingItem);
        });
    }

    function checkForReminders() {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        
        reminders.forEach(reminder => {
            if (reminder.status === 'pending' && reminder.time === currentTime) {
                triggerReminderAlert(reminder);
            }
        });
    }

    function checkReminderTime(reminder) {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        
        if (reminder.time === currentTime) {
            triggerReminderAlert(reminder);
        }
    }

    function triggerReminderAlert(reminder) {
        if (activeReminderAlert === reminder.id) return;
        
        activeReminderAlert = reminder.id;
        
        // Show alert notification
        alertTitle.textContent = `Time for ${reminder.medicineName}`;
        alertMessage.textContent = `Take ${reminder.dosage}${reminder.instructions ? ` (${reminder.instructions})` : ''}`;
        alertNotification.classList.add('show', 'pulse');
        
        // Play sound if enabled
        if (appSettings.reminderSound !== 'none') {
            playAlertSound();
        }
        
        // Show browser notification if enabled
        if (userProfile.notifications && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(`MediCare: Time for ${reminder.medicineName}`, {
                    body: `It's time to take ${reminder.dosage}${reminder.instructions ? `\n\nInstructions: ${reminder.instructions}` : ''}`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/4476/4476876.png',
                    tag: `reminder-${reminder.id}`
                });
            } catch (e) {
                console.error('Notification error:', e);
            }
        }
        
        // Auto-hide after 5 minutes
        setTimeout(() => {
            if (activeReminderAlert === reminder.id) {
                alertNotification.classList.remove('show', 'pulse');
                activeReminderAlert = null;
                if (alertAudio) {
                    alertAudio.pause();
                    alertAudio = null;
                }
            }
        }, 300000);
    }

  function playAlertSound() {
    // Stop and clean up previous audio if any
    if (alertAudio) {
        alertAudio.pause();
        alertAudio.currentTime = 0;
        alertAudio = null;
    }

    let soundFile;
    switch(appSettings.reminderSound) {
        case 'gentle':
            soundFile = 'Audio\Casino jackpot alarm and coins.mp3';
            break;
        case 'alarm':
            soundFile = 'Audio/Urgent simple tone loop.mp3';
            break;
        default:
            soundFile = 'Audio/Vintage telephone ringtone.mp3';
    }

    alertAudio = new Audio(soundFile);
    alertAudio.loop = true;

    // Reactively handle loading error
    alertAudio.onerror = function() {
        showAlert(
            `Reminder sound file not found or unsupported: ${soundFile}. Using default sound.`,
            'warning'
        );
        // Try fallback sound if not already using it
        if (soundFile !== 'Audio/Vintage telephone ringtone.mp3') {
            alertAudio = new Audio('Audio/Vintage telephone ringtone.mp3');
            alertAudio.loop = true;
            alertAudio.play().catch(e => {
                showAlert('Unable to play any reminder sound. Please check your audio files.', 'error');
            });
        }
    };

    alertAudio.play().catch(e => {
        console.error('Audio play error:', e);
        showAlert('Unable to play reminder sound. Please check your browser settings and audio file paths.', 'warning');
    });

    // Remove previous event listener if any
    document.removeEventListener('click', stopAudio);

    function stopAudio() {
        if (alertAudio) {
            alertAudio.pause();
            alertAudio.currentTime = 0;
            alertAudio = null;
        }
        document.removeEventListener('click', stopAudio);
    }

    document.addEventListener('click', stopAudio, { once: true });
}

    function showAlert(message, type = 'info') {
        alertTitle.textContent = type === 'error' ? 'Error' : 
                              type === 'success' ? 'Success' : 
                              type === 'warning' ? 'Warning' : 'Info';
        
        alertMessage.textContent = message;
        
        // Set color based on type
        alertNotification.style.backgroundColor = 
            type === 'error' ? '#ff4757' : 
            type === 'success' ? '#2ed573' : 
            type === 'warning' ? '#ffa502' : '#4a6bff';
        
        alertNotification.classList.add('show');
        
        setTimeout(() => {
            alertNotification.classList.remove('show');
        }, 5000);
    }

    function markAsTaken(id) {
        const reminder = reminders.find(r => r.id === id);
        if (reminder) {
            reminder.status = 'taken';
            reminder.completedAt = new Date().toISOString();
            saveReminders();
            renderReminders();
            updateUpcomingReminders();
            updateStats();
            showAlert(`Marked ${reminder.medicineName} as taken!`, 'success');
            
            // If this was the active alert, close it
            if (activeReminderAlert === id) {
                closeAlertHandler();
            }
        }
    }

    function markAsMissed(id) {
        const reminder = reminders.find(r => r.id === id);
        if (reminder) {
            reminder.status = 'missed';
            saveReminders();
            renderReminders();
            updateUpcomingReminders();
            updateStats();
            showAlert(`Marked ${reminder.medicineName} as missed.`, 'warning');
            
            // If this was the active alert, close it
            if (activeReminderAlert === id) {
                closeAlertHandler();
            }
        }
    }

    function editReminder(id) {
        const reminder = reminders.find(r => r.id === id);
        if (reminder) {
            document.getElementById('medicineName').value = reminder.medicineName;
            document.getElementById('dosage').value = reminder.dosage;
            document.getElementById('reminderTime').value = reminder.time;
            document.getElementById('frequency').value = reminder.frequency;
            document.getElementById('instructions').value = reminder.instructions || '';
            
            // Store the ID of the reminder being edited
            editingReminderId = id;
            reminderForm.dataset.editingId = id;
            
            // Change modal title and button text
            modalReminderTitle.textContent = 'Edit Medication';
            saveReminderText.textContent = 'Update Medication';
            
            // Open modal
            reminderModal.classList.add('active');
        }
    }

    function deleteReminder(id) {
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;
        
        if (confirm(`Are you sure you want to delete the reminder for ${reminder.medicineName}?`)) {
            // Instead of removing, mark as deleted for history purposes
            reminder.status = 'deleted';
            saveReminders();
            renderReminders();
            updateUpcomingReminders();
            updateStats();
            showAlert('Reminder deleted successfully.', 'success');
            
            // If this was the active alert, close it
            if (activeReminderAlert === id) {
                closeAlertHandler();
            }
        }
    }

    function saveReminders() {
        localStorage.setItem('medReminders', JSON.stringify(reminders));
    }

    function updateStats() {
        const total = reminders.filter(r => r.status !== 'deleted').length;
        const taken = reminders.filter(r => r.status === 'taken' && isToday(new Date(r.completedAt))).length;
        const pending = reminders.filter(r => r.status === 'pending').length;
        
        totalMedsElement.textContent = total;
        takenMedsElement.textContent = taken;
        pendingMedsElement.textContent = pending;
    }

    function isToday(date) {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() && 
               date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
    }

    function openProfileModal(e) {
        if (e) e.preventDefault();
        loadProfile();
        profileModal.classList.add('active');
    }

    function closeProfileModalHandler() {
        profileModal.classList.remove('active');
    }

    function loadProfile() {
        profileNameInput.value = userProfile.name || '';
        document.getElementById('profileAge').value = userProfile.age || '';
        document.getElementById('profileEmail').value = userProfile.email || '';
        document.getElementById('profilePhone').value = userProfile.phone || '';
        document.getElementById('profileAltPhone').value = userProfile.altPhone || '';
        document.getElementById('profileNotifications').checked = userProfile.notifications !== false;
        
        // Update profile in navbar
        profileNameElement.textContent = userProfile.name || 'User';
        profileInitial.textContent = userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U';
    }

    function saveProfileHandler(e) {
        e.preventDefault();
        
        const name = document.getElementById('profileNameInput').value.trim();
        const age = document.getElementById('profileAge').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();
        const altPhone = document.getElementById('profileAltPhone').value.trim();
        const notifications = document.getElementById('profileNotifications').checked;
        
        if (!name || !age || !email || !phone) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        if (!validateEmail(email)) {
            showAlert('Please enter a valid email address', 'warning');
            return;
        }
        
        userProfile = {
            name,
            age,
            email,
            phone,
            altPhone,
            notifications
        };
        
        localStorage.setItem('medUserProfile', JSON.stringify(userProfile));
        loadProfile();
        profileModal.classList.remove('active');
        showAlert('Profile updated successfully!', 'success');
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function openSettingsModal(e) {
        if (e) e.preventDefault();
        loadSettings();
        settingsModal.classList.add('active');
    }

    function closeSettingsModalHandler() {
        settingsModal.classList.remove('active');
    }

    function loadSettings() {
        document.getElementById('settingsTheme').value = appSettings.theme || 'light';
        document.getElementById('settingsNotifications').checked = appSettings.notifications !== false;
        document.getElementById('settingsReminderSound').value = appSettings.reminderSound || 'default';
        document.getElementById('settingsLanguage').value = appSettings.language || 'en';
    }

    function saveSettingsHandler(e) {
        e.preventDefault();
        
        appSettings = {
            theme: document.getElementById('settingsTheme').value,
            notifications: document.getElementById('settingsNotifications').checked,
            reminderSound: document.getElementById('settingsReminderSound').value,
            language: document.getElementById('settingsLanguage').value
        };
        
        localStorage.setItem('medSettings', JSON.stringify(appSettings));
        applyTheme();
        settingsModal.classList.remove('active');
        showAlert('Settings saved successfully!', 'success');
    }

    function applyTheme() {
    if (appSettings.theme === 'dark') {
        document.documentElement.style.setProperty('--body-bg', '#000000');
        document.documentElement.style.setProperty('--nav-bg', '#000000');
        document.documentElement.style.setProperty('--card-bg', '#111111');
        document.documentElement.style.setProperty('--white', '#111111');
        document.documentElement.style.setProperty('--dark', '#b8b8b8');
        document.documentElement.style.setProperty('--gray', '#b8b8b8');
        document.documentElement.style.setProperty('--light', '#000000');
    } else {
        document.documentElement.style.setProperty('--body-bg', '#f5f7ff');
        document.documentElement.style.setProperty('--nav-bg', '#ffffff');
        document.documentElement.style.setProperty('--card-bg', '#ffffff');
        document.documentElement.style.setProperty('--white', '#ffffff');
        document.documentElement.style.setProperty('--dark', '#2f3542');
        document.documentElement.style.setProperty('--gray', '#a4b0be');
        document.documentElement.style.setProperty('--light', '#f8f9fa');
    }
}

    function logoutHandler(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            // In a real app, you would redirect to logout URL
            showAlert('You have been logged out successfully.', 'success');
            setTimeout(() => {
                // Reset to initial state
                reminders = [];
                userProfile = {
                    name: "User",
                    age: "",
                    email: "",
                    phone: "",
                    altPhone: "",
                    notifications: true
                };
                saveReminders();
                localStorage.setItem('medUserProfile', JSON.stringify(userProfile));
                loadProfile();
                renderReminders();
                updateStats();
                updateUpcomingReminders();
            }, 1000);
        }
    }

    function playGameHandler(e) {
        const gameKey = e.currentTarget.dataset.game;
        const game = games[gameKey];
        
        if (!game) {
            console.error("Game not found:", gameKey);
            return;
        }

        // Update modal title
        gameModalTitle.textContent = game.title;
        
        // Load the game in iframe
        gameIframe.src = game.path;
        
        // Show modal
        gameModal.classList.add('active');
    }

    function closeGameModalHandler() {
        gameIframe.src = ''; // Unload game
        gameModal.classList.remove('active');
    }

    function formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    function formatFrequency(frequency) {
        return frequency.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            });
        }
    }

    // Initialize theme
    applyTheme();
});