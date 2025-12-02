<template>
  <div class="d-flex align-center justify-center auth-wrapper">
    <v-card max-width="420" class="w-100">
      <v-card-title class="text-h5 font-weight-medium">
        Two-step verification
      </v-card-title>

      <v-card-subtitle class="text-body-2">
        <span v-if="channel === 'email'">
          We’ve sent a 6-digit code to your email.
        </span>
        <span v-else-if="channel === 'sms'">
          We’ve sent a 6-digit code to your phone.
        </span>
        <span v-else>
          Enter the 6-digit code from your authenticator app.
        </span>
      </v-card-subtitle>

      <v-card-text>
        <UiErrorAlert :message="formError" />

        <v-alert
            type="info"
            variant="tonal"
            class="mb-3"
        >
          Signing in as <strong>{{ email || 'current user' }}</strong>
        </v-alert>

        <v-form @submit.prevent="submit">
          <v-text-field
              v-model="code"
              label="Security code"
              placeholder="••••••"
              maxlength="6"
              inputmode="numeric"
              variant="outlined"
              density="comfortable"
              :error-messages="fieldErrors.code"
              class="mb-3"
              required
          />

          <div
              v-if="channel === 'email' || channel === 'sms'"
              class="d-flex justify-space-between align-center mb-3 text-caption text-medium-emphasis"
          >
            <span>Didn’t get the code?</span>
            <v-btn
                variant="text"
                size="small"
                :loading="resendLoading"
                @click="resend"
            >
              Resend
            </v-btn>
          </div>

          <v-btn
              type="submit"
              color="primary"
              block
              :loading="submitting"
              :disabled="submitting || !code"
          >
            Verify & continue
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'

definePageMeta({
  layout: 'auth',
  middleware: ['sanctum:auth'], // must be logged in to be here
})

// state from login page (email, chosen channel)
const twoFactorState = useState<any>('twoFactorStatus', () => null)

const route = useRoute()

const email = computed(() => twoFactorState.value?.email || '')
const channel = computed<string>(() => twoFactorState.value?.channel || 'email')

const code = ref('')
const submitting = ref(false)
const resendLoading = ref(false)

const formError = ref<string | null>(null)
const fieldErrors = reactive<Record<string, string[]>>({
  code: [],
})

const resetErrors = () => {
  formError.value = null
  fieldErrors.code = []
}

// Optionally trigger an email/SMS challenge automatically when we land here
onMounted(async () => {
  if (channel.value === 'email' || channel.value === 'sms') {
    await resend()
  }
})

const resend = async () => {
  if (channel.value !== 'email' && channel.value !== 'sms') return

  resetErrors()
  resendLoading.value = true

  try {
    const endpoint =
        channel.value === 'email'
            ? '/auth/session/2fa/email'
            : '/auth/session/2fa/sms'

    await useSanctumFetch(endpoint, () => ({
      method: 'POST',
    }))
  } catch (e: any) {
    const data = e?.data as any
    formError.value =
        data?.message || 'We could not send a verification code. Please try again.'
  } finally {
    resendLoading.value = false
  }
}

const submit = async () => {
  resetErrors()
  submitting.value = true

  try {
    if (channel.value === 'totp') {
      await useSanctumFetch('/auth/session/2fa/totp/verify', () => ({
        method: 'POST',
        body: { code: code.value },
      }))
    } else {
      await useSanctumFetch('/auth/session/2fa/verify-otp', () => ({
        method: 'POST',
        body: { code: code.value },
      }))
    }

    // after success, go to intended page or home
    const redirect = (route.query.redirect as string) || '/'
    await navigateTo(redirect)
  } catch (e: any) {
    const data = e?.data as any
    formError.value =
        data?.message ||
        'The code you entered is invalid or expired. Please try again.'

    if (data?.errors?.code && Array.isArray(data.errors.code)) {
      fieldErrors.code = data.errors.code
    }
  } finally {
    submitting.value = false
  }
}
</script>
