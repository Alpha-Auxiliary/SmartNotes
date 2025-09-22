<template>
  <q-page class="editor-page bg-grey-2 q-pa-md">
    <div class="editor-container">
      <q-card bordered flat>
        <q-form ref="formRef" class="q-gutter-md" @submit.prevent="save">
          <q-card-section class="row items-center q-col-gutter-md">
            <div class="col" >
              <div class="text-h6 text-primary">{{ headerTitle }}</div>
              <div class="text-caption text-grey-6">{{ subtitle }}</div>
            </div>
            <div class="col-auto">
              <div class="row q-col-gutter-sm">
                <div class="col-auto">
                  <q-btn
                    type="submit"
                    color="primary"
                    icon="save"
                    label="Save"
                    :loading="isSaving"
                    :disable="isLoading"
                    no-caps
                  />
                </div>
                <div class="col-auto">
                  <q-btn
                    flat
                    color="primary"
                    icon="arrow_back"
                    label="Back"
                    no-caps
                    @click="goBack"
                  />
                </div>
                <div v-if="noteId" class="col-auto">
                  <q-btn
                    flat
                    color="negative"
                    icon="delete"
                    label="Delete"
                    :loading="isDeleting"
                    :disable="isLoading"
                    no-caps
                    @click="confirmDelete"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
          <q-linear-progress v-if="isLoading" indeterminate color="primary" />
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="title"
              label="Title"
              outlined
              dense
              :disable="isLoading"
              :rules="titleRules"
            />
            <q-input
              v-model="content"
              label="Content"
              type="textarea"
              outlined
              autogrow
              :rows="12"
              :disable="isLoading"
            />
            <q-input
              v-model="tags"
              label="Tags"
              hint="Separate tags with commas"
              outlined
              dense
              :disable="isLoading"
            />
            <div v-if="tagList.length" class="row q-col-gutter-sm">
              <q-chip
                v-for="tag in tagList"
                :key="tag"
                color="secondary"
                outline
                size="sm"
                icon="sell"
              >
                {{ tag }}
              </q-chip>
            </div>
            <q-banner v-if="errorMessage" class="bg-red-1 text-negative">
              {{ errorMessage }}
            </q-banner>
          </q-card-section>
        </q-form>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import type { QForm } from "quasar";
import http from "../api/http";

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const formRef = ref<QForm | null>(null);
const title = ref("");
const content = ref("");
const tags = ref("");
const errorMessage = ref("");
const lastUpdated = ref<string | null>(null);

const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);

const titleRules = [
  (val: string) => !!val || "请输入标题"
];

const noteId = computed(() => {
  const value = route.params.id;
  return typeof value === "string" && value.length ? value : null;
});

const tagList = computed(() =>
  tags.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
);

const headerTitle = computed(() => (noteId.value ? "Edit note" : "Create note"));

const subtitle = computed(() => {
  if (noteId.value && lastUpdated.value) {
    return `Last updated ${formatDate(lastUpdated.value)}`;
  }
  return "Fill in the fields to capture your ideas.";
});

watch(
  noteId,
  async (id) => {
    if (!id) {
      resetForm();
      return;
    }
    await loadNote(id);
  },
  { immediate: true }
);

function resetForm() {
  title.value = "";
  content.value = "";
  tags.value = "";
  errorMessage.value = "";
  lastUpdated.value = null;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function parseError(error: any) {
  const fallback = "Something went wrong. Please try again.";
  const message = error?.response?.data?.message || error?.message || fallback;
  return typeof message === "string" ? message : fallback;
}

async function loadNote(id: string) {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const { data } = await http.get(`/notes/${id}`);
    title.value = data.title || "";
    content.value = data.content || "";
    tags.value = (data.tags || [])
      .map((item: any) => item?.tag?.name)
      .filter(Boolean)
      .join(", ");
    lastUpdated.value = data.updatedAt || null;
  } catch (error) {
    errorMessage.value = parseError(error);
    $q.notify({ type: "negative", message: errorMessage.value });
  } finally {
    isLoading.value = false;
  }
}

async function save() {
  if (isSaving.value || isLoading.value) return;
  errorMessage.value = "";

  if ((await formRef.value?.validate?.()) !== true) {
    return;
  }

  isSaving.value = true;
  const payload = {
    title: title.value,
    content: content.value,
    tags: tagList.value
  };

  try {
    if (noteId.value) {
      await http.patch(`/notes/${noteId.value}`, payload);
      $q.notify({ type: "positive", message: "Note updated." });
    } else {
      await http.post("/notes", payload);
      $q.notify({ type: "positive", message: "Note created." });
    }
    router.push({ name: "notes" });
  } catch (error) {
    errorMessage.value = parseError(error);
    $q.notify({ type: "negative", message: errorMessage.value });
  } finally {
    isSaving.value = false;
  }
}

function goBack() {
  router.push({ name: "notes" });
}

function confirmDelete() {
  if (!noteId.value || isDeleting.value) return;
  $q.dialog({
    title: "Delete note",
    message: "This action cannot be undone.",
    cancel: { label: "Cancel", flat: true, color: "primary" },
    ok: { label: "Delete", color: "negative" },
    persistent: true
  }).onOk(deleteNote);
}

async function deleteNote() {
  if (!noteId.value) return;
  isDeleting.value = true;
  try {
    await http.delete(`/notes/${noteId.value}`);
    $q.notify({ type: "positive", message: "Note deleted." });
    router.push({ name: "notes" });
  } catch (error) {
    errorMessage.value = parseError(error);
    $q.notify({ type: "negative", message: errorMessage.value });
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped>
.editor-page {
  min-height: 100vh;
}

.editor-container {
  max-width: 960px;
  margin: 0 auto;
}
</style>
