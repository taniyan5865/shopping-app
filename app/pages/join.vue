<script setup lang="ts">
const { createHousehold, joinHousehold } = useHousehold()

const mode = ref<'create' | 'join'>('create')
const householdName = ref('')
const inviteCodeInput = ref('')
const displayName = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function submit() {
  errorMessage.value = ''
  if (!displayName.value.trim()) {
    errorMessage.value = 'あなたの名前を入力してください'
    return
  }

  loading.value = true
  try {
    if (mode.value === 'create') {
      if (!householdName.value.trim()) {
        errorMessage.value = '家族・グループ名を入力してください'
        return
      }
      await createHousehold(householdName.value.trim(), displayName.value.trim())
    } else {
      if (!inviteCodeInput.value.trim()) {
        errorMessage.value = '招待コードを入力してください'
        return
      }
      await joinHousehold(inviteCodeInput.value.trim(), displayName.value.trim())
    }
    await navigateTo('/')
  } catch (e: any) {
    errorMessage.value = e?.message || '処理に失敗しました'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="join-page">
    <h1>買い物管理アプリ</h1>
    <p class="lead">在庫・消費期限・購入リストを家族で共有できます</p>

    <div class="tabs">
      <button :class="{ active: mode === 'create' }" @click="mode = 'create'">新しく始める</button>
      <button :class="{ active: mode === 'join' }" @click="mode = 'join'">招待コードで参加</button>
    </div>

    <form class="form" @submit.prevent="submit">
      <label>
        あなたの名前
        <input v-model="displayName" type="text" placeholder="例：たろう" />
      </label>

      <label v-if="mode === 'create'">
        家族・グループ名
        <input v-model="householdName" type="text" placeholder="例：わが家" />
      </label>

      <label v-else>
        招待コード
        <input v-model="inviteCodeInput" type="text" maxlength="6" placeholder="例：AB12CD" style="text-transform: uppercase" />
      </label>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <button type="submit" class="submit" :disabled="loading">
        {{ loading ? '処理中...' : mode === 'create' ? '作成する' : '参加する' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.join-page {
  max-width: 420px;
  margin: 0 auto;
  padding: 32px 20px;
}
h1 {
  font-size: 1.5rem;
  margin-bottom: 4px;
}
.lead {
  color: #666;
  margin-bottom: 24px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.tabs button {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
}
.tabs button.active {
  background: #16a34a;
  color: white;
  border-color: #16a34a;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: #333;
}
input {
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
}
.error {
  color: #dc2626;
  font-size: 0.9rem;
  margin: 0;
}
.submit {
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #16a34a;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}
.submit:disabled {
  opacity: 0.6;
}
</style>
