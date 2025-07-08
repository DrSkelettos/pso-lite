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

    const key = document.getElementById('employeeKey').value.trim();
    const name = document.getElementById('employeeName').value.trim();
    const patients = parseInt(document.getElementById('employeePatients').value);

    // Check if employee already exists
    if (key in window['employees']) {
        alert('Eine:r Mitarbeiter:in mit diesem Kürzel existiert bereits.');
        return;
    }

    // Add new employee
    window['employees'][key] = {
        name: name,
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
    const employee = window['employees'][empKey];

    // Set current key and name
    document.getElementById('editEmployeeKey').value = empKey;
    document.getElementById('editEmployeeName').value = employee.name;
    document.getElementById('editEmployeeUsername').value = employee.username || '';
    document.getElementById('editEmployeeRightsViewPatientsStation').checked = employee.rights?.viewPatientsStation || false;
    document.getElementById('editEmployeeRightsEditPatientsStation').checked = employee.rights?.editPatientsStation || false;
    document.getElementById('editEmployeeRightsViewTherapiesStation').checked = employee.rights?.viewTherapiesStation || false;
    document.getElementById('editEmployeeRightsEditTherapiesStation').checked = employee.rights?.editTherapiesStation || false;
    document.getElementById('editEmployeeRightsKosiStation').checked = employee.rights?.kosiStation || false;
    document.getElementById('editEmployeeRightsEditEmployees').checked = employee.rights?.editEmployees || false;

    const patientsInput = document.getElementById('editEmployeePatients');
    patientsInput.value = employee.patients || 0;

    const absencesList = document.getElementById('absences');
    absencesList.innerHTML = '';

    if (employee.absences) {
        // Convert single absence to array if needed
        const absencesArray = Array.isArray(employee.absences) ? employee.absences : [employee.absences];
        absencesArray.forEach((absence, index) => {
            const template = document.getElementById('absenceTemplate');
            const absenceDiv = template.content.cloneNode(true).querySelector('.list-group-item');

            // Generate unique ID for the checkbox
            const uniqueId = `absence-planned-${currentEmployeeKey}-${index}`;
            const checkbox = absenceDiv.querySelector('.absence-planned');
            const label = absenceDiv.querySelector('.form-check-label');
            checkbox.id = uniqueId;
            label.setAttribute('for', uniqueId);

            const startInput = absenceDiv.querySelector('.absence-start');
            const endInput = absenceDiv.querySelector('.absence-end');

            startInput.value = formatGermanToISODate(absence.start);
            endInput.value = formatGermanToISODate(absence.end);

            // Add start date change handler
            startInput.addEventListener('change', function () {
                if (!endInput.value) {
                    // Parse the date and ensure we use the correct year
                    const date = new Date(this.value);
                    if (date.getFullYear() < 2024) {  // If year is too old
                        date.setFullYear(new Date().getFullYear());  // Set to current year
                    }
                    endInput.value = date.toISOString().split('T')[0];
                }
            });

            if (absence.announcement) {
                absenceDiv.querySelector('.absence-announcement').value = formatGermanToISODate(absence.announcement);
            }
            checkbox.checked = absence.planned || false;

            const deleteButton = absenceDiv.querySelector('.btn-outline-danger');
            deleteButton.onclick = function () { this.closest('.list-group-item').remove(); };

            absencesList.appendChild(absenceDiv);
        });
    }

    const modal = new bootstrap.Modal(document.getElementById('editEmployeeModal'));
    modal.show();
}

function addAbsenceEntry() {
    const template = document.getElementById('absenceTemplate');
    const absenceDiv = template.content.cloneNode(true).querySelector('.list-group-item');

    // Generate unique ID for the checkbox
    const uniqueId = 'absence-planned-' + Date.now();
    const checkbox = absenceDiv.querySelector('.absence-planned');
    const label = absenceDiv.querySelector('.form-check-label');
    checkbox.id = uniqueId;
    label.setAttribute('for', uniqueId);

    // Add delete functionality
    const deleteButton = absenceDiv.querySelector('.btn-outline-danger');
    deleteButton.onclick = function () { this.closest('.list-group-item').remove(); };

    // Add start date change handler
    const startInput = absenceDiv.querySelector('.absence-start');
    const endInput = absenceDiv.querySelector('.absence-end');
    startInput.addEventListener('change', function () {
        if (!endInput.value) {
            // Parse the date and ensure we use the correct year
            const date = new Date(this.value);
            if (date.getFullYear() < 2024) {  // If year is too old
                date.setFullYear(new Date().getFullYear());  // Set to current year
            }
            endInput.value = date.toISOString().split('T')[0];
        }
    });

    document.getElementById('absences').appendChild(absenceDiv);
}

async function saveEmployeeEdit() {
    const oldKey = currentEmployeeKey;
    const oldEmployee = window['employees'][oldKey];
    const newKey = document.getElementById('editEmployeeKey').value.trim();
    const name = document.getElementById('editEmployeeName').value.trim();
    const username = document.getElementById('editEmployeeUsername').value.trim();
    const password = document.getElementById('editEmployeePassword').value.trim();
    const passwordCheckbox = document.getElementById('editEmployeePasswordCheckbox').checked;
    const patients = parseInt(document.getElementById('editEmployeePatients').value) || 0;

    const rights = {};
    rights.editEmployees = document.getElementById('editEmployeeRightsEditEmployees').checked;
    rights.viewPatientsStation = document.getElementById('editEmployeeRightsViewPatientsStation').checked;
    rights.editPatientsStation = document.getElementById('editEmployeeRightsEditPatientsStation').checked;
    rights.viewTherapiesStation = document.getElementById('editEmployeeRightsViewTherapiesStation').checked;
    rights.editTherapiesStation = document.getElementById('editEmployeeRightsEditTherapiesStation').checked;
    rights.kosiStation = document.getElementById('editEmployeeRightsKosiStation').checked;

    // Get all absences
    const absencesList = document.getElementById('absences');
    const absences = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day

    absencesList.querySelectorAll('.list-group-item').forEach(absenceDiv => {
        const startInput = absenceDiv.querySelector('.absence-start');
        const endInput = absenceDiv.querySelector('.absence-end');
        const announcementInput = absenceDiv.querySelector('.absence-announcement');
        const plannedCheckbox = absenceDiv.querySelector('.absence-planned');

        if (startInput.value && endInput.value) {
            const endDate = new Date(endInput.value);
            // Skip if end date is in the past
            if (endDate < now) return;

            absences.push({
                start: formatISOToGermanDate(startInput.value),
                end: formatISOToGermanDate(endInput.value),
                announcement: announcementInput.value ? formatISOToGermanDate(announcementInput.value) : null,
                planned: plannedCheckbox.checked
            });
        }
    });

    // Sort absences by start date
    absences.sort((a, b) => {
        const dateA = parseGermanDate(a.start);
        const dateB = parseGermanDate(b.start);
        return dateA - dateB;
    });

    // Create updated employee data
    const updatedEmployee = {
        name: name,
        username: username,
        patients: patients,
        absences: absences.length > 0 ? absences : undefined,
        rights: rights,
        passwordHash: oldEmployee.passwordHash,
        needsToChangePassword: oldEmployee.needsToChangePassword,
    };

    // If password is set, hash it
    if (password && password.length > 0) {
        updatedEmployee.passwordHash = await hashPassword(password);
        document.getElementById('editEmployeePassword').value = '';
    }

    // If password checkbox is checked, set needsToChangePassword to true
    if (passwordCheckbox) {
        updatedEmployee.needsToChangePassword = true;
    }

    // If key changed, create new entry and delete old one
    if (oldKey !== newKey) {
        // Check if new key already exists
        if (window['employees'][newKey] && oldKey !== newKey) {
            alert('Ein:e Mitarbeiter:in mit diesem Kürzel existiert bereits.');
            return;
        }
        // Create new entry and delete old one
        window['employees'][newKey] = updatedEmployee;
        if (oldKey !== newKey) {
            delete window['employees'][oldKey];
        }
        currentEmployeeKey = newKey;
    } else {
        // Just update the existing entry
        window['employees'][oldKey] = updatedEmployee;
    }

    checkData();
    fillEmployeesTable();
    bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal')).hide();
}

function fillEmployeesTable() {
    const tbody = document.getElementById('employeesTableBody');
    tbody.innerHTML = '';

    for (let empKey in window['employees']) {
        const employee = window['employees'][empKey];
        const row = document.createElement('tr');

        // Name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = employee.name;
        row.appendChild(nameCell);

        // Key cell
        const keyCell = document.createElement('td');
        keyCell.textContent = empKey;
        row.appendChild(keyCell);

        // Patients cell
        const patientsCell = document.createElement('td');
        patientsCell.classList.add('text-center');
        if (employee.patients >= 0)
            patientsCell.textContent = employee.patients;
        else
            patientsCell.textContent = "/";
        row.appendChild(patientsCell);

        // Absences cell
        const absencesCell = document.createElement('td');
        if (employee.absences) {
            // Convert single absence to array if needed
            const absencesArray = Array.isArray(employee.absences) ? employee.absences : [employee.absences];

            absencesArray.forEach(absence => {
                const badge = document.createElement('span');
                const startDate = parseGermanDate(absence.start);
                const now = new Date();
                const oneMonthFromNow = new Date(now);
                oneMonthFromNow.setMonth(now.getMonth() + 1);

                let badgeClass;
                if (absence.planned) {
                    badgeClass = 'bg-success';
                } else if (absence.announcement) {
                    badgeClass = 'bg-warning';
                } else if (startDate > oneMonthFromNow) {
                    badgeClass = 'bg-secondary';
                } else {
                    badgeClass = 'bg-danger';
                }
                
                badge.className = `badge ${badgeClass} me-1`;
                badge.textContent = formatAbsenceDates(absence.start, absence.end);
                absencesCell.appendChild(badge);
            });
        }
        row.appendChild(absencesCell);

        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.className = 'text-end';
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-outline-primary hidden editEmployeeButton';
        editButton.innerHTML = '<i class="bi bi-pencil text-primary"></i>';
        editButton.onclick = () => editEmployee(empKey);
        actionsCell.appendChild(editButton);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    }
    
    showIfAuthorized('#addEmployeeButton', 'editEmployees');
    showIfAuthorized('.editEmployeeButton', 'editEmployees');
}

function deleteEmployee() {
    if (confirm('Möchten Sie diese:n Mitarbeiter:in wirklich löschen?')) {
        delete window['employees'][currentEmployeeKey];
        checkData();
        fillEmployeesTable();
        bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal')).hide();
    }
}

function fillAbsencesTable(numRows = 20) {
    const tbody = document.getElementById('absences-table');
    const template = document.getElementById('absence-row');

    // Get absences and take first 5
    const displayAbsences = getEmployeeAbsences().slice(0, numRows);

    // Clear existing rows except template
    Array.from(tbody.children).forEach(child => {
        if (child !== template) child.remove();
    });

    // Fill table
    displayAbsences.forEach(absence => {
        const row = template.cloneNode(true);
        row.classList.remove('d-none');
        row.removeAttribute('id');

        // Add italic style for non-current absences
        if (!absence.isCurrent) {
            row.classList.add('fst-italic');
        }

        // Format and fill data
        const displayData = formatAbsenceForDisplay(absence);
        row.querySelector('.data-name').textContent = displayData.name;
        row.querySelector('.data-start').textContent = displayData.start;
        row.querySelector('.data-end').textContent = displayData.end;
        row.querySelector('.data-duration').textContent = displayData.duration;
        row.querySelector('.data-week').textContent = displayData.week;
        row.querySelector('.data-announcement').textContent = displayData.announcement;

        tbody.appendChild(row);
    });
}
