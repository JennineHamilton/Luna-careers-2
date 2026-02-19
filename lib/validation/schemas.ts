/**
 * Zod Validation Schemas for API Routes
 * Centralized validation schemas to ensure consistent input validation
 */

import { z } from 'zod';

// ============================================================
// Common Schemas
// ============================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format').max(255);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');

export const urlSchema = z.string().url('Invalid URL format').max(2048);

export const dateSchema = z.string().datetime({ message: 'Invalid date format' });

export const positiveIntSchema = z.number().int().positive('Must be a positive integer');

export const nonNegativeIntSchema = z.number().int().nonnegative('Must be a non-negative integer');

export const percentageSchema = z.number().int().min(0).max(100, 'Must be between 0 and 100');

// ============================================================
// Auth Schemas
// ============================================================

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema,
});

export const validateTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: emailSchema,
  temporary_password: z.string().min(1, 'Temporary password is required'),
});

// ============================================================
// Learning Content Schemas
// ============================================================

export const courseCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(5000),
  learning_outcomes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().nonnegative('Price must be non-negative'),
  is_free: z.boolean().default(false),
  intro_video_url: urlSchema.optional().nullable(),
  cover_image_url: urlSchema.optional().nullable(),
  creator_id: uuidSchema.optional().nullable(),
  requirements: z.string().max(2000).optional().nullable(),
  scholarship_eligible: z.boolean().default(false),
  scholarship_types: z.array(z.enum(['full', 'partial'])).optional(),
  is_published: z.boolean().default(false),
});

export const courseUpdateSchema = courseCreateSchema.partial();

export const moduleCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(5000),
  learning_outcomes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().nonnegative('Price must be non-negative'),
  is_free: z.boolean().default(false),
  intro_video_url: urlSchema.optional().nullable(),
  cover_image_url: urlSchema.optional().nullable(),
  creator_id: uuidSchema.optional().nullable(),
  requirements: z.string().max(2000).optional().nullable(),
  scholarship_eligible: z.boolean().default(false),
  scholarship_types: z.array(z.enum(['full', 'partial'])).optional(),
  is_published: z.boolean().default(false),
});

export const moduleUpdateSchema = moduleCreateSchema.partial();

export const lessonCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  scorm_package_url: z.string().min(1, 'SCORM package URL is required').max(2048),
  scorm_version: z.enum(['1.2', '2004']),
  duration_minutes: positiveIntSchema,
  creator_id: uuidSchema.optional().nullable(),
});

export const lessonUpdateSchema = lessonCreateSchema.partial();

// Quiz Schemas
export const quizQuestionOptionSchema = z.object({
  option_text: z.string().min(1, 'Option text is required').max(1000),
  is_correct: z.boolean(),
  order_index: z.number().int().nonnegative(),
});

export const quizQuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required').max(2000),
  question_type: z.enum(['true_false', 'single_choice', 'multiple_choice']),
  image_url: z.string().max(2048).optional().nullable(),
  order_index: z.number().int().nonnegative(),
  options: z.array(quizQuestionOptionSchema).min(1, 'At least one option is required'),
});

export const quizCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  duration_minutes: positiveIntSchema,
  number_of_questions: positiveIntSchema,
  is_graded: z.boolean().default(true),
  passing_score: percentageSchema.optional().nullable(),
  questions: z.array(quizQuestionSchema).min(1, 'At least one question is required'),
}).refine(
  (data) => {
    // If graded, passing_score is required
    if (data.is_graded && !data.passing_score) {
      return false;
    }
    return true;
  },
  {
    message: 'Passing score is required when quiz is graded',
    path: ['passing_score'],
  }
).refine(
  (data) => {
    // Number of questions to show cannot exceed total questions created
    if (data.number_of_questions > data.questions.length) {
      return false;
    }
    return true;
  },
  {
    message: 'Number of questions to show cannot exceed total questions created',
    path: ['number_of_questions'],
  }
);

// Quiz update schema - cannot use .partial() on schemas with .refine()
export const quizUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  duration_minutes: positiveIntSchema.optional(),
  number_of_questions: positiveIntSchema.optional(),
  is_graded: z.boolean().optional(),
  passing_score: percentageSchema.optional().nullable(),
});

export const programCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(5000),
  learning_outcomes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().nonnegative('Price must be non-negative'),
  is_free: z.boolean().default(false),
  intro_video_url: urlSchema.optional().nullable(),
  cover_image_url: urlSchema.optional().nullable(),
  creator_id: uuidSchema.optional().nullable(),
  requirements: z.string().max(2000).optional().nullable(),
  scholarship_eligible: z.boolean().default(false),
  scholarship_types: z.array(z.enum(['full', 'partial'])).optional(),
  is_published: z.boolean().default(false),
});

export const programUpdateSchema = programCreateSchema.partial();

// ============================================================
// Scholarship Schemas
// ============================================================

export const scholarshipCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().min(1, 'Description is required').max(5000),
  type: z.enum(['full', 'partial']),
  discount_percentage: percentageSchema,
  total_slots: positiveIntSchema.optional().nullable(),
  valid_from: dateSchema.optional().nullable(),
  valid_until: dateSchema.optional().nullable(),
  eligibility_criteria: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().default(true),
});

export const scholarshipUpdateSchema = scholarshipCreateSchema.partial();

export const scholarshipApplicationSchema = z.object({
  content_type: z.enum(['course', 'module', 'program']),
  content_id: uuidSchema,
  employment_status: z.enum(['employed', 'unemployed', 'student', 'self_employed']),
  reason_for_scholarship: z.string().min(50, 'Please provide at least 50 characters').max(2000),
  career_goals: z.string().min(50, 'Please provide at least 50 characters').max(2000),
  additional_info: z.string().max(2000).optional().nullable(),
});

// ============================================================
// User Profile Schemas
// ============================================================

export const userProfileUpdateSchema = z.object({
  first_name: z.string().max(100, 'First name must not exceed 100 characters').optional().nullable(),
  last_name: z.string().max(100, 'Last name must not exceed 100 characters').optional().nullable(),
  phone: z.string().max(30, 'Phone number must not exceed 30 characters').optional().nullable(),
  bio: z.string().max(2000, 'Bio must not exceed 2000 characters').optional().nullable(),
  location: z.string().max(255, 'Location must not exceed 255 characters').optional().nullable(),
  linkedin_url: urlSchema.optional().nullable(),
  portfolio_url: urlSchema.optional().nullable(),
  intro_video_url: z.string().url('Must be a valid URL').optional().nullable(),
  profession: z.string().max(255, 'Profession must not exceed 255 characters').optional().nullable(),
  city: z.string().max(255, 'City must not exceed 255 characters').optional().nullable(),
  state: z.string().max(255, 'State must not exceed 255 characters').optional().nullable(),
  country: z.string().max(255, 'Country must not exceed 255 characters').optional().nullable(),
});

export const organizationProfileUpdateSchema = z.object({
  description: z.string().max(5000, 'Description must not exceed 5000 characters').optional().nullable(),
  website_url: urlSchema.optional().nullable(),
  industry: z.enum(['technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing', 'hospitality', 'construction', 'transportation', 'energy', 'telecommunications', 'media', 'real_estate', 'legal', 'consulting', 'nonprofit', 'government', 'other']).optional().nullable(),
  organization_size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional().nullable(),
  founded_year: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  employee_count: z.number().int().nonnegative('Employee count must be non-negative').optional().nullable(),
  street_address: z.string().max(255, 'Street address must not exceed 255 characters').optional().nullable(),
  city: z.string().max(100, 'City must not exceed 100 characters').optional().nullable(),
  state: z.string().max(100, 'State must not exceed 100 characters').optional().nullable(),
  country: z.string().max(100, 'Country must not exceed 100 characters').optional().nullable(),
  contact_email: emailSchema.optional().nullable(),
  contact_phone: z.string().max(30, 'Contact phone must not exceed 30 characters').optional().nullable(),
  social_links: z.record(z.string(), z.string().url().max(2048)).optional().nullable(),
});

export const certificationCreateSchema = z.object({
  certification_title: z.string().min(1, 'Title is required').max(255),
  issuing_organization: z.string().min(1, 'Organization is required').max(255),
  issue_date: dateSchema,
  expiry_date: dateSchema.optional().nullable(),
  does_not_expire: z.boolean().default(false),
  certificate_id: z.string().max(100).optional().nullable(),
  certificate_url_external: urlSchema.optional().nullable(),
  certificate_file_url: urlSchema.optional().nullable(),
});

export const educationCreateSchema = z.object({
  institution: z.string().min(1, 'Institution is required').max(255),
  education_level: z.enum(['high_school', 'associate', 'bachelor', 'master', 'phd']),
  field_of_study: z.string().min(1, 'Field of study is required').max(255),
  start_date: dateSchema,
  end_date: dateSchema.optional().nullable(),
  currently_enrolled: z.boolean().default(false),
  grade_gpa: z.string().max(50).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  certificate_url: urlSchema.optional().nullable(),
});

export const professionalExperienceCreateSchema = z.object({
  job_title: z.string().min(1, 'Job title is required').max(255),
  company: z.string().min(1, 'Company name is required').max(255),
  start_date: dateSchema,
  end_date: dateSchema.optional().nullable(),
  currently_working: z.boolean().default(false),
  description: z.string().max(2000).optional().nullable(),
  location_country: z.string().max(255).optional().nullable(),
});

// ============================================================
// Payment Schemas
// ============================================================

export const bankTransferSubmitSchema = z.object({
  enrollment_type: z.enum(['course', 'module', 'program']),
  enrollment_id: uuidSchema,
  user_bank_name: z.string().min(1, 'Bank name is required').max(255),
  user_account_holder: z.string().min(1, 'Account holder name is required').max(255),
  transaction_reference: z.string().min(1, 'Transaction reference is required').max(255),
  amount_paid: z.number().positive('Amount must be positive'),
  receipt_image_url: urlSchema,
  amount_credits: nonNegativeIntSchema.optional(),
});

// ============================================================
// Assessment Schemas
// ============================================================

export const assessmentSubmitSchema = z.object({
  assessment_id: uuidSchema,
  answers: z.record(z.string(), z.any()),
  time_spent_seconds: nonNegativeIntSchema.optional(),
});

// ============================================================
// Query Parameter Schemas
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const searchSchema = z.object({
  search: z.string().max(255).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  is_free: z.coerce.boolean().optional(),
  is_published: z.coerce.boolean().optional(),
});

// ============================================================
// Enrollment Schemas
// ============================================================

export const enrollmentCreateSchema = z.object({
  content_type: z.enum(['course', 'module', 'program']),
  content_id: uuidSchema,
  scholarship_id: uuidSchema.optional().nullable(),
});

// ============================================================
// User Language & Skill Schemas
// ============================================================

export const languageCreateSchema = z.object({
  language_name: z.string().min(1, 'Language name is required').max(100),
  proficiency_level: z.enum(['basic', 'intermediate', 'advanced', 'fluent', 'native']),
});

export const userSkillAddSchema = z.object({
  skill_id: uuidSchema,
});

// ============================================================
// Learning Progress Schemas
// ============================================================

export const progressUpdateSchema = z.object({
  content_type: z.enum(['lesson', 'module', 'course']).optional(),
  content_id: uuidSchema.optional(),
  lesson_id: uuidSchema.optional(),
  module_id: uuidSchema.optional(),
  completed: z.boolean().optional(),
  score: z.number().nonnegative().optional().nullable(),
  score_min: z.number().nonnegative().optional().nullable(),
  score_max: z.number().nonnegative().optional().nullable(),
  passing_score: z.number().nonnegative().optional().nullable(),
  success_status: z.enum(['passed', 'failed', 'unknown']).optional().nullable(),
  scorm_cmi_data: z.record(z.string(), z.any()).optional().nullable(),
  progress_percentage: percentageSchema.optional().nullable(),
  time_spent_seconds: nonNegativeIntSchema.optional().nullable(),
});

export const quizAttemptCreateSchema = z.object({
  lessonId: uuidSchema,
  scoreRaw: z.number().nonnegative().optional().nullable(),
  scoreMin: z.number().nonnegative().optional().nullable(),
  scoreMax: z.number().nonnegative().optional().nullable(),
  scoreScaled: z.number().min(0).max(1).optional().nullable(),
  passingScore: z.number().nonnegative().optional().nullable(),
  passed: z.boolean().optional().nullable(),
  completionStatus: z.string().max(50).optional().nullable(),
  successStatus: z.string().max(50).optional().nullable(),
  timeSpentSeconds: nonNegativeIntSchema.optional().nullable(),
  scormCmiData: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================================
// Admin Vacancy Schemas
// ============================================================

const prerequisiteAssessmentSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  title: z.string().optional(),
  category: z.string().optional(),
});
const prerequisiteLearningContentSchema = z.object({
  id: z.string(),
  type: z.enum(['module', 'course', 'program']),
  title: z.string().optional(),
});

export const vacancyCreateSchema = z.object({
  organization_id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  responsibilities: z.string().max(5000).optional().nullable(),
  requirements: z.string().max(5000).optional().nullable(),
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']),
  experience_level: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).default('mid'),
  is_remote: z.boolean().default(false),
  location_city: z.string().max(100).optional().nullable(),
  location_state: z.string().max(100).optional().nullable(),
  location_country: z.string().max(100).optional().nullable(),
  salary_range_min: z.number().nonnegative().optional().nullable(),
  salary_range_max: z.number().nonnegative().optional().nullable(),
  salary_currency: z.string().max(10).default('USD'),
  required_skills: z.array(z.string()).optional(),
  preferred_skills: z.array(z.string()).optional(),
  application_deadline: z.string().optional().nullable(),
  prerequisite_assessments: z.array(prerequisiteAssessmentSchema).optional(),
  prerequisite_learning_content: z.array(prerequisiteLearningContentSchema).optional(),
});

export const vacancyUpdateSchema = z.object({
  vacancy_id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  responsibilities: z.string().max(5000).optional().nullable(),
  requirements: z.string().max(5000).optional().nullable(),
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']),
  experience_level: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
  is_remote: z.boolean().default(false),
  location_city: z.string().max(100).optional().nullable(),
  location_state: z.string().max(100).optional().nullable(),
  location_country: z.string().max(100).optional().nullable(),
  salary_range_min: z.number().nonnegative().optional().nullable(),
  salary_range_max: z.number().nonnegative().optional().nullable(),
  required_skills: z.array(z.string()).optional(),
  preferred_skills: z.array(z.string()).optional(),
  application_deadline: z.string().optional().nullable(),
  prerequisite_assessments: z.array(prerequisiteAssessmentSchema).optional(),
  prerequisite_learning_content: z.array(prerequisiteLearningContentSchema).optional(),
});

// ============================================================
// Admin Verification Schemas
// ============================================================

export const verificationUpdateSchema = z.object({
  id: uuidSchema,
  type: z.enum(['experience', 'education', 'certification']),
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().max(2000).optional().nullable(),
});

