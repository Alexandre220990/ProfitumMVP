export const auditTypes = {
    TICPE: {
        title: "Audit TICPE",
        currentStep: 1,
        experts: [
            {
                id: 1,
                name: "Expert TICPE",
                speciality: "Fiscalité des Carburants",
                experience: "10 ans d'expérience en optimisation TICPE",
                compensation: 30,
            },
        ],
    },
};
export const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
        for (let minutes = 0; minutes < 60; minutes += 30) {
            slots.push(`${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        }
    }
    return slots;
};
