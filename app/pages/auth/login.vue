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

definePageMeta({
  layout: 'auth',
})

const { login } = useSanctumAuth()

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
    await login({
      email: form.email,
      password: form.password,
    })

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

<style scoped>

</style>
