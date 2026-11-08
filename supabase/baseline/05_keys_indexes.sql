-- capybaroar: keys indexes. Built from the running database. Unused objects were removed in the move (see README.md).
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

-- index: Comments_createdAt_idx
CREATE INDEX "Comments_createdAt_idx" ON public."Comments" USING btree ("createdAt");

-- index: Comments_deletedAt_idx
CREATE INDEX "Comments_deletedAt_idx" ON public."Comments" USING btree ("deletedAt");

-- index: Comments_organizationId_idx
CREATE INDEX "Comments_organizationId_idx" ON public."Comments" USING btree ("organizationId");

-- index: Comments_parentId_idx
CREATE INDEX "Comments_parentId_idx" ON public."Comments" USING btree ("parentId");

-- index: Comments_postId_idx
CREATE INDEX "Comments_postId_idx" ON public."Comments" USING btree ("postId");

-- index: Comments_resolvedAt_idx
CREATE INDEX "Comments_resolvedAt_idx" ON public."Comments" USING btree ("resolvedAt");

-- index: Comments_userId_idx
CREATE INDEX "Comments_userId_idx" ON public."Comments" USING btree ("userId");

-- index: Credits_createdAt_idx
CREATE INDEX "Credits_createdAt_idx" ON public."Credits" USING btree ("createdAt");

-- index: Credits_organizationId_idx
CREATE INDEX "Credits_organizationId_idx" ON public."Credits" USING btree ("organizationId");

-- index: Customer_orgId_name_deletedAt_key
CREATE UNIQUE INDEX "Customer_orgId_name_deletedAt_key" ON public."Customer" USING btree ("orgId", name, "deletedAt");

-- index: Errors_createdAt_idx
CREATE INDEX "Errors_createdAt_idx" ON public."Errors" USING btree ("createdAt");

-- index: Errors_organizationId_idx
CREATE INDEX "Errors_organizationId_idx" ON public."Errors" USING btree ("organizationId");

-- index: GitHub_login_idx
CREATE INDEX "GitHub_login_idx" ON public."GitHub" USING btree (login);

-- index: GitHub_organizationId_idx
CREATE INDEX "GitHub_organizationId_idx" ON public."GitHub" USING btree ("organizationId");

-- index: Integration_createdAt_idx
CREATE INDEX "Integration_createdAt_idx" ON public."Integration" USING btree ("createdAt");

-- index: Integration_customerId_idx
CREATE INDEX "Integration_customerId_idx" ON public."Integration" USING btree ("customerId");

-- index: Integration_deletedAt_idx
CREATE INDEX "Integration_deletedAt_idx" ON public."Integration" USING btree ("deletedAt");

-- index: Integration_disabled_idx
CREATE INDEX "Integration_disabled_idx" ON public."Integration" USING btree (disabled);

-- index: Integration_inBetweenSteps_idx
CREATE INDEX "Integration_inBetweenSteps_idx" ON public."Integration" USING btree ("inBetweenSteps");

-- index: Integration_organizationId_idx
CREATE INDEX "Integration_organizationId_idx" ON public."Integration" USING btree ("organizationId");

-- index: Integration_organizationId_internalId_key
CREATE UNIQUE INDEX "Integration_organizationId_internalId_key" ON public."Integration" USING btree ("organizationId", "internalId");

-- index: Integration_providerIdentifier_idx
CREATE INDEX "Integration_providerIdentifier_idx" ON public."Integration" USING btree ("providerIdentifier");

-- index: Integration_refreshNeeded_idx
CREATE INDEX "Integration_refreshNeeded_idx" ON public."Integration" USING btree ("refreshNeeded");

-- index: Integration_rootInternalId_idx
CREATE INDEX "Integration_rootInternalId_idx" ON public."Integration" USING btree ("rootInternalId");

-- index: Integration_updatedAt_idx
CREATE INDEX "Integration_updatedAt_idx" ON public."Integration" USING btree ("updatedAt");

-- index: Media_name_idx
CREATE INDEX "Media_name_idx" ON public."Media" USING btree (name);

-- index: Media_organizationId_idx
CREATE INDEX "Media_organizationId_idx" ON public."Media" USING btree ("organizationId");

-- index: Media_type_idx
CREATE INDEX "Media_type_idx" ON public."Media" USING btree (type);

-- index: Mentions_createdAt_idx
CREATE INDEX "Mentions_createdAt_idx" ON public."Mentions" USING btree ("createdAt");

-- index: Messages_createdAt_idx
CREATE INDEX "Messages_createdAt_idx" ON public."Messages" USING btree ("createdAt");

-- index: Messages_deletedAt_idx
CREATE INDEX "Messages_deletedAt_idx" ON public."Messages" USING btree ("deletedAt");

-- index: Messages_groupId_idx
CREATE INDEX "Messages_groupId_idx" ON public."Messages" USING btree ("groupId");

-- index: Notifications_createdAt_idx
CREATE INDEX "Notifications_createdAt_idx" ON public."Notifications" USING btree ("createdAt");

-- index: Notifications_deletedAt_idx
CREATE INDEX "Notifications_deletedAt_idx" ON public."Notifications" USING btree ("deletedAt");

-- index: Notifications_organizationId_idx
CREATE INDEX "Notifications_organizationId_idx" ON public."Notifications" USING btree ("organizationId");

-- index: Orders_buyerId_idx
CREATE INDEX "Orders_buyerId_idx" ON public."Orders" USING btree ("buyerId");

-- index: Orders_createdAt_idx
CREATE INDEX "Orders_createdAt_idx" ON public."Orders" USING btree ("createdAt");

-- index: Orders_messageGroupId_idx
CREATE INDEX "Orders_messageGroupId_idx" ON public."Orders" USING btree ("messageGroupId");

-- index: Orders_sellerId_idx
CREATE INDEX "Orders_sellerId_idx" ON public."Orders" USING btree ("sellerId");

-- index: Orders_updatedAt_idx
CREATE INDEX "Orders_updatedAt_idx" ON public."Orders" USING btree ("updatedAt");

-- index: Organization_apiKey_idx
CREATE INDEX "Organization_apiKey_idx" ON public."Organization" USING btree ("apiKey");

-- index: Organization_deletedAt_idx
CREATE INDEX "Organization_deletedAt_idx" ON public."Organization" USING btree ("deletedAt");

-- index: Organization_paymentId_idx
CREATE INDEX "Organization_paymentId_idx" ON public."Organization" USING btree ("paymentId");

-- index: Organization_streakSince_idx
CREATE INDEX "Organization_streakSince_idx" ON public."Organization" USING btree ("streakSince");

-- index: Post_approvedSubmitForOrder_idx
CREATE INDEX "Post_approvedSubmitForOrder_idx" ON public."Post" USING btree ("approvedSubmitForOrder");

-- index: Post_batchId_idx
CREATE INDEX "Post_batchId_idx" ON public."Post" USING btree ("batchId");

-- index: Post_createdAt_idx
CREATE INDEX "Post_createdAt_idx" ON public."Post" USING btree ("createdAt");

-- index: Post_creationMethod_idx
CREATE INDEX "Post_creationMethod_idx" ON public."Post" USING btree ("creationMethod");

-- index: Post_deletedAt_idx
CREATE INDEX "Post_deletedAt_idx" ON public."Post" USING btree ("deletedAt");

-- index: Post_group_idx
CREATE INDEX "Post_group_idx" ON public."Post" USING btree ("group");

-- index: Post_integrationId_idx
CREATE INDEX "Post_integrationId_idx" ON public."Post" USING btree ("integrationId");

-- index: Post_intervalInDays_idx
CREATE INDEX "Post_intervalInDays_idx" ON public."Post" USING btree ("intervalInDays");

-- index: Post_lastMessageId_idx
CREATE INDEX "Post_lastMessageId_idx" ON public."Post" USING btree ("lastMessageId");

-- index: Post_organizationId_idx
CREATE INDEX "Post_organizationId_idx" ON public."Post" USING btree ("organizationId");

-- index: Post_parentPostId_idx
CREATE INDEX "Post_parentPostId_idx" ON public."Post" USING btree ("parentPostId");

-- index: Post_publishDate_idx
CREATE INDEX "Post_publishDate_idx" ON public."Post" USING btree ("publishDate");

-- index: Post_releaseURL_idx
CREATE INDEX "Post_releaseURL_idx" ON public."Post" USING btree ("releaseURL");

-- index: Post_state_idx
CREATE INDEX "Post_state_idx" ON public."Post" USING btree (state);

-- index: Post_submittedForOrderId_idx
CREATE INDEX "Post_submittedForOrderId_idx" ON public."Post" USING btree ("submittedForOrderId");

-- index: Post_updatedAt_idx
CREATE INDEX "Post_updatedAt_idx" ON public."Post" USING btree ("updatedAt");

-- index: Sets_organizationId_idx
CREATE INDEX "Sets_organizationId_idx" ON public."Sets" USING btree ("organizationId");

-- index: Star_login_date_key
CREATE UNIQUE INDEX "Star_login_date_key" ON public."Star" USING btree (login, date);

-- index: Subscription_deletedAt_idx
CREATE INDEX "Subscription_deletedAt_idx" ON public."Subscription" USING btree ("deletedAt");

-- index: Subscription_organizationId_idx
CREATE INDEX "Subscription_organizationId_idx" ON public."Subscription" USING btree ("organizationId");

-- index: Subscription_organizationId_key
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON public."Subscription" USING btree ("organizationId");

-- index: Tags_deletedAt_idx
CREATE INDEX "Tags_deletedAt_idx" ON public."Tags" USING btree ("deletedAt");

-- index: Tags_orgId_idx
CREATE INDEX "Tags_orgId_idx" ON public."Tags" USING btree ("orgId");

-- index: Trending_hash_idx
CREATE INDEX "Trending_hash_idx" ON public."Trending" USING btree (hash);

-- index: Trending_language_key
CREATE UNIQUE INDEX "Trending_language_key" ON public."Trending" USING btree (language);

-- index: UserOrganization_disabled_idx
CREATE INDEX "UserOrganization_disabled_idx" ON public."UserOrganization" USING btree (disabled);

-- index: UserOrganization_organizationId_idx
CREATE INDEX "UserOrganization_organizationId_idx" ON public."UserOrganization" USING btree ("organizationId");

-- index: UserOrganization_userId_organizationId_key
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_key" ON public."UserOrganization" USING btree ("userId", "organizationId");

-- index: User_account_idx
CREATE INDEX "User_account_idx" ON public."User" USING btree (account);

-- index: User_deletedAt_idx
CREATE INDEX "User_deletedAt_idx" ON public."User" USING btree ("deletedAt");

-- index: User_email_providerName_key
CREATE UNIQUE INDEX "User_email_providerName_key" ON public."User" USING btree (email, "providerName");

-- index: User_inviteId_idx
CREATE INDEX "User_inviteId_idx" ON public."User" USING btree ("inviteId");

-- index: User_lastOnline_idx
CREATE INDEX "User_lastOnline_idx" ON public."User" USING btree ("lastOnline");

-- index: User_lastReadNotifications_idx
CREATE INDEX "User_lastReadNotifications_idx" ON public."User" USING btree ("lastReadNotifications");

-- index: User_pictureId_idx
CREATE INDEX "User_pictureId_idx" ON public."User" USING btree ("pictureId");

-- index: Webhooks_deletedAt_idx
CREATE INDEX "Webhooks_deletedAt_idx" ON public."Webhooks" USING btree ("deletedAt");

-- index: Webhooks_organizationId_idx
CREATE INDEX "Webhooks_organizationId_idx" ON public."Webhooks" USING btree ("organizationId");

-- index: agent_chats_user
CREATE INDEX agent_chats_user ON public.agent_chats USING btree (user_id, workspace_id, created_at DESC);

-- index: agent_messages_chat
CREATE INDEX agent_messages_chat ON public.agent_messages USING btree (chat_id, id);

-- index: api_keys_ws
CREATE INDEX api_keys_ws ON public.api_keys USING btree (workspace_id, created_at);

-- index: app_errors_last_seen
CREATE INDEX app_errors_last_seen ON public.app_errors USING btree (last_seen);

-- index: bio_pages_ws
CREATE INDEX bio_pages_ws ON public.bio_pages USING btree (workspace_id);

-- index: bio_visits_seen
CREATE INDEX bio_visits_seen ON public.bio_visits USING btree (seen_at);

-- index: brands_ws
CREATE INDEX brands_ws ON public.brands USING btree (workspace_id, created_at);

-- index: channel_groups_ws
CREATE INDEX channel_groups_ws ON public.channel_groups USING btree (workspace_id, created_at);

-- index: channels_brand
CREATE INDEX channels_brand ON public.channels USING btree (brand_id);

-- index: credit_entries_brand
CREATE INDEX credit_entries_brand ON public.credit_entries USING btree (brand_id, period) WHERE (brand_id IS NOT NULL);

-- index: credit_entries_holds
CREATE INDEX credit_entries_holds ON public.credit_entries USING btree (created_at) WHERE (kind = 'hold'::text);

-- index: credit_entries_key
CREATE INDEX credit_entries_key ON public.credit_entries USING btree (workspace_id, key);

-- index: credit_entries_lot
CREATE INDEX credit_entries_lot ON public.credit_entries USING btree (lot) WHERE (lot IS NOT NULL);

-- index: credit_entries_lots
CREATE INDEX credit_entries_lots ON public.credit_entries USING btree (workspace_id, expires_at) WHERE ((bucket = 'bought'::text) AND (kind = 'grant'::text));

-- index: credit_entries_once
CREATE UNIQUE INDEX credit_entries_once ON public.credit_entries USING btree (workspace_id, key, kind, seq, bucket, COALESCE(lot, (0)::bigint));

-- index: credit_entries_plan
CREATE INDEX credit_entries_plan ON public.credit_entries USING btree (workspace_id, period) WHERE (bucket = 'plan'::text);

-- index: credit_entries_recent
CREATE INDEX credit_entries_recent ON public.credit_entries USING btree (workspace_id, created_at DESC);

-- index: evergreen_due
CREATE INDEX evergreen_due ON public.evergreen USING btree (next_at);

-- index: evergreen_ws
CREATE INDEX evergreen_ws ON public.evergreen USING btree (workspace_id);

-- index: feeds_due
CREATE INDEX feeds_due ON public.feeds USING btree (fetched_at NULLS FIRST) WHERE active;

-- index: feeds_ws
CREATE INDEX feeds_ws ON public.feeds USING btree (workspace_id, created_at);

-- index: generations_month
CREATE INDEX generations_month ON public.generations USING btree (workspace_id, created_at DESC);

-- index: generations_open
CREATE INDEX generations_open ON public.generations USING btree (check_after) WHERE (status = ANY (ARRAY['queued'::text, 'running'::text]));

-- index: generations_post
CREATE INDEX generations_post ON public.generations USING btree (post_id) WHERE (post_id IS NOT NULL);

-- index: inbox_items_list
CREATE INDEX inbox_items_list ON public.inbox_items USING btree (workspace_id, created_at DESC) WHERE (NOT mine);

-- index: inbox_items_open
CREATE INDEX inbox_items_open ON public.inbox_items USING btree (workspace_id) WHERE ((status = 'open'::text) AND (NOT mine));

-- index: inbox_items_thread
CREATE INDEX inbox_items_thread ON public.inbox_items USING btree (channel_id, thread_id);

-- index: invites_ws
CREATE INDEX invites_ws ON public.invites USING btree (workspace_id, created_at DESC);

-- index: jobs_due
CREATE INDEX jobs_due ON public.jobs USING btree (run_after) WHERE (done_at IS NULL);

-- index: jobs_inbox_done
CREATE INDEX jobs_inbox_done ON public.jobs USING btree (done_at) WHERE (kind = 'inbox'::text);

-- index: jobs_inbox_open
CREATE INDEX jobs_inbox_open ON public.jobs USING btree (((payload ->> 'channelId'::text))) WHERE ((kind = 'inbox'::text) AND (done_at IS NULL));

-- index: jobs_pending_post
CREATE INDEX jobs_pending_post ON public.jobs USING btree (((payload ->> 'postId'::text))) WHERE ((done_at IS NULL) AND (kind = 'publish'::text));

-- index: links_page
CREATE INDEX links_page ON public.links USING btree (page_id) WHERE (page_id IS NOT NULL);

-- index: links_ws
CREATE INDEX links_ws ON public.links USING btree (workspace_id, url);

-- index: media_ws_created
CREATE INDEX media_ws_created ON public.media USING btree (workspace_id, created_at DESC);

-- index: members_user
CREATE INDEX members_user ON public.members USING btree (user_id);

-- index: metrics_day
CREATE INDEX metrics_day ON public.metrics USING btree (day);

-- index: metrics_ws_day
CREATE INDEX metrics_ws_day ON public.metrics USING btree (workspace_id, day);

-- index: post_comments_post
CREATE INDEX post_comments_post ON public.post_comments USING btree (post_id, created_at);

-- index: post_metrics_ws
CREATE INDEX post_metrics_ws ON public.post_metrics USING btree (workspace_id);

-- index: post_targets_published
CREATE INDEX post_targets_published ON public.post_targets USING btree (workspace_id, published_at) WHERE (status = 'published'::text);

-- index: posts_brand_calendar
CREATE INDEX posts_brand_calendar ON public.posts USING btree (brand_id, publish_at);

-- index: posts_calendar
CREATE INDEX posts_calendar ON public.posts USING btree (workspace_id, publish_at);

-- index: reports_scheduled
CREATE INDEX reports_scheduled ON public.reports USING btree (schedule) WHERE (schedule <> 'none'::text);

-- index: reports_ws
CREATE INDEX reports_ws ON public.reports USING btree (workspace_id, created_at);

-- index: snippets_ws
CREATE INDEX snippets_ws ON public.snippets USING btree (workspace_id, created_at DESC);

-- index: webhook_deliveries_done
CREATE INDEX webhook_deliveries_done ON public.webhook_deliveries USING btree (done_at) WHERE (done_at IS NOT NULL);

-- index: webhook_deliveries_due
CREATE INDEX webhook_deliveries_due ON public.webhook_deliveries USING btree (run_after) WHERE (done_at IS NULL);

-- index: webhook_deliveries_hook
CREATE INDEX webhook_deliveries_hook ON public.webhook_deliveries USING btree (webhook_id, created_at DESC);

-- index: webhooks_ws
CREATE INDEX webhooks_ws ON public.webhooks USING btree (workspace_id);

-- index: workspaces_stripe_customer
CREATE UNIQUE INDEX workspaces_stripe_customer ON public.workspaces USING btree (stripe_customer_id) WHERE (stripe_customer_id IS NOT NULL);

-- fk constraint: Comments Comments_organizationId_fkey
ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Comments Comments_parentId_fkey
ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Comments"(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- fk constraint: Comments Comments_postId_fkey
ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Comments Comments_userId_fkey
ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- fk constraint: Credits Credits_organizationId_fkey
ALTER TABLE ONLY public."Credits"
    ADD CONSTRAINT "Credits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Customer Customer_orgId_fkey
ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Errors Errors_organizationId_fkey
ALTER TABLE ONLY public."Errors"
    ADD CONSTRAINT "Errors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Errors Errors_postId_fkey
ALTER TABLE ONLY public."Errors"
    ADD CONSTRAINT "Errors_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: GitHub GitHub_organizationId_fkey
ALTER TABLE ONLY public."GitHub"
    ADD CONSTRAINT "GitHub_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Integration Integration_customerId_fkey
ALTER TABLE ONLY public."Integration"
    ADD CONSTRAINT "Integration_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- fk constraint: Integration Integration_organizationId_fkey
ALTER TABLE ONLY public."Integration"
    ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Media Media_organizationId_fkey
ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Notifications Notifications_organizationId_fkey
ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Orders Orders_buyerId_fkey
ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Orders Orders_sellerId_fkey
ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Post Post_integrationId_fkey
ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES public."Integration"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Post Post_lastMessageId_fkey
ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES public."Messages"(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- fk constraint: Post Post_organizationId_fkey
ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Post Post_parentPostId_fkey
ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_parentPostId_fkey" FOREIGN KEY ("parentPostId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- fk constraint: Post Post_submittedForOrderId_fkey
ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_submittedForOrderId_fkey" FOREIGN KEY ("submittedForOrderId") REFERENCES public."Orders"(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- fk constraint: Post Post_submittedForOrganizationId_fkey
ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_submittedForOrganizationId_fkey" FOREIGN KEY ("submittedForOrganizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- fk constraint: Sets Sets_organizationId_fkey
ALTER TABLE ONLY public."Sets"
    ADD CONSTRAINT "Sets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Subscription Subscription_organizationId_fkey
ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: Tags Tags_orgId_fkey
ALTER TABLE ONLY public."Tags"
    ADD CONSTRAINT "Tags_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: UserOrganization UserOrganization_organizationId_fkey
ALTER TABLE ONLY public."UserOrganization"
    ADD CONSTRAINT "UserOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: UserOrganization UserOrganization_userId_fkey
ALTER TABLE ONLY public."UserOrganization"
    ADD CONSTRAINT "UserOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: User User_pictureId_fkey
ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pictureId_fkey" FOREIGN KEY ("pictureId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- fk constraint: Webhooks Webhooks_organizationId_fkey
ALTER TABLE ONLY public."Webhooks"
    ADD CONSTRAINT "Webhooks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- fk constraint: agent_chats agent_chats_user_id_fkey
ALTER TABLE ONLY public.agent_chats
    ADD CONSTRAINT agent_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- fk constraint: agent_chats agent_chats_workspace_id_fkey
ALTER TABLE ONLY public.agent_chats
    ADD CONSTRAINT agent_chats_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: agent_messages agent_messages_chat_id_fkey
ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.agent_chats(id) ON DELETE CASCADE;

-- fk constraint: alerts alerts_workspace_id_fkey
ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: api_keys api_keys_user_id_fkey
ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- fk constraint: api_keys api_keys_workspace_id_fkey
ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: bio_pages bio_pages_avatar_media_id_fkey
ALTER TABLE ONLY public.bio_pages
    ADD CONSTRAINT bio_pages_avatar_media_id_fkey FOREIGN KEY (avatar_media_id) REFERENCES public.media(id) ON DELETE SET NULL;

-- fk constraint: bio_pages bio_pages_brand_id_fkey
ALTER TABLE ONLY public.bio_pages
    ADD CONSTRAINT bio_pages_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- fk constraint: bio_pages bio_pages_share_media_id_fkey
ALTER TABLE ONLY public.bio_pages
    ADD CONSTRAINT bio_pages_share_media_id_fkey FOREIGN KEY (share_media_id) REFERENCES public.media(id) ON DELETE SET NULL;

-- fk constraint: bio_pages bio_pages_workspace_id_fkey
ALTER TABLE ONLY public.bio_pages
    ADD CONSTRAINT bio_pages_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: bio_views bio_views_page_id_fkey
ALTER TABLE ONLY public.bio_views
    ADD CONSTRAINT bio_views_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.bio_pages(id) ON DELETE CASCADE;

-- fk constraint: bio_visits bio_visits_page_id_fkey
ALTER TABLE ONLY public.bio_visits
    ADD CONSTRAINT bio_visits_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.bio_pages(id) ON DELETE CASCADE;

-- fk constraint: brands brands_workspace_id_fkey
ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: channel_groups channel_groups_brand_id_fkey
ALTER TABLE ONLY public.channel_groups
    ADD CONSTRAINT channel_groups_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- fk constraint: channel_groups channel_groups_created_by_fkey
ALTER TABLE ONLY public.channel_groups
    ADD CONSTRAINT channel_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: channel_groups channel_groups_workspace_id_fkey
ALTER TABLE ONLY public.channel_groups
    ADD CONSTRAINT channel_groups_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: channel_secrets channel_secrets_channel_id_fkey
ALTER TABLE ONLY public.channel_secrets
    ADD CONSTRAINT channel_secrets_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

-- fk constraint: channels channels_brand_id_fkey
ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

-- fk constraint: channels channels_workspace_id_fkey
ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: credit_entries credit_entries_brand_id_fkey
ALTER TABLE ONLY public.credit_entries
    ADD CONSTRAINT credit_entries_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

-- fk constraint: credit_entries credit_entries_lot_fkey
ALTER TABLE ONLY public.credit_entries
    ADD CONSTRAINT credit_entries_lot_fkey FOREIGN KEY (lot) REFERENCES public.credit_entries(id);

-- fk constraint: credit_entries credit_entries_user_id_fkey
ALTER TABLE ONLY public.credit_entries
    ADD CONSTRAINT credit_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: credit_entries credit_entries_workspace_id_fkey
ALTER TABLE ONLY public.credit_entries
    ADD CONSTRAINT credit_entries_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: evergreen evergreen_created_by_fkey
ALTER TABLE ONLY public.evergreen
    ADD CONSTRAINT evergreen_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: evergreen evergreen_last_post_id_fkey
ALTER TABLE ONLY public.evergreen
    ADD CONSTRAINT evergreen_last_post_id_fkey FOREIGN KEY (last_post_id) REFERENCES public.posts(id) ON DELETE SET NULL;

-- fk constraint: evergreen evergreen_post_id_fkey
ALTER TABLE ONLY public.evergreen
    ADD CONSTRAINT evergreen_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- fk constraint: evergreen evergreen_workspace_id_fkey
ALTER TABLE ONLY public.evergreen
    ADD CONSTRAINT evergreen_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: feeds feeds_brand_id_fkey
ALTER TABLE ONLY public.feeds
    ADD CONSTRAINT feeds_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- fk constraint: feeds feeds_created_by_fkey
ALTER TABLE ONLY public.feeds
    ADD CONSTRAINT feeds_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: feeds feeds_workspace_id_fkey
ALTER TABLE ONLY public.feeds
    ADD CONSTRAINT feeds_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: generations generations_created_by_fkey
ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: generations generations_media_id_fkey
ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE SET NULL;

-- fk constraint: generations generations_post_id_fkey
ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;

-- fk constraint: generations generations_source_media_id_fkey
ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_source_media_id_fkey FOREIGN KEY (source_media_id) REFERENCES public.media(id) ON DELETE SET NULL;

-- fk constraint: generations generations_workspace_id_fkey
ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: inbox_items inbox_items_channel_id_fkey
ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT inbox_items_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

-- fk constraint: inbox_items inbox_items_replied_by_fkey
ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT inbox_items_replied_by_fkey FOREIGN KEY (replied_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: inbox_items inbox_items_target_id_fkey
ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT inbox_items_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.post_targets(id) ON DELETE SET NULL;

-- fk constraint: inbox_items inbox_items_workspace_id_fkey
ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT inbox_items_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: inbox_state inbox_state_channel_id_fkey
ALTER TABLE ONLY public.inbox_state
    ADD CONSTRAINT inbox_state_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

-- fk constraint: invites invites_accepted_by_fkey
ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: invites invites_invited_by_fkey
ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: invites invites_workspace_id_fkey
ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: links links_page_id_fkey
ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.bio_pages(id) ON DELETE SET NULL;

-- fk constraint: links links_workspace_id_fkey
ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: media media_created_by_fkey
ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: media media_workspace_id_fkey
ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: members members_user_id_fkey
ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- fk constraint: members members_workspace_id_fkey
ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: metrics metrics_channel_id_fkey
ALTER TABLE ONLY public.metrics
    ADD CONSTRAINT metrics_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

-- fk constraint: metrics metrics_workspace_id_fkey
ALTER TABLE ONLY public.metrics
    ADD CONSTRAINT metrics_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: oauth_states oauth_states_brand_id_fkey
ALTER TABLE ONLY public.oauth_states
    ADD CONSTRAINT oauth_states_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

-- fk constraint: oauth_states oauth_states_user_id_fkey
ALTER TABLE ONLY public.oauth_states
    ADD CONSTRAINT oauth_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- fk constraint: oauth_states oauth_states_workspace_id_fkey
ALTER TABLE ONLY public.oauth_states
    ADD CONSTRAINT oauth_states_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: post_comments post_comments_author_fkey
ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_author_fkey FOREIGN KEY (author) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: post_comments post_comments_post_id_fkey
ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- fk constraint: post_comments post_comments_workspace_id_fkey
ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: post_metrics post_metrics_channel_id_fkey
ALTER TABLE ONLY public.post_metrics
    ADD CONSTRAINT post_metrics_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

-- fk constraint: post_metrics post_metrics_target_id_fkey
ALTER TABLE ONLY public.post_metrics
    ADD CONSTRAINT post_metrics_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.post_targets(id) ON DELETE CASCADE;

-- fk constraint: post_metrics post_metrics_workspace_id_fkey
ALTER TABLE ONLY public.post_metrics
    ADD CONSTRAINT post_metrics_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: post_targets post_targets_channel_id_fkey
ALTER TABLE ONLY public.post_targets
    ADD CONSTRAINT post_targets_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

-- fk constraint: post_targets post_targets_post_id_fkey
ALTER TABLE ONLY public.post_targets
    ADD CONSTRAINT post_targets_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- fk constraint: post_targets post_targets_workspace_id_fkey
ALTER TABLE ONLY public.post_targets
    ADD CONSTRAINT post_targets_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: posts posts_brand_id_fkey
ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

-- fk constraint: posts posts_created_by_fkey
ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: posts posts_submitted_by_fkey
ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: posts posts_workspace_id_fkey
ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: reports reports_brand_id_fkey
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- fk constraint: reports reports_created_by_fkey
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: reports reports_logo_media_id_fkey
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_logo_media_id_fkey FOREIGN KEY (logo_media_id) REFERENCES public.media(id) ON DELETE SET NULL;

-- fk constraint: reports reports_workspace_id_fkey
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: review_links review_links_brand_id_fkey
ALTER TABLE ONLY public.review_links
    ADD CONSTRAINT review_links_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- fk constraint: review_links review_links_created_by_fkey
ALTER TABLE ONLY public.review_links
    ADD CONSTRAINT review_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: review_links review_links_workspace_id_fkey
ALTER TABLE ONLY public.review_links
    ADD CONSTRAINT review_links_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: snippets snippets_workspace_id_fkey
ALTER TABLE ONLY public.snippets
    ADD CONSTRAINT snippets_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: webhook_deliveries webhook_deliveries_webhook_id_fkey
ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.webhooks(id) ON DELETE CASCADE;

-- fk constraint: webhook_deliveries webhook_deliveries_workspace_id_fkey
ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- fk constraint: webhooks webhooks_created_by_fkey
ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- fk constraint: webhooks webhooks_workspace_id_fkey
ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
