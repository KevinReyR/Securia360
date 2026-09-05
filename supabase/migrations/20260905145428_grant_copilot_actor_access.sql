-- Policies and authenticated RPC wrappers may invoke this SECURITY DEFINER
-- helper while evaluating the actor's tenant permission.
grant execute on function private.copilot_actor_can(uuid, text) to authenticated;
revoke execute on function private.copilot_actor_can(uuid, text) from anon;
notify pgrst, 'reload schema';
