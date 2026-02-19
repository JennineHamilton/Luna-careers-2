'use client';

import { useState } from 'react';
import { LunaTabs, LunaTabsList, LunaTabsTrigger, LunaTabsContent } from '@/components/luna/tabs';
import { Award, FileText } from 'lucide-react';
import { ScholarshipProgramsTab } from './tabs/scholarship-programs-tab';
import { ScholarshipApplicationsTab } from './tabs/scholarship-applications-tab';
import type { Database } from '@/types/database.types';

type Scholarship = Database['public']['Tables']['scholarships']['Row'];
type ScholarshipApplicationRow = Database['public']['Tables']['scholarship_applications']['Row'];

interface ScholarshipApplication extends ScholarshipApplicationRow {
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  scholarships: {
    id: string;
    name: string;
    type: string;
    discount_percentage: number;
  } | null;
}

interface ScholarshipsTabsProps {
  initialScholarships: Scholarship[];
  initialApplications: ScholarshipApplication[];
  contentDetails: Record<string, { title: string; image: string | null; type: string }>;
  currentUserId: string;
}

export function ScholarshipsTabs({
  initialScholarships,
  initialApplications,
  contentDetails,
  currentUserId,
}: ScholarshipsTabsProps) {
  const [activeTab, setActiveTab] = useState('programs');

  return (
    <LunaTabs value={activeTab} onValueChange={setActiveTab}>
      <LunaTabsList className="mb-6">
        <LunaTabsTrigger value="programs" className="flex items-center gap-2">
          <Award className="w-4 h-4" />
          Scholarship Programs
        </LunaTabsTrigger>
        <LunaTabsTrigger value="applications" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Applications
        </LunaTabsTrigger>
      </LunaTabsList>

      <LunaTabsContent value="programs">
        <ScholarshipProgramsTab initialScholarships={initialScholarships} />
      </LunaTabsContent>

      <LunaTabsContent value="applications">
        <ScholarshipApplicationsTab
          initialApplications={initialApplications}
          contentDetails={contentDetails}
          currentUserId={currentUserId}
        />
      </LunaTabsContent>
    </LunaTabs>
  );
}

