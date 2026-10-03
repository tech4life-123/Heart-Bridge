-- HeartBridge Phase 10: covering indexes for foreign keys and self-service account deletion.

create index if not exists admin_roles_granted_by_idx on public.admin_roles (granted_by);
create index if not exists app_settings_updated_by_idx on public.app_settings (updated_by);
create index if not exists compatibility_answers_question_idx on public.compatibility_answers (question_id);
create index if not exists passes_target_idx on public.passes (target_id);
create index if not exists profiles_community_idx on public.profiles (community_id);
create index if not exists reports_match_idx on public.reports (match_id);
create index if not exists reports_resolved_by_idx on public.reports (resolved_by);
create index if not exists saved_profiles_saved_idx on public.saved_profiles (saved_id);
create index if not exists user_warnings_issued_by_idx on public.user_warnings (issued_by);
