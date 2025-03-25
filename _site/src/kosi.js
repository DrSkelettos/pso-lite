/**
 * Fills the KOSI table with patients who have been admitted today or in the past
 */
function fillKosiTable() {
    const today = new Date('2025-03-25');
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
                
                // TODO: Save the change to the kosi data structure
                
                return false;
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
            
            // Verlängerung (empty)
            const verlaengerungCell = row.insertCell();
            verlaengerungCell.textContent = '';
            
            // ED (checkbox) - only if patient is discharged
            const edCell = row.insertCell();
            if (isDischargedPatient) {
                const edCheckbox = document.createElement('input');
                edCheckbox.type = 'checkbox';
                edCheckbox.className = 'form-check-input';
                edCheckbox.checked = kosiData.ed === 1;
                edCell.appendChild(edCheckbox);
            }
            
            // FA (checkbox) - only if patient is discharged
            const faCell = row.insertCell();
            if (isDischargedPatient) {
                const faCheckbox = document.createElement('input');
                faCheckbox.type = 'checkbox';
                faCheckbox.className = 'form-check-input';
                faCheckbox.checked = kosiData.fa === 1;
                faCell.appendChild(faCheckbox);
            }
            
            // Action (empty)
            const actionCell = row.insertCell();
            actionCell.textContent = '';
        }
    });
}