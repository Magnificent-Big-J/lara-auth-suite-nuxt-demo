<!-- app/layouts/auth.vue -->
<template>
  <v-app>
    <v-main class="auth-main d-flex align-center justify-center">
      <v-container class="d-flex justify-center">
        <v-card
            class="auth-card pa-6"
            max-width="480"
        >
          <!-- Logo / title block -->
          <div class="text-center mb-6">
            <div class="auth-icon-wrapper mb-3">
              <v-icon size="32" color="primary">mdi-ticket-account</v-icon>
            </div>

            <h1 class="text-h5 font-weight-bold mb-1">
              Ticket Portal
            </h1>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Sign in to manage your tickets
            </p>
          </div>

          <!-- Page content (login / register / etc.) -->
          <slot />

          <!-- Small footer hint -->
          <div class="text-caption text-medium-emphasis text-center mt-4">
            Secure, role-based access for admins, agents & customers.
          </div>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
/* no-op for now */
</script>

<style scoped>
.auth-main {
  min-height: 100vh;
  /* Soft gradient background */
  background: radial-gradient(circle at top left, #e0f2fe 0, transparent 45%),
  radial-gradient(circle at bottom right, #ede9fe 0, transparent 50%),
  #f4f5fb;
  position: relative;
  overflow: hidden;
}

/* Subtle floating blobs for a bit of depth */
.auth-main::before,
.auth-main::after {
  content: "";
  position: absolute;
  border-radius: 999px;
  filter: blur(40px);
  opacity: 0.35;
  pointer-events: none;
}

.auth-main::before {
  width: 260px;
  height: 260px;
  background: #bfdbfe;
  top: -60px;
  right: 10%;
}

.auth-main::after {
  width: 260px;
  height: 260px;
  background: #ddd6fe;
  bottom: -80px;
  left: 5%;
}

.auth-card {
  border-radius: 18px;
  box-shadow:
      0 18px 45px rgba(15, 23, 42, 0.12),
      0 0 0 1px rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(4px);
}

/* Icon pill at the top of the card */
.auth-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: white;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
}
</style>
