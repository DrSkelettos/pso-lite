function addPatient(data) {
    let lastKey = Object.keys(patients).length === 0 ? 0 : Math.max(...Object.keys(patients));
    patients[lastKey + 1] = data;
    checkData();
}

function fillPatientData(row, patient) {
    if (!patient) return;

    // Get all data cells
    const cells = {
        name: row.querySelector('.data-name'),
        group: row.querySelector('.data-group'),
        employee1: row.querySelector('.data-employee1'),
        employee2: row.querySelector('.data-employee2'),
        admission: row.querySelector('.data-admission'),
        discharge: row.querySelector('.data-discharge'),
        discharge_mode: row.querySelector('.data-discharge_mode')
    };

    // Fill in the data
    cells.name.textContent = patient.name || '';
    cells.group.textContent = patient.group || '';
    cells.admission.textContent = patient.admission || '';
    cells.discharge.textContent = patient.discharge || '';

    // Handle employee assignments
    if (patient.employees && patient.employees.length > 0) {
        const currentEmployees = patient.employees
            .filter(e => !e.end)
            .map(e => e.employee);
        
        if (currentEmployees.length > 0) {
            cells.employee1.textContent = currentEmployees[0] || '';
            cells.employee2.textContent = currentEmployees[1] || '';
        }
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
    cells.name.textContent = patient.name || '';
    cells.group.textContent = patient.group || '';
    cells.admission.textContent = patient.admission || '';

    // Handle employee assignments
    if (patient.employees && patient.employees.length > 0) {
        cells.employee1.textContent = patient.employees[0].employee || '';
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
    const filteredPatients = filterPatients(date);
    const result = {};

    // Initialize result with empty arrays for each room-space combination
    for (let roomKey in rooms) {
        for (let spaceKey of ['F', 'T']) {
            if (spaceKey in rooms[roomKey]) {
                const roomId = `${roomKey}-${spaceKey}`;
                result[roomId] = {
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
    for (let patientId in filteredPatients.current) {
        const patient = filteredPatients.current[patientId];
        const activeRoom = getActiveRoom(patient, date || new Date().toLocaleDateString('de-DE'));
        if (activeRoom && activeRoom in result) {
            result[activeRoom].current = {
                id: patientId,
                ...patient
            };
        }
    }

    // Process planned patients
    for (let patientId in filteredPatients.planned) {
        const patient = filteredPatients.planned[patientId];
        const activeRoom = getActiveRoom(patient, patient.admission); // Use admission date for planned patients
        if (activeRoom && activeRoom in result) {
            result[activeRoom].planned = {
                id: patientId,
                ...patient
            };
        }
    }

    return result;
}