// Fill the therapy assignments table
function fillTherapyTable() {
    let newCounter = 1;
    let group1Counter = 1;
    let group2Counter = 1;
    let group3Counter = 1;

    const now = new Date();
    const currentWeek = getCalendarWeek(now);
    const currentYear = now.getFullYear();

    // Get all current patients
    const currentPatients = filterPatients().current;

    // Helper to get current employee assignment
    function getCurrentEmployee(patient) {
        if (!patient.employees) return '';
        const currentAssignment = patient.employees.find(assignment => {
            const start = parseGermanDate(assignment.start);
            const end = assignment.end ? parseGermanDate(assignment.end) : new Date(2099, 11, 31);
            return now >= start && now <= end;
        });
        return currentAssignment ? currentAssignment.employee : '';
    }

    // Helper to create a table row for a patient
    function createPatientRow(patient) {
        const row = document.createElement('tr');
        
        // Counter (will be set later)
        const tdCounter = document.createElement('td');
        tdCounter.textContent = '';
        row.appendChild(tdCounter);
        
        // Name
        const tdName = document.createElement('td');
        tdName.textContent = patient.name;
        row.appendChild(tdName);
        
        // Week
        const tdWeek = document.createElement('td');
        tdWeek.className = 'border-end-3';
        const admissionDate = parseGermanDate(patient.admission);
        const weeksSinceAdmission = Math.floor((now - admissionDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
        tdWeek.textContent = weeksSinceAdmission;
        row.appendChild(tdWeek);
        
        // Current Employee
        const tdEmployee = document.createElement('td');
        tdEmployee.textContent = getCurrentEmployee(patient);
        row.appendChild(tdEmployee);
        
        // Group number
        const tdGroup = document.createElement('td');
        tdGroup.textContent = patient.group ? patient.group.charAt(0) : '';
        row.appendChild(tdGroup);
        
        // Group letter
        const tdGroupLetter = document.createElement('td');
        tdGroupLetter.className = 'border-end-3';
        tdGroupLetter.textContent = patient.group ? patient.group.charAt(2) || '' : '';
        row.appendChild(tdGroupLetter);
        
        // Get therapy data
        const therapyData = therapies[patient.id] || {};
        
        // Standard therapies (X if true/1)
        const standardTherapies = ['at', 'pmr', 'haltungsschule', 'asst', 'skt', 'biographiearbeit'];
        standardTherapies.forEach((therapy, index) => {
            const td = document.createElement('td');
            if (index === 1 || index === 2 || index === 5) td.className = 'border-end-3';
            td.textContent = therapyData[therapy] ? 'X' : '';
            row.appendChild(td);
        });
        
        // Special therapies (show content if set)
        const tdKreativ = document.createElement('td');
        tdKreativ.className = 'border-end-3';
        tdKreativ.textContent = therapyData.kreativ_einzel || '';
        row.appendChild(tdKreativ);
        
        const tdPhysio = document.createElement('td');
        tdPhysio.className = 'border-end-3';
        tdPhysio.textContent = therapyData.einzel_physio || '';
        row.appendChild(tdPhysio);
        
        // Discharge date
        const tdDischarge = document.createElement('td');
        tdDischarge.textContent = patient.discharge || '';
        row.appendChild(tdDischarge);
        
        return row;
    }

    // Get sections
    const newSection = document.getElementById('new-patients');
    const group1Section = document.getElementById('group1-patients');
    const group2Section = document.getElementById('group2-patients');
    const group3Section = document.getElementById('group3-patients');

    // Clear existing rows except headers
    [newSection, group1Section, group2Section, group3Section].forEach(section => {
        const header = section.querySelector('.table-secondary');
        const rows = Array.from(section.children);
        section.innerHTML = '';
        if (header) section.appendChild(header);
    });

    // Sort and distribute patients
    Object.entries(currentPatients).forEach(([id, patient]) => {
        patient.id = id; // Add id to patient object for therapy lookup
        const admissionDate = parseGermanDate(patient.admission);
        const admissionWeek = getCalendarWeek(admissionDate);
        const row = createPatientRow(patient);

        if (admissionWeek === currentWeek && admissionDate.getFullYear() === currentYear) {
            row.firstChild.textContent = newCounter++;
            newSection.appendChild(row);
        } else if (patient.group) {
            const groupNum = patient.group.charAt(0);
            switch (groupNum) {
                case '1':
                    row.firstChild.textContent = group1Counter++;
                    group1Section.appendChild(row);
                    break;
                case '2':
                    row.firstChild.textContent = group2Counter++;
                    group2Section.appendChild(row);
                    break;
                case '3':
                    row.firstChild.textContent = group3Counter++;
                    group3Section.appendChild(row);
                    break;
            }
        }
    });

    // Add dividers back except for last section
    [newSection, group1Section, group2Section].forEach(section => {
        const divider = document.createElement('tr');
        divider.height = 10;
        const td = document.createElement('td');
        td.colSpan = 15;
        divider.appendChild(td);
        section.appendChild(divider);
    });

    // Update counters in headers
    const counts = {
        'new-count': newCounter - 1,
        'group1-count': group1Counter - 1,
        'group2-count': group2Counter - 1,
        'group3-count': group3Counter - 1
    };

    Object.entries(counts).forEach(([id, count]) => {
        const countCell = document.getElementById(id);
        if (countCell) countCell.textContent = count;
    });
}