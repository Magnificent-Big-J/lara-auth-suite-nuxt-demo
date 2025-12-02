<!-- app/pages/users/index.vue -->
<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h5 font-weight-medium mb-1">
          Users
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Manage users and roles for the ticket system.
        </p>
      </div>

      <v-btn
          v-if="canCreate"
          color="primary"
          prepend-icon="mdi-account-plus"
          @click="openCreateDialog"
      >
        New User
      </v-btn>
    </div>

    <!-- Global list error -->
    <UiErrorAlert :message="listErrorMessage" />

    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row class="align-center">
          <v-col cols="12" md="4">
            <v-text-field
                v-model="search"
                label="Search (name or email)"
                prepend-inner-icon="mdi-magnify"
                density="comfortable"
                variant="outlined"
                clearable
                hide-details
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
                v-model="roleFilter"
                :items="roleOptions"
                item-title="label"
                item-value="value"
                label="Role"
                density="comfortable"
                variant="outlined"
                clearable
                hide-details
            />
          </v-col>

          <v-col
              cols="12"
              md="5"
              class="d-flex justify-end"
          >
            <v-btn
                variant="text"
                prepend-icon="mdi-refresh"
                :loading="pendingUsers"
                @click="refreshUsers"
            >
              Refresh
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Users table -->
    <v-card>
      <v-card-text>
        <v-skeleton-loader
            v-if="pendingUsers && !users.length"
            type="table"
        />

        <v-data-table
            v-else
            :items="users"
            :headers="headers"
            :items-per-page="perPage"
            :page="page"
            hide-default-footer
            item-key="id"
            @update:page="onPageChange"
        >
          <template #item.name="{ item }">
            <div class="font-weight-medium">
              {{ item?.name ?? '—' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item?.raw?.email ?? '' }}
            </div>
          </template>

          <template #item.roles="{ item }">
            <div
                v-if="normalizeRoles(item?.roles).length"
                class="d-flex flex-wrap gap-1"
            >
              <v-chip
                  v-for="role in normalizeRoles(item.roles)"
                  :key="role"
                  size="x-small"
                  color="primary"
                  variant="tonal"
              >
                {{ roleLabel(role) }}
              </v-chip>
            </div>
            <span
                v-else
                class="text-caption text-medium-emphasis"
            >
              None
            </span>
          </template>

          <template #item.created_at="{ item }">
            <span class="text-body-2">
              {{ formatDate(item?.created_at) }}
            </span>
          </template>

          <template #item.actions="{ item }">
            <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                :disabled="!canUpdate"
                @click="openEditDialog(item)"
            />
          </template>

          <template #bottom>
            <div class="d-flex justify-space-between align-center px-4 pt-3">
              <div class="text-caption text-medium-emphasis">
                Showing
                <span class="font-weight-medium">{{ users.length }}</span>
                of
                <span class="font-weight-medium">{{ total }}</span>
                users
              </div>

              <v-pagination
                  v-model="page"
                  :length="lastPage"
                  total-visible="7"
              />
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create / Edit dialog -->
    <v-dialog
        v-model="dialog.open"
        max-width="500"
    >
      <v-card>
        <v-card-title class="text-h6">
          {{ dialog.mode === 'create' ? 'Create User' : 'Edit User' }}
        </v-card-title>
        <v-divider />
        <v-card-text>
          <UiErrorAlert :message="formErrorMessage" />

          <v-form ref="formRef">
            <v-text-field
                v-model="form.name"
                label="Name"
                density="comfortable"
                variant="outlined"
                :error-messages="fieldErrors.name"
                class="mb-3"
                required
            />

            <v-text-field
                v-model="form.email"
                label="Email"
                type="email"
                density="comfortable"
                variant="outlined"
                :error-messages="fieldErrors.email"
                class="mb-3"
                required
            />

            <v-select
                v-model="form.role"
                :items="roleOptionsWithoutAll"
                item-title="label"
                item-value="value"
                label="Role"
                density="comfortable"
                variant="outlined"
                :error-messages="fieldErrors.role"
                class="mb-3"
                required
            />

            <v-text-field
                v-model="form.password"
                label="Password"
                type="password"
                density="comfortable"
                variant="outlined"
                :error-messages="fieldErrors.password"
                class="mb-3"
                :required="dialog.mode === 'create'"
            />

            <v-text-field
                v-model="form.password_confirmation"
                label="Confirm Password"
                type="password"
                density="comfortable"
                variant="outlined"
                :error-messages="fieldErrors.password_confirmation"
                :required="dialog.mode === 'create'"
            />
          </v-form>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn
              variant="text"
              @click="closeDialog"
          >
            Cancel
          </v-btn>
          <v-btn
              color="primary"
              :loading="saving"
              @click="submitForm"
          >
            {{ dialog.mode === 'create' ? 'Create' : 'Save changes' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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

const canCreate = computed(() => can('users.create'))
const canUpdate = computed(() => can('users.update'))

/* ──────────────────────────────
   Filters & listing
────────────────────────────── */

const search = ref<string>('')
const roleFilter = ref<string | null>(null)
const page = ref<number>(1)

const roleOptions = [
  { label: 'All roles', value: null },
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Agent', value: 'agent' },
  { label: 'Customer', value: 'customer' },
]

const roleOptionsWithoutAll = roleOptions.filter(r => r.value !== null)

const {
  data: usersRes,
  pending: pendingUsers,
  error: usersError,
  refresh: refreshUsersRaw,
} = await useSanctumFetch(
    '/api/v1/users',
    () => ({
      method: 'GET',
      query: {
        page: page.value,
        search: search.value || undefined,
        role: roleFilter.value || undefined,
      },
    }),
    {
      watch: [page, search, roleFilter],
    },
)

// 👉 matches your actual response: { data: [...], meta: {...} }
const users = computed<any[]>(() => {
  const raw = usersRes.value as any
  return raw?.data ?? []
})

const meta = computed<any | null>(() => {
  const raw = usersRes.value as any
  return raw?.meta ?? null
})

const perPage = computed(() => meta.value?.per_page ?? 15)
const total = computed(() => meta.value?.total ?? users.value.length)
const lastPage = computed(() => meta.value?.last_page ?? 1)

const listErrorMessage = computed(() =>
    usersError.value ? 'Failed to load users. Please try again.' : null,
)

const onPageChange = (newPage: number) => {
  page.value = newPage
}

const refreshUsers = async () => {
  await refreshUsersRaw()
}

/* ──────────────────────────────
   Table headers
────────────────────────────── */

const headers = [
  { title: 'User', value: 'name' },
  { title: 'Roles', value: 'roles' },
  { title: 'Created', value: 'created_at' },
  { title: 'Actions', value: 'actions', sortable: false },
]

/* ──────────────────────────────
   Dialog state (Create/Edit)
────────────────────────────── */

const dialog = reactive<{
  open: boolean
  mode: 'create' | 'edit'
  editingUserId: number | null
}>({
  open: false,
  mode: 'create',
  editingUserId: null,
})

const formRef = ref()
const saving = ref(false)

const fieldErrors = reactive<Record<string, string[]>>({
  name: [],
  email: [],
  role: [],
  password: [],
  password_confirmation: [],
})
const formErrorMessage = ref<string | null>(null)

const form = reactive<{
  name: string
  email: string
  role: string | null
  password: string
  password_confirmation: string
}>({
  name: '',
  email: '',
  role: null,
  password: '',
  password_confirmation: '',
})

const resetFormErrors = () => {
  formErrorMessage.value = null
  Object.keys(fieldErrors).forEach(key => {
    fieldErrors[key] = []
  })
}

const resetForm = () => {
  form.name = ''
  form.email = ''
  form.role = null
  form.password = ''
  form.password_confirmation = ''
  dialog.editingUserId = null
  dialog.mode = 'create'
  resetFormErrors()
}

const openCreateDialog = () => {
  resetForm()
  dialog.mode = 'create'
  dialog.open = true
}

const openEditDialog = (userToEdit: any) => {
  if (!userToEdit) return

  resetFormErrors()
  dialog.mode = 'edit'
  dialog.editingUserId = userToEdit.id
  form.name = userToEdit.name ?? ''
  form.email = userToEdit.email ?? ''
  form.role = normalizeRoles(userToEdit.roles)[0] ?? null
  form.password = ''
  form.password_confirmation = ''
  dialog.open = true
}

const closeDialog = () => {
  dialog.open = false
}

/* ──────────────────────────────
   Submit create / edit
────────────────────────────── */

const submitForm = async () => {
  resetFormErrors()
  saving.value = true

  try {
    if (dialog.mode === 'create') {
      await useSanctumFetch('/api/v1/users', () => ({
        method: 'POST',
        body: {
          name: form.name,
          email: form.email,
          role: form.role,
          password: form.password,
          password_confirmation: form.password_confirmation,
        },
      }))
    } else if (dialog.mode === 'edit' && dialog.editingUserId) {
      await useSanctumFetch(`/api/v1/users/${dialog.editingUserId}`, () => ({
        method: 'PUT',
        body: {
          name: form.name,
          email: form.email,
          role: form.role,
          ...(form.password
              ? {
                password: form.password,
                password_confirmation: form.password_confirmation,
              }
              : {}),
        },
      }))
    }

    dialog.open = false
    await refreshUsers()
  } catch (e: any) {
    const data = e?.data as any
    formErrorMessage.value =
        data?.message || 'Failed to save user. Please fix errors and try again.'

    if (data?.errors && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([key, messages]) => {
        if (Array.isArray(messages) && key in fieldErrors) {
          fieldErrors[key] = messages as string[]
        }
      })
    }
  } finally {
    saving.value = false
  }
}

/* ──────────────────────────────
   Helpers
────────────────────────────── */

const roleLabel = (value: string) => {
  switch (value) {
    case 'admin':
      return 'Admin'
    case 'manager':
      return 'Manager'
    case 'agent':
      return 'Agent'
    case 'customer':
      return 'Customer'
    default:
      return value
  }
}

const normalizeRoles = (roles: any): string[] => {
  console.log(roles)
  if (!roles) return []
  if (Array.isArray(roles)) {
    if (typeof roles[0] === 'string') return roles
    if (typeof roles[0] === 'object') {
      return roles.map((r: any) => r?.name).filter(Boolean)
    }
  }
  return []
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
</script>
