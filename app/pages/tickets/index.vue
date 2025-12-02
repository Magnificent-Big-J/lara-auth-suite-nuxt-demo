<!-- app/pages/tickets/index.vue -->
<template>
  <div>
    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-h5 font-weight-medium">Tickets</div>

      <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="createTicket"
      >
        New Ticket
      </v-btn>
    </div>

    <!-- CONTENT -->
    <v-card>
      <v-card-text>
        <!-- FILTERS -->
        <div class="d-flex flex-wrap gap-4 mb-4">
          <v-text-field
              v-model="search"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              density="comfortable"
              variant="outlined"
              hide-details
              class="flex-grow-1"
          />

          <v-select
              v-model="status"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              label="Status"
              density="comfortable"
              variant="outlined"
              hide-details
              clearable
              class="flex-grow-0"
          />

          <v-select
              v-model="priority"
              :items="priorityOptions"
              item-title="label"
              item-value="value"
              label="Priority"
              density="comfortable"
              variant="outlined"
              hide-details
              clearable
              class="flex-grow-0"
          />
        </div>

        <UiErrorAlert :message="listError" />

        <!-- SKELETON WHILE LOADING -->
        <v-skeleton-loader
            v-if="pendingTickets"
            type="table-row@5"
        />

        <!-- TABLE -->
        <v-data-table
            v-else
            :items="tickets?.data || []"
            :headers="headers"
            :items-per-page="tickets?.meta?.per_page || 10"
            :page="page"
            hide-default-footer
            @update:page="onPageChange"
        >
          <!-- STATUS CHIP -->
          <template #item.status="{ item }">
            <v-chip
                size="small"
                :color="statusColor(getStatus(item))"
                variant="flat"
            >
              {{ statusLabel(getStatus(item)) }}
            </v-chip>
          </template>

          <!-- PRIORITY CHIP -->
          <template #item.priority="{ item }">
            <v-chip
                size="small"
                :color="priorityColor(getPriority(item))"
                variant="outlined"
            >
              {{ priorityLabel(getPriority(item)) }}
            </v-chip>
          </template>

          <!-- ACTIONS -->
          <template #item.actions="{ item }">
            <v-btn
                icon="mdi-eye"
                variant="text"
                size="small"
                @click="goToTicket(getId(item))"
            />
          </template>
        </v-data-table>

        <!-- PAGINATION -->
        <div
            v-if="tickets?.meta"
            class="d-flex justify-end mt-4"
        >
          <v-pagination
              v-model="page"
              :length="tickets.meta.last_page"
              total-visible="7"
          />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'
import { useTicketFiltersStore } from '@/stores/ticketFilters'

definePageMeta({
  layout: 'default',
  middleware: ['sanctum:auth'],
})

/* ──────────────────────────────
   Filters (Pinia store)
────────────────────────────── */
const filtersStore = useTicketFiltersStore()
const { status, priority, search, page } = storeToRefs(filtersStore)

/* ──────────────────────────────
   Table headers
────────────────────────────── */
const headers = [
  { title: 'ID', value: 'id' },
  { title: 'Subject', value: 'subject' },
  { title: 'Status', value: 'status' },
  { title: 'Priority', value: 'priority' },
  { title: 'Created', value: 'created_at' },
  { title: 'Actions', value: 'actions', sortable: false },
]

/* ──────────────────────────────
   Meta: statuses & priorities
   GET /api/v1/ticket-statuses
   GET /api/v1/ticket-priorities
   Shape: { data: [{ value, label }, ...] }
────────────────────────────── */
const { data: statusRes } = await useSanctumFetch('/api/v1/ticket-statuses')
const { data: priorityRes } = await useSanctumFetch('/api/v1/ticket-priorities')

const statusOptions = computed(() => [
  { label: 'All statuses', value: null },
  ...((statusRes.value?.data as any[]) ?? []),
])

const priorityOptions = computed(() => [
  { label: 'All priorities', value: null },
  ...((priorityRes.value?.data as any[]) ?? []),
])

/* ──────────────────────────────
   Tickets list
   GET /api/v1/tickets
   (Laravel paginator JSON)
────────────────────────────── */
const {
  data: tickets,
  pending: pendingTickets,
  error: ticketsError,
} = await useSanctumFetch(
    '/api/v1/tickets',
    () => ({
      method: 'GET',
      query: {
        page: page.value,
        status: status.value,
        priority: priority.value,
        search: search.value,
      },
    }),
    {
      watch: [page, status, priority, search],
    },
)

const listError = computed(() =>
    ticketsError.value ? 'Failed to load tickets. Please try again.' : null,
)

/* ──────────────────────────────
   Actions
────────────────────────────── */
const createTicket = () => {
  navigateTo('/tickets/new')
}

const goToTicket = (id: number) => {
  if (!id) return
  navigateTo(`/tickets/${id}`)
}

const onPageChange = (newPage: number) => {
  page.value = newPage
}

/* ──────────────────────────────
   Safe access helpers
   (handle Vuetify internal item shape)
────────────────────────────── */
const getField = (item: any, key: string): any => {
  return (
      item?.raw?.[key] ??
      item?.columns?.[key] ??
      item?.[key] ??
      null
  )
}

const getStatus = (item: any): string => {
  return (getField(item, 'status') as string) || ''
}

const getPriority = (item: any): string => {
  return (getField(item, 'priority') as string) || ''
}

const getId = (item: any): number => {
  const value = getField(item, 'id')
  return Number(value ?? 0)
}

/* ──────────────────────────────
   Label + color helpers
────────────────────────────── */
const statusLabel = (value: string) => {
  if (!value) return '—'
  const match = (statusOptions.value as any[]).find(o => o.value === value)
  return match?.label ?? value
}

const priorityLabel = (value: string) => {
  if (!value) return '—'
  const match = (priorityOptions.value as any[]).find(o => o.value === value)
  return match?.label ?? value
}

const statusColor = (value: string) => {
  switch (value) {
    case 'open':
      return 'blue'
    case 'in_progress':
      return 'orange'
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
