import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { User, UserCheck, Users2, Globe, Lock, Shield, Eye } from "lucide-react";
import { Target } from './AdvancedTargetSelector';

interface DocumentTargetsDisplayProps {
  targets?: Target[];
  accessLevel?: 'public' | 'private' | 'restricted' | 'confidential';
  maxDisplay?: number;
  className?: string;
}

// Configuration statique pour éviter les recalculs
const ACCESS_LEVEL_CONFIG = {
  public: {
    icon: <Globe className="w-3 h-3" />,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  private: {
    icon: <Lock className="w-3 h-3" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  restricted: {
    icon: <Shield className="w-3 h-3" />,
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  confidential: {
    icon: <Eye className="w-3 h-3" />,
    color: 'bg-red-100 text-red-800 border-red-200'
  }
} as const;

const TARGET_TYPE_CONFIG = {
  client: {
    icon: <User className="w-3 h-3" />,
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  expert: {
    icon: <UserCheck className="w-3 h-3" />,
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  group: {
    icon: <Users2 className="w-3 h-3" />,
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  }
} as const;

const DocumentTargetsDisplay = React.memo<DocumentTargetsDisplayProps>(({
  targets = [],
  accessLevel = 'private',
  maxDisplay = 3,
  className = ""
}) => {
  // Mémorisation des valeurs calculées
  const accessConfig = useMemo(() => 
    ACCESS_LEVEL_CONFIG[accessLevel] || ACCESS_LEVEL_CONFIG.private, 
    [accessLevel]
  );

  const displayedTargets = useMemo(() => 
    targets.slice(0, maxDisplay), 
    [targets, maxDisplay]
  );

  const remainingCount = useMemo(() => 
    Math.max(0, targets.length - maxDisplay), 
    [targets.length, maxDisplay]
  );

  const targetCountText = useMemo(() => 
    `${targets.length} cible${targets.length > 1 ? 's' : ''}`, 
    [targets.length]
  );

  const remainingText = useMemo(() => 
    `+${remainingCount} autre${remainingCount > 1 ? 's' : ''}`, 
    [remainingCount]
  );

  // Cas spécial : aucune cible
  if (targets.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className={accessConfig.color}>
          {accessConfig.icon}
          <span className="ml-1 capitalize text-xs">{accessLevel}</span>
        </Badge>
        <span className="text-xs text-gray-500">Aucune cible spécifique</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Niveau d'accès */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={accessConfig.color}>
          {accessConfig.icon}
          <span className="ml-1 capitalize text-xs">{accessLevel}</span>
        </Badge>
        <span className="text-xs text-gray-500">
          {targetCountText}
        </span>
      </div>

      {/* Cibles */}
      <div className="flex flex-wrap gap-1">
        {displayedTargets.map((target) => {
          const targetConfig = TARGET_TYPE_CONFIG[target.type as keyof typeof TARGET_TYPE_CONFIG] || TARGET_TYPE_CONFIG.client;
          
          return (
            <Badge
              key={`${target.type}-${target.id}`}
              variant="outline"
              className={`text-xs ${targetConfig.color}`}
            >
              {targetConfig.icon}
              <span className="ml-1 truncate max-w-20">{target.name}</span>
            </Badge>
          );
        })}
        {remainingCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {remainingText}
          </Badge>
        )}
      </div>
    </div>
  );
});

DocumentTargetsDisplay.displayName = 'DocumentTargetsDisplay';

export default DocumentTargetsDisplay; 