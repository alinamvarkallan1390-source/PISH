export const SCHEMA_STATEMENTS: string[] = [
  `CREATE SCHEMA IF NOT EXISTS nexora_msg`,
  `CREATE TABLE IF NOT EXISTS nexora_msg.users (
     id uuid PRIMARY KEY,
     username text UNIQUE NOT NULL,
     display_name text NOT NULL,
     password_hash text NOT NULL,
     avatar_emoji text NOT NULL DEFAULT '🦊',
     avatar_color text NOT NULL DEFAULT '#6366f1',
     bio text NOT NULL DEFAULT '',
     phone text,
     theme text NOT NULL DEFAULT 'dark',
     lang text NOT NULL DEFAULT 'fa',
     is_premium boolean NOT NULL DEFAULT false,
     last_seen timestamptz NOT NULL DEFAULT now(),
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS nexora_msg.chats (
     id uuid PRIMARY KEY,
     type text NOT NULL,
     title text,
     avatar_emoji text NOT NULL DEFAULT '💬',
     avatar_color text NOT NULL DEFAULT '#8b5cf6',
     username text UNIQUE,
     bio text NOT NULL DEFAULT '',
     owner_id uuid,
     bot_id uuid,
     is_public boolean NOT NULL DEFAULT false,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS nexora_msg.chat_members (
     chat_id uuid NOT NULL REFERENCES nexora_msg.chats(id) ON DELETE CASCADE,
     user_id uuid NOT NULL,
     role text NOT NULL DEFAULT 'member',
     last_read_seq bigint NOT NULL DEFAULT 0,
     muted boolean NOT NULL DEFAULT false,
     pinned boolean NOT NULL DEFAULT false,
     joined_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (chat_id, user_id)
   )`,
  `CREATE TABLE IF NOT EXISTS nexora_msg.messages (
     id uuid PRIMARY KEY,
     seq bigint GENERATED ALWAYS AS IDENTITY,
     chat_id uuid NOT NULL REFERENCES nexora_msg.chats(id) ON DELETE CASCADE,
     sender_id uuid,
     sender_bot_id uuid,
     kind text NOT NULL DEFAULT 'text',
     text text NOT NULL DEFAULT '',
     media_id uuid,
     reply_to_id uuid,
     forward_from text,
     edited_at timestamptz,
     deleted boolean NOT NULL DEFAULT false,
     pinned boolean NOT NULL DEFAULT false,
     meta jsonb NOT NULL DEFAULT '{}'::jsonb,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS messages_chat_seq_idx ON nexora_msg.messages (chat_id, seq)`,
  `CREATE TABLE IF NOT EXISTS nexora_msg.reactions (
     message_id uuid NOT NULL REFERENCES nexora_msg.messages(id) ON DELETE CASCADE,
     user_id uuid NOT NULL,
     emoji text NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (message_id, user_id, emoji)
   )`,
  `CREATE TABLE IF NOT EXISTS nexora_msg.media (
     id uuid PRIMARY KEY,
     owner_id uuid,
     mime text NOT NULL,
     name text,
     size integer NOT NULL,
     data bytea NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS nexora_msg.bots (
     id uuid PRIMARY KEY,
     owner_id uuid,
     username text UNIQUE NOT NULL,
     name text NOT NULL,
     token text UNIQUE NOT NULL,
     description text NOT NULL DEFAULT '',
     about text NOT NULL DEFAULT '',
     webhook_url text,
     webhook_secret text,
     commands jsonb NOT NULL DEFAULT '[]'::jsonb,
     is_builtin boolean NOT NULL DEFAULT false,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS nexora_msg.bot_updates (
     id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     bot_id uuid NOT NULL,
     payload jsonb NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS bot_updates_bot_idx ON nexora_msg.bot_updates (bot_id, id)`,
  `CREATE TABLE IF NOT EXISTS nexora_msg.typing (
     chat_id uuid NOT NULL,
     user_id uuid NOT NULL,
     until timestamptz NOT NULL,
     PRIMARY KEY (chat_id, user_id)
   )`,
  `CREATE TABLE IF NOT EXISTS nexora_msg.stickers (
     id uuid PRIMARY KEY,
     user_id uuid,
     emoji text NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
];
