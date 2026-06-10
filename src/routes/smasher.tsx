import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FrustrationSmasher } from "@/components/FrustrationSmasher";

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
        <h1 className="text-3xl font-display font-bold">The Frustration Smasher</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Need a quick reset? Give the frustration blob a squish.
        </p>
      </div>
      <FrustrationSmasher full />
    </AppShell>
  );
}