import UserStore from "./UserStore";
import ThemeStore from "./ThemeStore";

class RootStore {
  constructor() {
    this.userStore = new UserStore(this);
    this.themeStore = new ThemeStore(this);
  }
}

const rootStore = new RootStore();
export default rootStore;
