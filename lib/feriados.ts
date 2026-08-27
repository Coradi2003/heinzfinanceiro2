// Utility for Brazilian National Holidays (Feriados Nacionais do Brasil)
// Calculates fixed and movable holidays dynamically for any year using Meeus Easter algorithm.

export interface Feriado {
  data: string; // YYYY-MM-DD
  nome: string;
}

function calcPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const mes = Math.floor((h + L - 7 * m + 114) / 31);
  const dia = ((h + L - 7 * m + 114) % 31) + 1;

  return new Date(ano, mes - 1, dia);
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

export function getFeriadosNacionais(ano: number): Feriado[] {
  const pascoa = calcPascoa(ano);

  const carnaval = addDays(pascoa, -47);
  const sextaFeiraSanta = addDays(pascoa, -2);
  const corpusChristi = addDays(pascoa, 60);

  const fixos: Feriado[] = [
    { data: `${ano}-01-01`, nome: 'Confraternização Universal (Ano Novo)' },
    { data: `${ano}-04-21`, nome: 'Tiradentes' },
    { data: `${ano}-05-01`, nome: 'Dia do Trabalhador' },
    { data: `${ano}-09-07`, nome: 'Independência do Brasil' },
    { data: `${ano}-10-12`, nome: 'Nossa Senhora Aparecida' },
    { data: `${ano}-11-02`, nome: 'Finados' },
    { data: `${ano}-11-15`, nome: 'Proclamação da República' },
    { data: `${ano}-11-20`, nome: 'Dia da Consciência Negra' },
    { data: `${ano}-12-25`, nome: 'Natal' },
  ];

  const meveis: Feriado[] = [
    { data: formatDateISO(carnaval), nome: 'Carnaval' },
    { data: formatDateISO(sextaFeiraSanta), nome: 'Paixão de Cristo (Sexta-feira Santa)' },
    { data: formatDateISO(corpusChristi), nome: 'Corpus Christi' },
  ];

  return [...fixos, ...meveis].sort((a, b) => a.data.localeCompare(b.data));
}

export function getFeriadoDoDia(date: Date): Feriado | null {
  const ano = date.getFullYear();
  const feriados = getFeriadosNacionais(ano);
  const targetDateStr = formatDateISO(date);

  return feriados.find(f => f.data === targetDateStr) || null;
}
