<!-- app/pages/ticket-settings/index.vue -->
<template>
  <div>
    <h1 class="text-h5 font-weight-medium mb-4">
      Ticket Settings
    </h1>

    <UiErrorAlert :message="globalError" />

    <v-row>
      <!-- STATUSES -->
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1">
            Statuses
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-skeleton-loader
                v-if="pendingStatuses"
                type="table"
            />
            <v-table
                v-else
                density="compact"
            >
              <thead>
              <tr>
                <th class="text-left">Label</th>
                <th class="text-left">Value</th>
              </tr>
              </thead>
              <tbody>
              <tr
                  v-for="status in statuses"
                  :key="status.value"
              >
                <td>
                  <v-chip
                      size="small"
                      :color="statusColor(status.value)"
                      variant="flat"
                  >
                    {{ status.label }}
                  </v-chip>
                </td>
                <td class="text-medium-emphasis">
                  {{ status.value }}
                </td>
              </tr>

              <tr v-if="!statuses.length">
                <td
                    colspan="2"
                    class="text-center text-medium-emphasis text-body-2 py-4"
                >
                  No statuses configured.
                </td>
              </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- PRIORITIES -->
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1">
            Priorities
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-skeleton-loader
                v-if="pendingPriorities"
                type="table"
            />
            <v-table
                v-else
                density="compact"
            >
              <thead>
              <tr>
                <th class="text-left">Label</th>
                <th class="text-left">Value</th>
              </tr>
              </thead>
              <tbody>
              <tr
                  v-for="priority in priorities"
                  :key="priority.value"
              >
                <td>
                  <v-chip
                      size="small"
                      :color="priorityColor(priority.value)"
                      variant="outlined"
                  >
                    {{ priority.label }}
                  </v-chip>
                </td>
                <td class="text-medium-emphasis">
                  {{ priority.value }}
                </td>
              </tr>

              <tr v-if="!priorities.length">
                <td
                    colspan="2"
                    class="text-center text-medium-emphasis text-body-2 py-4"
                >
                  No priorities configured.
                </td>
              </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- CATEGORIES -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1">
            Categories
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-skeleton-loader
                v-if="pendingCategories"
                type="table"
            />
            <v-table
                v-else
                density="compact"
            >
              <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Slug</th>
                <th class="text-left">Description</th>
              </tr>
              </thead>
              <tbody>
              <tr
                  v-for="cat in categories"
                  :key="cat.id"
              >
                <td class="font-weight-medium">
                  {{ cat.name }}
                </td>
                <td class="text-medium-emphasis">
                  {{ cat.slug }}
                </td>
                <td class="text-medium-emphasis">
                  {{ cat.description || '—' }}
                </td>
              </tr>

              <tr v-if="!categories.length">
                <td
                    colspan="3"
                    class="text-center text-medium-emphasis text-body-2 py-4"
                >
                  No categories configured.
                </td>
              </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'

definePageMeta({
  layout: 'default',
  middleware: ['sanctum:auth'],
})

/**
 * Fetch meta: statuses, priorities, categories
 * Endpoints:
 *  - GET /api/v1/ticket-statuses  -> { data: [{ value, label }, ...] }
 *  - GET /api/v1/ticket-priorities -> same shape
 *  - GET /api/v1/ticket-categories -> TicketCategoryResource collection
 */

const {
  data: statusesRes,
  pending: pendingStatuses,
  error: statusesError,
} = await useSanctumFetch('/api/v1/ticket-statuses')

const {
  data: prioritiesRes,
  pending: pendingPriorities,
  error: prioritiesError,
} = await useSanctumFetch('/api/v1/ticket-priorities')

const {
  data: categoriesRes,
  pending: pendingCategories,
  error: categoriesError,
} = await useSanctumFetch('/api/v1/ticket-categories')

// Normalised collections
const statuses = computed(() => (statusesRes.value?.data as any[]) ?? [])
const priorities = computed(() => (prioritiesRes.value?.data as any[]) ?? [])
const categories = computed(() => (categoriesRes.value as any[]) ?? [])

// Global error (simple combined message; you can make this smarter later)
const globalError = computed(() => {
  if (statusesError.value || prioritiesError.value || categoriesError.value) {
    return 'Failed to load ticket settings. Please try again.'
  }
  return null
})

/**
 * Helpers for colors
 */
const statusColor = (value: string) => {
  switch (value) {
    case 'open':
      return 'blue'
    case 'in_progress':
      return 'orange'
    case 'on_hold':
      return 'purple'
    case 'closed':
      return 'green'
    default:
      return 'grey'
  }
}

const priorityColor = (value: string) => {
  switch (value) {
    case 'low':
      return 'grey'
    case 'medium':
      return 'blue'
    case 'high':
      return 'orange'
    case 'urgent':
      return 'red'
    default:
      return 'grey'
  }
}
</script>
