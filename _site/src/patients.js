function addPatient() {

    const form = document.getElementById('addPatientForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const name = document.getElementById('patientName').value;
    const group = document.getElementById('patientGroup').value;
    const room = document.getElementById('patientRoom').value;
    const employee = document.getElementById('patientEmployee').value;
    const admission = formatDate(document.getElementById('patientAdmission').value);
    const misc = document.getElementById('patientMisc').value;

    // Create new patient object in correct format
    const newPatient = {
        name: name,
        group: group,
        admission: admission,
        employees: [
            { employee: employee, start: admission }
        ],
        rooms: [
            { room: room, start: admission }
        ]
    };

    // Add misc if it's not empty
    if (misc) {
        newPatient.misc = misc;
    }

    // Add to patients object with new key
    let lastKey = Object.keys(window['patients-station']).length === 0 ? 0 : Math.max(...Object.keys(window['patients-station']).map(Number));
    window['patients-station'][lastKey + 1] = newPatient;

    // Update data and table
    checkData();
    fillPatientsTable();

    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPatientModal'));
    modal.hide();
    form.reset();
}

function getActiveEmployees(patient, date) {
    if (!patient.employees || patient.employees.length === 0) return [];

    const compareDate = parseGermanDate(date);
    return patient.employees.filter(emp => {
        const startDate = parseGermanDate(emp.start);
        const endDate = emp.end ? parseGermanDate(emp.end) : null;
        return startDate <= compareDate && (!endDate || endDate >= compareDate);
    }).map(emp => emp.employee);
}

function fillPatientData(row, patient) {
    if (!patient) return;

    const cells = {
        name: row.querySelector('.data-name'),
        group: row.querySelector('.data-group'),
        employee1: row.querySelector('.data-employee1'),
        misc: row.querySelector('.data-misc'),
        admission: row.querySelector('.data-admission'),
        week: row.querySelector('.data-week'),
        discharge: row.querySelector('.data-discharge'),
        discharge_mode: row.querySelector('.data-discharge_mode')
    };

    // Fill in basic data
    const nameContainer = document.createElement('div');

    // Add name as clickable link
    const nameLink = document.createElement('a');
    nameLink.href = '#';
    nameLink.textContent = patient.name || '';
    nameLink.classList.add('text-decoration-none');
    nameLink.onclick = (e) => {
        e.preventDefault();
        editPatient(patient.id);
    };
    nameContainer.appendChild(nameLink);

    // Check for future room assignments
    if (patient.rooms && patient.rooms.length > 1) {
        const futureRooms = patient.rooms.filter(room => {
            if (!room.start) return false;
            const [day, month, year] = room.start.split('.');
            const startDate = new Date(year, month - 1, day);
            return startDate > currentTableDate;
        });

        if (futureRooms.length > 0) {
            // Add future room info
            const nextRoom = futureRooms[0];
            const futureInfo = document.createElement('small');
            futureInfo.classList.add('text-muted', 'ms-2', 'font-12');
            // Format date to show only DD.MM.
            const [day, month] = nextRoom.start.split('.').slice(0, 2);
            futureInfo.textContent = `>${nextRoom.room} am ${day}.${month}.`;
            nameContainer.appendChild(futureInfo);
        }
    }

    cells.name.innerHTML = '';
    cells.name.appendChild(nameContainer);

    cells.group.textContent = patient.group || '';
    cells.admission.textContent = patient.admission || '';
    cells.week.textContent = calculatePatientWeek(patient.admission, currentTableDate);
    cells.discharge.textContent = patient.discharge || '';

    // Make discharge date clickable if present
    if (patient.discharge) {
        const dischargeLink = document.createElement('a');
        dischargeLink.href = '#';
        dischargeLink.textContent = patient.discharge;
        dischargeLink.classList.add('text-decoration-none');
        dischargeLink.onclick = (e) => {
            e.preventDefault();
            preFillAddPatientModal(patient);
        };
        cells.discharge.innerHTML = '';
        cells.discharge.appendChild(dischargeLink);
    } else {
        cells.discharge.textContent = '';
    }

    // Show discharge mode
    if (patient.discharge_mode)
        cells.discharge_mode.textContent = patient.discharge_mode;
    
    // Fill in employee data
    if (patient.employees && patient.employees.length > 0) {
        cells.employee1.textContent = patient.employees[0].employee;

        // Combine additional employees and misc info
        let miscContent = [];

        // Add additional employees
        if (patient.employees.length > 1) {
            const additionalEmployees = patient.employees.slice(1).map(emp => emp.employee);
            miscContent.push(additionalEmployees.join(', '));
        }

        // Add misc text if present
        if (patient.misc) {
            miscContent.push(patient.misc);
        }

        cells.misc.textContent = miscContent.join(' | ');
    }
    
    // Add bold class for dates in current week
    if (isDateInCurrentWeek(patient.admission)) {
        cells.admission.classList.add('fw-bold');
    }
    if (isDateInCurrentWeek(patient.discharge)) {
        cells.discharge.classList.add('fw-bold');
    }
}

function fillPlannedPatientData(row, patient) {
    if (!patient) return;

    // Get all planned data cells
    const cells = {
        name: row.querySelector('.data-name-planned'),
        group: row.querySelector('.data-group-planned'),
        employee1: row.querySelector('.data-employee1-planned'),
        misc: row.querySelector('.data-misc-planned'),
        admission: row.querySelector('.data-admission-planned')
    };

    // Fill in the planned data
    const nameLink = document.createElement('a');
    nameLink.href = '#';
    nameLink.textContent = patient.name || '';
    nameLink.classList.add('text-decoration-none');
    nameLink.onclick = (e) => {
        e.preventDefault();
        editPatient(patient.id);
    };
    cells.name.innerHTML = '';
    cells.name.appendChild(nameLink);

    cells.group.textContent = patient.group || '';
    cells.admission.textContent = patient.admission || '';

    // Handle employee assignments and misc
    if (patient.employees && patient.employees.length > 0) {
        cells.employee1.textContent = patient.employees[0].employee;

        // Combine additional employees and misc info
        let miscContent = [];

        // Add additional employees
        if (patient.employees.length > 1) {
            const additionalEmployees = patient.employees.slice(1).map(emp => emp.employee);
            miscContent.push(additionalEmployees.join(', '));
        }

        // Add misc text if present
        if (patient.misc) {
            miscContent.push(patient.misc);
        }

        cells.misc.textContent = miscContent.join(' | ');
    } else if (patient.misc) {
        // If there are no employees but misc is present
        cells.misc.textContent = patient.misc;
    }
    
    // Add bold class for admission date in current week
    if (isDateInCurrentWeek(patient.admission)) {
        cells.admission.classList.add('fw-bold');
    }
}

function fillPatientsTable() {
    let table = document.getElementById("patients-table");
    let template = document.getElementById("patient-row");

    // Clear existing rows except template
    Array.from(table.children).forEach(child => {
        if (child !== template) {
            child.remove();
        }
    });

    // Create rows for each room and space
    for (let roomKey in rooms) {
        for (let spaceKey of ['F', 'T']) {
            // Skip if the space doesn't exist in this room
            if (!(spaceKey in rooms[roomKey])) continue;

            // Create new row from template
            let row = template.cloneNode(true);
            let rowId = `${roomKey}-${spaceKey}`;

            // Set row properties
            row.id = rowId;
            row.classList.remove('d-none');

            // Set room number
            let roomCell = row.querySelector('.data-room');
            roomCell.textContent = roomKey;
            roomCell.id = `${rowId}-room`;

            // Set ids for all data cells
            row.querySelectorAll('td').forEach(cell => {
                let dataClass = Array.from(cell.classList).find(cls => cls.startsWith('data-'));
                if (dataClass) {
                    let dataType = dataClass.replace('data-', '');
                    cell.id = `${rowId}-${dataType}`;
                }
            });

            // Add thicker bottom border for last space in room
            if (spaceKey === 'T') {
                row.classList.add('border-bottom-3');
            }

            table.appendChild(row);
        }
    }

    // Fill in patient data
    const patientsByRooms = getPatientsByRooms();
    for (let roomId in patientsByRooms) {
        const row = document.getElementById(roomId);
        if (row) {
            fillPatientData(row, patientsByRooms[roomId].current);
            fillPlannedPatientData(row, patientsByRooms[roomId].planned);
        }
    }
}

function filterPatients() {
    const current = {};
    const dismissed = {};
    const planned = {};

    for (let id in window['patients-station']) {
        const patient = window['patients-station'][id];

        // Convert dates to Date objects for comparison
        const admissionDate = parseGermanDate(patient.admission);
        const dischargeDate = patient.discharge ? parseGermanDate(patient.discharge) : null;

        if (admissionDate > currentTableDate) {
            // Future admission = planned
            planned[id] = patient;
        } else if (dischargeDate && dischargeDate < currentTableDate) {
            // Past discharge = dismissed
            dismissed[id] = patient;
        } else {
            // Current patient
            current[id] = patient;
        }
    }

    return { current, dismissed, planned };
}

function getActiveRoom(patient, date = null) {
    if (!patient.rooms || patient.rooms.length === 0) return null;

    const targetDate = date ? parseGermanDate(date) : currentTableDate;
    let activeRoom = null;

    // Sort rooms by start date
    const sortedRooms = [...patient.rooms].sort((a, b) => {
        const dateA = parseGermanDate(a.start);
        const dateB = parseGermanDate(b.start);
        return dateA - dateB;
    });

    // Find the active room for the target date
    for (let room of sortedRooms) {
        const startDate = parseGermanDate(room.start);
        const endDate = room.end ? parseGermanDate(room.end) : null;

        if (startDate <= targetDate && (!endDate || targetDate <= endDate)) {
            activeRoom = room.room;
        }
    }

    return activeRoom;
}

function getPatientsByRooms() {
    const patientsByRooms = {};
    const { current, dismissed, planned } = filterPatients();

    // Initialize result with empty arrays for each room-space combination
    for (let roomKey in rooms) {
        for (let spaceKey in rooms[roomKey]) {
            const roomId = `${roomKey}-${spaceKey}`;
            patientsByRooms[roomId] = {
                current: null,
                planned: null
            };
        }
    }

    // Process current patients
    for (let patientId in current) {
        const patient = current[patientId];
        const activeRoom = getActiveRoom(patient);
        if (activeRoom && activeRoom in patientsByRooms) {
            patientsByRooms[activeRoom].current = { ...patient, id: patientId };
        }
    }

    // Process planned patients
    for (let patientId in planned) {
        const patient = planned[patientId];
        const activeRoom = getActiveRoom(patient, patient.admission);
        if (activeRoom && activeRoom in patientsByRooms) {
            patientsByRooms[activeRoom].planned = { ...patient, id: patientId };
        }
    }

    return patientsByRooms;
}

let currentTableDate = new Date();

function updateTableDate(dateString) {
    // The date picker returns a date in ISO format (YYYY-MM-DD)
    // We need to convert it to a JavaScript Date object
    if (dateString) {
        currentTableDate = new Date(dateString);
    } else {
        currentTableDate = new Date();
    }
    fillPatientsTable();
}

function preFillAddPatientModal(patientData) {
    // Show the modal first, which will trigger initialization
    const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    modal.show();

    // Wait for modal to be shown and dropdowns initialized
    setTimeout(() => {

        // Set name to "X"
        document.getElementById('patientName').value = 'X';

        // Set employee from original patient
        if (patientData.employees && patientData.employees.length > 0) {
            const employee = patientData.employees[0].employee;
            document.getElementById('patientEmployee').value = employee;
        }

        // Set room from original patient
        if (patientData.rooms && patientData.rooms.length > 0) {
            const currentRoom = patientData.rooms[patientData.rooms.length - 1].room;
            document.getElementById('patientRoom').value = currentRoom;
        }

        // Set admission date to original patient's discharge date
        if (patientData.discharge) {
            // Convert from German date format to ISO for input field
            const [day, month, year] = patientData.discharge.split('.');
            const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            document.getElementById('patientAdmission').value = isoDate;
        }
    }, 100); // Small delay to ensure modal is shown and dropdowns are initialized
}