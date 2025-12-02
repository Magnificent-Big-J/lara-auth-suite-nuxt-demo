<!-- app/pages/tickets/[id].vue -->
<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-caption text-medium-emphasis">
          Ticket #{{ ticket?.id ?? '—' }}
        </div>
        <h1 class="text-h5 font-weight-medium">
          {{ ticket?.subject ?? 'Loading ticket...' }}
        </h1>
      </div>

      <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="backToList"
      >
        Back to {{ ticketsNavLabel }}
      </v-btn>
    </div>

    <UiErrorAlert :message="ticketErrorMessage" />

    <!-- Loading skeleton -->
    <v-row v-if="pendingTicket">
      <v-col cols="12">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <!-- Ticket content -->
    <v-row v-else-if="ticket">
      <!-- LEFT: ticket info + status + assignment -->
      <v-col cols="12" md="7">
        <!-- Ticket details -->
        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1">
            Ticket Details
          </v-card-title>
          <v-divider />
          <v-card-text>
            <p class="mb-4">
              {{ ticket.description }}
            </p>

            <v-row>
              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">
                  Status
                </div>
                <v-chip
                    size="small"
                    :color="statusColor(ticket.status)"
                    variant="flat"
                >
                  {{ statusLabel(ticket.status) }}
                </v-chip>
              </v-col>

              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">
                  Priority
                </div>
                <v-chip
                    size="small"
                    :color="priorityColor(ticket.priority)"
                    variant="outlined"
                >
                  {{ priorityLabel(ticket.priority) }}
                </v-chip>
              </v-col>
            </v-row>

            <v-row class="mt-2">
              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">
                  Category
                </div>
                <div class="text-body-2">
                  {{ ticket.category?.name ?? 'Uncategorized' }}
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">
                  Created
                </div>
                <div class="text-body-2">
                  {{ formatDate(ticket.created_at) }}
                </div>
              </v-col>
            </v-row>

            <v-row class="mt-2">
              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">
                  Requester
                </div>
                <div class="text-body-2">
                  {{ ticket.requester?.name }} ·
                  <span class="text-medium-emphasis">
                    {{ ticket.requester?.email }}
                  </span>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">
                  Assignee
                </div>
                <div class="text-body-2">
                  {{ ticket.assignee?.name ?? 'Unassigned' }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Status management -->
        <v-card
            v-if="canChangeStatus"
            class="mb-4"
        >
          <v-card-title class="text-subtitle-1">
            Update Status
          </v-card-title>
          <v-divider />
          <v-card-text>
            <UiErrorAlert :message="statusErrorMessage" />

            <v-row class="align-center">
              <v-col cols="12" md="6">
                <v-select
                    v-model="selectedStatus"
                    :items="statusOptions"
                    item-title="label"
                    item-value="value"
                    label="Status"
                    density="comfortable"
                    variant="outlined"
                    hide-details
                />
              </v-col>

              <v-col cols="12" md="6" class="d-flex justify-end">
                <v-btn
                    color="primary"
                    :loading="updatingStatus"
                    :disabled="!selectedStatus || selectedStatus === ticket.status"
                    @click="submitStatusChange"
                >
                  Update Status
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Assignment (ADMIN / MANAGER with tickets.assign permission) -->
        <v-card
            v-if="canAssign"
            class="mb-4"
        >
          <v-card-title class="text-subtitle-1">
            Assignment
          </v-card-title>
          <v-divider />
          <v-card-text>
            <UiErrorAlert :message="assignErrorMessage" />

            <v-row class="align-center">
              <v-col cols="12" md="8">
                <v-select
                    v-model="selectedAssigneeId"
                    :items="agentOptions"
                    item-title="label"
                    item-value="value"
                    label="Assign to"
                    prepend-inner-icon="mdi-account"
                    density="comfortable"
                    variant="outlined"
                    :loading="pendingAgents"
                    :disabled="pendingAgents"
                    clearable
                />
              </v-col>

              <v-col cols="12" md="4" class="d-flex justify-end">
                <v-btn
                    color="primary"
                    :loading="assigning"
                    :disabled="!selectedAssigneeId || assigning"
                    @click="submitAssign"
                >
                  Update Assignee
                </v-btn>
              </v-col>
            </v-row>

            <v-alert
                v-if="agentsErrorMessage"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-2"
            >
              {{ agentsErrorMessage }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- RIGHT: comments -->
      <v-col cols="12" md="5">
        <v-card class="mb-4">
          <v-card-title class="text-subtitle-1">
            Comments
          </v-card-title>
          <v-divider />
          <v-card-text>
            <UiErrorAlert :message="commentsErrorMessage" />

            <v-skeleton-loader
                v-if="pendingComments && !comments.length"
                type="list-item-three-line"
            />

            <v-list
                v-else
                density="compact"
                lines="two"
                class="mb-4"
            >
              <v-list-item
                  v-for="comment in comments"
                  :key="comment.id"
              >
                <v-list-item-title>
                  <span class="font-weight-medium">
                    {{ comment.author?.name ?? 'Unknown' }}
                  </span>
                  <span class="text-caption text-medium-emphasis">
                    · {{ formatDate(comment.created_at) }}
                  </span>
                  <v-chip
                      v-if="comment.is_internal"
                      size="x-small"
                      class="ml-1"
                      color="deep-purple"
                      label
                  >
                    Internal
                  </v-chip>
                </v-list-item-title>

                <v-list-item-subtitle class="mt-1">
                  {{ comment.body }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item
                  v-if="!comments.length"
              >
                <span class="text-medium-emphasis text-body-2">
                  No comments yet.
                </span>
              </v-list-item>
            </v-list>

            <!-- Add comment -->
            <div>
              <v-textarea
                  v-model="newComment"
                  label="Add a comment"
                  density="comfortable"
                  variant="outlined"
                  rows="3"
                  auto-grow
                  hide-details
              />

              <v-switch
                  v-if="canCommentInternal"
                  v-model="isInternal"
                  class="mt-2"
                  label="Internal note (only agents/managers can see)"
                  density="compact"
                  hide-details
              />

              <div class="d-flex justify-end mt-3">
                <v-btn
                    color="primary"
                    :loading="addingComment"
                    :disabled="!newComment.trim()"
                    @click="submitComment"
                >
                  Add Comment
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Not found / not allowed -->
    <v-row v-else>
      <v-col cols="12">
        <v-alert
            type="error"
            variant="tonal"
        >
          Ticket not found or you are not allowed to view it.
        </v-alert>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'

definePageMeta({
  layout: 'default',
  middleware: ['sanctum:auth'],
})

const route = useRoute()
const ticketId = Number(route.params.id)

/* ──────────────────────────────
   Current user + permissions
────────────────────────────── */
const { data: me } = await useSanctumFetch('/auth/session/me')
const user = computed(() => me.value ?? null)

const can = (permission: string) => {
  const perms = (user.value as any)?.permissions as string[] | undefined
  if (!perms) return false
  return perms.includes(permission)
}

const hasRole = (role: string) => {
  const roles = (user.value as any)?.roles as string[] | undefined
  if (!roles) return false
  return roles.includes(role)
}

// For back button label
const ticketsNavLabel = computed(() => {
  if (hasRole('admin') || hasRole('manager')) return 'Tickets'
  return 'My Tickets'
})

/* ──────────────────────────────
   Ticket details
────────────────────────────── */
const {
  data: ticketRes,
  pending: pendingTicket,
  error: ticketErrorRaw,
  refresh: refreshTicket,
} = await useSanctumFetch(`/api/v1/tickets/${ticketId}`)

const ticket = computed<any | null>(() => {
  const raw = ticketRes.value as any
  if (!raw) return null
  // Handle either { data: {...} } or plain {...}
  if (raw.data) return raw.data
  return raw
})

const ticketErrorMessage = computed(() =>
    ticketErrorRaw.value ? 'Failed to load ticket details.' : null,
)

/* ──────────────────────────────
   Comments
────────────────────────────── */
const {
  data: commentsRes,
  pending: pendingComments,
  error: commentsErrorRaw,
  refresh: refreshComments,
} = await useSanctumFetch(`/api/v1/tickets/${ticketId}/comments`)

const comments = computed<any[]>(() => {
  const raw = commentsRes.value as any
  if (!raw) return []
  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw)) return raw
  return []
})

const commentsErrorMessage = computed(() =>
    commentsErrorRaw.value ? 'Failed to load comments.' : null,
)

const newComment = ref('')
const isInternal = ref(false)
const addingComment = ref(false)

const canCommentInternal = computed(() => can('tickets.comment.internal'))

const submitComment = async () => {
  if (!newComment.value.trim()) return

  addingComment.value = true
  try {
    await useSanctumFetch(
        `/api/v1/tickets/${ticketId}/comments`,
        () => ({
          method: 'POST',
          body: {
            body: newComment.value,
            is_internal: isInternal.value,
          },
        }),
    )

    newComment.value = ''
    isInternal.value = false
    await refreshComments()
  } catch (e) {
    console.error('Failed to add comment', e)
  } finally {
    addingComment.value = false
  }
}

/* ──────────────────────────────
   Status change
────────────────────────────── */

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'On hold', value: 'on_hold' },
  { label: 'Closed', value: 'closed' },
]

const canChangeStatus = computed(() => can('tickets.change_status'))

const selectedStatus = ref<string | null>(null)
const updatingStatus = ref(false)
const statusErrorMessage = ref<string | null>(null)

watch(
    () => ticket.value?.status,
    (val) => {
      if (!selectedStatus.value) {
        selectedStatus.value = val ?? null
      }
    },
    { immediate: true },
)

const submitStatusChange = async () => {
  if (!selectedStatus.value || !ticket.value) return

  updatingStatus.value = true
  statusErrorMessage.value = null

  try {
    await useSanctumFetch(
        `/api/v1/tickets/${ticketId}/status`,
        () => ({
          method: 'PATCH',
          body: {
            status: selectedStatus.value,
          },
        }),
    )

    await refreshTicket()
  } catch (e) {
    console.error('Failed to update status', e)
    statusErrorMessage.value = 'Failed to update status. Please try again.'
  } finally {
    updatingStatus.value = false
  }
}

/* ──────────────────────────────
   Assignment (admin/manager)
────────────────────────────── */

const canAssign = computed(() => can('tickets.assign'))

// Fetch agents (or all users and filter)
const {
  data: agentsRes,
  pending: pendingAgents,
  error: agentsErrorRaw,
} = await useSanctumFetch('/api/v1/users', () => ({
  method: 'GET',
  query: {
    role: 'agent', // if backend ignores, we'll filter on frontend
    per_page: 100,
  },
}))

const agentOptions = computed(() => {
  const raw = agentsRes.value as any
  if (!raw) return []

  // Handle resource pagination shapes
  let items: any[] = []
  if (Array.isArray(raw?.data?.data)) items = raw.data.data
  else if (Array.isArray(raw?.data)) items = raw.data
  else if (Array.isArray(raw)) items = raw
  else items = []

  // Keep only agents (in case backend returned more)
  return items
      .filter((u: any) => (u.roles ?? []).includes('agent'))
      .map((u: any) => ({
        value: u.id,
        label: u.name,
      }))
})

const agentsErrorMessage = computed(() =>
    agentsErrorRaw.value ? 'Failed to load agents list.' : null,
)

const selectedAssigneeId = ref<number | null>(null)
const assigning = ref(false)
const assignErrorMessage = ref<string | null>(null)

// Pre-fill selectedAssigneeId from ticket.assignee
watch(
    () => ticket.value?.assignee?.id,
    (val) => {
      if (val && !selectedAssigneeId.value) {
        selectedAssigneeId.value = val
      }
    },
    { immediate: true },
)

const submitAssign = async () => {
  if (!selectedAssigneeId.value || !ticket.value) return

  assigning.value = true
  assignErrorMessage.value = null

  try {
    await useSanctumFetch(
        `/api/v1/tickets/${ticketId}/assign`,
        () => ({
          method: 'PATCH',
          body: {
            assignee_id: selectedAssigneeId.value,
          },
        }),
    )

    await refreshTicket()
  } catch (e: any) {
    console.error('Failed to assign ticket', e)
    assignErrorMessage.value =
        (e?.data as any)?.message || 'Failed to assign ticket. Please try again.'
  } finally {
    assigning.value = false
  }
}

/* ──────────────────────────────
   Helpers
────────────────────────────── */
const backToList = () => {
  navigateTo('/tickets')
}

const statusLabel = (value: string) => {
  switch (value) {
    case 'open':
      return 'Open'
    case 'in_progress':
      return 'In progress'
    case 'on_hold':
      return 'On hold'
    case 'closed':
      return 'Closed'
    default:
      return value
  }
}

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

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
</script>
