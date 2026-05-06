<template>
  <div id="app">
    <header class="app-header">
      <h1>Employee Manager</h1>
    </header>
    <main>
      <EmployeeList />
    </main>
  </div>
</template>

<script setup lang="ts">
import EmployeeList from './components/EmployeeList.vue'
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f0f2f5;
  color: #333;
}

#app {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem;
}

.app-header {
  margin-bottom: 2rem;
  border-bottom: 2px solid #4a90e2;
  padding-bottom: 0.75rem;
}

.app-header h1 {
  font-size: 1.8rem;
  color: #2c3e50;
}
</style>
