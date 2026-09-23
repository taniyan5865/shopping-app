export interface Suggestion {
  key: string
  name: string
  reason: string
}

export function useSuggestions() {
  const supabase = useSupabaseClient()
  const { householdId } = useHousehold()

  const suggestions = useState<Suggestion[]>('shopping-suggestions', () => [])
  const loading = ref(false)

  async function refresh() {
    if (!householdId.value) return
    loading.value = true

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const [{ data: inventory }, { data: shoppingList }, { data: history }] = await Promise.all([
      supabase.from('inventory_items').select('id, name, quantity, expiry_date').eq('household_id', householdId.value),
      supabase
        .from('shopping_list_items')
        .select('name')
        .eq('household_id', householdId.value)
        .eq('checked', false),
      supabase
        .from('purchase_history')
        .select('item_name')
        .eq('household_id', householdId.value)
        .gte('purchased_at', ninetyDaysAgo)
    ])

    loading.value = false

    const inventoryList = inventory ?? []
    const listNames = new Set((shoppingList ?? []).map((i) => i.name))
    const results: Suggestion[] = []
    const seen = new Set<string>()

    const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

    for (const item of inventoryList) {
      if (listNames.has(item.name) || seen.has(item.name)) continue

      if (Number(item.quantity) <= 1) {
        const nearExpiry = item.expiry_date && new Date(item.expiry_date) <= in3days
        results.push({
          key: item.id,
          name: item.name,
          reason: nearExpiry ? '期限が近く在庫もわずかです' : '在庫が残りわずかです'
        })
        seen.add(item.name)
      }
    }

    const inventoryNames = new Set(inventoryList.map((i) => i.name))
    const counts = new Map<string, number>()
    for (const h of history ?? []) {
      counts.set(h.item_name, (counts.get(h.item_name) ?? 0) + 1)
    }
    for (const [name, count] of counts) {
      if (count >= 2 && !inventoryNames.has(name) && !listNames.has(name) && !seen.has(name)) {
        results.push({ key: `freq-${name}`, name, reason: `よく購入する商品です（過去90日で${count}回購入）` })
        seen.add(name)
      }
    }

    suggestions.value = results
  }

  return { suggestions, loading, refresh }
}
