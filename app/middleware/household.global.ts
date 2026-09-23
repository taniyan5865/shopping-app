export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  if (!user.value) {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) console.error('anonymous sign-in failed', error)
  }

  const { householdId } = useHousehold()

  if (!householdId.value && to.path !== '/join') {
    return navigateTo('/join')
  }
  if (householdId.value && to.path === '/join') {
    return navigateTo('/')
  }
})
