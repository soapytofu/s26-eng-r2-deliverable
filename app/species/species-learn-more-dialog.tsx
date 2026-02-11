// feature 1

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState, type BaseSyntheticEvent, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Species = Database["public"]["Tables"]["species"]["Row"];

const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

const speciesSchema = z.object({
  scientific_name: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val?.trim()),
  common_name: z
    .string()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  kingdom: kingdoms,
  total_population: z.number().int().positive().min(1).nullable(),
  image: z
    .string()
    .url()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  description: z
    .string()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
});

type FormData = z.infer<typeof speciesSchema>;

export default function SpeciesLearnMoreDialog({ species, sessionId }: { species: Species; sessionId: string }) {
  const router = useRouter();

  // only the author should be able to edit a species
  // can compute this from species row's author id and current session id passed down from server component
  const isAuthor = species.author === sessionId;

  // this toggles whether dialog is showing the read-only detailed view (which is for feature 1) or the editable form (for feature 2)
  const [isEditing, setIsEditing] = useState(false);

  const defaultValues = useMemo<Partial<FormData>>(
    // pre-fill the edit form with the current species values
    () => ({
      scientific_name: species.scientific_name,
      common_name: species.common_name,
      kingdom: species.kingdom,
      total_population: species.total_population,
      image: species.image,
      description: species.description,
    }),
    [species],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(speciesSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (input: FormData) => {
    // update existing species row in Supabase
    // backend RLS prevents non-authors from updating
    // hide edit UI unless isAuthor
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("species")
      .update({
        scientific_name: input.scientific_name,
        common_name: input.common_name,
        kingdom: input.kingdom,
        total_population: input.total_population,
        image: input.image,
        description: input.description,
      })
      .eq("id", species.id);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsEditing(false);

    // reset form state to saved values
    form.reset(input);

    // re-render server component (species/page.tsx) so the updated species show up
    router.refresh();

    return toast({
      title: "Species updated successfully!",
    });
  };

  const startEditing = (e: MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
  };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    form.reset(defaultValues);
    setIsEditing(false);
  };

  const totalPopulationLabel =
    typeof species.total_population === "number" ? species.total_population.toLocaleString() : "Unknown";

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* button triggers dialog that shows a detailed species view */}
        <Button className="mt-3 w-full">Learn More</Button>
      </DialogTrigger>

      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{species.scientific_name}</DialogTitle>
          <DialogDescription>{species.common_name ?? ""}</DialogDescription>
        </DialogHeader>

        {/* when not editing show a read-only view and when editing show a form to update species */}
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
              <div className="grid w-full items-center gap-4">
                <FormField
                  control={form.control}
                  name="scientific_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scientific Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Cavia porcellus" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="common_name"
                  render={({ field }) => {
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Common Name</FormLabel>
                        <FormControl>
                          <Input value={value ?? ""} placeholder="Guinea pig" {...rest} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="kingdom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kingdom</FormLabel>
                      <Select onValueChange={(value) => field.onChange(kingdoms.parse(value))} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a kingdom" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {kingdoms.options.map((kingdom, index) => (
                              <SelectItem key={index} value={kingdom}>
                                {kingdom}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total_population"
                  render={({ field }) => {
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Total population</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={value ?? ""}
                            placeholder="300000"
                            {...rest}
                            onChange={(event) => {
                              const next = event.target.value;
                              field.onChange(next === "" ? null : +next);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => {
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input value={value ?? ""} placeholder="https://..." {...rest} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => {
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea value={value ?? ""} placeholder="Description" {...rest} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <div className="flex">
                  <Button type="submit" className="ml-1 mr-1 flex-auto">
                    Save changes
                  </Button>
                  <Button type="button" className="ml-1 mr-1 flex-auto" variant="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        ) : (
          <>
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

            {/* only show the edit button to author of species */}
            {isAuthor ? (
              <div className="mt-6 flex gap-2">
                <Button onClick={startEditing}>Edit</Button>
                <DialogClose asChild>
                  <Button variant="secondary">Close</Button>
                </DialogClose>
              </div>
            ) : (
              <div className="mt-6">
                <DialogClose asChild>
                  <Button variant="secondary" className="w-full">
                    Close
                  </Button>
                </DialogClose>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
