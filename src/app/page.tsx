import { redirect } from "next/navigation";

// middleware.ts already redirects unauthenticated visitors to /login, so
// reaching this page means there's a session — send them to the app.
export default function RootPage() {
  redirect("/dashboard");
}
