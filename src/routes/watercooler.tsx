import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { WatercoolerWall } from "@/components/WatercoolerWall";

export const Route = createFileRoute("/watercooler")({
  head: () => ({
    meta: [
      { title: "Watercooler Wall | The Digital Breakroom" },
      { name: "description", content: "Short community posts for quick work and study moments." },
    ],
  }),
  component: WatercoolerPage,
});

function WatercoolerPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <WatercoolerWall />
      </div>
    </AppShell>
  );
}
