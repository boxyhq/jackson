<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import MitosisTest from './components/MitosisTest.vue'
import Fiddle from './components/Fiddle.vue'
import Login from './Login/index.vue'
import Logged from './Login/login.vue'
</script>

<template>
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class-name="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class-name="logo vue" alt="Vue logo" />
    </a>
  </div>
  <Login ssoIdentifier="something" :classNames="{
    button:'btn-outline btn-block btn'
  }" :innerProps="{
    button:{'data-testid': 'sso-login-button' }
  }" buttonText="login_with_sso" />
  <HelloWorld msg="Vite + Vue" />
  <Logged ssoIdentifier="some-identifier" placeholder="contos@boxyhq.com" inputLabel="Team domain" :innerProps="{button:{'data-testid': 'sso-login-button'}}"  :classNames="{
   button:'btn-outline btn-block btn' 
  }" />
  <Logged inputLabel="Team domain *" placeholder="contoso@boxyhq.com" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
