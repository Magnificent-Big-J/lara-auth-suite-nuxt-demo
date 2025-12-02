<!-- app/layouts/default.vue -->
<template>
  <v-app>
    <v-navigation-drawer
        app
        rail
        expand-on-hover
    >
      <v-list
          density="compact"
          nav
      >
        <!-- Dashboard -->
        <v-list-item
            v-if="can('dashboard.view')"
            prepend-icon="mdi-view-dashboard"
            title="Dashboard"
            to="/"
        />

        <!-- Tickets / My Tickets (same route, label depends on role) -->
        <v-list-item
            v-if="can('tickets.view')"
            prepend-icon="mdi-ticket-outline"
            :title="ticketsNavTitle"
            to="/tickets"
        />

        <!-- Ticket settings (categories / priorities) -->
        <v-list-item
            v-if="can('ticket_meta.manage')"
            prepend-icon="mdi-cog"
            title="Ticket Settings"
            to="/ticket-settings"
        />

        <!-- Users -->
        <v-list-item
            v-if="can('users.view')"
            prepend-icon="mdi-account-multiple"
            title="Users"
            to="/users"
        />

        <!-- Roles & permissions -->
        <v-list-item
            v-if="can('roles.view')"
            prepend-icon="mdi-shield-lock"
            title="Roles & Permissions"
            to="/roles"
        />

        <!-- Profile / Security -->
        <v-list-item
            prepend-icon="mdi-shield-account"
            title="Profile & Security"
            to="/profile/security"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
        app
        flat
    >
      <v-app-bar-nav-icon />
      <v-toolbar-title>Ticket Management</v-toolbar-title>

      <v-spacer />

      <span class="mr-4 text-body-2" v-if="user">
        {{ user.name }} ·
        <span class="text-medium-emphasis">
          {{ user.roles?.[0] || 'User' }}
        </span>
      </span>

      <v-btn
          variant="text"
          prepend-icon="mdi-logout"
          @click="handleLogout"
      >
        Logout
      </v-btn>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container
          fluid
          class="py-6"
      >
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { logout } = useSanctumAuth()

// Load current user once in layout
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

// Label: admin/manager → "Tickets", agent/customer → "My Tickets"
const ticketsNavTitle = computed(() => {
  if (hasRole('admin') || hasRole('manager')) {
    return 'Tickets'
  }
  return 'My Tickets'
})

const handleLogout = async () => {
  try {
    await logout()
    await navigateTo('/auth/login')
  } catch (e) {
    console.error('Logout failed', e)
  }
}
</script>
