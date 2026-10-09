-- WhatsApp tap recording is removed: the admin no longer shows the count and
-- /api/whatsapp-click is gone. The table only held test taps. Dropping it also
-- drops its owner_select policy, index and foreign key to cars.
drop table public.whatsapp_clicks;
