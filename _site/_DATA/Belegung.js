const patients = {
    1: {
        name: "Fr. Müller",
        group: "1-A",
        admission: "01.01.2025",
        discharge: "01.05.2025",
        employees: [
            { employee: "LS", start: "01.01.2025" },
            { employee: "CP", start: "01.03.2025", end: "14.03.2025" }
        ],
        rooms: [
            { room: "103-T", start: "01.01.2025", end: "02.03.2025" },
            { room: "104-F", start: "02.03.2025" }
        ]
    },
    2: {
        name: "Fr. Schmidt",
        group: "1-B",
        admission: "01.02.2025",
        discharge: "28.02.2025",
        discharge_mode: "p GR; au/WE",
        employees: [
            { employee: "Sa", start: "01.02.2025" },
            { employee: "LS", start: "25.02.2025", end: "02.03.2025" }
        ],
        rooms: [
            { room: "103-F", start: "01.02.2025" }
        ]
    },
    3: {
        name: "Hr. Meier",
        group: "2-A",
        admission: "26.02.2025",
        employees: [
            { employee: "Em", start: "26.02.2025" }
        ],
        rooms: [
            { room: "104-F", start: "26.02.2025" }
        ]
    },
    4: {
        name: "Hr. Westernhagen",
        group: "3-A",
        admission: "16.02.2025",
        misc: "XXL",
        employees: [
            { employee: "LS", start: "16.02.2025" }
        ],
        rooms: [
            { room: "116-T", start: "16.02.2025" }
        ]
    },
    5: {
        name: "Hr. Mustermann",
        group: "3-B",
        admission: "24.02.2025",
        employees: [
            { employee: "Em", start: "24.02.2025" }
        ],
        rooms: [
            { room: "109-F", start: "24.02.2025" }
        ]
    }
}