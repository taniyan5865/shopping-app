export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (to.path === '/confirm') return

  const user = useSupabaseUser()
  if (!user.value) return

  const { householdId } = useHousehold()

  if (!householdId.value && to.path !== '/join') {
    return navigateTo('/join')
  }
  if (householdId.value && to.path === '/join') {
    return navigateTo('/')
  }
})
