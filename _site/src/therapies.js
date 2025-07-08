// Fill the therapy assignments table
function fillTherapyTable() {
    let patientCounter = 1;
    let newCount = 0;
    let group1Count = 0;
    let group2Count = 0;
    let group3Count = 0;
    let groupACount = 0;
    let groupBCount = 0;

    // Therapy counts
    const therapyCounts = {
        at: 0,
        pmr: 0,
        haltungsschule: 0,
        asst: 0,
        skt: 0,
        biographiearbeit: 0,
        group_a: 0,
        group_b: 0,
        total: 0
    };

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
        row.style.cursor = 'pointer';
        row.onclick = () => editTherapies(patient.id);

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
        const admissionDate = patient.admission;
        tdWeek.textContent = calculatePatientWeek(admissionDate, now);
        row.appendChild(tdWeek);

        // Column 1: Current Employee
        const tdEmployee = document.createElement('td');
        tdEmployee.textContent = getCurrentEmployee(patient);
        tdEmployee.className = 'bg-light';
        row.appendChild(tdEmployee);

        // Column 2: Group number
        const tdGroup = document.createElement('td');
        tdGroup.textContent = patient.group ? patient.group.charAt(0) : '';
        row.appendChild(tdGroup);

        // Column 3: Group letter
        const tdGroupLetter = document.createElement('td');
        if (patient.group.charAt(2) == 'A')
            tdGroupLetter.className = 'border-end-3 bg-secondary-striped';
        else
            tdGroupLetter.className = 'border-end-3 bg-light';
        tdGroupLetter.textContent = patient.group ? patient.group.charAt(2) || '' : '';
        row.appendChild(tdGroupLetter);

        // Get therapy data
        const therapyData = window['therapies-station'][patient.id] || {};

        // Standard therapies
        const standardTherapies = ['at', 'pmr', 'haltungsschule', 'asst', 'skt', 'biographiearbeit'];
        standardTherapies.forEach((therapy, index) => {
            const td = document.createElement('td');
            const classes = [];

            // Add border class
            if (index === 1 || index === 2 || index === 5) {
                classes.push('border-end-3');
            }

            // Add bg-light to odd-numbered columns (PMR, ASST, Biographiearbeit)
            if (index === 1 || index === 3 || index === 5) {
                classes.push('bg-light');
            }

            if (classes.length > 0) {
                td.className = classes.join(' ');
            }

            // Display therapy status
            td.textContent = therapyData[therapy] || '';
            row.appendChild(td);
        });

        // Column 10: Kreativ-Einzel
        const tdKreativ = document.createElement('td');
        tdKreativ.className = 'border-end-3';
        const smallKreativ = document.createElement('small');
        smallKreativ.textContent = therapyData.kreativ_einzel || '';
        tdKreativ.appendChild(smallKreativ);
        tdKreativ.style.cursor = 'pointer';
        tdKreativ.onclick = () => editTherapies(patient.id);
        row.appendChild(tdKreativ);

        // Column 11: Einzel-Physiotherapie
        const tdPhysio = document.createElement('td');
        tdPhysio.className = 'border-end-3 bg-light';
        const smallPhysio = document.createElement('small');
        smallPhysio.textContent = therapyData.einzel_physio || '';
        tdPhysio.appendChild(smallPhysio);
        tdPhysio.style.cursor = 'pointer';
        tdPhysio.onclick = () => editTherapies(patient.id);
        row.appendChild(tdPhysio);

        // Column 12: Discharge date
        const tdDischarge = document.createElement('td');
        tdDischarge.textContent = patient.discharge || '';
        row.appendChild(tdDischarge);

        return row;
    }

    // Helper to count therapies for a patient
    function countPatientTherapies(patient) {
        const therapyData = window['therapies-station'][patient.id] || {};

        // Count standard therapies
        ['at', 'pmr', 'haltungsschule', 'asst', 'skt', 'biographiearbeit'].forEach(therapy => {
            if (therapyData[therapy] === 'X') {
                therapyCounts[therapy]++;
            }
        });
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
        countPatientTherapies(patient);
    });

    // Then process existing patients
    
    existingPatients.sort((a, b) => (a.group || '').localeCompare(b.group || ''));
    existingPatients.forEach(patient => {
        if (patient.group) {
            const row = createPatientRow(patient);
            row.firstChild.textContent = patientCounter++;
            const groupNum = patient.group.charAt(0);
            const groupLetter = patient.group.charAt(2);

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

            if (groupLetter == 'A')
                groupACount++;
            else if (groupLetter == 'B')
                groupBCount++;

            countPatientTherapies(patient);
        }
    });

    // Add dividers back except for last section
    [newSection, group1Section, group2Section, group3Section].forEach(section => {
        const divider = document.createElement('tr');
        divider.className = 'no-hover';
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
        'group3-count': group3Count,
        'group-a-count': groupACount,
        'group-b-count': groupBCount
    };

    Object.entries(counts).forEach(([id, count]) => {
        const countCell = document.getElementById(id);
        if (countCell) countCell.textContent = count;
    });

    // Update therapy counts in footer
    document.getElementById('num-at').textContent = therapyCounts.at;
    document.getElementById('num-pmr').textContent = therapyCounts.pmr;
    document.getElementById('num-haltungsschule').textContent = therapyCounts.haltungsschule;
    document.getElementById('num-asst').textContent = therapyCounts.asst;
    document.getElementById('num-skt').textContent = therapyCounts.skt;
    document.getElementById('num-biographiearbeit').textContent = therapyCounts.biographiearbeit;
    document.getElementById('num-group-a').textContent = groupACount;
    document.getElementById('num-group-b').textContent = groupBCount;
    document.getElementById('num-total').textContent = groupACount + groupBCount;

    // Calculate and update free slots
    document.getElementById('free-at').textContent = document.getElementById('maxNum-at').textContent - therapyCounts.at;
    document.getElementById('free-pmr').textContent = document.getElementById('maxNum-pmr').textContent - therapyCounts.pmr;
    document.getElementById('free-haltungsschule').textContent = document.getElementById('maxNum-haltungsschule').textContent - therapyCounts.haltungsschule;
    document.getElementById('free-asst').textContent = document.getElementById('maxNum-asst').textContent - therapyCounts.asst;
    document.getElementById('free-skt').textContent = document.getElementById('maxNum-skt').textContent - therapyCounts.skt;
    document.getElementById('free-biographiearbeit').textContent = document.getElementById('maxNum-biographiearbeit').textContent - therapyCounts.biographiearbeit;
}