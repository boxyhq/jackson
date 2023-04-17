<template>
    <div>
      <input class="input" :value="name" @input="name = $event.target.value" />
      {{ greeting }} {{ name }}! I can run in React, Vue, Solid, or Liquid!
    </div>
  </template>
  
  <script>
  export default {
    name: "my-component",
  
    props: ["greeting"],
  
    data() {
      return { name: "Rajiv" };
    },
  };
  </script>
  
  <style scoped>
  .input {
    color: red;
  }
  </style>