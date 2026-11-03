import { Languages } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';
import { cn } from '../../utils/cn';
import { Dropdown } from '../ui/Dropdown';

// Language picker. Each entry is written in its own script, so switching never
// needs a translation to be understood. The panel is portalled by Dropdown, so
// it clears the sticky header (z-140) instead of hiding under it.
export function LanguageToggle({ className, compact = false, triggerClassName }) {
  const { lang, setLang, languages, t } = useI18n();

  const options = languages.map((l) => ({
    value: l.code,
    label: l.label,
    description: l.code === lang ? undefined : l.en,
  }));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!compact && <Languages className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />}
      <Dropdown
        ariaLabel={t('lang.change')}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        options={options}
        variant="inline"
        triggerClassName={cn('h-10 justify-between text-[13px] font-semibold', triggerClassName)}
      />
    </div>
  );
}
