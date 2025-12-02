<!-- app/pages/roles/index.vue -->
<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h5 font-weight-medium mb-1">
          Roles & Permissions
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          View roles and their assigned permissions.
        </p>
      </div>

      <!-- Future: enable when we implement role editing -->
      <v-btn
          v-if="canManage"
          color="primary"
          prepend-icon="mdi-shield-plus"
          disabled
      >
        Manage Roles (coming soon)
      </v-btn>
    </div>

    <UiErrorAlert :message="listErrorMessage" />

    <v-card>
      <v-card-text>
        <v-skeleton-loader
            v-if="pendingRoles && !roles.length"
            type="table"
        />

        <v-data-table
            v-else
            :items="roles"
            :headers="headers"
            item-key="id"
            hide-default-footer
        >
          <!-- Role name + guard -->
          <template #item.name="{ item }">
            <div class="font-weight-medium">
              {{ item?.name ?? '—' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Guard: {{ item?.guard_name ?? '—' }}
            </div>
          </template>

          <!-- Permissions as nicer chips -->
          <template #item.permissions="{ item }">
            <div
                v-if="Array.isArray(item?.permissions) && item.permissions.length"
                class="d-flex flex-wrap bg-grey-lighten-4 rounded pa-2"
                style="row-gap: 4px; column-gap: 6px;"
            >
              <v-chip
                  v-for="perm in item.permissions"
                  :key="perm"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  pill
                  class="text-caption font-weight-medium"
              >
      <span class="font-mono">
        {{ perm }}
      </span>
              </v-chip>
            </div>

            <span
                v-else
                class="text-caption text-medium-emphasis"
            >
    No permissions
  </span>
          </template>


          <!-- Users count -->
          <template #item.users_count="{ item }">
            <span class="text-body-2">
              {{ item?.users_count ?? 0 }}
            </span>
          </template>

          <!-- Created at -->
          <template #item.created_at="{ item }">
            <span class="text-body-2">
              {{ formatDate(item?.created_at) }}
            </span>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'

definePageMeta({
  layout: 'default',
  middleware: ['sanctum:auth'],
})

/* ──────────────────────────────
   Current user & permissions
────────────────────────────── */

const { data: me } = await useSanctumFetch('/auth/session/me')

const user = computed(() => me.value ?? null)

const can = (permission: string) => {
  const perms = (user.value as any)?.permissions as string[] | undefined
  if (!perms) return false
  return perms.includes(permission)
}

const canManage = computed(() => can('roles.manage'))

/* ──────────────────────────────
   Fetch roles
────────────────────────────── */

const {
  data: rolesRes,
  pending: pendingRoles,
  error: rolesError,
} = await useSanctumFetch('/api/v1/roles')

// Backend returns either:
//  • plain array: [ { id, name, guard_name, permissions, users_count, ... }, ... ]
//  • or { data: [...] }
// We normalise both.
const roles = computed<any[]>(() => {
  const raw = rolesRes.value as any
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  return []
})

const listErrorMessage = computed(() =>
    rolesError.value ? 'Failed to load roles. Please try again.' : null,
)

/* ──────────────────────────────
   Table headers
────────────────────────────── */

const headers = [
  { title: 'Role', value: 'name' },
  { title: 'Permissions', value: 'permissions' },
  { title: 'Users', value: 'users_count' },
  { title: 'Created', value: 'created_at' },
]

/* ──────────────────────────────
   Helpers
────────────────────────────── */

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
</script>
