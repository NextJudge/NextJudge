CREATE TABLE "user" (
  "id" SERIAL PRIMARY KEY,
  "username" varchar,
  "password_hash" varchar,
  "join_date" timestamp
);

CREATE TABLE "problem" (
  "id" integer PRIMARY KEY,
  "prompt" varchar,
  "timeout" integer,
  "user_id" integer,
  "upload_date" timestamp
);

CREATE TABLE "submission" (
  "id" integer PRIMARY KEY,
  "user_id" integer,
  "problem_id" integer,
  "time_elapsed" integer,
  "language" varchar,
  "status" varchar,
  "failed_test_case_id" integer,
  "submit_time" timestamp
);

CREATE TABLE "test_case" (
  "id" integer PRIMARY KEY,
  "problem_id" integer,
  "input" varchar,
  "expected_output" varchar
);

CREATE TABLE "competition" (
  "id" integer PRIMARY KEY,
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

ALTER TABLE "submission" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "submission" ADD FOREIGN KEY ("problem_id") REFERENCES "problem" ("id");

ALTER TABLE "test_case" ADD FOREIGN KEY ("problem_id") REFERENCES "problem" ("id");

ALTER TABLE "competition" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "submission" ADD FOREIGN KEY ("failed_test_case_id") REFERENCES "test_case" ("id");