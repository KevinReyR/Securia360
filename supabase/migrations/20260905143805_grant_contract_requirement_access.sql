-- RLS policies for the restricted contractor portal call this SECURITY DEFINER
-- helper.  It performs its own actor, contract and tenant checks; authenticated
-- users need EXECUTE for Postgres to evaluate the policy.
grant execute on function private.can_access_contract_requirement(uuid) to authenticated;
revoke execute on function private.can_access_contract_requirement(uuid) from anon;
notify pgrst, 'reload schema';
