/**
 * Announcements helper functions for station announcements feature
 */

/**
 * Calculate the announcement date for an absence
 * - 1-3 days absence: announce 2 Sundays before
 * - 4+ days absence: announce 3 Sundays before
 * @param {Date} startDate - Start date of the absence
 * @param {Date} endDate - End date of the absence
 * @returns {Date} - The Sunday to announce
 */
function calculateAnnouncementDate(startDate, endDate) {
    const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const weeksBeforeAnnouncement = days <= 3 ? 2 : 3;

    // Find the Monday of the week containing the start date
    const startDayOfWeek = startDate.getDay();
    const mondayOffset = startDayOfWeek === 0 ? -6 : -(startDayOfWeek - 1);
    const weekMonday = new Date(startDate);
    weekMonday.setDate(startDate.getDate() + mondayOffset);

    // Go back the required number of weeks and find the Sunday
    const announcementSunday = new Date(weekMonday);
    announcementSunday.setDate(weekMonday.getDate() - (weeksBeforeAnnouncement * 7) + 6);

    return announcementSunday;
}

/**
 * Format date range for announcement text
 * @param {string} startDateStr - Start date in German format (DD.MM.YYYY)
 * @param {string} endDateStr - End date in German format (DD.MM.YYYY)
 * @returns {string} - Formatted date string
 */
function formatAnnouncementDateRange(startDateStr, endDateStr) {
    const startDate = parseGermanDate(startDateStr);
    const endDate = parseGermanDate(endDateStr);
    const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 2) {
        // Single day format: "am 12.12.2025"
        if (startDateStr === endDateStr) {
            return `am ${startDateStr}`;
        }
        // Two days: "am 12.12.2025 und 13.12.2025"
        return `am ${startDateStr} und ${endDateStr}`;
    } else {
        // Range format: "vom 12.12.2025 bis zum 16.12.2025"
        return `vom ${startDateStr} bis zum ${endDateStr}`;
    }
}

/**
 * Generate announcement content from employee template
 * @param {string} employeeKey - Employee key
 * @param {string} startDateStr - Start date in German format
 * @param {string} endDateStr - End date in German format
 * @returns {string} - Generated announcement text
 */
function generateAnnouncementContent(employeeKey, startDateStr, endDateStr) {
    const employee = window['employees'][employeeKey];
    if (!employee) return '';

    const startDate = parseGermanDate(startDateStr);
    const endDate = parseGermanDate(endDateStr);
    const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Use short text for 1-2 days, long text for 3+ days
    const template = days <= 2 ? employee.announcementTextShort : employee.announcementTextLong;
    if (!template) return '';

    const dateText = formatAnnouncementDateRange(startDateStr, endDateStr);
    return template.replace(/\[DATUM\]/g, dateText).replace(/\[NAME\]/g, employee.name);
}

/**
 * Add or update an announcement entry
 * @param {string} announcementDateStr - Announcement date in German format (DD.MM.YYYY)
 * @param {Object} entry - Announcement entry object
 */
function addAnnouncementEntry(announcementDateStr, entry) {
    if (!window['announcements-station']) {
        window['announcements-station'] = {};
    }

    if (!window['announcements-station'][announcementDateStr]) {
        window['announcements-station'][announcementDateStr] = [];
    }

    // Check if entry already exists for this employee and date range
    const existingIndex = window['announcements-station'][announcementDateStr].findIndex(
        e => e.employee === entry.employee && e.start_date === entry.start_date && e.end_date === entry.end_date
    );

    if (existingIndex >= 0) {
        // Update existing entry
        window['announcements-station'][announcementDateStr][existingIndex] = entry;
    } else {
        // Add new entry
        window['announcements-station'][announcementDateStr].push(entry);
    }
}

/**
 * Remove an announcement entry
 * @param {string} announcementDateStr - Announcement date in German format
 * @param {number} index - Index of the entry to remove
 */
function removeAnnouncementEntry(announcementDateStr, index) {
    if (!window['announcements-station']?.[announcementDateStr]) return;

    window['announcements-station'][announcementDateStr].splice(index, 1);

    // Remove the date key if no entries left
    if (window['announcements-station'][announcementDateStr].length === 0) {
        delete window['announcements-station'][announcementDateStr];
    }
}

/**
 * Remove announcement entries for a specific employee and date range
 * @param {string} announcementDateStr - Announcement date in German format
 * @param {string} employeeKey - Employee key
 * @param {string} startDate - Start date in German format
 * @param {string} endDate - End date in German format
 */
function removeAnnouncementEntriesForEmployee(announcementDateStr, employeeKey, startDate, endDate) {
    if (!window['announcements-station']?.[announcementDateStr]) return;

    // Find and remove matching entries
    const entries = window['announcements-station'][announcementDateStr];
    for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].employee === employeeKey && 
            entries[i].start_date === startDate && 
            entries[i].end_date === endDate) {
            entries.splice(i, 1);
        }
    }

    // Remove the date array if empty
    if (window['announcements-station'][announcementDateStr].length === 0) {
        delete window['announcements-station'][announcementDateStr];
    }
}

/**
 * Get all Sundays for a given year
 * @param {number} year - The year
 * @returns {Date[]} - Array of Sunday dates
 */
function getSundaysForYear(year) {
    const sundays = [];
    const date = new Date(year, 0, 1);

    // Find first Sunday
    while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1);
    }

    // Collect all Sundays
    while (date.getFullYear() === year) {
        sundays.push(new Date(date));
        date.setDate(date.getDate() + 7);
    }

    return sundays;
}

/**
 * Format a Date object to German date string (DD.MM.YYYY)
 * @param {Date} date - The date
 * @returns {string} - German date string
 */
function formatDateToGerman(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Get German weekday abbreviation
 * @param {Date} date - The date
 * @returns {string} - German weekday abbreviation with period
 */
function getGermanWeekdayAbbr(date) {
    const weekdays = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
    return weekdays[date.getDay()];
}

/**
 * Get the next announcement Sunday from today
 * @returns {Date} - Next Sunday date
 */
function getNextAnnouncementSunday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    return nextSunday;
}

/**
 * Count unchecked announcements for a given date
 * @param {string} dateStr - Date in German format
 * @returns {number} - Number of unchecked announcements
 */
function countUncheckedAnnouncements(dateStr) {
    const entries = window['announcements-station']?.[dateStr] || [];
    const user = window['user'];
    
    if (!user) return 0;
    
    // If user can edit all announcements, count all unchecked
    if (user.rights?.editAllAnnouncementsStation) {
        return entries.filter(e => !e.checked).length;
    }
    
    // If user can only edit own announcements, count only their own unchecked
    if (user.rights?.editOwnAnnouncementsStation) {
        return entries.filter(e => !e.checked && e.employee === user.key).length;
    }
    
    // If user has no edit rights, count none
    return 0;
}

/**
 * Check if user can edit an announcement entry
 * @param {Object} entry - Announcement entry
 * @returns {boolean} - True if user can edit
 */
function canEditAnnouncement(entry) {
    const user = window['user'];
    if (!user) return false;

    // Can edit all announcements
    if (user.rights?.editAllAnnouncementsStation) return true;

    // Can edit own announcements (employee key matches user key)
    if (user.rights?.editOwnAnnouncementsStation && entry.employee === user.key) return true;

    return false;
}

/**
 * Check if user can edit the announcement date
 * @returns {boolean} - True if user can edit date
 */
function canEditAnnouncementDate() {
    return window['user']?.rights?.editAllAnnouncementsStation ?? false;
}

/**
 * Check if user has only view rights (no edit rights)
 * @returns {boolean} - True if user has only view rights
 */
function hasOnlyViewAnnouncementRights() {
    const user = window['user'];
    if (!user) return false;

    return user.rights?.viewAnnouncementsStation &&
        !user.rights?.editOwnAnnouncementsStation &&
        !user.rights?.editAllAnnouncementsStation;
}

/**
 * Get all announcement dates (including non-Sundays)
 * @returns {string[]} - Array of date strings in German format
 */
function getAllAnnouncementDates() {
    if (!window['announcements-station']) return [];
    return Object.keys(window['announcements-station']).sort((a, b) => {
        return parseGermanDate(a) - parseGermanDate(b);
    });
}

/**
 * Get non-Sunday announcement dates
 * @returns {string[]} - Array of date strings that are not Sundays
 */
function getNonSundayAnnouncementDates() {
    return getAllAnnouncementDates().filter(dateStr => {
        const date = parseGermanDate(dateStr);
        return date.getDay() !== 0;
    });
}

/**
 * Group Sundays by month
 * @param {Date[]} sundays - Array of Sunday dates
 * @returns {Object} - Object with month keys and Sunday arrays
 */
function groupSundaysByMonth(sundays) {
    const months = {};
    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    sundays.forEach(sunday => {
        const monthKey = `${monthNames[sunday.getMonth()]} ${sunday.getFullYear()}`;
        if (!months[monthKey]) {
            months[monthKey] = [];
        }
        months[monthKey].push(sunday);
    });

    return months;
}

/**
 * Save announcements data
 */
async function saveAnnouncementsData() {
    await saveData('announcements-station', 'ankuendigungen-station');
}
