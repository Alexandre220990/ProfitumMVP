// import React from "react";

// ✅ Définition du type des props
interface ProgressBarProps { current: number;
  total: number;
  className?: string; }

/**
 * Composant de barre de progression
 * Affiche visuellement la progression d'une simulation
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, className = '' }) => { // Éviter la division par zéro
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className }`}>
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
        style={ { width: `${percent }%` }} 
      />
      <div className="text-xs text-gray-500 mt-1 text-right">
        { current } / { total } questions ({ percent }%)
      </div>
    </div>
  );
};
