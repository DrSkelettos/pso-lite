// Initialize the application
async function init(pageName = null, dir = './') {
    if (!('showDirectoryPicker' in window)) {
        alert('Ihr Browser unterstützt die Verzeichnisauswahl nicht. Bitte verwenden Sie einen modernen Browser wie Chrome oder Edge.');
        return;
    }

    if (pageName === 'Datenauswahl') return;

    try {
        await initDB();
        const savedHandle = await getDirectoryHandle();

        if (savedHandle) {
            // Try to use the saved handle without immediately requesting permission
            try {
                // Check if we already have permission
                const permission = await savedHandle.queryPermission({ mode: 'read' });
                
                if (permission === 'granted') {
                    directoryHandle = savedHandle;
                    window.dispatchEvent(new Event('directoryHandleInitialized'));
                    return;
                }
                // If we don't have permission, we'll need the user to explicitly request it
            } catch (error) {
                console.log('Error checking permission:', error);
                // Continue to redirect to data selection
            }
        }
        
        // If we get here, either no handle was saved or we don't have permission
        location.href = dir + "sites/datenauswahl/index.html";
    } catch (error) {
        console.error('Initialization error:', error);
        // Don't show an alert here as it might be shown on page load
    }
}