const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || process.env.SUPABASE_VIDEOS_BUCKET || 'videos';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    '❌ متغیرهای SUPABASE_URL و SUPABASE_SERVICE_KEY تنظیم نشده‌اند. ' +
      'این‌ها را در Variables پروژه‌ی Railway (یا فایل .env) اضافه کنید.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ---------- Projects (نمونه‌کارها: ویدیو یا عکس) ----------

async function readProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

function detectMediaType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  throw new Error('نوع فایل پشتیبانی نمی‌شود');
}

// آپلود فایل (ویدیو یا عکس) به Supabase Storage و برگرداندن URL عمومی آن
async function uploadMedia(buffer, originalName, mimetype) {
  const ext = (originalName.match(/\.[a-zA-Z0-9]+$/) || ['.bin'])[0];
  const path = `${Date.now()}-${crypto.randomUUID()}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, buffer, { contentType: mimetype, upsert: false });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

async function deleteMedia(path) {
  if (!path) return;
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}

async function createProject({ title, description, linkUrl, fileBuffer, fileOriginalName, fileMimetype }) {
  const mediaType = detectMediaType(fileMimetype);
  const { path, url } = await uploadMedia(fileBuffer, fileOriginalName, fileMimetype);

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title,
      description: description || '',
      video_path: path,
      video_url: url,
      media_type: mediaType,
      link_url: linkUrl || null,
    })
    .select()
    .single();

  if (error) {
    await deleteMedia(path);
    throw error;
  }
  return data;
}

async function deleteProject(id) {
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchError || !project) return null;

  const { error: deleteError } = await supabase.from('projects').delete().eq('id', id);
  if (deleteError) throw deleteError;

  await deleteMedia(project.video_path);
  return project;
}

// ---------- Orders (سفارش‌ها) ----------

async function readOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function createOrder(order) {
  const { data, error } = await supabase.from('orders').insert(order).select().single();
  if (error) throw error;
  return data;
}

module.exports = {
  supabase,
  readProjects,
  createProject,
  deleteProject,
  readOrders,
  createOrder,
};
