import { Globe, User } from 'lucide-react';

type Source = 'public' | 'personal';

interface SourceToggleProps {
  value: Source;
  onChange: (source: Source) => void;
  publicLabel?: string;
  personalLabel?: string;
  disabled?: boolean;
}

export function SourceToggle({ 
  value, 
  onChange, 
  publicLabel = 'PUBLIC', 
  personalLabel = 'PERSONAL',
  disabled = false 
}: SourceToggleProps) {
  return (
    <div className="inline-flex bg-muted/30 rounded-lg p-0.5 border border-border">
      <button
        onClick={() => onChange('public')}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display transition-all ${
          value === 'public'
            ? 'bg-primary text-primary-foreground'
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
            ? 'bg-secondary text-secondary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <User className="w-3 h-3" />
        {personalLabel}
      </button>
    </div>
  );
}
