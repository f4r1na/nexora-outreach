import { redirect } from "next/navigation";

export default function GhostWriterRedirect() {
  redirect("/dashboard/settings");
}
