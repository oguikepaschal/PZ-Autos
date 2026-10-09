-- car-images accepts compressed JPEGs only, 2 MB max. The client compresses to
-- 1.5 MB (see lib/supabase/storage.ts); the extra headroom is a safeguard, not a target.
-- Restrictions apply to uploads only; existing objects stay readable.
update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg']
where id = 'car-images';
