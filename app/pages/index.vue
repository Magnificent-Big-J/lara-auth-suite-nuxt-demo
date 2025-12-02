<!-- app/pages/index.vue -->
<template>
  <div>
    <h1 class="text-h5 font-weight-medium mb-4">
      Dashboard
    </h1>

    <UiErrorAlert :message="combinedError" />

    <!-- Skeleton while loading main stats -->
    <v-row v-if="!stats && pendingStats">
      <v-col cols="12" md="4">
        <v-skeleton-loader type="card" />
      </v-col>
      <v-col cols="12" md="4">
        <v-skeleton-loader type="card" />
      </v-col>
      <v-col cols="12" md="4">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <!-- Summary cards -->
    <v-row v-else>
      <v-col cols="12" md="3">
        <v-card class="mb-4">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">
              Total Tickets
            </div>
            <div class="text-h4 font-weight-bold">
              {{ stats?.total_tickets ?? 0 }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="mb-4">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">
              Open
            </div>
            <div class="text-h4 font-weight-bold">
              {{ statusCounts.open }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="mb-4">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">
              In Progress
            </div>
            <div class="text-h4 font-weight-bold">
              {{ statusCounts.in_progress }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="mb-4">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">
              Closed
            </div>
            <div class="text-h4 font-weight-bold">
              {{ statusCounts.closed }}
            </div>

            <div class="text-caption text-medium-emphasis mt-2">
              On hold:
              <span class="font-weight-bold">
                {{ statusCounts.on_hold }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts row: Status + Priority -->
    <v-row v-if="stats">
      <!-- Status bar chart -->
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-text>
            <BaseChart
                type="bar"
                :labels="statusChartLabels"
                :values="statusChartValues"
                title="Tickets by Status"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Priority doughnut chart -->
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-text>
            <BaseChart
                type="doughnut"
                :labels="priorityChartLabels"
                :values="priorityChartValues"
                title="Tickets by Priority"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Daily trend chart -->
    <v-row v-if="dailyLabels.length">
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-text>
            <BaseChart
                type="bar"
                :labels="dailyLabels"
                :values="dailyTotals"
                title="Tickets created per day (last 7 days)"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Category breakdown list -->
    <v-row v-if="stats">
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1">
            Category Breakdown
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-list density="compact" lines="one">
              <v-list-item
                  v-for="cat in stats.category_breakdown"
                  :key="cat.category_id"
              >
                <v-list-item-title>
                  {{ cat.category_name }}
                </v-list-item-title>

                <template #append>
                  <span class="font-weight-medium">
                    {{ cat.tickets_count }}
                  </span>
                </template>
              </v-list-item>

              <v-list-item
                  v-if="!stats.category_breakdown || !stats.category_breakdown.length"
              >
                <span class="text-medium-emphasis text-body-2">
                  No categories found.
                </span>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'
import BaseChart from '@/components/charts/BaseChart.vue'

definePageMeta({
  layout: 'default',
  middleware: ['sanctum:auth'],
})

/**
 * OVERVIEW: /api/v1/dashboard/stats
 *  -> { status: 'ok', data: { total_tickets, status_counts, priority_breakdown, category_breakdown } }
 */
const {
  data: response,
  pending: pendingStats,
  error: statsErrorRaw,
} = await useSanctumFetch('/api/v1/dashboard/stats')

const stats = computed(() => response.value?.data ?? null)

// Safe status counts
const statusCounts = computed(() => ({
  open: stats.value?.status_counts?.open ?? 0,
  in_progress: stats.value?.status_counts?.in_progress ?? 0,
  on_hold: stats.value?.status_counts?.on_hold ?? 0,
  closed: stats.value?.status_counts?.closed ?? 0,
}))

/**
 * DAILY TRENDS: /api/v1/dashboard/stats/daily-tickets?days=7
 *  -> { status: 'ok', data: [{ date: 'YYYY-MM-DD', total: number }, ...] }
 */
const {
  data: dailyResponse,
  error: dailyErrorRaw,
} = await useSanctumFetch('/api/v1/dashboard/stats/daily-tickets', {
  method: 'GET',
  query: { days: 7 },
})

const dailyData = computed(() => (dailyResponse.value?.data as any[]) ?? [])

// Wrap the main + daily errors into one message (for now)
const combinedError = computed(() => {
  if (statsErrorRaw.value || dailyErrorRaw.value) {
    return 'Failed to load some dashboard stats. Data may be incomplete.'
  }
  return null
})

/* ──────────────────────────────
   Chart data – status + priority
────────────────────────────── */
const statusChartLabels = computed(() => ['Open', 'In progress', 'On hold', 'Closed'])

const statusChartValues = computed(() => [
  statusCounts.value.open,
  statusCounts.value.in_progress,
  statusCounts.value.on_hold,
  statusCounts.value.closed,
])

const priorityChartLabels = computed(() =>
    (stats.value?.priority_breakdown ?? []).map((p: any) => priorityLabel(p.priority)),
)

const priorityChartValues = computed(() =>
    (stats.value?.priority_breakdown ?? []).map((p: any) => p.count),
)

/* ──────────────────────────────
   Chart data – daily trends
────────────────────────────── */
const dailyLabels = computed(() =>
    dailyData.value.map((row: any) => row.date),
)

const dailyTotals = computed(() =>
    dailyData.value.map((row: any) => row.total),
)

/* Helpers for priority labels */
const priorityLabel = (value: string) => {
  switch (value) {
    case 'low':
      return 'Low'
    case 'medium':
      return 'Medium'
    case 'high':
      return 'High'
    case 'urgent':
      return 'Urgent'
    default:
      return value
  }
}
</script>
