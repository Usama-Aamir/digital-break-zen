import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FrustrationSmasher } from "@/components/FrustrationSmasher";
import { GamePageHeader } from "@/components/GamePageHeader";

export const Route = createFileRoute("/smasher")({
  head: () => ({
    meta: [
      { title: "Frustration Smasher — The Digital Breakroom" },
      {
        name: "description",
        content: "Squish a goofy office blob to vent frustration. Pure silly stress relief.",
      },
    ],
  }),
  component: SmasherPage,
});

function SmasherPage() {
  return (
    <AppShell>
      <GamePageHeader
        title="The Frustration Smasher"
        subtitle="Need a quick reset? Give the frustration blob a squish."
        gameKey="smasher"
        howToSteps={[
          { icon: "👆", text: "Tap or click the blob to give it a satisfying squish." },
          { icon: "💥", text: "Each squish plays a goofy boing and pops a little bubble." },
          {
            icon: "📊",
            text: "Watch your 'Frustration Vented' counter climb — no score, no losing.",
          },
        ]}
        howToCta="Squish away"
      />
      <FrustrationSmasher full />
    </AppShell>
  );
}
