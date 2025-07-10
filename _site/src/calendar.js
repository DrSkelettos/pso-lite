
const eventMouseEnter = function (info) {
    const eventId = info.event.id;
    if (eventId.startsWith('event_') && !info.event.allDay) {
        const event = info.event;
        const startStr = event.start.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const endStr = event.end ? event.end.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

        const tooltip = document.createElement('div');
        tooltip.className = 'event-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-arrow"></div>
            <div class="tooltip-inner">
                ${startStr} - ${endStr || 'Kein Ende'}
            </div>
        `;

        document.body.appendChild(tooltip);

        const rect = info.el.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
        info.el._tooltip = tooltip;
    }
};

const eventMouseLeave = function (info) {
    const eventId = info.event.id;
    if (eventId.startsWith('event_') && info.el._tooltip) {
        document.body.removeChild(info.el._tooltip);
        info.el._tooltip = null;
    }
};


function initCalendarDashboard() {
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

        weekends: false,

        // Show week numbers
        weekNumbers: true,
        weekNumberContent: function (arg) {
            return { html: 'KW ' + arg.num };
        },
        // Localization
        locale: 'de',

        // Styling
        themeSystem: 'bootstrap5',

        height: 'auto', // sets the height in pixels

        // Set range to current + next week
        visibleRange: function (currentDate) {
            const start = currentDate.clone().startOf('isoWeek'); // Monday
            const end = start.clone().add(2, 'weeks');
            return { start: start, end: end };
        },

        eventMouseEnter: eventMouseEnter,
        eventMouseLeave: eventMouseLeave,
    });
    calendar.render();
};

function initCalendar() {
    var calendarEl = document.getElementById('calendar');
    window['calendar'] = new FullCalendar.Calendar(calendarEl, {
        // View setup
        initialView: 'dayGridMonth',

        // Start weeks on Monday
        firstDay: 1,
        weekends: false,

        // Show week numbers
        weekNumbers: true,
        weekNumberContent: function (arg) {
            return { html: 'KW ' + arg.num };
        },
        // Localization
        locale: 'de',

        // Styling
        themeSystem: 'bootstrap5',
        height: 'auto',
        buttonText: {
            today: 'Heute',
        },
        headerToolbar: {
            left: 'title',
            right: 'today prev,next',
        },

        // Event click handler
        eventClick: function (info) {
            const eventId = info.event.id;
            if (eventId.startsWith('event_') && authorize('editEvents')) {
                openEditEvent(eventId);
            }
        },

        eventMouseEnter: eventMouseEnter,
        eventMouseLeave: eventMouseLeave,
    });
    calendar.render();

    if (authorize('editEvents')) {
        const addEventButton = document.createElement('button');
        addEventButton.textContent = 'Termin hinzufügen';
        addEventButton.classList.add('btn', 'btn-dark');
        addEventButton.setAttribute('data-bs-toggle', 'modal');
        addEventButton.setAttribute('data-bs-target', '#addEventModal');
        document.querySelector('.fc-header-toolbar').lastChild.prepend(addEventButton);
    }
};

const colors = {
    admission: '#ffc107',
    admission_text: '#000',
    discharge: '#198754',
    discharge_text: '#fff',
    absence: '#ced4da',
    absence_text: '#000',
    primary: '#0d6efd',
    primary_text: '#fff',
    secondary: '#6c757d',
    secondary_text: '#fff',
    success: '#198754',
    success_text: '#fff',
    danger: '#dc3545',
    danger_text: '#fff',
    warning: '#ffc107',
    warning_text: '#000',
    info: '#0dcaf0',
    info_text: '#000',
    light: '#f8f9fa',
    light_text: '#000',
    dark: '#343a40',
    dark_text: '#fff',
    blue: '#0d6efd',
    blue_text: '#fff',
    indigo: '#6610f2',
    indigo_text: '#fff',
    purple: '#6f42c1',
    purple_text: '#fff',
    pink: '#d63384',
    pink_text: '#fff',
    red: '#dc3545',
    red_text: '#fff',
    orange: '#fd7e14',
    orange_text: '#fff',
    yellow: '#ffc107',
    yellow_text: '#000',
    green: '#198754',
    green_text: '#fff',
    teal: '#20c997',
    teal_text: '#fff',
    cyan: '#0dcaf0',
    cyan_text: '#fff',
    black: '#000',
    black_text: '#fff',
}

function updateCalendar() {
    // Initialize or update calendar
    if (!window['calendar']) return;

    // Clear calendar
    window['calendar'].removeAllEvents();

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
                            start: formatDateForCalendar(absence.start),
                            end: formatDateForCalendar(absence.end),
                            allDay: true,
                            backgroundColor: colors.absence,
                            borderColor: colors.absence,
                            textColor: colors.absence_text,
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
        if (patient.name === '' || patient.name === null || patient.name === undefined || patient.name === 'X') continue;

        // AUFNAHME
        if (patient.admission) {
            const employee = patient.employees[0].employee;
            window['calendar'].addEvent({
                title: `A: ${patient.name || 'Unbekannt'} (${patient.group} / ${employee})`,
                start: formatDateForCalendar(patient.admission),
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
            window['calendar'].addEvent({
                title: `E: ${patient.name || 'Unbekannt'}`,
                start: formatDateForCalendar(patient.discharge),
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

    // Add events from window['events']
    for (const [id, listEvent] of Object.entries(window['events'] || {})) {
        const event = {
            id: id,
            title: listEvent.title,
            start: listEvent.start,
            end: listEvent.end,
            allDay: listEvent.allDay,
            backgroundColor: colors[listEvent.color],
            borderColor: colors[listEvent.color],
            textColor: colors[listEvent.color + '_text'],
        };
        window['calendar'].addEvent(event);
    }
}
