<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-2">
    <q-header v-if="showHeader" elevated class="bg-primary text-white">
      <q-toolbar class="q-px-md">
        <q-toolbar-title>SmartNotes</q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const showHeader = computed(() => route.meta?.hideHeader !== true);
</script>
