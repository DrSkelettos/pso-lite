/**
 * Rounds (Chefärztinvisite) module
 */

// Global variable to store rounds data
let roundsData = {};
let currentRoundsDate = null;
let draggedElement = null;

/**
 * Initialize the rounds module
 */
function initRounds() {
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('roundsDate').value = formattedDate;
    
    // Set default time to 08:30
    document.getElementById('roundsStartTime').value = '08:30';
    
    // Initialize event listeners
    initRoundsEventListeners();
    
    // Check if we have rounds data for today
    checkForExistingRounds(formattedDate);
}

/**
 * Set up event listeners for rounds functionality
 */
function initRoundsEventListeners() {
    // Date picker change
    document.getElementById('roundsDate').addEventListener('change', function() {
        checkForExistingRounds(this.value);
    });
    
    // Add rounds form submission
    document.getElementById('addRoundsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addOrUpdateRounds();
    });
    
    // Edit rounds button
    document.getElementById('editRoundsBtn').addEventListener('click', function() {
        showEditRoundsForm();
    });
    
    // Cancel edit button
    document.getElementById('cancelEditRoundsBtn').addEventListener('click', function() {
        hideEditRoundsForm();
    });
    
    // Update rounds form submission
    document.getElementById('editRoundsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateRounds();
    });
    
    // Delete rounds button
    document.getElementById('deleteRoundsBtn').addEventListener('click', function() {
        deleteRounds();
    });
}

/**
 * Check if rounds exist for the given date and display accordingly
 * @param {string} dateString - Date in ISO format (YYYY-MM-DD)
 */
function checkForExistingRounds(dateString) {
    currentRoundsDate = dateString;
    const germanDateString = formatISOToGermanDate(dateString);
    
    // Check if we have rounds for this date
    let existingRounds = null;
    
    if (window['rounds-station']) {
        for (const id in window['rounds-station']) {
            if (window['rounds-station'][id].date === germanDateString) {
                existingRounds = window['rounds-station'][id];
                existingRounds.id = id;
                break;
            }
        }
    }
    
    if (existingRounds) {
        // Show the existing rounds
        document.getElementById('addRoundsSection').classList.add('d-none');
        document.getElementById('viewRoundsSection').classList.remove('d-none');
        document.getElementById('emptyRoundsMessage').classList.add('d-none');
        
        // Display rounds information
        document.getElementById('viewRoundsTitle').textContent = existingRounds.title;
        document.getElementById('viewRoundsDate').textContent = existingRounds.date;
        document.getElementById('viewRoundsStartTime').textContent = existingRounds.startTime;
        
        // Populate the rounds table
        populateRoundsTable(existingRounds);
    } else {
        // No rounds for this date, show empty message or add form
        document.getElementById('addRoundsSection').classList.remove('d-none');
        document.getElementById('viewRoundsSection').classList.add('d-none');
        document.getElementById('emptyRoundsMessage').classList.remove('d-none');
        
        // Pre-fill the add form with active patients
        prefillAddRoundsForm(dateString);
    }
}

/**
 * Pre-fill the add rounds form with active patients for the given date
 * @param {string} dateString - Date in ISO format (YYYY-MM-DD)
 */
function prefillAddRoundsForm(dateString) {
    const germanDateString = formatISOToGermanDate(dateString);
    const activePatientsTable = document.getElementById('addRoundsPatientsTable');
    const activePatients = getActivePatientsForDate(germanDateString);
    
    // Clear existing rows
    while (activePatientsTable.tBodies[0].rows.length > 0) {
        activePatientsTable.tBodies[0].deleteRow(0);
    }
    
    // Add rows for active patients
    activePatients.forEach((patient, index) => {
        addPatientToAddRoundsTable(patient, index, activePatientsTable);
    });
    
    // Make the table rows sortable
    makeTableSortable(activePatientsTable);
}

/**
 * Add a patient to the add rounds table
 * @param {Object} patient - Patient object
 * @param {number} index - Index for ordering
 * @param {HTMLElement} table - Table to add the patient to
 */
function addPatientToAddRoundsTable(patient, index, table) {
    const row = table.tBodies[0].insertRow();
    row.setAttribute('data-patient-id', patient.id);
    row.setAttribute('draggable', 'true');
    row.classList.add('cursor-move');
    
    // Add drag event listeners
    row.addEventListener('dragstart', handleDragStart);
    row.addEventListener('dragover', handleDragOver);
    row.addEventListener('dragenter', handleDragEnter);
    row.addEventListener('dragleave', handleDragLeave);
    row.addEventListener('drop', handleDrop);
    row.addEventListener('dragend', handleDragEnd);
    
    // Order cell (hidden)
    const orderCell = row.insertCell();
    orderCell.textContent = index;
    orderCell.classList.add('d-none');
    
    // Time cell - calculate based on start time and index
    const timeCell = row.insertCell();
    const startTime = document.getElementById('roundsStartTime').value || '08:30';
    let timeSlot = startTime;
    for (let i = 0; i < index; i++) {
        timeSlot = incrementTimeBy10Minutes(timeSlot);
    }
    timeCell.textContent = timeSlot;
    
    // Name cell
    const nameCell = row.insertCell();
    nameCell.textContent = patient.name;
    
    // Employee cell
    const empCell = row.insertCell();
    empCell.classList.add('text-center');
    const activeEmployees = getActiveEmployees(patient, formatISOToGermanDate(currentRoundsDate));
    empCell.textContent = activeEmployees.length > 0 ? activeEmployees[0] : '';
    
    // Group cell
    const groupCell = row.insertCell();
    groupCell.classList.add('text-center');
    groupCell.textContent = patient.group || '';
    
    // Therapy week cell
    const weekCell = row.insertCell();
    weekCell.classList.add('text-center');
    weekCell.textContent = calculatePatientWeek(patient.admission, new Date(currentRoundsDate));
}

/**
 * Make a table sortable via drag and drop
 * @param {HTMLElement} table - Table to make sortable
 */
function makeTableSortable(table) {
    // Already added event listeners when creating rows
}

/**
 * Handle drag start event
 * @param {Event} e - Drag event
 */
function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-patient-id'));
}

/**
 * Handle drag over event
 * @param {Event} e - Drag event
 */
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

/**
 * Handle drag enter event
 * @param {Event} e - Drag event
 */
function handleDragEnter(e) {
    this.classList.add('drag-over');
}

/**
 * Handle drag leave event
 * @param {Event} e - Drag event
 */
function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

/**
 * Handle drop event
 * @param {Event} e - Drag event
 */
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this) {
        const table = this.closest('tbody');
        const draggedIdx = Array.from(table.rows).indexOf(draggedElement);
        const dropIdx = Array.from(table.rows).indexOf(this);
        
        if (draggedIdx < dropIdx) {
            table.insertBefore(draggedElement, this.nextSibling);
        } else {
            table.insertBefore(draggedElement, this);
        }
        
        // Update order values
        updateRowOrder(table);
    }
    
    this.classList.remove('drag-over');
    return false;
}

/**
 * Handle drag end event
 * @param {Event} e - Drag event
 */
function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
}

/**
 * Update the order values of table rows
 * @param {HTMLElement} tbody - Table body element
 */
function updateRowOrder(tbody) {
    Array.from(tbody.rows).forEach((row, idx) => {
        // Update order index
        row.cells[0].textContent = idx;
        
        // Update time slot
        const startTimeInput = tbody.closest('table').id === 'addRoundsPatientsTable' ? 
            document.getElementById('roundsStartTime') : 
            document.getElementById('editRoundsStartTime');
        const startTime = startTimeInput.value || '08:30';
        
        let timeSlot = startTime;
        for (let i = 0; i < idx; i++) {
            timeSlot = incrementTimeBy10Minutes(timeSlot);
        }
        row.cells[1].textContent = timeSlot;
    });
}

/**
 * Get active patients for a given date
 * @param {string} germanDateStr - Date in German format (DD.MM.YYYY)
 * @returns {Array} - Array of patient objects
 */
function getActivePatientsForDate(germanDateStr) {
    const dateObj = parseGermanDate(germanDateStr);
    const result = [];
    
    if (!window['patients-station']) {
        return result;
    }
    
    for (const id in window['patients-station']) {
        const patient = window['patients-station'][id];
        const admissionDate = parseGermanDate(patient.admission);
        const dischargeDate = patient.discharge ? parseGermanDate(patient.discharge) : null;
        
        // Patient is active if admission date is before or on the target date
        // and discharge date is either not set or after the target date
        if (admissionDate <= dateObj && (!dischargeDate || dischargeDate >= dateObj)) {
            result.push({
                ...patient,
                id: id
            });
        }
    }
    
    return result;
}

/**
 * Add or update rounds for the selected date
 */
function addOrUpdateRounds() {
    const dateInput = document.getElementById('roundsDate');
    const titleInput = document.getElementById('roundsTitle');
    const startTimeInput = document.getElementById('roundsStartTime');
    
    if (!dateInput.value || !titleInput.value || !startTimeInput.value) {
        alert('Bitte füllen Sie alle erforderlichen Felder aus.');
        return;
    }
    
    const germanDateStr = formatISOToGermanDate(dateInput.value);
    
    // Get patient order from the table
    const patientsTable = document.getElementById('addRoundsPatientsTable');
    const patientRows = Array.from(patientsTable.tBodies[0].rows);
    const patientOrder = patientRows.map(row => row.getAttribute('data-patient-id'));
    
    // Create rounds object
    const rounds = {
        date: germanDateStr,
        title: titleInput.value,
        startTime: startTimeInput.value,
        patients: patientOrder
    };
    
    // Check for existing rounds
    let existingRoundId = null;
    if (window['rounds-station']) {
        for (const id in window['rounds-station']) {
            if (window['rounds-station'][id].date === germanDateStr) {
                existingRoundId = id;
                break;
            }
        }
    }
    
    // Initialize window['rounds-station'] if it doesn't exist
    if (!window['rounds-station']) {
        window['rounds-station'] = {};
    }
    
    // Add or update
    if (existingRoundId) {
        window['rounds-station'][existingRoundId] = rounds;
    } else {
        // Find next available ID
        const nextId = Object.keys(window['rounds-station']).length > 0 
            ? Math.max(...Object.keys(window['rounds-station']).map(Number)) + 1 
            : 1;
        window['rounds-station'][nextId] = rounds;
    }
    
    // Save data
    saveData('rounds-station', 'chefaerztinvisite-station');
    
    // Refresh the view
    checkForExistingRounds(dateInput.value);
}

/**
 * Populate the rounds table with the given rounds data
 * @param {Object} rounds - Rounds data
 */
function populateRoundsTable(rounds) {
    const tbody = document.getElementById('viewRoundsPatientsTable').tBodies[0];
    
    // Clear existing rows
    while (tbody.rows.length > 0) {
        tbody.deleteRow(0);
    }
    
    // Get active patients for this date
    const germanDateStr = rounds.date;
    const activePatients = getActivePatientsForDate(germanDateStr);
    
    // Create a map of active patients
    const activePatientsMap = {};
    activePatients.forEach(patient => {
        activePatientsMap[patient.id] = patient;
    });
    
    // Add rows for patients in the saved order, skipping those no longer active
    let timeSlot = rounds.startTime;
    
    rounds.patients.forEach(patientId => {
        if (activePatientsMap[patientId]) {
            const patient = activePatientsMap[patientId];
            
            const row = tbody.insertRow();
            
            // Time slot
            const timeCell = row.insertCell();
            timeCell.textContent = timeSlot;
            
            // Name cell
            const nameCell = row.insertCell();
            nameCell.textContent = patient.name;
            
            // Employee cell
            const empCell = row.insertCell();
            empCell.classList.add('text-center');
            const activeEmployees = getActiveEmployees(patient, rounds.date);
            empCell.textContent = activeEmployees.length > 0 ? activeEmployees[0] : '';
            
            // Group cell
            const groupCell = row.insertCell();
            groupCell.classList.add('text-center');
            groupCell.textContent = patient.group || '';
            
            // Therapy week cell
            const weekCell = row.insertCell();
            weekCell.classList.add('text-center');
            weekCell.textContent = calculatePatientWeek(patient.admission, parseGermanDate(rounds.date));
            
            // Remove from map to track which patients we've included
            delete activePatientsMap[patientId];
            
            // Increment time slot by 10 minutes
            timeSlot = incrementTimeBy10Minutes(timeSlot);
        }
    });
    
    // Add any new active patients that weren't in the original list
    for (const patientId in activePatientsMap) {
        const patient = activePatientsMap[patientId];
        
        const row = tbody.insertRow();
        
        // Time slot
        const timeCell = row.insertCell();
        timeCell.textContent = timeSlot;
        
        // Name cell
        const nameCell = row.insertCell();
        nameCell.textContent = patient.name;
        
        // Employee cell
        const empCell = row.insertCell();
        empCell.classList.add('text-center');
        const activeEmployees = getActiveEmployees(patient, rounds.date);
        empCell.textContent = activeEmployees.length > 0 ? activeEmployees[0] : '';
        
        // Group cell
        const groupCell = row.insertCell();
        groupCell.classList.add('text-center');
        groupCell.textContent = patient.group || '';
        
        // Therapy week cell
        const weekCell = row.insertCell();
        weekCell.classList.add('text-center');
        weekCell.textContent = calculatePatientWeek(patient.admission, parseGermanDate(rounds.date));
        
        // Increment time slot by 10 minutes
        timeSlot = incrementTimeBy10Minutes(timeSlot);
    }
}

/**
 * Increment a time string by 10 minutes
 * @param {string} timeStr - Time string in format HH:MM
 * @returns {string} - New time string
 */
function incrementTimeBy10Minutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    let newMinutes = minutes + 10;
    let newHours = hours;
    
    if (newMinutes >= 60) {
        newMinutes -= 60;
        newHours += 1;
    }
    
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

/**
 * Show the edit rounds form
 */
function showEditRoundsForm() {
    // Find current rounds data
    const germanDateStr = document.getElementById('viewRoundsDate').textContent;
    let rounds = null;
    let roundsId = null;
    
    if (window['rounds-station']) {
        for (const id in window['rounds-station']) {
            if (window['rounds-station'][id].date === germanDateStr) {
                rounds = window['rounds-station'][id];
                roundsId = id;
                break;
            }
        }
    }
    
    if (!rounds) {
        alert('Keine Visite für dieses Datum gefunden.');
        return;
    }
    
    // Hide view section, show edit section
    document.getElementById('viewRoundsSection').classList.add('d-none');
    document.getElementById('editRoundsSection').classList.remove('d-none');
    
    // Fill edit form
    const isoDateStr = formatGermanToISODate(germanDateStr);
    document.getElementById('editRoundsDate').value = isoDateStr;
    document.getElementById('editRoundsTitle').value = rounds.title;
    document.getElementById('editRoundsStartTime').value = rounds.startTime;
    document.getElementById('editRoundsId').value = roundsId;
    
    // Fill patients table
    const activePatientsTable = document.getElementById('editRoundsPatientsTable');
    const activePatients = getActivePatientsForDate(germanDateStr);
    
    // Clear existing rows
    while (activePatientsTable.tBodies[0].rows.length > 0) {
        activePatientsTable.tBodies[0].deleteRow(0);
    }
    
    // Create a map of active patients
    const activePatientsMap = {};
    activePatients.forEach(patient => {
        activePatientsMap[patient.id] = patient;
    });
    
    // Add rows for patients in the saved order first
    let index = 0;
    rounds.patients.forEach(patientId => {
        if (activePatientsMap[patientId]) {
            addPatientToEditRoundsTable(activePatientsMap[patientId], index++, activePatientsTable);
            delete activePatientsMap[patientId];
        }
    });
    
    // Add any new active patients
    for (const patientId in activePatientsMap) {
        addPatientToEditRoundsTable(activePatientsMap[patientId], index++, activePatientsTable);
    }
    
    // Make the table sortable
    makeTableSortable(activePatientsTable);
}

/**
 * Add patient to edit rounds table
 * @param {Object} patient - Patient object
 * @param {number} index - Index for ordering
 * @param {HTMLElement} table - Table to add patient to
 */
function addPatientToEditRoundsTable(patient, index, table) {
    const row = table.tBodies[0].insertRow();
    row.setAttribute('data-patient-id', patient.id);
    row.setAttribute('draggable', 'true');
    row.classList.add('cursor-move');
    
    // Add drag event listeners
    row.addEventListener('dragstart', handleDragStart);
    row.addEventListener('dragover', handleDragOver);
    row.addEventListener('dragenter', handleDragEnter);
    row.addEventListener('dragleave', handleDragLeave);
    row.addEventListener('drop', handleDrop);
    row.addEventListener('dragend', handleDragEnd);
    
    // Order cell (hidden)
    const orderCell = row.insertCell();
    orderCell.textContent = index;
    orderCell.classList.add('d-none');
    
    // Time cell - calculate based on start time and index
    const timeCell = row.insertCell();
    const startTime = document.getElementById('editRoundsStartTime').value || '08:30';
    let timeSlot = startTime;
    for (let i = 0; i < index; i++) {
        timeSlot = incrementTimeBy10Minutes(timeSlot);
    }
    timeCell.textContent = timeSlot;
    
    // Name cell
    const nameCell = row.insertCell();
    nameCell.textContent = patient.name;
    
    // Employee cell
    const empCell = row.insertCell();
    empCell.classList.add('text-center');
    const germanDateStr = document.getElementById('viewRoundsDate').textContent;
    const activeEmployees = getActiveEmployees(patient, germanDateStr);
    empCell.textContent = activeEmployees.length > 0 ? activeEmployees[0] : '';
    
    // Group cell
    const groupCell = row.insertCell();
    groupCell.classList.add('text-center');
    groupCell.textContent = patient.group || '';
    
    // Therapy week cell
    const weekCell = row.insertCell();
    weekCell.classList.add('text-center');
    weekCell.textContent = calculatePatientWeek(patient.admission, parseGermanDate(germanDateStr));
}

/**
 * Hide the edit rounds form
 */
function hideEditRoundsForm() {
    document.getElementById('editRoundsSection').classList.add('d-none');
    document.getElementById('viewRoundsSection').classList.remove('d-none');
}

/**
 * Update existing rounds
 */
function updateRounds() {
    const dateInput = document.getElementById('editRoundsDate');
    const titleInput = document.getElementById('editRoundsTitle');
    const startTimeInput = document.getElementById('editRoundsStartTime');
    const roundsIdInput = document.getElementById('editRoundsId');
    
    if (!dateInput.value || !titleInput.value || !startTimeInput.value || !roundsIdInput.value) {
        alert('Bitte füllen Sie alle erforderlichen Felder aus.');
        return;
    }
    
    const germanDateStr = formatISOToGermanDate(dateInput.value);
    const roundsId = roundsIdInput.value;
    
    // Get patient order from the table
    const patientsTable = document.getElementById('editRoundsPatientsTable');
    const patientRows = Array.from(patientsTable.tBodies[0].rows);
    const patientOrder = patientRows.map(row => row.getAttribute('data-patient-id'));
    
    // Create updated rounds object
    const rounds = {
        date: germanDateStr,
        title: titleInput.value,
        startTime: startTimeInput.value,
        patients: patientOrder
    };
    
    // Update rounds
    window['rounds-station'][roundsId] = rounds;
    
    // Save data
    saveData('rounds-station', 'chefaerztinvisite-station');
    
    // Refresh the view
    hideEditRoundsForm();
    checkForExistingRounds(dateInput.value);
}

/**
 * Delete rounds
 */
function deleteRounds() {
    const roundsIdInput = document.getElementById('editRoundsId');
    
    if (!roundsIdInput.value) {
        alert('Keine Visite zum Löschen ausgewählt.');
        return;
    }
    
    if (!confirm('Möchten Sie diese Visite wirklich löschen?')) {
        return;
    }
    
    const roundsId = roundsIdInput.value;
    const dateInput = document.getElementById('editRoundsDate');
    
    // Delete rounds
    delete window['rounds-station'][roundsId];
    
    // Save data
    saveData('rounds-station', 'chefaerztinvisite-station');
    
    // Refresh the view
    hideEditRoundsForm();
    checkForExistingRounds(dateInput.value);
}

// Initialize rounds when data is loaded
window.addEventListener('dataLoaded', function() {
    initRounds();
});