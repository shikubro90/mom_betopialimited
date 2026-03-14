import { db }              from "@/lib/db";
import { ContactsManager } from "@/components/admin/ContactsManager";

export const metadata = { title: "Contacts — MoMBetopia Admin" };
export const dynamic  = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await db.employeeDirectory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, uploadedAt: true },
  });

  const serialized = contacts.map((c) => ({
    ...c,
    uploadedAt: c.uploadedAt.toISOString(),
  }));

  return <ContactsManager initialContacts={serialized} />;
}
