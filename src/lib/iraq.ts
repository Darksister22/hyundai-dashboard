// Iraq's 19 governorates (provinces). Stored value = the English name.
export const IRAQ_PROVINCES = [
  "Baghdad",
  "Basra",
  "Nineveh",
  "Erbil",
  "Sulaymaniyah",
  "Dohuk",
  "Kirkuk",
  "Al Anbar",
  "Najaf",
  "Karbala",
  "Babil",
  "Wasit",
  "Maysan",
  "Dhi Qar",
  "Al-Muthanna",
  "Al-Qadisiyah",
  "Diyala",
  "Salah al-Din",
  "Halabja",
] as const;

export type IraqProvince = (typeof IRAQ_PROVINCES)[number];
