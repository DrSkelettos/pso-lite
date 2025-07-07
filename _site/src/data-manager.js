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

    if (document.getElementById("data-changed")) {
        if (changed)
            document.getElementById("data-changed").classList.remove("d-none");
        else
            document.getElementById("data-changed").classList.add("d-none");
    }
}


async function saveData(objectName, fileName) {
    await saveFile(fileName, window[objectName]);

    setOriginalData(objectName);
    if (document.getElementById("data-changed"))
        document.getElementById("data-changed").classList.add("d-none");
}