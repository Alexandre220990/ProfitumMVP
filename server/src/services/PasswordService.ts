import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Service de gestion des mots de passe provisoires
 */
export class PasswordService {
  /**
   * Génère un mot de passe provisoire sécurisé
   * Format: XXX-XXX-XXX (facile à communiquer par téléphone/email)
   * Exemple: A7K-9M2-P5Q
   */
  static generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans caractères ambigus (0, O, 1, I, l)
    const segments: string[] = [];

    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 3; j++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        segment += chars[randomIndex];
      }
      segments.push(segment);
    }

    return segments.join('-');
  }

  /**
   * Génère un mot de passe provisoire complexe (non utilisé pour l'instant)
   * Format standard avec majuscules, minuscules, chiffres et caractères spéciaux
   */
  static generateComplexPassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const all = uppercase + lowercase + numbers + special;

    let password = '';
    
    // Garantir au moins un caractère de chaque type
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += special[crypto.randomInt(0, special.length)];

    // Compléter avec des caractères aléatoires
    for (let i = password.length; i < length; i++) {
      password += all[crypto.randomInt(0, all.length)];
    }

    // Mélanger les caractères
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Hache un mot de passe avec bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Vérifie un mot de passe contre son hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Génère et hache un mot de passe provisoire
   * Retourne { plainPassword, hashedPassword }
   */
  static async generateAndHashTemporaryPassword(): Promise<{
    plainPassword: string;
    hashedPassword: string;
  }> {
    const plainPassword = this.generateTemporaryPassword();
    const hashedPassword = await this.hashPassword(plainPassword);
    
    return {
      plainPassword,
      hashedPassword
    };
  }
}

