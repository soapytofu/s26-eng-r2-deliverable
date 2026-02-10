"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Database } from "@/lib/schema";

type Species = Database["public"]["Tables"]["species"]["Row"];

export default function SpeciesLearnMoreDialog({ species }: { species: Species }) {
  const totalPopulationLabel =
    typeof species.total_population === "number" ? species.total_population.toLocaleString() : "Unknown";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-3 w-full">Learn More</Button>
      </DialogTrigger>

      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{species.scientific_name}</DialogTitle>
          <DialogDescription>{species.common_name ?? ""}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1">
            <div className="text-sm font-medium">Kingdom</div>
            <div className="text-sm text-muted-foreground">{species.kingdom}</div>
          </div>

          <div className="grid gap-1">
            <div className="text-sm font-medium">Total population</div>
            <div className="text-sm text-muted-foreground">{totalPopulationLabel}</div>
          </div>

          <div className="grid gap-1">
            <div className="text-sm font-medium">Description</div>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">{species.description ?? ""}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
