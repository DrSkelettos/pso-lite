function formatAbsenceDates(start, end) {
    const [startDay, startMonth, startYear] = start.split('.');
    const [endDay, endMonth, endYear] = end.split('.');
    const currentYear = new Date().getFullYear().toString();

    // If either year is not current year, show full dates
    if (startYear !== currentYear || endYear !== currentYear) {
        return `${start}-${end}`;
    }

    // Both dates are in current year, hide year
    if (startMonth === endMonth) {
        return `${startDay}.-${endDay}.${startMonth}.`;
    }
    return `${startDay}.${startMonth}.-${endDay}.${endMonth}.`;
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
        addAbsenceEntry(employee.absences.start, employee.absences.end);
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editEmployeeModal'));
    modal.show();
}

function addAbsenceEntry(start = '', end = '') {
    const absencesList = document.getElementById('absencesList');
    const absenceDiv = document.createElement('div');
    absenceDiv.className = 'absence-entry d-flex gap-2 align-items-center mb-2';
    absenceDiv.innerHTML = `
        <input type="date" class="form-control absence-start" value="${start ? formatGermanToISODate(start) : ''}" required>
        <span>-</span>
        <input type="date" class="form-control absence-end" value="${end ? formatGermanToISODate(end) : ''}" required>
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="this.parentElement.remove()">
            <i class="bi bi-trash"></i>
        </button>
    `;
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
        const firstEntry = absenceEntries[0];
        const start = firstEntry.querySelector('.absence-start').value;
        const end = firstEntry.querySelector('.absence-end').value;
        
        if (start && end) {
            employees[empKey].absences = {
                start: formatISOToGermanDate(start),
                end: formatISOToGermanDate(end)
            };
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
            const now = new Date();
            const [absStartDay, absStartMonth, absStartYear] = employee.absences.start.split('.');
            const absStart = new Date(absStartYear, absStartMonth - 1, absStartDay);
            
            const [absEndDay, absEndMonth, absEndYear] = employee.absences.end.split('.');
            const absEnd = new Date(absEndYear, absEndMonth - 1, absEndDay);

            if (absEnd >= now) {
                const badge = document.createElement('span');
                badge.className = 'badge bg-warning text-dark';
                badge.textContent = formatAbsenceDates(employee.absences.start, employee.absences.end);
                absencesCell.appendChild(badge);
            }
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
