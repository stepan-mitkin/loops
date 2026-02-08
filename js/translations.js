(function () {
  var translationsEn = {
    EDITOR: "Editor",
    PROCESSES: "Processes",
  };
  var translationsRu = {
    EDITOR: "Редактор",
    PROCESSES: "Процессы",
  };
  function getTranslations(language) {
    language = language || "en";
    if (language === "ru") {
      return translationsRu;
    }

    return translationsEn;
  }
  window.getTranslations = getTranslations;
})();
