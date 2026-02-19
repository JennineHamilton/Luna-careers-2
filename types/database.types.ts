/**
 * Auto-generated TypeScript types from Supabase database schema
 * Generated on: 2026-02-15T18:47:03.065Z
 * DO NOT EDIT MANUALLY - Regenerate using: node scripts/generate-typescript-types.js
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          organization_id: string | null
          activity_type: Database['public']['Enums']['activity_type']
          description: string | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          organization_id?: string | null
          activity_type: Database['public']['Enums']['activity_type']
          description?: string | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          user_id?: string | null
          organization_id?: string | null
          activity_type?: Database['public']['Enums']['activity_type']
          description?: string | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      assessment_attempts: {
        Row: {
          id: string
          user_id: string
          assessment_template_id: string
          passage_used: string
          user_input: string | null
          wpm: number | null
          accuracy: number | null
          time_taken: number | null
          errors_count: number | null
          characters_typed: number | null
          correct_characters: number | null
          performance_report: string | null
          skill_level: string | null
          skill_level_numeric: number | null
          status: string | null
          is_submitted: boolean | null
          started_at: string | null
          completed_at: string | null
          submitted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          assessment_template_id: string
          passage_used: string
          user_input?: string | null
          wpm?: number | null
          accuracy?: number | null
          time_taken?: number | null
          errors_count?: number | null
          characters_typed?: number | null
          correct_characters?: number | null
          performance_report?: string | null
          skill_level?: string | null
          skill_level_numeric?: number | null
          status?: string | null
          is_submitted?: boolean | null
          started_at?: string | null
          completed_at?: string | null
          submitted_at?: string | null
        }
        Update: {
          user_id?: string
          assessment_template_id?: string
          passage_used?: string
          user_input?: string | null
          wpm?: number | null
          accuracy?: number | null
          time_taken?: number | null
          errors_count?: number | null
          characters_typed?: number | null
          correct_characters?: number | null
          performance_report?: string | null
          skill_level?: string | null
          skill_level_numeric?: number | null
          status?: string | null
          is_submitted?: boolean | null
          started_at?: string | null
          completed_at?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['assessment_template_id']
            isOneToOne: false
            referencedRelation: 'assessment_templates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      assessment_audio_files: {
        Row: {
          id: string
          assessment_template_id: string
          file_name: string
          file_url: string
          file_size: number | null
          duration_seconds: number | null
          mime_type: string | null
          uploaded_by: string | null
          upload_date: string | null
          times_served: number | null
          average_accuracy: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          transcript: string | null
        }
        Insert: {
          id?: string
          assessment_template_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          duration_seconds?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          upload_date?: string | null
          times_served?: number | null
          average_accuracy?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          transcript?: string | null
        }
        Update: {
          assessment_template_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          duration_seconds?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          upload_date?: string | null
          times_served?: number | null
          average_accuracy?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['assessment_template_id']
            isOneToOne: false
            referencedRelation: 'assessment_templates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      assessment_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          assessment_type: string
          language: string
          duration_seconds: number
          has_audio: boolean | null
          audio_url: string | null
          passage_generation_prompt: string | null
          icon: string | null
          category: string | null
          display_order: number | null
          is_active: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          is_system_managed: boolean | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          assessment_type: string
          language?: string
          duration_seconds?: number
          has_audio?: boolean | null
          audio_url?: string | null
          passage_generation_prompt?: string | null
          icon?: string | null
          category?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_system_managed?: boolean | null
        }
        Update: {
          title?: string
          description?: string | null
          assessment_type?: string
          language?: string
          duration_seconds?: number
          has_audio?: boolean | null
          audio_url?: string | null
          passage_generation_prompt?: string | null
          icon?: string | null
          category?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_system_managed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      awarded_scholarships: {
        Row: {
          id: string
          application_id: string
          user_id: string
          scholarship_id: string
          content_type: string
          content_id: string
          discount_percentage: number
          original_price: number
          discounted_price: number
          awarded_at: string | null
          expires_at: string | null
          used: boolean | null
        }
        Insert: {
          id?: string
          application_id: string
          user_id: string
          scholarship_id: string
          content_type: string
          content_id: string
          discount_percentage: number
          original_price: number
          discounted_price: number
          awarded_at?: string | null
          expires_at?: string | null
          used?: boolean | null
        }
        Update: {
          application_id?: string
          user_id?: string
          scholarship_id?: string
          content_type?: string
          content_id?: string
          discount_percentage?: number
          original_price?: number
          discounted_price?: number
          awarded_at?: string | null
          expires_at?: string | null
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'scholarship_applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['scholarship_id']
            isOneToOne: false
            referencedRelation: 'scholarships'
            referencedColumns: ['id']
          },
        ]
      }
      bank_transfer_submissions: {
        Row: {
          id: string
          purchase_id: string | null
          user_id: string
          enrollment_type: string
          enrollment_id: string
          user_bank_name: string
          user_account_holder: string
          transaction_reference: string
          amount_paid: number
          receipt_image_url: string | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          admin_notes: string | null
          submitted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          purchase_id?: string | null
          user_id: string
          enrollment_type: string
          enrollment_id: string
          user_bank_name: string
          user_account_holder: string
          transaction_reference: string
          amount_paid: number
          receipt_image_url?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          admin_notes?: string | null
          submitted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          purchase_id?: string | null
          user_id?: string
          enrollment_type?: string
          enrollment_id?: string
          user_bank_name?: string
          user_account_holder?: string
          transaction_reference?: string
          amount_paid?: number
          receipt_image_url?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          admin_notes?: string | null
          submitted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['purchase_id']
            isOneToOne: false
            referencedRelation: 'purchases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          certificate_type: string
          content_id: string
          content_type: string
          content_title: string
          issue_date: string | null
          certificate_url: string | null
          verification_code: string
          is_revoked: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          certificate_type: string
          content_id: string
          content_type: string
          content_title: string
          issue_date?: string | null
          certificate_url?: string | null
          verification_code: string
          is_revoked?: boolean | null
          created_at?: string | null
        }
        Update: {
          user_id?: string
          certificate_type?: string
          content_id?: string
          content_type?: string
          content_title?: string
          issue_date?: string | null
          certificate_url?: string | null
          verification_code?: string
          is_revoked?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          id: string
          user_id: string
          certification_title: string
          issuing_organization: string
          issue_date: string
          expiry_date: string | null
          does_not_expire: boolean | null
          certificate_id: string | null
          certificate_url_external: string | null
          certificate_file_url: string | null
          verification_status: Database['public']['Enums']['verification_status'] | null
          verified_by: string | null
          verified_at: string | null
          rejection_reason: string | null
          submitted_at: string | null
          is_hidden: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          certification_title: string
          issuing_organization: string
          issue_date: string
          expiry_date?: string | null
          does_not_expire?: boolean | null
          certificate_id?: string | null
          certificate_url_external?: string | null
          certificate_file_url?: string | null
          verification_status?: Database['public']['Enums']['verification_status'] | null
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          is_hidden?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          certification_title?: string
          issuing_organization?: string
          issue_date?: string
          expiry_date?: string | null
          does_not_expire?: boolean | null
          certificate_id?: string | null
          certificate_url_external?: string | null
          certificate_file_url?: string | null
          verification_status?: Database['public']['Enums']['verification_status'] | null
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          is_hidden?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['verified_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      cognitive_attempts: {
        Row: {
          id: string
          user_id: string | null
          template_id: string | null
          status: string
          started_at: string | null
          completed_at: string | null
          overall_raw_score: number | null
          overall_percentile: number | null
          verbal_raw_score: number | null
          verbal_percentile: number | null
          numerical_raw_score: number | null
          numerical_percentile: number | null
          abstract_raw_score: number | null
          abstract_percentile: number | null
          attention_raw_score: number | null
          attention_percentile: number | null
          total_questions: number | null
          correct_answers: number | null
          total_time_seconds: number | null
          average_response_time: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          template_id?: string | null
          status?: string
          started_at?: string | null
          completed_at?: string | null
          overall_raw_score?: number | null
          overall_percentile?: number | null
          verbal_raw_score?: number | null
          verbal_percentile?: number | null
          numerical_raw_score?: number | null
          numerical_percentile?: number | null
          abstract_raw_score?: number | null
          abstract_percentile?: number | null
          attention_raw_score?: number | null
          attention_percentile?: number | null
          total_questions?: number | null
          correct_answers?: number | null
          total_time_seconds?: number | null
          average_response_time?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string | null
          template_id?: string | null
          status?: string
          started_at?: string | null
          completed_at?: string | null
          overall_raw_score?: number | null
          overall_percentile?: number | null
          verbal_raw_score?: number | null
          verbal_percentile?: number | null
          numerical_raw_score?: number | null
          numerical_percentile?: number | null
          abstract_raw_score?: number | null
          abstract_percentile?: number | null
          attention_raw_score?: number | null
          attention_percentile?: number | null
          total_questions?: number | null
          correct_answers?: number | null
          total_time_seconds?: number | null
          average_response_time?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'cognitive_templates'
            referencedColumns: ['id']
          },
        ]
      }
      cognitive_insights: {
        Row: {
          id: string
          attempt_id: string | null
          insight_type: string
          domain: string | null
          title: string
          description: string
          confidence_level: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          attempt_id?: string | null
          insight_type: string
          domain?: string | null
          title: string
          description: string
          confidence_level?: string | null
          created_at?: string | null
        }
        Update: {
          attempt_id?: string | null
          insight_type?: string
          domain?: string | null
          title?: string
          description?: string
          confidence_level?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['attempt_id']
            isOneToOne: false
            referencedRelation: 'cognitive_attempts'
            referencedColumns: ['id']
          },
        ]
      }
      cognitive_norms: {
        Row: {
          id: string
          domain: string
          raw_score_percentage: number
          percentile: number
          sample_size: number | null
          source: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          domain: string
          raw_score_percentage: number
          percentile: number
          sample_size?: number | null
          source?: string | null
          created_at?: string | null
        }
        Update: {
          domain?: string
          raw_score_percentage?: number
          percentile?: number
          sample_size?: number | null
          source?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      cognitive_questions: {
        Row: {
          id: string
          template_id: string | null
          domain: string
          question_type: string
          question_text: string | null
          question_image_url: string | null
          options: Json
          correct_answer: string
          suggested_time_seconds: number
          difficulty_level: string
          icar_item_id: string | null
          icar_source: string | null
          is_practice: boolean | null
          display_order: number
          explanation: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          template_id?: string | null
          domain: string
          question_type: string
          question_text?: string | null
          question_image_url?: string | null
          options: Json
          correct_answer: string
          suggested_time_seconds: number
          difficulty_level: string
          icar_item_id?: string | null
          icar_source?: string | null
          is_practice?: boolean | null
          display_order: number
          explanation?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          template_id?: string | null
          domain?: string
          question_type?: string
          question_text?: string | null
          question_image_url?: string | null
          options?: Json
          correct_answer?: string
          suggested_time_seconds?: number
          difficulty_level?: string
          icar_item_id?: string | null
          icar_source?: string | null
          is_practice?: boolean | null
          display_order?: number
          explanation?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'cognitive_templates'
            referencedColumns: ['id']
          },
        ]
      }
      cognitive_responses: {
        Row: {
          id: string
          attempt_id: string | null
          question_id: string | null
          user_answer: string
          is_correct: boolean
          time_taken_seconds: number
          is_practice: boolean | null
          responded_at: string | null
        }
        Insert: {
          id?: string
          attempt_id?: string | null
          question_id?: string | null
          user_answer: string
          is_correct: boolean
          time_taken_seconds: number
          is_practice?: boolean | null
          responded_at?: string | null
        }
        Update: {
          attempt_id?: string | null
          question_id?: string | null
          user_answer?: string
          is_correct?: boolean
          time_taken_seconds?: number
          is_practice?: boolean | null
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['attempt_id']
            isOneToOne: false
            referencedRelation: 'cognitive_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'cognitive_questions'
            referencedColumns: ['id']
          },
        ]
      }
      cognitive_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          total_questions: number
          time_limit_minutes: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          total_questions?: number
          time_limit_minutes?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          total_questions?: number
          time_limit_minutes?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_assessments: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          questions_per_attempt: number
          passing_threshold: number
          time_limit_minutes: number
          allow_review: boolean | null
          is_published: boolean | null
          total_questions_in_pool: number | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          questions_per_attempt?: number
          passing_threshold?: number
          time_limit_minutes?: number
          allow_review?: boolean | null
          is_published?: boolean | null
          total_questions_in_pool?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          category?: string
          questions_per_attempt?: number
          passing_threshold?: number
          time_limit_minutes?: number
          allow_review?: boolean | null
          is_published?: boolean | null
          total_questions_in_pool?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_assessments_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      knowledge_questions: {
        Row: {
          id: string
          assessment_id: string
          question_text: string
          question_type: string
          image_url: string | null
          display_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          assessment_id: string
          question_text: string
          question_type: string
          image_url?: string | null
          display_order?: number | null
          created_at?: string | null
        }
        Update: {
          assessment_id?: string
          question_text?: string
          question_type?: string
          image_url?: string | null
          display_order?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_questions_assessment_id_fkey'
            columns: ['assessment_id']
            isOneToOne: false
            referencedRelation: 'knowledge_assessments'
            referencedColumns: ['id']
          },
        ]
      }
      knowledge_question_options: {
        Row: {
          id: string
          question_id: string
          option_text: string
          is_correct: boolean | null
          display_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          question_id: string
          option_text: string
          is_correct?: boolean | null
          display_order?: number | null
          created_at?: string | null
        }
        Update: {
          question_id?: string
          option_text?: string
          is_correct?: boolean | null
          display_order?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_question_options_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'knowledge_questions'
            referencedColumns: ['id']
          },
        ]
      }
      knowledge_attempts: {
        Row: {
          id: string
          user_id: string
          assessment_id: string
          status: string
          started_at: string | null
          completed_at: string | null
          time_taken_seconds: number | null
          total_questions: number
          correct_answers: number | null
          score_percentage: number | null
          passed: boolean | null
          selected_question_ids: string[]
          display_on_profile: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          assessment_id: string
          status?: string
          started_at?: string | null
          completed_at?: string | null
          time_taken_seconds?: number | null
          total_questions: number
          correct_answers?: number | null
          score_percentage?: number | null
          passed?: boolean | null
          selected_question_ids?: string[]
          display_on_profile?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          assessment_id?: string
          status?: string
          started_at?: string | null
          completed_at?: string | null
          time_taken_seconds?: number | null
          total_questions?: number
          correct_answers?: number | null
          score_percentage?: number | null
          passed?: boolean | null
          selected_question_ids?: string[]
          display_on_profile?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_attempts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'knowledge_attempts_assessment_id_fkey'
            columns: ['assessment_id']
            isOneToOne: false
            referencedRelation: 'knowledge_assessments'
            referencedColumns: ['id']
          },
        ]
      }
      knowledge_attempt_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option_ids: string[]
          selected_boolean: boolean | null
          is_correct: boolean
          answered_at: string | null
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option_ids?: string[]
          selected_boolean?: boolean | null
          is_correct?: boolean
          answered_at?: string | null
        }
        Update: {
          attempt_id?: string
          question_id?: string
          selected_option_ids?: string[]
          selected_boolean?: boolean | null
          is_correct?: boolean
          answered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_attempt_answers_attempt_id_fkey'
            columns: ['attempt_id']
            isOneToOne: false
            referencedRelation: 'knowledge_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'knowledge_attempt_answers_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'knowledge_questions'
            referencedColumns: ['id']
          },
        ]
      }
      course_modules: {
        Row: {
          id: string
          course_id: string | null
          module_id: string | null
          sort_order: number
          is_required: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          course_id?: string | null
          module_id?: string | null
          sort_order: number
          is_required?: boolean | null
          created_at?: string | null
        }
        Update: {
          course_id?: string | null
          module_id?: string | null
          sort_order?: number
          is_required?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'modules'
            referencedColumns: ['id']
          },
        ]
      }
      course_prerequisites: {
        Row: {
          id: string
          course_id: string | null
          prerequisite_course_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          course_id?: string | null
          prerequisite_course_id?: string | null
          created_at?: string | null
        }
        Update: {
          course_id?: string | null
          prerequisite_course_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['prerequisite_course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      course_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: string
          completion_percentage: number | null
          time_spent_minutes: number | null
          started_at: string | null
          completed_at: string | null
          certificate_issued: boolean | null
          certificate_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          status?: string
          completion_percentage?: number | null
          time_spent_minutes?: number | null
          started_at?: string | null
          completed_at?: string | null
          certificate_issued?: boolean | null
          certificate_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          course_id?: string
          status?: string
          completion_percentage?: number | null
          time_spent_minutes?: number | null
          started_at?: string | null
          completed_at?: string | null
          certificate_issued?: boolean | null
          certificate_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          learning_outcomes: Json | null
          skills: Json | null
          level: string
          price: number
          is_free: boolean | null
          intro_video_url: string | null
          cover_image_url: string | null
          duration_minutes: number | null
          creator_id: string | null
          requirements: string | null
          scholarship_eligible: boolean | null
          scholarship_types: Json | null
          is_published: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          learning_outcomes?: Json | null
          skills?: Json | null
          level: string
          price?: number
          is_free?: boolean | null
          intro_video_url?: string | null
          cover_image_url?: string | null
          duration_minutes?: number | null
          creator_id?: string | null
          requirements?: string | null
          scholarship_eligible?: boolean | null
          scholarship_types?: Json | null
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          description?: string
          learning_outcomes?: Json | null
          skills?: Json | null
          level?: string
          price?: number
          is_free?: boolean | null
          intro_video_url?: string | null
          cover_image_url?: string | null
          duration_minutes?: number | null
          creator_id?: string | null
          requirements?: string | null
          scholarship_eligible?: boolean | null
          scholarship_types?: Json | null
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'creators'
            referencedColumns: ['id']
          },
        ]
      }
      creators: {
        Row: {
          id: string
          name: string
          type: string
          bio: string | null
          logo_url: string | null
          website_url: string | null
          contact_email: string | null
          verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          bio?: string | null
          logo_url?: string | null
          website_url?: string | null
          contact_email?: string | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          name?: string
          type?: string
          bio?: string | null
          logo_url?: string | null
          website_url?: string | null
          contact_email?: string | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_earning_rules: {
        Row: {
          id: string
          content_type: string
          content_id: string | null
          credits_awarded: number
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          content_type: string
          content_id?: string | null
          credits_awarded: number
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          content_id?: string | null
          credits_awarded?: number
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: string
          amount: number
          balance_after: number
          source_type: string
          source_id: string | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: string
          amount: number
          balance_after: number
          source_type: string
          source_id?: string | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          user_id?: string
          transaction_type?: string
          amount?: number
          balance_after?: number
          source_type?: string
          source_id?: string | null
          description?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          lifetime_earned: number
          lifetime_spent: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      education: {
        Row: {
          id: string
          user_id: string
          institution: string
          education_level: Database['public']['Enums']['education_level']
          field_of_study: string
          start_date: string
          end_date: string | null
          currently_enrolled: boolean | null
          certificate_url: string | null
          verification_status: Database['public']['Enums']['verification_status'] | null
          verified_by: string | null
          verified_at: string | null
          rejection_reason: string | null
          submitted_at: string | null
          is_hidden: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          institution: string
          education_level: Database['public']['Enums']['education_level']
          field_of_study: string
          start_date: string
          end_date?: string | null
          currently_enrolled?: boolean | null
          certificate_url?: string | null
          verification_status?: Database['public']['Enums']['verification_status'] | null
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          is_hidden?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          institution?: string
          education_level?: Database['public']['Enums']['education_level']
          field_of_study?: string
          start_date?: string
          end_date?: string | null
          currently_enrolled?: boolean | null
          certificate_url?: string | null
          verification_status?: Database['public']['Enums']['verification_status'] | null
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          is_hidden?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['verified_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      email_confirmation_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          used_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          used_at?: string | null
          created_at?: string | null
        }
        Update: {
          user_id?: string
          token?: string
          expires_at?: string
          used_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          enrollment_type: string
          enrollment_id: string
          purchase_id: string | null
          enrolled_at: string | null
          expires_at: string | null
          status: string
          completion_credits_awarded: number | null
          credits_awarded_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          enrollment_type: string
          enrollment_id: string
          purchase_id?: string | null
          enrolled_at?: string | null
          expires_at?: string | null
          status?: string
          completion_credits_awarded?: number | null
          credits_awarded_at?: string | null
        }
        Update: {
          user_id?: string
          enrollment_type?: string
          enrollment_id?: string
          purchase_id?: string | null
          enrolled_at?: string | null
          expires_at?: string | null
          status?: string
          completion_credits_awarded?: number | null
          credits_awarded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['purchase_id']
            isOneToOne: false
            referencedRelation: 'purchases'
            referencedColumns: ['id']
          },
        ]
      }
      invitation_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          temporary_password: string
          expires_at: string
          used_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          temporary_password: string
          expires_at?: string
          used_at?: string | null
          created_at?: string | null
        }
        Update: {
          user_id?: string
          token?: string
          temporary_password?: string
          expires_at?: string
          used_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      job_applications: {
        Row: {
          id: string
          user_id: string
          vacancy_id: string | null
          status: Database['public']['Enums']['job_application_status']
          application_data: Json | null
          applied_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          review_notes: string | null
          updated_at: string | null
          consent_given: boolean
          is_hidden: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          vacancy_id?: string | null
          status?: Database['public']['Enums']['job_application_status']
          application_data?: Json | null
          applied_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          updated_at?: string | null
          consent_given?: boolean
          is_hidden?: boolean | null
        }
        Update: {
          user_id?: string
          vacancy_id?: string | null
          status?: Database['public']['Enums']['job_application_status']
          application_data?: Json | null
          applied_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          updated_at?: string | null
          consent_given?: boolean
          is_hidden?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['vacancy_id']
            isOneToOne: false
            referencedRelation: 'vacancies'
            referencedColumns: ['id']
          },
        ]
      }
      learning_outcomes: {
        Row: {
          id: string
          outcome_text: string
          category: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          outcome_text: string
          category: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          outcome_text?: string
          category?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          status: string
          score_raw: number | null
          score_min: number | null
          score_max: number | null
          passing_score: number | null
          completion_percentage: number | null
          time_spent_minutes: number | null
          quiz_attempts: number | null
          quiz_data: Json | null
          scorm_cmi_data: Json | null
          last_accessed: string | null
          completed_at: string | null
          passed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          status?: string
          score_raw?: number | null
          score_min?: number | null
          score_max?: number | null
          passing_score?: number | null
          completion_percentage?: number | null
          time_spent_minutes?: number | null
          quiz_attempts?: number | null
          quiz_data?: Json | null
          scorm_cmi_data?: Json | null
          last_accessed?: string | null
          completed_at?: string | null
          passed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          lesson_id?: string
          status?: string
          score_raw?: number | null
          score_min?: number | null
          score_max?: number | null
          passing_score?: number | null
          completion_percentage?: number | null
          time_spent_minutes?: number | null
          quiz_attempts?: number | null
          quiz_data?: Json | null
          scorm_cmi_data?: Json | null
          last_accessed?: string | null
          completed_at?: string | null
          passed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      lessons: {
        Row: {
          id: string
          title: string
          description: string | null
          scorm_package_url: string
          scorm_version: string
          duration_minutes: number
          creator_id: string | null
          created_at: string | null
          updated_at: string | null
          scorm_launch_url: string | null
          scorm_extraction_status: string | null
          scorm_extraction_error: string | null
          scorm_extracted_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          scorm_package_url: string
          scorm_version: string
          duration_minutes: number
          creator_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          scorm_launch_url?: string | null
          scorm_extraction_status?: string | null
          scorm_extraction_error?: string | null
          scorm_extracted_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          scorm_package_url?: string
          scorm_version?: string
          duration_minutes?: number
          creator_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          scorm_launch_url?: string | null
          scorm_extraction_status?: string | null
          scorm_extraction_error?: string | null
          scorm_extracted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'creators'
            referencedColumns: ['id']
          },
        ]
      }
      module_lessons: {
        Row: {
          id: string
          module_id: string | null
          lesson_id: string | null
          sort_order: number
          is_required: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          module_id?: string | null
          lesson_id?: string | null
          sort_order: number
          is_required?: boolean | null
          created_at?: string | null
        }
        Update: {
          module_id?: string | null
          lesson_id?: string | null
          sort_order?: number
          is_required?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'modules'
            referencedColumns: ['id']
          },
        ]
      }
      module_prerequisites: {
        Row: {
          id: string
          module_id: string | null
          prerequisite_module_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          module_id?: string | null
          prerequisite_module_id?: string | null
          created_at?: string | null
        }
        Update: {
          module_id?: string | null
          prerequisite_module_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'modules'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['prerequisite_module_id']
            isOneToOne: false
            referencedRelation: 'modules'
            referencedColumns: ['id']
          },
        ]
      }
      module_progress: {
        Row: {
          id: string
          user_id: string
          module_id: string
          status: string
          completion_percentage: number | null
          time_spent_minutes: number | null
          started_at: string | null
          completed_at: string | null
          certificate_issued: boolean | null
          certificate_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          status?: string
          completion_percentage?: number | null
          time_spent_minutes?: number | null
          started_at?: string | null
          completed_at?: string | null
          certificate_issued?: boolean | null
          certificate_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          module_id?: string
          status?: string
          completion_percentage?: number | null
          time_spent_minutes?: number | null
          started_at?: string | null
          completed_at?: string | null
          certificate_issued?: boolean | null
          certificate_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'modules'
            referencedColumns: ['id']
          },
        ]
      }
      module_quizzes: {
        Row: {
          module_id: string
          quiz_id: string
          sort_order: number
          is_required: boolean
          created_at: string
        }
        Insert: {
          module_id: string
          quiz_id: string
          sort_order?: number
          is_required?: boolean
          created_at?: string
        }
        Update: {
          module_id?: string
          quiz_id?: string
          sort_order?: number
          is_required?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'module_quizzes_module_id_fkey'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'modules'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'module_quizzes_quiz_id_fkey'
            columns: ['quiz_id']
            isOneToOne: false
            referencedRelation: 'quizzes'
            referencedColumns: ['id']
          },
        ]
      }
      modules: {
        Row: {
          id: string
          title: string
          description: string
          learning_outcomes: Json | null
          skills: Json | null
          level: string
          price: number
          is_free: boolean | null
          intro_video_url: string | null
          cover_image_url: string | null
          duration_minutes: number | null
          creator_id: string | null
          requirements: string | null
          scholarship_eligible: boolean | null
          scholarship_types: Json | null
          is_published: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          learning_outcomes?: Json | null
          skills?: Json | null
          level: string
          price?: number
          is_free?: boolean | null
          intro_video_url?: string | null
          cover_image_url?: string | null
          duration_minutes?: number | null
          creator_id?: string | null
          requirements?: string | null
          scholarship_eligible?: boolean | null
          scholarship_types?: Json | null
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          description?: string
          learning_outcomes?: Json | null
          skills?: Json | null
          level?: string
          price?: number
          is_free?: boolean | null
          intro_video_url?: string | null
          cover_image_url?: string | null
          duration_minutes?: number | null
          creator_id?: string | null
          requirements?: string | null
          scholarship_eligible?: boolean | null
          scholarship_types?: Json | null
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'creators'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          action_url: string | null
          action_label: string | null
          metadata: Json | null
          is_read: boolean | null
          read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          action_url?: string | null
          action_label?: string | null
          metadata?: Json | null
          is_read?: boolean | null
          read_at?: string | null
          created_at?: string | null
        }
        Update: {
          user_id?: string
          type?: string
          title?: string
          message?: string
          action_url?: string | null
          action_label?: string | null
          metadata?: Json | null
          is_read?: boolean | null
          read_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      organization_benefits: {
        Row: {
          id: string
          organization_id: string
          benefit_name: string
          description: string | null
          icon: string | null
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          benefit_name: string
          description?: string | null
          icon?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          organization_id?: string
          benefit_name?: string
          description?: string | null
          icon?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      organization_skills: {
        Row: {
          id: string
          organization_id: string
          skill_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          skill_id: string
          created_at?: string | null
        }
        Update: {
          organization_id?: string
          skill_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['skill_id']
            isOneToOne: false
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string | null
          updated_at: string | null
          slug: string | null
          description: string | null
          logo_url: string | null
          cover_image_url: string | null
          website_url: string | null
          industry: Database['public']['Enums']['industry_type'] | null
          organization_size: Database['public']['Enums']['organization_size'] | null
          founded_year: number | null
          employee_count: number | null
          verification_status: Database['public']['Enums']['organization_verification_status'] | null
          verified_at: string | null
          verified_by: string | null
          tax_id: string | null
          registration_number: string | null
          contact_email: string | null
          contact_phone: string | null
          is_active: boolean | null
          social_links: Json | null
          size: string | null
          street_address: string | null
          city: string | null
          state: string | null
          country: string | null
          bio: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
          updated_at?: string | null
          slug?: string | null
          description?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          website_url?: string | null
          industry?: Database['public']['Enums']['industry_type'] | null
          organization_size?: Database['public']['Enums']['organization_size'] | null
          founded_year?: number | null
          employee_count?: number | null
          verification_status?: Database['public']['Enums']['organization_verification_status'] | null
          verified_at?: string | null
          verified_by?: string | null
          tax_id?: string | null
          registration_number?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          is_active?: boolean | null
          social_links?: Json | null
          size?: string | null
          street_address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          bio?: string | null
        }
        Update: {
          name?: string
          created_at?: string | null
          updated_at?: string | null
          slug?: string | null
          description?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          website_url?: string | null
          industry?: Database['public']['Enums']['industry_type'] | null
          organization_size?: Database['public']['Enums']['organization_size'] | null
          founded_year?: number | null
          employee_count?: number | null
          verification_status?: Database['public']['Enums']['organization_verification_status'] | null
          verified_at?: string | null
          verified_by?: string | null
          tax_id?: string | null
          registration_number?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          is_active?: boolean | null
          social_links?: Json | null
          size?: string | null
          street_address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          bio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['verified_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          used_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          used_at?: string | null
          created_at?: string | null
        }
        Update: {
          user_id?: string
          token?: string
          expires_at?: string
          used_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string | null
          setting_type: string
          is_active: boolean | null
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: string | null
          setting_type?: string
          is_active?: boolean | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          setting_key?: string
          setting_value?: string | null
          setting_type?: string
          is_active?: boolean | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      personality_attempts: {
        Row: {
          id: string
          user_id: string | null
          assessment_template_id: string | null
          status: string | null
          started_at: string | null
          completed_at: string | null
          submitted_at: string | null
          extraversion_score: number | null
          agreeableness_score: number | null
          conscientiousness_score: number | null
          emotional_stability_score: number | null
          intellect_score: number | null
          extraversion_percentile: number | null
          agreeableness_percentile: number | null
          conscientiousness_percentile: number | null
          emotional_stability_percentile: number | null
          intellect_percentile: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          assessment_template_id?: string | null
          status?: string | null
          started_at?: string | null
          completed_at?: string | null
          submitted_at?: string | null
          extraversion_score?: number | null
          agreeableness_score?: number | null
          conscientiousness_score?: number | null
          emotional_stability_score?: number | null
          intellect_score?: number | null
          extraversion_percentile?: number | null
          agreeableness_percentile?: number | null
          conscientiousness_percentile?: number | null
          emotional_stability_percentile?: number | null
          intellect_percentile?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string | null
          assessment_template_id?: string | null
          status?: string | null
          started_at?: string | null
          completed_at?: string | null
          submitted_at?: string | null
          extraversion_score?: number | null
          agreeableness_score?: number | null
          conscientiousness_score?: number | null
          emotional_stability_score?: number | null
          intellect_score?: number | null
          extraversion_percentile?: number | null
          agreeableness_percentile?: number | null
          conscientiousness_percentile?: number | null
          emotional_stability_percentile?: number | null
          intellect_percentile?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['assessment_template_id']
            isOneToOne: false
            referencedRelation: 'assessment_templates'
            referencedColumns: ['id']
          },
        ]
      }
      personality_insights: {
        Row: {
          id: string
          attempt_id: string | null
          user_id: string | null
          insight_type: string
          category: string
          title: string
          description: string
          research_source: string
          confidence_level: string
          applicable_dimensions: Json | null
          percentile_trigger: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          attempt_id?: string | null
          user_id?: string | null
          insight_type: string
          category: string
          title: string
          description: string
          research_source: string
          confidence_level: string
          applicable_dimensions?: Json | null
          percentile_trigger?: number | null
          created_at?: string | null
        }
        Update: {
          attempt_id?: string | null
          user_id?: string | null
          insight_type?: string
          category?: string
          title?: string
          description?: string
          research_source?: string
          confidence_level?: string
          applicable_dimensions?: Json | null
          percentile_trigger?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['attempt_id']
            isOneToOne: false
            referencedRelation: 'personality_attempts'
            referencedColumns: ['id']
          },
        ]
      }
      personality_job_recommendations: {
        Row: {
          id: string
          attempt_id: string | null
          user_id: string | null
          job_family: string
          match_strength: string
          example_roles: Json | null
          rationale: string
          research_source: string
          created_at: string | null
        }
        Insert: {
          id?: string
          attempt_id?: string | null
          user_id?: string | null
          job_family: string
          match_strength: string
          example_roles?: Json | null
          rationale: string
          research_source: string
          created_at?: string | null
        }
        Update: {
          attempt_id?: string | null
          user_id?: string | null
          job_family?: string
          match_strength?: string
          example_roles?: Json | null
          rationale?: string
          research_source?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['attempt_id']
            isOneToOne: false
            referencedRelation: 'personality_attempts'
            referencedColumns: ['id']
          },
        ]
      }
      personality_questions: {
        Row: {
          id: string
          question_number: number
          question_text: string
          dimension: string
          is_reversed: boolean
          created_at: string | null
          source: string | null
          validation_status: string | null
        }
        Insert: {
          id?: string
          question_number: number
          question_text: string
          dimension: string
          is_reversed: boolean
          created_at?: string | null
          source?: string | null
          validation_status?: string | null
        }
        Update: {
          question_number?: number
          question_text?: string
          dimension?: string
          is_reversed?: boolean
          created_at?: string | null
          source?: string | null
          validation_status?: string | null
        }
        Relationships: []
      }
      personality_reports: {
        Row: {
          id: string
          attempt_id: string | null
          user_id: string | null
          report_type: string
          report_data: Json
          generated_at: string | null
        }
        Insert: {
          id?: string
          attempt_id?: string | null
          user_id?: string | null
          report_type: string
          report_data: Json
          generated_at?: string | null
        }
        Update: {
          attempt_id?: string | null
          user_id?: string | null
          report_type?: string
          report_data?: Json
          generated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['attempt_id']
            isOneToOne: false
            referencedRelation: 'personality_attempts'
            referencedColumns: ['id']
          },
        ]
      }
      personality_responses: {
        Row: {
          id: string
          attempt_id: string | null
          question_id: string | null
          response_value: number
          response_time_ms: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          attempt_id?: string | null
          question_id?: string | null
          response_value: number
          response_time_ms?: number | null
          created_at?: string | null
        }
        Update: {
          attempt_id?: string | null
          question_id?: string | null
          response_value?: number
          response_time_ms?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['attempt_id']
            isOneToOne: false
            referencedRelation: 'personality_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'personality_questions'
            referencedColumns: ['id']
          },
        ]
      }
      professional_experience: {
        Row: {
          id: string
          user_id: string
          job_title: string
          company: string
          description: string | null
          location_country: string | null
          start_date: string
          end_date: string | null
          currently_working: boolean | null
          verification_status: Database['public']['Enums']['verification_status'] | null
          verified_by: string | null
          verified_at: string | null
          rejection_reason: string | null
          submitted_at: string | null
          is_hidden: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          job_title: string
          company: string
          description?: string | null
          location_country?: string | null
          start_date: string
          end_date?: string | null
          currently_working?: boolean | null
          verification_status?: Database['public']['Enums']['verification_status'] | null
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          is_hidden?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          job_title?: string
          company?: string
          description?: string | null
          location_country?: string | null
          start_date?: string
          end_date?: string | null
          currently_working?: boolean | null
          verification_status?: Database['public']['Enums']['verification_status'] | null
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          is_hidden?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['verified_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      program_courses: {
        Row: {
          id: string
          program_id: string | null
          course_id: string | null
          sort_order: number
          is_required: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          program_id?: string | null
          course_id?: string | null
          sort_order: number
          is_required?: boolean | null
          created_at?: string | null
        }
        Update: {
          program_id?: string | null
          course_id?: string | null
          sort_order?: number
          is_required?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
        ]
      }
      program_progress: {
        Row: {
          id: string
          user_id: string
          program_id: string
          status: string
          completion_percentage: number | null
          time_spent_minutes: number | null
          started_at: string | null
          completed_at: string | null
          certificate_issued: boolean | null
          certificate_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          program_id: string
          status?: string
          completion_percentage?: number | null
          time_spent_minutes?: number | null
          started_at?: string | null
          completed_at?: string | null
          certificate_issued?: boolean | null
          certificate_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          program_id?: string
          status?: string
          completion_percentage?: number | null
          time_spent_minutes?: number | null
          started_at?: string | null
          completed_at?: string | null
          certificate_issued?: boolean | null
          certificate_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
        ]
      }
      programs: {
        Row: {
          id: string
          title: string
          description: string
          learning_outcomes: Json | null
          skills: Json | null
          level: string
          price: number
          is_free: boolean | null
          intro_video_url: string | null
          cover_image_url: string | null
          duration_minutes: number | null
          creator_id: string | null
          requirements: string | null
          scholarship_eligible: boolean | null
          scholarship_types: Json | null
          is_published: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          learning_outcomes?: Json | null
          skills?: Json | null
          level: string
          price?: number
          is_free?: boolean | null
          intro_video_url?: string | null
          cover_image_url?: string | null
          duration_minutes?: number | null
          creator_id?: string | null
          requirements?: string | null
          scholarship_eligible?: boolean | null
          scholarship_types?: Json | null
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          description?: string
          learning_outcomes?: Json | null
          skills?: Json | null
          level?: string
          price?: number
          is_free?: boolean | null
          intro_video_url?: string | null
          cover_image_url?: string | null
          duration_minutes?: number | null
          creator_id?: string | null
          requirements?: string | null
          scholarship_eligible?: boolean | null
          scholarship_types?: Json | null
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'creators'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_attempt_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option_ids: string[]
          is_correct: boolean
          answered_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option_ids: string[]
          is_correct?: boolean
          answered_at?: string
        }
        Update: {
          attempt_id?: string
          question_id?: string
          selected_option_ids?: string[]
          is_correct?: boolean
          answered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_attempt_answers_attempt_id_fkey'
            columns: ['attempt_id']
            isOneToOne: false
            referencedRelation: 'quiz_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quiz_attempt_answers_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'quiz_questions'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          user_id: string
          score: number
          total_questions: number
          percentage: number | null
          passed: boolean | null
          started_at: string
          completed_at: string | null
          time_taken_seconds: number | null
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id: string
          score?: number
          total_questions: number
          percentage?: number | null
          passed?: boolean | null
          started_at?: string
          completed_at?: string | null
          time_taken_seconds?: number | null
        }
        Update: {
          quiz_id?: string
          user_id?: string
          score?: number
          total_questions?: number
          percentage?: number | null
          passed?: boolean | null
          started_at?: string
          completed_at?: string | null
          time_taken_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_attempts_quiz_id_fkey'
            columns: ['quiz_id']
            isOneToOne: false
            referencedRelation: 'quizzes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quiz_attempts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_question_options: {
        Row: {
          id: string
          question_id: string
          option_text: string
          is_correct: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          option_text: string
          is_correct?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          question_id?: string
          option_text?: string
          is_correct?: boolean
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_question_options_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'quiz_questions'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          question_type: string
          image_url: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          question_type: string
          image_url?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          quiz_id?: string
          question_text?: string
          question_type?: string
          image_url?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_questions_quiz_id_fkey'
            columns: ['quiz_id']
            isOneToOne: false
            referencedRelation: 'quizzes'
            referencedColumns: ['id']
          },
        ]
      }
      quizzes: {
        Row: {
          id: string
          name: string
          description: string | null
          duration_minutes: number
          number_of_questions: number
          is_graded: boolean
          passing_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration_minutes: number
          number_of_questions: number
          is_graded?: boolean
          passing_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          duration_minutes?: number
          number_of_questions?: number
          is_graded?: boolean
          passing_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          purchasable_type: string
          purchasable_id: string
          original_price: number
          discount_amount: number | null
          final_price: number
          payment_method: string
          scholarship_id: string | null
          purchased_at: string | null
          expires_at: string | null
          amount_credits: number | null
          amount_cash: number | null
          currency: string | null
          payment_status: string | null
          payment_reference: string | null
          payment_notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          purchasable_type: string
          purchasable_id: string
          original_price: number
          discount_amount?: number | null
          final_price: number
          payment_method: string
          scholarship_id?: string | null
          purchased_at?: string | null
          expires_at?: string | null
          amount_credits?: number | null
          amount_cash?: number | null
          currency?: string | null
          payment_status?: string | null
          payment_reference?: string | null
          payment_notes?: string | null
        }
        Update: {
          user_id?: string
          purchasable_type?: string
          purchasable_id?: string
          original_price?: number
          discount_amount?: number | null
          final_price?: number
          payment_method?: string
          scholarship_id?: string | null
          purchased_at?: string | null
          expires_at?: string | null
          amount_credits?: number | null
          amount_cash?: number | null
          currency?: string | null
          payment_status?: string | null
          payment_reference?: string | null
          payment_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['scholarship_id']
            isOneToOne: false
            referencedRelation: 'awarded_scholarships'
            referencedColumns: ['id']
          },
        ]
      }
      scholarship_applications: {
        Row: {
          id: string
          user_id: string
          scholarship_id: string
          content_type: string
          content_id: string
          status: string
          application_data: Json | null
          applied_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          review_notes: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          scholarship_id: string
          content_type: string
          content_id: string
          status?: string
          application_data?: Json | null
          applied_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          scholarship_id?: string
          content_type?: string
          content_id?: string
          status?: string
          application_data?: Json | null
          applied_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['scholarship_id']
            isOneToOne: false
            referencedRelation: 'scholarships'
            referencedColumns: ['id']
          },
        ]
      }
      scholarship_content: {
        Row: {
          id: string
          scholarship_id: string | null
          content_type: string
          content_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          scholarship_id?: string | null
          content_type: string
          content_id: string
          created_at?: string | null
        }
        Update: {
          scholarship_id?: string | null
          content_type?: string
          content_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['scholarship_id']
            isOneToOne: false
            referencedRelation: 'scholarships'
            referencedColumns: ['id']
          },
        ]
      }
      scholarships: {
        Row: {
          id: string
          name: string
          description: string
          type: string
          discount_percentage: number
          total_slots: number | null
          slots_remaining: number | null
          eligibility_criteria: Json | null
          is_active: boolean | null
          valid_from: string | null
          valid_until: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          type: string
          discount_percentage: number
          total_slots?: number | null
          slots_remaining?: number | null
          eligibility_criteria?: Json | null
          is_active?: boolean | null
          valid_from?: string | null
          valid_until?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          name?: string
          description?: string
          type?: string
          discount_percentage?: number
          total_slots?: number | null
          slots_remaining?: number | null
          eligibility_criteria?: Json | null
          is_active?: boolean | null
          valid_from?: string | null
          valid_until?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          name: string
          category: Database['public']['Enums']['skill_category']
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: Database['public']['Enums']['skill_category']
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          name?: string
          category?: Database['public']['Enums']['skill_category']
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          id: string
          organization_id: string
          invited_by: string
          email: string
          user_role: Database['public']['Enums']['user_role']
          invitation_token: string
          status: Database['public']['Enums']['invitation_status'] | null
          expires_at: string
          accepted_at: string | null
          accepted_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          invited_by: string
          email: string
          user_role: Database['public']['Enums']['user_role']
          invitation_token: string
          status?: Database['public']['Enums']['invitation_status'] | null
          expires_at: string
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          organization_id?: string
          invited_by?: string
          email?: string
          user_role?: Database['public']['Enums']['user_role']
          invitation_token?: string
          status?: Database['public']['Enums']['invitation_status'] | null
          expires_at?: string
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['accepted_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      user_languages: {
        Row: {
          id: string
          user_id: string
          language_name: string
          proficiency_level: Database['public']['Enums']['language_proficiency']
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          language_name: string
          proficiency_level: Database['public']['Enums']['language_proficiency']
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          language_name?: string
          proficiency_level?: Database['public']['Enums']['language_proficiency']
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_skill_badges: {
        Row: {
          id: string
          user_id: string
          assessment_template_id: string
          best_attempt_id: string | null
          best_wpm: number | null
          best_accuracy: number | null
          badge_level: string
          badge_level_numeric: number
          badge_color: string | null
          display_on_profile: boolean | null
          display_order: number | null
          earned_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          assessment_template_id: string
          best_attempt_id?: string | null
          best_wpm?: number | null
          best_accuracy?: number | null
          badge_level: string
          badge_level_numeric: number
          badge_color?: string | null
          display_on_profile?: boolean | null
          display_order?: number | null
          earned_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          assessment_template_id?: string
          best_attempt_id?: string | null
          best_wpm?: number | null
          best_accuracy?: number | null
          badge_level?: string
          badge_level_numeric?: number
          badge_color?: string | null
          display_on_profile?: boolean | null
          display_order?: number | null
          earned_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['assessment_template_id']
            isOneToOne: false
            referencedRelation: 'assessment_templates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['best_attempt_id']
            isOneToOne: false
            referencedRelation: 'assessment_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_skills: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          created_at?: string | null
        }
        Update: {
          user_id?: string
          skill_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['skill_id']
            isOneToOne: false
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
        ]
      }
      user_verified_skills: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          source_type: Database['public']['Enums']['skill_source_type']
          source_id: string
          verified_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          source_type: Database['public']['Enums']['skill_source_type']
          source_id: string
          verified_at?: string | null
          created_at?: string | null
        }
        Update: {
          user_id?: string
          skill_id?: string
          source_type?: Database['public']['Enums']['skill_source_type']
          source_id?: string
          verified_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['skill_id']
            isOneToOne: false
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          account_type: Database['public']['Enums']['account_type']
          user_role: Database['public']['Enums']['user_role']
          organization_id: string | null
          current_context: Database['public']['Enums']['user_context'] | null
          created_at: string | null
          updated_at: string | null
          avatar_url: string | null
          phone: string | null
          bio: string | null
          location: string | null
          linkedin_url: string | null
          portfolio_url: string | null
          resume_url: string | null
          is_active: boolean | null
          last_login_at: string | null
          email_verified: boolean | null
          phone_verified: boolean | null
          invitation_sent_at: string | null
          invitation_accepted_at: string | null
          invited_by: string | null
          onboarding_completed: boolean | null
          temporary_password_hash: string | null
          temp_password_expires_at: string | null
          is_suspended: boolean | null
          suspension_reason: string | null
          suspended_at: string | null
          suspended_by: string | null
          city: string | null
          state: string | null
          country: string | null
          intro_video_url: string | null
          profession: string | null
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          account_type?: Database['public']['Enums']['account_type']
          user_role?: Database['public']['Enums']['user_role']
          organization_id?: string | null
          current_context?: Database['public']['Enums']['user_context'] | null
          created_at?: string | null
          updated_at?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          location?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          email_verified?: boolean | null
          phone_verified?: boolean | null
          invitation_sent_at?: string | null
          invitation_accepted_at?: string | null
          invited_by?: string | null
          onboarding_completed?: boolean | null
          temporary_password_hash?: string | null
          temp_password_expires_at?: string | null
          is_suspended?: boolean | null
          suspension_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          intro_video_url?: string | null
          profession?: string | null
        }
        Update: {
          email?: string
          first_name?: string | null
          last_name?: string | null
          account_type?: Database['public']['Enums']['account_type']
          user_role?: Database['public']['Enums']['user_role']
          organization_id?: string | null
          current_context?: Database['public']['Enums']['user_context'] | null
          created_at?: string | null
          updated_at?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          location?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          email_verified?: boolean | null
          phone_verified?: boolean | null
          invitation_sent_at?: string | null
          invitation_accepted_at?: string | null
          invited_by?: string | null
          onboarding_completed?: boolean | null
          temporary_password_hash?: string | null
          temp_password_expires_at?: string | null
          is_suspended?: boolean | null
          suspension_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          intro_video_url?: string | null
          profession?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'undefined'
            columns: ['suspended_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      vacancies: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string
          requirements: string | null
          responsibilities: string | null
          location_country: string | null
          location_state: string | null
          location_city: string | null
          is_remote: boolean | null
          employment_type: Database['public']['Enums']['employment_type']
          experience_level: Database['public']['Enums']['experience_level']
          salary_range_min: number | null
          salary_range_max: number | null
          salary_currency: string | null
          required_skills: Json | null
          preferred_skills: Json | null
          benefits: Json | null
          application_deadline: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          work_location: Database['public']['Enums']['work_location_type'] | null
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          description: string
          requirements?: string | null
          responsibilities?: string | null
          location_country?: string | null
          location_state?: string | null
          location_city?: string | null
          is_remote?: boolean | null
          employment_type: Database['public']['Enums']['employment_type']
          experience_level: Database['public']['Enums']['experience_level']
          salary_range_min?: number | null
          salary_range_max?: number | null
          salary_currency?: string | null
          required_skills?: Json | null
          preferred_skills?: Json | null
          benefits?: Json | null
          application_deadline?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          work_location?: Database['public']['Enums']['work_location_type'] | null
        }
        Update: {
          organization_id?: string
          title?: string
          description?: string
          requirements?: string | null
          responsibilities?: string | null
          location_country?: string | null
          location_state?: string | null
          location_city?: string | null
          is_remote?: boolean | null
          employment_type?: Database['public']['Enums']['employment_type']
          experience_level?: Database['public']['Enums']['experience_level']
          salary_range_min?: number | null
          salary_range_max?: number | null
          salary_currency?: string | null
          required_skills?: Json | null
          preferred_skills?: Json | null
          benefits?: Json | null
          application_deadline?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          work_location?: Database['public']['Enums']['work_location_type'] | null
        }
        Relationships: [
          {
            foreignKeyName: 'undefined'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      organization_members: {
        Row: {
          id: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          user_role: Database['public']['Enums']['user_role'] | null
          organization_id: string | null
          is_active: boolean | null
          last_login_at: string | null
          created_at: string | null
          organization_name: string | null
          organization_slug: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_enroll_course_modules: {
        Args: Record<string, never>
        Returns: unknown
      }
      auto_enroll_program_courses: {
        Args: Record<string, never>
        Returns: unknown
      }
      award_credits: {
        Args: Record<string, never>
        Returns: unknown
      }
      calculate_course_progress: {
        Args: Record<string, never>
        Returns: unknown
      }
      calculate_module_progress: {
        Args: Record<string, never>
        Returns: unknown
      }
      calculate_program_progress: {
        Args: Record<string, never>
        Returns: unknown
      }
      calculate_skill_level: {
        Args: Record<string, never>
        Returns: unknown
      }
      cleanup_expired_confirmation_tokens: {
        Args: Record<string, never>
        Returns: unknown
      }
      compute_course_duration: {
        Args: Record<string, never>
        Returns: unknown
      }
      compute_module_duration: {
        Args: Record<string, never>
        Returns: unknown
      }
      compute_program_duration: {
        Args: Record<string, never>
        Returns: unknown
      }
      create_credit_wallet_for_new_user: {
        Args: Record<string, never>
        Returns: unknown
      }
      create_team_invitation: {
        Args: Record<string, never>
        Returns: unknown
      }
      custom_access_token_hook: {
        Args: Record<string, never>
        Returns: unknown
      }
      generate_invitation_token: {
        Args: Record<string, never>
        Returns: unknown
      }
      generate_organization_slug: {
        Args: Record<string, never>
        Returns: unknown
      }
      get_best_quiz_attempt: {
        Args: Record<string, never>
        Returns: unknown
      }
      get_latest_quiz_attempt: {
        Args: Record<string, never>
        Returns: unknown
      }
      get_next_attempt_number: {
        Args: Record<string, never>
        Returns: unknown
      }
      get_official_score: {
        Args: Record<string, never>
        Returns: unknown
      }
      get_user_account_type: {
        Args: Record<string, never>
        Returns: unknown
      }
      get_user_organization_id: {
        Args: Record<string, never>
        Returns: unknown
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: unknown
      }
      handle_new_user: {
        Args: Record<string, never>
        Returns: unknown
      }
      increment_content_usage: {
        Args: Record<string, never>
        Returns: unknown
      }
      is_platform_admin: {
        Args: Record<string, never>
        Returns: unknown
      }
      log_activity: {
        Args: Record<string, never>
        Returns: unknown
      }
      mark_invitation_token_used: {
        Args: Record<string, never>
        Returns: unknown
      }
      preserve_vacancy_details_before_delete: {
        Args: Record<string, never>
        Returns: unknown
      }
      set_organization_slug: {
        Args: Record<string, never>
        Returns: unknown
      }
      spend_credits: {
        Args: Record<string, never>
        Returns: unknown
      }
      sync_user_metadata: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_cognitive_updated_at: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_course_duration: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_course_progress_on_module_change: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_job_applications_updated_at: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_module_duration: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_module_progress_on_lesson_change: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_program_duration: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_program_progress_on_course_change: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_scholarship_applications_updated_at: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_updated_at_column: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_user_assessment_history_updated_at: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_vacancies_updated_at: {
        Args: Record<string, never>
        Returns: unknown
      }
      validate_invitation_token: {
        Args: Record<string, never>
        Returns: unknown
      }
    }
    Enums: {
      account_type: 'personal' | 'organization' | 'platformAdmin' | 'hybrid'
      activity_type: 'user_login' | 'user_logout' | 'user_created' | 'user_updated' | 'user_deleted' | 'organization_created' | 'organization_updated' | 'organization_verified' | 'organization_suspended' | 'team_member_invited' | 'team_member_joined' | 'team_member_removed' | 'role_changed' | 'context_switched' | 'settings_updated' | 'password_changed' | 'email_changed'
      education_level: 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd'
      employment_type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary'
      experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
      industry_type: 'technology' | 'healthcare' | 'finance' | 'education' | 'retail' | 'manufacturing' | 'hospitality' | 'construction' | 'transportation' | 'energy' | 'telecommunications' | 'media' | 'real_estate' | 'legal' | 'consulting' | 'nonprofit' | 'government' | 'other'
      invitation_status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
      job_application_status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn'
      language_proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic'
      organization_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
      organization_verification_status: 'pending' | 'verified' | 'rejected' | 'suspended'
      skill_category: 'technical' | 'soft_skill' | 'industry_specific' | 'business' | 'creative' | 'data_analytics' | 'leadership' | 'communication' | 'digital_literacy'
      skill_source_type: 'learning_completion' | 'assessment_passed'
      user_context: 'personal' | 'organization'
      user_role: 'candidate' | 'premium_member' | 'organization_member' | 'recruiter' | 'hr_manager' | 'hiring_manager' | 'org_admin' | 'super_admin' | 'moderator' | 'support'
      verification_status: 'pending' | 'verified' | 'rejected'
      work_location_type: 'remote' | 'in_office' | 'hybrid'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
