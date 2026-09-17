insert into public.subscription_plans (
  name, slug, interval, price_amount, currency
)
values
  ('Monthly', 'monthly', 'monthly', 999, 'INR'),
  ('Yearly', 'yearly', 'yearly', 9999, 'INR')
on conflict (interval)
do update set
  name = excluded.name,
  slug = excluded.slug,
  price_amount = excluded.price_amount,
  currency = excluded.currency;

insert into public.charities (
  name, slug, description, featured, is_active
)
values
  (
    'Green Fairways Foundation',
    'green-fairways-foundation',
    'Supports local environmental projects and greener community spaces.',
    true,
    true
  ),
  (
    'Youth Sports Access',
    'youth-sports-access',
    'Helps young people access sports, coaching and community programs.',
    true,
    true
  ),
  (
    'Community Food Network',
    'community-food-network',
    'Supports food programs and local communities facing food insecurity.',
    false,
    true
  ),
  (
    'Future Education Fund',
    'future-education-fund',
    'Provides learning resources and educational support for young people.',
    false,
    true
  ),
  (
    'Animal Welfare Collective',
    'animal-welfare-collective',
    'Supports rescue, care and welfare programs for animals.',
    false,
    true
  )
on conflict (slug)
do update set
  description = excluded.description,
  featured = excluded.featured,
  is_active = excluded.is_active;