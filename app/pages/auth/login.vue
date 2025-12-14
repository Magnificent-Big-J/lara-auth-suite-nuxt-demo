<template>
  <div class="d-flex align-center justify-center auth-wrapper">
    <v-card max-width="420" class="w-100">
      <v-card-title class="text-h5 font-weight-medium">
        Welcome back
      </v-card-title>

      <v-card-subtitle class="text-body-2">
        Log in to access the ticket management system.
      </v-card-subtitle>

      <v-card-text>
        <UiErrorAlert :message="formError" />

        <v-form ref="formRef">
          <v-text-field
              v-model="form.email"
              label="Email"
              type="email"
              autocomplete="email"
              prepend-inner-icon="mdi-email-outline"
              variant="outlined"
              density="comfortable"
              :error-messages="fieldErrors.email"
              class="mb-3"
              required
          />

          <v-text-field
              v-model="form.password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              variant="outlined"
              density="comfortable"
              :error-messages="fieldErrors.password"
              class="mb-1"
              required
          />

          <div class="d-flex justify-end mb-1">
            <NuxtLink to="/auth/forgot-password" class="text-body-2">
              Forgot password?
            </NuxtLink>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="flex-column align-stretch px-4 pb-4">
        <v-btn
            color="primary"
            block
            :loading="loading"
            :disabled="loading"
            @click="submit"
        >
          Login
        </v-btn>

        <div class="text-caption text-medium-emphasis text-center mt-3">
          Don’t have an account?
          <NuxtLink to="/auth/register">
            Create one
          </NuxtLink>
        </div>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'

definePageMeta({ layout: 'auth' })

// We still keep this for session bootstrap after successful login
const { refreshUser } = useSanctumAuth()

const baseURL = useRuntimeConfig().public.sanctum.baseUrl

const formRef = ref()
const loading = ref(false)
const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const fieldErrors = reactive<Record<string, string[]>>({
  email: [],
  password: [],
})

const formError = ref<string | null>(null)

const resetErrors = () => {
  formError.value = null
  Object.keys(fieldErrors).forEach(key => {
    fieldErrors[key] = []
  })
}

// ✅ tiny helper: read cookie in browser
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length < 2) return null
  return parts.pop()!.split(';').shift() || null
}

const submit = async () => {
  resetErrors()
  loading.value = true

  try {
    // 1) Get CSRF cookie (sets XSRF-TOKEN)
    await $fetch('/sanctum/csrf-cookie', {
      method: 'GET',
      baseURL,
      credentials: 'include',
    })

    // 2) Read XSRF token cookie and pass it back as header
    const xsrf = getCookie('XSRF-TOKEN')
    if (!xsrf) {
      throw { data: { message: 'Missing XSRF-TOKEN cookie after csrf-cookie call.' } }
    }

    const res: any = await $fetch('/auth/session/login', {
      method: 'POST',
      baseURL,
      credentials: 'include',
      headers: {
        // Laravel expects the decoded token value
        'X-XSRF-TOKEN': decodeURIComponent(xsrf),
      },
      body: {
        email: form.email,
        password: form.password,
      },
    })

    // If your backend returns 2fa_required
    if (res?.status === '2fa_required') {
      const channel = res?.two_factor?.channel || 'email'

      await navigateTo({
        path: '/auth/verify',
        query: { channel },
      })
      return
    }

    // Normal login
    await refreshUser()
    await navigateTo('/')
  } catch (e: any) {
    const data = e?.data as any
    formError.value =
        data?.message || 'Login failed. Please check your credentials and try again.'

    if (data?.errors && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([key, messages]) => {
        if (Array.isArray(messages) && key in fieldErrors) {
          fieldErrors[key] = messages as string[]
        }
      })
    }
  } finally {
    loading.value = false
  }
}
</script>
