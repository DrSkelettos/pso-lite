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

function getWeekdayShort(date) {
    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return weekdays[date.getDay()];
}

function formatDateWithWeekday(date) {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${getWeekdayShort(date)} ${day}.${month}.`;
}

function formatDuration(startDate, endDate) {
    if (!startDate || !endDate) return '';
    
    const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    if (days < 7) return `${days} Tag${days > 1 ? 'e' : ''}`;
    if (days === 7) return '1 Woche';
    if (days < 14) return `1 Woche ${days - 7} Tag${days - 7 > 1 ? 'e' : ''}`;
    return `${Math.round(days / 7)} Wochen`;
}

function formatWeekSpan(startDate, endDate) {
    if (!startDate || !endDate) return '';
    
    const startWeek = getCalendarWeek(startDate);
    const endWeek = getCalendarWeek(endDate);
    
    return startWeek === endWeek ? 
        `${startWeek}` : 
        `${startWeek} bis ${endWeek}`;
}

function formatAnnouncementDate(date) {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}.`;
}
