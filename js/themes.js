(function () {
  var defaultTheme = {
    text: "black",
    background: "#fff0d0",
    hover: "#ffff60",
    line: "#d08080",
    activeText: "black",
    activeBackground: "orange",
    selectedText: "yellow",
    selectedBackground: "black",
  };
  var darkRedTheme = {
    text: "#ff8080",
    background: "black",
    hover: "#600000",
    line: "red",
    activeText: "red",
    activeBackground: "#900000",
    selectedText: "black",
    selectedBackground: "#ffd0d0",
  };
  function getTheme(themeId) {
    if (themeId === "THEME_DARKRED") {
      return darkRedTheme;
    }
    return defaultTheme;
  }
  window.getTheme = getTheme;
})();
