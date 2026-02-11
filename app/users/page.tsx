import { Separator } from "@/components/ui/separator";
import { TypographyH2 } from "@/components/ui/typography";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  // feature 4 - this is a protected route (only accessible to signed-in users)
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  // feature 4 - fetch all user profiles and display their public information
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("email, display_name, biography")
    .order("display_name", { ascending: true });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <TypographyH2>Users</TypographyH2>
      </div>
      <Separator className="my-4" />

      {/* feature 4 -list all profiles */}
      <div className="grid gap-4">
        {error ? (
          <div className="rounded border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            {error.message}
          </div>
        ) : (
          profiles?.map((profile) => (
            <div key={profile.email} className="rounded border border-border bg-muted p-4">
              <div className="text-lg font-semibold">{profile.display_name}</div>
              <div className="text-sm text-muted-foreground">{profile.email}</div>
              <div className="mt-3 whitespace-pre-wrap text-sm">{profile.biography ?? ""}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
