<script setup lang="ts">
const route = useRoute()
const showNav = computed(() => route.path !== '/join')
</script>

<template>
  <div class="app-shell">
    <main class="app-main" :class="{ 'with-nav': showNav }">
      <slot />
    </main>

    <nav v-if="showNav" class="bottom-nav">
      <NuxtLink to="/" class="nav-item">
        <span>🏠</span>
        <small>ホーム</small>
      </NuxtLink>
      <NuxtLink to="/inventory" class="nav-item">
        <span>📦</span>
        <small>在庫</small>
      </NuxtLink>
      <NuxtLink to="/shopping-list" class="nav-item">
        <span>🛒</span>
        <small>買い物リスト</small>
      </NuxtLink>
      <NuxtLink to="/settings" class="nav-item">
        <span>⚙️</span>
        <small>設定</small>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-main {
  flex: 1;
  padding: 16px;
  padding-bottom: 16px;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}
.app-main.with-nav {
  padding-bottom: 84px;
}
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  border-top: 1px solid #e5e5e5;
  padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
}
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: #888;
  font-size: 0.7rem;
  padding: 4px 0;
}
.nav-item span {
  font-size: 1.3rem;
}
.nav-item.router-link-exact-active {
  color: #16a34a;
}
</style>
