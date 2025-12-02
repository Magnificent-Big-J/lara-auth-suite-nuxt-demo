<template>
  <div class="d-flex align-center justify-center auth-wrapper">
    <v-card max-width="420" class="w-100">
      <v-card-title class="text-h5 font-weight-medium">
        Create account
      </v-card-title>

      <v-card-subtitle class="text-body-2">
        Register to access the ticket management system.
      </v-card-subtitle>

      <v-card-text>
        <UiErrorAlert :message="formErrorMessage" />

        <v-form ref="formRef">
          <v-text-field
              v-model="form.name"
              label="Full name"
              density="comfortable"
              variant="outlined"
              :error-messages="fieldErrors.name"
              class="mb-3"
              required
          />

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
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              variant="outlined"
              density="comfortable"
              :error-messages="fieldErrors.password"
              class="mb-3"
              required
          />

          <v-text-field
              v-model="form.password_confirmation"
              label="Confirm password"
              :type="showPasswordConfirm ? 'text' : 'password'"
              :append-inner-icon="showPasswordConfirm ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPasswordConfirm = !showPasswordConfirm"
              variant="outlined"
              density="comfortable"
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
          Sign up
        </v-btn>

        <div class="text-caption text-medium-emphasis text-center mt-3">
          Already have an account?
          <NuxtLink to="/auth/login">
            Log in
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
  layout: 'auth', // change to your login layout if different
})
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

const formRef = ref()
const submitting = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const fieldErrors = reactive<Record<string, string[]>>({
  name: [],
  email: [],
  password: [],
  password_confirmation: [],
})

const formErrorMessage = ref<string | null>(null)

const resetErrors = () => {
  formErrorMessage.value = null
  Object.keys(fieldErrors).forEach(key => {
    fieldErrors[key] = []
  })
}

const submit = async () => {
  resetErrors()
  submitting.value = true

  try {
    await useSanctumFetch('/auth/register', () => ({
      method: 'POST',
      body: { ...form },
    }))

    // After successful registration, send them to login
    await navigateTo('/auth/login')
  } catch (e: any) {
    const data = e?.data as any
    formErrorMessage.value =
        data?.message || 'Registration failed. Please fix the errors and try again.'

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
