/**
 * Fills the KOSI table with patients who have been admitted today or in the past
 */
function fillKosiTable() {
    const today = new Date();
    const table = document.getElementById('kosiTable');
    const tbody = table.querySelector('tbody');
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Filter and add patients
    Object.values(patients).forEach(patient => {
        const admissionDate = parseGermanDate(patient.admission);
        const patientId = Object.keys(patients).find(key => patients[key] === patient);
        const kosiData = kosi[patientId] || {};
        const dischargeDate = patient.discharge ? parseGermanDate(patient.discharge) : null;
        const isDischargedPatient = dischargeDate && dischargeDate <= today;
        
        // Only include patients admitted today or in the past
        if (admissionDate && admissionDate <= today) {
            const row = tbody.insertRow();
            row.className = 'text-center';
            
            // Add bg-secondary class if patient is discharged
            if (isDischargedPatient) {
                row.classList.add('bg-secondary-striped', 'bg-opacity-25');
            }
            
            // Patient name
            const nameCell = row.insertCell();
            nameCell.className = 'text-start';
            nameCell.textContent = patient.name;
            
            // Admission date (as text)
            const admissionCell = row.insertCell();
            admissionCell.textContent = patient.admission;
            
            // AD (checkbox)
            const adCell = row.insertCell();
            const adCheckbox = document.createElement('input');
            adCheckbox.type = 'checkbox';
            adCheckbox.className = 'form-check-input';
            adCheckbox.checked = kosiData.ad === 1;
            adCheckbox.addEventListener('change', function() {
                // Ensure patient exists in kosi object
                if (!kosi[patientId]) kosi[patientId] = {};
                
                // Update kosi data
                kosi[patientId].ad = this.checked ? 1 : 0;
                checkData();
            });
            adCell.appendChild(adCheckbox);
            
            // Discharge date (as text)
            const dischargeCell = row.insertCell();
            dischargeCell.textContent = patient.discharge || '';
            
            // KOÜB (date input)
            const kooubCell = row.insertCell();
            const kooubInput = document.createElement('input');
            kooubInput.type = 'date';
            kooubInput.className = 'form-control form-control-sm border-0 bg-transparent text-center';
            kooubInput.dataset.patientId = patientId; // Store patient ID for context menu handler
            
            // Add context menu handler to set date to 31.12.4000
            kooubInput.addEventListener('contextmenu', function(e) {
                e.preventDefault(); // Prevent default context menu
                
                // Set input value to 31.12.4000
                this.value = '4000-12-31';
                
                // Update visual styling
                this.classList.remove('text-danger', 'text-warning');
                this.classList.add('text-success');
                
                // Save the change to the kosi data structure
                const patId = this.dataset.patientId;
                if (!kosi[patId]) kosi[patId] = {};
                kosi[patId].koueb = '31.12.4000';
                
                // Reset Verlängerung checkboxes
                if (kosi[patId].verl1) delete kosi[patId].verl1;
                if (kosi[patId].verl2) delete kosi[patId].verl2;
                
                checkData();
                
                // Refresh the Verlängerung cell (remove checkboxes)
                const row = this.closest('tr');
                const verlaengerungCell = row.cells[5]; // 6th cell (0-indexed)
                verlaengerungCell.innerHTML = '';
                
                return false;
            });
            
            // Add change event to save date changes
            kooubInput.addEventListener('change', function() {
                if (this.value) {
                    // Convert ISO date to German format
                    const isoDate = this.value;
                    const germanDate = formatISOToGermanDate(isoDate);
                    
                    // Save to kosi data
                    const patId = this.dataset.patientId;
                    if (!kosi[patId]) kosi[patId] = {};
                    
                    // Reset Verlängerung checkboxes when KOÜB date changes
                    if (kosi[patId].koueb !== germanDate) {
                        if (kosi[patId].verl1) delete kosi[patId].verl1;
                        if (kosi[patId].verl2) delete kosi[patId].verl2;
                    }
                    
                    kosi[patId].koueb = germanDate;
                    
                    // Refresh the row to update styling and Verlängerung checkboxes
                    fillKosiTable();
                    checkData();
                }
            });
            
            // Set KOÜB date if available
            if (kosiData.koueb) {
                kooubInput.value = formatGermanToISODate(kosiData.koueb);
                
                const kouebDate = parseGermanDate(kosiData.koueb);
                
                // Set color based on conditions
                if (kosiData.koueb === '31.12.4000' || 
                    (dischargeDate && kouebDate >= dischargeDate)) {
                    kooubInput.classList.add('text-success');
                } else if (kouebDate < today) {
                    kooubInput.classList.add('text-danger');
                } else {
                    // Calculate days until KOÜB
                    const daysUntilKoueb = Math.ceil((kouebDate - today) / (1000 * 60 * 60 * 24));
                    if (daysUntilKoueb < 14) {
                        kooubInput.classList.add('text-warning');
                    }
                }
            }
            
            kooubCell.appendChild(kooubInput);
            
            // Verlängerung (checkboxes if KOÜB is set and not 31.12.4000)
            const verlaengerungCell = row.insertCell();
            if (kosiData.koueb && kosiData.koueb !== '31.12.4000' && !isDischargedPatient) {
                // Create container for checkboxes
                const checkboxContainer = document.createElement('div');
                checkboxContainer.className = 'd-flex justify-content-center gap-2';
                
                // First checkbox
                const checkbox1 = document.createElement('input');
                checkbox1.type = 'checkbox';
                checkbox1.className = 'form-check-input';
                checkbox1.checked = kosiData.verl1 === 1;
                checkbox1.addEventListener('change', function() {
                    if (!kosi[patientId]) kosi[patientId] = {};
                    kosi[patientId].verl1 = this.checked ? 1 : 0;
                    checkData();
                });
                
                // Second checkbox
                const checkbox2 = document.createElement('input');
                checkbox2.type = 'checkbox';
                checkbox2.className = 'form-check-input';
                checkbox2.checked = kosiData.verl2 === 1;
                checkbox2.addEventListener('change', function() {
                    if (!kosi[patientId]) kosi[patientId] = {};
                    kosi[patientId].verl2 = this.checked ? 1 : 0;
                    checkData();
                });
                
                // Add checkboxes to container
                checkboxContainer.appendChild(checkbox1);
                checkboxContainer.appendChild(checkbox2);
                
                // Add container to cell
                verlaengerungCell.appendChild(checkboxContainer);
            } else {
                verlaengerungCell.textContent = '';
            }
            
            // ED (checkbox) - only if patient is discharged
            const edCell = row.insertCell();
            if (isDischargedPatient) {
                const edCheckbox = document.createElement('input');
                edCheckbox.type = 'checkbox';
                edCheckbox.className = 'form-check-input';
                edCheckbox.checked = kosiData.ed === 1;
                edCheckbox.addEventListener('change', function() {
                    if (!kosi[patientId]) kosi[patientId] = {};
                    kosi[patientId].ed = this.checked ? 1 : 0;
                    checkData();
                });
                edCell.appendChild(edCheckbox);
            }
            
            // FA (checkbox) - only if patient is discharged
            const faCell = row.insertCell();
            if (isDischargedPatient) {
                // Create container for checkbox and icon
                const faContainer = document.createElement('div');
                faContainer.className = 'd-flex justify-content-center gap-2';
                
                // FA checkbox
                const faCheckbox = document.createElement('input');
                faCheckbox.type = 'checkbox';
                faCheckbox.className = 'form-check-input';
                faCheckbox.checked = kosiData.fa === 1;
                faCheckbox.addEventListener('change', function() {
                    if (!kosi[patientId]) kosi[patientId] = {};
                    kosi[patientId].fa = this.checked ? 1 : 0;
                    checkData();
                });
                
                // Info icon for comments
                const infoIcon = document.createElement('i');
                infoIcon.className = kosiData.fa_comment ? 'bi bi-info-square-fill text-primary' : 'bi bi-info-square text-secondary';
                if (kosiData.fa_comment) {
                    infoIcon.title = kosiData.fa_comment;
                }
                
                // Add click handler to show prompt for comment
                infoIcon.style.cursor = 'pointer';
                infoIcon.addEventListener('click', function() {
                    // Get current comment or empty string
                    const currentComment = kosiData.fa_comment || '';
                    
                    // Show prompt to edit comment
                    const newComment = prompt('Kommentar für FA:', currentComment);
                    
                    // Handle the result
                    if (newComment !== null) { // User didn't cancel
                        if (newComment.trim() === '') {
                            // Remove comment if empty
                            if (kosi[patientId] && kosi[patientId].fa_comment) {
                                delete kosi[patientId].fa_comment;
                            }
                            infoIcon.className = 'bi bi-info-square text-secondary';
                            infoIcon.removeAttribute('title');
                        } else {
                            // Save new comment
                            if (!kosi[patientId]) kosi[patientId] = {};
                            kosi[patientId].fa_comment = newComment.trim();
                            infoIcon.className = 'bi bi-info-square-fill text-primary';
                            infoIcon.title = newComment.trim();
                        }
                        checkData();
                    }
                });
                
                // Add elements to container
                faContainer.appendChild(faCheckbox);
                faContainer.appendChild(infoIcon);
                
                // Add container to cell
                faCell.appendChild(faContainer);
            }
            
            // Action (empty)
            const actionCell = row.insertCell();
            if (isDischargedPatient && kosiData.fa === 1) {
                // Create "Abschließen" button
                const finishButton = document.createElement('button');
                finishButton.type = 'button';
                finishButton.className = 'btn btn-sm btn-outline-danger';
                finishButton.textContent = 'Abschließen';
                
                // Add click handler to remove patient and update data
                finishButton.addEventListener('click', function() {
                    if (confirm(`Möchten Sie ${patient.name} wirklich abschließen und aus der Belegung entfernen?`)) {
                        // Remove patient from patients object
                        delete patients[patientId];
                        
                        // Save updated patients data
                        downloadDataAsJS(patients, 'patients', 'Belegung.js');
                        
                        // Refresh the table
                        fillKosiTable();
                    }
                });
                
                actionCell.appendChild(finishButton);
            } else {
                actionCell.textContent = '';
            }
        }
    });
}

/**
 * Counts patients that need AD to be checked (AD is not set)
 * @returns {number} Number of patients that need AD to be checked
 */
function countPatientsNeedingAD() {
    const today = new Date();
    let count = 0;
    
    Object.keys(patients).forEach(patientId => {
        const patient = patients[patientId];
        const kosiData = kosi[patientId] || {};
        const admissionDate = parseGermanDate(patient.admission);
        
        // Only count patients who are admitted and don't have AD checked
        if (admissionDate && admissionDate <= today && kosiData.ad !== 1) {
            count++;
        }
    });
    
    return count;
}

/**
 * Counts patients that need a Verlängerung (KOÜB is set and not 31.12.4000,
 * and is in the next 2 weeks or in the past, and verl2 is not checked)
 * @returns {number} Number of patients that need a Verlängerung
 */
function countPatientsNeedingVerlaengerung() {
    const today = new Date();
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    let count = 0;
    
    Object.keys(patients).forEach(patientId => {
        const patient = patients[patientId];
        const kosiData = kosi[patientId] || {};
        const dischargeDate = patient.discharge ? parseGermanDate(patient.discharge) : null;
        const isDischargedPatient = dischargeDate && dischargeDate <= today;
        
        // Skip discharged patients
        if (isDischargedPatient) return;
        
        // Check if KOÜB is set, not 31.12.4000, and is in the next 2 weeks or in the past
        if (kosiData.koueb && kosiData.koueb !== '31.12.4000') {
            const kouebDate = parseGermanDate(kosiData.koueb);
            
            if (kouebDate && kouebDate <= twoWeeksFromNow && kosiData.verl2 !== 1) {
                count++;
            }
        }
    });
    
    return count;
}

/**
 * Counts patients that need FA (discharged and FA not checked)
 * @returns {number} Number of patients that need FA
 */
function countPatientsNeedingFA() {
    const today = new Date();
    let count = 0;
    
    Object.keys(patients).forEach(patientId => {
        const patient = patients[patientId];
        const kosiData = kosi[patientId] || {};
        const dischargeDate = patient.discharge ? parseGermanDate(patient.discharge) : null;
        
        // Only count discharged patients who don't have FA checked
        if (dischargeDate && dischargeDate <= today && kosiData.fa !== 1) {
            count++;
        }
    });
    
    return count;
}

/**
 * Updates the KOSI counts on the main page
 */
function updateKosiCounts() {
    // Get the count elements if they exist
    const adCountElement = document.getElementById('kosiCount-ad');
    const kouebCountElement = document.getElementById('kosiCount-koueb');
    const faCountElement = document.getElementById('kosiCount-fa');
    
    if (!adCountElement || !kouebCountElement || !faCountElement) return;
    
    // Get the counts
    const adCount = countPatientsNeedingAD();
    const kouebCount = countPatientsNeedingVerlaengerung();
    const faCount = countPatientsNeedingFA();
    
    // Update the count elements
    adCountElement.textContent = adCount;
    kouebCountElement.textContent = kouebCount;
    faCountElement.textContent = faCount;
    
    // Update button classes based on counts
    updateButtonClass(adCountElement, adCount);
    updateButtonClass(kouebCountElement, kouebCount);
    updateButtonClass(faCountElement, faCount);
}

/**
 * Updates the button class based on the count
 * @param {HTMLElement} countElement - The count element
 * @param {number} count - The count value
 */
function updateButtonClass(countElement, count) {
    const button = countElement.closest('.btn');
    if (!button) return;
    
    if (count === 0) {
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-outline-secondary');
        button.setAttribute('disabled', 'disabled');
    } else {
        button.classList.remove('btn-outline-secondary');
        button.classList.add('btn-outline-primary');
        button.removeAttribute('disabled');
    }
}

// Export functions for use in other files
window.updateKosiCounts = updateKosiCounts;