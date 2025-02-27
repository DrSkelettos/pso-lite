// Helper function to get Thursday of a given week
function getThursdayOfWeek(year, week) {
    // Get first day of year
    const firstDayOfYear = new Date(year, 0, 1);
    
    // Find Thursday of first week
    const firstThursday = new Date(year, 0, 1 + ((4 - firstDayOfYear.getDay() + 7) % 7));
    
    // Get Thursday of desired week
    const thursday = new Date(firstThursday);
    thursday.setDate(firstThursday.getDate() + (week - 1) * 7);
    
    return thursday;
}

// Test getThursdayOfWeek function

// Helper function to split group string into numeric and letter parts
function parseGroup(groupStr) {
    if (!groupStr) return { numeric: null, letter: null };
    
    const match = groupStr.match(/^(\d+)(?:-([AB]))?$/);
    if (!match) return { numeric: null, letter: null };
    
    return {
        numeric: parseInt(match[1]),
        letter: match[2] || null
    };
}

// Get patients for a specific Thursday
function getPatientsForDate(date) {
    const patients = [];
    
    Object.entries(filterPatients().current).forEach(([id, patient]) => {
        const admissionDate = parseGermanDate(patient.admission);
        const dischargeDate = patient.discharge ? parseGermanDate(patient.discharge) : null;
        
        // Check if patient is present on the given date
        if (admissionDate <= date && (!dischargeDate || dischargeDate >= date)) {
            patients.push(patient);
        }
    });
    
    return patients;
}

// Count patients by group for a specific date
function countPatientsByGroup(date) {
    const patients = getPatientsForDate(date);
    const counts = {
        '1': 0,
        '2': 0,
        '3': 0,
        'A': 0,
        'B': 0
    };
    
    patients.forEach(patient => {
        if (!patient.group) return;
        
        const { numeric, letter } = parseGroup(patient.group);
        if (numeric) counts[numeric.toString()]++;
        if (letter) counts[letter]++;
    });
    
    return counts;
}

// Fill the workload table
function fillGroupWorkloadTable() {
    const tbody = document.getElementById('groupWorkloadTableBody');
    const headerTemplate = document.getElementById('week-header-template');
    const rowTemplate = document.getElementById('group-row-template');
    
    // Get current date and week
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getCalendarWeek(now);
    
    
    // Create array of weeks first
    const weeks = [];
    for (let i = 0; i <= 12; i++) {
        const week = currentWeek + i;
        weeks.push(week);
        const thursday = getThursdayOfWeek(currentYear, week);
    }
    
    const thead = headerTemplate.parentElement;
    // Clear existing headers except template
    while (thead.children.length > 1) {
        thead.removeChild(thead.lastChild);
    }
    
    // Add headers
    weeks.forEach(week => {
        const th = document.createElement('th');
        th.className = 'text-center border-bottom-3';
        th.textContent = `KW${week}`;
        thead.appendChild(th);
    });
    
    // Define groups to display
    const groups = [
        { id: '1', name: 'Gruppe 1' },
        { id: '2', name: 'Gruppe 2' },
        { id: '3', name: 'Gruppe 3' },
        { id: 'A', name: 'Gruppentherapie A' },
        { id: 'B', name: 'Gruppentherapie B' }
    ];
    
    // Clear existing rows
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // Create rows for each group
    groups.forEach((group, index) => {
        const row = document.createElement('tr');
        // Add border-bottom-3 after Gruppe 3
        if (group.name === 'Gruppe 3') {
            row.className = 'border-bottom-3';
        }
        
        const th = document.createElement('th');
        th.className = 'text-nowrap border-end-3';
        th.style.position = 'sticky';
        th.style.left = '0';
        th.style.zIndex = '1';
        th.textContent = group.name;
        row.appendChild(th);
        
        // Fill counts for each week
        weeks.forEach(week => {
            const thursday = getThursdayOfWeek(currentYear, week);
            const counts = countPatientsByGroup(thursday);
            
            const td = document.createElement('td');
            td.className = 'text-center';
            td.textContent = counts[group.id];
            row.appendChild(td);
            
        });
        
        tbody.appendChild(row);
    });
}