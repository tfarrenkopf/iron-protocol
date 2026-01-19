import { Globe, User, Users } from 'lucide-react';

type CampaignSource = 'standard' | 'personal' | 'community';

interface CampaignSourceToggleProps {
  value: CampaignSource;
  onChange: (source: CampaignSource) => void;
  showPersonal?: boolean;
  disabled?: boolean;
}

export function CampaignSourceToggle({ 
  value, 
  onChange, 
  showPersonal = true,
  disabled = false,
}: CampaignSourceToggleProps) {
  const activeClass = 'bg-section-campaigns text-white';
  const inactiveClass = 'text-muted-foreground hover:text-foreground';
  
  return (
    <div className="inline-flex bg-muted/30 rounded-lg p-0.5 border border-border">
      <button
        onClick={() => onChange('standard')}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display transition-all ${
          value === 'standard' ? activeClass : inactiveClass
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Globe className="w-3 h-3" />
        GLOBAL
      </button>
      {showPersonal && (
        <button
          onClick={() => onChange('personal')}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display transition-all ${
            value === 'personal' ? activeClass : inactiveClass
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <User className="w-3 h-3" />
          MY CAMPAIGNS
        </button>
      )}
      <button
        onClick={() => onChange('community')}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display transition-all ${
          value === 'community' ? activeClass : inactiveClass
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Users className="w-3 h-3" />
        COMMUNITY
      </button>
    </div>
  );
}
