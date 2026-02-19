# Cognitive Assessment Integration Plan

## ✅ Confirmed Requirements

### 1. Admin Management (`/cmd/screening`)
**Location:** `app/cmd/screening/page.tsx` and `screening-client-table.tsx`

**Functionality:**
- Cognitive assessment will appear in the assessments table alongside typing/transcription tests
- Admin can **suspend/unsuspend** the cognitive test (toggle `is_active` status)
- Admin **CANNOT** edit or delete the cognitive assessment (system-managed)
- Similar to personality assessment (system-managed template)

**Implementation:**
- Cognitive template will have `is_system_managed: true` flag
- Will appear in the data table with:
  - Title: "ICAR Cognitive Assessment"
  - Type: "Cognitive"
  - Status badge: Active/Inactive
  - Actions: Only "Suspend/Activate" (no Edit/Delete)

---

### 2. Module Structure
**Location:** `components/assessment/` directory

**Existing Assessment Modules:**
- `basic-typing-test.tsx` - Typing test module
- `personality-assessment-modal.tsx` - Personality assessment module
- `take-assessment-modal.tsx` - Assessment launcher
- `results-modal.tsx` - Typing results display
- `personality-results.tsx` - Personality results display

**New Cognitive Module Files to Create:**
- `cognitive-assessment-modal.tsx` - Main cognitive assessment interface (jsPsych integration)
- `cognitive-results.tsx` - Cognitive results display component

**Module Pattern:**
```tsx
// components/assessment/cognitive-assessment-modal.tsx
export function CognitiveAssessmentModal({
  open,
  onClose,
  onComplete
}: CognitiveAssessmentModalProps) {
  // jsPsych integration
  // Device detection
  // Auto-save responses
  // Progress tracking
}
```

---

### 3. Results Display on `/u/profile`
**Location:** `app/u/profile/profile-client.tsx` - "Screening" tab

**Current Screening Tab Structure:**
```tsx
<LunaTabsTrigger value="screening">
  <ClipboardCheck className="w-4 h-4 mr-2" />
  Screening
</LunaTabsTrigger>
```

**Screening Tab Content** (`components/screening/screening-tab.tsx`):
- **Section 1:** Professional Profile Overview
- **Section 2:** Soft Skills (Personality Assessment)
- **Section 3:** Cognitive Abilities ← **NEW COGNITIVE RESULTS HERE**
- **Section 4:** Technical/Practical Skills (Typing/Transcription)
- **Section 5:** Work Preferences

**Cognitive Section Component** (`components/screening/cognitive-section.tsx`):
Currently shows placeholder. Will be updated to show:

**If NOT completed:**
```tsx
<LunaButton onClick={() => setShowCognitiveModal(true)}>
  <Brain className="h-4 w-4 mr-2" />
  Take Cognitive Assessment
</LunaButton>
```

**If completed:**
```tsx
<CognitiveReport attempt={cognitiveAttempt} insights={insights} />
```

---

## 📊 Cognitive Results Report Format

### Design Pattern: Match Existing Reports

**Reference Examples:**
1. **Typing Report** (`components/screening/typing-report.tsx`)
   - Key metrics in cards (WPM, Accuracy, Consistency)
   - Performance badge
   - Line chart showing progress over attempts
   - One-line insight

2. **Personality Report** (`components/screening/personality-report.tsx`)
   - Big Five scores with progress bars
   - Percentile indicators
   - Auto-generated descriptors
   - Collapsible detailed breakdown
   - Insights cards with badges

### Cognitive Report Structure

```tsx
// components/screening/cognitive-report.tsx

<LunaCard>
  {/* Header */}
  <LunaCardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Brain className="h-5 w-5 text-purple-600" />
        <div>
          <LunaCardTitle>Cognitive Abilities</LunaCardTitle>
          <p className="text-sm text-luna-gray-600">
            ICAR Assessment • Completed {formatDate(attempt.completed_at)}
          </p>
        </div>
      </div>
      <LunaBadge variant={getPerformanceBadge(attempt.overall_percentile)}>
        {attempt.overall_percentile}th Percentile
      </LunaBadge>
    </div>
  </LunaCardHeader>

  <LunaCardContent>
    {/* Overall Score Card */}
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-luna-gray-600">Overall Cognitive Score</p>
          <p className="text-3xl font-bold text-purple-600">{attempt.overall_score}/100</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-luna-gray-600">Percentile Rank</p>
          <p className="text-2xl font-semibold text-luna-gray-900">
            {attempt.overall_percentile}th
          </p>
          <p className="text-xs text-luna-gray-500">
            Better than {attempt.overall_percentile}% of test-takers
          </p>
        </div>
      </div>
    </div>

    {/* Domain Scores Grid */}
    <div className="grid grid-cols-2 gap-4 mb-6">
      <DomainScoreCard
        icon={<BookOpen />}
        title="Verbal Reasoning"
        score={attempt.verbal_score}
        percentile={attempt.verbal_percentile}
        color="blue"
      />
      <DomainScoreCard
        icon={<Calculator />}
        title="Numerical Reasoning"
        score={attempt.numerical_score}
        percentile={attempt.numerical_percentile}
        color="green"
      />
      <DomainScoreCard
        icon={<Grid3x3 />}
        title="Abstract Reasoning"
        score={attempt.abstract_score}
        percentile={attempt.abstract_percentile}
        color="purple"
      />
      <DomainScoreCard
        icon={<Eye />}
        title="Attention to Detail"
        score={attempt.attention_score}
        percentile={attempt.attention_percentile}
        color="orange"
      />
    </div>

    {/* Radar Chart (Optional) */}
    <div className="mb-6">
      <h4 className="text-sm font-semibold mb-3">Cognitive Profile</h4>
      <RadarChart data={domainScores} />
    </div>

    {/* Insights */}
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Key Insights</h4>
      
      {/* Strengths */}
      {strengths.map(insight => (
        <InsightCard
          key={insight.id}
          category="Strength"
          title={insight.title}
          description={insight.description}
          variant="success"
        />
      ))}

      {/* Weaknesses */}
      {weaknesses.map(insight => (
        <InsightCard
          key={insight.id}
          category="Development Area"
          title={insight.title}
          description={insight.description}
          variant="warning"
        />
      ))}

      {/* Recommendations */}
      {recommendations.map(insight => (
        <InsightCard
          key={insight.id}
          category="Recommendation"
          title={insight.title}
          description={insight.description}
          variant="info"
        />
      ))}
    </div>

    {/* View Detailed Results Button */}
    <div className="mt-6 pt-6 border-t border-luna-gray-200">
      <LunaButton
        variant="outline"
        onClick={() => setShowDetailedResults(true)}
        className="w-full"
      >
        View Detailed Results
        <ChevronRight className="h-4 w-4 ml-2" />
      </LunaButton>
    </div>
  </LunaCardContent>
</LunaCard>
```

---

## 🎨 Visual Cohesion Strategy

### Color Coding (Match Existing Pattern)
- **Soft Skills (Personality):** Blue/Indigo tones
- **Cognitive Abilities:** Purple tones ← **NEW**
- **Technical Skills (Typing):** Green/Teal tones
- **Work Preferences:** Orange/Amber tones

### Card Structure (Consistent Pattern)
1. **Header:** Icon + Title + Completion date + Badge
2. **Key Metrics:** Large numbers in colored cards
3. **Breakdown:** Domain/dimension scores with progress bars
4. **Insights:** Collapsible cards with category badges
5. **Action:** "View Details" or "Retake Assessment" button

### Typography & Spacing
- Match existing Luna Design System
- Use same card padding, gaps, and border radius
- Consistent badge styles and colors
- Same font sizes and weights

---

## 🔄 Integration Checklist

### Phase 1: Database & Backend ✅ COMPLETE
- [x] Database migration
- [x] Seed data (questions, template, norms)
- [x] API routes
- [x] Scoring engine
- [x] Insights generator

### Phase 2: UI Components (Next Steps)
- [ ] Create `cognitive-assessment-modal.tsx`
- [ ] Create `cognitive-results.tsx`
- [ ] Create `cognitive-report.tsx`
- [ ] Update `cognitive-section.tsx`
- [ ] Update `screening-client-table.tsx` (admin)
- [ ] Add suspend/activate functionality

### Phase 3: Testing
- [ ] Test complete assessment flow
- [ ] Test device detection
- [ ] Test scoring accuracy
- [ ] Test admin suspend/activate
- [ ] Test results display on profile

---

## 📁 File Structure Summary

```
app/
├── cmd/screening/
│   ├── page.tsx (admin view - lists all assessments)
│   └── screening-client-table.tsx (table with suspend/activate)
├── u/profile/
│   └── profile-client.tsx (screening tab)
└── api/cognitive/
    ├── start/route.ts ✅
    ├── respond/route.ts ✅
    ├── complete/route.ts ✅
    └── results/[attemptId]/route.ts ✅

components/
├── assessment/
│   ├── cognitive-assessment-modal.tsx (TO CREATE)
│   └── cognitive-results.tsx (TO CREATE)
└── screening/
    ├── screening-tab.tsx (main container)
    ├── cognitive-section.tsx (TO UPDATE)
    └── cognitive-report.tsx (TO CREATE)

lib/cognitive/
├── types.ts ✅
├── scoring.ts ✅
├── insights-generator.ts ✅
└── jspsych-timeline.ts ✅
```

---

**Ready to proceed with UI component creation!** 🚀

