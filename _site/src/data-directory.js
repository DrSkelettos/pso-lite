let directoryHandle;

// Mapping of data names to their corresponding file names (without .json extension)
const dataFileMap = {
    'patients-station': 'belegung-station',
    'patient-events-station': 'patienten-termine-station',
    'therapies-station': 'therapiezuordnung-station',
    'therapies-settings': 'therapiezuordnung-einstellungen',
    'rounds-station': 'chefaerztinvisite-station',
    'rooms-station': 'zimmer-station',
    'employees': 'mitarbeiter_innen',
    'settings': 'einstellungen',
    'events': 'termine',
    'kosi-station': 'kostensicherung-station',
    'announcements-station': 'ankuendigungen-station',
};

/**
 * Loads multiple data files in parallel and executes a callback when done
 * @param {string[]} dataNames - Array of data names to load (e.g., ['patients-station', 'therapies-station'])
 * @param {Function} [callback] - Optional callback function to execute after all data is loaded
 * @returns {Promise<Object>} - Object containing loaded data and success status
 */
async function loadMultipleData(dataNames, callback) {
    if (!Array.isArray(dataNames) || dataNames.length === 0) {
        const error = new Error('Invalid data names array');
        if (callback) callback({ success: false, error });
        return { success: false, error };
    }

    try {
        // Create an array of load promises with error handling
        const loadPromises = dataNames.map(dataName => {
            const fileName = dataFileMap[dataName] || dataName;
            return loadData(dataName, fileName)
                .catch(error => {
                    console.error(`Error loading ${dataName}:`, error);
                    // Initialize with empty object if loading fails
                    window[dataName] = {};
                    return { dataName, success: false, error };
                });
        });

        // Wait for all loads to complete
        const results = await Promise.all(loadPromises);
        
        // Check for any failures
        const failedLoads = results.filter(result => result && !result.success);
        const success = failedLoads.length === 0;
        
        const result = {
            success,
            loaded: dataNames.filter((_, index) => results[index]?.success !== false),
            failed: failedLoads.map((result, index) => ({
                dataName: dataNames[index],
                error: result?.error?.message || 'Unknown error'
            }))
        };

        // Execute callback if provided
        if (callback) {
            try {
                callback(result);
            } catch (callbackError) {
                console.error('Error in loadMultipleData callback:', callbackError);
            }
        }

        // Hide loading overlay after data loading completes
        if (typeof window.hideLoadingOverlay === 'function') {
            window.hideLoadingOverlay();
        }
        
        return result;
    } catch (error) {
        console.error('Error in loadMultipleData:', error);
        const result = { 
            success: false, 
            error: error.message || 'Unknown error during data loading' 
        };        
        
        return result;
    }
}

// Save directory handle to IndexedDB
async function saveDirectoryHandle(handle) {
    idbKeyval.set('directory', handle)
        .then(() => console.log('Saved to IndexedDB'))
        .catch((err) => console.log('Failed to save to IndexedDB', err));
}

// Get directory handle from IndexedDB
async function getDirectoryHandle() {
    return idbKeyval.get('directory')
        .then((handle) => handle)
        .catch((err) => console.log('Failed to get from IndexedDB', err));
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

        // Request permission to open a directory
        const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            id: 'pso-data-dir',
            startIn: 'desktop'
        });

        // Verify permission
        if (await verifyPermission(dirHandle, true)) {
            document.getElementById('loadingOverlay').classList.remove('d-none');

            // Validate the directory contents
            const validation = await validateDirectory(dirHandle);

            if (validation.valid) {
                directoryHandle = dirHandle;
                await saveDirectoryHandle(dirHandle);
                
                // Create complete backup of all JSON files (once per day)
                try {
                    const backupResult = await createCompleteBackup();
                    if (backupResult.success && !backupResult.skipped) {
                        console.log(`Complete backup created successfully for ${backupResult.date}`);
                    }
                } catch (error) {
                    console.error('Failed to create complete backup:', error);
                    // Don't block navigation if backup fails
                }
                
                window.setTimeout(() => location.href = "../../index.html", 1000);
                return true;
            } else {
                showError(validation.message);
                return false;
            }
        }
    } catch (error) {
        document.getElementById('loadingOverlay').classList.add('d-none');
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

/**
 * Loads and parses JSON data from a file in the directory
 * @param {string} fileName - Name of the file to load
 * @returns {Promise<Object>} Parsed JSON data
 * @throws {Error} If file operations or parsing fails
 */
async function loadFile(fileName) {
    if (!fileName || typeof fileName !== 'string') {
        throw new Error('Ungültiger Dateiname');
    }

    try {
        fileName += ".json";
        // Check if directory handle is available
        if (!directoryHandle) {
            throw new Error('Kein Verzeichnis ausgewählt');
        }

        // Check read permission
        if (!(await verifyPermission(directoryHandle, true))) {
            throw new Error('Keine Leseberechtigung für das Verzeichnis');
        }

        const fileHandle = await directoryHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();

        // Check file size (prevent loading huge files)
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('Datei ist zu groß (max. 10MB)');
        }

        const contents = await file.text();

        // Check if file is empty
        if (!contents.trim()) {
            return null;
        }

        return JSON.parse(contents);
    } catch (error) {
        if (error.name === 'NotFoundError') {
            throw new Error(`Datei nicht gefunden: ${fileName}`);
        } else if (error instanceof SyntaxError) {
            throw new Error(`Ungültiges JSON-Format in Datei: ${fileName}`);
        }
        throw new Error(`Fehler beim Laden der Datei: ${error.message}`);
    }
}

/**
 * Saves data as JSON to a file in the directory
 * @param {string} fileName - Name of the file to save to
 * @param {any} data - Data to be saved (will be stringified to JSON)
 * @returns {Promise<void>}
 * @throws {Error} If file operations or stringifying fails
 */
async function saveFile(fileName, data, ignoreBackup = false) {
    if (!fileName || typeof fileName !== 'string') {
        throw new Error('Ungültiger Dateiname');
    }

    if (data === undefined || data === null) {
        throw new Error('Keine Daten zum Speichern angegeben');
    }

    try {
        fileName += ".json";
        // Check if directory handle is available
        if (!directoryHandle) {
            throw new Error('Kein Verzeichnis ausgewählt');
        }

        // Check write permission
        if (!(await verifyPermission(directoryHandle, true))) {
            throw new Error('Keine Schreibberechtigung für das Verzeichnis');
        }

        let jsonString;
        try {
            jsonString = JSON.stringify(data, null, 2);
        } catch (error) {
            throw new Error('Daten können nicht in JSON umgewandelt werden');
        }

        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });

        // Check if we have write permission for the file
        if (!(await verifyPermission(fileHandle, true))) {
            throw new Error('Keine Schreibberechtigung für die Datei');
        }

        const file = await fileHandle.createWritable();
        try {
            await file.write(jsonString);
            await file.close();

            // Backup the newly saved data (not the old data)
            if (!ignoreBackup)
                await backupFile(fileName, jsonString);
        } catch (error) {
            // Try to close the file even if write fails
            try { await file.close(); } catch (e) { }
            throw error;
        }
    } catch (error) {
        throw new Error(`Fehler beim Speichern der Datei: ${error.message}`);
    }
}

/**
 * Creates a timestamped backup of JSON data in a date-based directory
 * Also updates backup.json to track the last 10 backups for each file
 * @param {string} fileName - Name of the file to backup (with .json extension)
 * @param {string} dataString - JSON string data to backup
 * @returns {Promise<string>} Path to the created backup file
 * @throws {Error} If backup creation fails
 */
async function backupFile(fileName, dataString) {
    if (!fileName || typeof fileName !== 'string') {
        throw new Error('Ungültiger Dateiname');
    }

    if (!dataString || typeof dataString !== 'string') {
        throw new Error('Keine Daten zum Sichern angegeben');
    }

    // Ensure fileName has .json extension
    const sourceFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;

    try {
        // Check if directory handle is available
        if (!directoryHandle) {
            throw new Error('Kein Verzeichnis ausgewählt');
        }

        // Check write permission
        if (!(await verifyPermission(directoryHandle, true))) {
            throw new Error('Keine Schreibberechtigung für das Verzeichnis');
        }

        // Get current date and time for backup naming
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = [
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0'),
            String(now.getSeconds()).padStart(2, '0')
        ].join(''); // HHMMSS

        // Create backup directory path
        const backupDirName = 'backups';
        const dateDirName = dateStr;
        const baseName = sourceFileName.replace(/\.json$/i, '');
        const backupFileName = `${baseName}-${timeStr}.json`;

        // Create or get the backups directory
        let backupDirHandle;
        try {
            backupDirHandle = await directoryHandle.getDirectoryHandle(backupDirName, { create: true });
        } catch (error) {
            throw new Error(`Backup-Verzeichnis konnte nicht erstellt werden: ${error.message}`);
        }

        // Create or get the date-specific subdirectory
        let dateDirHandle;
        try {
            dateDirHandle = await backupDirHandle.getDirectoryHandle(dateDirName, { create: true });
        } catch (error) {
            throw new Error(`Datumsspezifisches Backup-Verzeichnis konnte nicht erstellt werden: ${error.message}`);
        }

        // Create the backup file with the new data
        try {
            const backupFileHandle = await dateDirHandle.getFileHandle(backupFileName, { create: true });
            const writable = await backupFileHandle.createWritable();

            try {
                await writable.write(dataString);
                await writable.close();
                
                const backupPath = `${backupDirName}/${dateDirName}/${backupFileName}`;
                
                // Update backup tracking
                await updateBackupTracking(sourceFileName, backupPath, now);
                
                return backupPath;
            } catch (error) {
                await writable.close().catch(() => { });
                throw new Error(`Fehler beim Schreiben der Backup-Datei: ${error.message}`);
            }
        } catch (error) {
            throw new Error(`Fehler beim Erstellen der Backup-Datei: ${error.message}`);
        }
    } catch (error) {
        throw new Error(`Backup fehlgeschlagen: ${error.message}`);
    }
}

/**
 * Updates backup.json to track the last 10 backups for each file
 * @param {string} fileName - Name of the original file (with .json extension)
 * @param {string} backupPath - Path to the backup file
 * @param {Date} timestamp - Timestamp of the backup
 */
async function updateBackupTracking(fileName, backupPath, timestamp) {
    try {
        // Load existing backup tracking data
        let backupTracking = {};
        try {
            const backupTrackingHandle = await directoryHandle.getFileHandle('backup.json');
            const file = await backupTrackingHandle.getFile();
            const contents = await file.text();
            if (contents.trim()) {
                backupTracking = JSON.parse(contents);
            }
        } catch (error) {
            // File doesn't exist yet, start with empty object
            if (error.name !== 'NotFoundError') {
                console.warn('Error reading backup.json:', error);
            }
        }

        // Initialize array for this file if it doesn't exist
        if (!backupTracking[fileName]) {
            backupTracking[fileName] = [];
        }

        // Add new backup entry
        backupTracking[fileName].unshift({
            path: backupPath,
            timestamp: timestamp.toISOString(),
            date: timestamp.toLocaleString('de-DE', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            })
        });

        // Keep only the last 10 backups
        backupTracking[fileName] = backupTracking[fileName].slice(0, 10);

        // Save updated tracking data
        const trackingJson = JSON.stringify(backupTracking, null, 2);
        const trackingFileHandle = await directoryHandle.getFileHandle('backup.json', { create: true });
        const writable = await trackingFileHandle.createWritable();
        
        try {
            await writable.write(trackingJson);
            await writable.close();
        } catch (error) {
            await writable.close().catch(() => {});
            throw error;
        }
    } catch (error) {
        console.error('Failed to update backup tracking:', error);
        // Don't throw - backup was successful even if tracking failed
    }
}

/**
 * Creates a complete backup of all JSON files in the data directory
 * Saves to ./backups/complete/YYYY-MM-DD/
 * Only creates one backup per day
 * @returns {Promise<Object>} Result object with success status and details
 */
async function createCompleteBackup() {
    try {
        // Check if directory handle is available
        if (!directoryHandle) {
            throw new Error('Kein Verzeichnis ausgewählt');
        }

        // Check write permission
        if (!(await verifyPermission(directoryHandle, true))) {
            throw new Error('Keine Schreibberechtigung für das Verzeichnis');
        }

        // Get current date for backup folder
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

        // Create backup directory structure: backups/complete/YYYY-MM-DD
        const backupDirHandle = await directoryHandle.getDirectoryHandle('backups', { create: true });
        const completeDirHandle = await backupDirHandle.getDirectoryHandle('complete', { create: true });
        
        // Check if backup for today already exists
        let dateDirHandle;
        try {
            dateDirHandle = await completeDirHandle.getDirectoryHandle(dateStr, { create: false });
            // Directory exists, check if it has files
            const entries = [];
            for await (const entry of dateDirHandle.values()) {
                if (entry.kind === 'file') {
                    entries.push(entry.name);
                }
            }
            if (entries.length > 0) {
                console.log(`Complete backup for ${dateStr} already exists, skipping.`);
                return { success: true, skipped: true, date: dateStr };
            }
        } catch (error) {
            // Directory doesn't exist, create it
            dateDirHandle = await completeDirHandle.getDirectoryHandle(dateStr, { create: true });
        }

        // Get all JSON files in the root directory
        const jsonFiles = [];
        for await (const entry of directoryHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                jsonFiles.push(entry.name);
            }
        }

        // Backup each JSON file
        const backedUpFiles = [];
        const failedFiles = [];

        for (const fileName of jsonFiles) {
            try {
                const fileHandle = await directoryHandle.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                const contents = await file.text();

                // Create backup file
                const backupFileHandle = await dateDirHandle.getFileHandle(fileName, { create: true });
                const writable = await backupFileHandle.createWritable();

                try {
                    await writable.write(contents);
                    await writable.close();
                    backedUpFiles.push(fileName);
                } catch (error) {
                    await writable.close().catch(() => {});
                    throw error;
                }
            } catch (error) {
                console.error(`Failed to backup ${fileName}:`, error);
                failedFiles.push({ fileName, error: error.message });
            }
        }

        console.log(`Complete backup created: ${backedUpFiles.length} files backed up to backups/complete/${dateStr}`);
        
        return {
            success: failedFiles.length === 0,
            date: dateStr,
            backedUpFiles,
            failedFiles,
            skipped: false
        };
    } catch (error) {
        console.error('Error creating complete backup:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Loads backup tracking data from backup.json
 * @returns {Promise<Object>} Backup tracking data organized by file name
 */
async function loadBackupTracking() {
    try {
        if (!directoryHandle) {
            throw new Error('Kein Verzeichnis ausgewählt');
        }

        const backupTrackingHandle = await directoryHandle.getFileHandle('backup.json');
        const file = await backupTrackingHandle.getFile();
        const contents = await file.text();
        
        if (!contents.trim()) {
            return {};
        }
        
        return JSON.parse(contents);
    } catch (error) {
        if (error.name === 'NotFoundError') {
            return {}; // No backups yet
        }
        throw new Error(`Fehler beim Laden der Backup-Informationen: ${error.message}`);
    }
}

/**
 * Restores a backup file by copying it to the main data directory
 * @param {string} backupPath - Path to the backup file (e.g., "backups/2026-03-20/belegung-station-143022.json")
 * @param {string} targetFileName - Name of the target file to restore to (e.g., "belegung-station.json")
 * @returns {Promise<boolean>} Success status
 */
async function restoreBackup(backupPath, targetFileName) {
    try {
        if (!directoryHandle) {
            throw new Error('Kein Verzeichnis ausgewählt');
        }

        // Check write permission
        if (!(await verifyPermission(directoryHandle, true))) {
            throw new Error('Keine Schreibberechtigung für das Verzeichnis');
        }

        // Parse the backup path (e.g., "backups/2026-03-20/belegung-station-143022.json")
        const pathParts = backupPath.split('/');
        if (pathParts.length !== 3) {
            throw new Error('Ungültiger Backup-Pfad');
        }

        const [backupDir, dateDir, backupFileName] = pathParts;

        // Navigate to the backup file
        const backupDirHandle = await directoryHandle.getDirectoryHandle(backupDir);
        const dateDirHandle = await backupDirHandle.getDirectoryHandle(dateDir);
        const backupFileHandle = await dateDirHandle.getFileHandle(backupFileName);
        
        // Read backup file contents
        const backupFile = await backupFileHandle.getFile();
        const backupContents = await backupFile.text();

        // Ensure target file name has .json extension
        const targetFile = targetFileName.endsWith('.json') ? targetFileName : `${targetFileName}.json`;

        // Write to the main data file (this will trigger a new backup via saveFile)
        // We use ignoreBackup=true to avoid creating a backup of the restore operation
        const targetFileHandle = await directoryHandle.getFileHandle(targetFile, { create: true });
        const writable = await targetFileHandle.createWritable();

        try {
            await writable.write(backupContents);
            await writable.close();
            return true;
        } catch (error) {
            await writable.close().catch(() => {});
            throw error;
        }
    } catch (error) {
        throw new Error(`Fehler beim Wiederherstellen der Datei: ${error.message}`);
    }
}

async function loadData(dataName, fileName) {
    if (!fileName) fileName = dataName;

    window[dataName] = await loadFile(fileName);
    setOriginalData(dataName);
}