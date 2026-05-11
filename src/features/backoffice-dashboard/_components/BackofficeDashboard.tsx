

import { useState } from "react";
import { BackofficeDashboardPreview } from "./BackofficeDashboardPreview";
import { BackofficeMonthlyStatsView } from "./BackofficeMonthlyStatsView";

type BackofficeDashboardProps = {
  initialView?: "preview" | "monthly";
};

export function BackofficeDashboard({
  initialView = "preview",
}: BackofficeDashboardProps) {
  const [view, setView] = useState<"preview" | "monthly">(initialView);

  return (
    <main className="min-h-full p-6 md:p-8">
      <div className="space-y-6">
        {view === "preview" ? (
          <BackofficeDashboardPreview
            onOpenMonthlyStats={() => setView("monthly")}
          />
        ) : (
          <BackofficeMonthlyStatsView setView={setView} />
        )}
      </div>
    </main>
  );
}
