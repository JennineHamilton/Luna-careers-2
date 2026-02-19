'use client';

import { useState } from 'react';
import { LunaTabs, LunaTabsList, LunaTabsTrigger, LunaTabsContent } from '@/components/luna/tabs';
import { Video, ClipboardList } from 'lucide-react';
import { LessonsClientTable } from './lessons-client-table';
import { QuizzesClientTable } from './quizzes-client-table';
import type { Database } from '@/types/database.types';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type Quiz = Database['public']['Tables']['quizzes']['Row'] & {
  question_count?: number;
};

interface LessonsTabsProps {
  initialLessons: Lesson[];
  initialQuizzes: Quiz[];
}

export function LessonsTabs({ initialLessons, initialQuizzes }: LessonsTabsProps) {
  const [activeTab, setActiveTab] = useState('lessons');

  return (
    <LunaTabs value={activeTab} onValueChange={setActiveTab}>
      <LunaTabsList className="mb-6">
        <LunaTabsTrigger value="lessons" className="flex items-center gap-2">
          <Video className="w-4 h-4" />
          Lessons
        </LunaTabsTrigger>
        <LunaTabsTrigger value="quizzes" className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Quizzes
        </LunaTabsTrigger>
      </LunaTabsList>

      <LunaTabsContent value="lessons">
        <LessonsClientTable initialLessons={initialLessons} />
      </LunaTabsContent>

      <LunaTabsContent value="quizzes">
        <QuizzesClientTable initialQuizzes={initialQuizzes} />
      </LunaTabsContent>
    </LunaTabs>
  );
}

