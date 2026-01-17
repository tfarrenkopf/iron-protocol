import { Globe, User } from 'lucide-react';

type Source = 'public' | 'personal';
type Section = 'missions' | 'exercises' | 'campaigns';

interface SourceToggleProps {
  value: Source;
  onChange: (source: Source) => void;
  publicLabel?: string;
  personalLabel?: string;
  disabled?: boolean;
  section?: Section;
}

const sectionColors: Record<Section, { active: string; icon: string }> = {
  missions: { 
    active: 'bg-section-missions text-white', 
    icon: 'text-section-missions' 
  },
  exercises: { 
    active: 'bg-section-command text-background', 
    icon: 'text-section-command' 
  },
  campaigns: { 
    active: 'bg-section-campaigns text-white', 
    icon: 'text-section-campaigns' 
  },
};

export function SourceToggle({ 
  value, 
  onChange, 
  publicLabel = 'PUBLIC', 
  personalLabel = 'PERSONAL',
  disabled = false,
  section = 'missions'
}: SourceToggleProps) {
  const colors = sectionColors[section];
  
  return (
    <div className="inline-flex bg-muted/30 rounded-lg p-0.5 border border-border">
      <button
        onClick={() => onChange('public')}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display transition-all ${
          value === 'public'
            ? colors.active
            : 'text-muted-foreground hover:text-foreground'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Globe className="w-3 h-3" />
        {publicLabel}
      </button>
      <button
        onClick={() => onChange('personal')}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display transition-all ${
          value === 'personal'
            ? colors.active
            : 'text-muted-foreground hover:text-foreground'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <User className="w-3 h-3" />
        {personalLabel}
      </button>
    </div>
  );
}