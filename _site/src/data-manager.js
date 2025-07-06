let original = {};

function setOriginalData(dataName) {
    original[dataName] = JSON.stringify(window[dataName]);
}

function checkData() {
    let changed = false;

    for (const key in original) {
        // Skip if the key doesn't exist in window
        if (window[key] === undefined) {
            console.warn(`Data key '${key}' not found in window`);
            continue;
        }

        // Compare stringified versions
        const currentValue = JSON.stringify(window[key]);
        if (original[key] !== currentValue) {
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

async function saveData(objectName, fileName) {
    await saveFile(fileName, window[objectName]);

    setOriginalData(objectName);
    checkData();
}

// function downloadDataAsJS(dataObject, objectName, fileName) {
//     const jsContent = `const ${objectName} = ${JSON.stringify(dataObject, null, 2)};`;

//     downloadString(jsContent, 'application/javascript', fileName);

//     setOriginalData();
//     checkData();
// }