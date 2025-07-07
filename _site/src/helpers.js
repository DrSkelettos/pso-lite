function formatGermanToISODate(germanDate) {
    const [day, month, year] = germanDate.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function formatISOToGermanDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
}

function parseGermanDate(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('.');
    return new Date(year, month - 1, day);
}

function getCalendarWeek(date) {
    // Copy date to avoid modifying the original
    const target = normalizeToMidnight(new Date(date.valueOf()));

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

function getEmployeeAbsences(filterDate = new Date()) {
    const allAbsences = [];

    Object.entries(window['employees']).forEach(([empKey, employee]) => {
        if (!employee.absences) return;

        employee.absences.forEach(absence => {
            const startDate = parseGermanDate(absence.start);
            const endDate = parseGermanDate(absence.end);
            const announcementDate = absence.announcement ? parseGermanDate(absence.announcement) : null;

            // Only include absences that haven't ended yet
            if (endDate >= filterDate) {
                allAbsences.push({
                    employeeName: employee.name,
                    startDate,
                    endDate,
                    announcementDate,
                    planned: absence.planned,
                    isCurrent: startDate <= filterDate && endDate >= filterDate
                });
            }
        });
    });

    // Sort by start date
    return allAbsences.sort((a, b) => a.startDate - b.startDate);
}

function formatAbsenceForDisplay(absence) {
    return {
        name: absence.employeeName,
        start: formatDateWithWeekday(absence.startDate),
        end: formatDateWithWeekday(absence.endDate),
        duration: formatDuration(absence.startDate, absence.endDate),
        week: formatWeekSpan(absence.startDate, absence.endDate),
        announcement: formatAnnouncementDate(absence.announcementDate),
        isCurrent: absence.isCurrent,
        planned: absence.planned
    };
}

function normalizeToMidnight(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
}

function isDateInCurrentWeek(dateStr) {
    if (!dateStr) return false;

    const date = parseGermanDate(dateStr);
    const now = normalizeToMidnight(new Date());

    // Get calendar weeks
    const dateWeek = getCalendarWeek(date);
    const currentWeek = getCalendarWeek(now);

    return dateWeek === currentWeek;
}

/**
 * Calculates the week number for a patient based on admission date and a reference date.
 * A new week always begins on Monday.
 * 
 * @param {string} admissionDateStr - Admission date in German format (DD.MM.YYYY)
 * @param {Date} referenceDate - Date to compare against (defaults to current date)
 * @returns {string} - Week number as a string, or empty string if admission is in the future
 */
function calculatePatientWeek(admissionDateStr, referenceDate = new Date()) {
    if (!admissionDateStr) return '';

    // Parse the German date format DD.MM.YYYY
    const admission = parseGermanDate(admissionDateStr);

    // If admission is in the future, return empty
    if (admission > referenceDate) return '';

    // Get the day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const admissionDayOfWeek = admission.getDay();

    // Find the Monday of the admission week
    // If admission is on Monday (1), offset is 0
    // If admission is on Sunday (0), offset is -6 (previous Monday)
    // For other days, we go back to the most recent Monday
    const mondayOffset = admissionDayOfWeek === 0 ? -6 : -(admissionDayOfWeek - 1);

    const admissionWeekMonday = new Date(admission);
    admissionWeekMonday.setDate(admission.getDate() + mondayOffset);

    // Set both dates to midnight for accurate day calculation
    const normalizedReference = normalizeToMidnight(new Date(referenceDate));
    const normalizedAdmissionMonday = normalizeToMidnight(admissionWeekMonday);

    // Calculate the number of days between the Monday of admission week and reference date
    const daysDifference = Math.floor((normalizedReference - normalizedAdmissionMonday) / (24 * 60 * 60 * 1000));

    // Calculate the week number (1-based)
    // Week 1 is the week containing the admission date
    // Week 2 starts on the first Monday after admission week, and so on
    const weekNumber = Math.floor(daysDifference / 7) + 1;

    return weekNumber.toString();
}

function showIfAuthorized(elementSelector, right) {
    const elements = document.querySelectorAll(elementSelector);
    if (!elements) return;

    elements.forEach(element => {
        element.classList.toggle('hidden', !authorize(right));
    });
}

function authorize(right) {
    return window['user']?.['rights']?.[right] ?? false;
}