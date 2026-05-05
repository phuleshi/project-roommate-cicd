import { createContext, useContext, useEffect, useState } from "react";
import {
  getStoredLanguage,
  locales,
  setStoredLanguage,
  tForLanguage,
} from "../i18n/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage);

  useEffect(() => {
    setStoredLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (nextLanguage) => {
    setLanguageState(nextLanguage === "en" ? "en" : "vi");
  };

  const t = (key, params) => tForLanguage(language, key, params);

  return (
    <LanguageContext.Provider
      value={{
        language,
        locale: locales[language] || locales.vi,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
