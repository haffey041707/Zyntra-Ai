// Production data contract. The hosted preview uses device-local state until
// a PostgreSQL connection is configured; apply this schema through Prisma or
// SQLAlchemy migrations in the production API service.
export const zyntraPostgresSchema = `
CREATE TABLE users (id uuid PRIMARY KEY, email text UNIQUE NOT NULL, password_hash text NOT NULL, display_name text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE conversations (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, title text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX conversations_user_updated_idx ON conversations(user_id, updated_at DESC);
CREATE TABLE messages (id uuid PRIMARY KEY, conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, role text NOT NULL CHECK(role IN ('system','user','assistant')), content jsonb NOT NULL, model text, token_count integer, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX messages_conversation_created_idx ON messages(conversation_id, created_at);
CREATE TABLE uploaded_files (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, storage_key text NOT NULL UNIQUE, original_name text NOT NULL, mime_type text NOT NULL, byte_size bigint NOT NULL, sha256 text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE learning_progress (user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id text NOT NULL, completed_at timestamptz, progress smallint NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100), PRIMARY KEY(user_id,lesson_id));
CREATE TABLE security_reports (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, file_id uuid REFERENCES uploaded_files(id), findings jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE usage_statistics (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, provider text NOT NULL, model text NOT NULL, input_tokens integer NOT NULL DEFAULT 0, output_tokens integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
`;
