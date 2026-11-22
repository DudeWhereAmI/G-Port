import React, { createContext, useContext, useState } from "react";

export type AppLanguage = "EN" | "VN";

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  isVN: boolean;
  t: (en: string, vn: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "EN",
  setLang: () => {},
  toggleLang: () => {},
  isVN: false,
  t: (en) => en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLang] = useState<AppLanguage>("EN");

  const toggleLang = () => {
    setLang((prev) => (prev === "EN" ? "VN" : "EN"));
  };

  const isVN = lang === "VN";
  const t = (en: string, vn: string) => (isVN ? vn : en);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isVN, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
