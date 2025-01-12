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

CREATE TYPE FEEDBACK_POLICY as ENUM(
  'COMPLETE',
  'FIRST_ERROR'
);

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "account_identifier" varchar(255) NOT NULL UNIQUE,
  "email" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "password_hash" bytea,
  "salt" bytea,
  "email_verified" TIMESTAMPTZ,
  "image" TEXT,
  "join_date" timestamp,
  "is_admin" boolean
);

CREATE TABLE "problem_descriptions" (
  "id" SERIAL PRIMARY KEY,
  "title" varchar NOT NULL,
  "identifier" varchar NOT NULL UNIQUE,
  "prompt" varchar NOT NULL,
  -- A name or a link
  "source" varchar,
  "difficulty" difficulty NOT NULL,
  "user_id" UUID NOT NULL,
  "upload_date" timestamp NOT NULL,
  "default_accept_timeout" float NOT NULL,
  "default_execution_timeout" float NOT NULL,
  "default_memory_limit" integer NOT NULL
  -- "default_judging_policy" 
);

CREATE TABLE "submissions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  -- reference to event_problem
  "problem_id" integer NOT NULL,
  "time_elapsed" float NOT NULL,
  "language_id" UUID NOT NULL,
  "status" status NOT NULL,
  "failed_test_case_id" UUID,
  "submit_time" timestamp NOT NULL,
  "source_code" varchar NOT NULL,
  "stdout" varchar,
  "stderr" varchar
);

CREATE TABLE "test_cases" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "hidden" boolean NOT NULL,
  "problem_id" integer NOT NULL,
  "input" varchar NOT NULL,
  "expected_output" varchar NOT NULL
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
  "problem_id" integer NOT NULL,
  PRIMARY KEY("category_id", "problem_id")
);

CREATE TABLE "events" (
  "id" serial PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "title" varchar NOT NULL UNIQUE,
  "description" varchar NOT NULL,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp NOT NULL,
  "teams" boolean NOT NULL
  -- default_judging_policy
  -- default_show_all_results
);

CREATE TABLE "event_problems" (
  "id" serial PRIMARY KEY,
  "event_id" integer NOT NULL,
  -- An ID that gives the order of the problem for this event
  -- User's reference this problem using this ID in combination with the event id
  "event_problem_id" INTEGER NOT NULL,
  "problem_id" integer NOT NULL,
  "hidden" boolean NOT NULL,
  "accept_timeout" float,
  "execution_timeout" float,
  "memory_limit" integer
  -- judging_policy: [ICPC/all_results]
  -- show_all_results: [first failure/all results]
);

-- Allowed languages for a given problem
CREATE TABLE "event_problem_languages" (
  "event_problem_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "language_id" UUID NOT NULL
);

CREATE TABLE "event_users" (
  "user_id" UUID NOT NULL,
  "event_id" integer NOT NULL,
  "team_id" UUID,
  PRIMARY KEY("user_id", "event_id")
);

CREATE TABLE "event_teams" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "event_id" integer NOT NULL,
  "name" varchar NOT NULL
);

CREATE TABLE "group" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "type" varchar NOT NULL
);

CREATE TABLE "event_group" (
  "event_id" integer NOT NULL,
  "group_id" UUID NOT NULL,
  PRIMARY KEY("event_id", "group_id")
);

ALTER TABLE "problem_descriptions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "test_cases" ADD FOREIGN KEY ("problem_id") REFERENCES "problem_descriptions" ("id") ON DELETE CASCADE;

ALTER TABLE "submissions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "submissions" ADD FOREIGN KEY ("problem_id") REFERENCES "event_problems" ("id") ON DELETE CASCADE;

ALTER TABLE "submissions" ADD FOREIGN KEY ("language_id") REFERENCES "languages" ("id") ON DELETE CASCADE;

ALTER TABLE "submissions" ADD FOREIGN KEY ("failed_test_case_id") REFERENCES "test_cases" ("id") ON DELETE CASCADE;

ALTER TABLE "event_problems" ADD FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE;

ALTER TABLE "event_problems" ADD FOREIGN KEY ("problem_id") REFERENCES "problem_descriptions" ("id") ON DELETE CASCADE;

-- ALTER TABLE "events" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "event_users" ADD FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE;

ALTER TABLE "event_users" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "event_teams" ADD FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE;

ALTER TABLE "problem_categories" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE;

ALTER TABLE "problem_categories" ADD FOREIGN KEY ("problem_id") REFERENCES "problem_descriptions" ("id") ON DELETE CASCADE;

CREATE TABLE event_problem_id_max_problem_ids (
    event_id integer PRIMARY KEY,
    max_problem_id integer DEFAULT 0
);


-- Temporary way to make ID's
-- In future, this will be handled in the Go side, because we don't necessarily want
-- the values to be integers, but they could be strings
CREATE OR REPLACE FUNCTION update_row_order() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE event_problem_id_max_problem_ids
    SET max_problem_id = max_problem_id + 1
    WHERE event_id = NEW.event_id
    RETURNING max_problem_id INTO NEW.event_problem_id;

    IF NOT FOUND THEN
        INSERT INTO event_problem_id_max_problem_ids (event_id, max_problem_id)
        VALUES (NEW.event_id, 1)
        ON CONFLICT (event_id) DO NOTHING;

        NEW.event_problem_id := 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_row_order
BEFORE INSERT ON event_problems
FOR EACH ROW EXECUTE FUNCTION update_row_order();
