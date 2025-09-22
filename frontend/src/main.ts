import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./pages/App.vue";
import router from "./router";
import "quasar/dist/quasar.css";
import "@quasar/extras/material-icons/material-icons.css";
import { Quasar, Notify, Loading, Dialog } from "quasar";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Quasar, {
  plugins: {
    Notify,
    Loading,
    Dialog
  }
});

app.mount("#app");
