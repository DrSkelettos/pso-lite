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
    let lastKey = Object.keys(patients).length === 0 ? 0 : Math.max(...Object.keys(patients).map(Number));
    patients[lastKey + 1] = newPatient;

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
        const today = new Date('2025-02-13'); // Using the current time from metadata
        const futureRooms = patient.rooms.filter(room => {
            if (!room.start) return false;
            const [day, month, year] = room.start.split('.');
            const startDate = new Date(year, month - 1, day);
            return startDate > today;
        });

        if (futureRooms.length > 0) {
            // Add future room info
            const nextRoom = futureRooms[0];
            const futureInfo = document.createElement('small');
            futureInfo.classList.add('text-muted', 'ms-2', 'font-12');
            futureInfo.textContent = `>${nextRoom.room} am ${nextRoom.start}`;
            nameContainer.appendChild(futureInfo);
        }
    }

    cells.name.innerHTML = '';
    cells.name.appendChild(nameContainer);

    cells.group.textContent = patient.group || '';
    cells.admission.textContent = patient.admission || '';
    cells.discharge.textContent = patient.discharge || '';

    // Calculate and display week number
    if (patient.admission) {
        const weekNumber = calculateWeek(patient.admission);
        cells.week.textContent = weekNumber;
    }

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

function filterPatients(date = null) {
    const compareDate = date || new Date().toLocaleDateString('de-DE');
    const result = {
        current: {},
        dismissed: {},
        planned: {}
    };

    for (let key in patients) {
        const patient = patients[key];
        const admissionDate = parseGermanDate(patient.admission);
        const dischargeDate = patient.discharge ? parseGermanDate(patient.discharge) : null;
        const currentDate = parseGermanDate(compareDate);

        if (admissionDate > currentDate) {
            // Future admission date = planned
            result.planned[key] = patient;
        } else if (dischargeDate && dischargeDate < currentDate) {
            // Past discharge date = dismissed (only if discharge date exists)
            result.dismissed[key] = patient;
        } else {
            // Current patient (admission date passed, and either no discharge date or discharge date not yet passed)
            result.current[key] = patient;
        }
    }

    return result;
}

function parseGermanDate(dateStr) {
    const [day, month, year] = dateStr.split('.');
    return new Date(year, month - 1, day); // month is 0-based in JS Date
}

function getPatientsByRooms(date = null) {
    const patientsByRooms = {};
    const { current, dismissed, planned } = filterPatients(date);

    // Initialize result with empty arrays for each room-space combination
    for (let roomKey in rooms) {
        for (let spaceKey of ['F', 'T']) {
            if (spaceKey in rooms[roomKey]) {
                const roomId = `${roomKey}-${spaceKey}`;
                patientsByRooms[roomId] = {
                    current: null,
                    planned: null
                };
            }
        }
    }

    // Helper function to get the active room for a patient at the given date
    function getActiveRoom(patient, compareDate) {
        const currentDate = parseGermanDate(compareDate);
        let activeRoom = null;

        if (patient.rooms && patient.rooms.length > 0) {
            // Sort rooms by start date, newest first
            const sortedRooms = [...patient.rooms].sort((a, b) =>
                parseGermanDate(b.start) - parseGermanDate(a.start)
            );

            // Find the most recent room assignment that started before or on the compare date
            activeRoom = sortedRooms.find(room =>
                parseGermanDate(room.start) <= currentDate &&
                (!room.end || parseGermanDate(room.end) >= currentDate)
            );
        }

        return activeRoom ? activeRoom.room : null;
    }

    // Process current patients
    for (let patientId in current) {
        const patient = current[patientId];
        const activeRoom = getActiveRoom(patient, date || new Date().toLocaleDateString('de-DE'));
        if (activeRoom && activeRoom in patientsByRooms) {
            patientsByRooms[activeRoom].current = {
                id: patientId,
                ...patient
            };
        }
    }

    // Process planned patients
    for (let patientId in planned) {
        const patient = planned[patientId];
        const activeRoom = getActiveRoom(patient, patient.admission); // Use admission date for planned patients
        if (activeRoom && activeRoom in patientsByRooms) {
            patientsByRooms[activeRoom].planned = {
                id: patientId,
                ...patient
            };
        }
    }

    return patientsByRooms;
}

function calculateWeek(admissionDate) {
    if (!admissionDate) return '';

    // Parse the German date format DD.MM.YYYY
    const [day, month, year] = admissionDate.split('.');
    const admission = new Date(year, month - 1, day);
    const today = new Date('2025-02-13'); // Using the current time from metadata

    // If admission is in the future, return empty
    if (admission > today)
        return '';

    // Find the first Monday after admission
    const firstMonday = new Date(admission);
    const daysUntilMonday = (8 - admission.getDay()) % 7;
    firstMonday.setDate(admission.getDate() + daysUntilMonday);

    // If we haven't reached the first Monday yet, return week 1
    if (today < firstMonday)
        return '1';

    // Calculate weeks since first Monday
    const weeksSinceMonday = Math.floor((today - firstMonday) / (7 * 24 * 60 * 60 * 1000));
    const totalWeeks = weeksSinceMonday + 1; // Add 1 for the first week

    return totalWeeks.toString();
}