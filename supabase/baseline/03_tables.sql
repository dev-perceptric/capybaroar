-- capybaroar: tables. Built from the running database. Unused objects were removed in the move (see README.md).
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

-- Comments --------------------------------------------------------------
CREATE TABLE public."Comments" (
    id text NOT NULL,
    content text NOT NULL,
    "organizationId" text NOT NULL,
    "postId" text NOT NULL,
    "userId" text,
    "displayName" text,
    "parentId" text,
    "anchorStart" integer,
    "anchorEnd" integer,
    "anchorQuote" text,
    "resolvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);

ALTER TABLE public."Comments" OWNER TO postgres;

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_pkey" PRIMARY KEY (id);

-- Credits ---------------------------------------------------------------
CREATE TABLE public."Credits" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    credits integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    type text DEFAULT 'ai_images'::text NOT NULL
);

ALTER TABLE public."Credits" OWNER TO postgres;

ALTER TABLE ONLY public."Credits"
    ADD CONSTRAINT "Credits_pkey" PRIMARY KEY (id);

-- Customer --------------------------------------------------------------
CREATE TABLE public."Customer" (
    id text NOT NULL,
    name text NOT NULL,
    "orgId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);

ALTER TABLE public."Customer" OWNER TO postgres;

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);

-- Errors ----------------------------------------------------------------
CREATE TABLE public."Errors" (
    id text NOT NULL,
    message text NOT NULL,
    platform text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "postId" text NOT NULL,
    body text DEFAULT '{}'::text NOT NULL
);

ALTER TABLE public."Errors" OWNER TO postgres;

ALTER TABLE ONLY public."Errors"
    ADD CONSTRAINT "Errors_pkey" PRIMARY KEY (id);

-- GitHub ----------------------------------------------------------------
CREATE TABLE public."GitHub" (
    id text NOT NULL,
    login text,
    name text,
    token text NOT NULL,
    "jobId" text,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."GitHub" OWNER TO postgres;

ALTER TABLE ONLY public."GitHub"
    ADD CONSTRAINT "GitHub_pkey" PRIMARY KEY (id);

-- Integration -----------------------------------------------------------
CREATE TABLE public."Integration" (
    id text NOT NULL,
    "internalId" text NOT NULL,
    "organizationId" text NOT NULL,
    name text NOT NULL,
    "customName" text,
    picture text,
    "providerIdentifier" text NOT NULL,
    type text NOT NULL,
    token text NOT NULL,
    disabled boolean DEFAULT false NOT NULL,
    "tokenExpiration" timestamp(3) without time zone,
    "refreshToken" text,
    profile text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone,
    "inBetweenSteps" boolean DEFAULT false NOT NULL,
    "refreshNeeded" boolean DEFAULT false NOT NULL,
    "postingTimes" text DEFAULT '[{"time":120}, {"time":400}, {"time":700}]'::text NOT NULL,
    "customInstanceDetails" text,
    "customerId" text,
    "rootInternalId" text,
    "additionalSettings" text DEFAULT '[]'::text
);

ALTER TABLE public."Integration" OWNER TO postgres;

ALTER TABLE ONLY public."Integration"
    ADD CONSTRAINT "Integration_pkey" PRIMARY KEY (id);

-- Media -----------------------------------------------------------------
CREATE TABLE public."Media" (
    id text NOT NULL,
    name text NOT NULL,
    "originalName" text,
    path text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "fileSize" integer DEFAULT 0 NOT NULL,
    type text DEFAULT 'image'::text NOT NULL,
    thumbnail text,
    alt text,
    "thumbnailTimestamp" integer,
    status text DEFAULT 'ready'::text NOT NULL,
    "processingError" text
);

ALTER TABLE public."Media" OWNER TO postgres;

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_pkey" PRIMARY KEY (id);

-- Mentions --------------------------------------------------------------
CREATE TABLE public."Mentions" (
    name text NOT NULL,
    username text NOT NULL,
    platform text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    image text NOT NULL
);

ALTER TABLE public."Mentions" OWNER TO postgres;

ALTER TABLE ONLY public."Mentions"
    ADD CONSTRAINT "Mentions_pkey" PRIMARY KEY (name, username, platform, image);

-- Messages --------------------------------------------------------------
CREATE TABLE public."Messages" (
    id text NOT NULL,
    "from" public."From" NOT NULL,
    content text,
    "groupId" text NOT NULL,
    special text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);

ALTER TABLE public."Messages" OWNER TO postgres;

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_pkey" PRIMARY KEY (id);

-- Notifications ---------------------------------------------------------
CREATE TABLE public."Notifications" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    content text NOT NULL,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);

ALTER TABLE public."Notifications" OWNER TO postgres;

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);

-- Orders ----------------------------------------------------------------
CREATE TABLE public."Orders" (
    id text NOT NULL,
    "buyerId" text NOT NULL,
    "sellerId" text NOT NULL,
    status public."OrderStatus" NOT NULL,
    "messageGroupId" text NOT NULL,
    "captureId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Orders" OWNER TO postgres;

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_pkey" PRIMARY KEY (id);

-- Organization ----------------------------------------------------------
CREATE TABLE public."Organization" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "apiKey" text,
    "paymentId" text,
    "streakSince" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "allowTrial" boolean DEFAULT false NOT NULL,
    "isTrailing" boolean DEFAULT false NOT NULL,
    shortlink public."ShortLinkPreference" DEFAULT 'ASK'::public."ShortLinkPreference" NOT NULL
);

ALTER TABLE public."Organization" OWNER TO postgres;

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);

-- Post ------------------------------------------------------------------
CREATE TABLE public."Post" (
    id text NOT NULL,
    state public."State" DEFAULT 'QUEUE'::public."State" NOT NULL,
    "publishDate" timestamp(3) without time zone NOT NULL,
    "organizationId" text NOT NULL,
    "integrationId" text NOT NULL,
    content text NOT NULL,
    delay integer DEFAULT 0 NOT NULL,
    "group" text NOT NULL,
    "batchId" text,
    title text,
    description text,
    "parentPostId" text,
    "releaseId" text,
    "releaseURL" text,
    settings text,
    image text,
    "submittedForOrderId" text,
    "submittedForOrganizationId" text,
    "approvedSubmitForOrder" public."APPROVED_SUBMIT_FOR_ORDER" DEFAULT 'NO'::public."APPROVED_SUBMIT_FOR_ORDER" NOT NULL,
    "creationMethod" public."CreationMethod" DEFAULT 'UNKNOWN'::public."CreationMethod" NOT NULL,
    "lastMessageId" text,
    "intervalInDays" integer,
    error text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);

ALTER TABLE public."Post" OWNER TO postgres;

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);

-- Sets ------------------------------------------------------------------
CREATE TABLE public."Sets" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Sets" OWNER TO postgres;

ALTER TABLE ONLY public."Sets"
    ADD CONSTRAINT "Sets_pkey" PRIMARY KEY (id);

-- Star ------------------------------------------------------------------
CREATE TABLE public."Star" (
    id text NOT NULL,
    stars integer NOT NULL,
    "totalStars" integer NOT NULL,
    forks integer NOT NULL,
    "totalForks" integer NOT NULL,
    login text NOT NULL,
    date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Star" OWNER TO postgres;

ALTER TABLE ONLY public."Star"
    ADD CONSTRAINT "Star_pkey" PRIMARY KEY (id);

-- Subscription ----------------------------------------------------------
CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "subscriptionTier" public."SubscriptionTier" NOT NULL,
    provider text DEFAULT 'stripe'::text NOT NULL,
    identifier text,
    "cancelAt" timestamp(3) without time zone,
    period public."Period" NOT NULL,
    "totalChannels" integer NOT NULL,
    "isLifetime" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);

ALTER TABLE public."Subscription" OWNER TO postgres;

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);

-- Tags ------------------------------------------------------------------
CREATE TABLE public."Tags" (
    id text NOT NULL,
    name text NOT NULL,
    color text NOT NULL,
    "orgId" text NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Tags" OWNER TO postgres;

ALTER TABLE ONLY public."Tags"
    ADD CONSTRAINT "Tags_pkey" PRIMARY KEY (id);

-- Trending --------------------------------------------------------------
CREATE TABLE public."Trending" (
    id text NOT NULL,
    "trendingList" text NOT NULL,
    language text,
    hash text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Trending" OWNER TO postgres;

ALTER TABLE ONLY public."Trending"
    ADD CONSTRAINT "Trending_pkey" PRIMARY KEY (id);

-- User ------------------------------------------------------------------
CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text,
    "providerName" public."Provider" NOT NULL,
    name text,
    "lastName" text,
    "isSuperAdmin" boolean DEFAULT false NOT NULL,
    bio text,
    audience integer DEFAULT 0 NOT NULL,
    "pictureId" text,
    "providerId" text,
    timezone integer NOT NULL,
    "timezoneName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastReadNotifications" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviteId" text,
    activated boolean DEFAULT true NOT NULL,
    account text,
    "connectedAccount" boolean DEFAULT false NOT NULL,
    "lastOnline" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip text,
    agent text,
    "deletedAt" timestamp(3) without time zone,
    "sendSuccessEmails" boolean DEFAULT true NOT NULL,
    "sendFailureEmails" boolean DEFAULT true NOT NULL,
    "sendStreakEmails" boolean DEFAULT true NOT NULL
);

ALTER TABLE public."User" OWNER TO postgres;

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);

-- UserOrganization ------------------------------------------------------
CREATE TABLE public."UserOrganization" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "organizationId" text NOT NULL,
    disabled boolean DEFAULT false NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."UserOrganization" OWNER TO postgres;

ALTER TABLE ONLY public."UserOrganization"
    ADD CONSTRAINT "UserOrganization_pkey" PRIMARY KEY (id);

-- Webhooks --------------------------------------------------------------
CREATE TABLE public."Webhooks" (
    id text NOT NULL,
    name text NOT NULL,
    "organizationId" text NOT NULL,
    url text NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Webhooks" OWNER TO postgres;

ALTER TABLE ONLY public."Webhooks"
    ADD CONSTRAINT "Webhooks_pkey" PRIMARY KEY (id);

-- agent_chats -----------------------------------------------------------
CREATE TABLE public.agent_chats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'New chat'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.agent_chats OWNER TO postgres;

ALTER TABLE ONLY public.agent_chats
    ADD CONSTRAINT agent_chats_pkey PRIMARY KEY (id);

-- agent_messages --------------------------------------------------------
CREATE TABLE public.agent_messages (
    id bigint NOT NULL,
    chat_id uuid NOT NULL,
    role text NOT NULL,
    content jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agent_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);

ALTER TABLE public.agent_messages OWNER TO postgres;

ALTER SEQUENCE public.agent_messages_id_seq OWNED BY public.agent_messages.id;

ALTER TABLE ONLY public.agent_messages ALTER COLUMN id SET DEFAULT nextval('public.agent_messages_id_seq'::regclass);

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_pkey PRIMARY KEY (id);

-- None ----------------------------------------------------------------------
CREATE SEQUENCE public.agent_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.agent_messages_id_seq OWNER TO postgres;

-- alerts ----------------------------------------------------------------
CREATE TABLE public.alerts (
    id bigint NOT NULL,
    workspace_id uuid NOT NULL,
    kind text NOT NULL,
    ref text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT alerts_kind_check CHECK ((kind = ANY (ARRAY['post_failed'::text, 'reconnect'::text, 'credits'::text, 'topup_failed'::text])))
);

ALTER TABLE public.alerts OWNER TO postgres;

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_kind_ref_key UNIQUE (kind, ref);

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);

-- None ----------------------------------------------------------------------
CREATE SEQUENCE public.alerts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.alerts_id_seq OWNER TO postgres;

-- api_keys --------------------------------------------------------------
CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    prefix text NOT NULL,
    hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone,
    CONSTRAINT api_keys_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 60)))
);

ALTER TABLE public.api_keys OWNER TO postgres;

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_hash_key UNIQUE (hash);

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);

-- app_errors ------------------------------------------------------------
CREATE TABLE public.app_errors (
    fingerprint text NOT NULL,
    message text NOT NULL,
    stack text,
    route text,
    machine text,
    count bigint DEFAULT 1 NOT NULL,
    first_seen timestamp with time zone DEFAULT now() NOT NULL,
    last_seen timestamp with time zone DEFAULT now() NOT NULL,
    emailed_at timestamp with time zone
);

ALTER TABLE public.app_errors OWNER TO postgres;

ALTER TABLE ONLY public.app_errors
    ADD CONSTRAINT app_errors_pkey PRIMARY KEY (fingerprint);

-- bio_pages -------------------------------------------------------------
CREATE TABLE public.bio_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    slug text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    bio text DEFAULT ''::text NOT NULL,
    avatar_media_id uuid,
    links jsonb DEFAULT '[]'::jsonb NOT NULL,
    show_posts boolean DEFAULT false NOT NULL,
    theme text DEFAULT 'light'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    blocks jsonb,
    appearance jsonb DEFAULT '{}'::jsonb NOT NULL,
    seo_title text DEFAULT ''::text NOT NULL,
    seo_description text DEFAULT ''::text NOT NULL,
    share_media_id uuid,
    badge boolean DEFAULT true NOT NULL,
    CONSTRAINT bio_pages_appearance_check CHECK ((jsonb_typeof(appearance) = 'object'::text)),
    CONSTRAINT bio_pages_bio_check CHECK ((char_length(bio) <= 300)),
    CONSTRAINT bio_pages_blocks_check CHECK (((blocks IS NULL) OR ((jsonb_typeof(blocks) = 'object'::text) AND (jsonb_typeof((blocks -> 'items'::text)) = 'array'::text) AND (jsonb_array_length((blocks -> 'items'::text)) <= 50)))),
    CONSTRAINT bio_pages_links_check CHECK (((jsonb_typeof(links) = 'array'::text) AND (jsonb_array_length(links) <= 20))),
    CONSTRAINT bio_pages_seo_description_check CHECK ((char_length(seo_description) <= 200)),
    CONSTRAINT bio_pages_seo_title_check CHECK ((char_length(seo_title) <= 70)),
    CONSTRAINT bio_pages_slug_check CHECK ((slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'::text)),
    CONSTRAINT bio_pages_theme_check CHECK ((theme = ANY (ARRAY['light'::text, 'dark'::text]))),
    CONSTRAINT bio_pages_title_check CHECK ((char_length(title) <= 80))
);

ALTER TABLE public.bio_pages OWNER TO postgres;

ALTER TABLE ONLY public.bio_pages
    ADD CONSTRAINT bio_pages_brand_id_key UNIQUE (brand_id);

ALTER TABLE ONLY public.bio_pages
    ADD CONSTRAINT bio_pages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.bio_pages
    ADD CONSTRAINT bio_pages_slug_key UNIQUE (slug);

-- bio_views -------------------------------------------------------------
CREATE TABLE public.bio_views (
    page_id uuid NOT NULL,
    day date NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    referrers jsonb DEFAULT '{}'::jsonb NOT NULL,
    items jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT bio_views_items_check CHECK ((jsonb_typeof(items) = 'object'::text)),
    CONSTRAINT bio_views_referrers_check CHECK ((jsonb_typeof(referrers) = 'object'::text))
);

ALTER TABLE public.bio_views OWNER TO postgres;

ALTER TABLE ONLY public.bio_views
    ADD CONSTRAINT bio_views_pkey PRIMARY KEY (page_id, day);

-- bio_visits ------------------------------------------------------------
CREATE TABLE public.bio_visits (
    page_id uuid NOT NULL,
    visitor text NOT NULL,
    seen_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bio_visits_visitor_check CHECK (((char_length(visitor) >= 16) AND (char_length(visitor) <= 64)))
);

ALTER TABLE public.bio_visits OWNER TO postgres;

ALTER TABLE ONLY public.bio_visits
    ADD CONSTRAINT bio_visits_pkey PRIMARY KEY (page_id, visitor);

-- brands ----------------------------------------------------------------
CREATE TABLE public.brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT 'gray'::text NOT NULL,
    avatar text,
    needs_approval boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    credit_limit integer,
    CONSTRAINT brands_color_check CHECK ((color = ANY (ARRAY['gray'::text, 'violet'::text, 'green'::text, 'amber'::text, 'red'::text, 'turquoise'::text, 'sky'::text, 'pink'::text, 'yellow'::text]))),
    CONSTRAINT brands_credit_limit_check CHECK (((credit_limit IS NULL) OR ((credit_limit >= 0) AND (credit_limit <= 10000000)))),
    CONSTRAINT brands_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 60)))
);

ALTER TABLE public.brands OWNER TO postgres;

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);

-- channel_groups --------------------------------------------------------
CREATE TABLE public.channel_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    brand_id uuid,
    name text NOT NULL,
    channel_ids uuid[] NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT channel_groups_channel_ids_check CHECK (((cardinality(channel_ids) >= 1) AND (cardinality(channel_ids) <= 60))),
    CONSTRAINT channel_groups_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 60)))
);

ALTER TABLE public.channel_groups OWNER TO postgres;

ALTER TABLE ONLY public.channel_groups
    ADD CONSTRAINT channel_groups_pkey PRIMARY KEY (id);

-- channel_secrets -------------------------------------------------------
CREATE TABLE public.channel_secrets (
    channel_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamp with time zone,
    extra jsonb DEFAULT '{}'::jsonb NOT NULL
);

ALTER TABLE public.channel_secrets OWNER TO postgres;

ALTER TABLE ONLY public.channel_secrets
    ADD CONSTRAINT channel_secrets_pkey PRIMARY KEY (channel_id);

-- channels --------------------------------------------------------------
CREATE TABLE public.channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    network text NOT NULL,
    account_id text NOT NULL,
    name text NOT NULL,
    username text,
    avatar text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    brand_id uuid,
    CONSTRAINT channels_status_check CHECK ((status = ANY (ARRAY['active'::text, 'reconnect'::text])))
);

ALTER TABLE public.channels OWNER TO postgres;

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_workspace_id_network_account_id_key UNIQUE (workspace_id, network, account_id);

-- credit_entries --------------------------------------------------------
CREATE TABLE public.credit_entries (
    id bigint NOT NULL,
    workspace_id uuid NOT NULL,
    key text NOT NULL,
    kind text NOT NULL,
    seq integer DEFAULT 0 NOT NULL,
    bucket text NOT NULL,
    period text,
    lot bigint,
    expires_at timestamp with time zone,
    amount integer NOT NULL,
    brand_id uuid,
    user_id uuid,
    tool text,
    model text,
    post_id uuid,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT credit_entries_bucket_check CHECK ((bucket = ANY (ARRAY['plan'::text, 'bought'::text]))),
    CONSTRAINT credit_entries_check CHECK (((kind = ANY (ARRAY['grant'::text, 'release'::text])) = (amount >= 0))),
    CONSTRAINT credit_entries_key_check CHECK (((char_length(key) >= 1) AND (char_length(key) <= 200))),
    CONSTRAINT credit_entries_kind_check CHECK ((kind = ANY (ARRAY['grant'::text, 'hold'::text, 'release'::text, 'charge'::text])))
);

ALTER TABLE public.credit_entries OWNER TO postgres;

ALTER TABLE public.credit_entries ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.credit_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY public.credit_entries
    ADD CONSTRAINT credit_entries_pkey PRIMARY KEY (id);

-- evergreen -------------------------------------------------------------
CREATE TABLE public.evergreen (
    post_id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    every_weeks integer NOT NULL,
    next_at timestamp with time zone NOT NULL,
    last_at timestamp with time zone,
    last_post_id uuid,
    error text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT evergreen_every_weeks_check CHECK (((every_weeks >= 1) AND (every_weeks <= 52)))
);

ALTER TABLE public.evergreen OWNER TO postgres;

ALTER TABLE ONLY public.evergreen
    ADD CONSTRAINT evergreen_pkey PRIMARY KEY (post_id);

-- feeds -----------------------------------------------------------------
CREATE TABLE public.feeds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    url text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    channel_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    template text DEFAULT '{title} {link}'::text NOT NULL,
    mode text DEFAULT 'draft'::text NOT NULL,
    seen text[] DEFAULT '{}'::text[] NOT NULL,
    last_item_guid text,
    active boolean DEFAULT true NOT NULL,
    fetched_at timestamp with time zone,
    error text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feeds_mode_check CHECK ((mode = ANY (ARRAY['draft'::text, 'queue'::text]))),
    CONSTRAINT feeds_template_check CHECK (((char_length(template) >= 1) AND (char_length(template) <= 1000))),
    CONSTRAINT feeds_title_check CHECK ((char_length(title) <= 200)),
    CONSTRAINT feeds_url_check CHECK (((url ~ '^https?://'::text) AND (char_length(url) <= 2000)))
);

ALTER TABLE public.feeds OWNER TO postgres;

ALTER TABLE ONLY public.feeds
    ADD CONSTRAINT feeds_brand_id_url_key UNIQUE (brand_id, url);

ALTER TABLE ONLY public.feeds
    ADD CONSTRAINT feeds_pkey PRIMARY KEY (id);

-- generations -----------------------------------------------------------
CREATE TABLE public.generations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    created_by uuid,
    kind text NOT NULL,
    model text NOT NULL,
    prompt text NOT NULL,
    aspect text,
    seconds integer,
    source_media_id uuid,
    endpoint text NOT NULL,
    input jsonb NOT NULL,
    request_id text,
    status_url text,
    response_url text,
    status text DEFAULT 'queued'::text NOT NULL,
    error text,
    media_id uuid,
    tries integer DEFAULT 0 NOT NULL,
    check_after timestamp with time zone DEFAULT now() NOT NULL,
    locked_at timestamp with time zone,
    locked_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    post_id uuid,
    credits integer DEFAULT 0 NOT NULL,
    reason text,
    CONSTRAINT generations_kind_check CHECK ((kind = ANY (ARRAY['image'::text, 'video'::text, 'audio'::text]))),
    CONSTRAINT generations_prompt_check CHECK (((char_length(prompt) >= 1) AND (char_length(prompt) <= 5000))),
    CONSTRAINT generations_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'running'::text, 'done'::text, 'failed'::text])))
);

ALTER TABLE public.generations OWNER TO postgres;

ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_pkey PRIMARY KEY (id);

-- inbox_items -----------------------------------------------------------
CREATE TABLE public.inbox_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    kind text NOT NULL,
    network_id text NOT NULL,
    thread_id text NOT NULL,
    parent_id text,
    target_id uuid,
    post_remote_id text,
    post_url text,
    post_text text,
    url text,
    author_id text,
    author_name text DEFAULT ''::text NOT NULL,
    author_handle text,
    author_avatar text,
    text text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    mine boolean DEFAULT false NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    liked boolean DEFAULT false NOT NULL,
    like_ref text,
    hidden boolean DEFAULT false NOT NULL,
    reply_text text,
    replied_at timestamp with time zone,
    replied_by uuid,
    extra jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT inbox_items_kind_check CHECK ((kind = ANY (ARRAY['comment'::text, 'reply'::text, 'mention'::text, 'dm'::text]))),
    CONSTRAINT inbox_items_status_check CHECK ((status = ANY (ARRAY['open'::text, 'done'::text])))
);

ALTER TABLE public.inbox_items OWNER TO postgres;

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT inbox_items_channel_id_network_id_key UNIQUE (channel_id, network_id);

ALTER TABLE ONLY public.inbox_items
    ADD CONSTRAINT inbox_items_pkey PRIMARY KEY (id);

-- inbox_state -----------------------------------------------------------
CREATE TABLE public.inbox_state (
    channel_id uuid NOT NULL,
    cursor text,
    fetched_at timestamp with time zone,
    error text
);

ALTER TABLE public.inbox_state OWNER TO postgres;

ALTER TABLE ONLY public.inbox_state
    ADD CONSTRAINT inbox_state_pkey PRIMARY KEY (channel_id);

-- invites ---------------------------------------------------------------
CREATE TABLE public.invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    brand_ids uuid[],
    token_hash text NOT NULL,
    token text NOT NULL,
    invited_by uuid,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    accepted_at timestamp with time zone,
    accepted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invites_email_check CHECK (((char_length(email) >= 3) AND (char_length(email) <= 320))),
    CONSTRAINT invites_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'editor'::text, 'client'::text])))
);

ALTER TABLE public.invites OWNER TO postgres;

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_token_hash_key UNIQUE (token_hash);

-- jobs ------------------------------------------------------------------
CREATE TABLE public.jobs (
    id bigint NOT NULL,
    kind text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    run_after timestamp with time zone DEFAULT now() NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 6 NOT NULL,
    locked_at timestamp with time zone,
    locked_by text,
    done_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.jobs OWNER TO postgres;

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);

-- None ----------------------------------------------------------------------
CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.jobs_id_seq OWNER TO postgres;

-- links -----------------------------------------------------------------
CREATE TABLE public.links (
    code text NOT NULL,
    workspace_id uuid NOT NULL,
    url text NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    page_id uuid,
    item text,
    CONSTRAINT links_code_check CHECK ((code ~ '^[A-Za-z0-9]{6,12}$'::text)),
    CONSTRAINT links_item_check CHECK (((item IS NULL) OR (item ~ '^[A-Za-z0-9._:-]{1,64}$'::text))),
    CONSTRAINT links_url_check CHECK (((url ~ '^https?://'::text) AND (char_length(url) <= 2000)))
);

ALTER TABLE public.links OWNER TO postgres;

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_pkey PRIMARY KEY (code);

-- media -----------------------------------------------------------------
CREATE TABLE public.media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    path text NOT NULL,
    name text NOT NULL,
    mime text NOT NULL,
    size bigint NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    alt text
);

ALTER TABLE public.media OWNER TO postgres;

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_path_key UNIQUE (path);

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);

-- members ---------------------------------------------------------------
CREATE TABLE public.members (
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'owner'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    brand_ids uuid[],
    CONSTRAINT members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text, 'client'::text])))
);

ALTER TABLE public.members OWNER TO postgres;

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (workspace_id, user_id);

-- metrics ---------------------------------------------------------------
CREATE TABLE public.metrics (
    channel_id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    day date NOT NULL,
    followers integer,
    posts integer,
    impressions integer,
    engagements integer
);

ALTER TABLE public.metrics OWNER TO postgres;

ALTER TABLE ONLY public.metrics
    ADD CONSTRAINT metrics_pkey PRIMARY KEY (channel_id, day);

-- oauth_states ----------------------------------------------------------
CREATE TABLE public.oauth_states (
    state text NOT NULL,
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    network text NOT NULL,
    verifier text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    input jsonb DEFAULT '{}'::jsonb NOT NULL,
    brand_id uuid
);

ALTER TABLE public.oauth_states OWNER TO postgres;

ALTER TABLE ONLY public.oauth_states
    ADD CONSTRAINT oauth_states_pkey PRIMARY KEY (state);

-- post_comments ---------------------------------------------------------
CREATE TABLE public.post_comments (
    id bigint NOT NULL,
    post_id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    author uuid,
    author_name text DEFAULT ''::text NOT NULL,
    kind text DEFAULT 'comment'::text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT post_comments_body_check CHECK ((char_length(body) <= 2000)),
    CONSTRAINT post_comments_kind_check CHECK ((kind = ANY (ARRAY['comment'::text, 'approved'::text, 'rejected'::text])))
);

ALTER TABLE public.post_comments OWNER TO postgres;

ALTER SEQUENCE public.post_comments_id_seq OWNED BY public.post_comments.id;

ALTER TABLE ONLY public.post_comments ALTER COLUMN id SET DEFAULT nextval('public.post_comments_id_seq'::regclass);

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);

-- None ----------------------------------------------------------------------
CREATE SEQUENCE public.post_comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.post_comments_id_seq OWNER TO postgres;

-- post_metrics ----------------------------------------------------------
CREATE TABLE public.post_metrics (
    target_id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    views integer,
    reach integer,
    impressions integer,
    likes integer,
    comments integer,
    shares integer,
    saves integer,
    clicks integer,
    engagement integer GENERATED ALWAYS AS (((((COALESCE(likes, 0) + COALESCE(comments, 0)) + COALESCE(shares, 0)) + COALESCE(saves, 0)) + COALESCE(clicks, 0))) STORED
);

ALTER TABLE public.post_metrics OWNER TO postgres;

ALTER TABLE ONLY public.post_metrics
    ADD CONSTRAINT post_metrics_pkey PRIMARY KEY (target_id);

-- post_targets ----------------------------------------------------------
CREATE TABLE public.post_targets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    remote_id text,
    url text,
    error text,
    published_at timestamp with time zone,
    text text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    note text,
    deleted_at timestamp with time zone,
    CONSTRAINT post_targets_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'publishing'::text, 'published'::text, 'failed'::text])))
);

ALTER TABLE public.post_targets OWNER TO postgres;

ALTER TABLE ONLY public.post_targets
    ADD CONSTRAINT post_targets_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.post_targets
    ADD CONSTRAINT post_targets_post_id_channel_id_key UNIQUE (post_id, channel_id);

-- posts -----------------------------------------------------------------
CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    created_by uuid,
    text text DEFAULT ''::text NOT NULL,
    media_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    publish_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    brand_id uuid,
    submitted_by uuid,
    CONSTRAINT posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'review'::text, 'scheduled'::text, 'publishing'::text, 'published'::text, 'partial'::text, 'failed'::text, 'deleted'::text])))
);

ALTER TABLE public.posts OWNER TO postgres;

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);

-- reports ---------------------------------------------------------------
CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    brand_id uuid,
    name text NOT NULL,
    range_days text DEFAULT '30'::text NOT NULL,
    sections jsonb DEFAULT '["summary", "growth", "top", "best", "formats", "channels"]'::jsonb NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    schedule text DEFAULT 'none'::text NOT NULL,
    send_to text[] DEFAULT '{}'::text[] NOT NULL,
    queued_period text,
    last_sent_at timestamp with time zone,
    token_hash text NOT NULL,
    token text NOT NULL,
    logo_media_id uuid,
    accent text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reports_accent_check CHECK ((accent ~ '^#[0-9a-fA-F]{6}$'::text)),
    CONSTRAINT reports_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 80))),
    CONSTRAINT reports_notes_check CHECK ((char_length(notes) <= 5000)),
    CONSTRAINT reports_range_days_check CHECK ((range_days = ANY (ARRAY['7'::text, '30'::text, '90'::text, 'last_month'::text]))),
    CONSTRAINT reports_schedule_check CHECK ((schedule = ANY (ARRAY['none'::text, 'weekly'::text, 'monthly'::text]))),
    CONSTRAINT reports_sections_check CHECK ((jsonb_typeof(sections) = 'array'::text)),
    CONSTRAINT reports_send_to_check CHECK ((cardinality(send_to) <= 20))
);

ALTER TABLE public.reports OWNER TO postgres;

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_token_hash_key UNIQUE (token_hash);

-- review_links ----------------------------------------------------------
CREATE TABLE public.review_links (
    brand_id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    token_hash text NOT NULL,
    token text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.review_links OWNER TO postgres;

ALTER TABLE ONLY public.review_links
    ADD CONSTRAINT review_links_pkey PRIMARY KEY (brand_id);

ALTER TABLE ONLY public.review_links
    ADD CONSTRAINT review_links_token_hash_key UNIQUE (token_hash);

-- runner_beats ----------------------------------------------------------
CREATE TABLE public.runner_beats (
    machine text NOT NULL,
    beat_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    version text
);

ALTER TABLE public.runner_beats OWNER TO postgres;

ALTER TABLE ONLY public.runner_beats
    ADD CONSTRAINT runner_beats_pkey PRIMARY KEY (machine);

-- snippets --------------------------------------------------------------
CREATE TABLE public.snippets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    name text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT snippets_body_check CHECK (((char_length(body) >= 1) AND (char_length(body) <= 3000))),
    CONSTRAINT snippets_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 60)))
);

ALTER TABLE public.snippets OWNER TO postgres;

ALTER TABLE ONLY public.snippets
    ADD CONSTRAINT snippets_pkey PRIMARY KEY (id);

-- upkeep_runs -----------------------------------------------------------
CREATE TABLE public.upkeep_runs (
    name text NOT NULL,
    ran_at timestamp with time zone NOT NULL,
    ran_by text NOT NULL,
    busy_until timestamp with time zone
);

ALTER TABLE public.upkeep_runs OWNER TO postgres;

ALTER TABLE ONLY public.upkeep_runs
    ADD CONSTRAINT upkeep_runs_pkey PRIMARY KEY (name);

-- webhook_deliveries ----------------------------------------------------
CREATE TABLE public.webhook_deliveries (
    id bigint NOT NULL,
    webhook_id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    event text NOT NULL,
    event_id text NOT NULL,
    body text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 8 NOT NULL,
    run_after timestamp with time zone DEFAULT now() NOT NULL,
    locked_at timestamp with time zone,
    locked_by text,
    done_at timestamp with time zone,
    status integer,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.webhook_deliveries OWNER TO postgres;

ALTER TABLE public.webhook_deliveries ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.webhook_deliveries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);

-- webhooks --------------------------------------------------------------
CREATE TABLE public.webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    created_by uuid,
    url text NOT NULL,
    events text[] NOT NULL,
    secret text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    failures integer DEFAULT 0 NOT NULL,
    last_status integer,
    last_error text,
    last_delivered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT webhooks_events_check CHECK ((cardinality(events) > 0)),
    CONSTRAINT webhooks_url_check CHECK (((char_length(url) >= 10) AND (char_length(url) <= 2000)))
);

ALTER TABLE public.webhooks OWNER TO postgres;

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);

-- workspaces ------------------------------------------------------------
CREATE TABLE public.workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    queue jsonb DEFAULT '[]'::jsonb NOT NULL,
    plan text DEFAULT 'free'::text NOT NULL,
    plan_status text,
    stripe_customer_id text,
    stripe_subscription_id text,
    trial_ends_at timestamp with time zone DEFAULT (now() + '14 days'::interval),
    current_period_end timestamp with time zone,
    billing_interval text,
    credit_anchor timestamp with time zone,
    auto_topup_pack integer,
    auto_topup_max integer DEFAULT 2 NOT NULL,
    topup_wanted_at timestamp with time zone,
    CONSTRAINT workspaces_auto_topup_max_check CHECK (((auto_topup_max >= 1) AND (auto_topup_max <= 10))),
    CONSTRAINT workspaces_auto_topup_pack_check CHECK ((auto_topup_pack = ANY (ARRAY[1000, 5000, 20000]))),
    CONSTRAINT workspaces_billing_interval_check CHECK ((billing_interval = ANY (ARRAY['month'::text, 'year'::text]))),
    CONSTRAINT workspaces_plan_check CHECK ((plan = ANY (ARRAY['free'::text, 'creator'::text, 'pro'::text, 'agency'::text])))
);

ALTER TABLE public.workspaces OWNER TO postgres;

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);
