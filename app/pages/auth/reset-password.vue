<template>
  <div class="d-flex align-center justify-center auth-wrapper">
    <v-card max-width="420" class="w-100">
      <v-card-title class="text-h5 font-weight-medium">
        Reset password
      </v-card-title>

      <v-card-subtitle class="text-body-2">
        Choose a new password for your account.
      </v-card-subtitle>

      <v-card-text>
        <UiErrorAlert :message="formErrorMessage" />

        <v-alert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-4"
        >
          {{ successMessage }}
        </v-alert>

        <v-form ref="formRef">
          <!-- Show email (prefilled from query) -->
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

          <v-text-field
              v-model="form.password"
              label="New password"
              type="password"
              density="comfortable"
              variant="outlined"
              :error-messages="fieldErrors.password"
              class="mb-3"
              required
          />

          <v-text-field
              v-model="form.password_confirmation"
              label="Confirm password"
              type="password"
              density="comfortable"
              variant="outlined"
              :error-messages="fieldErrors.password_confirmation"
              required
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="flex-column align-stretch px-4 pb-4">
        <v-btn
            color="primary"
            block
            :loading="submitting"
            @click="submit"
        >
          Reset password
        </v-btn>

        <div class="text-caption text-medium-emphasis text-center mt-3">
          <NuxtLink to="/auth/login">
            Back to login
          </NuxtLink>
        </div>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute } from '#imports'
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'

definePageMeta({
  layout: 'auth',
})

const route = useRoute()

// token comes from query string in the reset link
const token = ref<string>((route.query.token as string) || '')

const formRef = ref()
const submitting = ref(false)

const form = reactive({
  email: (route.query.email as string) || '',
  password: '',
  password_confirmation: '',
})

const fieldErrors = reactive<Record<string, string[]>>({
  email: [],
  password: [],
  password_confirmation: [],
})

const formErrorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const resetErrors = () => {
  formErrorMessage.value = null
  successMessage.value = null
  Object.keys(fieldErrors).forEach(key => {
    fieldErrors[key] = []
  })
}

const submit = async () => {
  resetErrors()
  submitting.value = true

  try {
    const { data } = await useSanctumFetch('/auth/reset-password', () => ({
      method: 'POST',
      body: {
        token: token.value,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      },
    }))

    successMessage.value =
        (data.value as any)?.message || 'Password has been reset successfully.'

    // Optional: redirect to login after short delay
    setTimeout(() => {
      navigateTo('/auth/login')
    }, 1500)
  } catch (e: any) {
    const data = e?.data as any
    formErrorMessage.value =
        data?.message || 'Failed to reset password. Please fix errors and try again.'

    if (data?.errors && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([key, messages]) => {
        if (Array.isArray(messages) && key in fieldErrors) {
          fieldErrors[key] = messages as string[]
        }
      })
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>

</style>
