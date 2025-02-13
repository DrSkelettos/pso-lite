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
    const employee = employees[empKey];
    if (!employee) return;

    // Store employee ID for saving
    document.getElementById('editEmployeeId').value = empKey;

    // Set patients
    document.getElementById('editEmployeePatients').value = employee.patients;

    // Clear and populate absences list
    const absencesList = document.getElementById('absencesList');
    absencesList.innerHTML = '';
    
    if (employee.absences) {
        // Convert single absence to array if needed
        const absencesArray = Array.isArray(employee.absences) ? employee.absences : [employee.absences];
        absencesArray.forEach(absence => {
            addAbsenceEntry(absence.start, absence.end);
        });
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editEmployeeModal'));
    modal.show();
}

function addAbsenceEntry(start = '', end = '') {
    const absencesList = document.getElementById('absencesList');
    const absenceDiv = document.createElement('div');
    absenceDiv.className = 'absence-entry d-flex gap-2 align-items-center mb-2';
    
    // Create the elements first so we can add event listeners
    const startInput = document.createElement('input');
    startInput.type = 'date';
    startInput.className = 'form-control absence-start';
    startInput.value = start ? formatGermanToISODate(start) : '';
    startInput.required = true;

    const endInput = document.createElement('input');
    endInput.type = 'date';
    endInput.className = 'form-control absence-end';
    endInput.value = end ? formatGermanToISODate(end) : '';
    endInput.required = true;

    // Add event listener to start date
    startInput.addEventListener('change', function() {
        if (!endInput.value) {
            endInput.value = this.value;
        }
    });

    // Assemble the div
    absenceDiv.appendChild(startInput);
    absenceDiv.appendChild(document.createTextNode('-'));
    absenceDiv.appendChild(endInput);
    
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-outline-danger btn-sm';
    deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
    deleteButton.onclick = function() { this.parentElement.remove(); };
    absenceDiv.appendChild(deleteButton);

    absencesList.appendChild(absenceDiv);
}

function formatGermanToISODate(germanDate) {
    const [day, month, year] = germanDate.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function formatISOToGermanDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${parseInt(day)}.${parseInt(month)}.${year}`;
}

function saveEmployeeEdit() {
    const form = document.getElementById('editEmployeeForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const empKey = document.getElementById('editEmployeeId').value;
    const patients = parseInt(document.getElementById('editEmployeePatients').value);

    // Update employee data
    employees[empKey].patients = patients;

    // Get absences
    const absenceEntries = document.querySelectorAll('.absence-entry');
    if (absenceEntries.length > 0) {
        const absences = [];
        absenceEntries.forEach(entry => {
            const start = entry.querySelector('.absence-start').value;
            const end = entry.querySelector('.absence-end').value;
            
            if (start && end) {
                absences.push({
                    start: formatISOToGermanDate(start),
                    end: formatISOToGermanDate(end)
                });
            }
        });
        
        if (absences.length > 0) {
            employees[empKey].absences = absences;
        } else {
            delete employees[empKey].absences;
        }
    } else {
        delete employees[empKey].absences;
    }

    // Hide modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal'));
    modal.hide();

    // Update table and mark changes
    fillEmployeesTable();
    checkData();
}

function deleteEmployee() {
    const empKey = document.getElementById('editEmployeeId').value;
    if (!empKey) return;

    if (confirm('Möchten Sie diese:n Mitarbeiter:in wirklich löschen?')) {
        delete employees[empKey];

        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal'));
        modal.hide();

        // Update table and mark changes
        fillEmployeesTable();
        checkData();
    }
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
                badge.className = 'badge bg-warning text-dark me-1';
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
        editButton.innerHTML = '<i class="bi bi-pencil"></i>';
        editButton.onclick = () => editEmployee(empKey);
        actionsCell.appendChild(editButton);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    }
}
