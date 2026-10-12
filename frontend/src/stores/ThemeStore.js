import { makeAutoObservable } from "mobx";

class ThemeStore {
  darkMode =
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).get("theme") === "dark" ||
      localStorage.getItem("theme") === "dark");

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }
  applyTheme() {
    document.documentElement.setAttribute(
      "data-theme",
      this.darkMode ? "dark" : "light",
    );
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem("theme", this.darkMode ? "dark" : "light");
    this.applyTheme();
  }

  initializeTheme() {
    this.applyTheme();
  }
}

export default ThemeStore;
