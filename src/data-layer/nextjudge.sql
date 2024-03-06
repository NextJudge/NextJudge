CREATE TYPE status AS ENUM(
  'ACCEPTED',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'COMPILE_TIME_ERROR',
  'PENDING'
);

CREATE TABLE "user" (
  "id" SERIAL PRIMARY KEY,
  "username" varchar,
  "password_hash" varchar,
  "join_date" timestamp,
  "is_admin" boolean
);

CREATE TABLE "problem" (
  "id" SERIAL PRIMARY KEY,
  "title" varchar,
  "prompt" varchar,
  "timeout" integer,
  "user_id" integer,
  "upload_date" timestamp
);

CREATE TABLE "submission" (
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

CREATE TABLE "test_case" (
  "id" SERIAL PRIMARY KEY,
  "problem_id" integer,
  "input" varchar,
  "expected_output" varchar
);

CREATE TABLE "competition" (
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

CREATE TABLE "language" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar,
  "extension" varchar,
  "version" varchar
);

ALTER TABLE "problem" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "submission" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "submission" ADD FOREIGN KEY ("problem_id") REFERENCES "problem" ("id");

ALTER TABLE "submission" ADD FOREIGN KEY ("language_id") REFERENCES "language" ("id");

ALTER TABLE "test_case" ADD FOREIGN KEY ("problem_id") REFERENCES "problem" ("id");

ALTER TABLE "competition" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "submission" ADD FOREIGN KEY ("failed_test_case_id") REFERENCES "test_case" ("id");