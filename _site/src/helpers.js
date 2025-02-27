
function formatGermanToISODate(germanDate) {
    const [day, month, year] = germanDate.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function formatISOToGermanDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${parseInt(day)}.${parseInt(month)}.${year}`;
}

function parseGermanDate(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('.');
    return new Date(year, month - 1, day);
}
