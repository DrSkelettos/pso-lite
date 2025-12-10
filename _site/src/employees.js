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
    document.getElementById('editEmployeeRightsViewRoundsStation').checked = employee.rights?.viewRoundsStation || false;
    document.getElementById('editEmployeeRightsEditRoundsStation').checked = employee.rights?.editRoundsStation || false;
    document.getElementById('editEmployeeRightsKosiStation').checked = employee.rights?.kosiStation || false;
    document.getElementById('editEmployeeRightsWorkloadStation').checked = employee.rights?.workloadStation || false;
    document.getElementById('editEmployeeRightsEditEvents').checked = employee.rights?.editEvents || false;
    document.getElementById('editEmployeeRightsEditEmployees').checked = employee.rights?.editEmployees || false;
    document.getElementById('editEmployeeRightsViewAnnouncementsStation').checked = employee.rights?.viewAnnouncementsStation || false;
    document.getElementById('editEmployeeRightsEditOwnAnnouncementsStation').checked = employee.rights?.editOwnAnnouncementsStation || false;
    document.getElementById('editEmployeeRightsEditAllAnnouncementsStation').checked = employee.rights?.editAllAnnouncementsStation || false;
    document.getElementById('editEmployeeRightsEditTherapyplanStation').checked = employee.rights?.editTherapyplanStation || false;

    // Set therapy plan dropdown
    populateTherapyPlanDropdown(empKey);

    // Set announcement texts
    document.getElementById('editEmployeeAnnouncementTextShort').value = employee.announcementTextShort || '';
    document.getElementById('editEmployeeAnnouncementTextLong').value = employee.announcementTextLong || '';

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
            const announcementInput = absenceDiv.querySelector('.absence-announcement');
            const updateAnnouncementDate = function() {
                if (startInput.value && endInput.value && typeof calculateAnnouncementDate === 'function') {
                    const startDate = new Date(startInput.value);
                    const endDate = new Date(endInput.value);
                    const suggestedDate = calculateAnnouncementDate(startDate, endDate);
                    announcementInput.value = suggestedDate.toISOString().split('T')[0];
                }
            };

            startInput.addEventListener('change', function () {
                if (!endInput.value) {
                    // Parse the date and ensure we use the correct year
                    const date = new Date(this.value);
                    if (date.getFullYear() < 2024) {  // If year is too old
                        date.setFullYear(new Date().getFullYear());  // Set to current year
                    }
                    endInput.value = date.toISOString().split('T')[0];
                }
                // Update announcement date if not already set
                if (!announcementInput.value) {
                    updateAnnouncementDate();
                }
            });

            endInput.addEventListener('change', function () {
                // Update announcement date if not already set
                if (!announcementInput.value) {
                    updateAnnouncementDate();
                }
            });

            if (absence.announcement) {
                absenceDiv.querySelector('.absence-announcement').value = formatGermanToISODate(absence.announcement);
            }
            checkbox.checked = absence.planned || false;

            // Handle V-Plan checkbox
            const therapyPlanCheckbox = absenceDiv.querySelector('.absence-therapy-plan');
            const therapyPlanUniqueId = `absence-therapy-plan-${currentEmployeeKey}-${index}`;
            therapyPlanCheckbox.id = therapyPlanUniqueId;
            absenceDiv.querySelector('.absence-therapy-plan-col .form-check-label').setAttribute('for', therapyPlanUniqueId);
            therapyPlanCheckbox.checked = absence.useTherapyPlan || false;

            const deleteButton = absenceDiv.querySelector('.btn-outline-danger');
            deleteButton.onclick = function () { this.closest('.list-group-item').remove(); };

            absencesList.appendChild(absenceDiv);
        });
    }

    // Update V-Plan checkbox visibility based on employee's therapy plan
    const empPlanKey = getEmployeeTherapyPlan(empKey);
    updateTherapyPlanCheckboxVisibility(empPlanKey !== null);

    const modal = new bootstrap.Modal(document.getElementById('editEmployeeModal'));
    modal.show();
}

function addAbsenceEntry() {
    const template = document.getElementById('absenceTemplate');
    const absenceDiv = template.content.cloneNode(true).querySelector('.list-group-item');

    // Generate unique ID for the planned checkbox
    const uniqueId = 'absence-planned-' + Date.now();
    const checkbox = absenceDiv.querySelector('.absence-planned');
    const label = absenceDiv.querySelector('.form-check-label');
    checkbox.id = uniqueId;
    label.setAttribute('for', uniqueId);

    // Generate unique ID for the V-Plan checkbox
    const therapyPlanUniqueId = 'absence-therapy-plan-' + Date.now();
    const therapyPlanCheckbox = absenceDiv.querySelector('.absence-therapy-plan');
    const therapyPlanLabel = absenceDiv.querySelector('.absence-therapy-plan-col .form-check-label');
    therapyPlanCheckbox.id = therapyPlanUniqueId;
    therapyPlanLabel.setAttribute('for', therapyPlanUniqueId);

    // Show V-Plan checkbox if employee has a therapy plan
    const empPlanKey = getEmployeeTherapyPlan(currentEmployeeKey);
    if (empPlanKey) {
        absenceDiv.querySelector('.absence-therapy-plan-col').style.display = 'block';
    }

    // Add delete functionality
    const deleteButton = absenceDiv.querySelector('.btn-outline-danger');
    deleteButton.onclick = function () { this.closest('.list-group-item').remove(); };

    // Add start date change handler
    const startInput = absenceDiv.querySelector('.absence-start');
    const endInput = absenceDiv.querySelector('.absence-end');
    const announcementInput = absenceDiv.querySelector('.absence-announcement');

    const updateAnnouncementDate = function() {
        if (startInput.value && endInput.value && typeof calculateAnnouncementDate === 'function') {
            const startDate = new Date(startInput.value);
            const endDate = new Date(endInput.value);
            const suggestedDate = calculateAnnouncementDate(startDate, endDate);
            announcementInput.value = suggestedDate.toISOString().split('T')[0];
        }
    };

    // Auto-check V-Plan for 3+ day absences
    const updateTherapyPlanCheckbox = function() {
        if (startInput.value && endInput.value && empPlanKey) {
            const startDate = new Date(startInput.value);
            const endDate = new Date(endInput.value);
            const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            // Pre-check if 3+ days
            if (days >= 3 && !therapyPlanCheckbox.dataset.userModified) {
                therapyPlanCheckbox.checked = true;
            }
        }
    };

    // Track if user manually modified the checkbox
    therapyPlanCheckbox.addEventListener('change', function() {
        this.dataset.userModified = 'true';
    });

    startInput.addEventListener('change', function () {
        if (!endInput.value) {
            // Parse the date and ensure we use the correct year
            const date = new Date(this.value);
            if (date.getFullYear() < 2024) {  // If year is too old
                date.setFullYear(new Date().getFullYear());  // Set to current year
            }
            endInput.value = date.toISOString().split('T')[0];
        }
        // Update announcement date
        updateAnnouncementDate();
        // Update V-Plan checkbox
        updateTherapyPlanCheckbox();
    });

    endInput.addEventListener('change', function () {
        // Update announcement date
        updateAnnouncementDate();
        // Update V-Plan checkbox
        updateTherapyPlanCheckbox();
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
    rights.viewPatientsStation = document.getElementById('editEmployeeRightsViewPatientsStation').checked;
    rights.editPatientsStation = document.getElementById('editEmployeeRightsEditPatientsStation').checked;
    rights.viewTherapiesStation = document.getElementById('editEmployeeRightsViewTherapiesStation').checked;
    rights.editTherapiesStation = document.getElementById('editEmployeeRightsEditTherapiesStation').checked;
    rights.viewRoundsStation = document.getElementById('editEmployeeRightsViewRoundsStation').checked;
    rights.editRoundsStation = document.getElementById('editEmployeeRightsEditRoundsStation').checked;
    rights.workloadStation = document.getElementById('editEmployeeRightsWorkloadStation').checked;
    rights.kosiStation = document.getElementById('editEmployeeRightsKosiStation').checked;
    rights.editEvents = document.getElementById('editEmployeeRightsEditEvents').checked;
    rights.editEmployees = document.getElementById('editEmployeeRightsEditEmployees').checked;
    rights.viewAnnouncementsStation = document.getElementById('editEmployeeRightsViewAnnouncementsStation').checked;
    rights.editOwnAnnouncementsStation = document.getElementById('editEmployeeRightsEditOwnAnnouncementsStation').checked;
    rights.editAllAnnouncementsStation = document.getElementById('editEmployeeRightsEditAllAnnouncementsStation').checked;
    rights.editTherapyplanStation = document.getElementById('editEmployeeRightsEditTherapyplanStation').checked;

    // Get therapy plan selection
    const selectedTherapyPlan = document.getElementById('editEmployeeTherapyPlan').value;

    // Get announcement texts
    const announcementTextShort = document.getElementById('editEmployeeAnnouncementTextShort').value.trim();
    const announcementTextLong = document.getElementById('editEmployeeAnnouncementTextLong').value.trim();

    // Get all absences
    const absencesList = document.getElementById('absences');
    const absences = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day

    // Track announcements to create and remove
    const announcementsToCreate = [];
    const announcementsToRemove = [];

    // First, collect all current announcements for this employee that are for future dates
    if (oldEmployee.absences && typeof removeAnnouncementEntriesForEmployee === 'function') {
        oldEmployee.absences.forEach(oldAbsence => {
            const oldEndDate = parseGermanDate(oldAbsence.end);
            // Only consider announcements for future absences
            if (oldEndDate >= now && oldAbsence.announcement) {
                announcementsToRemove.push({
                    announcementDate: oldAbsence.announcement,
                    startDate: oldAbsence.start,
                    endDate: oldAbsence.end,
                    employeeKey: oldKey
                });
            }
        });
    }

    absencesList.querySelectorAll('.list-group-item').forEach(absenceDiv => {
        const startInput = absenceDiv.querySelector('.absence-start');
        const endInput = absenceDiv.querySelector('.absence-end');
        const announcementInput = absenceDiv.querySelector('.absence-announcement');
        const plannedCheckbox = absenceDiv.querySelector('.absence-planned');
        const therapyPlanCheckbox = absenceDiv.querySelector('.absence-therapy-plan');

        if (startInput.value && endInput.value) {
            const startDate = new Date(startInput.value);
            const endDate = new Date(endInput.value);
            // Skip if end date is in the past
            if (endDate < now) return;

            // Calculate suggested announcement date if not set
            let announcementDateStr = announcementInput.value ? formatISOToGermanDate(announcementInput.value) : null;
            
            if (!announcementDateStr) {
                // Calculate announcement date using the helper function
                const suggestedDate = calculateAnnouncementDate(startDate, endDate);
                announcementDateStr = formatISOToGermanDate(suggestedDate.toISOString().split('T')[0]);
                // Update the input field
                announcementInput.value = suggestedDate.toISOString().split('T')[0];
            }

            const absenceStartStr = formatISOToGermanDate(startInput.value);
            const absenceEndStr = formatISOToGermanDate(endInput.value);

            const absenceData = {
                start: absenceStartStr,
                end: absenceEndStr,
                announcement: announcementDateStr,
                planned: plannedCheckbox.checked
            };

            // Add useTherapyPlan if checked
            if (therapyPlanCheckbox && therapyPlanCheckbox.checked) {
                absenceData.useTherapyPlan = true;
            }

            absences.push(absenceData);

            // Queue announcement creation
            const newAnnouncement = {
                announcementDate: announcementDateStr,
                startDate: absenceStartStr,
                endDate: absenceEndStr,
                employeeKey: oldKey !== newKey ? newKey : oldKey
            };
            announcementsToCreate.push(newAnnouncement);

            // Remove this from the removal list if it matches an old announcement
            const removalIndex = announcementsToRemove.findIndex(old => 
                old.announcementDate === announcementDateStr &&
                old.startDate === absenceStartStr &&
                old.endDate === absenceEndStr &&
                old.employeeKey === oldKey
            );
            if (removalIndex !== -1) {
                announcementsToRemove.splice(removalIndex, 1);
            }
        }
    });

    // Sort absences by start date
    absences.sort((a, b) => {
        const dateA = parseGermanDate(a.start);
        const dateB = parseGermanDate(b.start);
        return dateA - dateB;
    });

    // Handle therapy plan assignment changes
    const oldPlanKey = getEmployeeTherapyPlan(oldKey);
    if (window['therapieplaene'] && window['therapieplaene'].plans) {
        // Remove employee from old plan if different
        if (oldPlanKey && oldPlanKey !== selectedTherapyPlan) {
            delete window['therapieplaene'].plans[oldPlanKey].employee;
        }
        
        // Assign employee to new plan
        if (selectedTherapyPlan && window['therapieplaene'].plans[selectedTherapyPlan]) {
            window['therapieplaene'].plans[selectedTherapyPlan].employee = newKey;
        }
        
        // Update therapy plan associations based on absences
        const planKey = selectedTherapyPlan || oldPlanKey;
        if (planKey) {
            updateTherapyPlanAssociations(newKey, oldEmployee.absences, absences, planKey);
            setOriginalData('therapieplaene');
        }
    }

    // Create updated employee data
    const updatedEmployee = {
        name: name,
        username: username,
        patients: patients,
        absences: absences.length > 0 ? absences : undefined,
        rights: rights,
        passwordHash: oldEmployee.passwordHash,
        needsToChangePassword: oldEmployee.needsToChangePassword,
        announcementTextShort: announcementTextShort || undefined,
        announcementTextLong: announcementTextLong || undefined,
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

    // Queue announcement changes for manual saving
    if (typeof removeAnnouncementEntriesForEmployee === 'function' && typeof addAnnouncementEntry === 'function') {
        // Initialize announcements data if not loaded
        if (!window['announcements-station']) {
            window['announcements-station'] = {};
        }

        // Store the changes to apply later when saving
        window['pendingAnnouncementChanges'] = {
            toRemove: announcementsToRemove,
            toCreate: announcementsToCreate
        };

        // Mark announcements data as changed so it gets saved with the "Speichern notwendig" button
        if (announcementsToRemove.length > 0 || announcementsToCreate.length > 0) {
            setOriginalData('announcements-station');
        }
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

/**
 * Populate the therapy plan dropdown for an employee
 * @param {string} empKey - Employee key
 */
function populateTherapyPlanDropdown(empKey) {
    const dropdown = document.getElementById('editEmployeeTherapyPlan');
    const therapyPlanCard = document.getElementById('therapyPlanCard');
    
    // Clear existing options except the first one
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
        
    // Add plan options (skip 'default')
    const plans = window['therapieplaene'].plans;
    let currentPlanKey = '';
    
    for (const [planKey, plan] of Object.entries(plans)) {
        if (planKey === 'default') continue;
        
        const option = document.createElement('option');
        option.value = planKey;
        option.textContent = plan.title;
        dropdown.appendChild(option);
        
        // Check if this employee is assigned to this plan
        if (plan.employee === empKey) {
            currentPlanKey = planKey;
        }
    }
    
    // Set the current selection
    dropdown.value = currentPlanKey;
    
    // Show/hide V-Plan checkboxes based on whether employee has a plan
    updateTherapyPlanCheckboxVisibility(currentPlanKey !== '');
}

/**
 * Update visibility of V-Plan checkboxes in absences
 * @param {boolean} hasTherapyPlan - Whether employee has a therapy plan
 */
function updateTherapyPlanCheckboxVisibility(hasTherapyPlan) {
    const absencesList = document.getElementById('absences');
    absencesList.querySelectorAll('.absence-therapy-plan-col').forEach(col => {
        col.style.display = hasTherapyPlan ? 'block' : 'none';
    });
}

/**
 * Get the employee's assigned therapy plan key
 * @param {string} empKey - Employee key
 * @returns {string|null} - Plan key or null
 */
function getEmployeeTherapyPlan(empKey) {
    if (!window['therapieplaene'] || !window['therapieplaene'].plans) return null;
    
    for (const [planKey, plan] of Object.entries(window['therapieplaene'].plans)) {
        if (planKey !== 'default' && plan.employee === empKey) {
            return planKey;
        }
    }
    return null;
}

/**
 * Count workdays (Mon-Fri) in a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Number of workdays
 */
function countWorkdaysInRange(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    while (current <= end) {
        const day = current.getDay();
        if (day >= 1 && day <= 5) { // Monday to Friday
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
}

/**
 * Count workdays in a specific calendar week for a given absence
 * @param {Date} absenceStart - Absence start date
 * @param {Date} absenceEnd - Absence end date
 * @param {number} year - Year of the week
 * @param {number} week - Calendar week number
 * @returns {number} - Number of workdays absent in that week
 */
function countWorkdaysInWeek(absenceStart, absenceEnd, year, week) {
    // Get Monday of the specified week
    const monday = getMondayOfWeek(year, week);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    // Calculate overlap between absence and workweek
    const overlapStart = new Date(Math.max(absenceStart.getTime(), monday.getTime()));
    const overlapEnd = new Date(Math.min(absenceEnd.getTime(), friday.getTime()));
    
    if (overlapStart > overlapEnd) return 0;
    
    return countWorkdaysInRange(overlapStart, overlapEnd);
}

/**
 * Get Monday of a specific calendar week
 * @param {number} year - Year
 * @param {number} week - Calendar week number
 * @returns {Date} - Monday of that week
 */
function getMondayOfWeek(year, week) {
    // Find first Thursday of the year (ISO week date system)
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7; // Convert Sunday from 0 to 7
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
    
    // Add weeks
    const targetMonday = new Date(firstMonday);
    targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
    
    return targetMonday;
}

/**
 * Get all calendar weeks covered by a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Array of {year, week} objects
 */
function getWeeksCoveredByRange(startDate, endDate) {
    const weeks = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const seenWeeks = new Set();
    
    while (current <= end) {
        const week = getCalendarWeek(current);
        const year = getWeekYear(current);
        const key = `${year}-${week}`;
        
        if (!seenWeeks.has(key)) {
            seenWeeks.add(key);
            weeks.push({ year, week });
        }
        
        current.setDate(current.getDate() + 1);
    }
    
    return weeks;
}

/**
 * Get the year for ISO week date (can differ from calendar year at year boundaries)
 * @param {Date} date - Date
 * @returns {number} - Year for the week
 */
function getWeekYear(date) {
    const target = new Date(date.valueOf());
    target.setHours(0, 0, 0, 0);
    
    // Find Thursday of this week
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    
    return target.getFullYear();
}

/**
 * Update therapy plan associations based on absences
 * @param {string} empKey - Employee key
 * @param {Array} oldAbsences - Previous absences
 * @param {Array} newAbsences - New absences
 * @param {string} planKey - Employee's therapy plan key
 */
function updateTherapyPlanAssociations(empKey, oldAbsences, newAbsences, planKey) {
    if (!planKey || !window['therapieplaene']) return;
    
    if (!window['therapieplaene'].station) {
        window['therapieplaene'].station = {};
    }
    
    // Collect weeks that should have the plan (from new absences with useTherapyPlan)
    const weeksToSet = new Set();
    newAbsences.forEach(absence => {
        if (absence.useTherapyPlan) {
            const startDate = parseGermanDate(absence.start);
            const endDate = parseGermanDate(absence.end);
            const weeks = getWeeksCoveredByRange(startDate, endDate);
            
            weeks.forEach(({ year, week }) => {
                // Only add if more than 1 workday absent in this week
                if (countWorkdaysInWeek(startDate, endDate, year, week) > 1) {
                    weeksToSet.add(`${year}-${week}`);
                }
            });
        }
    });
    
    // Collect weeks that had the plan from old absences
    const weeksToCheck = new Set();
    if (oldAbsences) {
        oldAbsences.forEach(absence => {
            if (absence.useTherapyPlan) {
                const startDate = parseGermanDate(absence.start);
                const endDate = parseGermanDate(absence.end);
                const weeks = getWeeksCoveredByRange(startDate, endDate);
                
                weeks.forEach(({ year, week }) => {
                    weeksToCheck.add(`${year}-${week}`);
                });
            }
        });
    }
    
    // Remove plan from weeks that are no longer covered
    weeksToCheck.forEach(weekKey => {
        if (!weeksToSet.has(weekKey) && window['therapieplaene'].station[weekKey] === planKey) {
            delete window['therapieplaene'].station[weekKey];
        }
    });
    
    // Set plan for weeks that should have it
    weeksToSet.forEach(weekKey => {
        window['therapieplaene'].station[weekKey] = planKey;
    });
}
