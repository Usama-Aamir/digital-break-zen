import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Breather } from "@/components/Breather";
import { MoodCheckIn } from "@/components/MoodCheckIn";
import { MoodCompanion } from "@/components/MoodCompanion";
import { CorporateTranslator } from "@/components/CorporateTranslator";
import { AiVacation } from "@/components/AiVacation";
import { HypeMan } from "@/components/HypeMan";
import { ActiveListener } from "@/components/ActiveListener";
import { WatercoolerWall } from "@/components/WatercoolerWall";
import { CircleDot, Layers, Grid3x3, ArrowRight, Music2, Palmtree, Scissors, Sparkles, Worm } from "lucide-react";
import { useMood, useLocalizedMoodMeta } from "@/lib/mood";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Digital Breakroom — Cozy mini-games for work breaks" },
      { name: "description", content: "A calming hub of micro-games and relaxation widgets for short corporate breaks." },
      { property: "og:title", content: "The Digital Breakroom" },
      { property: "og:description", content: "Pastel mini-games, breathing exercises, and mood check-ins for cozy work breaks." },
    ],
  }),
  component: Index,
});

const GAMES = [
  {
    to: "/bubbles",
    title: "Zen Bubble Wrap",
    desc: "Pop endless soft bubbles. Pure satisfaction, no scoreboard.",
    icon: CircleDot,
    gradient: "var(--gradient-mint)",
  },
  {
    to: "/match",
    title: "Pastel Match",
    desc: "A cozy memory game with cute office icons.",
    icon: Layers,
    gradient: "var(--gradient-peach)",
  },
  {
    to: "/2048",
    title: "2048 · Calm Edition",
    desc: "The classic puzzle, washed in soothing gradients.",
    icon: Grid3x3,
    gradient: "var(--gradient-lav)",
  },
  {
    to: "/melody",
    title: "Zen Melody Maker",
    desc: "Tap a pentatonic grid and let a playhead drift across your tune.",
    icon: Music2,
    gradient: "var(--gradient-mint)",
  },
  {
    to: "/vacation",
    title: "Desk Vacation",
    desc: "Stare out a virtual window. Waves, rain, or a quiet forest.",
    icon: Palmtree,
    gradient: "var(--gradient-lav)",
  },
  {
    to: "/shredder",
    title: "Digital Shredder",
    desc: "Type a frustration. Watch it shred or fly away. Nothing is saved.",
    icon: Scissors,
    gradient: "var(--gradient-peach)",
  },
  {
    to: "/bingo",
    title: "Office Bingo",
    desc: "Stamp corporate clichés as you hear them. Resets daily.",
    icon: Sparkles,
    gradient: "var(--gradient-mint)",
  },
  {
    to: "/snake",
    title: "ZenSnake",
    desc: "A glowing, slow-paced take on classic Snake.",
    icon: Worm,
    gradient: "var(--gradient-lav)",
  },
] as const;

function Index() {
  const { mood } = useMood();
  const meta = useLocalizedMoodMeta(mood);
  const { t } = useLanguage();
  const featured = new Set(meta?.featured ?? []);
  const orderedGames = meta
    ? [
        ...GAMES.filter((g) => featured.has(g.to)),
        ...GAMES.filter((g) => !featured.has(g.to)),
      ]
    : GAMES;

  return (
    <AppShell>
      <section className="text-center mb-10 mt-2">
        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-white/50 rounded-full px-3 py-1 mb-4">
          {meta ? `${meta.emoji} ${t("feeling")} ${meta.label.toLowerCase()}` : t("welcomeBack")}
        </span>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
          {meta ? (
            <>
              {meta.headline}
              <span className="block bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
                {meta.subhead}
              </span>
            </>
          ) : (
            <>
              {t("pocketOfCalm")}
              <span className="block bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
                {t("betweenMeetings")}
              </span>
            </>
          )}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          {t("pickGame")}
        </p>
      </section>

      <div className="mb-10">
        <MoodCompanion />
      </div>

      <div className="mb-10">
        <ActiveListener />
      </div>

      {mood === "frustrated" && (
        <div className="mb-10">
          <CorporateTranslator />
        </div>
      )}
      {mood === "tired" && (
        <div className="mb-10">
          <AiVacation />
        </div>
      )}
      {mood === "demotivated" && (
        <div className="mb-10">
          <HypeMan />
        </div>
      )}
      {(mood === "fun" || mood === "happy") && (
        <div className="mb-10">
          <WatercoolerWall />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {orderedGames.map((g) => {
          const isFeatured = featured.has(g.to);
          return (
            <Link
              key={g.to}
              to={g.to}
              className={`group glass-card rounded-3xl p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] transition-all relative ${
                isFeatured ? "ring-2 ring-white/80 shadow-[var(--shadow-glow)]" : ""
              }`}
            >
              {isFeatured && (
                <span className="absolute -top-2 -right-2 text-[10px] font-bold uppercase tracking-wider bg-white/90 rounded-full px-2.5 py-1 shadow-[var(--shadow-soft)] text-foreground/80">
                  {t("forYou")}
                </span>
              )}
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-foreground/70 shadow-[var(--shadow-soft)]"
                style={{ backgroundImage: `var(--${g.gradient.includes("mint") ? "gradient-mint" : g.gradient.includes("peach") ? "gradient-peach" : "gradient-lav"})` }}
              >
                <g.icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">{g.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{g.desc}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-foreground/70 group-hover:gap-2 transition-all">
                {t("open")} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Breather />
        <MoodCheckIn />
      </div>
    </AppShell>
  );
}
