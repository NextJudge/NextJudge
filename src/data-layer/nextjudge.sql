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
  "username" varchar,
  "password_hash" varchar,
  "join_date" timestamp,
  "is_admin" boolean
);

CREATE TABLE "problems" (
  "id" SERIAL PRIMARY KEY,
  "title" varchar,
  "prompt" varchar,
  "timeout" integer,
  "user_id" integer,
  "upload_date" timestamp
);

CREATE TABLE "submissions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" integer,
  "problem_id" integer,
  "time_elapsed" integer,
  "language_id" integer,
  "status" status,
  "failed_test_case_id" integer,
  "submit_time" timestamp,
  "source_code" varchar
);

CREATE TABLE "test_cases" (
  "id" SERIAL PRIMARY KEY,
  "problem_id" integer,
  "input" varchar,
  "expected_output" varchar
);

CREATE TABLE "competitions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" integer,
  "start_time" timestamp,
  "end_time" timestamp,
  "description" varchar,
  "title" varchar
);

CREATE TABLE "competition_problem" (
  "competition_id" integer,
  "problem_id" integer,
  PRIMARY KEY("competition_id", "problem_id")
);

CREATE TABLE "competition_user" (
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