<template>
  <v-alert
      v-if="message"
      type="error"
      variant="tonal"
      density="compact"
      closable
      class="mb-3"
  >
    {{ message }}
  </v-alert>
</template>

<script setup lang="ts">
defineProps<{
  message: string | null
}>()
</script>
