import { createClient } from '@supabase/supabase-js';

interface TICPEResponse {
  question_id: string;
  response_value: any;
}

interface TICPEResult {
  eligibility_score: number;
  estimated_recovery: number;
  confidence_level: 'low' | 'medium' | 'high';
  sector_performance: number;
  maturity_score: number;
  benchmark_comparison: any;
  recommendations: string[];
  risk_factors: string[];
  calculation_details: {
    base_amount: number;
    vehicle_coefficient: number;
    usage_coefficient: number;
    fuel_rate: number;
    total_consumption: number;
  };
}

interface TICPEBenchmark {
  average_recovery: number;
  min_recovery: number;
  max_recovery: number;
  sample_size: number;
  confidence_level: number;
}

export class TICPECalculationEngine {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  /**
   * Calcul principal de l'éligibilité et du montant récupérable TICPE
   */
  async calculateTICPERecovery(responses: TICPEResponse[]): Promise<TICPEResult> {
    try {
      console.log('🧮 Début du calcul TICPE avec', responses.length, 'réponses');

      // 1. Extraction des données de base
      const extractedData = this.extractDataFromResponses(responses);
      console.log('📊 Données extraites:', extractedData);

      // 2. Vérification de l'éligibilité de base
      const eligibilityResult = await this.checkBasicEligibility(extractedData);
      if (!eligibilityResult.isEligible) {
        return {
          eligibility_score: 0,
          estimated_recovery: 0,
          confidence_level: 'low',
          sector_performance: 0,
          maturity_score: 0,
          benchmark_comparison: null,
          recommendations: ['❌ Non éligible à la récupération TICPE'],
          risk_factors: eligibilityResult.reasons,
          calculation_details: {
            base_amount: 0,
            vehicle_coefficient: 0,
            usage_coefficient: 0,
            fuel_rate: 0,
            total_consumption: 0
          }
        };
      }

      // 3. Calcul du score d'éligibilité
      const eligibilityScore = await this.calculateEligibilityScore(extractedData);

      // 4. Calcul du montant récupérable
      const recoveryCalculation = await this.calculateRecoveryAmount(extractedData);

      // 5. Calcul du score de maturité administrative
      const maturityScore = await this.calculateMaturityScore(extractedData);

      // 6. Comparaison avec les benchmarks
      const benchmarkComparison = await this.compareWithBenchmarks(extractedData, recoveryCalculation.final_amount);

      // 7. Génération des recommandations
      const recommendations = this.generateRecommendations(extractedData, recoveryCalculation, benchmarkComparison);

      // 8. Identification des facteurs de risque
      const riskFactors = this.identifyRiskFactors(extractedData, maturityScore);

      // 9. Détermination du niveau de confiance
      const confidenceLevel = this.determineConfidenceLevel(extractedData, maturityScore, benchmarkComparison);

      return {
        eligibility_score: eligibilityScore,
        estimated_recovery: Math.round(recoveryCalculation.final_amount),
        confidence_level: confidenceLevel,
        sector_performance: eligibilityResult.sectorPerformance,
        maturity_score: maturityScore,
        benchmark_comparison: benchmarkComparison,
        recommendations,
        risk_factors: riskFactors,
        calculation_details: {
          base_amount: Math.round(recoveryCalculation.base_amount),
          vehicle_coefficient: recoveryCalculation.vehicle_coefficient,
          usage_coefficient: recoveryCalculation.usage_coefficient,
          fuel_rate: recoveryCalculation.fuel_rate,
          total_consumption: recoveryCalculation.total_consumption
        }
      };

    } catch (error) {
      console.error('❌ Erreur lors du calcul TICPE:', error);
      throw new Error('Erreur lors du calcul TICPE');
    }
  }

  /**
   * Extraction des données pertinentes des réponses
   */
  private extractDataFromResponses(responses: TICPEResponse[]): any {
    const data: any = {};

    responses.forEach(response => {
      const value = response.response_value;
      
      // Mapping des questions vers les données
      switch (response.question_id) {
        case 'secteur_activite':
          data.secteur = value;
          break;
        case 'chiffre_affaires':
          data.chiffreAffaires = this.extractAmount(value);
          break;
        case 'vehicules_professionnels':
          data.vehiculesProfessionnels = value === 'Oui';
          break;
        case 'nombre_vehicules':
          data.nombreVehicules = this.extractNumber(value);
          break;
        case 'types_vehicules':
          data.typesVehicules = Array.isArray(value) ? value : [value];
          break;
        case 'consommation_carburant':
          data.consommationCarburant = this.extractNumber(value);
          break;
        case 'types_carburant':
          data.typesCarburant = Array.isArray(value) ? value : [value];
          break;
        case 'factures_carburant':
          data.facturesCarburant = value;
          break;
        case 'usage_professionnel':
          data.usageProfessionnel = this.extractPercentage(value);
          break;
        case 'kilometrage_annuel':
          data.kilometrageAnnuel = this.extractNumber(value);
          break;
        case 'cartes_carburant':
          data.cartesCarburant = value;
          break;
        case 'factures_nominatives':
          data.facturesNominatives = value;
          break;
        case 'immatriculation_societe':
          data.immatriculationSociete = value;
          break;
        case 'declarations_ticpe':
          data.declarationsTicpe = value;
          break;
      }
    });

    return data;
  }

  /**
   * Vérification de l'éligibilité de base
   */
  private async checkBasicEligibility(data: any): Promise<{ isEligible: boolean; reasons: string[]; sectorPerformance: number }> {
    const reasons: string[] = [];
    let sectorPerformance = 0;

    // Vérification du secteur d'activité
    const eligibleSectors = [
      'Transport routier de marchandises',
      'Transport routier de voyageurs', 
      'Taxi / VTC',
      'BTP / Travaux publics',
      'Secteur Agricole'
    ];

    if (!data.secteur || !eligibleSectors.includes(data.secteur)) {
      reasons.push('❌ Secteur d\'activité non éligible à la TICPE');
      return { isEligible: false, reasons, sectorPerformance: 0 };
    }

    // Récupération de la performance du secteur
    const { data: sectorData } = await this.supabase
      .from('TICPESectors')
      .select('performance_score')
      .eq('sector_name', data.secteur)
      .single();

    sectorPerformance = sectorData?.performance_score || 0;

    // Vérification des véhicules professionnels
    if (!data.vehiculesProfessionnels) {
      reasons.push('❌ Aucun véhicule professionnel déclaré');
      return { isEligible: false, reasons, sectorPerformance };
    }

    // Vérification de la consommation carburant
    if (!data.consommationCarburant || data.consommationCarburant < 1000) {
      reasons.push('❌ Consommation carburant insuffisante (< 1000 litres/an)');
      return { isEligible: false, reasons, sectorPerformance };
    }

    return { isEligible: true, reasons, sectorPerformance };
  }

  /**
   * Calcul du score d'éligibilité
   */
  private async calculateEligibilityScore(data: any): Promise<number> {
    let score = 0;

    // Secteur d'activité (30 points)
    const sectorScores: Record<string, number> = {
      'Transport routier de marchandises': 30,
      'Transport routier de voyageurs': 30,
      'Taxi / VTC': 25,
      'BTP / Travaux publics': 20,
      'Secteur Agricole': 15
    };
    score += sectorScores[data.secteur as string] || 0;

    // Véhicules professionnels (25 points)
    if (data.vehiculesProfessionnels) {
      score += 25;
    }

    // Types de véhicules (20 points)
    if (data.typesVehicules) {
      const vehicleScore = this.calculateVehicleScore(data.typesVehicules);
      score += vehicleScore;
    }

    // Consommation carburant (15 points)
    if (data.consommationCarburant) {
      if (data.consommationCarburant > 50000) score += 15;
      else if (data.consommationCarburant > 15000) score += 10;
      else if (data.consommationCarburant > 5000) score += 5;
    }

    // Documents disponibles (10 points)
    if (data.facturesCarburant && data.facturesCarburant.includes('complètes')) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calcul du score des véhicules
   */
  private calculateVehicleScore(typesVehicules: string[]): number {
    let score = 0;
    
    typesVehicules.forEach(type => {
      switch (type) {
        case 'Camions de plus de 7,5 tonnes':
          score += 20;
          break;
        case 'Camions de 3,5 à 7,5 tonnes':
          score += 15;
          break;
        case 'Engins de chantier':
          score += 15;
          break;
        case 'Tracteurs agricoles':
          score += 15;
          break;
        case 'Véhicules utilitaires légers':
          score += 10;
          break;
      }
    });

    return Math.min(score, 20);
  }

  /**
   * Calcul du montant récupérable
   */
  private async calculateRecoveryAmount(data: any): Promise<any> {
    // 1. Détermination du taux de carburant
    const fuelRate = await this.getFuelRate(data.typesCarburant, data.secteur);
    
    // 2. Calcul de la consommation totale
    const totalConsumption = data.consommationCarburant || this.estimateConsumption(data);
    
    // 3. Calcul du montant de base
    const baseAmount = totalConsumption * fuelRate;
    
    // 4. Application du coefficient véhicule
    const vehicleCoefficient = await this.getVehicleCoefficient(data.typesVehicules);
    
    // 5. Application du coefficient d'usage professionnel
    const usageCoefficient = this.getUsageCoefficient(data.usageProfessionnel);
    
    // 6. Calcul du montant final
    let finalAmount = baseAmount * vehicleCoefficient * usageCoefficient;
    
    // 7. Facteur de correction selon la taille
    const sizeCorrection = this.getSizeCorrection(data.nombreVehicules, data.chiffreAffaires);
    finalAmount *= sizeCorrection;
    
    // 8. Plafonnement réaliste
    finalAmount = Math.min(finalAmount, 100000); // Plafond 100k€
    finalAmount = Math.max(finalAmount, 500);    // Minimum 500€

    return {
      base_amount: baseAmount,
      vehicle_coefficient: vehicleCoefficient,
      usage_coefficient: usageCoefficient,
      fuel_rate: fuelRate,
      total_consumption: totalConsumption,
      final_amount: finalAmount
    };
  }

  /**
   * Récupération du taux de carburant
   */
  private async getFuelRate(typesCarburant: string[], secteur: string): Promise<number> {
    if (!typesCarburant || typesCarburant.length === 0) {
      // Taux par défaut selon le secteur
      const defaultRates: Record<string, number> = {
        'Transport routier de marchandises': 0.177,
        'Transport routier de voyageurs': 0.177,
        'Taxi / VTC': 0.213,
        'BTP / Travaux publics': 0.150,
        'Secteur Agricole': 0.150
      };
      return defaultRates[secteur] || 0.177;
    }

    // Récupération du taux depuis la base de données
    const { data: rateData } = await this.supabase
      .from('TICPERates')
      .select('rate_2024')
      .in('fuel_type', typesCarburant)
      .order('rate_2024', { ascending: false })
      .limit(1)
      .single();

    return rateData?.rate_2024 || 0.177;
  }

  /**
   * Estimation de la consommation si non fournie
   */
  private estimateConsumption(data: any): number {
    if (data.nombreVehicules && data.kilometrageAnnuel) {
      // Estimation basée sur le nombre de véhicules et kilométrage
      const consommationParVehicule = data.kilometrageAnnuel * 0.08; // 8L/100km en moyenne
      return data.nombreVehicules * consommationParVehicule;
    }

    // Estimation basée sur le secteur et la taille
    const estimationsSecteur: Record<string, number> = {
      'Transport routier de marchandises': 25000,
      'Transport routier de voyageurs': 20000,
      'Taxi / VTC': 8000,
      'BTP / Travaux publics': 15000,
      'Secteur Agricole': 12000
    };

    return estimationsSecteur[data.secteur as string] || 10000;
  }

  /**
   * Récupération du coefficient véhicule
   */
  private async getVehicleCoefficient(typesVehicules: string[]): Promise<number> {
    if (!typesVehicules || typesVehicules.length === 0) {
      return 0.8; // Coefficient par défaut
    }

    // Récupération des coefficients depuis la base de données
    const { data: vehicleData } = await this.supabase
      .from('TICPEVehicleTypes')
      .select('eligibility_coefficient')
      .in('vehicle_type', typesVehicules)
      .order('eligibility_coefficient', { ascending: false });

    if (vehicleData && vehicleData.length > 0) {
      // Retourner le coefficient le plus élevé
      return vehicleData[0].eligibility_coefficient;
    }

    return 0.8;
  }

  /**
   * Calcul du coefficient d'usage professionnel
   */
  private getUsageCoefficient(usageProfessionnel: number): number {
    if (!usageProfessionnel) return 0.8; // Valeur par défaut

    if (usageProfessionnel >= 100) return 1.0;
    if (usageProfessionnel >= 80) return 0.9;
    if (usageProfessionnel >= 60) return 0.7;
    return 0.0; // Non éligible si moins de 60%
  }

  /**
   * Facteur de correction selon la taille
   */
  private getSizeCorrection(nombreVehicules: number, chiffreAffaires: number): number {
    let correction = 1.0;

    // Correction selon le nombre de véhicules
    if (nombreVehicules > 25) correction *= 1.1;
    else if (nombreVehicules > 10) correction *= 1.05;
    else if (nombreVehicules < 3) correction *= 0.9;

    // Correction selon le chiffre d'affaires
    if (chiffreAffaires > 5000000) correction *= 1.1;
    else if (chiffreAffaires < 100000) correction *= 0.9;

    return correction;
  }

  /**
   * Calcul du score de maturité administrative
   */
  private async calculateMaturityScore(data: any): Promise<number> {
    let score = 0;

    // Cartes carburant professionnelles
    if (data.cartesCarburant === 'Oui, toutes les stations') score += 20;
    else if (data.cartesCarburant === 'Oui, partiellement') score += 10;

    // Factures nominatives
    if (data.facturesNominatives === 'Oui, systématiquement') score += 20;
    else if (data.facturesNominatives === 'Oui, partiellement') score += 10;

    // Immatriculation société
    if (data.immatriculationSociete === 'Oui, 100%') score += 15;
    else if (data.immatriculationSociete === 'Oui, majoritairement') score += 10;

    // Déclarations TICPE
    if (data.declarationsTicpe === 'Oui, régulièrement') score += 25;
    else if (data.declarationsTicpe === 'Oui, occasionnellement') score += 15;

    return Math.min(score, 100);
  }

  /**
   * Comparaison avec les benchmarks
   */
  private async compareWithBenchmarks(data: any, estimatedAmount: number): Promise<any> {
    try {
      const { data: sectorData } = await this.supabase
        .from('TICPESectors')
        .select('id')
        .eq('sector_name', data.secteur)
        .single();

      if (!sectorData) return null;

      const { data: benchmarkData } = await this.supabase
        .from('TICPEBenchmarks')
        .select('*')
        .eq('sector_id', sectorData.id)
        .gte('vehicle_count_min', data.nombreVehicules || 1)
        .lte('vehicle_count_max', data.nombreVehicules || 1)
        .single();

      if (!benchmarkData) return null;

      const difference = estimatedAmount - benchmarkData.average_recovery;
      const percentageDiff = (difference / benchmarkData.average_recovery) * 100;

      return {
        benchmark: benchmarkData.average_recovery,
        difference: Math.round(difference),
        percentage_diff: Math.round(percentageDiff),
        performance: percentageDiff > 0 ? 'above' : percentageDiff < -20 ? 'below' : 'average',
        sample_size: benchmarkData.sample_size,
        confidence_level: benchmarkData.confidence_level
      };

    } catch (error) {
      console.error('Erreur lors de la comparaison benchmark:', error);
      return null;
    }
  }

  /**
   * Génération des recommandations
   */
  private generateRecommendations(data: any, calculation: any, benchmark: any): string[] {
    const recommendations: string[] = [];

    // Recommandation principale
    if (calculation.final_amount > 0) {
      recommendations.push(`🎯 ÉLIGIBILITÉ CONFIRMÉE ! Gain potentiel de ${calculation.final_amount.toLocaleString('fr-FR')}€`);
    }

    // Comparaison avec le benchmark
    if (benchmark) {
      if (benchmark.performance === 'below') {
        recommendations.push(`⚠️ Votre estimation (${calculation.final_amount.toLocaleString('fr-FR')}€) est inférieure à la moyenne du secteur (${benchmark.benchmark.toLocaleString('fr-FR')}€)`);
        recommendations.push('💡 Un audit approfondi pourrait révéler des opportunités supplémentaires');
      } else if (benchmark.performance === 'above') {
        recommendations.push(`✅ Votre estimation est supérieure à la moyenne du secteur (+${benchmark.percentage_diff}%)`);
      }
    }

    // Recommandations selon la maturité
    if (data.cartesCarburant !== 'Oui, toutes les stations') {
      recommendations.push('💳 Misez sur les cartes carburant professionnelles pour une traçabilité optimale');
    }

    if (data.facturesNominatives !== 'Oui, systématiquement') {
      recommendations.push('📄 Améliorez la conservation des factures nominatives avec numéro d\'immatriculation');
    }

    if (data.declarationsTicpe !== 'Oui, régulièrement') {
      recommendations.push('📋 Mettez en place des déclarations TICPE régulières');
    }

    return recommendations;
  }

  /**
   * Identification des facteurs de risque
   */
  private identifyRiskFactors(data: any, maturityScore: number): string[] {
    const riskFactors: string[] = [];

    if (maturityScore < 40) {
      riskFactors.push('⚠️ Maturité administrative insuffisante');
    }

    if (data.usageProfessionnel && data.usageProfessionnel < 80) {
      riskFactors.push('⚠️ Usage professionnel limité');
    }

    if (data.facturesCarburant && data.facturesCarburant.includes('Non')) {
      riskFactors.push('⚠️ Absence de factures carburant');
    }

    if (data.secteur === 'BTP / Travaux publics' || data.secteur === 'Secteur Agricole') {
      riskFactors.push('⚠️ Secteur à faible performance de récupération');
    }

    return riskFactors;
  }

  /**
   * Détermination du niveau de confiance
   */
  private determineConfidenceLevel(data: any, maturityScore: number, benchmark: any): 'low' | 'medium' | 'high' {
    let confidence = 0;

    // Score de maturité (40 points max)
    confidence += (maturityScore / 100) * 40;

    // Qualité des données (30 points max)
    if (data.consommationCarburant && data.consommationCarburant > 0) confidence += 15;
    if (data.typesCarburant && data.typesCarburant.length > 0) confidence += 15;

    // Comparaison benchmark (30 points max)
    if (benchmark && benchmark.confidence_level > 0.8) confidence += 30;
    else if (benchmark) confidence += 15;

    if (confidence >= 70) return 'high';
    if (confidence >= 40) return 'medium';
    return 'low';
  }

  /**
   * Utilitaires pour l'extraction de données
   */
  private extractAmount(value: string): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/(\d+(?:\s*\d+)*)/);
      return match ? parseInt(match[1].replace(/\s/g, '')) : 0;
    }
    return 0;
  }

  private extractNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  private extractPercentage(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/(\d+)/);
      return match ? parseInt(match[1]) : 80;
    }
    return 80;
  }
} 