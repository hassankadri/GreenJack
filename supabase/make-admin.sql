-- Make a specific user an administrator.
-- Replace the email below with your test account email.

update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'amaandud19@gmail.com'
);