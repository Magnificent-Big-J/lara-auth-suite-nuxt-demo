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

        <v-form ref="formRef" @submit.prevent="submit">
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

          <div class="d-flex justify-end mb-3">
            <NuxtLink to="/auth/forgot-password" class="text-body-2">
              Forgot password?
            </NuxtLink>
          </div>

          <v-btn
              type="submit"
              color="primary"
              block
              :loading="loading"
              :disabled="loading"
          >
            Login
          </v-btn>
        </v-form>
      </v-card-text>

      <v-card-actions class="flex-column align-stretch px-4 pb-4">
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

definePageMeta({
  layout: 'auth',
})

const { login } = useSanctumAuth()

// shared 2FA status between pages
const twoFactorState = useState<any>('twoFactorStatus', () => null)

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

const submit = async () => {
  resetErrors()
  loading.value = true

  try {
    // 1. normal Sanctum login → sets session cookie
    await login({
      email: form.email,
      password: form.password,
    })

    // 2. ask LaraAuthSuite about 2FA status
    const { data: statusRes } = await useSanctumFetch(
        '/auth/session/2fa/status',
        () => ({ method: 'GET' }),
    )

    const status = statusRes.value as any || {}

    // adapt these keys to your actual response from /auth/session/2fa/status
    const enabled =
        status.enabled ??
        status.is_enabled ??
        status.two_factor_enabled ??
        false

    const verified =
        status.verified ??
        status.is_verified ??
        status.two_factor_verified ??
        false

    const channel =
        status.channel ??
        status.default_channel ??
        'email'

    if (!enabled || verified) {
      // 3.a no 2FA or already verified → go to app
      const redirect = (useRoute().query.redirect as string) || '/'
      await navigateTo(redirect)
      return
    }

    // 3.b 2FA enabled and NOT verified → go to 2FA page
    twoFactorState.value = {
      email: form.email,
      channel,
      // include anything else from status you might need
    }

    const redirect = (useRoute().query.redirect as string) || '/'
    await navigateTo({
      path: '/auth/two-factor',
      query: { redirect },
    })
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
