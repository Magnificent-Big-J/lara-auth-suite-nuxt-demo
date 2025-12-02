<template>
  <div class="d-flex align-center justify-center auth-wrapper">
    <v-card max-width="420" class="w-100">
      <v-card-title class="text-h5 font-weight-medium">
        Forgot password
      </v-card-title>

      <v-card-subtitle class="text-body-2">
        Enter your email and we’ll send you a password reset link.
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
          <v-text-field
              v-model="email"
              label="Email"
              type="email"
              density="comfortable"
              variant="outlined"
              :error-messages="fieldErrors.email"
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
          Send reset link
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
import UiErrorAlert from '@/components/ui/ErrorAlert.vue'

definePageMeta({
  layout: 'auth',
})

const formRef = ref()
const submitting = ref(false)

const email = ref('')

const fieldErrors = reactive<{ email: string[] }>({
  email: [],
})

const formErrorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const resetErrors = () => {
  formErrorMessage.value = null
  successMessage.value = null
  fieldErrors.email = []
}

const submit = async () => {
  resetErrors()
  submitting.value = true

  try {
    const { data } = await useSanctumFetch('/auth/forgot-password', () => ({
      method: 'POST',
      body: { email: email.value },
    }))

    successMessage.value =
        (data.value as any)?.message ||
        'If that email exists in our system, a reset link has been sent.'
  } catch (e: any) {
    const data = e?.data as any
    formErrorMessage.value =
        data?.message || 'Failed to send reset link. Please try again.'

    if (data?.errors?.email && Array.isArray(data.errors.email)) {
      fieldErrors.email = data.errors.email
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>

</style>
