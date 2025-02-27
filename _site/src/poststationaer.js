function fillPoststationaerTable() {
    const table = document.getElementById('poststationaerTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = ''; // Clear existing rows

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    Object.entries(poststationaer).forEach(([id, entry]) => {
        // Parse the German date format DD.MM.YYYY
        const [day, month, year] = entry.end.split('.');
        const endDate = new Date(year, month - 1, day); // month is 0-based
        endDate.setHours(0, 0, 0, 0);

        if (endDate >= today) {
            const row = document.createElement('tr');
            row.className = "text-center";
            
            // Name column
            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name;
            nameCell.className = "text-start";
            row.appendChild(nameCell);

            // Properties columns (gr, mt, gt, kt)
            ['gr', 'mt', 'gt', 'kt'].forEach(prop => {
                const cell = document.createElement('td');
                cell.textContent = entry[prop] || ''; // Use empty string if property doesn't exist
                row.appendChild(cell);
            });

            // End date column
            const dateCell = document.createElement('td');
            dateCell.textContent = entry.end;
            row.appendChild(dateCell);

            tbody.appendChild(row);
        }
    });
}