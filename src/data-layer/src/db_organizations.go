package main

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (d *Database) CreateOrganization(org *Organization) error {
	now := time.Now()
	org.CreatedAt = now
	org.UpdatedAt = now
	return d.NextJudgeDB.Create(org).Error
}

func (d *Database) GetOrganizationByID(id uuid.UUID) (*Organization, error) {
	org := &Organization{}
	err := d.NextJudgeDB.Where("id = ?", id).First(org).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return org, nil
}

func (d *Database) GetOrganizationBySlug(slug string) (*Organization, error) {
	org := &Organization{}
	err := d.NextJudgeDB.Where("slug = ?", slug).First(org).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return org, nil
}

func (d *Database) ListOrganizationsForUser(userID uuid.UUID, platformAdmin bool) ([]Organization, error) {
	if platformAdmin {
		orgs := []Organization{}
		err := d.NextJudgeDB.Order("name asc").Find(&orgs).Error
		return orgs, err
	}

	orgs := []Organization{}
	err := d.NextJudgeDB.
		Joins("JOIN org_members ON org_members.organization_id = organizations.id").
		Where("org_members.user_id = ?", userID).
		Order("organizations.name asc").
		Find(&orgs).Error
	return orgs, err
}

func (d *Database) UpdateOrganization(org *Organization) error {
	org.UpdatedAt = time.Now()
	return d.NextJudgeDB.Save(org).Error
}

func (d *Database) DeleteOrganization(id uuid.UUID) error {
	return d.NextJudgeDB.Delete(&Organization{}, "id = ?", id).Error
}

func (d *Database) GetOrgMember(orgID, userID uuid.UUID) (*OrgMember, error) {
	member := &OrgMember{}
	err := d.NextJudgeDB.Where("organization_id = ? AND user_id = ?", orgID, userID).First(member).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return member, nil
}

func (d *Database) ListOrgMembers(orgID uuid.UUID) ([]OrgMember, error) {
	members := []OrgMember{}
	err := d.NextJudgeDB.Preload("User").Where("organization_id = ?", orgID).Order("created_at asc").Find(&members).Error
	return members, err
}

func (d *Database) AddOrgMember(member *OrgMember) error {
	member.CreatedAt = time.Now()
	return d.NextJudgeDB.Create(member).Error
}

func (d *Database) RemoveOrgMember(orgID, userID uuid.UUID) error {
	return d.NextJudgeDB.Where("organization_id = ? AND user_id = ?", orgID, userID).Delete(&OrgMember{}).Error
}

func (d *Database) CreateClass(class *Class) error {
	now := time.Now()
	class.CreatedAt = now
	class.UpdatedAt = now
	return d.NextJudgeDB.Create(class).Error
}

func (d *Database) GetClassByID(id uuid.UUID) (*Class, error) {
	class := &Class{}
	err := d.NextJudgeDB.Where("id = ?", id).First(class).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return class, nil
}

func (d *Database) ListClassesForOrganization(orgID uuid.UUID) ([]Class, error) {
	classes := []Class{}
	err := d.NextJudgeDB.Where("organization_id = ?", orgID).Order("name asc").Find(&classes).Error
	return classes, err
}

func (d *Database) UpdateClass(class *Class) error {
	class.UpdatedAt = time.Now()
	return d.NextJudgeDB.Save(class).Error
}

func (d *Database) DeleteClass(id uuid.UUID) error {
	return d.NextJudgeDB.Delete(&Class{}, "id = ?", id).Error
}

func (d *Database) GetClassMember(classID, userID uuid.UUID) (*ClassMember, error) {
	member := &ClassMember{}
	err := d.NextJudgeDB.Where("class_id = ? AND user_id = ?", classID, userID).First(member).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return member, nil
}

func (d *Database) ListClassMembers(classID uuid.UUID) ([]ClassMember, error) {
	members := []ClassMember{}
	err := d.NextJudgeDB.Preload("User").Where("class_id = ?", classID).Order("created_at asc").Find(&members).Error
	return members, err
}

func (d *Database) AddClassMember(member *ClassMember) error {
	member.CreatedAt = time.Now()
	return d.NextJudgeDB.Create(member).Error
}

func (d *Database) RemoveClassMember(classID, userID uuid.UUID) error {
	return d.NextJudgeDB.Where("class_id = ? AND user_id = ?", classID, userID).Delete(&ClassMember{}).Error
}

func (d *Database) CreateAssignment(assignment *Assignment) error {
	now := time.Now()
	assignment.CreatedAt = now
	assignment.UpdatedAt = now
	return d.NextJudgeDB.Create(assignment).Error
}

func (d *Database) GetAssignmentByID(id uuid.UUID) (*Assignment, error) {
	assignment := &Assignment{}
	err := d.NextJudgeDB.Where("id = ?", id).First(assignment).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return assignment, nil
}

func (d *Database) ListAssignmentsForClass(classID uuid.UUID) ([]Assignment, error) {
	assignments := []Assignment{}
	err := d.NextJudgeDB.Where("class_id = ?", classID).Order("due_at asc nulls last, created_at desc").Find(&assignments).Error
	return assignments, err
}

func (d *Database) UpdateAssignment(assignment *Assignment) error {
	assignment.UpdatedAt = time.Now()
	return d.NextJudgeDB.Save(assignment).Error
}

func (d *Database) DeleteAssignment(id uuid.UUID) error {
	return d.NextJudgeDB.Delete(&Assignment{}, "id = ?", id).Error
}

func (d *Database) GetOrCreateRosterUser(email, name string) (*User, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return nil, nil
	}

	user, err := d.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}
	if user != nil {
		return user, nil
	}

	displayName := strings.TrimSpace(name)
	if displayName == "" {
		displayName = strings.Split(email, "@")[0]
	}

	newUser := &User{
		AccountIdentifier: "roster-" + email,
		Email:             email,
		Name:              displayName,
		JoinDate:          time.Now(),
	}
	created, err := d.CreateUser(newUser)
	if err != nil {
		return nil, err
	}
	return created, nil
}

func (d *Database) GetProblemRevisionByID(id uuid.UUID) (*ProblemRevision, error) {
	revision := &ProblemRevision{}
	err := d.NextJudgeDB.Where("id = ?", id).First(revision).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return revision, nil
}
