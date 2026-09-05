import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await auth();
  if ((session?.user as any)?.role === "CUSTOMER") {
    redirect("/customer/dashboard");
  }
  if ((session?.user as any)?.role === "MANAGER") {
    redirect("/manager/dashboard");
  }

  redirect("/overview");
}


