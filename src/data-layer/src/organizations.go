package main

import (
	"encoding/csv"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"

	"main/src/api"
)

var orgSlugPattern = regexp.MustCompile(`^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$`)

func addOrganizationRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/v1/organizations"), AuthRequired(listOrganizations))
	mux.HandleFunc(pat.Post("/v1/organizations"), AuthRequired(createOrganization))
	mux.HandleFunc(pat.Get("/v1/organizations/:org_id"), AuthRequired(getOrganization))
	mux.HandleFunc(pat.Put("/v1/organizations/:org_id"), AuthRequired(updateOrganization))
	mux.HandleFunc(pat.Delete("/v1/organizations/:org_id"), AuthRequired(deleteOrganization))

	mux.HandleFunc(pat.Get("/v1/organizations/:org_id/members"), AuthRequired(listOrgMembers))
	mux.HandleFunc(pat.Post("/v1/organizations/:org_id/members"), AuthRequired(addOrgMember))
	mux.HandleFunc(pat.Delete("/v1/organizations/:org_id/members/:user_id"), AuthRequired(removeOrgMember))

	mux.HandleFunc(pat.Get("/v1/organizations/:org_id/classes"), AuthRequired(listOrganizationClasses))
	mux.HandleFunc(pat.Post("/v1/organizations/:org_id/classes"), AuthRequired(createClass))

	mux.HandleFunc(pat.Get("/v1/classes/:class_id"), AuthRequired(getClass))
	mux.HandleFunc(pat.Put("/v1/classes/:class_id"), AuthRequired(updateClass))
	mux.HandleFunc(pat.Delete("/v1/classes/:class_id"), AuthRequired(deleteClass))

	mux.HandleFunc(pat.Get("/v1/classes/:class_id/members"), AuthRequired(listClassMembers))
	mux.HandleFunc(pat.Post("/v1/classes/:class_id/members"), AuthRequired(addClassMember))
	mux.HandleFunc(pat.Delete("/v1/classes/:class_id/members/:user_id"), AuthRequired(removeClassMember))
	mux.HandleFunc(pat.Post("/v1/classes/:class_id/roster/import"), AuthRequired(importClassRoster))

	mux.HandleFunc(pat.Get("/v1/classes/:class_id/assignments"), AuthRequired(listAssignments))
	mux.HandleFunc(pat.Post("/v1/classes/:class_id/assignments"), AuthRequired(createAssignment))
	mux.HandleFunc(pat.Get("/v1/assignments/:assignment_id"), AuthRequired(getAssignment))
	mux.HandleFunc(pat.Put("/v1/assignments/:assignment_id"), AuthRequired(updateAssignment))
	mux.HandleFunc(pat.Delete("/v1/assignments/:assignment_id"), AuthRequired(deleteAssignment))
}

func parseUUIDParam(r *http.Request, name string) (uuid.UUID, error) {
	return uuid.Parse(pat.Param(r, name))
}

func isPlatformAdmin(claims *NextJudgeClaims) bool {
	return claims != nil && claims.Role == AdminRoleEnum
}

func canManageOrganization(claims *NextJudgeClaims, orgID uuid.UUID) bool {
	if isPlatformAdmin(claims) {
		return true
	}
	member, err := db.GetOrgMember(orgID, claims.Id)
	if err != nil || member == nil {
		return false
	}
	return member.Role == OrgRoleOwner || member.Role == OrgRoleAdmin
}

func canViewOrganization(claims *NextJudgeClaims, orgID uuid.UUID) bool {
	if isPlatformAdmin(claims) {
		return true
	}
	member, err := db.GetOrgMember(orgID, claims.Id)
	return err == nil && member != nil
}

func canManageClass(claims *NextJudgeClaims, class *Class) bool {
	if class == nil {
		return false
	}
	if isPlatformAdmin(claims) {
		return true
	}
	orgMember, err := db.GetOrgMember(class.OrganizationID, claims.Id)
	if err == nil && orgMember != nil {
		if orgMember.Role == OrgRoleOwner || orgMember.Role == OrgRoleAdmin || orgMember.Role == OrgRoleInstructor {
			return true
		}
	}
	classMember, err := db.GetClassMember(class.ID, claims.Id)
	if err == nil && classMember != nil {
		return classMember.Role == ClassRoleInstructor || classMember.Role == ClassRoleTA
	}
	return false
}

func canViewClass(claims *NextJudgeClaims, class *Class) bool {
	if canManageClass(claims, class) {
		return true
	}
	classMember, err := db.GetClassMember(class.ID, claims.Id)
	return err == nil && classMember != nil
}

type createOrganizationRequest struct {
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func listOrganizations(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	orgs, err := db.ListOrganizationsForUser(claims.Id, isPlatformAdmin(claims))
	if err != nil {
		logrus.WithError(err).Error("error listing organizations")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error listing organizations", nil)
		return
	}
	WriteJSON(w, http.StatusOK, orgs)
}

func createOrganization(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	req := new(createOrganizationRequest)
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_JSON", "invalid JSON", nil)
		return
	}

	slug := strings.TrimSpace(strings.ToLower(req.Slug))
	name := strings.TrimSpace(req.Name)
	if slug == "" || name == "" {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INPUT_REQUIRED", "slug and name are required", nil)
		return
	}
	if !orgSlugPattern.MatchString(slug) {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_SLUG", "slug must be lowercase alphanumeric with hyphens", nil)
		return
	}

	existing, err := db.GetOrganizationBySlug(slug)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "database error", nil)
		return
	}
	if existing != nil {
		api.WriteAPIError(w, r, http.StatusConflict, "ORG_EXISTS", "organization slug already exists", nil)
		return
	}

	org := &Organization{
		Slug:        slug,
		Name:        name,
		Description: strings.TrimSpace(req.Description),
		CreatedBy:   &claims.Id,
	}
	if err := db.CreateOrganization(org); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create organization", nil)
		return
	}

	member := &OrgMember{
		OrganizationID: org.ID,
		UserID:         claims.Id,
		Role:           OrgRoleOwner,
	}
	if err := db.AddOrgMember(member); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to add org owner", nil)
		return
	}

	recordAuditEvent(claims.Id, "organization.create", "organization", org.ID.String(), r)
	WriteJSON(w, http.StatusCreated, org)
}

func getOrganization(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	orgID, err := parseUUIDParam(r, "org_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid org_id", nil)
		return
	}
	if !canViewOrganization(claims, orgID) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	org, err := db.GetOrganizationByID(orgID)
	if err != nil || org == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "organization not found", nil)
		return
	}
	WriteJSON(w, http.StatusOK, org)
}

func updateOrganization(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	orgID, err := parseUUIDParam(r, "org_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid org_id", nil)
		return
	}
	if !canManageOrganization(claims, orgID) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	org, err := db.GetOrganizationByID(orgID)
	if err != nil || org == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "organization not found", nil)
		return
	}

	var req createOrganizationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_JSON", "invalid JSON", nil)
		return
	}
	if strings.TrimSpace(req.Name) != "" {
		org.Name = strings.TrimSpace(req.Name)
	}
	if req.Description != "" {
		org.Description = strings.TrimSpace(req.Description)
	}
	if err := db.UpdateOrganization(org); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to update organization", nil)
		return
	}
	recordAuditEvent(claims.Id, "organization.update", "organization", org.ID.String(), r)
	WriteJSON(w, http.StatusOK, org)
}

func deleteOrganization(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	orgID, err := parseUUIDParam(r, "org_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid org_id", nil)
		return
	}
	if !canManageOrganization(claims, orgID) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	if err := db.DeleteOrganization(orgID); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to delete organization", nil)
		return
	}
	recordAuditEvent(claims.Id, "organization.delete", "organization", orgID.String(), r)
	w.WriteHeader(http.StatusNoContent)
}

type orgMemberRequest struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Role   OrgRole   `json:"role"`
}

func listOrgMembers(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	orgID, err := parseUUIDParam(r, "org_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid org_id", nil)
		return
	}
	if !canViewOrganization(claims, orgID) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	members, err := db.ListOrgMembers(orgID)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to list members", nil)
		return
	}
	WriteJSON(w, http.StatusOK, members)
}

func addOrgMember(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	orgID, err := parseUUIDParam(r, "org_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid org_id", nil)
		return
	}
	if !canManageOrganization(claims, orgID) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	req := new(orgMemberRequest)
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_JSON", "invalid JSON", nil)
		return
	}

	userID := req.UserID
	if userID == uuid.Nil && strings.TrimSpace(req.Email) != "" {
		user, err := db.GetUserByEmail(strings.TrimSpace(req.Email))
		if err != nil || user == nil {
			api.WriteAPIError(w, r, http.StatusNotFound, "USER_NOT_FOUND", "user not found", nil)
			return
		}
		userID = user.ID
	}
	if userID == uuid.Nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INPUT_REQUIRED", "user_id or email required", nil)
		return
	}

	role := req.Role
	if role == "" {
		role = OrgRoleMember
	}

	member := &OrgMember{
		OrganizationID: orgID,
		UserID:         userID,
		Role:           role,
	}
	if err := db.AddOrgMember(member); err != nil {
		api.WriteAPIError(w, r, http.StatusConflict, "MEMBER_EXISTS", "member already exists", nil)
		return
	}
	WriteJSON(w, http.StatusCreated, member)
}

func removeOrgMember(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	orgID, err := parseUUIDParam(r, "org_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid org_id", nil)
		return
	}
	userID, err := parseUUIDParam(r, "user_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid user_id", nil)
		return
	}
	if !canManageOrganization(claims, orgID) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	if err := db.RemoveOrgMember(orgID, userID); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to remove member", nil)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type createClassRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Term        string `json:"term"`
}

func listOrganizationClasses(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	orgID, err := parseUUIDParam(r, "org_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid org_id", nil)
		return
	}
	if !canViewOrganization(claims, orgID) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	classes, err := db.ListClassesForOrganization(orgID)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to list classes", nil)
		return
	}
	WriteJSON(w, http.StatusOK, classes)
}

func createClass(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	orgID, err := parseUUIDParam(r, "org_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid org_id", nil)
		return
	}
	if !canManageOrganization(claims, orgID) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	req := new(createClassRequest)
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_JSON", "invalid JSON", nil)
		return
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INPUT_REQUIRED", "name is required", nil)
		return
	}

	class := &Class{
		OrganizationID: orgID,
		Name:           name,
		Description:    strings.TrimSpace(req.Description),
		Term:           strings.TrimSpace(req.Term),
		CreatedBy:      &claims.Id,
	}
	if err := db.CreateClass(class); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create class", nil)
		return
	}

	instructor := &ClassMember{
		ClassID: class.ID,
		UserID:  claims.Id,
		Role:    ClassRoleInstructor,
	}
	_ = db.AddClassMember(instructor)

	recordAuditEvent(claims.Id, "class.create", "class", class.ID.String(), r)
	WriteJSON(w, http.StatusCreated, class)
}

func getClassHandler(classID uuid.UUID) (*Class, error) {
	return db.GetClassByID(classID)
}

func getClass(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	classID, err := parseUUIDParam(r, "class_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid class_id", nil)
		return
	}

	class, err := getClassHandler(classID)
	if err != nil || class == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "class not found", nil)
		return
	}
	if !canViewClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}
	WriteJSON(w, http.StatusOK, class)
}

func updateClass(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	classID, err := parseUUIDParam(r, "class_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid class_id", nil)
		return
	}

	class, err := getClassHandler(classID)
	if err != nil || class == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "class not found", nil)
		return
	}
	if !canManageClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	req := new(createClassRequest)
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_JSON", "invalid JSON", nil)
		return
	}
	if strings.TrimSpace(req.Name) != "" {
		class.Name = strings.TrimSpace(req.Name)
	}
	if req.Description != "" {
		class.Description = strings.TrimSpace(req.Description)
	}
	if req.Term != "" {
		class.Term = strings.TrimSpace(req.Term)
	}
	if err := db.UpdateClass(class); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to update class", nil)
		return
	}
	WriteJSON(w, http.StatusOK, class)
}

func deleteClass(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	classID, err := parseUUIDParam(r, "class_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid class_id", nil)
		return
	}

	class, err := getClassHandler(classID)
	if err != nil || class == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "class not found", nil)
		return
	}
	if !canManageClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	if err := db.DeleteClass(classID); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to delete class", nil)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type classMemberRequest struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Name   string    `json:"name"`
	Role   ClassRole `json:"role"`
}

func listClassMembers(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	classID, err := parseUUIDParam(r, "class_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid class_id", nil)
		return
	}

	class, err := getClassHandler(classID)
	if err != nil || class == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "class not found", nil)
		return
	}
	if !canViewClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	members, err := db.ListClassMembers(classID)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to list members", nil)
		return
	}
	WriteJSON(w, http.StatusOK, members)
}

func addClassMember(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	classID, err := parseUUIDParam(r, "class_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid class_id", nil)
		return
	}

	class, err := getClassHandler(classID)
	if err != nil || class == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "class not found", nil)
		return
	}
	if !canManageClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	req := new(classMemberRequest)
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_JSON", "invalid JSON", nil)
		return
	}

	userID := req.UserID
	if userID == uuid.Nil && strings.TrimSpace(req.Email) != "" {
		user, err := db.GetOrCreateRosterUser(req.Email, req.Name)
		if err != nil || user == nil {
			api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to resolve user", nil)
			return
		}
		userID = user.ID
	}
	if userID == uuid.Nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INPUT_REQUIRED", "user_id or email required", nil)
		return
	}

	role := req.Role
	if role == "" {
		role = ClassRoleStudent
	}

	member := &ClassMember{
		ClassID: classID,
		UserID:  userID,
		Role:    role,
	}
	if err := db.AddClassMember(member); err != nil {
		api.WriteAPIError(w, r, http.StatusConflict, "MEMBER_EXISTS", "member already exists", nil)
		return
	}
	WriteJSON(w, http.StatusCreated, member)
}

func removeClassMember(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	classID, err := parseUUIDParam(r, "class_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid class_id", nil)
		return
	}
	userID, err := parseUUIDParam(r, "user_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid user_id", nil)
		return
	}

	class, err := getClassHandler(classID)
	if err != nil || class == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "class not found", nil)
		return
	}
	if !canManageClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	if err := db.RemoveClassMember(classID, userID); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to remove member", nil)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type rosterImportResult struct {
	Added   int      `json:"added"`
	Skipped int      `json:"skipped"`
	Errors  []string `json:"errors"`
}

func importClassRoster(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	classID, err := parseUUIDParam(r, "class_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid class_id", nil)
		return
	}

	class, err := getClassHandler(classID)
	if err != nil || class == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "class not found", nil)
		return
	}
	if !canManageClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_BODY", "invalid body", nil)
		return
	}

	reader := csv.NewReader(strings.NewReader(string(body)))
	reader.TrimLeadingSpace = true
	records, err := reader.ReadAll()
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_CSV", "invalid CSV", nil)
		return
	}

	result := rosterImportResult{Errors: []string{}}
	for i, row := range records {
		if len(row) == 0 {
			continue
		}
		if i == 0 && strings.EqualFold(strings.TrimSpace(row[0]), "email") {
			continue
		}

		email := ""
		name := ""
		role := ClassRoleStudent
		if len(row) > 0 {
			email = strings.TrimSpace(row[0])
		}
		if len(row) > 1 {
			name = strings.TrimSpace(row[1])
		}
		if len(row) > 2 {
			switch strings.ToLower(strings.TrimSpace(row[2])) {
			case "instructor":
				role = ClassRoleInstructor
			case "ta":
				role = ClassRoleTA
			}
		}

		user, err := db.GetOrCreateRosterUser(email, name)
		if err != nil || user == nil {
			result.Errors = append(result.Errors, "row "+strconv.Itoa(i+1)+": invalid email")
			continue
		}

		member := &ClassMember{
			ClassID: classID,
			UserID:  user.ID,
			Role:    role,
		}
		if err := db.AddClassMember(member); err != nil {
			result.Skipped++
			continue
		}
		result.Added++
	}

	recordAuditEvent(claims.Id, "class.roster_import", "class", classID.String(), r)
	WriteJSON(w, http.StatusOK, result)
}

type createAssignmentRequest struct {
	RevisionID  uuid.UUID            `json:"revision_id"`
	Title       string               `json:"title"`
	Description string               `json:"description"`
	DueAt       *time.Time           `json:"due_at"`
	LatePolicy  AssignmentLatePolicy `json:"late_policy"`
}

func listAssignments(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	classID, err := parseUUIDParam(r, "class_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid class_id", nil)
		return
	}

	class, err := getClassHandler(classID)
	if err != nil || class == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "class not found", nil)
		return
	}
	if !canViewClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	assignments, err := db.ListAssignmentsForClass(classID)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to list assignments", nil)
		return
	}
	WriteJSON(w, http.StatusOK, assignments)
}

func createAssignment(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	classID, err := parseUUIDParam(r, "class_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid class_id", nil)
		return
	}

	class, err := getClassHandler(classID)
	if err != nil || class == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "class not found", nil)
		return
	}
	if !canManageClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	req := new(createAssignmentRequest)
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_JSON", "invalid JSON", nil)
		return
	}
	title := strings.TrimSpace(req.Title)
	if title == "" || req.RevisionID == uuid.Nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INPUT_REQUIRED", "title and revision_id are required", nil)
		return
	}

	revision, err := db.GetProblemRevisionByID(req.RevisionID)
	if err != nil || revision == nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_REVISION", "revision not found", nil)
		return
	}

	latePolicy := req.LatePolicy
	if latePolicy == "" {
		latePolicy = LatePolicyNone
	}

	assignment := &Assignment{
		ClassID:     classID,
		RevisionID:  req.RevisionID,
		Title:       title,
		Description: strings.TrimSpace(req.Description),
		DueAt:       req.DueAt,
		LatePolicy:  latePolicy,
		CreatedBy:   &claims.Id,
	}
	if err := db.CreateAssignment(assignment); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create assignment", nil)
		return
	}
	WriteJSON(w, http.StatusCreated, assignment)
}

func getAssignment(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	assignmentID, err := parseUUIDParam(r, "assignment_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid assignment_id", nil)
		return
	}

	assignment, err := db.GetAssignmentByID(assignmentID)
	if err != nil || assignment == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "assignment not found", nil)
		return
	}

	class, err := getClassHandler(assignment.ClassID)
	if err != nil || class == nil || !canViewClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}
	WriteJSON(w, http.StatusOK, assignment)
}

func updateAssignment(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	assignmentID, err := parseUUIDParam(r, "assignment_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid assignment_id", nil)
		return
	}

	assignment, err := db.GetAssignmentByID(assignmentID)
	if err != nil || assignment == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "assignment not found", nil)
		return
	}

	class, err := getClassHandler(assignment.ClassID)
	if err != nil || class == nil || !canManageClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	req := new(createAssignmentRequest)
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_JSON", "invalid JSON", nil)
		return
	}
	if strings.TrimSpace(req.Title) != "" {
		assignment.Title = strings.TrimSpace(req.Title)
	}
	if req.Description != "" {
		assignment.Description = strings.TrimSpace(req.Description)
	}
	if req.DueAt != nil {
		assignment.DueAt = req.DueAt
	}
	if req.LatePolicy != "" {
		assignment.LatePolicy = req.LatePolicy
	}
	if err := db.UpdateAssignment(assignment); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to update assignment", nil)
		return
	}
	WriteJSON(w, http.StatusOK, assignment)
}

func deleteAssignment(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	assignmentID, err := parseUUIDParam(r, "assignment_id")
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid assignment_id", nil)
		return
	}

	assignment, err := db.GetAssignmentByID(assignmentID)
	if err != nil || assignment == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "assignment not found", nil)
		return
	}

	class, err := getClassHandler(assignment.ClassID)
	if err != nil || class == nil || !canManageClass(claims, class) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	if err := db.DeleteAssignment(assignmentID); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to delete assignment", nil)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func recordAuditEvent(actorID uuid.UUID, action, resourceType, resourceID string, r *http.Request) {
	event := &AuditEvent{
		ActorUserID:  &actorID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Metadata:     "{}",
	}
	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		event.IPAddress = &host
	}
	_ = db.InsertAuditEvent(event)
}
