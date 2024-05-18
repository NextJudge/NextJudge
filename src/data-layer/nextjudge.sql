-- Auth.js required tables
REATE TABLE verification_token
(
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
 
  PRIMARY KEY (identifier, token)
);
 
CREATE TABLE accounts
(
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

CREATE TYPE status AS ENUM(
  'ACCEPTED',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'COMPILE_TIME_ERROR',
  'PENDING'
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "password_hash" varchar,
  "email" varchar(255) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  "image" TEXT,
  "join_date" timestamp,
  "is_admin" boolean
);

CREATE TABLE "problems" (
  "id" SERIAL PRIMARY KEY,
  "title" varchar NOT NULL UNIQUE,
  "prompt" varchar,
  "timeout" integer NOT NULL,
  "user_id" integer,
  "upload_date" timestamp
);

CREATE TABLE "submissions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" integer,
  "problem_id" integer,
  "time_elapsed" integer,
  "language_id" integer,
  "status" status NOT NULL,
  "failed_test_case_id" integer,
  "submit_time" timestamp,
  "source_code" varchar NOT NULL
);

CREATE TABLE "test_cases" (
  "id" SERIAL PRIMARY KEY,
  "problem_id" integer,
  "input" varchar NOT NULL,
  "expected_output" varchar NOT NULL
);

CREATE TABLE "competitions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" integer,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp NOT NULL,
  "description" varchar,
  "title" varchar NOT NULL UNIQUE
);

CREATE TABLE "competition_problems" (
  "competition_id" integer,
  "problem_id" integer,
  PRIMARY KEY("competition_id", "problem_id")
);

CREATE TABLE "competition_users" (
  "user_id" integer,
  "competition_id" integer,
  PRIMARY KEY("user_id", "competition_id")
);

CREATE TABLE "languages" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar,
  "extension" varchar,
  "version" varchar
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