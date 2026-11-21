import Chat from "@/components/Chat";
import { WARUNG_NAME } from "@/lib/menu";

export const metadata = {
  title: `${WARUNG_NAME} — Asisten Pesan`,
  description: `Pesan makanan online di ${WARUNG_NAME}. Demo oleh Widi Diky.`,
};

export default function Home() {
  const phone = process.env.WA_NUMBER ?? "";
  const email = process.env.CONTACT_EMAIL ?? "";

  return (
    <main className="flex flex-1 flex-col items-center bg-stone-100 p-0 sm:py-6 sm:px-4">
      <div className="flex flex-1 flex-col w-full max-w-md bg-white sm:rounded-2xl sm:shadow-xl sm:flex-none sm:h-[90vh] overflow-hidden">
        <Chat phone={phone} contactEmail={email} />
      </div>
    </main>
  );
}
