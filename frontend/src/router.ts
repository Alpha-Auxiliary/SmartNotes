import { createRouter, createWebHistory } from "vue-router";
import Login from "./pages/Login.vue";
import Notes from "./pages/Notes.vue";
import NoteEditor from "./pages/NoteEditor.vue";
import { useAuth } from "./stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: Login, meta: { hideHeader: true } },
    { path: "/", name: "notes", component: Notes, meta: { auth: true } },
    { path: "/edit/:id?", name: "note-editor", component: NoteEditor, meta: { auth: true } }
  ]
});

router.beforeEach((to, _from, next) => {
  const auth = useAuth();
  const isAuthenticated = !!auth.accessToken;

  if (to.meta.auth && !isAuthenticated) {
    return next({ name: "login" });
  }

  if (to.name === "login" && isAuthenticated) {
    return next({ name: "notes" });
  }

  next();
});

export default router;
