import { AppLanguage, useLanguage } from "../context/LanguageContext";

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(lang: AppLanguage, decimals: number): Intl.NumberFormat {
  const key = `${lang}|${decimals}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(lang === "VN" ? "vi-VN" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(key, f);
  }
  return f;
}

/** VN: 8.151 / 98,7 · EN: 8,151 / 98.7 */
export function formatNumber(value: number, lang: AppLanguage, decimals = 0): string {
  return getFormatter(lang, decimals).format(value);
}

export function formatKw(value: number, lang: AppLanguage, decimals = 0): string {
  return `${formatNumber(value, lang, decimals)} kW`;
}

/** `value` is already in percent units (98.7 → "98,7%") */
export function formatPercent(value: number, lang: AppLanguage, decimals = 1): string {
  return `${formatNumber(value, lang, decimals)}%`;
}

/** Compact axis label: 8000 → "8k", 0 → "0" */
export function formatKShort(value: number): string {
  if (value === 0) return "0";
  return `${Math.round(value / 100) / 10}k`;
}

export function useFormat() {
  const { lang } = useLanguage();
  return {
    lang,
    num: (v: number, decimals = 0) => formatNumber(v, lang, decimals),
    kw: (v: number, decimals = 0) => formatKw(v, lang, decimals),
    pct: (v: number, decimals = 1) => formatPercent(v, lang, decimals),
  };
}
