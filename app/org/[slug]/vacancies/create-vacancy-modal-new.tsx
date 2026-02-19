'use client';

import { useState, useEffect } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDialogFooter,
  LunaButton,
  LunaInput,
  LunaSearchableSelect,
  LunaCombobox,
  LunaRichTextEditor,
  LunaDatePicker,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Briefcase, FileText, DollarSign, GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import { Country, State, City } from 'country-state-city';

type EmploymentType = Database['public']['Enums']['employment_type'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

interface CreateVacancyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess?: () => void;
}

type Step = 'basic' | 'details' | 'compensation' | 'prerequisites';

interface Skill {
  id: string;
  name: string;
}

interface Assessment {
  id: string;
  title: string;
  type: string;
  category?: string;
}

interface LearningContent {
  id: string;
  title: string;
  type: 'module' | 'course' | 'program';
}

export function CreateVacancyModal({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: CreateVacancyModalProps) {
  const [step, setStep] = useState<Step>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data for dropdowns
  const [skills, setSkills] = useState<Skill[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [learningContent, setLearningContent] = useState<LearningContent[]>([]);

  // Form data - Step 1: Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid');
  const [workLocation, setWorkLocation] = useState<'remote' | 'in-office' | 'hybrid'>('in-office');
  const [country, setCountry] = useState<string[]>([]);
  const [state, setState] = useState<string[]>([]);
  const [city, setCity] = useState<string[]>([]);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full-time');

  // Form data - Step 2: Job Details
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');

  // Form data - Step 3: Compensation & Skills
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState<'hourly' | 'monthly' | 'yearly'>('yearly');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  // Form data - Step 4: Prerequisites
  const [prerequisiteAssessments, setPrerequisiteAssessments] = useState<string[]>([]);
  const [prerequisiteLearningContent, setPrerequisiteLearningContent] = useState<string[]>([]);

  // Fetch skills, assessments, and learning content on mount
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    const supabase = createClient();

    // Fetch skills
    const { data: skillsData } = await supabase
      .from('skills')
      .select('id, name')
      .order('name');

    if (skillsData) {
      setSkills(skillsData);
    }

    // Fetch assessments from multiple sources
    const allAssessments: Assessment[] = [];

    // 1. Typing/Transcription/Multilingual assessments
    const { data: typingAssessments } = await supabase
      .from('assessment_templates')
      .select('id, title, category')
      .eq('is_active', true)
      .in('category', ['typing', 'transcription', 'multilingual'])
      .order('title');

    if (typingAssessments) {
      allAssessments.push(...typingAssessments.map(a => ({
        id: a.id,
        title: a.title,
        type: 'typing',
        category: a.category || undefined,
      })));
    }

    // 2. Cognitive assessments
    const { data: cognitiveAssessments } = await supabase
      .from('cognitive_templates')
      .select('id, title')
      .eq('is_active', true)
      .order('title');

    if (cognitiveAssessments) {
      allAssessments.push(...cognitiveAssessments.map(a => ({
        id: a.id,
        title: a.title,
        type: 'cognitive',
      })));
    }

    // 3. Personality assessments
    const { data: personalityAssessments } = await supabase
      .from('assessment_templates')
      .select('id, title')
      .eq('is_active', true)
      .eq('category', 'personality')
      .order('title');

    if (personalityAssessments) {
      allAssessments.push(...personalityAssessments.map(a => ({
        id: a.id,
        title: a.title,
        type: 'personality',
      })));
    }

    // 4. Knowledge assessments
    const { data: knowledgeAssessments } = await supabase
      .from('knowledge_assessments')
      .select('id, title, category')
      .eq('is_published', true)
      .order('title');

    if (knowledgeAssessments) {
      allAssessments.push(...knowledgeAssessments.map(a => ({
        id: a.id,
        title: a.title,
        type: 'knowledge',
        category: a.category || undefined,
      })));
    }

    setAssessments(allAssessments);

    // Fetch learning content
    const allLearningContent: LearningContent[] = [];

    // 1. Modules
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title')
      .eq('is_published', true)
      .order('title');

    if (modules) {
      allLearningContent.push(...modules.map(m => ({
        id: m.id,
        title: m.title,
        type: 'module' as const,
      })));
    }

    // 2. Courses
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_published', true)
      .order('title');

    if (courses) {
      allLearningContent.push(...courses.map(c => ({
        id: c.id,
        title: c.title,
        type: 'course' as const,
      })));
    }

    // 3. Programs
    const { data: programs } = await supabase
      .from('programs')
      .select('id, title')
      .eq('is_published', true)
      .order('title');

    if (programs) {
      allLearningContent.push(...programs.map(p => ({
        id: p.id,
        title: p.title,
        type: 'program' as const,
      })));
    }

    setLearningContent(allLearningContent);
  };

  const handleNext = () => {
    if (step === 'basic') {
      if (!title.trim() || !description.trim() || !employmentType) {
        setError('Please fill in all required fields');
        return;
      }
      setError('');
      setStep('details');
    } else if (step === 'details') {
      setError('');
      setStep('compensation');
    } else if (step === 'compensation') {
      setError('');
      setStep('prerequisites');
    }
  };

  // Get location options
  const countries = Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }));
  const states = country[0] ? State.getStatesOfCountry(country[0]).map(s => ({ label: s.name, value: s.isoCode })) : [];
  const cities = country[0] && state[0] ? City.getCitiesOfState(country[0], state[0]).map(c => ({ label: c.name, value: c.name })) : [];

  const handlePrevious = () => {
    setError('');
    if (step === 'details') {
      setStep('basic');
    } else if (step === 'compensation') {
      setStep('details');
    } else if (step === 'prerequisites') {
      setStep('compensation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in');
        setLoading(false);
        return;
      }

      // Get location names from ISO codes
      const countryName = country[0] ? Country.getCountryByCode(country[0])?.name || null : null;
      const stateName = country[0] && state[0] ? State.getStateByCodeAndCountry(state[0], country[0])?.name || null : null;
      const cityName = city[0] || null;

      // Build prerequisite arrays with full details
      const prerequisiteAssessmentsData = prerequisiteAssessments.map(id => {
        const assessment = assessments.find(a => a.id === id);
        return assessment ? {
          id: assessment.id,
          type: assessment.type,
          title: assessment.title,
          category: assessment.category,
        } : null;
      }).filter(Boolean);

      const prerequisiteLearningContentData = prerequisiteLearningContent.map(id => {
        const content = learningContent.find(c => c.id === id);
        return content ? {
          id: content.id,
          type: content.type,
          title: content.title,
        } : null;
      }).filter(Boolean);

      const { error: insertError } = await supabase
        .from('vacancies')
        .insert({
          organization_id: organizationId,
          title: title.trim(),
          description: description.trim(),
          responsibilities: responsibilities.trim() || null,
          requirements: requirements.trim() || null,
          employment_type: employmentType,
          experience_level: experienceLevel,
          is_remote: workLocation === 'remote',
          location_city: workLocation === 'remote' ? null : cityName,
          location_state: workLocation === 'remote' ? null : stateName,
          location_country: workLocation === 'remote' ? null : countryName,
          salary_range_min: salaryMin ? parseInt(salaryMin) : null,
          salary_range_max: salaryMax ? parseInt(salaryMax) : null,
          salary_currency: 'USD',
          required_skills: requiredSkills,
          preferred_skills: preferredSkills,
          application_deadline: deadline ? deadline.toISOString() : null,
          prerequisite_assessments: prerequisiteAssessmentsData,
          prerequisite_learning_content: prerequisiteLearningContentData,
          is_active: true,
          created_by: session.user.id,
        });

      if (insertError) {
        throw insertError;
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('basic');
    setTitle('');
    setDescription('');
    setExperienceLevel('mid');
    setWorkLocation('in-office');
    setCountry([]);
    setState([]);
    setCity([]);
    setEmploymentType('full-time');
    setResponsibilities('');
    setRequirements('');
    setRequiredSkills([]);
    setPreferredSkills([]);
    setSalaryMin('');
    setSalaryMax('');
    setSalaryPeriod('yearly');
    setDeadline(undefined);
    setPrerequisiteAssessments([]);
    setPrerequisiteLearningContent([]);
    setError('');
    onOpenChange(false);
  };

  const skillOptions = skills.map(skill => ({
    value: skill.id,
    label: skill.name,
  }));

  const employmentTypeOptions = [
    { label: 'Full Time', value: 'full-time' },
    { label: 'Part Time', value: 'part-time' },
    { label: 'Contract', value: 'contract' },
    { label: 'Internship', value: 'internship' },
    { label: 'Temporary', value: 'temporary' },
  ];

  const experienceLevelOptions = [
    { label: 'Entry Level', value: 'entry' },
    { label: 'Mid Level', value: 'mid' },
    { label: 'Senior Level', value: 'senior' },
    { label: 'Lead', value: 'lead' },
    { label: 'Executive', value: 'executive' },
  ];

  const salaryPeriodOptions = [
    { label: 'Hourly', value: 'hourly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  const workLocationOptions = [
    { label: 'Remote', value: 'remote' },
    { label: 'In Office', value: 'in-office' },
    { label: 'Hybrid', value: 'hybrid' },
  ];

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-3xl">
        <LunaDialogHeader>
          <LunaDialogTitle>Create New Vacancy</LunaDialogTitle>
          <LunaDialogDescription>
            Post a new job opening for your organization. Fill in the details across four steps.
          </LunaDialogDescription>
        </LunaDialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'basic' ? 'bg-luna-blue text-white' : 'bg-luna-gray-200 text-luna-gray-600'
            }`}>
              <Briefcase className="w-4 h-4" />
            </div>
            <span className={`text-sm font-medium ${
              step === 'basic' ? 'text-luna-blue' : 'text-luna-gray-600'
            }`}>
              Basic Info
            </span>
          </div>

          <div className="w-12 h-0.5 bg-luna-gray-200" />

          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'details' ? 'bg-luna-blue text-white' : 'bg-luna-gray-200 text-luna-gray-600'
            }`}>
              <FileText className="w-4 h-4" />
            </div>
            <span className={`text-sm font-medium ${
              step === 'details' ? 'text-luna-blue' : 'text-luna-gray-600'
            }`}>
              Job Details
            </span>
          </div>

          <div className="w-12 h-0.5 bg-luna-gray-200" />

          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'compensation' ? 'bg-luna-blue text-white' : 'bg-luna-gray-200 text-luna-gray-600'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <span className={`text-sm font-medium ${
              step === 'compensation' ? 'text-luna-blue' : 'text-luna-gray-600'
            }`}>
              Compensation
            </span>
          </div>

          <div className="w-12 h-0.5 bg-luna-gray-200" />

          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'prerequisites' ? 'bg-luna-blue text-white' : 'bg-luna-gray-200 text-luna-gray-600'
            }`}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className={`text-sm font-medium ${
              step === 'prerequisites' ? 'text-luna-blue' : 'text-luna-gray-600'
            }`}>
              Prerequisites
            </span>
          </div>
        </div>

        <LunaDialogBody className="max-h-[60vh] overflow-y-auto">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'basic' && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
              <LunaInput
                label="Job Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />

              <div className="grid grid-cols-3 gap-4">
                <LunaSearchableSelect
                  label="Experience Level"
                  required
                  placeholder="Select level"
                  options={experienceLevelOptions}
                  value={experienceLevel}
                  onValueChange={(value) => setExperienceLevel(value as ExperienceLevel)}
                />

                <LunaSearchableSelect
                  label="Employment Type"
                  required
                  placeholder="Select type"
                  options={employmentTypeOptions}
                  value={employmentType}
                  onValueChange={(value) => setEmploymentType(value as EmploymentType)}
                />

                <LunaSearchableSelect
                  label="Work Location"
                  required
                  placeholder="Select work location"
                  options={workLocationOptions}
                  value={workLocation}
                  onValueChange={(value) => setWorkLocation(value as 'remote' | 'in-office' | 'hybrid')}
                />
              </div>

              <LunaRichTextEditor
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Enter job description..."
                minHeight={75}
              />

              {workLocation !== 'remote' && (
                <div className="grid grid-cols-3 gap-4">
                  <LunaSearchableSelect
                    label="Country"
                    placeholder="Select country"
                    searchPlaceholder="Search countries..."
                    options={countries}
                    value={country[0] || ''}
                    onValueChange={(value) => {
                      setCountry(value ? [value] : []);
                      setState([]);
                      setCity([]);
                    }}
                  />

                  <LunaSearchableSelect
                    label="State"
                    placeholder="Select state"
                    searchPlaceholder="Search states..."
                    options={states}
                    value={state[0] || ''}
                    onValueChange={(value) => {
                      setState(value ? [value] : []);
                      setCity([]);
                    }}
                    disabled={!country[0]}
                  />

                  <LunaSearchableSelect
                    label="City"
                    placeholder="Select city"
                    searchPlaceholder="Search cities..."
                    options={cities}
                    value={city[0] || ''}
                    onValueChange={(value) => setCity(value ? [value] : [])}
                    disabled={!state[0]}
                  />
                </div>
              )}
            </form>
          )}

          {step === 'details' && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
              <LunaRichTextEditor
                label="Responsibilities"
                value={responsibilities}
                onChange={setResponsibilities}
                placeholder="Enter job responsibilities..."
                minHeight={75}
              />

              <LunaRichTextEditor
                label="Requirements"
                value={requirements}
                onChange={setRequirements}
                placeholder="Enter job requirements..."
                minHeight={75}
              />
            </form>
          )}

          {step === 'compensation' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <LunaCombobox
                label="Required Skills"
                placeholder="Select required skills"
                searchPlaceholder="Search skills..."
                options={skillOptions}
                value={requiredSkills}
                onChange={setRequiredSkills}
              />

              <LunaCombobox
                label="Preferred Skills"
                placeholder="Select preferred skills"
                searchPlaceholder="Search skills..."
                options={skillOptions}
                value={preferredSkills}
                onChange={setPreferredSkills}
              />

              <div className="grid grid-cols-3 gap-4">
                <LunaInput
                  label="Minimum Salary"
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="e.g. 50000"
                />

                <LunaInput
                  label="Maximum Salary"
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="e.g. 80000"
                />

                <LunaSearchableSelect
                  label="Salary Period"
                  placeholder="Select period"
                  options={salaryPeriodOptions}
                  value={salaryPeriod}
                  onValueChange={(value) => setSalaryPeriod(value as 'hourly' | 'monthly' | 'yearly')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-luna-gray-900 mb-1.5">
                  Application Deadline
                </label>
                <LunaDatePicker
                  value={deadline}
                  onChange={setDeadline}
                  placeholder="Select application deadline"
                />
              </div>

              <div className="bg-luna-blue/5 border border-luna-blue/20 rounded-lg p-3">
                <p className="text-sm text-luna-gray-700">
                  <strong>Note:</strong> Compensation is displayed in dollars by default. Users can view converted amounts on the vacancy details page.
                </p>
              </div>
            </form>
          )}

          {step === 'prerequisites' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-luna-gray-700 mb-2">
                    Required Assessments (Optional)
                  </label>
                  <p className="text-sm text-luna-gray-600 mb-3">
                    Select assessments that candidates must complete before applying to this vacancy.
                  </p>
                  <LunaCombobox
                    options={assessments.map(a => ({
                      value: a.id,
                      label: `${a.title} (${a.type}${a.category ? ` - ${a.category}` : ''})`,
                    }))}
                    value={prerequisiteAssessments}
                    onChange={setPrerequisiteAssessments}
                    placeholder="Select assessments..."
                    searchPlaceholder="Search assessments..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-luna-gray-700 mb-2">
                    Required Learning Content (Optional)
                  </label>
                  <p className="text-sm text-luna-gray-600 mb-3">
                    Select modules, courses, or programs that candidates must complete before applying.
                  </p>
                  <LunaCombobox
                    options={learningContent.map(c => ({
                      value: c.id,
                      label: `${c.title} (${c.type})`,
                    }))}
                    value={prerequisiteLearningContent}
                    onChange={setPrerequisiteLearningContent}
                    placeholder="Select learning content..."
                    searchPlaceholder="Search content..."
                  />
                </div>

                <div className="bg-luna-blue/5 border border-luna-blue/20 rounded-lg p-3">
                  <p className="text-sm text-luna-gray-700">
                    <strong>Note:</strong> Candidates will only be able to apply if they have completed all selected prerequisites in the system.
                  </p>
                </div>
              </div>
            </form>
          )}
        </LunaDialogBody>

        <LunaDialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {step !== 'basic' && (
                <LunaButton
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                >
                  Back
                </LunaButton>
              )}
            </div>

            <div className="flex gap-2">
              <LunaButton
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </LunaButton>

              {step !== 'prerequisites' ? (
                <LunaButton
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                </LunaButton>
              ) : (
                <LunaButton
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Vacancy
                </LunaButton>
              )}
            </div>
          </div>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

