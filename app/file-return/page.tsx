
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import TaxFilingWizard from "@/components/tax-filing/tax-filing-wizard";

export const metadata = {
  title: "File Tax Return - TAXGROK",
  description: "Complete your 2025 tax return with AI-powered document processing"
};

export default async function FileReturnPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/file-return");
  }

  return <TaxFilingWizard />;
}
