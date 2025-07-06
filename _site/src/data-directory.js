
// Database name and version
const DB_NAME = 'DirectoryAccessDB';
const DB_VERSION = 1;
const STORE_NAME = 'directoryHandles';

let db;
let directoryHandle;

// Initialize IndexedDB
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database error');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

// Save directory handle to IndexedDB
async function saveDirectoryHandle(handle) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Convert the directory handle to a serializable object
    const handleData = {
        id: 'directory',
        name: handle.name,
        handle: handle
    };

    return new Promise((resolve, reject) => {
        const request = store.put(handleData);
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error('Error saving directory handle:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Get directory handle from IndexedDB
async function getDirectoryHandle() {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
        const request = store.get('directory');
        request.onsuccess = () => resolve(request.result?.handle || null);
        request.onerror = () => resolve(null);
    });
}

// Check if the directory contains a valid info.json
async function validateDirectory(handle) {
    try {
        // Try to get the info.json file
        const fileHandle = await handle.getFileHandle('info.json');
        const file = await fileHandle.getFile();
        const contents = await file.text();
        const info = JSON.parse(contents);

        // Check if the tool is PSOrga
        if (info.tool === 'PSOrga') {
            return { valid: true };
        } else {
            return {
                valid: false,
                message: 'Der ausgewählte Ordner ist nicht korrekt.'
            };
        }
    } catch (error) {
        if (error.name === 'NotFoundError') {
            return {
                valid: false,
                message: 'Der ausgewählte Ordner ist nicht korrekt.'
            };
        } else if (error instanceof SyntaxError) {
            return {
                valid: false,
                message: 'Der ausgewählte Ordner ist nicht korrekt.'
            };
        } else {
            console.error('Error validating directory:', error);
            return {
                valid: false,
                message: `Fehler beim Überprüfen des Verzeichnisses: ${error.message}`
            };
        }
    }
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 10000);
}

// Request directory access
async function requestDirectory() {
    try {
        // Hide any previous error messages
        document.getElementById('errorMessage').style.display = 'none';

        // Initialize database if not already done
        if (!db) {
            await initDB();
        }

        // Request permission to open a directory
        const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            id: 'pso-data-dir',
            startIn: 'documents'
        });

        // Verify permission
        if (await verifyPermission(dirHandle, true)) {
            // Validate the directory contents
            const validation = await validateDirectory(dirHandle);

            if (validation.valid) {
                directoryHandle = dirHandle;
                await saveDirectoryHandle(dirHandle);
                location.href = "../../index.html";
                return true;
            } else {
                showError(validation.message);
                return false;
            }
        }
    } catch (error) {
        console.error('Error accessing directory:', error);
        showError('Fehler beim Zugriff auf das Verzeichnis: ' + error.message);
    }
    return false;
}

// Verify permission
async function verifyPermission(handle, readWrite) {
    const options = {};
    if (readWrite) {
        options.mode = 'readwrite';
    }

    // Check if permission was already granted
    if ((await handle.queryPermission(options)) === 'granted') {
        return true;
    }

    // Request permission
    if ((await handle.requestPermission(options)) === 'granted') {
        return true;
    }

    throw new Error('Keine Berechtigung erteilt');
}

// Initialize the application
async function init(pageName = null, dir = './') {
    if (!('showDirectoryPicker' in window)) {
        alert('Ihr Browser unterstützt die Verzeichnisauswahl nicht. Bitte verwenden Sie einen modernen Browser wie Chrome oder Edge.');
        return;
    }

    if (pageName == 'Datenauswahl') return;

    try {
        await initDB();
        const savedHandle = await getDirectoryHandle();

        if (savedHandle) {
            // Verify we still have permission
            if (await verifyPermission(savedHandle, false)) {
                directoryHandle = savedHandle;
            }
        }
        else {
            location.href = dir + "sites/datenauswahl/index.html";
        }
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Fehler beim Initialisieren: ' + error.message);
    }
}