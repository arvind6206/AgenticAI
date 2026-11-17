import { redirect } from "next/navigation";

// The app lives under /agents. Not signed in? The dashboard layout sends you to /login.
export default function Home() {
  redirect("/agents");
}
