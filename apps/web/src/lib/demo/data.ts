import { EXAMPLE_CONFIG, evaluateIncoming, type DemoTransaction, type IncomingTemplate } from "./rules.ts";

/** Illustrative data for the preview mode. Fictitious users, merchants and scores. */
type Seed = IncomingTemplate & { id: string; datetime: string };

const history = (count: number, averageAmount: number | null, usualMerchants: string[] = []) => ({ count, averageAmount, usualMerchants });

const SEEDS: Seed[] = [
  { id: "TX-D1A07", datetime: "2026-11-11T14:58:00Z", userId: "usr-1042", amount: 1_480_000, currency: "ARS", merchant: "TecnoShop Online", country: "AR", cardCountry: "AR", score: 91,
    factors: ["Monto 24 veces mayor al habitual", "Comercio nunca usado", "4 operaciones en la última hora"], history: history(38, 61_500, ["Supermercado Central", "Farmacia del Sol"]) },
  { id: "TX-D1A06", datetime: "2026-11-11T14:41:00Z", userId: "usr-2210", amount: 86_000, currency: "ARS", merchant: "Hotel Costa Azul", country: "UY", cardCountry: "AR", score: 72,
    factors: ["País de la operación distinto al habitual (UY)", "Horario fuera de lo habitual (03:12)"], history: history(12, 54_000, ["Estación YPF", "Librería Ateneo"]) },
  { id: "TX-D1A05", datetime: "2026-11-11T14:20:00Z", userId: "usr-3307", amount: 7_500, currency: "ARS", merchant: "Café Martínez", country: "AR", cardCountry: "AR", score: 12,
    factors: [], history: history(55, 9_800, ["Café Martínez"]) },
  { id: "TX-D1A04", datetime: "2026-11-11T13:55:00Z", userId: "usr-0918", amount: 240_000, currency: "ARS", merchant: "Electro Hogar", country: "AR", cardCountry: "BR", score: 64,
    factors: ["País de la tarjeta distinto (BR)", "Dispositivo nuevo"], history: history(7, 190_000, ["Electro Hogar"]) },
  { id: "TX-D1A03", datetime: "2026-11-11T13:12:00Z", userId: "usr-5521", amount: 32_000, currency: "ARS", merchant: "Supermercado Central", country: "AR", cardCountry: "AR", score: 18,
    factors: ["Compra consistente con el historial"], history: history(91, 29_000, ["Supermercado Central"]) },
  { id: "TX-D1A02", datetime: "2026-11-11T12:47:00Z", userId: "usr-7731", amount: 54_900, currency: "ARS", merchant: "Indumentaria Norte", country: "AR", cardCountry: "AR", score: 47,
    factors: ["Historial insuficiente"], history: history(0, null) },
  { id: "TX-D1A01", datetime: "2026-11-11T12:05:00Z", userId: "usr-1042", amount: 58_300, currency: "ARS", merchant: "Supermercado Central", country: "AR", cardCountry: "AR", score: 9,
    factors: ["Compra consistente con el historial"], history: history(37, 61_700, ["Supermercado Central", "Farmacia del Sol"]) },
  { id: "TX-D19F9", datetime: "2026-11-11T11:30:00Z", userId: "usr-6402", amount: 312_000, currency: "ARS", merchant: "Viajes Patagonia", country: "AR", cardCountry: "AR", score: 87,
    factors: ["Monto 9 veces mayor al habitual", "5 operaciones en la última hora", "Comercio nunca usado"], history: history(20, 34_000, ["Estación YPF"]) },
  { id: "TX-D19F8", datetime: "2026-11-11T10:52:00Z", userId: "usr-2210", amount: 4_200, currency: "ARS", merchant: "Kiosco 24 hs", country: "AR", cardCountry: "AR", score: 30,
    factors: [], history: history(11, 54_000, ["Estación YPF"]) },
  { id: "TX-D19F7", datetime: "2026-11-11T10:15:00Z", userId: "usr-8815", amount: 128_000, currency: "ARS", merchant: "Farmacia del Sol", country: "AR", cardCountry: "AR", score: 38,
    factors: ["Monto 2 veces mayor al habitual"], history: history(26, 61_000, ["Farmacia del Sol"]) },
];

export const DEMO_TRANSACTIONS: readonly DemoTransaction[] = SEEDS.map(({ id, datetime, ...template }) => ({
  ...evaluateIncoming(template, EXAMPLE_CONFIG, new Date(datetime), id),
  datetime,
}));

/** Pool for simulated live arrivals, cycled in order. */
export const INCOMING_TEMPLATES: readonly IncomingTemplate[] = [
  { userId: "usr-4410", amount: 920_000, currency: "ARS", merchant: "Celulares Express", country: "AR", cardCountry: "US", score: 89,
    factors: ["País de la tarjeta distinto (US)", "Comercio nunca usado", "Monto 15 veces mayor al habitual"], history: history(9, 61_000, ["Supermercado Central"]) },
  { userId: "usr-3307", amount: 8_900, currency: "ARS", merchant: "Café Martínez", country: "AR", cardCountry: "AR", score: 10,
    factors: [], history: history(56, 9_800, ["Café Martínez"]) },
  { userId: "usr-0918", amount: 175_000, currency: "ARS", merchant: "Electro Hogar", country: "AR", cardCountry: "BR", score: 66,
    factors: ["País de la tarjeta distinto (BR)", "Dispositivo nuevo"], history: history(8, 190_000, ["Electro Hogar"]) },
  { userId: "usr-5521", amount: 27_400, currency: "ARS", merchant: "Supermercado Central", country: "AR", cardCountry: "AR", score: 15,
    factors: ["Compra consistente con el historial"], history: history(92, 29_000, ["Supermercado Central"]) },
];
