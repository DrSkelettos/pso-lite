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
    
    // Save patient additional content button
    document.getElementById('savePatientAdditionalContent').addEventListener('click', function () {
        savePatientAdditionalContent();
    });
    
    // Add context menu event listener to the edit rounds table
    document.getElementById('editRoundsPatientsTable').addEventListener('contextmenu', function(e) {
        // Find the closest row element
        const row = e.target.closest('tr');
        if (row && row.hasAttribute('data-patient-id')) {
            // Only handle context menu in edit mode
            if (!document.getElementById('editRoundsForm').classList.contains('d-none')) {
                e.preventDefault();
                
                const patientId = row.getAttribute('data-patient-id');
                if (!patientId) return;
                
                // Show the modal with patient data
                showPatientAdditionalContentModal(patientId);
            }
        }
    });
}

/**
 * View rounds for a specific date
 * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
 * @param {boolean} isInternalView - Whether this is an internal view
 */
function viewRounds(isoDate, isInternalView = false) {

    currentRoundsDate = isoDate;
    roundsData = window['rounds-station'];

    const roundsForDate = getRoundsForDate(isoDate);
    if (!roundsForDate)
        window.close();

    document.getElementById('roundsTitle').textContent = roundsForDate.title;
    document.getElementById('roundsDate').textContent = roundsForDate.date;

    populateRoundsTable(roundsForDate, !isInternalView);
}

function getRoundsForDate(isoDate) {
    const germanDate = formatISOToGermanDate(isoDate);
    let roundsForDate = null;
    for (const id in roundsData) {
        if (roundsData[id].date === germanDate) {
            roundsForDate = roundsData[id];
            break;
        }
    }
    return roundsForDate;
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
    document.getElementById('editRoundsSection')?.classList?.add('d-none');

    // Show appropriate UI based on whether we have rounds for this date
    if (roundsForDate) {
        // Show view UI
        document.getElementById('addRoundsSection')?.classList?.add('d-none');
        document.getElementById('viewRoundsSection').classList.remove('d-none');

        // Populate view with data
        document.getElementById('viewRoundsTitle').textContent = roundsForDate.title;
        document.getElementById('viewRoundsDate').textContent = roundsForDate.date;
        document.getElementById('viewRoundsStartTime').textContent = roundsForDate.startTime;

        // Populate table
        populateRoundsTable(roundsForDate);
    } else {
        // Show add UI
        document.getElementById('addRoundsSection')?.classList?.remove('d-none');
        document.getElementById('viewRoundsSection')?.classList?.add('d-none');

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
    const activeEmployee = getActiveEmployee(patient, formatISOToGermanDate(currentRoundsDate));
    empCell.textContent = activeEmployee;

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
 * @param {Object} patient - Patient object
 * @param {number} index - Index for ordering
 * @param {HTMLElement} table - Table to add patient to
 */
function addPatientToEditRoundsTable(patient, index, table) {
    // Get the date - either from editRoundsDate or viewRoundsDate
    let germanDateStr;
    if (document.getElementById('editRoundsDate').value) {
        germanDateStr = formatISOToGermanDate(document.getElementById('editRoundsDate').value);
    } else if (document.getElementById('viewRoundsDate').textContent) {
        germanDateStr = document.getElementById('viewRoundsDate').textContent;
    } else {
        // Fallback to current date if neither is available
        germanDateStr = formatISOToGermanDate(new Date().toISOString().split('T')[0]);
    }

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
    const activeEmployee = getActiveEmployee(patient, germanDateStr);
    empCell.textContent = activeEmployee;

    // Group cell
    const groupCell = row.insertCell();
    groupCell.classList.add('text-center');
    groupCell.textContent = patient.group || '';

    // Check for event conflicts with the timeslot
    const eventConflicts = checkPatientEventConflicts(patient, germanDateStr, timeSlot);

    // Termine cell with events
    const termineCell = row.insertCell();
    termineCell.classList.add('text-center');
    
    // Get all events including custom events
    const allEvents = getPatientEvents(patient, germanDateStr);    
    termineCell.textContent = allEvents;

    // If there are conflicts, highlight the Termine cell and make conflicting events bold
    if (eventConflicts.hasConflict) {

        // Make conflicting events bold
        if (eventConflicts.conflictingEvents.length > 0) {
            // Replace the text with HTML that has bold conflicting events
            termineCell.textContent = '';

            // Split all events including custom events
            const eventsArray = allEvents.split(', ');
            eventsArray.forEach((event, i) => {
                // Check if this event is in the conflicting events list
                const isConflicting = eventConflicts.conflictingEvents.includes(event);
                // Check if this is a custom event from patient-events-station
                const isCustomEvent = window['patient-events-station']?.[patient.id]?.rounds === event ||
                                     (window['patient-events-station']?.[patient.id]?.rounds && 
                                      window['patient-events-station'][patient.id].rounds.includes(event));

                // Create a span for the event
                const eventSpan = document.createElement('span');
                if (isConflicting) {
                    eventSpan.style.fontWeight = 'bold';
                    eventSpan.classList.add('text-danger');
                }
                eventSpan.textContent = event;

                // Add the span to the cell
                termineCell.appendChild(eventSpan);

                // Add comma if not the last event
                if (i < eventsArray.length - 1) {
                    termineCell.appendChild(document.createTextNode(', '));
                }
            });
        }
    }

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

    // WE cell (weekend) - empty as requested
    const weCell = row.insertCell();
    weCell.classList.add('text-center');
    weCell.textContent = '';

    // Add additional content row if there is any content
    createAdditionalContentRow(patient, tbody, 9, row);
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

    // Remove existing additional content rows before reordering
    const tbody = this.parentNode;
    Array.from(tbody.querySelectorAll('.additional-content-row')).forEach(row => row.remove());

    // Remove drag-over class from all rows
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => row.classList.remove('drag-over'));

    // Don't do anything if dropping the same row we're dragging
    if (draggedElement !== this) {
        // Get the indices of the dragged and target rows
        const draggedIndex = Array.from(tbody.children).indexOf(draggedElement);
        const targetIndex = Array.from(tbody.children).indexOf(this);

        // Reorder the rows
        if (draggedIndex < targetIndex) {
            tbody.insertBefore(draggedElement, this.nextSibling);
        } else {
            tbody.insertBefore(draggedElement, this);
        }

        // Update the order values and refresh Termine cells with conflict highlighting
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
    // Get the date
    let germanDateStr;
    if (document.getElementById('editRoundsDate').value) {
        germanDateStr = formatISOToGermanDate(document.getElementById('editRoundsDate').value);
    } else if (document.getElementById('viewRoundsDate').textContent) {
        germanDateStr = document.getElementById('viewRoundsDate').textContent;
    } else {
        // Fallback to current date if neither is available
        germanDateStr = formatISOToGermanDate(new Date().toISOString().split('T')[0]);
    }

    // Remove previously generated additional content rows
    Array.from(tbody.querySelectorAll('.additional-content-row')).forEach(row => row.remove());

    const patientRows = Array.from(tbody.rows).filter(row => row.hasAttribute('data-patient-id'));

    patientRows.forEach((row, idx) => {
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

        // Update Termine cell with conflict highlighting
        // Get patient ID
        const patientId = row.getAttribute('data-patient-id');

        // Find the patient object
        const patient = window['patients-station'] ? window['patients-station'][patientId] : null;
        if (!patient) return;

        // Add ID to patient object for consistency with other functions
        patient.id = patientId;

        // Check for event conflicts with the new time slot
        const eventConflicts = checkPatientEventConflicts(patient, germanDateStr, timeSlot);

        // Get the Termine cell (fifth cell)
        const termineCell = row.cells[5];

        // Clear existing content and classes
        termineCell.textContent = '';

        // Get all events including custom events
        const allEvents = getPatientEvents(patient, germanDateStr);
        
        // Set the events text
        termineCell.textContent = allEvents;

        // If there are conflicts, highlight the Termine cell and make conflicting events bold
        if (eventConflicts.hasConflict) {

            // Make conflicting events bold
            if (eventConflicts.conflictingEvents.length > 0) {
                // Replace the text with HTML that has bold conflicting events
                termineCell.textContent = '';

                const eventsArray = allEvents.split(', ');
                eventsArray.forEach((event, i) => {
                    // Check if this event is in the conflicting events list
                    const isConflicting = eventConflicts.conflictingEvents.includes(event);

                    // Create a span for the event
                    const eventSpan = document.createElement('span');
                    if (isConflicting) {
                        eventSpan.style.fontWeight = 'bold';
                        eventSpan.classList.add('text-danger');
                    }
                    eventSpan.textContent = event;

                    // Add the span to the cell
                    termineCell.appendChild(eventSpan);

                    // Add comma if not the last event
                    if (i < eventsArray.length - 1) {
                        termineCell.appendChild(document.createTextNode(', '));
                    }
                });
            }
        }

        // WE cell (weekend) - empty as requested
        const weCell = row.cells[8];
        weCell.textContent = '';

        // Re-create additional content row after updating the patient row
        const hasHiddenOrderCell = row.cells[0]?.classList.contains('d-none');
        const colspan = row.cells.length - (hasHiddenOrderCell ? 1 : 0);
        createAdditionalContentRow(patient, tbody, colspan, row);
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

        if(patient.name === "X") continue;

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
 * @param {boolean} hideInternal - Whether to hide internal rows
 */
function populateRoundsTable(rounds, hideInternal = false) {
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
            const activeEmployee = getActiveEmployee(patient, rounds.date);
            empCell.textContent = activeEmployee;

            // Group cell
            const groupCell = row.insertCell();
            groupCell.classList.add('text-center');
            groupCell.textContent = patient.group || '';

            // Termine cell with events
            if (!hideInternal) {
                const termineCell = row.insertCell();
                termineCell.classList.add('text-center');
                termineCell.textContent = getPatientEvents(patient, rounds.date);
            }

            // Therapy week cell
            if (!hideInternal) {
                const weekCell = row.insertCell();
                weekCell.classList.add('text-center');
                weekCell.textContent = calculatePatientWeek(patient.admission, parseGermanDate(rounds.date));
            }

            // Discharge date cell
            if (!hideInternal) {
                const dischargeCell = row.insertCell();
                dischargeCell.classList.add('text-center');
                dischargeCell.textContent = patient.discharge || '';
            }

            // Discharge mode cell
            if (!hideInternal) {
                const dischargeModeCell = row.insertCell();
                dischargeModeCell.classList.add('text-center');
                dischargeModeCell.textContent = patient.discharge_mode || '';
            }

            // WE cell (weekend) - empty as requested
            if (!hideInternal) {
                const weCell = row.insertCell();
                weCell.classList.add('text-center');
                weCell.textContent = '';
            }

            // Add additional content row if there is any content
            if (!hideInternal) {
                createAdditionalContentRow(patient, tbody, 9);
            }

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
        const activeEmployee = getActiveEmployee(patient, rounds.date);
        empCell.textContent = activeEmployee;

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

        // WE cell (weekend) - empty as requested
        const weCell = row.insertCell();
        weCell.classList.add('text-center');
        weCell.textContent = '';

        // Add additional content row if there is any content
        createAdditionalContentRow(patient, tbody, 9);

        // Increment time slot by 10 minutes
        timeSlot = incrementTimeBy10Minutes(timeSlot);
    }
}

/**
 * Show the patient additional content modal
 * @param {string} patientId - Patient ID
 */
function showPatientAdditionalContentModal(patientId) {
    const patient = window['patients-station'] ? window['patients-station'][patientId] : null;
    if (!patient) return;

    // Set patient ID
    document.getElementById('patientId').value = patientId;

    // Load existing data
    const additionalData = patient.additionalContent || {};
    const eventData = window['patient-events-station']?.[patientId]?.rounds || '';

    // Populate form fields
    document.getElementById('additionalEvent').value = eventData;
    document.getElementById('weightAdmission').value = additionalData.weightAdmission || '';
    document.getElementById('bmiAdmission').value = additionalData.bmiAdmission || '';
    document.getElementById('minWeight').value = additionalData.minWeight || '';
    document.getElementById('targetWeight').value = additionalData.targetWeight || '';
    document.getElementById('motivationPhaseEnd').value = additionalData.motivationPhaseEnd || '';
    document.getElementById('warnings').value = additionalData.warnings || '';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('patientAdditionalContentModal'));
    modal.show();
}

/**
 * Save patient additional content
 */
function savePatientAdditionalContent() {
    const patientId = document.getElementById('patientId').value;
    if (!patientId) return;

    const patient = window['patients-station'] ? window['patients-station'][patientId] : null;
    if (!patient) return;

    // Get form data
    const additionalEvent = document.getElementById('additionalEvent').value.trim();
    const weightAdmission = document.getElementById('weightAdmission').value.trim();
    const bmiAdmission = document.getElementById('bmiAdmission').value.trim();
    const minWeight = document.getElementById('minWeight').value.trim();
    const targetWeight = document.getElementById('targetWeight').value.trim();
    const motivationPhaseEnd = document.getElementById('motivationPhaseEnd').value.trim();
    const warnings = document.getElementById('warnings').value.trim();

    // Save additional content to patient data
    if (!patient.additionalContent) {
        patient.additionalContent = {};
    }
    
    patient.additionalContent.weightAdmission = weightAdmission;
    patient.additionalContent.bmiAdmission = bmiAdmission;
    patient.additionalContent.minWeight = minWeight;
    patient.additionalContent.targetWeight = targetWeight;
    patient.additionalContent.motivationPhaseEnd = motivationPhaseEnd;
    patient.additionalContent.warnings = warnings;

    // Save event data to patient-events-station
    if (!window['patient-events-station']) {
        window['patient-events-station'] = {};
    }
    
    if (!window['patient-events-station'][patientId]) {
        window['patient-events-station'][patientId] = {};
    }
    
    if (additionalEvent) {
        window['patient-events-station'][patientId].rounds = additionalEvent;
    } else {
        delete window['patient-events-station'][patientId].rounds;
    }

    // Save both data structures
    saveData('patients-station', 'belegung-station');
    saveData('patient-events-station', 'patienten-termine-station');

    // Refresh the edit table to show updated additional content
    refreshEditRoundsTable();

    // Hide modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('patientAdditionalContentModal'));
    modal.hide();
}

/**
 * Refresh the edit rounds table with current data
 */
function refreshEditRoundsTable() {
    const editTable = document.getElementById('editRoundsPatientsTable');
    if (!editTable || document.getElementById('editRoundsForm').classList.contains('d-none')) {
        return;
    }

    const tbody = editTable.tBodies[0];
    const rows = Array.from(tbody.rows).filter(row => row.hasAttribute('data-patient-id'));
    
    // Get the current patient order
    const patientOrder = rows.map(row => row.getAttribute('data-patient-id'));
    
    // Clear the table
    while (tbody.rows.length > 0) {
        tbody.deleteRow(0);
    }
    
    // Re-add all patients in the same order
    patientOrder.forEach((patientId, index) => {
        const patient = window['patients-station'] ? window['patients-station'][patientId] : null;
        if (patient) {
            patient.id = patientId;
            addPatientToEditRoundsTable(patient, index, editTable);
        }
    });
}

/**
 * Get current German date for the active rounds
 * @returns {string} German date string
 */
function getCurrentGermanDate() {
    const dateInput = document.getElementById('editRoundsDate');
    if (dateInput && dateInput.value) {
        return formatISOToGermanDate(dateInput.value);
    } else if (document.getElementById('viewRoundsDate').textContent) {
        return document.getElementById('viewRoundsDate').textContent;
    }
    return formatISOToGermanDate(new Date().toISOString().split('T')[0]);
}

/**
 * Create additional content row for a patient
 * @param {Object} patient - Patient object
 * @param {HTMLElement} tbody - Table body to add row to
 * @param {number} colspan - Number of columns to span
 */
function createAdditionalContentRow(patient, tbody, colspan, referenceRow = null) {
    const additionalContent = patient.additionalContent || {};

    // Check if there's any additional content to display
    const hasContent = additionalContent.weightAdmission ||
        additionalContent.bmiAdmission ||
        additionalContent.minWeight ||
        additionalContent.targetWeight ||
        additionalContent.motivationPhaseEnd ||
        additionalContent.warnings;

    if (!hasContent) return;

    // Create the additional content row
    const insertIndex = referenceRow ? referenceRow.sectionRowIndex + 1 : -1;
    const row = insertIndex >= 0 ? tbody.insertRow(insertIndex) : tbody.insertRow();
    row.classList.add('additional-content-row');

    const cell = row.insertCell();
    cell.colSpan = colspan;
    cell.classList.add('p-2', 'bg-light', 'small', 'fs-6');

    const parts = [];

    if (additionalContent.weightAdmission) {
        parts.push(`<span class="me-2 fs-6"><span class="fw-medium">Aufnahmegewicht:</span> ${additionalContent.weightAdmission} kg</span>`);
    }
    if (additionalContent.bmiAdmission) {
        parts.push(`<span class="me-2 fs-6"><span class="fw-medium">Aufnahme-BMI:</span> ${additionalContent.bmiAdmission}</span>`);
    }
    if (additionalContent.minWeight) {
        parts.push(`<span class="me-2 fs-6"><span class="fw-medium">Mindestgewicht:</span> ${additionalContent.minWeight} kg</span>`);
    }
    if (additionalContent.targetWeight) {
        parts.push(`<span class="me-2 fs-6"><span class="fw-medium">Zielgewicht:</span> ${additionalContent.targetWeight} kg</span>`);
    }
    if (additionalContent.motivationPhaseEnd) {
        const formattedMotivationEnd = formatISOToGermanDate(additionalContent.motivationPhaseEnd);
        parts.push(`<span class="me-2 fs-6"><span class="fw-medium">Ende Motivationsphase:</span> ${formattedMotivationEnd}</span>`);
    }
    if (additionalContent.warnings) {
        parts.push(`<span class="me-2 fs-6"><span class="fw-medium">Verwarnungen:</span> ${additionalContent.warnings}</span>`);
    }

    cell.innerHTML = parts.join('');
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
 * Hide the edit rounds form
 */

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

const eventConflictBufferBefore = 20;
const eventConflictBufferAfter = 10;

/**
 * Check if patient events conflict with a given timeslot
 * @param {Object} patient - Patient object
 * @param {string} germanDateStr - Date in German format (DD.MM.YYYY)
 * @param {string} timeSlot - Time slot in format HH:MM
 * @returns {Object} - Object with events, conflicting events, and hasConflict flag
 */
function checkPatientEventConflicts(patient, germanDateStr, timeSlot) {
    const date = parseGermanDate(germanDateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 4 = Thursday, ...

    // Parse the timeslot
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(slotHour, slotMinute, 0, 0);

    const events = [];
    const conflictingEvents = [];
    let hasConflict = false;

    // Check if the day is Thursday (4)
    if (dayOfWeek === 4) {
        // Check for MTT for group 3 patients on Thursday (09:30-10:30)
        if (patient.group && (patient.group === '3-A' || patient.group === '3-B' || patient.group === '3')) {
            const mttStartTime = new Date(date);
            mttStartTime.setHours(9, 30, 0, 0);

            // MTT is 60 minutes long
            const mttEndTime = new Date(mttStartTime);
            mttEndTime.setMinutes(mttStartTime.getMinutes() + 60);

            events.push('MTT');

            // Check if MTT conflicts with the timeslot
            // Conflict if the slot time is between (event_start_time - buffer) and (event_end_time + buffer)
            const eventBufferStart = new Date(mttStartTime);
            eventBufferStart.setMinutes(mttStartTime.getMinutes() - eventConflictBufferBefore);

            const eventBufferEnd = new Date(mttEndTime);
            eventBufferEnd.setMinutes(mttEndTime.getMinutes() + eventConflictBufferAfter);

            if (slotTime >= eventBufferStart && slotTime <= eventBufferEnd) {
                conflictingEvents.push('MTT');
                hasConflict = true;
            }
        }

        // Check for SKT on Thursday (08:05-08:55)
        if (window['therapies-station'] && window['therapies-station'][patient.id] &&
            window['therapies-station'][patient.id].skt === 'X') {
            const sktStartTime = new Date(date);
            sktStartTime.setHours(8, 5, 0, 0);

            // SKT is 50 minutes long
            const sktEndTime = new Date(sktStartTime);
            sktEndTime.setMinutes(sktStartTime.getMinutes() + 50);

            events.push('SKT');

            // Check if SKT conflicts with the timeslot
            const eventBufferStart = new Date(sktStartTime);
            eventBufferStart.setMinutes(sktStartTime.getMinutes() - eventConflictBufferBefore);

            const eventBufferEnd = new Date(sktEndTime);
            eventBufferEnd.setMinutes(sktEndTime.getMinutes() + eventConflictBufferAfter);

            if (slotTime >= eventBufferStart && slotTime <= eventBufferEnd) {
                conflictingEvents.push('SKT');
                hasConflict = true;
            }
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

        // Check kreativ_einzel (50 minutes long)
        if (therapies.kreativ_einzel) {
            const kreativMatch = therapies.kreativ_einzel.match(/([MGK])\s*([A-Za-z]{2})\.?\s*(\d{1,2}:\d{2})/i);
            if (kreativMatch && kreativMatch[2].toLowerCase() === weekdayShort.toLowerCase()) {
                const [eventHour, eventMinute] = kreativMatch[3].split(':').map(Number);
                const eventStartTime = new Date(date);
                eventStartTime.setHours(eventHour, eventMinute, 0, 0);

                // Kreativ_einzel is 50 minutes long
                const eventEndTime = new Date(eventStartTime);
                eventEndTime.setMinutes(eventStartTime.getMinutes() + 50);

                const eventText = `${kreativMatch[1]} ${kreativMatch[3]}`;
                events.push(eventText);

                // Check if the event conflicts with the timeslot
                // Conflict if the slot time is between (event_start_time - buffer) and (event_end_time + buffer)
                const eventBufferStart = new Date(eventStartTime);
                eventBufferStart.setMinutes(eventStartTime.getMinutes() - eventConflictBufferBefore);

                const eventBufferEnd = new Date(eventEndTime);
                eventBufferEnd.setMinutes(eventEndTime.getMinutes() + eventConflictBufferAfter);

                if (slotTime >= eventBufferStart && slotTime <= eventBufferEnd) {
                    conflictingEvents.push(eventText);
                    hasConflict = true;
                }
            }
        }

        // Check einzel_physio (30 minutes long)
        if (therapies.einzel_physio) {
            const physioMatch = therapies.einzel_physio.match(/([A-Za-z]{2})\.?\s*(\d{1,2}:\d{2})/i);
            if (physioMatch && physioMatch[1].toLowerCase() === weekdayShort.toLowerCase()) {
                const [eventHour, eventMinute] = physioMatch[2].split(':').map(Number);
                const eventStartTime = new Date(date);
                eventStartTime.setHours(eventHour, eventMinute, 0, 0);

                // Einzel_physio is 30 minutes long
                const eventEndTime = new Date(eventStartTime);
                eventEndTime.setMinutes(eventStartTime.getMinutes() + 30);

                const eventText = `P ${physioMatch[2]}`;
                events.push(eventText);

                // Check if the event conflicts with the timeslot
                // Conflict if the slot time is between (event_start_time - buffer) and (event_end_time + buffer)
                const eventBufferStart = new Date(eventStartTime);
                eventBufferStart.setMinutes(eventStartTime.getMinutes() - eventConflictBufferBefore);

                const eventBufferEnd = new Date(eventEndTime);
                eventBufferEnd.setMinutes(eventEndTime.getMinutes() + eventConflictBufferAfter);

                if (slotTime >= eventBufferStart && slotTime <= eventBufferEnd) {
                    conflictingEvents.push(eventText);
                    hasConflict = true;
                }
            }
        }
    }

    return {
        events: events.join(', '),
        conflictingEvents: conflictingEvents,
        hasConflict: hasConflict
    };
}

/**
 * Get patient events for a specific day that fall within the timeframe of rounds
 * @param {Object} patient - Patient object
 * @param {string} germanDateStr - Date in German format (DD.MM.YYYY)
 * @returns {string} - Comma-separated list of events
 */
function getPatientEvents(patient, germanDateStr) {
    // Get rounds start time or default to 08:30
    let roundsStartTime = '08:30';
    const startTimeElement = document.getElementById('editRoundsStartTime');
    if (startTimeElement && startTimeElement.value) {
        roundsStartTime = startTimeElement.value;
    }

    // Use the checkPatientEventConflicts function to get events
    // We pass a dummy timeslot that's far outside normal hours to avoid conflicts
    const eventInfo = checkPatientEventConflicts(patient, germanDateStr, '23:59');
    
    // Check for custom rounds events from patient-events-station
    let events = eventInfo.events;
    if (window['patient-events-station'] && window['patient-events-station'][patient.id] && 
        window['patient-events-station'][patient.id].rounds) {
        if (events) {
            events += ', ' + window['patient-events-station'][patient.id].rounds;
        } else {
            events = window['patient-events-station'][patient.id].rounds;
        }
    }
    
    return events;
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