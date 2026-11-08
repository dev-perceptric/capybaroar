-- capybaroar: security. Built from the running database. Unused objects were removed in the move (see README.md).
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

-- row security: agent_chats
ALTER TABLE public.agent_chats ENABLE ROW LEVEL SECURITY;

-- row security: agent_messages
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- row security: alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- row security: api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- row security: app_errors
ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;

-- row security: bio_pages
ALTER TABLE public.bio_pages ENABLE ROW LEVEL SECURITY;

-- row security: bio_views
ALTER TABLE public.bio_views ENABLE ROW LEVEL SECURITY;

-- row security: bio_visits
ALTER TABLE public.bio_visits ENABLE ROW LEVEL SECURITY;

-- row security: brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- row security: channel_groups
ALTER TABLE public.channel_groups ENABLE ROW LEVEL SECURITY;

-- row security: channel_secrets
ALTER TABLE public.channel_secrets ENABLE ROW LEVEL SECURITY;

-- row security: channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- row security: credit_entries
ALTER TABLE public.credit_entries ENABLE ROW LEVEL SECURITY;

-- row security: evergreen
ALTER TABLE public.evergreen ENABLE ROW LEVEL SECURITY;

-- row security: feeds
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;

-- row security: generations
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- row security: inbox_items
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;

-- row security: inbox_state
ALTER TABLE public.inbox_state ENABLE ROW LEVEL SECURITY;

-- row security: invites
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- row security: jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- row security: links
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- row security: media
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- row security: members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- row security: metrics
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- row security: oauth_states
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- row security: post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- row security: post_metrics
ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;

-- row security: post_targets
ALTER TABLE public.post_targets ENABLE ROW LEVEL SECURITY;

-- row security: posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- policy: bio_pages read_bio_pages
CREATE POLICY read_bio_pages ON public.bio_pages FOR SELECT TO authenticated USING (public.sees_brand(workspace_id, brand_id));

-- policy: bio_views read_bio_views
CREATE POLICY read_bio_views ON public.bio_views FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.bio_pages p
  WHERE ((p.id = bio_views.page_id) AND public.sees_brand(p.workspace_id, p.brand_id)))));

-- policy: brands read_brands
CREATE POLICY read_brands ON public.brands FOR SELECT TO authenticated USING (public.sees_brand(workspace_id, id));

-- policy: channel_groups read_channel_groups
CREATE POLICY read_channel_groups ON public.channel_groups FOR SELECT TO authenticated USING (public.is_member(workspace_id));

-- policy: channels read_channels
CREATE POLICY read_channels ON public.channels FOR SELECT TO authenticated USING (public.sees_brand(workspace_id, brand_id));

-- policy: agent_chats read_chats
CREATE POLICY read_chats ON public.agent_chats FOR SELECT TO authenticated USING ((user_id = auth.uid()));

-- policy: evergreen read_evergreen
CREATE POLICY read_evergreen ON public.evergreen FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.posts p
  WHERE ((p.id = evergreen.post_id) AND public.sees_brand(p.workspace_id, p.brand_id)))));

-- policy: feeds read_feeds
CREATE POLICY read_feeds ON public.feeds FOR SELECT TO authenticated USING (public.sees_brand(workspace_id, brand_id));

-- policy: generations read_generations
CREATE POLICY read_generations ON public.generations FOR SELECT TO authenticated USING (public.is_member(workspace_id));

-- policy: inbox_items read_inbox_items
CREATE POLICY read_inbox_items ON public.inbox_items FOR SELECT TO authenticated USING (public.is_member(workspace_id));

-- policy: links read_links
CREATE POLICY read_links ON public.links FOR SELECT TO authenticated USING (public.is_member(workspace_id));

-- policy: media read_media
CREATE POLICY read_media ON public.media FOR SELECT TO authenticated USING (public.is_member(workspace_id));

-- policy: members read_members
CREATE POLICY read_members ON public.members FOR SELECT TO authenticated USING (public.is_member(workspace_id));

-- policy: agent_messages read_messages
CREATE POLICY read_messages ON public.agent_messages FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.agent_chats c
  WHERE ((c.id = agent_messages.chat_id) AND (c.user_id = auth.uid())))));

-- policy: metrics read_metrics
CREATE POLICY read_metrics ON public.metrics FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.channels c
  WHERE ((c.id = metrics.channel_id) AND public.sees_brand(c.workspace_id, c.brand_id)))));

-- policy: post_comments read_post_comments
CREATE POLICY read_post_comments ON public.post_comments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.posts p
  WHERE ((p.id = post_comments.post_id) AND public.sees_brand(p.workspace_id, p.brand_id)))));

-- policy: post_metrics read_post_metrics
CREATE POLICY read_post_metrics ON public.post_metrics FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.channels c
  WHERE ((c.id = post_metrics.channel_id) AND public.sees_brand(c.workspace_id, c.brand_id)))));

-- policy: posts read_posts
CREATE POLICY read_posts ON public.posts FOR SELECT TO authenticated USING (public.sees_brand(workspace_id, brand_id));

-- policy: reports read_reports
CREATE POLICY read_reports ON public.reports FOR SELECT TO authenticated USING (public.sees_brand(workspace_id, brand_id));

-- policy: snippets read_snippets
CREATE POLICY read_snippets ON public.snippets FOR SELECT TO authenticated USING (public.is_member(workspace_id));

-- policy: post_targets read_targets
CREATE POLICY read_targets ON public.post_targets FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.posts p
  WHERE ((p.id = post_targets.post_id) AND public.sees_brand(p.workspace_id, p.brand_id)))));

-- policy: workspaces read_ws
CREATE POLICY read_ws ON public.workspaces FOR SELECT TO authenticated USING (public.is_member(id));

-- row security: reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- row security: review_links
ALTER TABLE public.review_links ENABLE ROW LEVEL SECURITY;

-- row security: runner_beats
ALTER TABLE public.runner_beats ENABLE ROW LEVEL SECURITY;

-- row security: snippets
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

-- row security: upkeep_runs
ALTER TABLE public.upkeep_runs ENABLE ROW LEVEL SECURITY;

-- row security: webhook_deliveries
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- row security: webhooks
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- row security: workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- acl: FUNCTION pg_reload_conf()
GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;

-- acl: FUNCTION attach_generation(g uuid)
REVOKE ALL ON FUNCTION public.attach_generation(g uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.attach_generation(g uuid) TO anon;
GRANT ALL ON FUNCTION public.attach_generation(g uuid) TO authenticated;
GRANT ALL ON FUNCTION public.attach_generation(g uuid) TO service_role;

-- acl: FUNCTION bio_click(p_page uuid, p_item text)
REVOKE ALL ON FUNCTION public.bio_click(p_page uuid, p_item text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.bio_click(p_page uuid, p_item text) TO anon;
GRANT ALL ON FUNCTION public.bio_click(p_page uuid, p_item text) TO authenticated;
GRANT ALL ON FUNCTION public.bio_click(p_page uuid, p_item text) TO service_role;

-- acl: FUNCTION bio_view(p_page uuid, p_visitor text, p_ref text)
REVOKE ALL ON FUNCTION public.bio_view(p_page uuid, p_visitor text, p_ref text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.bio_view(p_page uuid, p_visitor text, p_ref text) TO anon;
GRANT ALL ON FUNCTION public.bio_view(p_page uuid, p_visitor text, p_ref text) TO authenticated;
GRANT ALL ON FUNCTION public.bio_view(p_page uuid, p_visitor text, p_ref text) TO service_role;

-- acl: TABLE generations
GRANT ALL ON TABLE public.generations TO anon;
GRANT ALL ON TABLE public.generations TO authenticated;
GRANT ALL ON TABLE public.generations TO service_role;

-- acl: FUNCTION claim_generations(worker text, n integer)
REVOKE ALL ON FUNCTION public.claim_generations(worker text, n integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.claim_generations(worker text, n integer) TO anon;
GRANT ALL ON FUNCTION public.claim_generations(worker text, n integer) TO authenticated;
GRANT ALL ON FUNCTION public.claim_generations(worker text, n integer) TO service_role;

-- acl: TABLE jobs
GRANT ALL ON TABLE public.jobs TO anon;
GRANT ALL ON TABLE public.jobs TO authenticated;
GRANT ALL ON TABLE public.jobs TO service_role;

-- acl: FUNCTION claim_inbox_jobs(worker text, n integer)
REVOKE ALL ON FUNCTION public.claim_inbox_jobs(worker text, n integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.claim_inbox_jobs(worker text, n integer) TO anon;
GRANT ALL ON FUNCTION public.claim_inbox_jobs(worker text, n integer) TO authenticated;
GRANT ALL ON FUNCTION public.claim_inbox_jobs(worker text, n integer) TO service_role;

-- acl: FUNCTION claim_jobs(worker text, n integer)
REVOKE ALL ON FUNCTION public.claim_jobs(worker text, n integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.claim_jobs(worker text, n integer) TO anon;
GRANT ALL ON FUNCTION public.claim_jobs(worker text, n integer) TO authenticated;
GRANT ALL ON FUNCTION public.claim_jobs(worker text, n integer) TO service_role;

-- acl: TABLE webhook_deliveries
GRANT ALL ON TABLE public.webhook_deliveries TO anon;
GRANT ALL ON TABLE public.webhook_deliveries TO authenticated;
GRANT ALL ON TABLE public.webhook_deliveries TO service_role;

-- acl: FUNCTION claim_webhook_deliveries(worker text, n integer)
REVOKE ALL ON FUNCTION public.claim_webhook_deliveries(worker text, n integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.claim_webhook_deliveries(worker text, n integer) TO anon;
GRANT ALL ON FUNCTION public.claim_webhook_deliveries(worker text, n integer) TO authenticated;
GRANT ALL ON FUNCTION public.claim_webhook_deliveries(worker text, n integer) TO service_role;

-- acl: FUNCTION credit_brand_used(ws uuid, p_period text)
REVOKE ALL ON FUNCTION public.credit_brand_used(ws uuid, p_period text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.credit_brand_used(ws uuid, p_period text) TO service_role;

-- acl: FUNCTION credit_grant(ws uuid, p_key text, p_bucket text, p_period text, p_amount integer, p_expires timestamp with time zone, p_note text)
REVOKE ALL ON FUNCTION public.credit_grant(ws uuid, p_key text, p_bucket text, p_period text, p_amount integer, p_expires timestamp with time zone, p_note text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.credit_grant(ws uuid, p_key text, p_bucket text, p_period text, p_amount integer, p_expires timestamp with time zone, p_note text) TO service_role;

-- acl: FUNCTION credit_left(ws uuid, p_period text)
REVOKE ALL ON FUNCTION public.credit_left(ws uuid, p_period text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.credit_left(ws uuid, p_period text) TO service_role;

-- acl: FUNCTION credit_lock(ws uuid)
REVOKE ALL ON FUNCTION public.credit_lock(ws uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.credit_lock(ws uuid) TO service_role;

-- acl: FUNCTION credit_release(ws uuid, p_key text)
REVOKE ALL ON FUNCTION public.credit_release(ws uuid, p_key text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.credit_release(ws uuid, p_key text) TO service_role;

-- acl: FUNCTION credit_settle(ws uuid, p_key text, p_amount integer, p_period text, p_post uuid)
REVOKE ALL ON FUNCTION public.credit_settle(ws uuid, p_key text, p_amount integer, p_period text, p_post uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.credit_settle(ws uuid, p_key text, p_amount integer, p_period text, p_post uuid) TO service_role;

-- acl: FUNCTION credit_stale_holds(age interval, n integer)
REVOKE ALL ON FUNCTION public.credit_stale_holds(age interval, n integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.credit_stale_holds(age interval, n integer) TO service_role;

-- acl: FUNCTION credit_take(ws uuid, p_key text, p_kind text, p_seq integer, p_amount integer, p_period text, p_partial boolean, p_brand uuid, p_user uuid, p_tool text, p_model text, p_post uuid, p_note text)
REVOKE ALL ON FUNCTION public.credit_take(ws uuid, p_key text, p_kind text, p_seq integer, p_amount integer, p_period text, p_partial boolean, p_brand uuid, p_user uuid, p_tool text, p_model text, p_post uuid, p_note text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.credit_take(ws uuid, p_key text, p_kind text, p_seq integer, p_amount integer, p_period text, p_partial boolean, p_brand uuid, p_user uuid, p_tool text, p_model text, p_post uuid, p_note text) TO service_role;

-- acl: FUNCTION end_turn(job_name text, worker text)
REVOKE ALL ON FUNCTION public.end_turn(job_name text, worker text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.end_turn(job_name text, worker text) TO anon;
GRANT ALL ON FUNCTION public.end_turn(job_name text, worker text) TO authenticated;
GRANT ALL ON FUNCTION public.end_turn(job_name text, worker text) TO service_role;

-- acl: FUNCTION is_member(ws uuid)
GRANT ALL ON FUNCTION public.is_member(ws uuid) TO anon;
GRANT ALL ON FUNCTION public.is_member(ws uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_member(ws uuid) TO service_role;

-- acl: FUNCTION keep_locks(ids bigint[], worker text)
REVOKE ALL ON FUNCTION public.keep_locks(ids bigint[], worker text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.keep_locks(ids bigint[], worker text) TO anon;
GRANT ALL ON FUNCTION public.keep_locks(ids bigint[], worker text) TO authenticated;
GRANT ALL ON FUNCTION public.keep_locks(ids bigint[], worker text) TO service_role;

-- acl: FUNCTION link_click(p_code text)
REVOKE ALL ON FUNCTION public.link_click(p_code text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.link_click(p_code text) TO anon;
GRANT ALL ON FUNCTION public.link_click(p_code text) TO authenticated;
GRANT ALL ON FUNCTION public.link_click(p_code text) TO service_role;

-- acl: FUNCTION link_open(p_code text, p_human boolean)
REVOKE ALL ON FUNCTION public.link_open(p_code text, p_human boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.link_open(p_code text, p_human boolean) TO anon;
GRANT ALL ON FUNCTION public.link_open(p_code text, p_human boolean) TO authenticated;
GRANT ALL ON FUNCTION public.link_open(p_code text, p_human boolean) TO service_role;

-- acl: FUNCTION queue_report(report uuid, seen text, period text, due timestamp with time zone)
REVOKE ALL ON FUNCTION public.queue_report(report uuid, seen text, period text, due timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.queue_report(report uuid, seen text, period text, due timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.queue_report(report uuid, seen text, period text, due timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.queue_report(report uuid, seen text, period text, due timestamp with time zone) TO service_role;

-- acl: FUNCTION record_error(fp text, msg text, trace text, at_route text, at_machine text, mail boolean)
REVOKE ALL ON FUNCTION public.record_error(fp text, msg text, trace text, at_route text, at_machine text, mail boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.record_error(fp text, msg text, trace text, at_route text, at_machine text, mail boolean) TO anon;
GRANT ALL ON FUNCTION public.record_error(fp text, msg text, trace text, at_route text, at_machine text, mail boolean) TO authenticated;
GRANT ALL ON FUNCTION public.record_error(fp text, msg text, trace text, at_route text, at_machine text, mail boolean) TO service_role;

-- acl: FUNCTION sees_brand(ws uuid, brand uuid)
REVOKE ALL ON FUNCTION public.sees_brand(ws uuid, brand uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sees_brand(ws uuid, brand uuid) TO anon;
GRANT ALL ON FUNCTION public.sees_brand(ws uuid, brand uuid) TO authenticated;
GRANT ALL ON FUNCTION public.sees_brand(ws uuid, brand uuid) TO service_role;

-- acl: FUNCTION take_turn(job_name text, every_s integer, lease_s integer, worker text)
REVOKE ALL ON FUNCTION public.take_turn(job_name text, every_s integer, lease_s integer, worker text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.take_turn(job_name text, every_s integer, lease_s integer, worker text) TO anon;
GRANT ALL ON FUNCTION public.take_turn(job_name text, every_s integer, lease_s integer, worker text) TO authenticated;
GRANT ALL ON FUNCTION public.take_turn(job_name text, every_s integer, lease_s integer, worker text) TO service_role;

-- acl: FUNCTION trigger_set_timestamps()
GRANT ALL ON FUNCTION public.trigger_set_timestamps() TO anon;
GRANT ALL ON FUNCTION public.trigger_set_timestamps() TO authenticated;
GRANT ALL ON FUNCTION public.trigger_set_timestamps() TO service_role;

-- acl: TABLE "Comments"
GRANT ALL ON TABLE public."Comments" TO anon;
GRANT ALL ON TABLE public."Comments" TO authenticated;
GRANT ALL ON TABLE public."Comments" TO service_role;

-- acl: TABLE "Credits"
GRANT ALL ON TABLE public."Credits" TO anon;
GRANT ALL ON TABLE public."Credits" TO authenticated;
GRANT ALL ON TABLE public."Credits" TO service_role;

-- acl: TABLE "Customer"
GRANT ALL ON TABLE public."Customer" TO anon;
GRANT ALL ON TABLE public."Customer" TO authenticated;
GRANT ALL ON TABLE public."Customer" TO service_role;

-- acl: TABLE "Errors"
GRANT ALL ON TABLE public."Errors" TO anon;
GRANT ALL ON TABLE public."Errors" TO authenticated;
GRANT ALL ON TABLE public."Errors" TO service_role;

-- acl: TABLE "GitHub"
GRANT ALL ON TABLE public."GitHub" TO anon;
GRANT ALL ON TABLE public."GitHub" TO authenticated;
GRANT ALL ON TABLE public."GitHub" TO service_role;

-- acl: TABLE "Integration"
GRANT ALL ON TABLE public."Integration" TO anon;
GRANT ALL ON TABLE public."Integration" TO authenticated;
GRANT ALL ON TABLE public."Integration" TO service_role;

-- acl: TABLE "Media"
GRANT ALL ON TABLE public."Media" TO anon;
GRANT ALL ON TABLE public."Media" TO authenticated;
GRANT ALL ON TABLE public."Media" TO service_role;

-- acl: TABLE "Mentions"
GRANT ALL ON TABLE public."Mentions" TO anon;
GRANT ALL ON TABLE public."Mentions" TO authenticated;
GRANT ALL ON TABLE public."Mentions" TO service_role;

-- acl: TABLE "Messages"
GRANT ALL ON TABLE public."Messages" TO anon;
GRANT ALL ON TABLE public."Messages" TO authenticated;
GRANT ALL ON TABLE public."Messages" TO service_role;

-- acl: TABLE "Notifications"
GRANT ALL ON TABLE public."Notifications" TO anon;
GRANT ALL ON TABLE public."Notifications" TO authenticated;
GRANT ALL ON TABLE public."Notifications" TO service_role;

-- acl: TABLE "Orders"
GRANT ALL ON TABLE public."Orders" TO anon;
GRANT ALL ON TABLE public."Orders" TO authenticated;
GRANT ALL ON TABLE public."Orders" TO service_role;

-- acl: TABLE "Organization"
GRANT ALL ON TABLE public."Organization" TO anon;
GRANT ALL ON TABLE public."Organization" TO authenticated;
GRANT ALL ON TABLE public."Organization" TO service_role;

-- acl: TABLE "Post"
GRANT ALL ON TABLE public."Post" TO anon;
GRANT ALL ON TABLE public."Post" TO authenticated;
GRANT ALL ON TABLE public."Post" TO service_role;

-- acl: TABLE "Sets"
GRANT ALL ON TABLE public."Sets" TO anon;
GRANT ALL ON TABLE public."Sets" TO authenticated;
GRANT ALL ON TABLE public."Sets" TO service_role;

-- acl: TABLE "Star"
GRANT ALL ON TABLE public."Star" TO anon;
GRANT ALL ON TABLE public."Star" TO authenticated;
GRANT ALL ON TABLE public."Star" TO service_role;

-- acl: TABLE "Subscription"
GRANT ALL ON TABLE public."Subscription" TO anon;
GRANT ALL ON TABLE public."Subscription" TO authenticated;
GRANT ALL ON TABLE public."Subscription" TO service_role;

-- acl: TABLE "Tags"
GRANT ALL ON TABLE public."Tags" TO anon;
GRANT ALL ON TABLE public."Tags" TO authenticated;
GRANT ALL ON TABLE public."Tags" TO service_role;

-- acl: TABLE "Trending"
GRANT ALL ON TABLE public."Trending" TO anon;
GRANT ALL ON TABLE public."Trending" TO authenticated;
GRANT ALL ON TABLE public."Trending" TO service_role;

-- acl: TABLE "User"
GRANT ALL ON TABLE public."User" TO anon;
GRANT ALL ON TABLE public."User" TO authenticated;
GRANT ALL ON TABLE public."User" TO service_role;

-- acl: TABLE "UserOrganization"
GRANT ALL ON TABLE public."UserOrganization" TO anon;
GRANT ALL ON TABLE public."UserOrganization" TO authenticated;
GRANT ALL ON TABLE public."UserOrganization" TO service_role;

-- acl: TABLE "Webhooks"
GRANT ALL ON TABLE public."Webhooks" TO anon;
GRANT ALL ON TABLE public."Webhooks" TO authenticated;
GRANT ALL ON TABLE public."Webhooks" TO service_role;

-- acl: TABLE agent_chats
GRANT ALL ON TABLE public.agent_chats TO anon;
GRANT ALL ON TABLE public.agent_chats TO authenticated;
GRANT ALL ON TABLE public.agent_chats TO service_role;

-- acl: TABLE agent_messages
GRANT ALL ON TABLE public.agent_messages TO anon;
GRANT ALL ON TABLE public.agent_messages TO authenticated;
GRANT ALL ON TABLE public.agent_messages TO service_role;

-- acl: SEQUENCE agent_messages_id_seq
GRANT ALL ON SEQUENCE public.agent_messages_id_seq TO anon;
GRANT ALL ON SEQUENCE public.agent_messages_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.agent_messages_id_seq TO service_role;

-- acl: TABLE alerts
GRANT ALL ON TABLE public.alerts TO anon;
GRANT ALL ON TABLE public.alerts TO authenticated;
GRANT ALL ON TABLE public.alerts TO service_role;

-- acl: SEQUENCE alerts_id_seq
GRANT ALL ON SEQUENCE public.alerts_id_seq TO anon;
GRANT ALL ON SEQUENCE public.alerts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.alerts_id_seq TO service_role;

-- acl: TABLE api_keys
GRANT ALL ON TABLE public.api_keys TO anon;
GRANT ALL ON TABLE public.api_keys TO authenticated;
GRANT ALL ON TABLE public.api_keys TO service_role;

-- acl: TABLE app_errors
GRANT ALL ON TABLE public.app_errors TO anon;
GRANT ALL ON TABLE public.app_errors TO authenticated;
GRANT ALL ON TABLE public.app_errors TO service_role;

-- acl: TABLE bio_pages
GRANT ALL ON TABLE public.bio_pages TO anon;
GRANT ALL ON TABLE public.bio_pages TO authenticated;
GRANT ALL ON TABLE public.bio_pages TO service_role;

-- acl: TABLE bio_views
GRANT ALL ON TABLE public.bio_views TO anon;
GRANT ALL ON TABLE public.bio_views TO authenticated;
GRANT ALL ON TABLE public.bio_views TO service_role;

-- acl: TABLE bio_visits
GRANT ALL ON TABLE public.bio_visits TO anon;
GRANT ALL ON TABLE public.bio_visits TO authenticated;
GRANT ALL ON TABLE public.bio_visits TO service_role;

-- acl: TABLE brands
GRANT ALL ON TABLE public.brands TO anon;
GRANT ALL ON TABLE public.brands TO authenticated;
GRANT ALL ON TABLE public.brands TO service_role;

-- acl: TABLE channel_groups
GRANT ALL ON TABLE public.channel_groups TO anon;
GRANT ALL ON TABLE public.channel_groups TO authenticated;
GRANT ALL ON TABLE public.channel_groups TO service_role;

-- acl: TABLE channel_secrets
GRANT ALL ON TABLE public.channel_secrets TO anon;
GRANT ALL ON TABLE public.channel_secrets TO authenticated;
GRANT ALL ON TABLE public.channel_secrets TO service_role;

-- acl: TABLE channels
GRANT ALL ON TABLE public.channels TO anon;
GRANT ALL ON TABLE public.channels TO authenticated;
GRANT ALL ON TABLE public.channels TO service_role;

-- acl: TABLE credit_entries
GRANT ALL ON TABLE public.credit_entries TO anon;
GRANT ALL ON TABLE public.credit_entries TO authenticated;
GRANT ALL ON TABLE public.credit_entries TO service_role;

-- acl: SEQUENCE credit_entries_id_seq
GRANT ALL ON SEQUENCE public.credit_entries_id_seq TO anon;
GRANT ALL ON SEQUENCE public.credit_entries_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.credit_entries_id_seq TO service_role;

-- acl: TABLE evergreen
GRANT ALL ON TABLE public.evergreen TO anon;
GRANT ALL ON TABLE public.evergreen TO authenticated;
GRANT ALL ON TABLE public.evergreen TO service_role;

-- acl: TABLE feeds
GRANT ALL ON TABLE public.feeds TO anon;
GRANT ALL ON TABLE public.feeds TO authenticated;
GRANT ALL ON TABLE public.feeds TO service_role;

-- acl: TABLE inbox_items
GRANT ALL ON TABLE public.inbox_items TO anon;
GRANT ALL ON TABLE public.inbox_items TO authenticated;
GRANT ALL ON TABLE public.inbox_items TO service_role;

-- acl: TABLE inbox_state
GRANT ALL ON TABLE public.inbox_state TO anon;
GRANT ALL ON TABLE public.inbox_state TO authenticated;
GRANT ALL ON TABLE public.inbox_state TO service_role;

-- acl: TABLE invites
GRANT ALL ON TABLE public.invites TO anon;
GRANT ALL ON TABLE public.invites TO authenticated;
GRANT ALL ON TABLE public.invites TO service_role;

-- acl: SEQUENCE jobs_id_seq
GRANT ALL ON SEQUENCE public.jobs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.jobs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.jobs_id_seq TO service_role;

-- acl: TABLE links
GRANT ALL ON TABLE public.links TO anon;
GRANT ALL ON TABLE public.links TO authenticated;
GRANT ALL ON TABLE public.links TO service_role;

-- acl: TABLE media
GRANT ALL ON TABLE public.media TO anon;
GRANT ALL ON TABLE public.media TO authenticated;
GRANT ALL ON TABLE public.media TO service_role;

-- acl: TABLE members
GRANT ALL ON TABLE public.members TO anon;
GRANT ALL ON TABLE public.members TO authenticated;
GRANT ALL ON TABLE public.members TO service_role;

-- acl: TABLE metrics
GRANT ALL ON TABLE public.metrics TO anon;
GRANT ALL ON TABLE public.metrics TO authenticated;
GRANT ALL ON TABLE public.metrics TO service_role;

-- acl: TABLE oauth_states
GRANT ALL ON TABLE public.oauth_states TO anon;
GRANT ALL ON TABLE public.oauth_states TO authenticated;
GRANT ALL ON TABLE public.oauth_states TO service_role;

-- acl: TABLE post_comments
GRANT ALL ON TABLE public.post_comments TO anon;
GRANT ALL ON TABLE public.post_comments TO authenticated;
GRANT ALL ON TABLE public.post_comments TO service_role;

-- acl: SEQUENCE post_comments_id_seq
GRANT ALL ON SEQUENCE public.post_comments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.post_comments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.post_comments_id_seq TO service_role;

-- acl: TABLE post_metrics
GRANT ALL ON TABLE public.post_metrics TO anon;
GRANT ALL ON TABLE public.post_metrics TO authenticated;
GRANT ALL ON TABLE public.post_metrics TO service_role;

-- acl: TABLE post_targets
GRANT ALL ON TABLE public.post_targets TO anon;
GRANT ALL ON TABLE public.post_targets TO authenticated;
GRANT ALL ON TABLE public.post_targets TO service_role;

-- acl: TABLE posts
GRANT ALL ON TABLE public.posts TO anon;
GRANT ALL ON TABLE public.posts TO authenticated;
GRANT ALL ON TABLE public.posts TO service_role;

-- acl: TABLE reports
GRANT ALL ON TABLE public.reports TO anon;
GRANT ALL ON TABLE public.reports TO authenticated;
GRANT ALL ON TABLE public.reports TO service_role;

-- acl: COLUMN reports.id
GRANT SELECT(id) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.workspace_id
GRANT SELECT(workspace_id) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.brand_id
GRANT SELECT(brand_id) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.name
GRANT SELECT(name) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.range_days
GRANT SELECT(range_days) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.sections
GRANT SELECT(sections) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.notes
GRANT SELECT(notes) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.schedule
GRANT SELECT(schedule) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.send_to
GRANT SELECT(send_to) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.last_sent_at
GRANT SELECT(last_sent_at) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.logo_media_id
GRANT SELECT(logo_media_id) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.accent
GRANT SELECT(accent) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.created_by
GRANT SELECT(created_by) ON TABLE public.reports TO authenticated;

-- acl: COLUMN reports.created_at
GRANT SELECT(created_at) ON TABLE public.reports TO authenticated;

-- acl: TABLE review_links
GRANT ALL ON TABLE public.review_links TO anon;
GRANT ALL ON TABLE public.review_links TO authenticated;
GRANT ALL ON TABLE public.review_links TO service_role;

-- acl: TABLE runner_beats
GRANT ALL ON TABLE public.runner_beats TO anon;
GRANT ALL ON TABLE public.runner_beats TO authenticated;
GRANT ALL ON TABLE public.runner_beats TO service_role;

-- acl: TABLE snippets
GRANT ALL ON TABLE public.snippets TO anon;
GRANT ALL ON TABLE public.snippets TO authenticated;
GRANT ALL ON TABLE public.snippets TO service_role;

-- acl: TABLE upkeep_runs
GRANT ALL ON TABLE public.upkeep_runs TO anon;
GRANT ALL ON TABLE public.upkeep_runs TO authenticated;
GRANT ALL ON TABLE public.upkeep_runs TO service_role;

-- acl: SEQUENCE webhook_deliveries_id_seq
GRANT ALL ON SEQUENCE public.webhook_deliveries_id_seq TO anon;
GRANT ALL ON SEQUENCE public.webhook_deliveries_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.webhook_deliveries_id_seq TO service_role;

-- acl: TABLE webhooks
GRANT ALL ON TABLE public.webhooks TO anon;
GRANT ALL ON TABLE public.webhooks TO authenticated;
GRANT ALL ON TABLE public.webhooks TO service_role;

-- acl: TABLE workspaces
GRANT ALL ON TABLE public.workspaces TO anon;
GRANT ALL ON TABLE public.workspaces TO authenticated;
GRANT ALL ON TABLE public.workspaces TO service_role;

-- default acl: DEFAULT PRIVILEGES FOR SEQUENCES
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- default acl: DEFAULT PRIVILEGES FOR SEQUENCES
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- default acl: DEFAULT PRIVILEGES FOR FUNCTIONS
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- default acl: DEFAULT PRIVILEGES FOR FUNCTIONS
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- default acl: DEFAULT PRIVILEGES FOR TABLES
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- default acl: DEFAULT PRIVILEGES FOR TABLES
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;
