/*
  Warnings:

  - Made the column `user_id` on table `competitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `competitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `languages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `extension` on table `languages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `version` on table `languages` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `difficulty` to the `problems` table without a default value. This is not possible if the table is not empty.
  - Made the column `prompt` on table `problems` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user_id` on table `problems` required. This step will fail if there are existing NULL values in that column.
  - Made the column `upload_date` on table `problems` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user_id` on table `submissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `problem_id` on table `submissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `time_elapsed` on table `submissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `language_id` on table `submissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `submit_time` on table `submissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `problem_id` on table `test_cases` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "difficulty" AS ENUM ('VERY EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY HARD');

-- AlterTable
ALTER TABLE "competitions" ALTER COLUMN "user_id" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "languages" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "extension" SET NOT NULL,
ALTER COLUMN "version" SET NOT NULL;

-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "difficulty" "difficulty" NOT NULL,
ALTER COLUMN "prompt" SET NOT NULL,
ALTER COLUMN "user_id" SET NOT NULL,
ALTER COLUMN "upload_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "submissions" ALTER COLUMN "user_id" SET NOT NULL,
ALTER COLUMN "problem_id" SET NOT NULL,
ALTER COLUMN "time_elapsed" SET NOT NULL,
ALTER COLUMN "language_id" SET NOT NULL,
ALTER COLUMN "submit_time" SET NOT NULL;

-- AlterTable
ALTER TABLE "test_cases" ALTER COLUMN "problem_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_categories" (
    "category_id" INTEGER NOT NULL,
    "problem_id" INTEGER NOT NULL,

    CONSTRAINT "problem_categories_pkey" PRIMARY KEY ("category_id","problem_id")
);

-- AddForeignKey
ALTER TABLE "problem_categories" ADD CONSTRAINT "problem_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "problem_categories" ADD CONSTRAINT "problem_categories_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
