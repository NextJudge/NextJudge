package main

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EnqueueState string

const (
	EnqueuePending EnqueueState = "pending"
	EnqueueQueued  EnqueueState = "queued"
	EnqueueFailed  EnqueueState = "failed"
)

type Status string

const (
	Pending             Status = "PENDING"
	Accepted            Status = "ACCEPTED"
	WrongAnswer         Status = "WRONG_ANSWER"
	TimeLimitExceeded   Status = "TIME_LIMIT_EXCEEDED"
	MemoryLimitExceeded Status = "MEMORY_LIMIT_EXCEEDED"
	RuntimeError        Status = "RUNTIME_ERROR"
	CompileTimeError    Status = "COMPILE_TIME_ERROR"
)

type Difficulty string

const (
	VeryEasy Difficulty = "VERY EASY"
	Easy     Difficulty = "EASY"
	Medium   Difficulty = "MEDIUM"
	Hard     Difficulty = "HARD"
	VeryHard Difficulty = "VERY HARD"
)

type ProblemState string

const (
	ProblemDraft     ProblemState = "draft"
	ProblemReview    ProblemState = "review"
	ProblemPublished ProblemState = "published"
	ProblemArchived  ProblemState = "archived"
)

type EditorialVisibility string

const (
	EditorialPublic     EditorialVisibility = "public"
	EditorialAfterSolve EditorialVisibility = "after_solve"
	EditorialAfterEvent EditorialVisibility = "after_event"
)

const DeletedUserDisplayName = "Deleted user"

type User struct {
	ID                uuid.UUID      `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	AccountIdentifier string         `json:"account_identifier"`
	Name              string         `json:"name"`
	Handle            string         `json:"handle"`
	HandleNormalized  string         `json:"-" gorm:"column:handle_normalized"`
	HandleChangedAt   *time.Time     `json:"handle_changed_at,omitempty"`
	Email             string         `json:"email"`
	EmailVerified     time.Time      `json:"emailVerified"`
	Image             string         `json:"image"`
	JoinDate          time.Time      `json:"join_date"`
	IsAdmin           bool           `json:"is_admin"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`
}

type UserRating struct {
	UserID        uuid.UUID `json:"user_id" gorm:"primaryKey;type:uuid"`
	Rating        int       `json:"rating"`
	MaxRating     int       `json:"max_rating"`
	ContestsRated int       `json:"contests_rated"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (UserRating) TableName() string {
	return "user_ratings"
}

type RatingEvent struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	EventID   *int       `json:"event_id,omitempty"`
	Name      string     `json:"name"`
	IsRated   bool       `json:"is_rated"`
	CreatedAt time.Time  `json:"created_at"`
}

func (RatingEvent) TableName() string {
	return "rating_events"
}

type RatingChange struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	RatingEventID uuid.UUID `json:"rating_event_id" gorm:"type:uuid"`
	UserID        uuid.UUID `json:"user_id" gorm:"type:uuid"`
	OldRating     int       `json:"old_rating"`
	NewRating     int       `json:"new_rating"`
	RatingDelta   int       `json:"rating_delta"`
	Rank          *int      `json:"rank,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

func (RatingChange) TableName() string {
	return "rating_changes"
}

type UserWithPassword struct {
	User
	PasswordHash []byte `gorm:"column:password_hash"`
	Salt         []byte
}

func (UserWithPassword) TableName() string {
	return "users"
}

type ProblemDescription struct {
	ID                      int        `json:"id"`
	Title                   string     `json:"title"`
	Identifier              string     `json:"identifier"`
	Prompt                  string     `json:"prompt"`
	Source                  string     `json:"source"`
	Difficulty              Difficulty `json:"difficulty"`
	UserID                  uuid.UUID  `json:"user_id"`
	UploadDate              time.Time  `json:"upload_date"`
	UpdatedAt               time.Time  `json:"updated_at"`
	DefaultAcceptTimeout    float64    `json:"default_accept_timeout"`
	DefaultExecutionTimeout float64    `json:"default_execution_timeout"`
	DefaultMemoryLimit      int          `json:"default_memory_timeout"`
	Public                  bool         `json:"public"`
	State                   ProblemState `json:"state" gorm:"type:problem_state;default:draft"`
}

func (ProblemDescription) TableName() string {
	return "problem_descriptions"
}

type ProblemDescriptionExt struct {
	ProblemDescription
	TestCases  []TestCase `json:"test_cases,omitempty" gorm:"foreignKey:ProblemID"`
	Categories []Category `json:"categories" gorm:"many2many:problem_categories;joinForeignKey:problem_id;joinReferences:category_id"`
}

func (ProblemDescriptionExt) TableName() string {
	return "problem_descriptions"
}

type Category struct {
	ID   uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	Name string    `json:"name"`
}

func (Category) TableName() string {
	return "categories"
}

type ProblemCategory struct {
	CategoryID uuid.UUID `json:"category_id"`
	ProblemID  int       `json:"problem_id"`
}

func (ProblemCategory) TableName() string {
	return "problem_categories"
}

type TestCase struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	ProblemID      int       `json:"problem_id"`
	Input          string    `json:"input"`
	Hidden         bool      `json:"hidden"`
	ExpectedOutput string    `json:"expected_output"`
}

func (TestCase) TableName() string {
	return "test_cases"
}

type ProblemRevision struct {
	ID                      uuid.UUID    `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	ProblemID               int          `json:"problem_id"`
	RevisionNumber          int          `json:"revision_number"`
	Title                   string       `json:"title"`
	Identifier              string       `json:"identifier"`
	Prompt                  string       `json:"prompt"`
	Source                  string       `json:"source"`
	Difficulty              Difficulty   `json:"difficulty"`
	State                   ProblemState `json:"state" gorm:"type:problem_state;default:draft"`
	DefaultAcceptTimeout    float64      `json:"default_accept_timeout"`
	DefaultExecutionTimeout float64      `json:"default_execution_timeout"`
	DefaultMemoryLimit      int          `json:"default_memory_limit"`
	Public                  bool         `json:"public"`
	CreatedAt               time.Time    `json:"created_at"`
	CreatedBy               *uuid.UUID   `json:"created_by,omitempty" gorm:"type:uuid"`
}

func (ProblemRevision) TableName() string {
	return "problem_revisions"
}

type Editorial struct {
	ID         uuid.UUID           `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	RevisionID uuid.UUID           `json:"revision_id" gorm:"type:uuid"`
	Content    string              `json:"content"`
	Visibility EditorialVisibility `json:"visibility" gorm:"type:editorial_visibility;default:after_solve"`
	CreatedAt  time.Time           `json:"created_at"`
	UpdatedAt  time.Time           `json:"updated_at"`
}

func (Editorial) TableName() string {
	return "editorials"
}

type EditorialWithRevision struct {
	Editorial
	Revision ProblemRevision `json:"revision" gorm:"foreignKey:RevisionID;references:ID"`
}

func (EditorialWithRevision) TableName() string {
	return "editorials"
}

type SubmissionTestCaseResult struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	SubmissionID uuid.UUID  `json:"submission_id"`
	RunID        *uuid.UUID `json:"run_id,omitempty"`
	TestCaseID   uuid.UUID  `json:"test_case_id"`
	Stdout       string     `json:"stdout"`
	Stderr       string     `json:"stderr"`
	Passed       bool       `json:"passed"`
}

func (SubmissionTestCaseResult) TableName() string {
	return "submission_test_case_results"
}

type SubmissionRun struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	SubmissionID  uuid.UUID  `json:"submission_id"`
	RunNumber     int        `json:"run_number"`
	Status        Status     `json:"status"`
	Reason        *string    `json:"reason,omitempty"`
	JudgeWorkerID *string    `json:"judge_worker_id,omitempty" gorm:"column:judge_worker_id"`
	Stdout        string     `json:"stdout"`
	Stderr        string     `json:"stderr"`
	TimeElapsed   *float32   `json:"time_elapsed,omitempty"`
	StartedAt     time.Time  `json:"started_at"`
	FinishedAt    *time.Time `json:"finished_at,omitempty"`
}

func (SubmissionRun) TableName() string {
	return "submission_runs"
}

type Submission struct {
	ID     uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	UserID uuid.UUID `json:"user_id"`
	User   *User     `json:"user" gorm:"foreignKey:UserID;references:ID"`
	// GORM magic - it will correlate ProblemID with Problem. Expicitly specifying the foreignKey here broke things.
	ProblemID int                    `json:"problem_id"`
	Problem   *ProblemDescriptionExt `json:"problem"`
	// Optional: reference to event if this submission is part of a contest
	EventID *int   `json:"event_id,omitempty"`
	Event   *Event `json:"event,omitempty"`
	// Optional: reference to event_problem for contest-specific settings
	EventProblemID *int             `json:"event_problem_id,omitempty"`
	EventProblem   *EventProblemExt `json:"event_problem,omitempty"`
	TimeElapsed    float32          `json:"time_elapsed"`
	LanguageID     uuid.UUID        `json:"language_id"`
	// gorm:"foreignKey:LanguageID;references:ID"
	Language *Language `json:"language"`
	Status   Status    `json:"status"`
	// gorm does not support optional relationships, so this must be managed manually
	FailedTestCaseID *uuid.UUID `json:"failed_test_case_id,omitempty"`
	SubmitTime       time.Time  `json:"submit_time"`
	SourceCode       string     `json:"source_code"`
	Stdout           string     `json:"stdout"`
	Stderr           string     `json:"stderr"`
	// per-test-case results stored in separate table
	TestCaseResults []SubmissionTestCaseResult `json:"test_case_results,omitempty" gorm:"foreignKey:SubmissionID"`
	EnqueueState    EnqueueState               `json:"enqueue_state" gorm:"type:enqueue_state;not null;default:pending"`
	EnqueuedAt      *time.Time                 `json:"enqueued_at,omitempty"`
	EnqueueAttempts int                        `json:"enqueue_attempts" gorm:"not null;default:0"`
}

type InputSubmission struct {
	ID              uuid.UUID    `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	UserID          *uuid.UUID   `json:"user_id,omitempty"`
	LanguageID      uuid.UUID    `json:"language_id"`
	SourceCode      string       `json:"source_code"`
	Stdin           string       `json:"stdin"`
	Status          Status       `json:"status"`
	Stdout          string       `json:"stdout"`
	Stderr          string       `json:"stderr"`
	Runtime         float64      `json:"runtime"`
	Finished        bool         `json:"finished"`
	CreatedAt       time.Time    `json:"created_at"`
	EnqueueState    EnqueueState `json:"enqueue_state" gorm:"type:enqueue_state;not null;default:pending"`
	EnqueuedAt      *time.Time   `json:"enqueued_at,omitempty"`
	EnqueueAttempts int          `json:"enqueue_attempts" gorm:"not null;default:0"`
}

func (InputSubmission) TableName() string {
	return "input_submissions"
}

type Language struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	Name      string    `json:"name"`
	Extension string    `json:"extension"`
	Version   string    `json:"version"`
}

type EventVisibility string

const (
	EventVisibilityPublic   EventVisibility = "public"
	EventVisibilityUnlisted EventVisibility = "unlisted"
	EventVisibilityPrivate  EventVisibility = "private"
)

type UpsolveMode string

const (
	UpsolveDisabled UpsolveMode = "disabled"
	UpsolveAfterEnd UpsolveMode = "after_end"
	UpsolveAlways   UpsolveMode = "always"
)

type EventRoleKind string

const (
	EventRoleOwner      EventRoleKind = "owner"
	EventRoleOrganizer  EventRoleKind = "organizer"
	EventRoleJudge      EventRoleKind = "judge"
	EventRoleModerator  EventRoleKind = "moderator"
)

type ParticipationMode string

const (
	ParticipationOfficial ParticipationMode = "official"
	ParticipationVirtual  ParticipationMode = "virtual"
	ParticipationPractice ParticipationMode = "practice"
)

type OutboxStatus string

const (
	OutboxPending    OutboxStatus = "pending"
	OutboxProcessing OutboxStatus = "processing"
	OutboxCompleted  OutboxStatus = "completed"
	OutboxFailed     OutboxStatus = "failed"
)

type Event struct {
	ID                 int              `json:"id" gorm:"primaryKey"`
	UserID             uuid.UUID        `json:"user_id"`
	Title              string           `json:"title"`
	Description        string           `json:"description"`
	StartTime          time.Time        `json:"start_time"`
	EndTime            time.Time        `json:"end_time"`
	Teams              bool             `json:"teams"`
	Visibility         EventVisibility  `json:"visibility" gorm:"type:event_visibility;default:public"`
	InviteCodeHash     []byte           `json:"-" gorm:"column:invite_code_hash"`
	RegistrationStart  *time.Time       `json:"registration_start,omitempty"`
	RegistrationEnd    *time.Time       `json:"registration_end,omitempty"`
	ParticipantLimit   *int             `json:"participant_limit,omitempty"`
	PenaltyMinutes     int              `json:"penalty_minutes" gorm:"default:20"`
	FreezeAt           *time.Time       `json:"freeze_at,omitempty"`
	UpsolveMode        UpsolveMode      `json:"upsolve_mode" gorm:"type:upsolve_mode;default:disabled"`
}

type EventWithProblems struct {
	Event
	// Teams    []EventTeam
	// Users    []User         `json:"participants,omitempty" gorm:"many2many:event_users"`
	Problems []EventProblem `json:"problems,omitempty" gorm:"foreignKey:EventID"`
}

type EventWithParticipants struct {
	Event
	Participants []User `json:"participants,omitempty"`
	ProblemCount int    `json:"problem_count,omitempty"`
}

func (EventWithProblems) TableName() string {
	return "events"
}

func (EventWithParticipants) TableName() string {
	return "events"
}

type EventWithProblemsExt struct {
	Event
	// Teams    []EventTeam
	// Users    []User         `json:"participants,omitempty" gorm:"many2many:event_users"`
	Problems []EventProblemExt `json:"problems,omitempty" gorm:"foreignKey:EventID"`
}

func (EventWithProblemsExt) TableName() string {
	return "events"
}

type EventProblem struct {
	ID               int      `json:"id" gorm:"primaryKey"`
	EventID          int      `json:"event_id"`
	ProblemID        int      `json:"problem_id"`
	Hidden           bool     `json:"hidden"`
	AcceptTimeout    *float64 `json:"accept_timeout"`
	ExecutionTimeout *float64 `json:"execution_timeout"`
	MemoryLimit      *int     `json:"memory_limit"`
}

type EventProblemExt struct {
	EventProblem
	Problem          *ProblemDescription `json:"problem" gorm:"foreignKey:ProblemID;references:ID"`
	AllowedLanguages []Language          `json:"languages,omitempty" gorm:"many2many:event_problem_languages"`
}

func (EventProblemExt) TableName() string {
	return "event_problems"
}

type EventProblemExtWithTests struct {
	EventProblem
	Problem          *ProblemDescriptionExt `json:"problem" gorm:"foreignKey:ProblemID;references:ID"`
	AllowedLanguages []Language             `json:"languages,omitempty" gorm:"many2many:event_problem_languages"`
}

func (EventProblemExtWithTests) TableName() string {
	return "event_problems"
}

type EventTeam struct {
	ID      uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	EventID int       `json:"event_id"`
	Name    string    `json:"name"`
}

type EventUser struct {
	UserID            uuid.UUID         `json:"user_id"`
	EventID           int               `json:"event_id"`
	TeamID            uuid.UUID         `json:"team_id,omitempty"`
	ParticipationMode ParticipationMode `json:"participation_mode" gorm:"type:participation_mode;default:official"`
}

func (EventUser) TableName() string {
	return "event_users"
}

type EventRole struct {
	UserID    uuid.UUID     `json:"user_id" gorm:"type:uuid"`
	EventID   int           `json:"event_id"`
	Role      EventRoleKind `json:"role" gorm:"type:event_role_kind"`
	CreatedAt time.Time     `json:"created_at"`
}

func (EventRole) TableName() string {
	return "event_roles"
}

type OutboxEvent struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	EventType     string    `json:"event_type"`
	AggregateType string    `json:"aggregate_type"`
	AggregateID   string    `json:"aggregate_id"`
	Payload       []byte    `json:"payload" gorm:"type:jsonb"`
	Status        string    `json:"status" gorm:"default:pending"`
	Attempts      int       `json:"attempts" gorm:"default:0"`
	LastError     *string   `json:"last_error,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	ProcessedAt   *time.Time `json:"processed_at,omitempty"`
}

func (OutboxEvent) TableName() string {
	return "outbox_events"
}

type EventQuestion struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	EventID    int        `json:"event_id"`
	UserID     uuid.UUID  `json:"user_id"`
	ProblemID  *int       `json:"problem_id,omitempty"`
	Question   string     `json:"question"`
	IsAnswered bool       `json:"is_answered"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	Answer     *string    `json:"answer,omitempty"`
	AnsweredAt *time.Time `json:"answered_at,omitempty"`
	AnsweredBy *uuid.UUID `json:"answered_by,omitempty"`
}

type EventQuestionExt struct {
	EventQuestion
	User     *User               `json:"user" gorm:"foreignKey:UserID;references:ID"`
	Problem  *ProblemDescription `json:"problem,omitempty" gorm:"foreignKey:ProblemID;references:ID"`
	Answerer *User               `json:"answerer,omitempty" gorm:"foreignKey:AnsweredBy;references:ID"`
}

func (EventQuestionExt) TableName() string {
	return "event_questions"
}

type Notification struct {
	ID               uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	UserID           uuid.UUID `json:"user_id"`
	EventID          int       `json:"event_id"`
	QuestionID       uuid.UUID `json:"question_id"`
	NotificationType string    `json:"notification_type"`
	IsRead           bool      `json:"is_read"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type NotificationExt struct {
	Notification
	Question *EventQuestionExt `json:"question" gorm:"foreignKey:QuestionID;references:ID"`
}

func (NotificationExt) TableName() string {
	return "notifications"
}

type CommunitySolutionStatus string

const (
	CommunitySolutionDraft     CommunitySolutionStatus = "draft"
	CommunitySolutionPublished CommunitySolutionStatus = "published"
	CommunitySolutionHidden    CommunitySolutionStatus = "hidden"
	CommunitySolutionRemoved   CommunitySolutionStatus = "removed"
)

type ModerationTargetType string

const (
	ModerationTargetCommunitySolution ModerationTargetType = "community_solution"
	ModerationTargetComment           ModerationTargetType = "comment"
	ModerationTargetUser              ModerationTargetType = "user"
)

type ReportStatus string

const (
	ReportPending   ReportStatus = "pending"
	ReportReviewed  ReportStatus = "reviewed"
	ReportDismissed ReportStatus = "dismissed"
	ReportActioned  ReportStatus = "actioned"
)

type ModerationQueueStatus string

const (
	ModerationQueuePending   ModerationQueueStatus = "pending"
	ModerationQueueInReview  ModerationQueueStatus = "in_review"
	ModerationQueueResolved  ModerationQueueStatus = "resolved"
	ModerationQueueDismissed ModerationQueueStatus = "dismissed"
)

type SimilarityCaseStatus string

const (
	SimilarityCasePending   SimilarityCaseStatus = "pending"
	SimilarityCaseReviewed  SimilarityCaseStatus = "reviewed"
	SimilarityCaseDismissed SimilarityCaseStatus = "dismissed"
	SimilarityCaseConfirmed SimilarityCaseStatus = "confirmed"
)

type IntegritySignalType string

const (
	IntegritySignalIPHash      IntegritySignalType = "ip_hash"
	IntegritySignalSessionHash IntegritySignalType = "session_hash"
)

type FingerprintStatus string

const (
	FingerprintPending  FingerprintStatus = "pending"
	FingerprintComputed FingerprintStatus = "computed"
	FingerprintFailed   FingerprintStatus = "failed"
)

const MaxCommentDepth = 5

type CommunitySolution struct {
	ID           uuid.UUID               `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	ProblemID    int                     `json:"problem_id"`
	UserID       uuid.UUID               `json:"user_id"`
	SubmissionID *uuid.UUID              `json:"submission_id,omitempty" gorm:"type:uuid"`
	LanguageID   *uuid.UUID              `json:"language_id,omitempty" gorm:"type:uuid"`
	Title        string                  `json:"title"`
	Explanation  string                  `json:"explanation"`
	SourceCode   string                  `json:"source_code,omitempty"`
	Status       CommunitySolutionStatus `json:"status" gorm:"type:community_solution_status;default:published"`
	CreatedAt    time.Time               `json:"created_at"`
	UpdatedAt    time.Time               `json:"updated_at"`
}

func (CommunitySolution) TableName() string {
	return "community_solutions"
}

type CommunitySolutionExt struct {
	CommunitySolution
	User       *User     `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Language   *Language `json:"language,omitempty" gorm:"foreignKey:LanguageID;references:ID"`
	VoteScore  int       `json:"vote_score" gorm:"-"`
	ViewerVote int       `json:"viewer_vote" gorm:"-"`
}

func (CommunitySolutionExt) TableName() string {
	return "community_solutions"
}

type SolutionVote struct {
	SolutionID uuid.UUID `json:"solution_id" gorm:"type:uuid"`
	UserID     uuid.UUID `json:"user_id" gorm:"type:uuid"`
	Vote       int16     `json:"vote"`
	CreatedAt  time.Time `json:"created_at"`
}

func (SolutionVote) TableName() string {
	return "solution_votes"
}

type Comment struct {
	ID                  uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	CommunitySolutionID uuid.UUID  `json:"community_solution_id" gorm:"type:uuid"`
	ParentID            *uuid.UUID `json:"parent_id,omitempty" gorm:"type:uuid"`
	UserID              uuid.UUID  `json:"user_id" gorm:"type:uuid"`
	Depth               int        `json:"depth"`
	Body                string     `json:"body"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
	DeletedAt           *time.Time `json:"deleted_at,omitempty"`
}

func (Comment) TableName() string {
	return "comments"
}

type CommentExt struct {
	Comment
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
}

func (CommentExt) TableName() string {
	return "comments"
}

type Report struct {
	ID         uuid.UUID            `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	ReporterID uuid.UUID            `json:"reporter_id" gorm:"type:uuid"`
	TargetType ModerationTargetType `json:"target_type" gorm:"type:moderation_target_type"`
	TargetID   uuid.UUID            `json:"target_id" gorm:"type:uuid"`
	Reason     string               `json:"reason"`
	Details    string               `json:"details,omitempty"`
	Status     ReportStatus         `json:"status" gorm:"type:report_status;default:pending"`
	CreatedAt  time.Time            `json:"created_at"`
	ReviewedAt *time.Time           `json:"reviewed_at,omitempty"`
	ReviewedBy *uuid.UUID           `json:"reviewed_by,omitempty" gorm:"type:uuid"`
}

func (Report) TableName() string {
	return "reports"
}

type ModerationQueueItem struct {
	ID         uuid.UUID             `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	TargetType ModerationTargetType  `json:"target_type" gorm:"type:moderation_target_type"`
	TargetID   uuid.UUID             `json:"target_id" gorm:"type:uuid"`
	ReportID   *uuid.UUID            `json:"report_id,omitempty" gorm:"type:uuid"`
	Reason     string                `json:"reason"`
	Priority   int                   `json:"priority"`
	Status     ModerationQueueStatus `json:"status" gorm:"type:moderation_queue_status;default:pending"`
	AssignedTo *uuid.UUID            `json:"assigned_to,omitempty" gorm:"type:uuid"`
	Notes      string                `json:"notes,omitempty"`
	CreatedAt  time.Time             `json:"created_at"`
	ResolvedAt *time.Time            `json:"resolved_at,omitempty"`
}

func (ModerationQueueItem) TableName() string {
	return "moderation_queue"
}

type SubmissionFingerprint struct {
	SubmissionID    uuid.UUID         `json:"submission_id" gorm:"type:uuid;primaryKey"`
	ProblemID       int               `json:"problem_id"`
	FingerprintHash string            `json:"fingerprint_hash"`
	Status          FingerprintStatus `json:"status" gorm:"type:fingerprint_status;default:pending"`
	ComputedAt      *time.Time        `json:"computed_at,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
}

func (SubmissionFingerprint) TableName() string {
	return "submission_fingerprints"
}

type SimilarityCase struct {
	ID                    uuid.UUID            `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	SubmissionID          uuid.UUID            `json:"submission_id" gorm:"type:uuid"`
	ComparedSubmissionID  uuid.UUID            `json:"compared_submission_id" gorm:"type:uuid"`
	SimilarityScore       float64              `json:"similarity_score"`
	Status                SimilarityCaseStatus `json:"status" gorm:"type:similarity_case_status;default:pending"`
	Notes                 string               `json:"notes,omitempty"`
	DetectedAt            time.Time            `json:"detected_at"`
	ReviewedAt            *time.Time           `json:"reviewed_at,omitempty"`
	ReviewedBy            *uuid.UUID           `json:"reviewed_by,omitempty" gorm:"type:uuid"`
}

func (SimilarityCase) TableName() string {
	return "similarity_cases"
}

type IntegritySignal struct {
	ID          uuid.UUID           `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	UserID      *uuid.UUID          `json:"user_id,omitempty" gorm:"type:uuid"`
	SubmissionID *uuid.UUID         `json:"submission_id,omitempty" gorm:"type:uuid"`
	EventID     *int                `json:"event_id,omitempty"`
	SignalType  IntegritySignalType `json:"signal_type" gorm:"type:integrity_signal_type"`
	SignalHash  string              `json:"signal_hash"`
	RecordedAt  time.Time           `json:"recorded_at"`
}

func (IntegritySignal) TableName() string {
	return "integrity_signals"
}

type OrgRole string

const (
	OrgRoleOwner      OrgRole = "owner"
	OrgRoleAdmin      OrgRole = "admin"
	OrgRoleInstructor OrgRole = "instructor"
	OrgRoleMember     OrgRole = "member"
)

type ClassRole string

const (
	ClassRoleInstructor ClassRole = "instructor"
	ClassRoleTA         ClassRole = "ta"
	ClassRoleStudent    ClassRole = "student"
)

type AssignmentLatePolicy string

const (
	LatePolicyNone           AssignmentLatePolicy = "none"
	LatePolicyAllowLate      AssignmentLatePolicy = "allow_late"
	LatePolicyPenaltyPerDay  AssignmentLatePolicy = "penalty_per_day"
)

type Organization struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	Slug        string     `json:"slug"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	CreatedBy   *uuid.UUID `json:"created_by,omitempty" gorm:"type:uuid"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (Organization) TableName() string {
	return "organizations"
}

type OrgMember struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	OrganizationID uuid.UUID `json:"organization_id" gorm:"type:uuid"`
	UserID         uuid.UUID `json:"user_id" gorm:"type:uuid"`
	Role           OrgRole   `json:"role" gorm:"type:org_role;default:member"`
	CreatedAt      time.Time `json:"created_at"`
	User           *User     `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
}

func (OrgMember) TableName() string {
	return "org_members"
}

type Class struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	OrganizationID uuid.UUID  `json:"organization_id" gorm:"type:uuid"`
	Name           string     `json:"name"`
	Description    string     `json:"description"`
	Term           string     `json:"term"`
	CreatedBy      *uuid.UUID `json:"created_by,omitempty" gorm:"type:uuid"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (Class) TableName() string {
	return "classes"
}

type ClassMember struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	ClassID   uuid.UUID `json:"class_id" gorm:"type:uuid"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid"`
	Role      ClassRole `json:"role" gorm:"type:class_role;default:student"`
	CreatedAt time.Time `json:"created_at"`
	User      *User     `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
}

func (ClassMember) TableName() string {
	return "class_members"
}

type Assignment struct {
	ID          uuid.UUID            `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	ClassID     uuid.UUID            `json:"class_id" gorm:"type:uuid"`
	RevisionID  uuid.UUID            `json:"revision_id" gorm:"type:uuid"`
	Title       string               `json:"title"`
	Description string               `json:"description"`
	DueAt       *time.Time           `json:"due_at,omitempty"`
	LatePolicy  AssignmentLatePolicy `json:"late_policy" gorm:"type:assignment_late_policy;default:none"`
	CreatedBy   *uuid.UUID           `json:"created_by,omitempty" gorm:"type:uuid"`
	CreatedAt   time.Time            `json:"created_at"`
	UpdatedAt   time.Time            `json:"updated_at"`
}

func (Assignment) TableName() string {
	return "assignments"
}

type APIToken struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	UserID      uuid.UUID  `json:"user_id" gorm:"type:uuid"`
	Name        string     `json:"name"`
	TokenPrefix string     `json:"token_prefix" gorm:"column:token_prefix"`
	TokenHash   []byte     `json:"-" gorm:"column:token_hash"`
	Scopes      []string   `json:"scopes" gorm:"type:text[]"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
	RevokedAt   *time.Time `json:"revoked_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (APIToken) TableName() string {
	return "api_tokens"
}

type APITokenPublic struct {
	ID         uuid.UUID  `json:"id"`
	UserID     uuid.UUID  `json:"user_id"`
	Name       string     `json:"name"`
	TokenPrefix string    `json:"token_prefix"`
	Scopes     []string   `json:"scopes"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	RevokedAt  *time.Time `json:"revoked_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type AuditEvent struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	ActorUserID  *uuid.UUID `json:"actor_user_id,omitempty" gorm:"type:uuid"`
	Action       string     `json:"action"`
	ResourceType string     `json:"resource_type"`
	ResourceID   string     `json:"resource_id"`
	Metadata     string     `json:"metadata" gorm:"type:jsonb;default:'{}'"`
	IPAddress    *string    `json:"ip_address,omitempty" gorm:"type:inet"`
	CreatedAt    time.Time  `json:"created_at"`
}

func (AuditEvent) TableName() string {
	return "audit_events"
}
