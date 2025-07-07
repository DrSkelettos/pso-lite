function initCalendar() {
    var calendarEl = document.getElementById('calendar');
    window['calendar'] = new FullCalendar.Calendar(calendarEl, {
        // View setup
        initialView: 'twoWeekGrid',
        views: {
            twoWeekGrid: {
                type: 'dayGrid',
                duration: { weeks: 2 },
            }
        },

        // Hide all navigation/header
        headerToolbar: false,
        footerToolbar: false,

        // Start weeks on Monday
        firstDay: 1,

        // Show week numbers
        weekNumbers: true,
        weekNumberContent: function (arg) {
            return { html: 'KW ' + arg.num };
        },
        // Localization
        locale: 'de',

        // Styling
        themeSystem: 'bootstrap5',

        height: 300, // sets the height in pixels

        // Set range to current + next week
        visibleRange: function (currentDate) {
            const start = currentDate.clone().startOf('isoWeek'); // Monday
            const end = start.clone().add(2, 'weeks');
            return { start: start, end: end };
        },
    });
    calendar.render();
};

const colors = {
    admission: '#ffc107',
    admission_text: '#000',
    discharge: '#198754',
    discharge_text: '#fff',
    absence: '#6c757d',
    absence_text: '#fff'
}

function updateCalendar() {
    // Initialize or update calendar
    if (!window['calendar']) return;

    // Get current date and set to start of week (Monday)
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for weeks starting on Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + daysToMonday);
    monday.setHours(0, 0, 0, 0);


    // Process employees and their absences
    for (const [id, employee] of Object.entries(window['employees'] || {})) {
        if (employee.absences) {
            for (const absence of employee.absences) {
                if (absence.start && absence.end) {
                    try {
                        // Parse dates (format: DD.MM.YYYY)
                        const [startDay, startMonth, startYear] = absence.start.split('.').map(Number);
                        const [endDay, endMonth, endYear] = absence.end.split('.').map(Number);

                        const startDate = new Date(startYear, startMonth - 1, startDay);
                        const endDate = new Date(endYear, endMonth - 1, endDay);

                        // Add one day to end date to make it inclusive
                        endDate.setDate(endDate.getDate() + 1);

                        // Determine absence type and styling
                        let title = `${employee.name || 'Mitarbeiter'}`;
                        let backgroundColor = colors.absence;

                        if (absence.reason) {
                            title += ` (${absence.reason})`;
                            // Color code by reason
                            const reason = absence.reason.toLowerCase();
                            if (reason.includes('urlaub')) {
                                backgroundColor = '#198754'; // Green for vacation
                            } else if (reason.includes('krank')) {
                                backgroundColor = '#dc3545'; // Red for sick leave
                            } else if (reason.includes('fortbildung') || reason.includes('schulung')) {
                                backgroundColor = '#ffc107'; // Yellow for training
                                textColor = '#000';
                            } else if (reason.includes('dienstreise')) {
                                backgroundColor = '#0dcaf0'; // Blue for business trips
                                textColor = '#000';
                            }
                        }

                        window['calendar'].addEvent({
                            title: title,
                            start: startDate.toISOString().split('T')[0],
                            end: endDate.toISOString().split('T')[0],
                            allDay: true,
                            backgroundColor: backgroundColor,
                            borderColor: backgroundColor,
                            textColor: '#fff',
                            extendedProps: {
                                type: 'absence',
                                employee: employee.name,
                                reason: absence.reason || 'Abwesenheit'
                            },
                            className: 'absence-event'
                        });

                    } catch (error) {
                        console.error('Error processing absence:', error);
                    }
                }
            }
        }
    }

    // Check if patients data exists
    const patients = window['patients-station'] || [];

    // Process each patient
    for (const [id, patient] of Object.entries(patients)) {

        // AUFNAHME
        if (patient.admission) {
            // Parse admission date (format: DD.MM.YYYY)
            const [day, month, year] = patient.admission.split('.').map(Number);
            const admissionDate = new Date(year, month - 1, day);

            const employee = patient.employees[0].employee;

            window['calendar'].addEvent({
                title: `A: ${patient.name || 'Unbekannt'} (${patient.group} / ${employee})`,
                start: admissionDate.toISOString().split('T')[0],
                allDay: true,
                backgroundColor: colors.admission,
                borderColor: colors.admission,
                textColor: colors.admission_text,
                extendedProps: {
                    type: 'admission'
                }
            });
        }

        // ENTLASSUNG
        if (patient.discharge) {
            // Parse admission date (format: DD.MM.YYYY)
            const [day, month, year] = patient.discharge.split('.').map(Number);
            const admissionDate = new Date(year, month - 1, day);

            const employee = patient.employees[0].employee;

            window['calendar'].addEvent({
                title: `E: ${patient.name || 'Unbekannt'}`,
                start: admissionDate.toISOString().split('T')[0],
                allDay: true,
                backgroundColor: colors.discharge,
                borderColor: colors.discharge,
                textColor: colors.discharge_text,
                extendedProps: {
                    type: 'discharge'
                }
            });
        }
    }
}