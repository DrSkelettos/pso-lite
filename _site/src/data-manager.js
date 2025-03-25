let original = {};

function setOriginalData() {
    original.employees = JSON.stringify(employees);
    original.therapies = JSON.stringify(therapies);
    original.patients = JSON.stringify(patients);
    original.poststationaer = JSON.stringify(poststationaer);
    original.kosi = JSON.stringify(kosi);
}
setOriginalData();

function checkData() {
    let changed = false;
    const currentData = {
        employees: JSON.stringify(employees),
        therapies: JSON.stringify(therapies),
        patients: JSON.stringify(patients),
        poststationaer: JSON.stringify(poststationaer),
        kosi: JSON.stringify(kosi)
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

function downloadString(text, fileType, fileName) {
    var blob = new Blob([text], { type: fileType });

    var a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
}

function downloadDataAsJS(dataObject, objectName, fileName) {
    const jsContent = `const ${objectName} = ${JSON.stringify(dataObject, null, 2)};`;

    downloadString(jsContent, 'application/javascript', fileName);

    setOriginalData();
    checkData();
}
