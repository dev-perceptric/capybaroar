-- capybaroar: triggers. Built from the running database. Unused objects were removed in the move (see README.md).
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- event trigger: issue_graphql_placeholder
CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();

ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

-- event trigger: issue_pg_cron_access
CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();

ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

-- event trigger: issue_pg_graphql_access
CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();

ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

-- event trigger: issue_pg_net_access
CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();

ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

-- event trigger: pgrst_ddl_watch
CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();

ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

-- event trigger: pgrst_drop_watch
CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();

ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict NHAca8SxgvVMrN7rOYizNY6sKzwbLCejKCXk3NWvmSXz6gYjp7IotDHlWq3cbuy
