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

    // Copy data from window to local variable
    if (window['rounds-station']) {
        roundsData = window['rounds-station'];
    }

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
    document.getElementById('roundsDate').addEventListener('change', function () {
        // Hide edit section and show appropriate section based on date
        document.getElementById('editRoundsSection').classList.add('d-none');
        checkForExistingRounds(this.value);
    });

    // Next Thursday button
    document.getElementById('nextThursdayBtn').addEventListener('click', function () {
        const datePicker = document.getElementById('roundsDate');
        datePicker.value = getNextThursday();
        // Trigger the change event to update the UI
        datePicker.dispatchEvent(new Event('change'));
    });

    // Create rounds button
    document.getElementById('createRoundsBtn').addEventListener('click', function () {
        createNewRounds();
    });

    // Copy latest rounds button
    document.getElementById('copyRoundsBtn').addEventListener('click', function () {
        copyLatestRounds();
    });

    // Listen for data updates
    window.addEventListener('dataSaved', function () {
        if (window['rounds-station']) {
            roundsData = window['rounds-station'];
        }
    });

    // Edit rounds button
    document.getElementById('editRoundsBtn').addEventListener('click', function () {
        showEditRoundsForm();
    });

    // Cancel edit button
    document.getElementById('cancelEditRoundsBtn').addEventListener('click', function () {
        hideEditRoundsForm();
    });

    // Update rounds form submission
    document.getElementById('editRoundsForm').addEventListener('submit', function (e) {
        e.preventDefault();
        updateRounds();
    });

    // Delete rounds button
    document.getElementById('deleteRoundsBtn').addEventListener('click', function () {
        deleteRounds();
    });
}

/**
 * Check if there are existing rounds for the given date and show the appropriate UI
 * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
 */
function checkForExistingRounds(isoDate) {
    // Store the current date
    currentRoundsDate = isoDate;

    // Convert to German date format for lookup
    const germanDate = formatISOToGermanDate(isoDate);

    // Get active patients for this date
    const activePatients = getActivePatientsForDate(germanDate);

    // Check if we have rounds data for this date
    let roundsForDate = null;
    for (const id in roundsData) {
        if (roundsData[id].date === germanDate) {
            roundsForDate = roundsData[id];
            break;
        }
    }

    // Always hide the edit section when changing dates
    document.getElementById('editRoundsSection').classList.add('d-none');

    // Show appropriate UI based on whether we have rounds for this date
    if (roundsForDate) {
        // Show view UI
        document.getElementById('addRoundsSection').classList.add('d-none');
        document.getElementById('viewRoundsSection').classList.remove('d-none');

        // Populate view with data
        document.getElementById('viewRoundsTitle').textContent = roundsForDate.title;
        document.getElementById('viewRoundsDate').textContent = roundsForDate.date;
        document.getElementById('viewRoundsStartTime').textContent = roundsForDate.startTime;

        // Populate table
        populateRoundsTable(roundsForDate);
    } else {
        // Show add UI
        document.getElementById('addRoundsSection').classList.remove('d-none');
        document.getElementById('viewRoundsSection').classList.add('d-none');

    }
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
 * Add a patient to the edit rounds table
 */
function addPatientToEditRoundsTable(patient, index, table) {
    const germanDateStr = formatISOToGermanDate(document.getElementById('editRoundsDate').value);
    const tbody = table.tBodies[0];
    const row = tbody.insertRow();
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
    const activeEmployees = getActiveEmployees(patient, germanDateStr);
    empCell.textContent = activeEmployees.length > 0 ? activeEmployees[0] : '';
    
    // Termine cell with events
    const termineCell = row.insertCell();
    termineCell.classList.add('text-center');
    termineCell.textContent = getPatientEvents(patient, germanDateStr);

    // Group cell
    const groupCell = row.insertCell();
    groupCell.classList.add('text-center');
    groupCell.textContent = patient.group || '';

    // Therapy week cell
    const weekCell = row.insertCell();
    weekCell.classList.add('text-center');
    weekCell.textContent = calculateTherapyWeek(patient, germanDateStr);
    
    // Discharge date cell
    const dischargeCell = row.insertCell();
    dischargeCell.classList.add('text-center');
    dischargeCell.textContent = patient.discharge || '';
    
    // Discharge mode cell
    const dischargeModeCell = row.insertCell();
    dischargeModeCell.classList.add('text-center');
    dischargeModeCell.textContent = patient.discharge_mode || '';
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
    // Store the dragged element
    draggedElement = this;

    // Add dragging class for visual feedback
    this.classList.add('dragging');

    // Set drag effect and data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-patient-id'));
}

/**
 * Handle drag over event
 * @param {Event} e - Drag event
 */
function handleDragOver(e) {
    // Prevent default to allow drop
    e.preventDefault();

    // Set the drop effect
    e.dataTransfer.dropEffect = 'move';

    // Add drag-over class to this row
    if (!this.classList.contains('drag-over') && this !== draggedElement) {
        // Remove from all rows first
        const rows = this.parentNode.querySelectorAll('tr');
        rows.forEach(row => row.classList.remove('drag-over'));

        // Add to current row
        this.classList.add('drag-over');
    }

    return false;
}

/**
 * Handle drag enter event
 * @param {Event} e - Drag event
 */
function handleDragEnter(e) {
    e.preventDefault();
    // Remove drag-over class from all rows
    const rows = this.parentNode.querySelectorAll('tr');
    rows.forEach(row => row.classList.remove('drag-over'));

    // Add drag-over class to current row
    this.classList.add('drag-over');
}

/**
 * Handle drag leave event
 * @param {Event} e - Drag event
 */
function handleDragLeave(e) {
    // Don't remove the class here, as it causes flickering
    // We'll handle this in dragEnter by removing from all rows first
}

/**
 * Handle drop event
 * @param {Event} e - Drag event
 */
function handleDrop(e) {
    e.stopPropagation();

    // Remove drag-over class from all rows
    const rows = this.parentNode.querySelectorAll('tr');
    rows.forEach(row => row.classList.remove('drag-over'));

    // Don't do anything if dropping the same row we're dragging
    if (draggedElement !== this) {
        // Get the table body
        const tbody = this.parentNode;

        // Get the indices of the dragged and target rows
        const draggedIndex = Array.from(tbody.children).indexOf(draggedElement);
        const targetIndex = Array.from(tbody.children).indexOf(this);

        // Reorder the rows
        if (draggedIndex < targetIndex) {
            tbody.insertBefore(draggedElement, this.nextSibling);
        } else {
            tbody.insertBefore(draggedElement, this);
        }

        // Update the order values
        updateRowOrder(tbody);
    }

    return false;
}

/**
 * Handle drag end event
 * @param {Event} e - Drag event
 */
function handleDragEnd(e) {
    // Remove the dragging class
    this.classList.remove('dragging');

    // Remove drag-over class from all rows
    const rows = this.parentNode.querySelectorAll('tr');
    rows.forEach(row => row.classList.remove('drag-over'));

    // Clear the draggedElement reference
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
 * Prepare the add rounds section for the selected date
 * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
 */
function prefillAddRoundsForm(isoDate) {
    // Set the date
    document.getElementById('roundsDate').value = isoDate;
}

/**
 * Create new rounds for the selected date and immediately show edit form
 */
function createNewRounds() {
    const dateInput = document.getElementById('roundsDate');
    const germanDateStr = formatISOToGermanDate(dateInput.value);

    // Get active patients for this date
    const activePatients = getActivePatientsForDate(germanDateStr);
    const patientOrder = activePatients.map(patient => patient.id);

    // Create rounds object with default values
    const rounds = {
        date: germanDateStr,
        title: 'Chefärztinvisite', // Default title
        startTime: '08:30', // Default start time
        patients: patientOrder
    };

    // Initialize window['rounds-station'] if it doesn't exist
    if (!window['rounds-station']) {
        window['rounds-station'] = {};
    }

    // Find next available ID
    const maxId = Object.keys(window['rounds-station']).reduce((max, id) => Math.max(max, parseInt(id) || 0), 0);
    const newId = maxId + 1;

    // Add the new rounds
    window['rounds-station'][newId] = rounds;

    // Update our local copy of the data
    roundsData = window['rounds-station'];

    // Save data
    saveData('rounds-station', 'chefaerztinvisite-station');

    // Prepare the edit form
    document.getElementById('editRoundsDate').value = dateInput.value;
    document.getElementById('editRoundsTitle').value = rounds.title;
    document.getElementById('editRoundsStartTime').value = rounds.startTime;
    document.getElementById('editRoundsId').value = newId;

    // Hide add section, show edit section
    document.getElementById('addRoundsSection').classList.add('d-none');
    document.getElementById('viewRoundsSection').classList.add('d-none');
    document.getElementById('editRoundsSection').classList.remove('d-none');

    // Fill the edit table with patients
    const activePatientsTable = document.getElementById('editRoundsPatientsTable');

    // Clear existing rows
    while (activePatientsTable.tBodies[0].rows.length > 0) {
        activePatientsTable.tBodies[0].deleteRow(0);
    }

    // Add rows for patients
    activePatients.forEach((patient, index) => {
        addPatientToEditRoundsTable(patient, index, activePatientsTable);
    });

    // Make the table sortable
    makeTableSortable(activePatientsTable);
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
            
            // Termine cell with events
            const termineCell = row.insertCell();
            termineCell.classList.add('text-center');
            termineCell.textContent = getPatientEvents(patient, rounds.date);

            // Group cell
            const groupCell = row.insertCell();
            groupCell.classList.add('text-center');
            groupCell.textContent = patient.group || '';

            // Therapy week cell
            const weekCell = row.insertCell();
            weekCell.classList.add('text-center');
            weekCell.textContent = calculatePatientWeek(patient.admission, parseGermanDate(rounds.date));
            
            // Discharge date cell
            const dischargeCell = row.insertCell();
            dischargeCell.classList.add('text-center');
            dischargeCell.textContent = patient.discharge || '';
            
            // Discharge mode cell
            const dischargeModeCell = row.insertCell();
            dischargeModeCell.classList.add('text-center');
            dischargeModeCell.textContent = patient.discharge_mode || '';

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
        
        // Termine cell with events
        const termineCell = row.insertCell();
        termineCell.classList.add('text-center');
        termineCell.textContent = getPatientEvents(patient, rounds.date);

        // Group cell
        const groupCell = row.insertCell();
        groupCell.classList.add('text-center');
        groupCell.textContent = patient.group || '';

        // Therapy week cell
        const weekCell = row.insertCell();
        weekCell.classList.add('text-center');
        weekCell.textContent = calculatePatientWeek(patient.admission, parseGermanDate(rounds.date));
        
        // Discharge date cell
        const dischargeCell = row.insertCell();
        dischargeCell.classList.add('text-center');
        dischargeCell.textContent = patient.discharge || '';
        
        // Discharge mode cell
        const dischargeModeCell = row.insertCell();
        dischargeModeCell.classList.add('text-center');
        dischargeModeCell.textContent = patient.discharge_mode || '';

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
    
    // Termine cell with events
    const termineCell = row.insertCell();
    termineCell.classList.add('text-center');
    termineCell.textContent = getPatientEvents(patient, germanDateStr);

    // Group cell
    const groupCell = row.insertCell();
    groupCell.classList.add('text-center');
    groupCell.textContent = patient.group || '';

    // Therapy week cell
    const weekCell = row.insertCell();
    weekCell.classList.add('text-center');
    weekCell.textContent = calculatePatientWeek(patient.admission, parseGermanDate(germanDateStr));
    
    // Discharge date cell
    const dischargeCell = row.insertCell();
    dischargeCell.classList.add('text-center');
    dischargeCell.textContent = patient.discharge || '';
    
    // Discharge mode cell
    const dischargeModeCell = row.insertCell();
    dischargeModeCell.classList.add('text-center');
    dischargeModeCell.textContent = patient.discharge_mode || '';
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
        alert('Fehler: Unvollständige Daten.');
        return;
    }

    const roundsId = roundsIdInput.value;
    const germanDateStr = formatISOToGermanDate(dateInput.value);

    // Get patient order from the table
    const patientsTable = document.getElementById('editRoundsPatientsTable');
    const patientRows = Array.from(patientsTable.tBodies[0].rows);
    const patientOrder = patientRows.map(row => row.getAttribute('data-patient-id'));

    // Update rounds object
    if (window['rounds-station'] && window['rounds-station'][roundsId]) {
        window['rounds-station'][roundsId] = {
            date: germanDateStr,
            title: titleInput.value,
            startTime: startTimeInput.value,
            patients: patientOrder
        };

        // Update our local copy of the data
        roundsData = window['rounds-station'];

        // Save data
        saveData('rounds-station', 'chefaerztinvisite-station');

        // Hide edit form
        hideEditRoundsForm();

        // Refresh the view
        checkForExistingRounds(dateInput.value);
    } else {
        alert('Fehler: Visite nicht gefunden.');
    }
}

/**
 * Delete rounds
 */
function deleteRounds() {
    if (confirm('Möchten Sie diese Visite wirklich löschen?')) {
        const roundsId = document.getElementById('editRoundsId').value;
        const dateInput = document.getElementById('editRoundsDate');

        if (roundsId && window['rounds-station'] && window['rounds-station'][roundsId]) {
            delete window['rounds-station'][roundsId];

            // Update our local copy of the data
            roundsData = window['rounds-station'];

            // Save data
            saveData('rounds-station', 'chefaerztinvisite-station');

            // Refresh the view
            hideEditRoundsForm();
            checkForExistingRounds(dateInput.value);
        }
    }
}

/**
 * Get the date of the next Thursday in ISO format (YYYY-MM-DD)
 */
function getNextThursday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 4 = Thursday, ...
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    
    // If today is Thursday and it's before noon, return today
    if (dayOfWeek === 4 && today.getHours() < 12) {
        return today.toISOString().split('T')[0];
    }
    
    // Otherwise, return the next Thursday
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + daysUntilThursday);
    return nextThursday.toISOString().split('T')[0];
}

/**
 * Get patient events for a specific day
 * @param {Object} patient - Patient object
 * @param {string} germanDateStr - Date in German format (DD.MM.YYYY)
 * @returns {string} - Comma-separated list of events
 */
function getPatientEvents(patient, germanDateStr) {
    const events = [];
    const date = parseGermanDate(germanDateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 4 = Thursday, ...
    
    // Check if the day is Thursday (4)
    if (dayOfWeek === 4) {
        // Check for MTT for group 3 patients on Thursday
        if (patient.group && (patient.group === '3-A' || patient.group === '3-B' || patient.group === '3')) {
            events.push('MTT');
        }
        
        // Check for SKT on Thursday
        if (window['therapies-station'] && window['therapies-station'][patient.id] && 
            window['therapies-station'][patient.id].skt === 'X') {
            events.push('SKT');
        }
    }
    
    // Get German weekday short name for the date
    const weekdayMap = {
        0: 'So', // Sunday
        1: 'Mo', // Monday
        2: 'Di', // Tuesday
        3: 'Mi', // Wednesday
        4: 'Do', // Thursday
        5: 'Fr', // Friday
        6: 'Sa'  // Saturday
    };
    const weekdayShort = weekdayMap[dayOfWeek];
    
    // Check for kreativ_einzel and einzel_physio appointments
    if (window['therapies-station'] && window['therapies-station'][patient.id]) {
        const therapies = window['therapies-station'][patient.id];
        
        // Check kreativ_einzel
        if (therapies.kreativ_einzel) {
            const kreativMatch = therapies.kreativ_einzel.match(/([MGK])\s*([A-Za-z]{2})\.?\s*(\d{1,2}:\d{2})/i);
            if (kreativMatch && kreativMatch[2].toLowerCase() === weekdayShort.toLowerCase()) {
                events.push(`${kreativMatch[1]} ${kreativMatch[3]}`);
            }
        }
        
        // Check einzel_physio
        if (therapies.einzel_physio) {
            const physioMatch = therapies.einzel_physio.match(/([A-Za-z]{2})\.?\s*(\d{1,2}:\d{2})/i);
            if (physioMatch && physioMatch[1].toLowerCase() === weekdayShort.toLowerCase()) {
                events.push(`P ${physioMatch[2]}`);
            }
        }
    }
    
    return events.join(', ');
}

/**
 * Copy the latest rounds for the new date
 */
function copyLatestRounds() {
    // Get the currently selected date
    const dateInput = document.getElementById('roundsDate');
    const targetGermanDate = formatISOToGermanDate(dateInput.value);
    
    // Find the latest rounds
    let latestRounds = null;
    let latestDate = null;
    
    if (window['rounds-station']) {
        for (const id in window['rounds-station']) {
            const rounds = window['rounds-station'][id];
            const roundsDate = parseGermanDate(rounds.date);
            
            // Skip if this is for the target date
            if (rounds.date === targetGermanDate) {
                continue;
            }
            
            if (!latestDate || roundsDate > latestDate) {
                latestDate = roundsDate;
                latestRounds = rounds;
            }
        }
    }
    
    if (!latestRounds) {
        alert('Keine vorherige Visite gefunden zum Kopieren.');
        return;
    }
    
    // Get active patients for the target date
    const activePatients = getActivePatientsForDate(targetGermanDate);
    const activePatientsMap = {};
    activePatients.forEach(patient => {
        activePatientsMap[patient.id] = patient;
    });
    
    // Filter out inactive patients from the latest rounds
    const filteredPatients = latestRounds.patients.filter(patientId => activePatientsMap[patientId]);
    
    // Add any new patients that weren't in the original list
    const includedPatientIds = new Set(filteredPatients);
    activePatients.forEach(patient => {
        if (!includedPatientIds.has(patient.id)) {
            filteredPatients.push(patient.id);
        }
    });
    
    // Create new rounds object with copied data
    const newRounds = {
        date: targetGermanDate,
        title: latestRounds.title,
        startTime: latestRounds.startTime,
        patients: filteredPatients
    };
    
    // Initialize window['rounds-station'] if it doesn't exist
    if (!window['rounds-station']) {
        window['rounds-station'] = {};
    }
    
    // Find next available ID
    const maxId = Object.keys(window['rounds-station']).reduce((max, id) => Math.max(max, parseInt(id) || 0), 0);
    const newId = maxId + 1;
    
    // Add the new rounds
    window['rounds-station'][newId] = newRounds;
    
    // Update our local copy of the data
    roundsData = window['rounds-station'];
    
    // Save data
    saveData('rounds-station', 'chefaerztinvisite-station');
    
    // Prepare the edit form
    document.getElementById('editRoundsDate').value = dateInput.value;
    document.getElementById('editRoundsTitle').value = newRounds.title;
    document.getElementById('editRoundsStartTime').value = newRounds.startTime;
    document.getElementById('editRoundsId').value = newId;
    
    // Hide add section, show edit section
    document.getElementById('addRoundsSection').classList.add('d-none');
    document.getElementById('viewRoundsSection').classList.add('d-none');
    document.getElementById('editRoundsSection').classList.remove('d-none');
    
    // Fill the edit table with patients
    const activePatientsTable = document.getElementById('editRoundsPatientsTable');
    
    // Clear existing rows
    while (activePatientsTable.tBodies[0].rows.length > 0) {
        activePatientsTable.tBodies[0].deleteRow(0);
    }
    
    // Add rows for patients in the copied order
    let index = 0;
    filteredPatients.forEach(patientId => {
        if (activePatientsMap[patientId]) {
            addPatientToEditRoundsTable(activePatientsMap[patientId], index++, activePatientsTable);
        }
    });
    
    // Make the table sortable
    makeTableSortable(activePatientsTable);
}

// Initialize rounds when data is loaded
window.addEventListener('dataLoaded', function () {
    initRounds();
});