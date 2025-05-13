import { useTranslation } from "react-i18next";

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === "en" ? "de" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        backgroundColor: "#02aab0",
        color: "white",
        border: "none",
        padding: "0.5rem 1rem",
        borderRadius: "5px",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      {currentLang === "en" ? "DE" : "EN"}
    </button>
  );
};

export default LanguageToggle;
