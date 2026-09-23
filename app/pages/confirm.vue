<script setup lang="ts">
const supabase = useSupabaseClient()
const route = useRoute()

onMounted(async () => {
  const code = route.query.code as string | undefined
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) console.error('OAuth exchange failed', error)
  }
  await navigateTo('/')
})
</script>

<template>
  <div class="confirm">
    <p>ログイン中...</p>
  </div>
</template>

<style scoped>
.confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #888;
}
</style>
