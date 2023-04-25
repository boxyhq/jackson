<script setup>
import HelloWorld from './components/HelloWorld.vue';
</script>

<template>
  <div id="app">
    <header>
      <nav class="navbar">
        <div class="navbar">
          <div class="logo">
            <img src="@/assets/logo.png" width="40" height="40" />
            <h1 class="title">BoxyHQ Vue2 SDK</h1>
          </div>
          </div>
          <div class="nav-links">
          <router-link to="/">Home</router-link>
          <router-link to="/components">Components</router-link>
        </div>
      </nav>
    </header>

    <router-view />
  </div>
</template>

<style scoped>
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100vw;
  height: 65px;
  font-size: 12px;
  padding: 15px 40px;
  margin-bottom: 15px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.logo{
  display: flex;
  justify-content: center;
  align-items: center;
}

nav a.router-link-exact-active {
  color: blue;
  text-decoration: underline;
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  font-size: 15px;
  color: black;
}

nav a:first-of-type {
  border: 0;
}
</style>
