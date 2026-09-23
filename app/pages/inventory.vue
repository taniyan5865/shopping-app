<script setup lang="ts">
import type { InventoryItem } from '~/composables/useInventory'

const { items, fetchItems, addItem, updateItem, deleteItem, daysUntilExpiry } = useInventory()

onMounted(fetchItems)

const showForm = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  name: '',
  quantity: 1,
  unit: '個',
  category: '',
  expiry_date: '',
  expiry_type: '賞味期限' as '賞味期限' | '消費期限',
  location: '',
  note: ''
})

function resetForm() {
  form.name = ''
  form.quantity = 1
  form.unit = '個'
  form.category = ''
  form.expiry_date = ''
  form.expiry_type = '賞味期限'
  form.location = ''
  form.note = ''
  editingId.value = null
}

function startEdit(item: InventoryItem) {
  editingId.value = item.id
  form.name = item.name
  form.quantity = item.quantity
  form.unit = item.unit
  form.category = item.category || ''
  form.expiry_date = item.expiry_date || ''
  form.expiry_type = item.expiry_type
  form.location = item.location || ''
  form.note = item.note || ''
  showForm.value = true
}

async function submit() {
  if (!form.name.trim()) return

  const payload = {
    name: form.name.trim(),
    quantity: Number(form.quantity) || 1,
    unit: form.unit || '個',
    category: form.category || null,
    expiry_date: form.expiry_date || null,
    expiry_type: form.expiry_type,
    location: form.location || null,
    note: form.note || null
  }

  if (editingId.value) {
    await updateItem(editingId.value, payload)
  } else {
    await addItem(payload)
  }

  showForm.value = false
  resetForm()
}

function statusClass(item: InventoryItem) {
  const d = daysUntilExpiry(item)
  if (d === null) return ''
  if (d <= 0) return 'expired'
  if (d <= 3) return 'soon'
  return ''
}

function statusLabel(item: InventoryItem) {
  const d = daysUntilExpiry(item)
  if (d === null) return ''
  if (d <= 0) return '期限切れ'
  return `あと${d}日`
}

const sortedItems = computed(() =>
  [...items.value].sort((a, b) => {
    if (!a.expiry_date) return 1
    if (!b.expiry_date) return -1
    return a.expiry_date < b.expiry_date ? -1 : 1
  })
)
</script>

<template>
  <div class="inventory">
    <div class="header">
      <h1>在庫一覧</h1>
      <button class="primary" @click="showForm = true; resetForm()">＋ 追加</button>
    </div>

    <ul class="items">
      <li v-for="item in sortedItems" :key="item.id" class="item" :class="statusClass(item)">
        <div class="info" @click="startEdit(item)">
          <div class="name-row">
            <span class="name">{{ item.name }}</span>
            <span v-if="item.category" class="category">{{ item.category }}</span>
          </div>
          <div class="meta">
            <span>{{ item.quantity }}{{ item.unit }}</span>
            <span v-if="item.location">・{{ item.location }}</span>
            <span v-if="item.expiry_date">・{{ item.expiry_type }} {{ item.expiry_date }}</span>
          </div>
        </div>
        <div class="actions">
          <span v-if="item.expiry_date" class="badge" :class="statusClass(item)">{{ statusLabel(item) }}</span>
          <button class="delete" @click="deleteItem(item.id)">削除</button>
        </div>
      </li>
      <li v-if="!sortedItems.length" class="empty">在庫がまだ登録されていません</li>
    </ul>

    <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
      <div class="modal">
        <h2>{{ editingId ? '在庫を編集' : '在庫を追加' }}</h2>
        <form @submit.prevent="submit">
          <label>商品名<input v-model="form.name" type="text" required /></label>
          <div class="row">
            <label>数量<input v-model.number="form.quantity" type="number" min="0" step="0.1" /></label>
            <label>単位<input v-model="form.unit" type="text" /></label>
          </div>
          <label>カテゴリ<input v-model="form.category" type="text" placeholder="例：野菜、調味料" /></label>
          <div class="row">
            <label>
              期限種別
              <select v-model="form.expiry_type">
                <option value="賞味期限">賞味期限</option>
                <option value="消費期限">消費期限</option>
              </select>
            </label>
            <label>期限日<input v-model="form.expiry_date" type="date" /></label>
          </div>
          <label>保管場所<input v-model="form.location" type="text" placeholder="例：冷蔵庫、冷凍庫" /></label>
          <label>メモ<input v-model="form.note" type="text" /></label>

          <div class="modal-actions">
            <button type="button" class="secondary" @click="showForm = false">キャンセル</button>
            <button type="submit" class="primary">{{ editingId ? '更新' : '追加' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inventory {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h1 {
  font-size: 1.3rem;
  margin: 0;
}
.primary {
  border: none;
  background: #16a34a;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
}
.secondary {
  border: 1px solid #ccc;
  background: white;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
}
.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.item {
  background: white;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.item.soon {
  border-left: 4px solid #d97706;
}
.item.expired {
  border-left: 4px solid #dc2626;
  opacity: 0.85;
}
.info {
  flex: 1;
  cursor: pointer;
}
.name-row {
  display: flex;
  gap: 6px;
  align-items: baseline;
}
.name {
  font-weight: 600;
}
.category {
  font-size: 0.75rem;
  color: #888;
  background: #f0f0f0;
  padding: 1px 6px;
  border-radius: 4px;
}
.meta {
  font-size: 0.8rem;
  color: #777;
  margin-top: 2px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.badge {
  font-size: 0.75rem;
  color: #d97706;
  font-weight: 600;
  white-space: nowrap;
}
.badge.expired {
  color: #dc2626;
}
.delete {
  border: none;
  background: none;
  color: #999;
  font-size: 0.8rem;
}
.empty {
  color: #888;
  text-align: center;
  padding: 24px 0;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
}
.modal {
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
}
.modal h2 {
  margin-top: 0;
  font-size: 1.1rem;
}
.modal form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: #333;
  flex: 1;
}
.modal input,
.modal select {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.95rem;
}
.row {
  display: flex;
  gap: 10px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
