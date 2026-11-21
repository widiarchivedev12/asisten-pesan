export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: "paket" | "lauk" | "minuman";
};

export const WARUNG_NAME = "Warung Mak Yem";

export const MENU: MenuItem[] = [
  { id: "paket-ayam", name: "Paket Nasi Ayam Goreng", price: 15000, category: "paket" },
  { id: "paket-lele", name: "Paket Nasi Lele Goreng", price: 14000, category: "paket" },
  { id: "paket-tempe", name: "Paket Nasi Tempe Orek", price: 10000, category: "paket" },
  { id: "paket-campur", name: "Paket Nasi Campur", price: 18000, category: "paket" },
  { id: "lauk-ayam", name: "Ayam Goreng", price: 8000, category: "lauk" },
  { id: "lauk-lele", name: "Lele Goreng", price: 7000, category: "lauk" },
  { id: "lauk-tempe", name: "Tempe Goreng", price: 3000, category: "lauk" },
  { id: "lauk-tahu", name: "Tahu Goreng", price: 3000, category: "lauk" },
  { id: "lauk-telur", name: "Telur Dadar", price: 4000, category: "lauk" },
  { id: "minum-teh", name: "Es Teh Manis", price: 3000, category: "minuman" },
  { id: "minum-jeruk", name: "Es Jeruk", price: 5000, category: "minuman" },
  { id: "minum-air", name: "Air Mineral", price: 3000, category: "minuman" },
];
