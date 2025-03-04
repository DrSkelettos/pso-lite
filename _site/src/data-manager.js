let original = {};

function setOriginalData() {
    original.employees = JSON.stringify(employees);
    original.therapies = JSON.stringify(therapies);
    original.patients = JSON.stringify(patients);
    original.poststationaer = JSON.stringify(poststationaer);
}
setOriginalData();

function checkData() {
    let changed = false;
    const currentData = {
        employees: JSON.stringify(employees),
        therapies: JSON.stringify(therapies),
        patients: JSON.stringify(patients),
        poststationaer: JSON.stringify(poststationaer)
    };

    for (const key in original) {
        if (original[key] !== currentData[key]) {
            changed = true;
            break;
        }
    }

    if (changed)
        document.getElementById("data-changed").classList.remove("d-none");
    else
        document.getElementById("data-changed").classList.add("d-none");
}
