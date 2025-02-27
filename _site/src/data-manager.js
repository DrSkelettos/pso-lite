let original = {};

function setOriginalData() {
    original.employees = JSON.stringify(employees);
    original.therapies = JSON.stringify(therapies);
    original.patients = JSON.stringify(patients);
}
setOriginalData();

function checkData() {
    let changed = false;
    for (const key in original) {
        if (original[key] != JSON.stringify(window[key])) {
            changed = true;
            break;
        }
    }
    if (changed)
        document.getElementById("data-changed").classList.remove("d-none");
    else
        document.getElementById("data-changed").classList.add("d-none");
}
