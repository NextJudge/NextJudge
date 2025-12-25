---
title: Key Terms
description: Key terms used in the NextJudge framework.
---

The NextJudge framework uses a number of key terms throughout the documentation that may be unfamiliar to you. 

This page provides a brief overview of the key terms used in the NextJudge framework.

## Contest

A contest is a collection of problems. A contest can be public or private. A public contest is open to everyone. A private contest is only open to invited users.

## Problem

A problem is the lowest level of granularity in the NextJudge framework. A problem is a collection of test cases and additional metadata. A problem can be public or private. A public problem is open to everyone. A private problem is only open to the users of the contest that the problem belongs to.

## Submission

A submission is a solution to a problem. A submission is a collection of source code and additional metadata. A submission can be public or private. A public submission is open to everyone. A private submission is only open to the users of the contest that the submission belongs to.

## Test Case

A test case is a collection of input and output data. A test case is used to test a submission. Internally, a test case is a collection of files. Each problem has a number of test cases. When a submission is received, it is run against the test cases of the problem that it belongs to. Passing testcases are how we determine if a submission is correct or not.

## User

A user is a person who uses the NextJudge framework. A user can be a contestant or admin. A user can be a member of multiple contests. Users can be invited to private contests.

## Contestant

A contestant is a user who participates in a contest. A contestant can submit solutions to problems in a contest. A contestant can be a member of multiple contests. A contestant can be invited to private contests.

## Admin

An admin is a user who manages a contest. An admin can create, update, and delete problems in a contest. An admin can create, update, and delete contests. An admin can invite users to a contest. An admin can be a member of multiple contests. An admin can be invited to private contests.
