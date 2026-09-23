export function useHousehold() {
  const householdId = useCookie<string | null>('household_id', { default: () => null })
  const householdName = useCookie<string | null>('household_name', { default: () => null })
  const inviteCode = useCookie<string | null>('invite_code', { default: () => null })
  const memberName = useCookie<string | null>('member_name', { default: () => null })

  const supabase = useSupabaseClient()

  async function createHousehold(name: string, displayName: string) {
    const { data, error } = await supabase
      .rpc('create_household', { household_name: name, member_name: displayName })
      .single<{ id: string; invite_code: string }>()

    if (error) throw error

    householdId.value = data.id
    householdName.value = name
    inviteCode.value = data.invite_code
    memberName.value = displayName
  }

  async function joinHousehold(code: string, displayName: string) {
    const { data, error } = await supabase
      .rpc('join_household', { code, member_name: displayName })
      .single<{ id: string; name: string }>()

    if (error) throw error

    householdId.value = data.id
    householdName.value = data.name
    inviteCode.value = code.toUpperCase()
    memberName.value = displayName
  }

  function leaveHousehold() {
    householdId.value = null
    householdName.value = null
    inviteCode.value = null
    memberName.value = null
  }

  return { householdId, householdName, inviteCode, memberName, createHousehold, joinHousehold, leaveHousehold }
}
