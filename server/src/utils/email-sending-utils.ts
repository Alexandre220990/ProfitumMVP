/**
 * Utilitaires pour l'envoi d'emails de prospection
 * Protection contre le blacklistage : randomisation, heures de travail, rate limiting
 */

/**
 * Génère un délai aléatoire en millisecondes entre min et max
 */
export function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Vérifie si une date/heure est dans les heures de travail (9h-18h, lundi-vendredi)
 * @param date Date à vérifier
 * @param timezone Timezone (défaut: Europe/Paris)
 * @returns true si dans les heures de travail
 */
export function isBusinessHours(date: Date, timezone: string = 'Europe/Paris'): boolean {
  // Convertir en heure locale de la timezone
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  
  const dayOfWeek = localDate.getDay(); // 0 = dimanche, 6 = samedi
  const hour = localDate.getHours();
  
  // Pas le weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // Entre 9h et 18h
  return hour >= 9 && hour < 18;
}

/**
 * Ajuste une date pour qu'elle soit dans les heures de travail
 * Si la date est en dehors, la décale au prochain créneau disponible
 * @param date Date à ajuster
 * @param timezone Timezone (défaut: Europe/Paris)
 * @returns Date ajustée dans les heures de travail
 */
export function adjustToBusinessHours(date: Date, timezone: string = 'Europe/Paris'): Date {
  const adjustedDate = new Date(date);
  const localDate = new Date(adjustedDate.toLocaleString('en-US', { timeZone: timezone }));
  
  let dayOfWeek = localDate.getDay();
  let hour = localDate.getHours();
  
  // Si c'est le weekend, décaler au lundi 9h
  if (dayOfWeek === 0) {
    // Dimanche -> lundi 9h
    adjustedDate.setDate(adjustedDate.getDate() + 1);
    adjustedDate.setHours(9, 0, 0, 0);
    return adjustedDate;
  } else if (dayOfWeek === 6) {
    // Samedi -> lundi 9h
    adjustedDate.setDate(adjustedDate.getDate() + 2);
    adjustedDate.setHours(9, 0, 0, 0);
    return adjustedDate;
  }
  
  // Si avant 9h, décaler à 9h
  if (hour < 9) {
    adjustedDate.setHours(9, 0, 0, 0);
    return adjustedDate;
  }
  
  // Si après 18h, décaler au lendemain 9h
  if (hour >= 18) {
    adjustedDate.setDate(adjustedDate.getDate() + 1);
    adjustedDate.setHours(9, 0, 0, 0);
    
    // Vérifier si le lendemain n'est pas le weekend
    const nextDay = new Date(adjustedDate.toLocaleString('en-US', { timeZone: timezone }));
    if (nextDay.getDay() === 0) {
      // Si c'est dimanche, passer au lundi
      adjustedDate.setDate(adjustedDate.getDate() + 1);
    } else if (nextDay.getDay() === 6) {
      // Si c'est samedi, passer au lundi
      adjustedDate.setDate(adjustedDate.getDate() + 2);
    }
    
    return adjustedDate;
  }
  
  return adjustedDate;
}

/**
 * Ajoute une randomisation à une date programmée (0 à 2 heures aléatoires)
 * Pour éviter que tous les emails programmés partent exactement à la même heure
 * @param date Date de base
 * @param maxRandomHours Heures maximum de randomisation (défaut: 2)
 * @returns Date avec randomisation, ajustée aux heures de travail
 */
export function addRandomizationToScheduledDate(
  date: Date, 
  maxRandomHours: number = 2
): Date {
  // Ajouter 0 à maxRandomHours heures aléatoires
  const randomMinutes = Math.floor(Math.random() * maxRandomHours * 60);
  const randomizedDate = new Date(date.getTime() + randomMinutes * 60 * 1000);
  
  // Ajuster aux heures de travail
  return adjustToBusinessHours(randomizedDate);
}

/**
 * Calcule le délai aléatoire entre deux envois d'emails
 * Pour un comportement plus humain : 30-120 secondes
 * @returns Délai en millisecondes
 */
export function getRandomEmailDelay(): number {
  // Entre 30 et 120 secondes (30000ms à 120000ms)
  return randomDelay(30000, 120000);
}

/**
 * Vérifie si on peut envoyer un email maintenant selon le rate limiting
 * @param emailsSentInLastHour Nombre d'emails envoyés dans la dernière heure
 * @param maxPerHour Maximum d'emails par heure (défaut: 12)
 * @returns true si on peut envoyer
 */
export function canSendEmail(emailsSentInLastHour: number, maxPerHour: number = 12): boolean {
  return emailsSentInLastHour < maxPerHour;
}

/**
 * Calcule le nombre d'emails envoyés dans la dernière heure
 * À utiliser avec une requête SQL ou un compteur en mémoire
 * @param sentAtDates Tableau de dates d'envoi
 * @returns Nombre d'emails dans la dernière heure
 */
export function countEmailsInLastHour(sentAtDates: Date[]): number {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return sentAtDates.filter(date => date >= oneHourAgo).length;
}

