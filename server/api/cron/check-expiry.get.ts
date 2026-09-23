import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Vercel Cron: CRON_SECRET を設定すると自動で Authorization ヘッダーが付与される
  const authHeader = getHeader(event, 'authorization')
  if (config.cronSecret && authHeader !== `Bearer ${config.cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = createClient(config.public.supabase.url as string, config.supabaseServiceRoleKey as string)

  webpush.setVapidDetails(
    config.vapidSubject as string,
    config.public.vapidPublicKey as string,
    config.vapidPrivateKey as string
  )

  const threshold = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: expiringItems, error } = await supabase
    .from('inventory_items')
    .select('household_id, name, expiry_date')
    .lte('expiry_date', threshold)

  if (error) throw error
  if (!expiringItems?.length) return { sent: 0, households: 0 }

  const byHousehold = new Map<string, string[]>()
  for (const item of expiringItems) {
    const list = byHousehold.get(item.household_id) ?? []
    list.push(item.name)
    byHousehold.set(item.household_id, list)
  }

  let sent = 0

  for (const [householdId, names] of byHousehold) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('household_id', householdId)

    if (!subs?.length) continue

    const title = '期限が近い食品があります'
    const body =
      names.length <= 3
        ? `${names.join('、')} の期限が近づいています`
        : `${names.slice(0, 3).join('、')} など${names.length}件の期限が近づいています`

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, url: '/inventory' })
        )
        sent++
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('push send failed', err)
        }
      }
    }
  }

  return { sent, households: byHousehold.size }
})
