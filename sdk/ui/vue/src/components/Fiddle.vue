<template>
    <div>
      <input class="input" :value="name" @input="name = $event.target.value" />
      Hello! I can run in React, Vue, Solid, or Liquid!
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  
  const name = ref("Steve");
  </script>
  
  <style scoped>
  .input {
    color: red;
  }
  </style>