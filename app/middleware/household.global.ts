export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/confirm') return

  const user = useSupabaseUser()
  if (!user.value) return

  const { householdId, restoreHouseholdFromAccount } = useHousehold()

  if (!householdId.value) {
    await restoreHouseholdFromAccount(user.value.id)
  }

  if (!householdId.value && to.path !== '/join') {
    return navigateTo('/join')
  }
  if (householdId.value && to.path === '/join') {
    return navigateTo('/')
  }
})
