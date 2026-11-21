import Chat from "@/components/Chat";
import { WARUNG_NAME } from "@/lib/menu";

export const metadata = {
  title: `${WARUNG_NAME} — Demo Asisten Pesan`,
  description: `Coba asisten pemesanan online ${WARUNG_NAME}. Demo oleh Widi Diky.`,
};

export default function Home() {
  const phone = process.env.WA_NUMBER ?? "";
  const email = process.env.CONTACT_EMAIL ?? "";

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <Chat phone={phone} contactEmail={email} />
    </main>
  );
}
