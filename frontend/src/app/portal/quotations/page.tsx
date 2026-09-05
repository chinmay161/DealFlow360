import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function PortalQuotationsRedirectPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "CUSTOMER") {
    redirect("/portal");
  }

  redirect("/portal");
}
