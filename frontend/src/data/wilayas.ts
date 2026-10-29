export type Wilaya = { code: number; name: string; ar: string; aliases?: string[] };

export const WILAYAS: Wilaya[] = [
  { code: 1, name: "Adrar", ar: "أدرار" },
  { code: 2, name: "Chlef", ar: "الشلف", aliases: ["Ech-Chlef", "Echchelif"] },
  { code: 3, name: "Laghouat", ar: "الأغواط" },
  { code: 4, name: "Oum El Bouaghi", ar: "أم البواقي" },
  { code: 5, name: "Batna", ar: "باتنة" },
  { code: 6, name: "Béjaïa", ar: "بجاية" },
  { code: 7, name: "Biskra", ar: "بسكرة" },
  { code: 8, name: "Béchar", ar: "بشار" },
  { code: 9, name: "Blida", ar: "البليدة" },
  { code: 10, name: "Bouira", ar: "البويرة" },
  { code: 11, name: "Tamanrasset", ar: "تمنراست", aliases: ["Tamenghest"] },
  { code: 12, name: "Tébessa", ar: "تبسة" },
  { code: 13, name: "Tlemcen", ar: "تلمسان" },
  { code: 14, name: "Tiaret", ar: "تيارت" },
  { code: 15, name: "Tizi Ouzou", ar: "تيزي وزو" },
  { code: 16, name: "Algiers", ar: "الجزائر", aliases: ["Alger", "Alger Centre", "Algiers City", "الجزائر العاصمة", "Alger-Centre"] },
  { code: 17, name: "Djelfa", ar: "الجلفة" },
  { code: 18, name: "Jijel", ar: "جيجل" },
  { code: 19, name: "Sétif", ar: "سطيف" },
  { code: 20, name: "Saïda", ar: "سعيدة" },
  { code: 21, name: "Skikda", ar: "سكيكدة" },
  { code: 22, name: "Sidi Bel Abbès", ar: "سيدي بلعباس", aliases: ["SBA"] },
  { code: 23, name: "Annaba", ar: "عنابة" },
  { code: 24, name: "Guelma", ar: "قالمة" },
  { code: 25, name: "Constantine", ar: "قسنطينة", aliases: ["Qacentina"] },
  { code: 26, name: "Médéa", ar: "المدية" },
  { code: 27, name: "Mostaganem", ar: "مستغانم" },
  { code: 28, name: "M'Sila", ar: "المسيلة" },
  { code: 29, name: "Mascara", ar: "معسكر" },
  { code: 30, name: "Ouargla", ar: "ورقلة" },
  { code: 31, name: "Oran", ar: "وهران" },
  { code: 32, name: "El Bayadh", ar: "البيض" },
  { code: 33, name: "Illizi", ar: "إليزي" },
  { code: 34, name: "Bordj Bou Arréridj", ar: "برج بوعريريج", aliases: ["BBA"] },
  { code: 35, name: "Boumerdès", ar: "بومرداس" },
  { code: 36, name: "El Tarf", ar: "الطارف" },
  { code: 37, name: "Tindouf", ar: "تندوف" },
  { code: 38, name: "Tissemsilt", ar: "تيسمسيلت" },
  { code: 39, name: "El Oued", ar: "الوادي" },
  { code: 40, name: "Khenchela", ar: "خنشلة" },
  { code: 41, name: "Souk Ahras", ar: "سوق أهراس" },
  { code: 42, name: "Tipaza", ar: "تيبازة" },
  { code: 43, name: "Mila", ar: "ميلة" },
  { code: 44, name: "Aïn Defla", ar: "عين الدفلى" },
  { code: 45, name: "Naâma", ar: "النعامة" },
  { code: 46, name: "Aïn Témouchent", ar: "عين تموشنت" },
  { code: 47, name: "Ghardaïa", ar: "غرداية" },
  { code: 48, name: "Relizane", ar: "غليزان" },
  { code: 49, name: "Timimoune", ar: "تيميمون" },
  { code: 50, name: "Bordj Badji Mokhtar", ar: "برج باجي مختار" },
  { code: 51, name: "Ouled Djellal", ar: "أولاد جلال" },
  { code: 52, name: "Béni Abbès", ar: "بني عباس" },
  { code: 53, name: "In Salah", ar: "عين صالح", aliases: ["Ain Salah"] },
  { code: 54, name: "In Guezzam", ar: "عين قزام", aliases: ["Ain Guezzam"] },
  { code: 55, name: "Touggourt", ar: "تقرت" },
  { code: 56, name: "Djanet", ar: "جانت" },
  { code: 57, name: "El M'Ghair", ar: "المغير", aliases: ["El Meghaier"] },
  { code: 58, name: "El Meniaa", ar: "المنيعة", aliases: ["El Menia", "El-Menia"] },
  { code: 59, name: "Aflou", ar: "أفلو" },
  { code: 60, name: "El Abiodh Sidi Cheikh", ar: "الأبيض سيدي الشيخ" },
  { code: 61, name: "El Aricha", ar: "العريشة" },
  { code: 62, name: "El Kantara", ar: "القنطرة" },
  { code: 63, name: "Barika", ar: "بريكة" },
  { code: 64, name: "Bou Saâda", ar: "بوسعادة", aliases: ["Boussaada", "Bou Saada", "Boussaâda"] },
  { code: 65, name: "Bir El Ater", ar: "بئر العاتر" },
  { code: 66, name: "Ksar El Boukhari", ar: "قصر البخاري" },
  { code: 67, name: "Ksar Chellala", ar: "قصر الشلالة" },
  { code: 68, name: "Aïn Oussara", ar: "عين وسارة", aliases: ["Ain Oussera", "Aïn Oussera"] },
  { code: 69, name: "Messaad", ar: "مسعد" }
];

const simplify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u0600-\u06FF]+/g, '');

const INDEX: Record<string, string> = {};
WILAYAS.forEach(w => {
  INDEX[simplify(w.name)] = w.name;
  INDEX[simplify(w.ar)] = w.name;
  (w.aliases || []).forEach(a => { INDEX[simplify(a)] = w.name; });
});

// Alger / Algiers / الجزائر  =>  "Algiers". إذا ما عرفناش المدينة نرجعوها كيما كتبها المستخدم.
export const normalizeCity = (raw?: string | null): string => {
  const t = (raw || '').trim();
  if (!t) return '';
  return INDEX[simplify(t)] ?? t;
};

const ORDER: Record<string, number> = {};
WILAYAS.forEach(w => { ORDER[w.name] = w.code; });

// ترتيب المدن حسب رقم الولاية (الباقي في الآخر)
export const sortCities = (cities: string[]) =>
  [...cities].sort((a, b) => (ORDER[a] ?? 999) - (ORDER[b] ?? 999) || a.localeCompare(b));