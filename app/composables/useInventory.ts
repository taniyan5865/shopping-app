export interface InventoryItem {
  id: string
  household_id: string
  name: string
  category: string | null
  quantity: number
  unit: string
  expiry_date: string | null
  expiry_type: '賞味期限' | '消費期限'
  location: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export function useInventory() {
  const supabase = useSupabaseClient()
  const { householdId } = useHousehold()

  const items = useState<InventoryItem[]>('inventory-items', () => [])
  const loading = ref(false)

  async function fetchItems() {
    if (!householdId.value) return
    loading.value = true
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('household_id', householdId.value)
      .order('expiry_date', { ascending: true, nullsFirst: false })
    loading.value = false
    if (error) throw error
    items.value = (data ?? []) as InventoryItem[]
  }

  async function addItem(input: {
    name: string
    category?: string | null
    quantity: number
    unit: string
    expiry_date?: string | null
    expiry_type?: '賞味期限' | '消費期限'
    location?: string | null
    note?: string | null
  }) {
    if (!householdId.value) throw new Error('household not set')
    const { error } = await supabase.from('inventory_items').insert({
      household_id: householdId.value,
      ...input
    })
    if (error) throw error
    await fetchItems()
  }

  async function updateItem(id: string, input: Partial<InventoryItem>) {
    const { error } = await supabase.from('inventory_items').update(input).eq('id', id)
    if (error) throw error
    await fetchItems()
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id)
    if (error) throw error
    items.value = items.value.filter((i) => i.id !== id)
  }

  function daysUntilExpiry(item: InventoryItem): number | null {
    if (!item.expiry_date) return null
    const diff = new Date(item.expiry_date).getTime() - new Date(new Date().toDateString()).getTime()
    return Math.round(diff / (24 * 60 * 60 * 1000))
  }

  return { items, loading, fetchItems, addItem, updateItem, deleteItem, daysUntilExpiry }
}
