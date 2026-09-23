<script setup lang="ts">
const { items: inventoryItems, fetchItems: fetchInventory, daysUntilExpiry } = useInventory()
const { items: shoppingItems, fetchItems: fetchShoppingList, addItem } = useShoppingList()
const { suggestions, refresh: refreshSuggestions } = useSuggestions()
const { householdName } = useHousehold()

onMounted(async () => {
  await Promise.all([fetchInventory(), fetchShoppingList()])
  await refreshSuggestions()
})

const expiringSoon = computed(() =>
  inventoryItems.value
    .filter((i) => {
      const d = daysUntilExpiry(i)
      return d !== null && d <= 3
    })
    .sort((a, b) => (a.expiry_date! < b.expiry_date! ? -1 : 1))
)

const uncheckedCount = computed(() => shoppingItems.value.filter((i) => !i.checked).length)

async function addSuggestion(name: string) {
  await addItem(name)
  await refreshSuggestions()
}
</script>

<template>
  <div class="home">
    <h1>{{ householdName || 'ホーム' }}</h1>

    <section class="card" v-if="expiringSoon.length">
      <h2>⚠️ もうすぐ期限が切れます</h2>
      <ul class="list">
        <li v-for="item in expiringSoon" :key="item.id">
          <span class="name">{{ item.name }}</span>
          <span class="days" :class="{ danger: (daysUntilExpiry(item) ?? 0) <= 0 }">
            {{ (daysUntilExpiry(item) ?? 0) <= 0 ? '期限切れ' : `あと${daysUntilExpiry(item)}日` }}
          </span>
        </li>
      </ul>
      <NuxtLink to="/inventory" class="link">在庫一覧を見る →</NuxtLink>
    </section>

    <section class="card">
      <h2>🛒 買い物リスト</h2>
      <p>未購入 {{ uncheckedCount }} 件</p>
      <NuxtLink to="/shopping-list" class="link">リストを見る →</NuxtLink>
    </section>

    <section class="card" v-if="suggestions.length">
      <h2>💡 追加提案</h2>
      <ul class="list">
        <li v-for="s in suggestions" :key="s.key">
          <div>
            <span class="name">{{ s.name }}</span>
            <small class="reason">{{ s.reason }}</small>
          </div>
          <button class="add-btn" @click="addSuggestion(s.name)">追加</button>
        </li>
      </ul>
    </section>

    <section class="card" v-if="!expiringSoon.length && !suggestions.length">
      <p class="empty">今のところ気になる項目はありません 👍</p>
    </section>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
h1 {
  font-size: 1.3rem;
  margin: 4px 0;
}
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.card h2 {
  font-size: 1rem;
  margin: 0 0 10px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.name {
  font-weight: 600;
}
.reason {
  display: block;
  color: #888;
  font-size: 0.8rem;
}
.days {
  color: #d97706;
  font-size: 0.85rem;
  font-weight: 600;
}
.days.danger {
  color: #dc2626;
}
.link {
  display: inline-block;
  margin-top: 10px;
  color: #16a34a;
  font-size: 0.9rem;
  text-decoration: none;
}
.add-btn {
  border: none;
  background: #16a34a;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
}
.empty {
  color: #888;
  margin: 0;
}
</style>
