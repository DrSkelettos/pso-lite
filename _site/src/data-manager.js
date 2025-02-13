let original = {};

original.patients = JSON.stringify(patients);


function checkData() {
    if (original.patients != JSON.stringify(patients))
        document.getElementById("data-changed").classList.remove("d-none");
    else
        document.getElementById("data-changed").classList.add("d-none");
}
