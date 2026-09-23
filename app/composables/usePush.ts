function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePush() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { householdId } = useHousehold()
  const config = useRuntimeConfig()

  const isSupported = ref(false)
  const isSubscribed = ref(false)

  async function checkSubscription() {
    isSupported.value = import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window
    if (!isSupported.value) return
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    isSubscribed.value = !!subscription
  }

  async function subscribe() {
    if (!isSupported.value || !householdId.value || !user.value) return

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') throw new Error('通知が許可されませんでした')

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.public.vapidPublicKey as string)
    })

    const json = subscription.toJSON()
    const keys = json.keys as { p256dh: string; auth: string }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        household_id: householdId.value,
        user_id: user.value.id,
        endpoint: json.endpoint as string,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      { onConflict: 'endpoint' }
    )
    if (error) throw error
    isSubscribed.value = true
  }

  async function unsubscribe() {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
      await subscription.unsubscribe()
    }
    isSubscribed.value = false
  }

  return { isSupported, isSubscribed, checkSubscription, subscribe, unsubscribe }
}
