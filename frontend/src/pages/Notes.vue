<template>
  <q-page class="notes-page bg-grey-2 q-pa-md">
    <div class="page-container q-gutter-md">
        <q-form @submit.prevent="fetchList">
            <div class="row items-center q-col-gutter-md">
              <div class="col-12 col-sm-6 col-md-4">
                <q-input
                  v-model="query"
                  label="搜索..."
                  outlined
                  dense
                  clearable
                  debounce="300"
                  @keyup.enter="fetchList"
                />
              </div>
              <div class="col-auto">
                <q-btn
                  type="submit"
                  color="primary"
                  icon="search"
                  label="搜索"
                  :loading="isLoading"
                  no-caps
                />
              </div>
              <div class="col-auto">
                <q-btn
                  color="secondary"
                  icon="add"
                  label="新建"
                  no-caps
                  @click="createNote"
                />
              </div>
              <div class="col-auto">
                <q-btn
                  flat
                  color="negative"
                  icon="logout"
                  label="退出登录"
                  :loading="isLoggingOut"
                  no-caps
                  @click="logout"
                />
              </div>
            </div>
          <q-linear-progress v-if="isLoading" indeterminate color="primary" />
        </q-form>
      <br/>
      <q-banner v-if="errorMessage" class="bg-red-1 text-negative">
        {{ errorMessage }}
      </q-banner>

      <div v-if="!isLoading && notes.length === 0" class="empty-state text-grey-6">
        <q-icon name="sticky_note_2" size="64px" />
        <div class="text-subtitle1 q-mt-md">No notes yet</div>
        <div class="text-body2">Create your first note to get started.</div>
        <q-btn
          color="primary"
          class="q-mt-md"
          icon="add"
          label="Create a note"
          no-caps
          @click="createNote"
        />
      </div>

      <div v-else class="row q-col-gutter-md">
        <div v-for="note in notes" :key="note.id" class="col-12">
          <q-card bordered flat class="note-card cursor-pointer" @click="openNote(note.id)">
            <q-card-section class="q-pb-none">
              <div class="row items-start no-wrap">
                <div class="col">
                  <div class="text-h6 text-primary ellipsis">{{ note.title }}</div>
                  <div class="text-caption text-grey-6">{{ formatDate(note.updatedAt) }}</div>
                </div>
                <q-icon name="chevron_right" color="primary" />
              </div>
            </q-card-section>
            <q-card-section class="text-body2 text-grey-8">
              {{ excerpt(note.content) }}
            </q-card-section>
            <q-card-section v-if="note.tags.length" class="q-pt-none">
              <div class="row q-col-gutter-sm">
                <q-chip
                  v-for="tag in note.tags"
                  :key="tag.tag.id"
                  color="primary"
                  outline
                  size="sm"
                  icon="sell"
                >
                  {{ tag.tag.name }}
                </q-chip>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import http from "../api/http";
import { useAuth } from "../stores/auth";

interface NoteTag {
  tag: {
    id: string;
    name: string;
  };
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  tags: NoteTag[];
}

const router = useRouter();
const auth = useAuth();
const $q = useQuasar();

const query = ref("");
const notes = ref<NoteItem[]>([]);
const isLoading = ref(false);
const isLoggingOut = ref(false);
const errorMessage = ref("");

function parseError(error: any) {
  const fallback = "Unable to complete the request.";
  const message = error?.response?.data?.message || error?.message || fallback;
  return typeof message === "string" ? message : fallback;
}

function excerpt(content: string, length = 140) {
  if (!content) return "";
  const trimmed = content.trim();
  if (trimmed.length <= length) return trimmed;
  return `${trimmed.slice(0, length)}...`;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

async function fetchList() {
  if (isLoading.value) return;
  errorMessage.value = "";
  isLoading.value = true;
  try {
    const { data } = await http.get("/notes", { params: { q: query.value || undefined } });
    notes.value = data.items || [];
  } catch (error) {
    errorMessage.value = parseError(error);
    $q.notify({ type: "negative", message: errorMessage.value });
  } finally {
    isLoading.value = false;
  }
}

function openNote(id: string) {
  router.push({ name: "note-editor", params: { id } });
}

function createNote() {
  router.push({ name: "note-editor" });
}

async function logout() {
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  try {
    await auth.logout();
    $q.notify({ type: "info", message: "You have logged out." });
  } catch (error) {
    $q.notify({ type: "negative", message: parseError(error) });
  } finally {
    isLoggingOut.value = false;
  }
}

onMounted(fetchList);
</script>

<style scoped>
.notes-page {
  min-height: 100vh;
}

.page-container {
  max-width: 960px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

.note-card:hover {
  border-color: var(--q-primary);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
</style>

