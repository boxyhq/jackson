<script setup>
import { ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
</script>

<template>
  <div>
    <h1 class="text-5xl font-bold px-5 py-2">{{ msg }}</h1>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
