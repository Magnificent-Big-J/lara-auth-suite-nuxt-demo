<!-- app/pages/tickets/new.vue -->
<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h5 font-weight-medium">
          New Ticket
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Create a support ticket. Customers see their own tickets; agents and managers
          can triage and resolve.
        </p>
      </div>

      <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="backToList"
      >
        Back to {{ ticketsNavLabel }}
      </v-btn>
    </div>

    <!-- Permission guard -->
    <v-alert
        v-if="!canCreate"
        type="error"
        variant="tonal"
        class="mb-4"
    >
      You are not allowed to create tickets.
    </v-alert>

    <template v-else>
      <UiErrorAlert :message="formError" />

      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-text>
              <v-form @submit.prevent="submit">
                <!-- Subject -->
                <v-text-field
                    v-model="form.subject"
                    label="Subject"
                    prepend-inner-icon="mdi-text-short"
                    variant="outlined"
                    density="comfortable"
                    :error-messages="fieldError('subject')"
                    class="mb-4"
                    required
                />

                <!-- Description -->
                <v-textarea
                    v-model="form.description"
                    label="Description"
                    prepend-inner-icon="mdi-text-long"
                    variant="outlined"
                    density="comfortable"
                    rows="4"
                    auto-grow
                    :error-messages="fieldError('description')"
                    class="mb-4"
                    required
                />

                <v-row>
                  <!-- Category -->
                  <v-col cols="12" md="6">
                    <v-select
                        v-model="form.category_id"
                        :items="categoryOptions"
                        item-title="label"
                        item-value="value"
                        label="Category"
                        prepend-inner-icon="mdi-tag"
                        variant="outlined"
                        density="comfortable"
                        clearable
                        :loading="pendingCategories"
                        :error-messages="fieldError('category_id')"
                    />
                  </v-col>

                  <!-- Priority -->
                  <v-col cols="12" md="6">
                    <v-select
                        v-model="form.priority"
                        :items="priorityOptions"
                        item-title="label"
                        item-value="value"
                        label="Priority"
                        prepend-inner-icon="mdi-flag"
                        variant="outlined"
                        density="comfortable"
                        :loading="pendingPriorities"
                        :error-messages="fieldError('priority')"
                        required
                    />
                  </v-col>
                </v-row>

                <div class="d-flex justify-end mt-6">
                  <v-btn
                      type="submit"
                      color="primary"
                      :loading="submitting"
                      :disabled="submitting"
                      prepend-icon="mdi-check"
                  >
                    Create Ticket
                  </v-btn>
                </div>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Optional: quick info panel -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="text-subtitle-1">
              Ticket Tips
            </v-card-title>
            <v-divider />
            <v-card-text class="text-body-2 text-medium-emphasis">
              <ul class="pl-4">
                <li class="mb-2">
                  Be specific in the subject so agents can triage quickly.
                </li>
                <li class="mb-2">
                  Include steps to reproduce, expected vs actual behaviour and any
                  relevant screenshots or references.
                </li>
                <li>
                  Choose a priority that matches the impact (e.g. “High” only when
                  work is blocked).
                </li>
              </ul>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'

definePageMeta({
  layout: 'default',
  middleware: ['sanctum:auth'],
})

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

const canCreate = computed(() => can('tickets.create'))

// For back button label
const ticketsNavLabel = computed(() => {
  if (hasRole('admin') || hasRole('manager')) return 'Tickets'
  return 'My Tickets'
})

/* ──────────────────────────────
   Meta data: priorities & categories
────────────────────────────── */

// Priorities: GET /api/v1/ticket-priorities -> { data: [{value, label}, ...] }
const {
  data: prioritiesRes,
  pending: pendingPriorities,
} = await useSanctumFetch('/api/v1/ticket-priorities')

// Categories: GET /api/v1/ticket-categories -> TicketCategoryResource collection
const {
  data: categoriesRes,
  pending: pendingCategories,
} = await useSanctumFetch('/api/v1/ticket-categories')

// Normalise priorities
const priorityOptions = computed(() => {
  const raw = prioritiesRes.value as any
  if (!raw) return []

  if (Array.isArray(raw.data)) {
    return raw.data
  }

  if (Array.isArray(raw)) {
    return raw
  }

  return []
})

// Normalise categories into [{ value, label }]
const categoryOptions = computed(() => {
  const raw = categoriesRes.value as any
  if (!raw) return []

  // Most likely: { status: 'ok', data: { data: [ ... ] } }
  const items =
      Array.isArray(raw?.data?.data) ? raw.data.data
          : Array.isArray(raw?.data) ? raw.data
              : Array.isArray(raw) ? raw
                  : []

  return items.map((cat: any) => ({
    value: cat.id,
    label: cat.name,
    slug: cat.slug,
  }))
})

/* ──────────────────────────────
   Form state
────────────────────────────── */

const form = ref({
  subject: '',
  description: '',
  // Backend default is Medium; set a default once priorities are loaded
  priority: 'medium',
  category_id: null as number | null,
})

const submitting = ref(false)
const formError = ref<string | null>(null)
const validationErrors = ref<Record<string, string[]>>({})

const fieldError = (field: string) => validationErrors.value[field] ?? []

/* ──────────────────────────────
   Submit logic (POST /api/v1/tickets)
────────────────────────────── */
const submit = async () => {
  if (!canCreate.value) return

  submitting.value = true
  formError.value = null
  validationErrors.value = {}

  const payload = {
    subject: form.value.subject,
    description: form.value.description,
    priority: form.value.priority,
    category_id: form.value.category_id,
    // status, assignee_id are optional; backend defaults handle it
  }

  try {
    const { data, error } = await useSanctumFetch(
        '/api/v1/tickets',
        () => ({
          method: 'POST',
          body: payload,
        }),
    )

    if (error.value) {
      const err: any = error.value

      // Laravel validation error: 422
      if (err?.status === 422) {
        const errors = err.data?.errors ?? {}
        validationErrors.value = errors

        // Optional: show first message as global
        const firstField = Object.keys(errors)[0]
        const firstMsg = firstField ? errors[firstField][0] : null
        formError.value = firstMsg || 'Please fix the errors below.'
      } else {
        formError.value = err?.data?.message || 'Failed to create ticket. Please try again.'
      }

      return
    }

    // Success – unwrap TicketResource: { data: { id, ... } } or plain { id, ... }
    const raw = data.value as any
    const ticket = raw?.data ?? raw

    if (ticket?.id) {
      await navigateTo(`/tickets/${ticket.id}`)
    } else {
      formError.value = 'Ticket created, but cannot determine ID to redirect.'
    }
  } catch (e: any) {
    console.error('Create ticket failed', e)
    formError.value = 'Unexpected error while creating ticket.'
  } finally {
    submitting.value = false
  }
}

/* ──────────────────────────────
   Helpers
────────────────────────────── */
const backToList = () => {
  navigateTo('/tickets')
}
</script>
