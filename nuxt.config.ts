// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

const apiBaseUrl = process.env.NUXT_PUBLIC_SANCTUM_BASE_URL || 'http://localhost'

export default defineNuxtConfig({
  srcDir: 'app',

  modules: [
    'nuxt-auth-sanctum',
    'vuetify-nuxt-module',
    '@pinia/nuxt',
  ],

  runtimeConfig: {
    public: {
      sanctum: {
        baseUrl: apiBaseUrl,
      },
    },
  },

  sanctum: {
    mode: 'cookie',
    baseUrl: apiBaseUrl,
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/auth/session/login',
      logout: '/auth/session/logout',
      user: '/auth/session/me',
    },
    redirect: {
      keepRequestedRoute: true,
      onLogin: '/',
      onLogout: '/auth/login',
      onAuthOnly: '/auth/login',
      onGuestOnly: '/',
    },
    globalMiddleware: {
      enabled: false,
      allow404WithoutAuth: true,
    },
  },

  vuetify: {
    moduleOptions: {},
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
      },
    },
  },

  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.min.css',
  ],

  build: {
    transpile: ['vuetify'],
  },

  typescript: {
    strict: false,
    typeCheck: false,
  },
})
