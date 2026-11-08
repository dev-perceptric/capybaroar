-- capybaroar: types. Built from the running database. Unused objects were removed in the move (see README.md).
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

-- type: APPROVED_SUBMIT_FOR_ORDER
CREATE TYPE public."APPROVED_SUBMIT_FOR_ORDER" AS ENUM (
    'NO',
    'WAITING_CONFIRMATION',
    'YES'
);

ALTER TYPE public."APPROVED_SUBMIT_FOR_ORDER" OWNER TO postgres;

-- type: AnnouncementColor
CREATE TYPE public."AnnouncementColor" AS ENUM (
    'INFO',
    'WARNING',
    'ERROR'
);

ALTER TYPE public."AnnouncementColor" OWNER TO postgres;

-- type: CreationMethod
CREATE TYPE public."CreationMethod" AS ENUM (
    'UNKNOWN',
    'WEB',
    'MCP',
    'API',
    'AUTOPOST',
    'CLI'
);

ALTER TYPE public."CreationMethod" OWNER TO postgres;

-- type: From
CREATE TYPE public."From" AS ENUM (
    'BUYER',
    'SELLER'
);

ALTER TYPE public."From" OWNER TO postgres;

-- type: OrderStatus
CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'CANCELED',
    'COMPLETED'
);

ALTER TYPE public."OrderStatus" OWNER TO postgres;

-- type: Period
CREATE TYPE public."Period" AS ENUM (
    'MONTHLY',
    'YEARLY'
);

ALTER TYPE public."Period" OWNER TO postgres;

-- type: Provider
CREATE TYPE public."Provider" AS ENUM (
    'LOCAL',
    'GITHUB',
    'GOOGLE',
    'APPLE',
    'FARCASTER',
    'WALLET',
    'GENERIC'
);

ALTER TYPE public."Provider" OWNER TO postgres;

-- type: Role
CREATE TYPE public."Role" AS ENUM (
    'SUPERADMIN',
    'ADMIN',
    'USER'
);

ALTER TYPE public."Role" OWNER TO postgres;

-- type: ShortLinkPreference
CREATE TYPE public."ShortLinkPreference" AS ENUM (
    'ASK',
    'YES',
    'NO'
);

ALTER TYPE public."ShortLinkPreference" OWNER TO postgres;

-- type: State
CREATE TYPE public."State" AS ENUM (
    'QUEUE',
    'PUBLISHED',
    'ERROR',
    'DRAFT'
);

ALTER TYPE public."State" OWNER TO postgres;

-- type: SubscriptionTier
CREATE TYPE public."SubscriptionTier" AS ENUM (
    'STANDARD',
    'PRO',
    'TEAM',
    'ULTIMATE'
);

ALTER TYPE public."SubscriptionTier" OWNER TO postgres;
