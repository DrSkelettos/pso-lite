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
    const thead = tbody.parentElement.querySelector('thead');
    
    // Get current date and week
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getCalendarWeek(now);
    
    // Create array of weeks first
    const weeks = [];
    for (let i = 0; i <= 12; i++) {
        const week = currentWeek + i;
        weeks.push(week);
    }
    
    // Clear existing headers except first column
    const firstHeader = thead.rows[0].cells[0];
    thead.rows[0].innerHTML = '';
    thead.rows[0].appendChild(firstHeader);
    
    // Add headers
    weeks.forEach(week => {
        const th = document.createElement('th');
        th.className = 'text-center border-bottom-3';
        th.textContent = `KW${week}`;
        thead.rows[0].appendChild(th);
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

// Count patients assigned to employee for a specific date
function countPatientsForEmployee(employee, date) {
    const patients = getPatientsForDate(date);
    let count = 0;
    
    patients.forEach(patient => {
        if (patient.employees) {
            const isAssigned = patient.employees.some(assignment => 
                assignment.employee === employee &&
                (!assignment.end || parseGermanDate(assignment.end) >= date) &&
                parseGermanDate(assignment.start) <= date
            );
            if (isAssigned) count++;
        }
    });
    
    return count;
}

// Check if employee is absent for more than 2 days in a week
function isEmployeeAbsentMajority(employeeId, weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    let absenceDays = 0;
    const employeeData = employees[employeeId];
    
    if (employeeData && employeeData.absences) {
        employeeData.absences.forEach(absence => {
            const startDate = parseGermanDate(absence.start);
            const endDate = absence.end ? parseGermanDate(absence.end) : startDate;
            
            // Count overlapping days
            for (let day = new Date(weekStart); day <= weekEnd; day.setDate(day.getDate() + 1)) {
                if (day >= startDate && day <= endDate) {
                    absenceDays++;
                }
            }
        });
    }

    return absenceDays > 2;
}

// Fill the employee workload table
function fillEmployeeWorkloadTable() {
    const tbody = document.getElementById('employeeWorkloadTableBody');
    const thead = tbody.parentElement.querySelector('thead');
    
    // Get current date and week
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getCalendarWeek(now);
    
    // Create array of weeks
    const weeks = [];
    for (let i = 0; i <= 12; i++) {
        const week = currentWeek + i;
        weeks.push(week);
    }
    
    // Clear existing headers except first column
    const firstHeader = thead.rows[0].cells[0];
    thead.rows[0].innerHTML = '';
    thead.rows[0].appendChild(firstHeader);
    
    // Add headers
    weeks.forEach(week => {
        const th = document.createElement('th');
        th.className = 'text-center border-bottom-3';
        th.textContent = `KW${week}`;
        thead.rows[0].appendChild(th);
    });
    
    // Clear existing rows
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // Create rows for each employee
    Object.entries(employees)
        .filter(([_, employee]) => !employee.inactive) // Only show active employees
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([shortname, employee]) => {
            const row = document.createElement('tr');
            const th = document.createElement('th');
            th.className = 'text-nowrap border-end-3';
            th.style.position = 'sticky';
            th.style.left = '0';
            th.style.zIndex = '1';
            th.textContent = shortname;
            row.appendChild(th);
            
            // Fill counts for each week
            weeks.forEach(week => {
                const thursday = getThursdayOfWeek(currentYear, week);
                const mondayOfWeek = new Date(thursday);
                mondayOfWeek.setDate(thursday.getDate() - 3); // Go back to Monday
                
                const count = countPatientsForEmployee(shortname, thursday);
                const isAbsent = isEmployeeAbsentMajority(shortname, mondayOfWeek);
                
                const td = document.createElement('td');
                td.className = 'text-center';
                if (isAbsent) {
                    td.classList.add('bg-secondary', 'text-white');
                }
                td.textContent = count;
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
}

// Update both tables
document.addEventListener('DOMContentLoaded', function() {
    fillGroupWorkloadTable();
    fillEmployeeWorkloadTable();
});