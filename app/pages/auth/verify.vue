<template>
  <div class="d-flex align-center justify-center auth-wrapper">
    <v-card max-width="420" class="w-100">
      <v-card-title class="text-h5 font-weight-medium">
        Two-Factor Verification
      </v-card-title>

      <v-card-subtitle class="text-body-2">
        <span v-if="channel === 'totp'">
          Enter the 6-digit code from your authenticator app.
        </span>
        <span v-else>
          Enter the 6-digit code sent to your email.
        </span>
      </v-card-subtitle>

      <v-card-text>
        <UiErrorAlert :message="formError" />

        <v-text-field
            v-model="code"
            label="Verification code"
            placeholder="123456"
            maxlength="6"
            inputmode="numeric"
            prepend-inner-icon="mdi-shield-key-outline"
            variant="outlined"
            density="comfortable"
            class="mb-3"
        />

        <v-btn
            color="primary"
            block
            :loading="verifying"
            :disabled="verifying || code.length < 6"
            @click="submit"
        >
          Verify
        </v-btn>

        <v-btn
            v-if="channel !== 'totp'"
            variant="text"
            block
            class="mt-2"
            :loading="resending"
            :disabled="resending"
            @click="resend"
        >
          Resend code
        </v-btn>

        <v-btn
            variant="text"
            block
            class="mt-1"
            :disabled="verifying || resending"
            @click="backToLogin"
        >
          Back to login
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'

definePageMeta({ layout: 'auth' })

const { refreshUser } = useSanctumAuth()

const route = useRoute()
const channel = computed(() => (route.query.channel?.toString() || 'email'))

const baseURL = useRuntimeConfig().public.sanctum.baseUrl

const code = ref('')
const verifying = ref(false)
const resending = ref(false)
const formError = ref<string | null>(null)

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length < 2) return null
  return parts.pop()!.split(';').shift() || null
}

const getXsrfHeader = async () => {
  // Only fetch CSRF cookie if missing
  if (!getCookie('XSRF-TOKEN')) {
    await $fetch('/sanctum/csrf-cookie', {
      method: 'GET',
      baseURL,
      credentials: 'include',
    })
  }

  const xsrf = getCookie('XSRF-TOKEN')
  if (!xsrf) {
    throw { data: { message: 'Missing XSRF-TOKEN cookie. Go back to login and try again.' } }
  }

  return decodeURIComponent(xsrf)
}

const submit = async () => {
  formError.value = null
  verifying.value = true

  const entered = code.value.replace(/\s+/g, '')

  try {
    const xsrfHeader = await getXsrfHeader()

    // 1) VERIFY ONLY (if this fails -> show invalid/expired)
    const url =
        channel.value === 'totp'
            ? '/auth/session/2fa/totp/verify'
            : '/auth/session/2fa/verify-otp'

    await $fetch(url, {
      method: 'POST',
      baseURL,
      credentials: 'include',
      headers: {
        'X-XSRF-TOKEN': xsrfHeader,
        'Accept': 'application/json',
      },
      body: { code: entered },
    })

    // 2) POST-VERIFY: refresh user (if this fails -> DO NOT show invalid code)
    try {
      await refreshUser()
    } catch (e) {
      // Optional: you can console.log this during debug
      // console.warn('refreshUser failed after 2FA verify', e)
    }

    // 3) Redirect regardless (verification succeeded)
    await navigateTo('/')
  } catch (e: any) {
    const data = e?.data as any
    formError.value = data?.message || 'The code is invalid or expired. Please try again.'
  } finally {
    verifying.value = false
  }
}

const resend = async () => {
  formError.value = null
  resending.value = true

  try {
    const xsrfHeader = await getXsrfHeader()

    await $fetch('/auth/session/2fa/email', {
      method: 'POST',
      baseURL,
      credentials: 'include',
      headers: {
        'X-XSRF-TOKEN': xsrfHeader,
        'Accept': 'application/json',
      },
    })
  } catch (e: any) {
    const data = e?.data as any
    formError.value = data?.message || 'Could not resend code. Try again.'
  } finally {
    resending.value = false
  }
}

const backToLogin = async () => {
  await navigateTo('/auth/login')
}
</script>

<style scoped>
</style>
