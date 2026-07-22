-- Expose the preceding direct-Ask RPC to the local/PostgREST schema cache.
-- Function DDL does not automatically refresh that cache in every environment.
notify pgrst, 'reload schema';
