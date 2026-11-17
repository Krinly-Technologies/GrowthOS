-- LOCAL DEVELOPMENT ONLY. Runs on `supabase start` / `supabase db reset` against the local
-- stack and is never pushed to hosted projects. Hosted runtime-role passwords are set
-- out-of-band from the secret manager.
alter role krinly_app with login password 'krinly_app_local';
alter role krinly_worker with login password 'krinly_worker_local';
