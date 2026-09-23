<script setup lang="ts">
import type { ShoppingListItem } from '~/composables/useShoppingList'

const { items, fetchItems, addItem, toggleChecked, removeItem, confirmPurchase } = useShoppingList()
const { suggestions, refresh: refreshSuggestions } = useSuggestions()

onMounted(async () => {
  await fetchItems()
  await refreshSuggestions()
})

const newItemName = ref('')
const newItemQuantity = ref(1)

async function submitAdd() {
  if (!newItemName.value.trim()) return
  await addItem(newItemName.value.trim(), newItemQuantity.value || 1)
  newItemName.value = ''
  newItemQuantity.value = 1
  await refreshSuggestions()
}

async function addSuggestion(name: string) {
  await addItem(name, 1, '個', 'suggested')
  await refreshSuggestions()
}

const purchasingItem = ref<ShoppingListItem | null>(null)
const purchaseForm = reactive({
  expiry_date: '',
  expiry_type: '賞味期限' as '賞味期限' | '消費期限',
  location: '',
  price: null as number | null,
  store: ''
})

function openPurchaseForm(item: ShoppingListItem) {
  purchasingItem.value = item
  purchaseForm.expiry_date = ''
  purchaseForm.expiry_type = '賞味期限'
  purchaseForm.location = ''
  purchaseForm.price = null
  purchaseForm.store = ''
}

async function submitPurchase() {
  if (!purchasingItem.value) return
  await confirmPurchase(purchasingItem.value, {
    expiry_date: purchaseForm.expiry_date || null,
    expiry_type: purchaseForm.expiry_type,
    location: purchaseForm.location || null,
    price: purchaseForm.price,
    store: purchaseForm.store || null
  })
  purchasingItem.value = null
  await refreshSuggestions()
}

const uncheckedItems = computed(() => items.value.filter((i) => !i.checked))
</script>

<template>
  <div class="shopping">
    <h1>買い物リスト</h1>

    <form class="add-form" @submit.prevent="submitAdd">
      <input v-model="newItemName" type="text" placeholder="商品名を入力" />
      <input v-model.number="newItemQuantity" type="number" min="1" style="width: 60px" />
      <button type="submit" class="primary">追加</button>
    </form>

    <section v-if="suggestions.length" class="suggestions">
      <h2>💡 追加提案</h2>
      <ul>
        <li v-for="s in suggestions" :key="s.key">
          <div>
            <span class="name">{{ s.name }}</span>
            <small>{{ s.reason }}</small>
          </div>
          <button class="add-btn" @click="addSuggestion(s.name)">追加</button>
        </li>
      </ul>
    </section>

    <ul class="items">
      <li v-for="item in uncheckedItems" :key="item.id" class="item">
        <label class="check-label">
          <input type="checkbox" :checked="item.checked" @change="openPurchaseForm(item)" />
          <span class="name">{{ item.name }}</span>
          <span class="qty">{{ item.quantity }}{{ item.unit }}</span>
          <span v-if="item.source === 'suggested'" class="tag">提案</span>
        </label>
        <button class="delete" @click="removeItem(item.id)">削除</button>
      </li>
      <li v-if="!uncheckedItems.length" class="empty">リストは空です</li>
    </ul>

    <div v-if="purchasingItem" class="modal-backdrop" @click.self="purchasingItem = null">
      <div class="modal">
        <h2>{{ purchasingItem.name }} を購入済みにする</h2>
        <p class="hint">在庫に追加し、購入履歴に記録します</p>
        <form @submit.prevent="submitPurchase">
          <div class="row">
            <label>
              期限種別
              <select v-model="purchaseForm.expiry_type">
                <option value="賞味期限">賞味期限</option>
                <option value="消費期限">消費期限</option>
              </select>
            </label>
            <label>期限日（任意）<input v-model="purchaseForm.expiry_date" type="date" /></label>
          </div>
          <label>保管場所（任意）<input v-model="purchaseForm.location" type="text" placeholder="例：冷蔵庫" /></label>
          <div class="row">
            <label>価格（任意）<input v-model.number="purchaseForm.price" type="number" min="0" /></label>
            <label>店舗（任意）<input v-model="purchaseForm.store" type="text" /></label>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary" @click="purchasingItem = null">キャンセル</button>
            <button type="submit" class="primary">在庫に追加</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shopping {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
h1 {
  font-size: 1.3rem;
  margin: 0;
}
.add-form {
  display: flex;
  gap: 8px;
}
.add-form input[type='text'] {
  flex: 1;
}
.add-form input,
select {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.95rem;
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
.suggestions {
  background: #fffbea;
  border-radius: 12px;
  padding: 12px 16px;
}
.suggestions h2 {
  font-size: 0.95rem;
  margin: 0 0 8px;
}
.suggestions ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.suggestions li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.suggestions small {
  display: block;
  color: #888;
  font-size: 0.75rem;
}
.add-btn {
  border: none;
  background: #16a34a;
  color: white;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.check-label {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.check-label input {
  width: 20px;
  height: 20px;
}
.name {
  font-weight: 600;
}
.qty {
  color: #888;
  font-size: 0.85rem;
}
.tag {
  font-size: 0.7rem;
  background: #fef3c7;
  color: #92400e;
  padding: 1px 6px;
  border-radius: 4px;
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
  margin: 0 0 4px;
  font-size: 1.1rem;
}
.hint {
  color: #888;
  font-size: 0.85rem;
  margin: 0 0 12px;
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
