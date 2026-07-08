// Map raw Supabase/Postgres error text to a friendly, human message.
// The raw text can still be shown in a collapsible "details" for debugging.
export function friendlyError(raw: string): string {
  const m = raw.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "This account isn't confirmed yet. Confirm it in Supabase → Authentication → Users.";
  }
  if (m.includes("invalid input syntax for type uuid")) {
    return "Something went wrong creating the car's ID. Please reload the page and try again.";
  }
  if (m.includes("duplicate key") || (m.includes("unique") && m.includes("slug"))) {
    return "A car with a very similar name already exists. Try a slightly different English name.";
  }
  if (m.includes("foreign key")) {
    return "One of the selected list options no longer exists. Refresh the page and pick it again.";
  }
  if (m.includes("row-level security") || m.includes("permission denied")) {
    return "The database blocked this write. Check that the table policies allow saving.";
  }
  if (m.includes("not configured") || m.includes("isn't configured")) {
    return "Supabase isn't connected. Add your environment variables and restart the dev server.";
  }
  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("fetch failed")
  ) {
    return "Couldn't reach the database. Check your connection and try again.";
  }
  if (m.includes("bucket") && m.includes("not found")) {
    return "The image storage bucket is missing. Run supabase/storage.sql, then try again.";
  }
  if (m.includes("column") && m.includes("does not exist")) {
    return "The database is missing a column. Re-run supabase/schema.sql (or the latest migration).";
  }

  // Strip a leading "table: " prefix from our submit helper for readability.
  return raw.replace(/^[a-z_]+:\s*/i, "").trim() || "Something went wrong.";
}
