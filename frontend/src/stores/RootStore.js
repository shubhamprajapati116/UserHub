import UserStore from "./UserStore";
import ThemeStore from "./ThemeStore";
import NotificationStore from "./NotificationStore";

class RootStore {
  constructor() {
    this.userStore = new UserStore(this);
    this.themeStore = new ThemeStore(this);
    this.notificationStore = new NotificationStore(this);
  }
}

const rootStore = new RootStore();
export default rootStore;
