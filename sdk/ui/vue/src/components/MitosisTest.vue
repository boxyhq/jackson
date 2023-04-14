<template>
    <div>
      <input
        :style="{
          color: 'red',
        }"
        :value="name"
        @input="name = $event.target.value"
      />
      {{ greet }}, {{ checking }} {{ name }}! I can run in React, Vue, Solid, or
      Liquid!
    </div>
</template>
  
<script setup lang="ts">
import { ref } from "vue";
  
const props = defineProps(["checking"]);
const name = ref("Rajiv");
const greet = ref("Adios amigos");
</script>