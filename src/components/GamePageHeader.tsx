import type { ReactNode } from "react";
import { HowToPlay, type HowToStep } from "@/components/HowToPlay";

type Props = {
  title: string;
  subtitle: string;
  gameKey: string;
  howToSteps: HowToStep[];
  howToCta?: string;
  actions?: ReactNode;
};

export function GamePageHeader({ title, subtitle, gameKey, howToSteps, howToCta, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-display font-bold">{title}</h1>
          <HowToPlay gameKey={gameKey} title={title} steps={howToSteps} cta={howToCta} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {actions}
    </div>
  );
}
