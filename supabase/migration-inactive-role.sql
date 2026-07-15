-- Add the INACTIVE role: roster members kept on the books for the record but
-- who cannot log in (the app blocks sign-in for INACTIVE). Widens the role_tag
-- CHECK on both profiles and invites.

alter table public.profiles drop constraint if exists profiles_role_tag_check;
alter table public.profiles add constraint profiles_role_tag_check
  check (role_tag in ('MOC','GRAND_ROBIN','CHAMP','ANGLER','JAFNG','INACTIVE'));

alter table public.invites drop constraint if exists invites_role_tag_check;
alter table public.invites add constraint invites_role_tag_check
  check (role_tag in ('MOC','GRAND_ROBIN','CHAMP','ANGLER','JAFNG','INACTIVE'));
