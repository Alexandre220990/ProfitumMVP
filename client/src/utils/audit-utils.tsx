// Extending auditTypes with more audits
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
  CII: {
    title: "Audit CII",
    currentStep: 2,
    experts: [
      {
        id: 2,
        name: "Expert CII",
        speciality: "Crédit d'Impôt Innovation",
        experience: "8 ans d'expérience en CII",
        compensation: 25,
      },
    ],
  },
  CIR: {
    title: "Audit CIR",
    currentStep: 3,
    experts: [
      {
        id: 3,
        name: "Expert CIR",
        speciality: "Crédit d'Impôt Recherche",
        experience: "15 ans d'expérience en CIR",
        compensation: 35,
      },
    ],
  },
  Foncier: {
    title: "Audit Foncier",
    currentStep: 4,
    experts: [
      {
        id: 4,
        name: "Expert Foncier",
        speciality: "Fiscalité Foncière",
        experience: "20 ans d'expérience en gestion fiscale foncière",
        compensation: 28,
      },
    ],
  },
  URSSAF: {
    title: "Audit URSSAF",
    currentStep: 5,
    experts: [
      {
        id: 5,
        name: "Expert URSSAF",
        speciality: "Cotisations et Contributions Sociales",
        experience: "12 ans d'expérience en URSSAF",
        compensation: 32,
      },
    ],
  },
  DFS: {
    title: "Audit DFS",
    currentStep: 6,
    experts: [
      {
        id: 6,
        name: "Expert DFS",
        speciality: "Développement et Financement des Sociétés",
        experience: "18 ans d'expérience en financement d'entreprise",
        compensation: 30,
      },
    ],
  },
};

// Customizing getTimeSlots with start time, end time, and slot duration
export const getTimeSlots = (startTime = 9, endTime = 17, duration = 30) => {
  const slots = [];
  for (let hour = startTime; hour < endTime; hour++) {
    for (let minutes = 0; minutes < 60; minutes += duration) {
      const formattedTime = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      slots.push(formattedTime);
    }
  }
  return slots;
};

// Example usage
console.log(auditTypes); // Now includes multiple audits (TICPE, CII, CIR, Foncier, URSSAF, DFS)
console.log(getTimeSlots(8, 18, 15)); // Custom time slots from 8:00 AM to 6:00 PM with 15-minute intervals
console.log(getTimeSlots(9, 12, 45)); // Custom time slots from 9:00 AM to 12:00 PM with 45-minute intervals
