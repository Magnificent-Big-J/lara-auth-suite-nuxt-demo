// app/stores/ticketFilters.ts
import { defineStore } from 'pinia'

export const useTicketFiltersStore = defineStore('ticketFilters', () => {
    const status = ref<string | null>(null)
    const priority = ref<string | null>(null)
    const search = ref<string>('')
    const page = ref(1)

    function reset() {
        status.value = null
        priority.value = null
        search.value = ''
        page.value = 1
    }

    return {
        status,
        priority,
        search,
        page,
        reset,
    }
})
