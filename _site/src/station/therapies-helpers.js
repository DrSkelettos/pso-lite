/**
 * Updates employee assignments in group headers and footer based on employee settings
 */
function updateEmployeeAssignments() {
    const employees = window['employees'] || {};
    console.log('updateEmployeeAssignments called, employees:', employees);
    
    // Initialize assignment objects
    const medicalCare = {
        'Station Gruppe 1': [],
        'Station Gruppe 2': [],
        'Station Gruppe 3': []
    };
    const medicalCareBackup = {
        'Station Gruppe 1': [],
        'Station Gruppe 2': [],
        'Station Gruppe 3': []
    };
    const groupTherapy = {
        'Station Gruppe A': [],
        'Station Gruppe B': []
    };
    
    // Collect employee assignments
    Object.entries(employees).forEach(([key, employee]) => {
        if (employee.medicalCare && medicalCare[employee.medicalCare]) {
            console.log("Medical care:", employee.medicalCare, "Employee:", key);
            medicalCare[employee.medicalCare].push(key);
        }
        if (employee.medicalCareBackup && medicalCareBackup[employee.medicalCareBackup]) {
            console.log("Medical care backup:", employee.medicalCareBackup, "Employee:", key);
            medicalCareBackup[employee.medicalCareBackup].push(key);
        }
        if (employee.groupTherapy && groupTherapy[employee.groupTherapy]) {
            groupTherapy[employee.groupTherapy].push(key);
        }
    });

    console.log(medicalCare, medicalCareBackup, groupTherapy);
    
    // Update group headers
    const group1Primary = medicalCare['Station Gruppe 1'][0] || '';
    const group1Backup = medicalCareBackup['Station Gruppe 1'][0] || '';
    const group1Header = document.getElementById('group1-header');
    if (group1Header) {
        group1Header.innerHTML = `<span class="fw-bold">Gruppe 1</span> (Essstörungen und Adipositas | KT + GT | ${group1Primary}/${group1Backup})`;
    }
    
    const group2Primary = medicalCare['Station Gruppe 2'][0] || '';
    const group2Backup = medicalCareBackup['Station Gruppe 2'][0] || '';
    const group2Header = document.getElementById('group2-header');
    if (group2Header) {
        group2Header.innerHTML = `<span class="fw-bold">Gruppe 2</span> (Arbeitspsychosomatik, Stress und Belastungsstörungen | MT + GT | ${group2Primary}/${group2Backup})`;
    }
    
    const group3Primary = medicalCare['Station Gruppe 3'][0] || '';
    const group3Backup = medicalCareBackup['Station Gruppe 3'][0] || '';
    const group3Header = document.getElementById('group3-header');
    if (group3Header) {
        group3Header.innerHTML = `<span class="fw-bold">Gruppe 3</span> (Psychokardiologie und somatische Belastungsstörungen | KT + MT | ${group3Primary}/${group3Backup})`;
    }
    
    // Update group therapy assignments in footer
    const groupAEmployees = groupTherapy['Station Gruppe A'].length > 0 
        ? groupTherapy['Station Gruppe A'].join('/') 
        : '';
    const groupBEmployees = groupTherapy['Station Gruppe B'].length > 0 
        ? groupTherapy['Station Gruppe B'].join('/') 
        : '';
    
    const groupAElement = document.getElementById('group-a-employees');
    if (groupAElement) {
        groupAElement.textContent = groupAEmployees;
    }
    
    const groupBElement = document.getElementById('group-b-employees');
    if (groupBElement) {
        groupBElement.textContent = groupBEmployees;
    }
}
