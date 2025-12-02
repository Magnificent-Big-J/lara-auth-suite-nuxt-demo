<template>
  <div>
    <h1 class="text-h5 font-weight-medium mb-4">
      Profile &amp; Security
    </h1>

    <UiErrorAlert :message="globalError" />

    <v-row>
      <!-- USER INFO -->
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>User information</v-card-title>
          <v-divider />
          <v-card-text>
            <div class="mb-2">
              <div class="text-caption text-medium-emphasis">Name</div>
              <div class="font-weight-medium">
                {{ user?.name ?? '—' }}
              </div>
            </div>

            <div class="mb-2">
              <div class="text-caption text-medium-emphasis">Email</div>
              <div class="font-weight-medium">
                {{ user?.email ?? '—' }}
              </div>
            </div>

            <div v-if="user?.roles?.length" class="mb-2">
              <div class="text-caption text-medium-emphasis">Roles</div>
              <div class="font-weight-medium">
                {{ user.roles.join(', ') }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 2FA OVERVIEW & CONTROLS -->
      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title>Two-factor authentication (2FA)</v-card-title>
          <v-divider />
          <v-card-text>
            <div class="d-flex align-center justify-space-between flex-wrap mb-3">
              <div>
                <div class="text-caption text-medium-emphasis mb-1">
                  Status
                </div>
                <div class="d-flex align-center gap-2">
                  <v-chip
                      size="small"
                      :color="twofaEnabled ? 'green' : 'grey'"
                      variant="flat"
                  >
                    {{ twofaEnabled ? 'Enabled' : 'Disabled' }}
                  </v-chip>

                  <v-chip
                      v-if="twofaEnabled"
                      size="small"
                      :color="twofaVerified ? 'green' : 'orange'"
                      variant="outlined"
                  >
                    {{ twofaVerified ? 'Verified recently' : 'Not verified this session' }}
                  </v-chip>

                  <v-chip
                      v-if="twofaChannelLabel"
                      size="small"
                      color="primary"
                      variant="outlined"
                  >
                    {{ twofaChannelLabel }}
                  </v-chip>
                </div>
              </div>

              <div class="mt-3 mt-md-0">
                <v-btn
                    v-if="twofaEnabled && !disableLoading"
                    color="error"
                    variant="outlined"
                    @click="onDisableTwofa"
                >
                  Disable 2FA
                </v-btn>
                <v-btn
                    v-else-if="disableLoading"
                    color="error"
                    variant="outlined"
                    :loading="true"
                    disabled
                >
                  Disabling…
                </v-btn>
              </div>
            </div>

            <p class="text-body-2 text-medium-emphasis mb-4">
              Add an extra layer of security to your account. You can enable either
              <strong>Email 2FA</strong> or an <strong>Authenticator App</strong>, but not both
              at the same time.
            </p>

            <!-- If 2FA disabled, show entry points -->
            <div
                v-if="!twofaEnabled && !showTotpSetup && emailStep === 'idle'"
                class="d-flex flex-wrap gap-3"
            >
              <v-btn
                  color="primary"
                  variant="outlined"
                  :loading="emailLoading"
                  @click="onEnableEmail"
              >
                Enable Email 2FA
              </v-btn>

              <v-btn
                  color="primary"
                  variant="flat"
                  :loading="totpLoading"
                  @click="onStartTotpSetup"
              >
                Use Authenticator App
              </v-btn>
            </div>

            <!-- EMAIL 2FA: ENTER CODE STEP -->
            <div v-if="emailStep === 'awaiting_code'" class="mt-4">
              <div class="mb-2">
                <div class="text-subtitle-2 mb-1">Verify email code</div>
                <p class="text-body-2 text-medium-emphasis">
                  We’ve sent a verification code to
                  <strong>{{ user?.email }}</strong>.
                  Enter it below to finish enabling Email 2FA.
                </p>
              </div>

              <v-row class="align-center">
                <v-col cols="12" md="4">
                  <v-text-field
                      v-model="emailCode"
                      label="Verification code"
                      maxlength="10"
                      density="comfortable"
                      variant="outlined"
                      :error="!!emailError"
                      :error-messages="emailError"
                  />
                </v-col>
                <v-col cols="12" md="8" class="d-flex gap-2">
                  <v-btn
                      color="primary"
                      :loading="emailVerifyLoading"
                      @click="onVerifyEmailCode"
                  >
                    Verify &amp; enable
                  </v-btn>
                  <v-btn
                      variant="text"
                      @click="resetEmailFlow"
                  >
                    Cancel
                  </v-btn>
                </v-col>
              </v-row>
            </div>

            <!-- TOTP SETUP -->
            <div v-if="showTotpSetup" class="mt-4">
              <div class="mb-2">
                <div class="text-subtitle-2 mb-1">Set up authenticator app</div>
                <p class="text-body-2 text-medium-emphasis">
                  Scan the QR code below using Google Authenticator, 1Password,
                  Authy, or any compatible app. Then enter the 6-digit code from
                  your app to confirm.
                </p>
              </div>

              <v-row>
                <v-col cols="12" md="4" class="d-flex justify-center">
                  <div
                      v-if="qrDataUrl"
                      class="pa-2 border rounded"
                  >
                    <img
                        :src="qrDataUrl"
                        alt="Authenticator QR code"
                        style="max-width: 180px; max-height: 180px"
                    >
                  </div>
                  <v-skeleton-loader
                      v-else
                      type="image"
                      width="180"
                      height="180"
                  />
                </v-col>

                <v-col cols="12" md="8">
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      Manual key (if you can’t scan)
                    </div>
                    <code class="text-body-2">
                      {{ totpSecret || '—' }}
                    </code>
                  </div>

                  <v-row class="align-center">
                    <v-col cols="12" md="5">
                      <v-text-field
                          v-model="totpCode"
                          label="6-digit code"
                          maxlength="10"
                          density="comfortable"
                          variant="outlined"
                          :error="!!totpError"
                          :error-messages="totpError"
                      />
                    </v-col>
                    <v-col cols="12" md="7" class="d-flex gap-2">
                      <v-btn
                          color="primary"
                          :loading="totpVerifyLoading"
                          @click="onVerifyTotp"
                      >
                        Verify &amp; enable
                      </v-btn>
                      <v-btn
                          variant="text"
                          @click="resetTotpFlow"
                      >
                        Cancel
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'

definePageMeta({
  layout: 'default',
  middleware: ['sanctum:auth'],
})

/**
 * USER INFO
 * We just hit /auth/session/me via useSanctumFetch to keep things consistent.
 */
const { data: meResponse } = await useSanctumFetch('/auth/session/me')
const user = computed(() => meResponse.value ?? null)

/**
 * 2FA STATUS
 * GET auth/session/2fa/status
 * -> { enabled: bool, verified: bool, channel: 'email' | 'totp' | null }
 */
const {
  data: twofaStatus,
  refresh: refreshTwofaStatus,
  error: twofaStatusError,
} = await useSanctumFetch('/auth/session/2fa/status')

const twofaEnabled = computed(() => !!twofaStatus.value?.enabled)
const twofaVerified = computed(() => !!twofaStatus.value?.verified)
const twofaChannel = computed<'email' | 'totp' | null>(() => {
  return (twofaStatus.value?.channel as 'email' | 'totp' | null) ?? null
})

const twofaChannelLabel = computed(() => {
  if (!twofaChannel.value) return ''
  return twofaChannel.value === 'email'
      ? 'Email codes'
      : 'Authenticator app'
})

/**
 * GLOBAL ERROR
 */
const globalError = computed(() => {
  if (twofaStatusError.value) {
    return 'Failed to load 2FA status.'
  }
  return null
})

/**
 * EMAIL 2FA FLOW
 */
type EmailStep = 'idle' | 'awaiting_code'

const emailStep = ref<EmailStep>('idle')
const emailCode = ref('')
const emailError = ref<string | null>(null)
const emailLoading = ref(false)
const emailVerifyLoading = ref(false)

const resetEmailFlow = () => {
  emailStep.value = 'idle'
  emailCode.value = ''
  emailError.value = null
}

const onEnableEmail = async () => {
  emailError.value = null
  emailLoading.value = true

  try {
    await useSanctumFetch('/auth/session/2fa/email', {
      method: 'POST',
      body: {},
    })

    // Move to "enter code" step
    emailStep.value = 'awaiting_code'
  } catch (e: any) {
    emailError.value = 'Failed to send email code. Please try again.'
  } finally {
    emailLoading.value = false
  }
}

const onVerifyEmailCode = async () => {
  emailError.value = null

  if (!emailCode.value.trim()) {
    emailError.value = 'Please enter the verification code.'
    return
  }

  emailVerifyLoading.value = true

  try {
    const { error } = await useSanctumFetch('/auth/session/2fa/verify-otp', {
      method: 'POST',
      body: { code: emailCode.value.trim() },
    })

    if (error.value) {
      emailError.value = 'Invalid or expired code.'
      return
    }

    resetEmailFlow()
    await refreshTwofaStatus()
  } catch (e: any) {
    emailError.value = 'Unable to verify code right now.'
  } finally {
    emailVerifyLoading.value = false
  }
}

/**
 * TOTP / AUTHENTICATOR FLOW
 */
const showTotpSetup = ref(false)
const totpSecret = ref<string | null>(null)
const totpCode = ref('')
const totpError = ref<string | null>(null)
const totpLoading = ref(false)
const totpVerifyLoading = ref(false)
const qrDataUrl = ref<string | null>(null)

const resetTotpFlow = () => {
  showTotpSetup.value = false
  totpSecret.value = null
  totpCode.value = ''
  totpError.value = null
  qrDataUrl.value = null
}

const generateQr = async (secret: string) => {
  if (!import.meta.client) return

  const { toDataURL } = await import('qrcode')

  const email = user.value?.email ?? ''
  const issuer = 'Ticket Portal'
  const otpauth = `otpauth://totp/${encodeURIComponent(
      issuer,
  )}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(
      issuer,
  )}&digits=6&period=30`

  qrDataUrl.value = await toDataURL(otpauth)
}

const onStartTotpSetup = async () => {
  totpError.value = null
  totpLoading.value = true

  try {
    const { data, error } = await useSanctumFetch('/auth/session/2fa/totp/enable', {
      method: 'POST',
      body: {},
    })

    if (error.value) {
      totpError.value = 'Failed to start authenticator setup.'
      return
    }

    const secret = (data.value as any)?.secret as string | undefined
    if (!secret) {
      totpError.value = 'Authenticator secret missing from server response.'
      return
    }

    totpSecret.value = secret
    showTotpSetup.value = true
    await generateQr(secret)
  } catch (e: any) {
    totpError.value = 'Unable to start authenticator setup.'
  } finally {
    totpLoading.value = false
  }
}

const onVerifyTotp = async () => {
  totpError.value = null

  if (!totpCode.value.trim()) {
    totpError.value = 'Please enter the 6-digit code from your app.'
    return
  }

  totpVerifyLoading.value = true

  try {
    const { error } = await useSanctumFetch('/auth/session/2fa/totp/verify', {
      method: 'POST',
      body: { code: totpCode.value.trim() },
    })

    if (error.value) {
      totpError.value = 'Invalid code. Please try again.'
      return
    }

    resetTotpFlow()
    await refreshTwofaStatus()
  } catch (e: any) {
    totpError.value = 'Unable to verify authenticator code right now.'
  } finally {
    totpVerifyLoading.value = false
  }
}

/**
 * DISABLE 2FA
 */
const disableLoading = ref(false)

const onDisableTwofa = async () => {
  disableLoading.value = true
  try {
    await useSanctumFetch('/auth/session/2fa/disable', {
      method: 'POST',
      body: {},
    })

    resetEmailFlow()
    resetTotpFlow()
    await refreshTwofaStatus()
  } catch (e: any) {
    // surface as global error
    // (could also use dedicated alert if you prefer)
    console.error(e)
  } finally {
    disableLoading.value = false
  }
}
</script>
