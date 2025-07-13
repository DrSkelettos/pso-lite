// Helper function to get Thursday of a given week
function getThursdayOfWeek(year, week) {
    // Get first day of year
    const firstDayOfYear = new Date(year, 0, 1);
    
    // Find Thursday of first week
    const firstThursday = new Date(year, 0, 1 + ((4 - firstDayOfYear.getDay() + 7) % 7));
    
    // Get Thursday of desired week
    const thursday = new Date(firstThursday);
    thursday.setDate(firstThursday.getDate() + (week - 1) * 7);
    
    // Ensure it's actually a Thursday (day 4)
    if (thursday.getDay() !== 4) {
        console.warn('Calculated day is not a Thursday:', thursday.toDateString());
        // Adjust to the nearest Thursday
        thursday.setDate(thursday.getDate() + (4 - thursday.getDay() + 7) % 7);
    }
    
    return thursday;
}

// Helper function to get Monday of a week
function getMondayOfWeek(year, week) {
    const thursday = getThursdayOfWeek(year, week);
    const monday = new Date(thursday);
    monday.setDate(thursday.getDate() - 3);
    return monday;
}

// Helper function to format date as DD.MM.
function formatShortDate(date) {
    return date.getDate().toString().padStart(2, '0') + '.' + 
           (date.getMonth() + 1).toString().padStart(2, '0') + '.';
}

// Helper function to get week date range
function getWeekDateRange(year, week) {
    const monday = getMondayOfWeek(year, week);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return formatShortDate(monday) + '-' + formatShortDate(friday);
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
    
    // Calculate the start and end of the week containing the given date
    const mondayOfWeek = new Date(date);
    mondayOfWeek.setDate(date.getDate() - (date.getDay() || 7) + 1); // Get Monday of the week
    const sundayOfWeek = new Date(mondayOfWeek);
    sundayOfWeek.setDate(mondayOfWeek.getDate() + 6); // Get Sunday of the week
    
    const { current, planned } = filterPatients();
    const allPatients = { ...current, ...planned };
    
    Object.entries(allPatients).forEach(([id, patient]) => {
        const admissionDate = parseGermanDate(patient.admission);
        const dischargeDate = patient.discharge ? parseGermanDate(patient.discharge) : null;
        
        // Check if patient is active in the given week:
        // 1. Admitted in the week or before the week
        // 2. AND discharged after the week (not in the week) or not discharged
        if (admissionDate <= sundayOfWeek && 
            (!dischargeDate || dischargeDate > sundayOfWeek)) {
            patients.push(patient);
        }
    });
    
    return patients;
}

// Count patients by group for a specific date
function countPatientsByGroup(date) {
    const patients = getPatientsForDate(date);
    const counts = {
        '1': { count: 0, patients: [], female: 0, male: 0 },
        '2': { count: 0, patients: [], female: 0, male: 0 },
        '3': { count: 0, patients: [], female: 0, male: 0 },
        'A': { count: 0, patients: [], female: 0, male: 0 },
        'B': { count: 0, patients: [], female: 0, male: 0 }
    };
    
    patients.forEach(patient => {
        if (!patient.group) return;
        
        const { numeric, letter } = parseGroup(patient.group);
        const isFemale = patient.name.startsWith('Fr');
        const isMale = patient.name.startsWith('Hr');
        
        if (numeric) {
            counts[numeric.toString()].count++;
            counts[numeric.toString()].patients.push(patient.name);
            if (isFemale) counts[numeric.toString()].female++;
            if (isMale) counts[numeric.toString()].male++;
        }
        if (letter) {
            counts[letter].count++;
            counts[letter].patients.push(patient.name);
            if (isFemale) counts[letter].female++;
            if (isMale) counts[letter].male++;
        }
    });
    
    return counts;
}

// Count patients assigned to employee for a specific date
function countPatientsForEmployee(employee, date) {
    const patients = getPatientsForDate(date);
    let count = 0;
    const assignedPatients = [];
    
    patients.forEach(patient => {
        if (patient.employees) {
            const isAssigned = patient.employees.some(assignment => 
                assignment.employee === employee &&
                (!assignment.end || parseGermanDate(assignment.end) >= date) &&
                parseGermanDate(assignment.start) <= date
            );
            if (isAssigned) {
                count++;
                assignedPatients.push(patient.name);
            }
        }
    });
    
    return { count, patients: assignedPatients };
}

// Check if employee is absent for more than 2 days in a week
function isEmployeeAbsentMajority(employeeId, weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    let absenceDays = 0;
    const employeeData = window['employees'][employeeId];
    
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

    return absenceDays >= 3;
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
        th.innerHTML = `KW${week}<br><small class='fw-normal'>${getWeekDateRange(currentYear, week)}</small>`;
        thead.rows[0].appendChild(th);
    });
    
    // Define groups to display
    const groups = [
        { id: '1', name: 'Gruppe 1', maxPatients: 8 },
        { id: '2', name: 'Gruppe 2', maxPatients: 8 },
        { id: '3', name: 'Gruppe 3', maxPatients: 8 },
        { id: 'A', name: 'Gruppentherapie A', maxPatients: 12 },
        { id: 'B', name: 'Gruppentherapie B', maxPatients: 12 }
    ];
    
    // Clear existing rows
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // Create rows for each group
    groups.forEach((group, index) => {
        const row = document.createElement('tr');
        // Add border-bottom-3 after Gruppentherapie B
        if (group.name === 'Gruppentherapie B' || group.name === 'Gruppe 3') {
            row.className = 'border-bottom-3';
        }
        
        const th = document.createElement('th');
        th.className = 'text-nowrap border-end-3';
        th.style.position = 'sticky';
        th.style.left = '0';
        th.style.zIndex = '1';
        
        // Add group name and max patients
        const nameSpan = document.createElement('span');
        nameSpan.textContent = group.name;
        th.appendChild(nameSpan);
        
        const maxPatientsSpan = document.createElement('small');
        maxPatientsSpan.className = 'float-end text-muted fw-normal';
        maxPatientsSpan.textContent = group.maxPatients + " P.";
        th.appendChild(maxPatientsSpan);
        
        row.appendChild(th);
        
        // Fill counts for each week
        weeks.forEach(week => {
            const thursday = getThursdayOfWeek(currentYear, week);
            const counts = countPatientsByGroup(thursday);
            const countData = counts[group.id] || { count: 0, patients: [] };
            
            const td = document.createElement('td');
            td.className = 'text-center';
            
            // Add warning/danger classes based on patient count
            if (countData.count > group.maxPatients) {
                td.classList.add('text-danger');
            } else if (countData.count === group.maxPatients) {
                td.classList.add('text-warning');
            } else if (countData.count < group.maxPatients * 0.8) {
                td.classList.add('text-success');
            }
            
            td.textContent = countData.count;
            if (countData.patients.length > 0) {
                const genderCounts = `W: ${countData.female} | M: ${countData.male}`;
                td.title = genderCounts + '\n' + countData.patients.sort().join('\n');
            }
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });

    // Add total row
    const totalRow = document.createElement('tr');
    const totalTh = document.createElement('th');
    totalTh.className = 'text-nowrap border-end-3';
    totalTh.style.position = 'sticky';
    totalTh.style.left = '0';
    totalTh.style.zIndex = '1';
    totalTh.textContent = 'Gesamt';
    totalRow.appendChild(totalTh);

    // Fill total counts for each week
    weeks.forEach(week => {
        const thursday = getThursdayOfWeek(currentYear, week);
        const counts = countPatientsByGroup(thursday);
        const totalCount = (counts['A']?.count || 0) + (counts['B']?.count || 0);
        
        const td = document.createElement('td');
        td.className = 'text-center fw-bold';
        td.textContent = totalCount;
        totalRow.appendChild(td);
    });
    
    tbody.appendChild(totalRow);
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
        th.innerHTML = `KW${week}<br><small class='fw-normal'>${getWeekDateRange(currentYear, week)}</small>`;
        thead.rows[0].appendChild(th);
    });
    
    // Clear existing rows
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // Create rows for each employee
    Object.entries(window['employees'] || {}).forEach(([shortname, employee]) => {
        // Skip employees without a patients value or with patients < 0
        if (typeof employee.patients !== 'number' || employee.patients < 0) return;

        const row = document.createElement('tr');
        const th = document.createElement('th');
        th.className = 'text-nowrap border-end-3';
        th.style.position = 'sticky';
        th.style.left = '0';
        th.style.zIndex = '1';
        
        // Add employee name and patient count
        const nameSpan = document.createElement('span');
        nameSpan.textContent = shortname;
        th.appendChild(nameSpan);
        
        const patientCountSpan = document.createElement('small');
        patientCountSpan.className = 'float-end text-muted fw-normal';
        patientCountSpan.textContent = (employee.patients || 0) + " P.";
        th.appendChild(patientCountSpan);
        
        row.appendChild(th);
        
        // Fill counts for each week
        weeks.forEach(week => {
            const thursday = getThursdayOfWeek(currentYear, week);
            const mondayOfWeek = new Date(thursday);
            mondayOfWeek.setDate(thursday.getDate() - 3); // Go back to Monday
            
            const countData = countPatientsForEmployee(shortname, thursday);
            
            const td = document.createElement('td');
            td.className = 'text-center';
            
            // Absence
            if (isEmployeeAbsentMajority(shortname, mondayOfWeek)) {
                td.classList.add('bg-secondary-striped');
            }

            // Add warning/danger classes based on patient count
            const maxPatients = employee.patients || 0;
            const warningThreshold = maxPatients < 6 ? maxPatients + 1 : maxPatients + 2;
            const dangerThreshold = warningThreshold + 1;
            
            if (countData.count >= dangerThreshold) {
                td.classList.add('text-danger');
            } else if (countData.count >= warningThreshold) {
                td.classList.add('text-warning');
            } else if (countData.count < maxPatients) {
                td.classList.add('text-success');
            }
            
            td.textContent = countData.count;
            if (countData.patients.length > 0) {
                td.title = countData.patients.sort().join('\n');
            }
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
}