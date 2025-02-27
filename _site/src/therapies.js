// Fill the therapy assignments table
function fillTherapyTable() {
    let patientCounter = 1;
    let newCount = 0;
    let group1Count = 0;
    let group2Count = 0;
    let group3Count = 0;

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
        row.className = 'text-center';
        
        // Counter (will be set later)
        const tdCounter = document.createElement('td');
        tdCounter.textContent = '';
        row.appendChild(tdCounter);
        
        // Name
        const tdName = document.createElement('td');
        tdName.textContent = patient.name;
        tdName.className = 'text-start';
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

    // Sort patients into new and existing
    const newPatients = [];
    const existingPatients = [];
    
    Object.entries(currentPatients).forEach(([id, patient]) => {
        patient.id = id;
        const admissionDate = parseGermanDate(patient.admission);
        const admissionWeek = getCalendarWeek(admissionDate);
        
        if (admissionWeek === currentWeek && admissionDate.getFullYear() === currentYear) {
            newPatients.push(patient);
        } else {
            existingPatients.push(patient);
        }
    });

    // Process new patients first
    newPatients.forEach(patient => {
        const row = createPatientRow(patient);
        row.firstChild.textContent = patientCounter++;
        newSection.appendChild(row);
        newCount++;
    });

    // Then process existing patients
    existingPatients.forEach(patient => {
        if (patient.group) {
            const row = createPatientRow(patient);
            row.firstChild.textContent = patientCounter++;
            const groupNum = patient.group.charAt(0);
            
            switch (groupNum) {
                case '1':
                    group1Section.appendChild(row);
                    group1Count++;
                    break;
                case '2':
                    group2Section.appendChild(row);
                    group2Count++;
                    break;
                case '3':
                    group3Section.appendChild(row);
                    group3Count++;
                    break;
            }
        }
    });

    // Add dividers back except for last section
    [newSection, group1Section, group2Section, group3Section].forEach(section => {
        const divider = document.createElement('tr');
        const td = document.createElement('td');
        td.height = 10;
        td.colSpan = 15;
        divider.appendChild(td);
        section.appendChild(divider);
    });

    // Update counters in headers
    const counts = {
        'new-count': newCount,
        'group1-count': group1Count,
        'group2-count': group2Count,
        'group3-count': group3Count
    };

    Object.entries(counts).forEach(([id, count]) => {
        const countCell = document.getElementById(id);
        if (countCell) countCell.textContent = count;
    });
}