-- Enable Supabase Realtime for the messages table.
--
-- The supabase_realtime publication is what postgres_changes subscriptions
-- listen to via WAL. Tables aren't in it by default — they have to be added
-- explicitly. Once messages is in the publication, a client can subscribe to
-- INSERT events filtered by `thread_id=eq.<id>` and the row appears in their
-- channel callback.
--
-- RLS still applies to the broadcast: the realtime worker re-checks the
-- subscriber's policies against each row before delivering, so participants
-- only see messages from threads they belong to. Same security as a SELECT.
--
-- We don't currently need REPLICA IDENTITY FULL — postgres_changes INSERT
-- events ship the new row by default. If we later want UPDATE events with
-- the previous row attached (e.g. live read-receipt updates), revisit this.

alter publication supabase_realtime add table messages;
