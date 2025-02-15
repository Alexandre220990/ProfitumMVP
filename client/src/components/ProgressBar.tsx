import React from "react";

// ✅ Définition du type des props
interface ProgressBarProps {
  progress: number; // Assure que la valeur de `progress` est bien un nombre
}

export default function ProgressBar({ progress }: ProgressBarProps): JSX.Element {
  // ✅ Vérification que `progress` est bien compris entre 0 et 100
  const validProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${validProgress}%` }}
      ></div>
    </div>
  );
}
