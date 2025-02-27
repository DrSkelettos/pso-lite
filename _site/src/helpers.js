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

function getCalendarWeek(date) {
    // Copy date to avoid modifying the original
    const target = new Date(date.valueOf());
    
    // Find Thursday of this week starting on Monday
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    
    // Get first Thursday of the year
    const firstThursday = new Date(target.getFullYear(), 0, 1);
    if (firstThursday.getDay() !== 4) {
        firstThursday.setMonth(0, 1 + ((4 - firstThursday.getDay()) + 7) % 7);
    }
    
    // Get week number
    const weekNr = 1 + Math.ceil((target - firstThursday) / (7 * 24 * 60 * 60 * 1000));
    
    return weekNr;
}
