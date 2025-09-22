<template>
  <q-page class="auth-page flex flex-center bg-grey-2 q-pa-md">
    <q-card flat bordered class="form-card q-pa-lg">
      <q-card-section class="text-center q-pb-none">
        <div class="text-h5 text-primary">SmartNotes</div>
        <div class="text-subtitle2 text-grey-7">登录或创建一个新账户</div>
      </q-card-section>
      <q-card-section>
        <q-form ref="formRef" class="q-gutter-md" @submit.prevent="login">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dense
            clearable
            autocomplete="email"
            :rules="emailRules"
          />
          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            outlined
            dense
            autocomplete="current-password"
            :rules="passwordRules"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-banner v-if="err" class="bg-red-1 text-negative">
            {{ err }}
          </q-banner>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-btn
                type="submit"
                color="primary"
                label="Log in"
                icon="login"
                class="full-width"
                :loading="isLoading"
                no-caps
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-btn
                color="secondary"
                label="Register"
                icon="person_add"
                class="full-width"
                :loading="isRegisterLoading"
                no-caps
                @click="register"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import type { QForm } from "quasar";
import { useAuth } from "../stores/auth";

const auth = useAuth();
const router = useRouter();
const $q = useQuasar();

const formRef = ref<QForm | null>(null);
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const err = ref("");
const isLoading = ref(false);
const isRegisterLoading = ref(false);

const emailRules = [
  (val: string) => !!val || "请输入邮箱",
  (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || "请输入正确的邮箱地址"
];

const passwordRules = [
  (val: string) => !!val || "请输入密码",
  (val: string) => val.length >= 6 || "密码至少为六位"
];

onMounted(() => {
  auth.$patch({ accessToken: "", refreshToken: "" });
  localStorage.removeItem("at");
  localStorage.removeItem("rt");
  localStorage.removeItem("refreshToken");
});

watch([email, password], () => {
  err.value = "";
});

function showError(message: string) {
  err.value = message;
  $q.notify({ type: "negative", message });
}

async function validateForm() {
  return (await formRef.value?.validate?.()) === true;
}

function parseError(error: any) {
  const fallback = "请求失败，请稍后重试";
  const message = error?.response?.data?.message || error?.message || fallback;

  if (typeof message === "string") {
    if (message.includes("Invalid password")) return "密码错误.";
    if (message.includes("User not found")) return "账号未创建";
    if (message.includes("Network Error")) return "网络错误";
    if (message.includes("email must be an email")) return "邮箱格式错误";
    if (message.includes("password must be longer than or equal to 6")) {
      return "密码至少为六位";
    }
    return message;
  }

  return fallback;
}

async function login() {
  err.value = "";
  if (isRegisterLoading.value) return;

  if (!(await validateForm())) {
    return;
  }

  isLoading.value = true;
  try {
    await auth.login(email.value, password.value);
    $q.notify({ type: "positive", message: "欢迎回来！" });
    router.push({ name: "notes" });
  } catch (error) {
    showError(parseError(error));
  } finally {
    isLoading.value = false;
  }
}

async function register() {
  err.value = "";
  if (isLoading.value) return;

  if (!(await validateForm())) {
    return;
  }

  isRegisterLoading.value = true;
  try {
    await auth.register(email.value, password.value);
    $q.notify({ type: "positive", message: "注册成功" });
    router.push({ name: "notes" });
  } catch (error) {
    showError(parseError(error));
  } finally {
    isRegisterLoading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
}

.form-card {
  width: 100%;
  max-width: 420px;
}
</style>
