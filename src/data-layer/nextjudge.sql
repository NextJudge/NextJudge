-- Auth.js required tables
CREATE TABLE verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
 
  PRIMARY KEY (identifier, token)
);
 
CREATE TABLE accounts (
  id SERIAL,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
 
  PRIMARY KEY (id)
);
 
CREATE TABLE sessions
(
  id SERIAL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
 
  PRIMARY KEY (id)
);

-- NextJudge Tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TYPE status AS ENUM(
  'ACCEPTED',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'COMPILE_TIME_ERROR',
  'PENDING'
);

CREATE TYPE difficulty as ENUM(
  'VERY EASY',
  'EASY',
  'MEDIUM',
  'HARD',
  'VERY HARD'
);

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "password_hash" varchar,
  "email" varchar(255) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  "image" TEXT,
  "join_date" timestamp,
  "is_admin" boolean
);

CREATE TABLE "problems" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" varchar NOT NULL UNIQUE,
  "prompt" varchar NOT NULL,
  "timeout" integer NOT NULL,
  "difficulty" difficulty NOT NULL,
  "user_id" UUID NOT NULL,
  "upload_date" timestamp NOT NULL
);

CREATE TABLE "submissions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "problem_id" UUID NOT NULL,
  "time_elapsed" integer NOT NULL,
  "language_id" UUID NOT NULL,
  "status" status NOT NULL,
  "failed_test_case_id" UUID,
  "submit_time" timestamp NOT NULL,
  "source_code" varchar NOT NULL
);

CREATE TABLE "test_cases" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "is_public" boolean NOT NULL,
  "problem_id" UUID NOT NULL,
  "input" varchar NOT NULL,
  "expected_output" varchar NOT NULL
);

CREATE TABLE "competitions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp NOT NULL,
  "description" varchar NOT NULL,
  "title" varchar NOT NULL UNIQUE
);

CREATE TABLE "competition_problems" (
  "competition_id" UUID NOT NULL,
  "problem_id" UUID NOT NULL,
  PRIMARY KEY("competition_id", "problem_id")
);

CREATE TABLE "competition_users" (
  "user_id" UUID NOT NULL,
  "competition_id" UUID NOT NULL,
  PRIMARY KEY("user_id", "competition_id")
);

CREATE TABLE "languages" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" varchar NOT NULL,
  "extension" varchar NOT NULL,
  "version" varchar NOT NULL
);

CREATE TABLE "categories" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" varchar NOT NULL
);

CREATE TABLE "problem_categories" (
  "category_id" UUID NOT NULL,
  "problem_id" UUID NOT NULL,
  PRIMARY KEY("category_id", "problem_id")
);

ALTER TABLE "problems" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "submissions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "submissions" ADD FOREIGN KEY ("problem_id") REFERENCES "problems" ("id") ON DELETE CASCADE;

ALTER TABLE "submissions" ADD FOREIGN KEY ("language_id") REFERENCES "languages" ("id") ON DELETE CASCADE;

ALTER TABLE "test_cases" ADD FOREIGN KEY ("problem_id") REFERENCES "problems" ("id") ON DELETE CASCADE;

ALTER TABLE "competitions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "submissions" ADD FOREIGN KEY ("failed_test_case_id") REFERENCES "test_cases" ("id") ON DELETE CASCADE;

ALTER TABLE "competition_problems" ADD FOREIGN KEY ("competition_id") REFERENCES "competitions" ("id") ON DELETE CASCADE;

ALTER TABLE "competition_problems" ADD FOREIGN KEY ("problem_id") REFERENCES "problems" ("id") ON DELETE CASCADE;

ALTER TABLE "competition_users" ADD FOREIGN KEY ("competition_id") REFERENCES "competitions" ("id") ON DELETE CASCADE;

ALTER TABLE "competition_users" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "problem_categories" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE;

ALTER TABLE "problem_categories" ADD FOREIGN KEY ("problem_id") REFERENCES "problems" ("id") ON DELETE CASCADE;