-- HeartBridge Phase 8 (part 1): extra staff roles. 'admin' stays the Super Admin.
-- Separate migration because new enum values cannot be used in the transaction that adds them.
alter type public.admin_role add value if not exists 'support';
alter type public.admin_role add value if not exists 'finance';
