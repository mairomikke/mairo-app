-- Seed data for development
-- Note: Run after schema.sql
-- Passwords are handled by Auth, these are just profile entries

-- Categories reference
-- 'sports', 'arts', 'music', 'academic', 'technology', 'outdoor', 'cooking', 'language'

INSERT INTO public.activities (
  id, organization_id, title, description, category, price, capacity, location,
  tags, appeal_points, status
) VALUES
  (
    uuid_generate_v4(),
    (SELECT id FROM public.organizations LIMIT 1),
    'Introduction to Programming',
    'Learn the fundamentals of programming with Python. Perfect for beginners aged 10-18.',
    'technology',
    5000,
    20,
    'Tokyo, Shibuya',
    ARRAY['programming', 'python', 'beginners', 'coding'],
    ARRAY['Hands-on projects', 'Expert instructors', 'Small class size'],
    'published'
  );