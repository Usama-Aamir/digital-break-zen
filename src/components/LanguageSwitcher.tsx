import { useLanguage } from "@/lib/language";
import { languageMeta, type Language } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const currentMeta = languageMeta[language];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Change language"
        title="Change language"
        className="flex items-center gap-1.5 rounded-full bg-white/70 hover:bg-white px-3 py-1.5 text-xs font-semibold text-foreground/80 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] transition-all border border-white/70"
      >
        <span className="text-sm">{currentMeta.flag}</span>
        <span className="hidden sm:inline">{currentMeta.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-48 rounded-3xl border border-white/60 bg-white/90 backdrop-blur-xl p-2 shadow-[var(--shadow-soft)]"
      >
        {(Object.keys(languageMeta) as Language[]).map((lang) => {
          const meta = languageMeta[lang];
          const isActive = lang === language;
          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`rounded-2xl px-3 py-2 text-sm font-medium cursor-pointer flex items-center gap-3 ${
                isActive
                  ? "bg-[image:var(--gradient-lav)] text-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60"
              }`}
            >
              <span className="text-lg">{meta.flag}</span>
              <span>{meta.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
