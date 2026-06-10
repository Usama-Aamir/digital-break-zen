import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FrustrationSmasher } from "@/components/FrustrationSmasher";
import { HowToPlay } from "@/components/HowToPlay";

export const Route = createFileRoute("/smasher")({
  head: () => ({
    meta: [
      { title: "Frustration Smasher — The Digital Breakroom" },
      { name: "description", content: "Squish a goofy office blob to vent frustration. Pure silly stress relief." },
    ],
  }),
  component: SmasherPage,
});

function SmasherPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-display font-bold">The Frustration Smasher</h1>
          <HowToPlay
            gameKey="smasher"
            title="The Frustration Smasher"
            steps={[
              { icon: "👆", text: "Tap or click the blob to give it a satisfying squish." },
              { icon: "💥", text: "Each squish plays a goofy boing and pops a little bubble." },
              { icon: "📊", text: "Watch your 'Frustration Vented' counter climb — no score, no losing." },
            ]}
            cta="Squish away"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Need a quick reset? Give the frustration blob a squish.
        </p>
      </div>
      <FrustrationSmasher full />
    </AppShell>
  );
}