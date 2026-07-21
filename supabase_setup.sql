-- جدول نمونه‌کارها (پروژه‌ها)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  video_path text,
  video_url text not null,
  media_type text default 'video',
  link_url text,
  created_at timestamptz default now()
);

-- جدول سفارش‌ها
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  service text not null,
  budget text default '',
  message text not null,
  created_at timestamptz default now()
);

-- اگر جدول projects را قبلاً بدون این دو ستون ساخته بودید، این دو خط آن‌ها را اضافه می‌کند
-- (اگر از همان ابتدا با کوئری بالا ساخته باشید، این دو خط بی‌اثرند و ارور نمی‌دهند)
alter table projects add column if not exists media_type text default 'video';
alter table projects add column if not exists link_url text;
