-- Preserve existing image records and admin-only write policies.
alter table public.home_hero_images
  drop constraint if exists home_hero_images_slot_check;
alter table public.home_hero_images
  add constraint home_hero_images_slot_check check (slot between 1 and 16);
