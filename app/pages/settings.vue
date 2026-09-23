<script setup lang="ts">
const { householdId, householdName, inviteCode, memberName, leaveHousehold } = useHousehold()
const { isSupported, isSubscribed, checkSubscription, subscribe, unsubscribe } = usePush()
const supabase = useSupabaseClient()

interface Member {
  display_name: string
  joined_at: string
}

const members = ref<Member[]>([])
const copied = ref(false)
const pushError = ref('')

onMounted(async () => {
  await checkSubscription()
  if (householdId.value) {
    const { data } = await supabase
      .from('household_members')
      .select('display_name, joined_at')
      .eq('household_id', householdId.value)
      .order('joined_at', { ascending: true })
    members.value = data ?? []
  }
})

async function copyInviteCode() {
  if (!inviteCode.value) return
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // クリップボードAPIが使えない環境では無視
  }
}

async function togglePush() {
  pushError.value = ''
  try {
    if (isSubscribed.value) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  } catch (e: any) {
    pushError.value = e?.message || '通知の設定に失敗しました'
  }
}

async function handleLeave() {
  if (!confirm('このグループから離れますか？')) return
  leaveHousehold()
  await navigateTo('/join')
}

async function handleSignOut() {
  if (!confirm('ログアウトしますか？')) return
  leaveHousehold()
  await supabase.auth.signOut()
  await navigateTo('/join')
}
</script>

<template>
  <div class="settings">
    <h1>設定</h1>

    <section class="card">
      <h2>{{ householdName }}</h2>
      <p class="label">招待コード</p>
      <div class="invite-row">
        <span class="code">{{ inviteCode }}</span>
        <button class="secondary" @click="copyInviteCode">{{ copied ? 'コピーしました' : 'コピー' }}</button>
      </div>
      <p class="hint">このコードを家族に共有すると、同じグループに参加できます</p>
    </section>

    <section class="card">
      <h2>メンバー（{{ members.length }}人）</h2>
      <ul class="member-list">
        <li v-for="(m, i) in members" :key="i">
          {{ m.display_name }}
          <span v-if="m.display_name === memberName" class="you">（あなた）</span>
        </li>
      </ul>
    </section>

    <section class="card">
      <h2>通知</h2>
      <p v-if="!isSupported" class="hint">この端末・ブラウザはプッシュ通知に対応していません</p>
      <template v-else>
        <label class="switch-row">
          <span>期限切れ間近の通知を受け取る</span>
          <input type="checkbox" :checked="isSubscribed" @change="togglePush" />
        </label>
        <p class="hint">
          iPhoneをお使いの場合は、Safariでこのアプリを開き「共有」→「ホーム画面に追加」した上でオンにしてください
        </p>
        <p v-if="pushError" class="error">{{ pushError }}</p>
      </template>
    </section>

    <button class="leave" @click="handleLeave">グループから離れる</button>
    <button class="leave" @click="handleSignOut">ログアウト</button>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
h1 {
  font-size: 1.3rem;
  margin: 0;
}
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.card h2 {
  font-size: 1rem;
  margin: 0 0 10px;
}
.label {
  font-size: 0.8rem;
  color: #888;
  margin: 0 0 4px;
}
.invite-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.code {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 2px;
}
.secondary {
  border: 1px solid #ccc;
  background: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
}
.hint {
  color: #888;
  font-size: 0.8rem;
  margin: 8px 0 0;
}
.member-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.you {
  color: #16a34a;
  font-size: 0.85rem;
}
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.switch-row input {
  width: 20px;
  height: 20px;
}
.error {
  color: #dc2626;
  font-size: 0.85rem;
}
.leave {
  border: none;
  background: none;
  color: #dc2626;
  padding: 12px;
  font-size: 0.9rem;
}
</style>
