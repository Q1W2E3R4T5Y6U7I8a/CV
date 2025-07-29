// language-switcher.js - non-module version
document.addEventListener('DOMContentLoaded', () => {
  const languageButtons = document.querySelectorAll('.change_language h3');
  const elementsToTranslate = document.querySelectorAll('[data-en], [data-fr], [data-ua], [data-de]');
  
  const changeLanguage = (language) => {
    elementsToTranslate.forEach((element) => {
      if (element.dataset[language]) {
        element.textContent = element.dataset[language];
      }
    });
  };
  
  languageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const language = button.classList.contains('change_language_en') ? 'en' :
                       button.classList.contains('change_language_fr') ? 'fr' :
                       button.classList.contains('change_language_ua') ? 'ua' :
                       button.classList.contains('change_language_de') ? 'de' : null;
      if (language) changeLanguage(language);
    });
  });
});