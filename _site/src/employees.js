function formatAbsenceDates(start, end) {
    const [startDay, startMonth, startYear] = start.split('.');
    const [endDay, endMonth, endYear] = end.split('.');

    // Pad day and month with leading zeros
    const startDayPadded = startDay.padStart(2, '0');
    const startMonthPadded = startMonth.padStart(2, '0');
    const endDayPadded = endDay.padStart(2, '0');
    const endMonthPadded = endMonth.padStart(2, '0');

    // If start and end are the same day
    if (startDay === endDay && startMonth === endMonth && startYear === endYear) {
        return `${startDayPadded}.${startMonthPadded}.${startYear}`;
    }

    // If years are equal
    if (startYear === endYear) {
        // If months are equal
        if (startMonth === endMonth) {
            return `${startDayPadded}.-${endDayPadded}.${startMonthPadded}.${startYear}`;
        }
        return `${startDayPadded}.${startMonthPadded}.-${endDayPadded}.${endMonthPadded}.${startYear}`;
    }
    // Different years, show full dates
    return `${startDayPadded}.${startMonthPadded}.${startYear}-${endDayPadded}.${endMonthPadded}.${endYear}`;
}

function addEmployee() {
    const form = document.getElementById('addEmployeeForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const name = document.getElementById('employeeName').value.trim();
    const patients = parseInt(document.getElementById('employeePatients').value);

    // Check if employee already exists
    if (name in employees) {
        alert('Eine:r Mitarbeiter:in mit diesem Namen existiert bereits.');
        return;
    }

    // Add new employee
    employees[name] = {
        patients: patients
    };

    // Hide modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
    modal.hide();

    // Update table and mark changes
    fillEmployeesTable();
    checkData();
}

function editEmployee(empKey) {
    currentEmployeeKey = empKey;
    const employee = employees[empKey];
    
    const nameInput = document.getElementById('employeeName');
    nameInput.value = employee.name;

    const patientsInput = document.getElementById('editEmployeePatients');
    patientsInput.value = employee.patients || 0;
    
    const absencesList = document.getElementById('absences');
    absencesList.innerHTML = '';
    
    if (employee.absences) {
        // Convert single absence to array if needed
        const absencesArray = Array.isArray(employee.absences) ? employee.absences : [employee.absences];
        absencesArray.forEach(absence => {
            const template = document.getElementById('absenceTemplate');
            const absenceDiv = template.content.cloneNode(true).querySelector('.list-group-item');
            
            const startInput = absenceDiv.querySelector('.absence-start');
            const endInput = absenceDiv.querySelector('.absence-end');
            
            startInput.value = formatGermanToISODate(absence.start);
            endInput.value = formatGermanToISODate(absence.end);
            
            // Add start date change handler
            startInput.addEventListener('change', function() {
                if (!endInput.value) {
                    endInput.value = this.value;
                }
            });
            
            if (absence.announcement) {
                absenceDiv.querySelector('.absence-announcement').value = formatGermanToISODate(absence.announcement);
            }
            absenceDiv.querySelector('.absence-planned').checked = absence.planned || false;
            
            const deleteButton = absenceDiv.querySelector('.btn-outline-danger');
            deleteButton.onclick = function() { this.closest('.list-group-item').remove(); };
            
            absencesList.appendChild(absenceDiv);
        });
    }
    
    const modal = new bootstrap.Modal(document.getElementById('editEmployeeModal'));
    modal.show();
}

function addAbsenceEntry() {
    const template = document.getElementById('absenceTemplate');
    const absenceDiv = template.content.cloneNode(true).querySelector('.list-group-item');
    
    // Add delete functionality
    const deleteButton = absenceDiv.querySelector('.btn-outline-danger');
    deleteButton.onclick = function() { this.closest('.list-group-item').remove(); };
    
    // Add start date change handler
    const startInput = absenceDiv.querySelector('.absence-start');
    const endInput = absenceDiv.querySelector('.absence-end');
    startInput.addEventListener('change', function() {
        if (!endInput.value) {
            endInput.value = this.value;
        }
    });
    
    document.getElementById('absences').appendChild(absenceDiv);
}

function saveEmployeeEdit() {
    const nameInput = document.getElementById('employeeName');
    if (!nameInput.value.trim()) {
        alert('Bitte geben Sie einen Namen ein.');
        return;
    }

    const patientsInput = document.getElementById('editEmployeePatients');
    const patients = parseInt(patientsInput.value) || 0;

    const absencesList = document.getElementById('absences');
    const absences = Array.from(absencesList.children).map(absenceDiv => {
        const start = absenceDiv.querySelector('.absence-start').value;
        const end = absenceDiv.querySelector('.absence-end').value;
        const announcement = absenceDiv.querySelector('.absence-announcement').value;
        const planned = absenceDiv.querySelector('.absence-planned').checked;

        return {
            start: formatISOToGermanDate(start),
            end: formatISOToGermanDate(end),
            announcement: announcement ? formatISOToGermanDate(announcement) : null,
            planned: planned
        };
    }).filter(absence => absence.start && absence.end);

    employees[currentEmployeeKey] = {
        name: nameInput.value.trim(),
        patients: patients,
        absences: absences
    };

    checkData();
    fillEmployeesTable();
    bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal')).hide();
}

function formatGermanToISODate(germanDate) {
    const [day, month, year] = germanDate.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function formatISOToGermanDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${parseInt(day)}.${parseInt(month)}.${year}`;
}

function fillEmployeesTable() {
    const tbody = document.getElementById('employeesTableBody');
    tbody.innerHTML = '';

    for (let empKey in employees) {
        const employee = employees[empKey];
        const row = document.createElement('tr');

        // Name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = empKey;
        row.appendChild(nameCell);

        // Patients cell
        const patientsCell = document.createElement('td');
        patientsCell.classList.add('text-center');
        patientsCell.textContent = employee.patients;
        row.appendChild(patientsCell);

        // Absences cell
        const absencesCell = document.createElement('td');
        if (employee.absences) {
            // Convert single absence to array if needed
            const absencesArray = Array.isArray(employee.absences) ? employee.absences : [employee.absences];
            
            absencesArray.forEach(absence => {
                const badge = document.createElement('span');
                badge.className = `badge ${absence.planned ? 'bg-success' : 'bg-warning'} me-1`;
                badge.textContent = formatAbsenceDates(absence.start, absence.end);
                absencesCell.appendChild(badge);
            });
        }
        row.appendChild(absencesCell);

        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.className = 'text-end';
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-outline-primary';
        editButton.innerHTML = '<i class="bi bi-pencil text-primary"></i>';
        editButton.onclick = () => editEmployee(empKey);
        actionsCell.appendChild(editButton);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    }
}

function deleteEmployee() {
    if (confirm('Möchten Sie diese:n Mitarbeiter:in wirklich löschen?')) {
        delete employees[currentEmployeeKey];
        checkData();
        fillEmployeesTable();
        bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal')).hide();
    }
}
