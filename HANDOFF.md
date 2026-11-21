# Handoff untuk Claude Code: Asisten Pesan Kuliner

Dokumen ini berisi semua yang perlu diketahui untuk membangun demo ini: konteks, keputusan yang sudah disetujui Widi, aturan kerja, dan rencana 6 tugas. Letakkan di akar repo baru, lalu mulai dengan prompt ini:

> Baca `HANDOFF.md`. Kerjakan Task 1 sampai 5 berurutan dengan TDD (tes dulu, lihat gagal, baru implementasi), commit per tugas. Berhenti di Task 6 dan tanya saya.

## Aturan kerja
- **Pakai bun, bukan npm/npx/pnpm/yarn:** `bun install`, `bun add`, `bun run dev`, `bun run build`, `bun test`.
- TDD per tugas: tes ditulis dan dijalankan gagal lebih dulu. Satu commit per tugas.
- Kerjakan Task 1–5 berurutan. **Task 6 butuh Widi** (akun Vercel/Upstash/Groq, DNS di registrar, dan repo situs utama `wididiky.my.id`); berhenti dan tanya sebelum menyentuhnya.
- Jangan menulis nomor WhatsApp atau email Widi di kode; hanya dari env (`WA_NUMBER`, `CONTACT_EMAIL`).
- Jangan menambah fitur di luar non-goals di bawah.

## Konteks dan tujuan
Widi Diky (fullstack developer, Banyuwangi) ingin menarik **klien freelance dari UMKM kuliner lokal**. Demo ini dipasang di subdomain `wididiky.my.id` (usulan: `pesan.wididiky.my.id`). Calon klien mencoba chat dengan asisten sebuah warung fiktif, lalu menghubungi Widi. Data 2026 menunjukkan >90% UMKM belum memakai AI dan hambatan utamanya literasi digital, jadi demo harus terasa seperti "pesanan tidak ada yang terlewat", bukan "ini AI". Karena itu halaman demo tidak memakai label "AI".

## Goals
- Satu halaman demo di subdomain; pengunjung chat dengan asisten warung fiktif: tanya menu, harga, jam buka, lalu memesan.
- Di akhir, asisten merangkum pesanan dan menampilkan tombol yang membuka WhatsApp dengan pesan siap kirim (`wa.me`).
- Tombol kontak ke Widi dan banner kecil "Dibuat oleh Widi Diky — hubungi saya" di halaman demo.
- Demo ditautkan dari halaman `/portfolio/*`; email/WhatsApp Widi ditambahkan di situs utama.

## Non-goals
- Pencatatan penjualan, laporan, login, halaman pemilik.
- WhatsApp Business API atau notifikasi otomatis ke pemilik usaha.
- Platform subdomain untuk orang lain; memasang tools lama (Patungin, Pasalin, dll.).
- Email pemberitahuan harian ke Widi (sengaja ditunda).

## Anti-goals (gagal walau berfungsi)
- Demo mati saat klien mencoba karena kuota AI habis.
- Pengunjung melihat istilah teknis (kuota, rate limit, error API).
- Halaman terasa seperti "demo AI" dan bukan solusi untuk pemilik warung.

## Keputusan yang sudah disetujui Widi
- Model: tools milik Widi di subdomain, bukan platform untuk orang lain. Tujuan: menarik klien freelance.
- Hosting Vercel, DNS di registrar (satu record CNAME untuk subdomain).
- Lingkup demo pertama: **asisten chat saja** (tanpa pencatatan/laporan).
- Merek fiktif: **warung makan aneka menu** (paket nasi, lauk, minuman). Nama merek dan isi menu ditentukan saat membangun.
- Tombol "kirim pesanan" membuka WhatsApp ke **nomor WhatsApp Widi**, pesan diawali `[Demo]`. Akibatnya nomor Widi tampil publik dan pesanan palsu dari orang iseng bisa masuk.
- Batas pemakaian: **batas pesan per pengunjung + batas harian total**, tanpa login. Saat habis, tampil pesan ramah dan tombol kontak.
- Ukuran sukses: **Vercel Analytics** dasar (kunjungan + klik tombol kontak). Isi percakapan tidak disimpan.

## Pesan ke pengunjung (bahasa sehari-hari, tanpa istilah teknis, selalu dengan tombol kontak)
- Jatah pengunjung habis: "Terima kasih sudah mencoba! Jatah coba kamu hari ini sudah habis. Punya usaha kuliner dan mau dibuatkan yang seperti ini? Hubungi Widi lewat WhatsApp."
- Jatah harian demo habis / AI tidak bisa dipakai: "Asistennya sedang istirahat sebentar karena banyak yang mencoba. Coba lagi besok, atau hubungi Widi untuk lihat demo langsung."
- Gangguan sementara: "Maaf, asistennya sedang sibuk. Coba kirim lagi sebentar lagi."

## Keputusan Claude (boleh dikoreksi Widi)
- Stack: Next.js di Vercel dengan Groq (Llama), Vercel AI SDK, tanpa hosting baru; seperti proyek Rujukin.
- Penghitung batas butuh penyimpanan kecil (Upstash Redis) yang hanya berisi angka hitungan, bukan pesanan.
- Alur chat: pilih menu dan jumlah, antar atau ambil sendiri, nama pemesan, ringkasan pesanan.
- Kontak di situs utama: nomor WhatsApp dan email; nilainya diisi Widi lewat konfigurasi.
- Tes memakai `bun test` (bukan Vitest) supaya tidak menambah dependensi; tes React memakai `renderToStaticMarkup` dari `react-dom/server` (bukan React Testing Library).

## Diserahkan ke pembangun
Tampilan chat, kata-kata asisten, isi menu fiktif, nilai batas pesan (default 15 per pengunjung, 300 harian), pilihan nama subdomain final.

---

## Rencana pengerjaan (6 tugas)

**Goal:** Demo chat "asisten pesan" untuk warung makan fiktif di `pesan.wididiky.my.id` yang merangkum pesanan lalu membuka WhatsApp ke nomor Widi, dengan batas pemakaian dan pesan non-teknis.

**Architecture:** Satu app Next.js di Vercel. Route `POST /api/chat` memeriksa batas (per pengunjung + harian total) lalu men-stream jawaban Groq lewat Vercel AI SDK; pesanan keluar sebagai tool call `submitOrder` bertipe ketat, dirender sebagai ringkasan + tombol `wa.me`. Penghitung batas disimpan di Upstash Redis (hanya angka).

**Tech Stack:** Next.js 16, TypeScript, Vercel AI SDK (`ai`, `@ai-sdk/groq`), zod, Upstash Redis (`@upstash/redis`), `@vercel/analytics`, Tailwind CSS v4, bun (package manager dan test runner: `bun test`).

## Global Constraints

- Hosting Vercel; subdomain usulan `pesan.wididiky.my.id` (satu record DNS di registrar).
- Data demo: merek kuliner fiktif, warung makan aneka menu (paket nasi, lauk, minuman).
- Tanpa login, tanpa database pesanan, isi percakapan tidak disimpan. Satu-satunya penyimpanan: angka penghitung batas.
- Tombol "kirim pesanan" membuka `wa.me` ke nomor WhatsApp Widi; teks pesan **diawali `[Demo]`**.
- Pesan ke pengunjung selalu bahasa sehari-hari: tidak boleh memuat kata teknis (kuota, rate limit, error, API, token, 429, server) dan selalu disertai tombol kontak ke Widi.
- Nomor WhatsApp dan email Widi hanya dari env (`WA_NUMBER`, `CONTACT_EMAIL`), tidak ditulis di kode.
- Analytics dasar saja: kunjungan dan klik kontak (Vercel Analytics).
- Hari batas dihitung dengan zona waktu `Asia/Jakarta`.

## Review Focus

1. Pengunjung menghapus cookie/refresh untuk lolos batas pribadi: batas harian total tetap menahan, tanpa pesan teknis.
2. Redis tidak bisa dihubungi: sistem menolak dengan `MSG_BUSY` (gagal tertutup), bukan lolos tanpa batas dan bukan menampilkan error mentah.
3. Pesanan berisi menu yang tidak ada, jumlah 0, negatif, pecahan, atau sangat besar: ditolak oleh skema, tidak sampai ke tombol WhatsApp.
4. Nama pemesan berisi emoji, baris baru, `&`, atau `#`: link `wa.me` tetap valid dan pesan utuh (di-encode).
5. Pesan pengunjung sangat panjang atau kosong: ditolak dengan pesan ramah, tidak dikirim ke Groq.

---

## File Structure

| File | Tanggung jawab |
|---|---|
| `src/lib/menu.ts` | Data merek fiktif dan menu |
| `src/lib/messages.ts` | Semua teks yang dilihat pengunjung untuk kondisi batas/gangguan |
| `src/lib/limits.ts` | Logika batas pemakaian di atas antarmuka `CounterStore` |
| `src/lib/store.ts` | `CounterStore` Upstash + versi in-memory untuk tes |
| `src/lib/order.ts` | Skema `Order`, ringkasan, dan `buildWhatsAppLink` |
| `src/lib/prompt.ts` | `buildSystemPrompt` |
| `src/app/api/chat/route.ts` | Endpoint chat: validasi, batas, Groq, penanganan gangguan |
| `src/components/Chat.tsx`, `OrderSummary.tsx`, `ContactBanner.tsx` | UI |
| `src/app/page.tsx`, `src/app/layout.tsx` | Halaman dan Analytics |
| `tests/*.test.ts` | `bun test` (impor `test`, `expect` dari `bun:test`) |

## Task 1: Scaffold, menu, dan pesan ke pengunjung

**Files:**
- Create: Next.js app (`bun create next-app`, TypeScript, Tailwind, App Router), `.env.example`, `src/lib/menu.ts`, `src/lib/messages.ts`
- Test: `tests/messages.test.ts`, `tests/menu.test.ts`

**Interfaces:**
- Produces: `type MenuItem = { id: string; name: string; price: number; category: 'paket' | 'lauk' | 'minuman' }`; `WARUNG_NAME: string`; `MENU: MenuItem[]` (minimal 10 item, id unik, harga bilangan bulat rupiah); `MSG_VISITOR_LIMIT`, `MSG_DAILY_LIMIT`, `MSG_BUSY`, `MSG_BAD_INPUT: string`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
// tests/messages.test.ts
import * as m from '@/lib/messages';
const FORBIDDEN = /kuota|rate ?limit|error|api|token|429|server/i;
test.each(['MSG_VISITOR_LIMIT','MSG_DAILY_LIMIT','MSG_BUSY','MSG_BAD_INPUT'] as const)(
  '%s tidak memuat istilah teknis', (k) => { expect(m[k]).not.toMatch(FORBIDDEN); });
test('pesan batas menyebut Widi', () => {
  expect(m.MSG_VISITOR_LIMIT).toMatch(/Widi/);
  expect(m.MSG_DAILY_LIMIT).toMatch(/Widi/);
});
// tests/menu.test.ts
import { MENU } from '@/lib/menu';
test('id menu unik dan harga bilangan bulat positif', () => {
  expect(new Set(MENU.map(i => i.id)).size).toBe(MENU.length);
  expect(MENU.every(i => Number.isInteger(i.price) && i.price > 0)).toBe(true);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**: `bun test` → FAIL (modul belum ada).
- [ ] **Step 3: Scaffold app, pasang dependensi (lihat Tech Stack), buat `menu.ts` dan `messages.ts`.** Teks dari spec: jatah pengunjung habis ("Terima kasih sudah mencoba! Jatah coba kamu hari ini sudah habis. Punya usaha kuliner dan mau dibuatkan yang seperti ini? Hubungi Widi lewat WhatsApp."), jatah harian habis ("Asistennya sedang istirahat sebentar karena banyak yang mencoba. Coba lagi besok, atau hubungi Widi untuk lihat demo langsung."), gangguan ("Maaf, asistennya sedang sibuk. Coba kirim lagi sebentar lagi."). `MSG_BAD_INPUT` ditulis sendiri, ramah, ≤ 1 kalimat.
- [ ] **Step 4: Jalankan tes**: `bun test` → PASS.
- [ ] **Step 5: Commit**: `git add -A && git commit -m "feat: scaffold app, menu, user-facing messages"`

## Task 2: Batas pemakaian

**Files:**
- Create: `src/lib/limits.ts`, `src/lib/store.ts`
- Test: `tests/limits.test.ts`

**Interfaces:**
- Produces: `interface CounterStore { incr(key: string, ttlSeconds: number): Promise<number> }`; `type LimitConfig = { perVisitor: number; global: number }`; `type LimitResult = { allowed: true } | { allowed: false; reason: 'visitor' | 'daily' | 'unavailable' }`; `checkAndConsume(visitorId: string, store: CounterStore, cfg: LimitConfig, now?: Date): Promise<LimitResult>`; `dayKey(now: Date): string` (tanggal `YYYY-MM-DD` di `Asia/Jakarta`); `memoryStore(): CounterStore`; `upstashStore(): CounterStore` (membaca `UPSTASH_REDIS_REST_URL/TOKEN`).

- [ ] **Step 1: Tulis tes yang gagal** (store in-memory):

```ts
test('pengunjung ditolak setelah melewati batas pribadi', async () => { /* perVisitor=2: 2x allowed, 3x -> {allowed:false, reason:'visitor'} */ });
test('batas harian total menahan pengunjung berbeda (cookie baru)', async () => { /* global=3, 4 id berbeda: ke-4 -> reason:'daily' */ });
test('hari berganti menurut waktu Jakarta, bukan UTC', () => {
  expect(dayKey(new Date('2026-11-22T17:30:00Z'))).toBe('2026-11-23'); // 00:30 WIB
});
test('store melempar error -> gagal tertutup', async () => { /* store.incr rejects -> {allowed:false, reason:'unavailable'} */ });
```

- [ ] **Step 2: Jalankan, pastikan gagal.**
- [ ] **Step 3: Implementasi `checkAndConsume`.** Dua kunci per hari (`v:{day}:{visitorId}`, `g:{day}`), TTL 48 jam; periksa pengunjung dulu, lalu global; tangkap error store → `unavailable`. `upstashStore` memakai `redis.incr` + `expire` saat nilai pertama.
- [ ] **Step 4: Jalankan tes** (`bun test`) → PASS.
- [ ] **Step 5: Commit**: `git commit -am "feat: usage limits with fail-closed store"`

## Task 3: Skema pesanan dan link WhatsApp

**Files:**
- Create: `src/lib/order.ts`
- Test: `tests/order.test.ts`

**Interfaces:**
- Consumes: `MENU`, `MenuItem` dari Task 1.
- Produces: `orderSchema` (zod): `{ items: {menuId: string; qty: number}[] (1–20 item, qty bilangan bulat 1–20, menuId harus ada di MENU), fulfillment: 'antar' | 'ambil', name: string (1–60 karakter), address?: string (≤ 200; wajib bila antar) }`; `type Order = z.infer<typeof orderSchema>`; `summarize(order: Order): { lines: {name: string; qty: number; subtotal: number}[]; total: number }`; `buildWhatsAppLink(order: Order, phone: string): string` → `https://wa.me/{phone}?text={encodeURIComponent(pesan)}`, pesan diawali `[Demo]`.

- [ ] **Step 1: Tulis tes yang gagal**

```ts
test('qty 0, negatif, pecahan, dan 21 ditolak', () => { /* safeParse(...).success === false */ });
test('menuId yang tidak ada ditolak', () => {});
test('antar tanpa alamat ditolak', () => {});
test('total dihitung dari harga menu, bukan dari input', () => {});
test('link diawali https://wa.me/ dan pesannya diawali [Demo]', () => {
  const url = new URL(buildWhatsAppLink(validOrder, '6281234567890'));
  expect(url.searchParams.get('text')!.startsWith('[Demo]')).toBe(true);
});
test('nama dengan emoji, baris baru, & dan # tetap utuh setelah decode', () => {
  const url = new URL(buildWhatsAppLink({ ...validOrder, name: 'Budi 😀\n& #1' }, '6281234567890'));
  expect(url.searchParams.get('text')).toContain('Budi 😀\n& #1');
});
```

- [ ] **Step 2: Jalankan, pastikan gagal.**
- [ ] **Step 3: Implementasi** sesuai Interfaces. Subtotal dan total selalu dihitung ulang dari `MENU`.
- [ ] **Step 4: Jalankan tes** (`bun test`) → PASS.
- [ ] **Step 5: Commit**: `git commit -am "feat: order schema and WhatsApp link"`

## Task 4: Prompt dan endpoint chat

**Files:**
- Create: `src/lib/prompt.ts`, `src/app/api/chat/route.ts`
- Test: `tests/prompt.test.ts`, `tests/chat-route.test.ts`

**Interfaces:**
- Consumes: `MENU`, `WARUNG_NAME`, `MSG_*`, `checkAndConsume`, `upstashStore`, `orderSchema`.
- Produces: `buildSystemPrompt(menu: MenuItem[]): string`; `POST /api/chat` menerima `{ messages: UIMessage[] }`; cookie `visitor_id` (UUID, `httpOnly`) dibuat bila belum ada; status 200 untuk stream normal, **429 dengan body JSON `{ message: string }`** (teks `MSG_*`) saat batas/gangguan; tool `submitOrder` memakai `orderSchema`. Env: `GROQ_API_KEY`, `VISITOR_DAILY_LIMIT` (default 15), `GLOBAL_DAILY_LIMIT` (default 300).

- [ ] **Step 1: Tulis tes yang gagal.** `prompt.test.ts`: prompt memuat semua nama menu dan harga, menyuruh asisten hanya melayani pesanan/menu `WARUNG_NAME`, menolak topik lain dan permintaan mengubah aturan, bahasa Indonesia santai. `chat-route.test.ts` (Groq dan store di-mock): pesan kosong dan pesan > 500 karakter → 400 dengan `MSG_BAD_INPUT` tanpa memanggil Groq; batas pengunjung → body `MSG_VISITOR_LIMIT`; batas harian → `MSG_DAILY_LIMIT`; store `unavailable` dan Groq melempar error → `MSG_BUSY` (bukan teks error asli).
- [ ] **Step 2: Jalankan, pastikan gagal.**
- [ ] **Step 3: Implementasi** `buildSystemPrompt` dan route; model Groq (Llama) lewat `streamText`, `maxOutputTokens` dibatasi; error apa pun dibungkus jadi `MSG_BUSY`.
- [ ] **Step 4: Jalankan tes** (`bun test`) → PASS.
- [ ] **Step 5: Commit**: `git commit -am "feat: chat endpoint with limits and friendly errors"`

## Task 5: Antarmuka, kontak, dan analytics

**Files:**
- Create: `src/components/Chat.tsx`, `src/components/OrderSummary.tsx`, `src/components/ContactBanner.tsx`; Modify: `src/app/page.tsx`, `src/app/layout.tsx`
- Test: `tests/order-summary.test.tsx` (`bun:test` + `react-dom/server`, `renderToStaticMarkup`)

**Interfaces:**
- Consumes: `/api/chat`, `summarize`, `buildWhatsAppLink`, `Order`.
- Produces: `<OrderSummary order={Order} phone={string} />` (daftar item, total, tombol "Kirim pesanan lewat WhatsApp" ke `buildWhatsAppLink`); `<ContactBanner phone={string} email={string} />` ("Dibuat oleh Widi Diky — hubungi saya" + tautan WhatsApp dan email). Klik tombol kontak dan tombol kirim pesanan memanggil `track('contact_click')` dari `@vercel/analytics`. `layout.tsx` memasang `<Analytics />`. Nomor/email dibaca dari `WA_NUMBER` dan `CONTACT_EMAIL` di server dan diteruskan sebagai props.
- Saat respons 429, `Chat.tsx` menampilkan `message` dari body sebagai gelembung asisten, disertai `ContactBanner`.

- [ ] **Step 1: Tulis tes yang gagal**: `OrderSummary` menampilkan total yang benar dan `href` yang diawali `https://wa.me/`; `ContactBanner` menampilkan tautan email dan WhatsApp dari props.
- [ ] **Step 2: Jalankan, pastikan gagal.**
- [ ] **Step 3: Implementasi UI** (Tailwind, mobile-first karena pemilik warung memakai ponsel; tampilan sederhana dan hangat).
- [ ] **Step 4: Jalankan tes** (`bun test`) → PASS; lalu `bun run build` → sukses tanpa error.
- [ ] **Step 5: Commit**: `git commit -am "feat: chat UI, order summary, contact banner, analytics"`

## Task 6: Deploy, subdomain, dan penautan dari situs utama

**Files:**
- Modify: `README.md` (langkah env dan deploy); repo situs utama `wididiky.my.id` (lokasi kode belum diketahui, cari dulu bersama Widi)

- [ ] **Step 1: Deploy ke Vercel**, isi env: `GROQ_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `WA_NUMBER` (format `62…`, tanpa `+`), `CONTACT_EMAIL`, `VISITOR_DAILY_LIMIT`, `GLOBAL_DAILY_LIMIT`.
- [ ] **Step 2: Tambah domain `pesan.wididiky.my.id` di project Vercel**, lalu satu record CNAME di DNS registrar sesuai instruksi Vercel. Verifikasi: `https://pesan.wididiky.my.id` terbuka dengan HTTPS.
- [ ] **Step 3: Verifikasi manual di produksi**: pesan lengkap sampai tombol WhatsApp terbuka dengan teks `[Demo]…`; ulangi pesan sampai jatah pengunjung habis dan pastikan pesan ramah + tombol kontak muncul; periksa Vercel Analytics mencatat kunjungan dan klik kontak.
- [ ] **Step 4: Di situs utama**, tambahkan nomor WhatsApp dan email (dari Widi), serta tautan "Coba demo" ke subdomain pada halaman `/portfolio/*` yang relevan.
- [ ] **Step 5: Commit** perubahan README dan situs utama di masing-masing repo.

## Self-Review

- **Spec coverage:** subdomain + chat (T1, T4, T5, T6); alur menu→ringkasan→`wa.me` `[Demo]` (T3, T5); batas per pengunjung + harian, tanpa login (T2, T4); pesan non-teknis + tombol kontak (T1, T4, T5); analytics (T5); kontak di situs utama dan tautan portofolio (T6); merek fiktif warung makan (T1); non-goals (tanpa DB pesanan, tanpa WhatsApp API) tidak ada tugasnya. Pemberitahuan email harian ke Widi **sengaja tidak dimasukkan** karena spec menandainya bisa ditunda.
- **Konsistensi tipe:** `Order`, `orderSchema`, `LimitResult`, `CounterStore`, dan `MSG_*` dipakai dengan nama sama di semua tugas.
- **Review Focus** 1–5 masing-masing punya tes: (1) T2 batas harian, (2) T2 gagal tertutup + T4, (3) T3 skema, (4) T3 encoding, (5) T4 panjang pesan.
