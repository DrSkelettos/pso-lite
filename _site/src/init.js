

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
                window.dispatchEvent(new Event('directoryHandleInitialized'));
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