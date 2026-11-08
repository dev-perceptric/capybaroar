# Capybaroar database baseline

The full schema of the database on the Hostinger server, built on 2026-11-08 when the database moved off Supabase cloud.
A new database is these files run in order, then any migration added after this date.

| File | Holds |
|---|---|
| 00_extensions_schemas.sql | Extensions and the app's own schemas |
| 01_types.sql | Enum and composite types |
| 02_functions.sql | Functions |
| 03_tables.sql | Tables, each with its sequences, defaults and keys |
| 04_views.sql | Views |
| 05_keys_indexes.sql | Foreign keys and indexes |
| 06_triggers.sql | Triggers |
| 07_security.sql | Row level security, policies and grants |
| 08_realtime.sql | Tables sent over Realtime |

## Removed in the move

Nothing in the code, in another database function, view, policy, trigger or scheduled job used these.

Tables (68): `Announcement`, `AutoPost`, `Clipping`, `ClippingClip`, `ExisingPlugData`, `IntegrationsWebhooks`, `ItemUser`, `MessagesGroup`, `OAuthApp`, `OAuthAuthorization`, `OAuthSelfHostedAuthorization`, `OrderItems`, `PayoutProblems`, `Plugs`, `PopularPosts`, `Signatures`, `SocialMediaAgency`, `SocialMediaAgencyNiche`, `TagsPosts`, `ThirdParty`, `TrendingLog`, `UsedCodes`, `ai_cache`, `mastra_agent_versions`, `mastra_agents`, `mastra_ai_spans`, `mastra_background_tasks`, `mastra_channel_config`, `mastra_channel_installations`, `mastra_dataset_items`, `mastra_dataset_versions`, `mastra_datasets`, `mastra_evals`, `mastra_experiment_results`, `mastra_experiments`, `mastra_favorites`, `mastra_knowledge_activity`, `mastra_knowledge_cursors`, `mastra_knowledge_mentions`, `mastra_knowledge_nodes`, `mastra_knowledge_records`, `mastra_knowledge_semantic_outbox`, `mastra_mcp_client_versions`, `mastra_mcp_clients`, `mastra_mcp_server_versions`, `mastra_mcp_servers`, `mastra_messages`, `mastra_notifications`, `mastra_observational_memory`, `mastra_prompt_block_versions`, `mastra_prompt_blocks`, `mastra_resources`, `mastra_schedule_triggers`, `mastra_schedules`, `mastra_scorer_definition_versions`, `mastra_scorer_definitions`, `mastra_scorers`, `mastra_skill_blobs`, `mastra_skill_versions`, `mastra_skills`, `mastra_thread_state`, `mastra_threads`, `mastra_tool_provider_connections`, `mastra_traces`, `mastra_workflow_definitions`, `mastra_workflow_snapshot`, `mastra_workspace_versions`, `mastra_workspaces`

Functions (0): none

The removed tables were the leftover `mastra_*` tables and an older social-posting schema (Announcement, AutoPost, Plugs and others). None held rows.

## Migrations that had never run on the live database

These were in the repo but missing from the live database. They ran on the new one.

- 024_channel_groups.sql
- 025_credits.sql

The old Supabase project keeps everything above until it is deleted.
