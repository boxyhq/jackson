<template>
  <div>
    <input
      class="input rounded-full border-2 border-red-500 px-5 py-2"
      :value="name"
      @input="name = $event.target.value" />
    <button
      class="mx-5 cursor-pointer rounded-md bg-green-400 px-3 py-1 font-bold text-white"
      @click="handleSubmit($event)">
      Click me
    </button>
    {{ greet }} {{ name }}, {{ greeting }} this is the component page!!!
    <div v-if="errorMessage">
      <h1>This is an error code block</h1>
    </div>
  </div>
</template>

<script>
export default {
  name: 'fiddle',

  props: ['greet'],

  data() {
    return { name: 'Rajiv', greeting: 'Adios amigos', errorMessage: '' };
  },

  methods: {
    handleChange(e) {
      this.greeting = 'Olaaaaaa';
      this.errorMessage = '';
    },
    handleSubmit(e) {
      this.greeting = 'Olaaaaaa';
      this.errorMessage = 'Error 404';
      console.log('SSO flow initited', e);
    },
  },
};
</script>

<style scoped>
.input {
  color: red;
}
</style>
