interface SectionTitleProps { 
  title: string;
  subtitle: string; 
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) { 
  return (
    <div className="text-center w-full">
      <div className="relative">
        {/* Ligne décorative au-dessus */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        
        {/* Titre principal avec effet de gradient */}
        <h1 className="text-4xl font-light text-slate-800 tracking-tight mb-4 relative">
          <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
        
        {/* Ligne décorative en dessous */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
      </div>
      
      {/* Sous-titre avec typographie raffinée */}
      <p className="text-lg font-light text-slate-600 leading-relaxed max-w-2xl mx-auto">
        {subtitle}
      </p>
    </div>
  );
} 