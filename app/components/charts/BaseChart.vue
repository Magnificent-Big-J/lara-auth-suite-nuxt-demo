<template>
  <div class="w-100">
    <component
        :is="chartComponent"
        :data="chartData"
        :options="mergedOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart,
  registerables,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'

Chart.register(...registerables)

const props = defineProps<{
  type: 'bar' | 'doughnut'
  labels: string[]
  values: number[]
  title?: string
  options?: ChartOptions
}>()

const chartComponent = computed(() => {
  return props.type === 'doughnut' ? Doughnut : Bar
})

const chartData = computed<ChartData>(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.title ?? '',
      data: props.values,
    },
  ],
}))

const mergedOptions = computed<ChartOptions>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: props.type === 'doughnut',
    },
    title: props.title
        ? {
          display: true,
          text: props.title,
        }
        : {
          display: false,
        },
  },
  ...(props.options || {}),
}))
</script>

<style scoped>
.w-100 {
  width: 100%;
  height: 260px; /* nice default for dashboard cards */
}
</style>
