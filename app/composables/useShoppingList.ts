export interface ShoppingListItem {
  id: string
  household_id: string
  name: string
  quantity: number
  unit: string
  checked: boolean
  note: string | null
  added_by: string | null
  source: 'manual' | 'suggested'
  created_at: string
}

export function useShoppingList() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { householdId } = useHousehold()

  const items = useState<ShoppingListItem[]>('shopping-list-items', () => [])
  const loading = ref(false)

  async function fetchItems() {
    if (!householdId.value) return
    loading.value = true
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('household_id', householdId.value)
      .order('created_at', { ascending: true })
    loading.value = false
    if (error) throw error
    items.value = (data ?? []) as ShoppingListItem[]
  }

  async function addItem(name: string, quantity = 1, unit = '個', source: 'manual' | 'suggested' = 'manual') {
    if (!householdId.value) throw new Error('household not set')
    const { error } = await supabase.from('shopping_list_items').insert({
      household_id: householdId.value,
      name,
      quantity,
      unit,
      source,
      added_by: user.value?.id ?? null
    })
    if (error) throw error
    await fetchItems()
  }

  async function toggleChecked(id: string, checked: boolean) {
    const { error } = await supabase.from('shopping_list_items').update({ checked }).eq('id', id)
    if (error) throw error
    const target = items.value.find((i) => i.id === id)
    if (target) target.checked = checked
  }

  async function removeItem(id: string) {
    const { error } = await supabase.from('shopping_list_items').delete().eq('id', id)
    if (error) throw error
    items.value = items.value.filter((i) => i.id !== id)
  }

  /** 購入完了として在庫と購入履歴に反映し、リストから外す */
  async function confirmPurchase(
    item: ShoppingListItem,
    input: {
      expiry_date?: string | null
      expiry_type?: '賞味期限' | '消費期限'
      location?: string | null
      price?: number | null
      store?: string | null
    }
  ) {
    if (!householdId.value) throw new Error('household not set')
    const currentHouseholdId = householdId.value

    const { data: existing, error: findError } = await supabase
      .from('inventory_items')
      .select('id, quantity')
      .eq('household_id', currentHouseholdId)
      .eq('name', item.name)
      .maybeSingle()
    if (findError) throw findError

    if (existing) {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          quantity: Number(existing.quantity) + Number(item.quantity),
          ...(input.expiry_date ? { expiry_date: input.expiry_date, expiry_type: input.expiry_type } : {}),
          ...(input.location ? { location: input.location } : {})
        })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('inventory_items').insert({
        household_id: currentHouseholdId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        expiry_date: input.expiry_date || null,
        expiry_type: input.expiry_type || '賞味期限',
        location: input.location || null
      })
      if (error) throw error
    }

    const { error: historyError } = await supabase.from('purchase_history').insert({
      household_id: currentHouseholdId,
      item_name: item.name,
      price: input.price ?? null,
      store: input.store ?? null
    })
    if (historyError) throw historyError

    await removeItem(item.id)
  }

  return { items, loading, fetchItems, addItem, toggleChecked, removeItem, confirmPurchase }
}
