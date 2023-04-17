<script>
import { Login }  from '@boxyhq/vue3-ui';
import Sdk from '@/components/Sdk.vue';

export default {
  name: "component",

  data() {
    return { name: "Rajiv" };
  },
};
</script>

<template>
    <div>
      This is the component page!!!
      <div>
   <Login ssoIdentifier="some-identifier" />    
      </div>
    </div>
</template>
  
  <style scoped>
  .input {
    color: red;
  }
  </style>