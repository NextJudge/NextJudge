package main

import (
	cryptorand "crypto/rand"
	"fmt"
	"math/rand"
	"time"

	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/argon2"
)

const seedMarkerEmail = "seed-marker@nextjudge.dev"

// SeedDevData populates the database with realistic development data
func SeedDevData(database *Database) error {
	logrus.Info("Starting database seeding...")

	// check if already seeded
	existingUser, err := database.GetUserByEmail(seedMarkerEmail)
	if err != nil {
		return fmt.Errorf("error checking for existing seed: %w", err)
	}
	if existingUser != nil {
		logrus.Info("Database already seeded, skipping...")
		return nil
	}

	// get all languages and categories for reference
	languages, err := database.GetLanguages()
	if err != nil {
		return fmt.Errorf("error fetching languages: %w", err)
	}
	if len(languages) == 0 {
		return fmt.Errorf("no languages found in database - ensure init_prod_data.sql has run")
	}

	categories, err := database.GetCategories()
	if err != nil {
		return fmt.Errorf("error fetching categories: %w", err)
	}
	if len(categories) == 0 {
		return fmt.Errorf("no categories found in database - ensure init_prod_data.sql has run")
	}

	// seed users
	users, err := seedUsers(database)
	if err != nil {
		return fmt.Errorf("error seeding users: %w", err)
	}
	logrus.Infof("Created %d users", len(users))

	// seed problems
	problems, err := seedProblems(database, users, categories)
	if err != nil {
		return fmt.Errorf("error seeding problems: %w", err)
	}
	logrus.Infof("Created %d problems", len(problems))

	// seed events
	events, eventProblems, eventTeams, err := seedEvents(database, users, problems)
	if err != nil {
		return fmt.Errorf("error seeding events: %w", err)
	}
	logrus.Infof("Created %d events with %d event problems and %d teams", len(events), len(eventProblems), len(eventTeams))

	// seed submissions
	submissionCount, err := seedSubmissions(database, users, problems, events, eventProblems, languages)
	if err != nil {
		return fmt.Errorf("error seeding submissions: %w", err)
	}
	logrus.Infof("Created %d submissions", submissionCount)

	// seed event questions and notifications
	questionCount, err := seedEventQuestions(database, events, users, problems)
	if err != nil {
		return fmt.Errorf("error seeding event questions: %w", err)
	}
	logrus.Infof("Created %d event questions", questionCount)

	logrus.Info("Database seeding completed successfully!")
	return nil
}

func seedUsers(database *Database) ([]User, error) {
	users := []User{}
	firstNames := []string{"Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack",
		"Kate", "Liam", "Maya", "Noah", "Olivia", "Peter", "Quinn", "Rachel", "Sam", "Tara",
		"Uma", "Victor", "Wendy", "Xavier", "Yara", "Zoe", "Alex", "Blake", "Casey", "Drew",
		"Eli", "Finn", "Gwen", "Harper", "Ian", "Jordan", "Kelly", "Logan", "Morgan", "Nico",
		"Owen", "Parker", "Riley", "Sage", "Taylor", "Avery", "Cameron", "Dakota", "Emerson", "Finley"}
	lastNames := []string{"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
		"Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"}

	// generate salt once for all users so passwords are identical
	sharedSalt := make([]byte, 16)
	_, err := cryptorand.Read(sharedSalt)
	if err != nil {
		return nil, fmt.Errorf("error generating shared salt: %w", err)
	}
	sharedPasswordHash := argon2.IDKey([]byte("test123"), sharedSalt, 1, 64*1024, 4, 32)

	// create the seed marker user first
	markerUser, err := createUserWithPassword(database, "Seed Marker", seedMarkerEmail, false, sharedSalt, sharedPasswordHash)
	if err != nil {
		return nil, err
	}
	users = append(users, *markerUser)

	// create 50 users with varied names
	for i := 0; i < 50; i++ {
		firstName := firstNames[i%len(firstNames)]
		lastName := lastNames[i%len(lastNames)]
		name := fmt.Sprintf("%s %s", firstName, lastName)
		email := fmt.Sprintf("%s.%s%d@example.com", firstName, lastName, i)
		isAdmin := i < 5 // first 5 users are admins

		user, err := createUserWithPassword(database, name, email, isAdmin, sharedSalt, sharedPasswordHash)
		if err != nil {
			return nil, err
		}
		users = append(users, *user)
	}

	return users, nil
}

func createUserWithPassword(database *Database, name, email string, isAdmin bool, salt []byte, passwordHash []byte) (*User, error) {
	userWithPassword := UserWithPassword{
		User: User{
			AccountIdentifier: fmt.Sprintf("basic-%s", email),
			Name:              name,
			Email:             email,
			JoinDate:          time.Now().Add(-time.Duration(rand.Int63n(90)) * 24 * time.Hour),
			IsAdmin:           isAdmin,
		},
		Salt:         salt,
		PasswordHash: passwordHash,
	}

	createdUser, err := database.CreateUserWithPasswordHash(&userWithPassword)
	if err != nil {
		return nil, fmt.Errorf("error creating user %s: %w", name, err)
	}

	return createdUser, nil
}

func seedProblems(database *Database, users []User, categories []Category) ([]ProblemDescriptionExt, error) {
	problems := []ProblemDescriptionExt{}

	// reusable problem prompt template
	problemPrompt := `# Problem Statement

Write a function that solves the given problem efficiently.

## Example 1:

**Input:** ` + "`nums = [2,7,11,15]`" + `, ` + "`target = 9`" + `
**Output:** ` + "`[0,1]`" + `
**Explanation:** Because ` + "`nums[0] + nums[1] == 9`" + `, we return ` + "`[0, 1]`" + `.

## Example 2:

**Input:** ` + "`nums = [3,2,4]`" + `, ` + "`target = 6`" + `
**Output:** ` + "`[1,2]`" + `

## Constraints:

- $2 \leq \text{nums.length} \leq 10^4$
- $-10^9 \leq \text{nums[i]} \leq 10^9$
- $-10^9 \leq \text{target} \leq 10^9$

## Function Signature:

` + "```python" + `
def solve(nums: List[int], target: int) -> List[int]:
    pass
` + "```" + `
`

	difficulties := []Difficulty{VeryEasy, Easy, Medium, Hard, VeryHard}
	problemTitles := []string{
		"Two Sum", "Reverse String", "Valid Palindrome", "Merge Sorted Arrays", "Binary Search",
		"Maximum Subarray", "Climbing Stairs", "Best Time to Buy Stock", "Contains Duplicate", "Valid Anagram",
		"Group Anagrams", "Top K Frequent Elements", "Product of Array Except Self", "Longest Substring", "Longest Palindrome",
		"Container With Most Water", "3Sum", "Remove Nth Node", "Valid Parentheses", "Merge Two Lists",
		"Generate Parentheses", "Swap Nodes in Pairs", "Next Permutation", "Search in Rotated Array", "Find First Last Position",
		"Combination Sum", "Permutations", "Rotate Image", "Jump Game", "Unique Paths",
	}

	// reusable test cases
	testCaseTemplates := []struct {
		input    string
		output   string
		hidden   bool
	}{
		{"hello", "olleh", false},
		{"world", "dlrow", false},
		{"test", "tset", true},
		{"a", "a", true},
		{"12345", "54321", true},
		{"programming", "gnimmargorp", true},
	}

	for i, title := range problemTitles {
		difficulty := difficulties[i%len(difficulties)]
		userIdx := i % len(users)
		identifier := fmt.Sprintf("problem-%d", i+1)

		problem := ProblemDescriptionExt{
			ProblemDescription: ProblemDescription{
				Title:                   title,
				Identifier:              identifier,
				Prompt:                  problemPrompt,
				Source:                  "NextJudge Dev Seed",
				Difficulty:              difficulty,
				UserID:                  users[userIdx].ID,
				UploadDate:              time.Now().Add(-time.Duration(rand.Int63n(60)) * 24 * time.Hour),
				DefaultAcceptTimeout:    10.0,
				DefaultExecutionTimeout: 5.0,
				DefaultMemoryLimit:      256,
				Public:                  i < 20, // first 20 are public
			},
		}

		// assign 2-4 random categories
		numCategories := 2 + (i % 3)
		for j := 0; j < numCategories; j++ {
			catIdx := (i + j) % len(categories)
			problem.Categories = append(problem.Categories, categories[catIdx])
		}

		// create test cases
		numTestCases := 3 + (i % 4) // 3-6 test cases per problem
		for j := 0; j < numTestCases; j++ {
			tcIdx := j % len(testCaseTemplates)
			tc := testCaseTemplates[tcIdx]
			problem.TestCases = append(problem.TestCases, TestCase{
				ProblemID:      0, // will be set by GORM
				Input:          tc.input,
				ExpectedOutput: tc.output,
				Hidden:         tc.hidden,
			})
		}

		createdProblem, err := database.CreateProblemDescription(&problem)
		if err != nil {
			return nil, fmt.Errorf("error creating problem %s: %w", title, err)
		}

		problems = append(problems, *createdProblem)
	}

	return problems, nil
}

func seedEvents(database *Database, users []User, problems []ProblemDescriptionExt) ([]Event, []EventProblem, []EventTeam, error) {
	events := []Event{}
	allEventProblems := []EventProblem{}
	allEventTeams := []EventTeam{}

	now := time.Now()

	eventData := []struct {
		title       string
		description string
		startOffset time.Duration
		duration    time.Duration
		teams       bool
		minUsers    int
		maxUsers    int
	}{
		{"Spring Coding Challenge 2024", "Annual spring programming competition", -60 * 24 * time.Hour, 3 * time.Hour, false, 15, 35},
		{"Summer Hackathon", "Intense summer coding event", -30 * 24 * time.Hour, 5 * time.Hour, true, 20, 45},
		{"Fall Algorithm Contest", "Test your algorithm skills", -15 * 24 * time.Hour, 2 * time.Hour, false, 8, 25},
		{"Winter Code Sprint", "Year-end coding challenge", -7 * 24 * time.Hour, 4 * time.Hour, true, 25, 50},
		{"Weekly Practice Round #1", "Practice your skills", -3 * 24 * time.Hour, 90 * time.Minute, false, 5, 20},
		{"Weekly Practice Round #2", "More practice problems", -2 * 24 * time.Hour, 90 * time.Minute, false, 6, 18},
		{"Ongoing Marathon Contest", "Long-running competition", -1 * 24 * time.Hour, 7 * 24 * time.Hour, false, 30, 50},
		{"Today's Speed Challenge", "Fast-paced problem solving", -2 * time.Hour, 3 * time.Hour, false, 10, 30},
		{"Upcoming Team Battle", "Team vs team competition", 2 * 24 * time.Hour, 4 * time.Hour, true, 15, 40},
		{"Next Week's Championship", "Major championship event", 7 * 24 * time.Hour, 5 * time.Hour, true, 35, 50},
		{"Monthly Challenge - January", "Monthly coding challenge", 14 * 24 * time.Hour, 24 * time.Hour, false, 20, 45},
		{"Beginner Friendly Contest", "Perfect for newcomers", 21 * 24 * time.Hour, 2 * time.Hour, false, 12, 28},
		{"Advanced Algorithms Showdown", "For experienced coders", 28 * 24 * time.Hour, 3 * time.Hour, false, 8, 22},
		{"Corporate Coding Cup", "Inter-company competition", 35 * 24 * time.Hour, 4 * time.Hour, true, 25, 50},
		{"Grand Finale 2025", "Year's biggest event", 60 * 24 * time.Hour, 6 * time.Hour, true, 40, 50},
		{"Quick Fire Round #1", "Fast 30-minute challenge", -45 * 24 * time.Hour, 30 * time.Minute, false, 3, 12},
		{"Quick Fire Round #2", "Another quick challenge", -40 * 24 * time.Hour, 30 * time.Minute, false, 4, 15},
		{"Data Structures Masterclass", "Focus on data structures", -35 * 24 * time.Hour, 2 * time.Hour, false, 10, 25},
		{"Dynamic Programming Workshop", "DP problem solving", -25 * 24 * time.Hour, 2 * time.Hour, false, 7, 20},
		{"Graph Theory Contest", "Graph algorithms only", -20 * 24 * time.Hour, 3 * time.Hour, false, 9, 24},
		{"String Algorithms Battle", "String manipulation challenges", -18 * 24 * time.Hour, 2 * time.Hour, false, 6, 18},
		{"Number Theory Challenge", "Math-focused problems", -12 * 24 * time.Hour, 2 * time.Hour, false, 5, 15},
		{"Greedy Algorithms Contest", "Greedy approach problems", -10 * 24 * time.Hour, 90 * time.Minute, false, 8, 22},
		{"Backtracking Workshop", "Backtracking techniques", -8 * 24 * time.Hour, 2 * time.Hour, false, 7, 19},
		{"Divide and Conquer Challenge", "D&C algorithms", -6 * 24 * time.Hour, 2 * time.Hour, false, 9, 23},
		{"Bit Manipulation Contest", "Bitwise operations", -5 * 24 * time.Hour, 90 * time.Minute, false, 6, 16},
		{"Sliding Window Techniques", "Window-based problems", -4 * 24 * time.Hour, 2 * time.Hour, false, 8, 21},
		{"Two Pointers Mastery", "Two pointer problems", -1 * 24 * time.Hour, 90 * time.Minute, false, 7, 20},
		{"Hash Table Challenge", "Hash-based solutions", -12 * time.Hour, 2 * time.Hour, false, 10, 26},
		{"Binary Search Contest", "Binary search variations", -6 * time.Hour, 90 * time.Minute, false, 9, 24},
		{"Team Programming League", "Team competition", 1 * 24 * time.Hour, 4 * time.Hour, true, 20, 45},
		{"Pair Programming Challenge", "Two-person teams", 3 * 24 * time.Hour, 3 * time.Hour, true, 12, 30},
		{"Solo Speedrun", "Individual speed contest", 4 * 24 * time.Hour, 1 * time.Hour, false, 15, 35},
		{"Night Owl Contest", "Late night coding", 5 * 24 * time.Hour, 2 * time.Hour, false, 8, 22},
		{"Early Bird Challenge", "Morning competition", 6 * 24 * time.Hour, 90 * time.Minute, false, 6, 18},
		{"Weekend Warrior", "Weekend long contest", 8 * 24 * time.Hour, 6 * time.Hour, false, 25, 50},
		{"Midweek Madness", "Mid-week quick contest", 10 * 24 * time.Hour, 2 * time.Hour, false, 10, 28},
		{"Monthly Challenge - February", "February monthly", 18 * 24 * time.Hour, 24 * time.Hour, false, 18, 42},
		{"Monthly Challenge - March", "March monthly", 25 * 24 * time.Hour, 24 * time.Hour, false, 20, 45},
		{"Regional Qualifier", "Regional competition", 30 * 24 * time.Hour, 4 * time.Hour, false, 30, 50},
		{"National Championship", "National level event", 40 * 24 * time.Hour, 5 * time.Hour, true, 35, 50},
		{"International Open", "Global competition", 50 * 24 * time.Hour, 6 * time.Hour, true, 40, 50},
		{"Code Golf Tournament", "Shortest code wins", 55 * 24 * time.Hour, 3 * time.Hour, false, 12, 30},
		{"Debugging Challenge", "Find and fix bugs", 65 * 24 * time.Hour, 2 * time.Hour, false, 8, 20},
		{"Optimization Contest", "Fastest solution wins", 70 * 24 * time.Hour, 4 * time.Hour, false, 15, 35},
		{"Creative Solutions", "Unconventional approaches", 75 * 24 * time.Hour, 3 * time.Hour, false, 10, 25},
	}

	for i, ed := range eventData {
		startTime := now.Add(ed.startOffset)
		endTime := startTime.Add(ed.duration)
		userIdx := i % len(users)

		event := Event{
			UserID:      users[userIdx].ID,
			Title:       ed.title,
			Description: ed.description,
			StartTime:   startTime,
			EndTime:     endTime,
			Teams:       ed.teams,
		}

		eventWithProblems := EventWithProblems{
			Event: event,
		}

		createdEvent, err := database.CreateEvent(&eventWithProblems)
		if err != nil {
			return nil, nil, nil, fmt.Errorf("error creating event %s: %w", ed.title, err)
		}

		events = append(events, createdEvent.Event)

		// add 3-8 problems to each event
		numProblems := 3 + (i % 6)
		for j := 0; j < numProblems && j < len(problems); j++ {
			problemIdx := (i*5 + j) % len(problems)
			eventProblem := EventProblem{
				EventID:   createdEvent.ID,
				ProblemID: problems[problemIdx].ID,
				Hidden:    j >= numProblems-2, // last 2 problems are hidden
			}

			createdEventProblem, err := database.CreateEventProblem(&eventProblem)
			if err != nil {
				return nil, nil, nil, fmt.Errorf("error creating event problem: %w", err)
			}
			allEventProblems = append(allEventProblems, *createdEventProblem)
		}

		// add users to event with varied counts based on event type
		userRange := ed.maxUsers - ed.minUsers
		numParticipants := ed.minUsers + (i % (userRange + 1))
		if numParticipants > len(users) {
			numParticipants = len(users)
		}
		for j := 0; j < numParticipants; j++ {
			userIdx := (i*3 + j) % len(users)
			eventUser := EventUser{
				UserID:  users[userIdx].ID,
				EventID: createdEvent.ID,
			}

			_, err := database.CreateEventUser(&eventUser)
			if err != nil {
				// ignore duplicate key errors
				continue
			}
		}

		// create teams if it's a team event
		if ed.teams {
			numTeams := 5 + (i % 5)
			for j := 0; j < numTeams; j++ {
				teamName := fmt.Sprintf("Team %s-%d", string(rune('A'+j)), i)
				team, err := database.CreateTeam(createdEvent.ID, teamName)
				if err != nil {
					return nil, nil, nil, fmt.Errorf("error creating team: %w", err)
				}
				allEventTeams = append(allEventTeams, *team)
			}
		}
	}

	return events, allEventProblems, allEventTeams, nil
}

func seedSubmissions(database *Database, users []User, problems []ProblemDescriptionExt, events []Event, eventProblems []EventProblem, languages []Language) (int, error) {
	statuses := []Status{Accepted, WrongAnswer, TimeLimitExceeded, RuntimeError, CompileTimeError}

	sourceCodeTemplates := []string{
		`def solve(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
		`function solve(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
		`public int[] solve(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[] { map.get(complement), i };
        }
        map.put(nums[i], i);
    }
    return new int[] {};
}`,
	}

	count := 0
	now := time.Now()

	// create submissions for public problems (not tied to events)
	for i := 0; i < 200; i++ {
		userIdx := i % len(users)
		problemIdx := i % len(problems)
		langIdx := i % len(languages)
		statusIdx := i % len(statuses)
		codeIdx := i % len(sourceCodeTemplates)

		// submissions spread over last 90 days
		submitTime := now.Add(-time.Duration(rand.Int63n(90*24)) * time.Hour)

		submission := Submission{
			UserID:      users[userIdx].ID,
			ProblemID:   problems[problemIdx].ID,
			LanguageID:  languages[langIdx].ID,
			Status:      statuses[statusIdx],
			TimeElapsed: float32(rand.Float64() * 5.0), // 0-5 seconds
			SubmitTime:  submitTime,
			SourceCode:  sourceCodeTemplates[codeIdx],
			Stdout:      "Test output",
			Stderr:      "",
		}

		if statuses[statusIdx] != Accepted {
			submission.Stderr = "Error: test case failed"
		}

		_, err := database.CreateSubmission(&submission)
		if err != nil {
			return count, fmt.Errorf("error creating submission: %w", err)
		}
		count++
	}

	// create submissions for events
	for _, event := range events {
		// get event problems for this event
		evProblems, err := database.GetEventProblems(event.ID)
		if err != nil || len(evProblems) == 0 {
			continue
		}

		// get participants
		participants, err := database.GetEventParticipants(event.ID)
		if err != nil || len(participants) == 0 {
			continue
		}

		eventDuration := event.EndTime.Sub(event.StartTime)
		if eventDuration <= 0 {
			continue
		}

		// create varied participant performance profiles
		for _, user := range participants {
			// assign skill level based on user ID (deterministic but varied)
			// skill ranges from 0.0 (weak) to 1.0 (strong)
			userHash := int(user.ID.ID())
			skillLevel := float64(userHash%100) / 100.0

			// determine how many problems this participant will solve
			// strong participants solve 60-100% of problems
			// average solve 30-60%
			// weak solve 0-30%
			var solveRate float64
			if skillLevel > 0.7 {
				solveRate = 0.6 + (skillLevel-0.7)*1.33 // 0.6 to 1.0
			} else if skillLevel > 0.3 {
				solveRate = 0.3 + (skillLevel-0.3)*0.75 // 0.3 to 0.6
			} else {
				solveRate = skillLevel * 1.0 // 0.0 to 0.3
			}

			numProblemsToSolve := int(float64(len(evProblems)) * solveRate)
			if numProblemsToSolve > len(evProblems) {
				numProblemsToSolve = len(evProblems)
			}

			// determine which problems will be solved (shuffle and take first N)
			problemIndices := make([]int, len(evProblems))
			for i := range problemIndices {
				problemIndices[i] = i
			}
			// shuffle based on user ID for deterministic but varied selection
			for i := len(problemIndices) - 1; i > 0; i-- {
				j := (userHash + i) % (i + 1)
				problemIndices[i], problemIndices[j] = problemIndices[j], problemIndices[i]
			}

			solvedProblems := make(map[int]bool)
			for i := 0; i < numProblemsToSolve; i++ {
				solvedProblems[problemIndices[i]] = true
			}

			// determine how many problems will be attempted (but not solved)
			// participants attempt more problems than they solve
			attemptRate := solveRate + 0.2 + (float64(userHash%30))/100.0 // 0.2 to 0.5 additional
			if attemptRate > 1.0 {
				attemptRate = 1.0
			}
			numProblemsToAttempt := int(float64(len(evProblems)) * attemptRate)
			if numProblemsToAttempt > len(evProblems) {
				numProblemsToAttempt = len(evProblems)
			}

			// process each problem
			for problemIdx := 0; problemIdx < numProblemsToAttempt && problemIdx < len(evProblems); problemIdx++ {
				willSolve := solvedProblems[problemIdx]
				evProblem := evProblems[problemIdx]

				// find the event_problem id
				var eventProblemID *int
				for _, ep := range eventProblems {
					if ep.EventID == event.ID && ep.ProblemID == evProblem.ProblemID {
						eventProblemID = &ep.ID
						break
					}
				}

				// determine number of attempts for this problem
				var numAttempts int
				if willSolve {
					// solved problems: 1-8 attempts (stronger participants need fewer)
					// skill affects attempts needed
					baseAttempts := 1 + (userHash+problemIdx)%8
					if skillLevel > 0.6 {
						baseAttempts = 1 + (userHash+problemIdx)%4 // 1-4 for strong
					} else if skillLevel > 0.3 {
						baseAttempts = 1 + (userHash+problemIdx)%6 // 1-6 for average
					}
					numAttempts = baseAttempts
				} else {
					// unsolved problems: 1-5 wrong attempts
					numAttempts = 1 + (userHash+problemIdx)%5
				}

				// create submissions chronologically
				// for solved problems: generate random solve time under 2 hours
				// for unsolved problems: spread attempts reasonably
				var maxTimeWindow time.Duration
				if willSolve {
					// solved problems: random solve time between 5-120 minutes
					solveTimeMinutes := 5 + rand.Intn(116) // 5-120 minutes (random)
					maxTimeWindow = time.Duration(solveTimeMinutes) * time.Minute
				} else {
					// unsolved problems: spread over first 4 hours max
					maxTimeWindow = 4 * time.Hour
					if maxTimeWindow > eventDuration {
						maxTimeWindow = eventDuration
					}
				}

				// calculate time per attempt within the window
				timePerAttempt := maxTimeWindow / time.Duration(numAttempts+1)
				if timePerAttempt < time.Minute {
					timePerAttempt = time.Minute
				}

				for attemptNum := 0; attemptNum < numAttempts; attemptNum++ {
					// calculate submission time within the time window
					baseOffset := time.Duration(attemptNum) * timePerAttempt
					randomVariation := time.Duration(rand.Int63n(int64(timePerAttempt/2)))
					submitTime := event.StartTime.Add(baseOffset).Add(randomVariation)

					// ensure submitTime is within bounds
					if submitTime.Before(event.StartTime) {
						submitTime = event.StartTime
					}
					maxSubmitTime := event.StartTime.Add(maxTimeWindow)
					if submitTime.After(maxSubmitTime) {
						submitTime = maxSubmitTime.Add(-1 * time.Minute)
					}
					if submitTime.After(event.EndTime) {
						submitTime = event.EndTime.Add(-1 * time.Minute)
					}

					// determine status for this attempt
					var status Status
					if willSolve && attemptNum == numAttempts-1 {
						// last attempt for solved problems is accepted
						status = Accepted
					} else {
						// all other attempts are wrong
						// vary the error types
						errorTypes := []Status{WrongAnswer, TimeLimitExceeded, RuntimeError, CompileTimeError}
						status = errorTypes[(userHash+problemIdx+attemptNum)%len(errorTypes)]
					}

					langIdx := (userHash + problemIdx + attemptNum) % len(languages)
					codeIdx := (userHash + problemIdx + attemptNum) % len(sourceCodeTemplates)

					submission := Submission{
						UserID:         user.ID,
						ProblemID:      evProblem.ProblemID,
						EventID:        &event.ID,
						EventProblemID: eventProblemID,
						LanguageID:     languages[langIdx].ID,
						Status:         status,
						TimeElapsed:    float32(rand.Float64() * 5.0),
						SubmitTime:     submitTime,
						SourceCode:     sourceCodeTemplates[codeIdx],
						Stdout:         "Test output",
						Stderr:         "",
					}

					if status != Accepted {
						submission.Stderr = "Error: test case failed"
					}

					_, err := database.CreateSubmission(&submission)
					if err != nil {
						continue
					}
					count++
				}
			}
		}
	}

	return count, nil
}

func seedEventQuestions(database *Database, events []Event, users []User, problems []ProblemDescriptionExt) (int, error) {
	questions := []string{
		"Can you clarify the input format for this problem?",
		"What is the expected time complexity?",
		"Are there any edge cases we should be aware of?",
		"Can we use external libraries?",
		"What happens if the input is empty?",
		"Is there a penalty for wrong submissions?",
		"How is the scoring calculated?",
		"Can we submit in multiple languages?",
		"What is the memory limit for this problem?",
		"Are there any constraints on the solution approach?",
	}

	answers := []string{
		"The input format is described in the problem statement.",
		"We expect O(n log n) or better.",
		"Yes, please check for empty inputs and null values.",
		"Only standard libraries are allowed.",
		"Return an empty result for empty inputs.",
		"Yes, each wrong submission adds a time penalty.",
		"Scoring is based on correctness and submission time.",
		"Yes, you can submit in any supported language.",
		"The memory limit is 256 MB.",
		"No specific constraints, use any valid approach.",
	}

	count := 0

	// create questions for some events
	for i, event := range events {
		if i%2 != 0 { // only half the events have questions
			continue
		}

		participants, err := database.GetEventParticipants(event.ID)
		if err != nil || len(participants) == 0 {
			continue
		}

		evProblems, err := database.GetEventProblems(event.ID)
		if err != nil {
			continue
		}

		// create 2-5 questions per event
		numQuestions := 2 + (i % 4)
		for j := 0; j < numQuestions && j < len(questions); j++ {
			userIdx := j % len(participants)
			questionIdx := (i + j) % len(questions)

			var problemID *int
			if len(evProblems) > 0 && j%3 == 0 { // some questions are problem-specific
				probIdx := j % len(evProblems)
				problemID = &evProblems[probIdx].ProblemID
			}

			question := EventQuestion{
				EventID:    event.ID,
				UserID:     participants[userIdx].ID,
				ProblemID:  problemID,
				Question:   questions[questionIdx],
				IsAnswered: j < numQuestions-1, // last question is unanswered
				CreatedAt:  event.StartTime.Add(time.Duration(j*10) * time.Minute),
			}

			if question.IsAnswered {
				answerIdx := (i + j) % len(answers)
				answer := answers[answerIdx]
				question.Answer = &answer
				answeredTime := question.CreatedAt.Add(15 * time.Minute)
				question.AnsweredAt = &answeredTime
				// answered by first admin
				for _, user := range users {
					if user.IsAdmin {
						question.AnsweredBy = &user.ID
						break
					}
				}
			}

			createdQuestion, err := database.CreateEventQuestion(&question)
			if err != nil {
				continue
			}

			// create notifications
			if question.IsAnswered {
				err = database.CreateAnswerNotification(event.ID, createdQuestion.ID, participants[userIdx].ID)
				if err != nil {
					logrus.WithError(err).Warn("failed to create answer notification")
				}
			} else {
				err = database.CreateQuestionNotifications(event.ID, createdQuestion.ID, participants[userIdx].ID)
				if err != nil {
					logrus.WithError(err).Warn("failed to create question notifications")
				}
			}

			count++
		}
	}

	return count, nil
}
