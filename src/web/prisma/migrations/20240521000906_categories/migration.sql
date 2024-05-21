/*
  Warnings:

  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `competition_problem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `competition_user` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[title]` on the table `competitions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `problems` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `start_time` on table `competitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `end_time` on table `competitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `competitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `problems` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timeout` on table `problems` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `submissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `source_code` on table `submissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `input` on table `test_cases` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expected_output` on table `test_cases` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `email` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "competitions" ALTER COLUMN "start_time" SET NOT NULL,
ALTER COLUMN "end_time" SET NOT NULL,
ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "problems" ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "timeout" SET NOT NULL;

-- AlterTable
ALTER TABLE "submissions" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "source_code" SET NOT NULL;

-- AlterTable
ALTER TABLE "test_cases" ALTER COLUMN "input" SET NOT NULL,
ALTER COLUMN "expected_output" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "username",
ADD COLUMN     "email" VARCHAR(255) NOT NULL,
ADD COLUMN     "emailVerified" TIMESTAMPTZ(6),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" VARCHAR(255) NOT NULL;

-- DropTable
DROP TABLE "competition_problem";

-- DropTable
DROP TABLE "competition_user";

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" BIGINT,
    "id_token" TEXT,
    "scope" TEXT,
    "session_state" TEXT,
    "token_type" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_problems" (
    "competition_id" INTEGER NOT NULL,
    "problem_id" INTEGER NOT NULL,

    CONSTRAINT "competition_problems_pkey" PRIMARY KEY ("competition_id","problem_id")
);

-- CreateTable
CREATE TABLE "competition_users" (
    "user_id" INTEGER NOT NULL,
    "competition_id" INTEGER NOT NULL,

    CONSTRAINT "competition_users_pkey" PRIMARY KEY ("user_id","competition_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,
    "sessionToken" VARCHAR(255) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "verification_token_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateIndex
CREATE UNIQUE INDEX "competitions_title_key" ON "competitions"("title");

-- CreateIndex
CREATE UNIQUE INDEX "problems_title_key" ON "problems"("title");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

-- AddForeignKey
ALTER TABLE "competition_problems" ADD CONSTRAINT "competition_problems_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "competition_problems" ADD CONSTRAINT "competition_problems_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "competition_users" ADD CONSTRAINT "competition_users_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "competition_users" ADD CONSTRAINT "competition_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
