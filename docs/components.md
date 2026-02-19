# Luna Component Library

All components in `components/luna/` - 40+ production-ready components.

## Quick Reference

View all components at `/design-system` (dev only).

### Import
```tsx
import { LunaButton, LunaCard, LunaInput } from '@/components/luna';
```

## Component Categories

**Forms** (12): Input, Textarea, Checkbox, Radio, Select, SearchableSelect, FileUpload, AvatarUpload, TagInput, DatePicker, Slider, Combobox

**Display** (10): Card, Badge, Avatar, Button, EmptyState, Skeleton, Progress, Rating, StatsCard, ProfileCard

**Navigation** (6): Breadcrumbs, Pagination, Tabs, Stepper, CommandPalette, DropdownMenu

**Feedback** (4): Toast, Dialog, Accordion, Timeline

**Data** (5): DataTable, DataTableToolbar, Chart, KanbanBoard, FilePreview

**Media** (3): VideoPlayer, ImageCard, RichTextEditor

---

## Core Components

### LunaButton
Variants: `primary` `secondary` `outline` `ghost` `danger` `success` | Sizes: `sm` `md` `lg`
```tsx
<LunaButton variant="primary" loading icon={<Icon />}>Submit</LunaButton>
```

### LunaCard
Variants: `default` `elevated` `bordered` `interactive` | Parts: Header, Title, Subtitle, Content, Footer
```tsx
<LunaCard variant="interactive">
  <LunaCardHeader><LunaCardTitle>Title</LunaCardTitle></LunaCardHeader>
  <LunaCardContent>Content</LunaCardContent>
</LunaCard>
```

### LunaInput
Props: `label` `required` `error` `helperText` `leftIcon` `rightIcon`
```tsx
<LunaInput label="Email" required error="Required" leftIcon={<Mail />} />
```

### LunaBadge
Variants: `default` `primary` `success` `warning` `error` `yellow` | Props: `dot` `onDismiss`
```tsx
<LunaBadge variant="success" dot>Active</LunaBadge>
```

### LunaAvatar
Sizes: `xs` `sm` `md` `lg` `xl` | Props: `src` `fallback` `status` `ring`
```tsx
<LunaAvatar src="/user.jpg" fallback="JD" status="online" size="lg" />
```

---

## Form Components

### LunaSelect
```tsx
<LunaSelect label="Country" placeholder="Select...">
  <LunaSelectItem value="us">United States</LunaSelectItem>
</LunaSelect>
```

### LunaTextarea
Props: `rows` `maxLength` `showCount` `autoResize`

### LunaCheckbox / LunaRadio
```tsx
<LunaCheckbox label="Agree" description="I agree to terms" />
<LunaRadioGroup label="Plan">
  <LunaRadio value="basic" label="Basic" />
</LunaRadioGroup>
```

### LunaSearchableSelect
Searchable dropdown with filtering

### LunaFileUpload
Drag & drop file upload with validation
```tsx
<LunaFileUpload accept="image/*" maxSize={10} multiple onChange={setFiles} />
```

### LunaAvatarUpload
Profile image upload with preview

### LunaTagInput
Add/remove tags with Enter or comma
```tsx
<LunaTagInput value={tags} onChange={setTags} maxTags={10} />
```

### LunaDatePicker
Calendar-based date picker
```tsx
<LunaDatePicker value={date} onChange={setDate} />
```

### LunaSlider
Range slider with value display
```tsx
<LunaSlider value={[50]} min={0} max={100} showValue formatValue={(v) => `$${v}`} />
```

### LunaCombobox
Multi-select with search
```tsx
<LunaCombobox options={opts} value={selected} onChange={setSelected} maxSelections={5} />
```

---

## Navigation Components

### LunaBreadcrumbs
```tsx
<LunaBreadcrumbs items={[{label: 'Home', href: '/'}, {label: 'Page'}]} showHomeIcon />
```

### LunaPagination
```tsx
<LunaPagination currentPage={1} totalPages={10} onPageChange={setPage} showFirstLast />
```

### LunaTabs
```tsx
<LunaTabs defaultValue="tab1">
  <LunaTabsList>
    <LunaTabsTrigger value="tab1">Tab 1</LunaTabsTrigger>
  </LunaTabsList>
  <LunaTabsContent value="tab1">Content</LunaTabsContent>
</LunaTabs>
```

### LunaStepper
Multi-step indicator
```tsx
<LunaStepper steps={[{label: 'Step 1'}, {label: 'Step 2'}]} currentStep={0} />
```

### LunaCommandPalette
Quick navigation (Cmd+K)
```tsx
<LunaCommandPalette open={open} onOpenChange={setOpen} groups={commandGroups} />
```

### LunaDropdownMenu
```tsx
<LunaDropdownMenu>
  <LunaDropdownMenuTrigger><LunaButton>Menu</LunaButton></LunaDropdownMenuTrigger>
  <LunaDropdownMenuContent>
    <LunaDropdownMenuItem>Action</LunaDropdownMenuItem>
  </LunaDropdownMenuContent>
</LunaDropdownMenu>
```

---

## Feedback Components

### LunaToast
Notification system - add provider to root layout
```tsx
<LunaToastProvider>
  <LunaToast variant="success" title="Success" description="Saved!" />
  <LunaToastViewport />
</LunaToastProvider>
```

### LunaDialog
Modal dialogs
```tsx
<LunaDialog>
  <LunaDialogTrigger><LunaButton>Open</LunaButton></LunaDialogTrigger>
  <LunaDialogContent>
    <LunaDialogHeader><LunaDialogTitle>Title</LunaDialogTitle></LunaDialogHeader>
    <LunaDialogFooter><LunaButton>Confirm</LunaButton></LunaDialogFooter>
  </LunaDialogContent>
</LunaDialog>
```

### LunaAccordion
Collapsible sections
```tsx
<LunaAccordion type="single" collapsible>
  <LunaAccordionItem value="item1">
    <LunaAccordionTrigger>Question</LunaAccordionTrigger>
    <LunaAccordionContent>Answer</LunaAccordionContent>
  </LunaAccordionItem>
</LunaAccordion>
```

### LunaTimeline
Chronological events
```tsx
<LunaTimeline items={[{title: 'Event', date: 'Jan 2024', status: 'success'}]} />
```

---

## Display Components

### LunaProgress
Progress bar with variants
```tsx
<LunaProgress value={75} variant="success" showLabel size="lg" />
```

### LunaRating
Star rating (interactive or read-only)
```tsx
<LunaRating value={4.5} onChange={setRating} showValue max={5} />
```

### LunaStatsCard
Dashboard metrics
```tsx
<LunaStatsCard title="Users" value={1234} trend="up" trendValue="+12%" icon={<Icon />} />
```

### LunaProfileCard
User/organization profiles
```tsx
<LunaProfileCard
  type="user"
  name="John Doe"
  subtitle="Engineer"
  avatar="/avatar.jpg"
  tags={['React', 'TypeScript']}
  stats={[{label: 'Apps', value: 12}]}
  verified
/>
```

### LunaEmptyState
Empty states for lists
```tsx
<LunaEmptyState icon={<Icon />} title="No data" description="Get started" />
```

### LunaSkeleton
Loading states
```tsx
<LunaSkeleton variant="rectangular" width="100%" height={200} />
<LunaSkeletonCard />
<LunaSkeletonTable />
```

### LunaImageCard
Image with overlay content

---

## Data Components

### LunaDataTable
Table with sorting, pagination
```tsx
<LunaDataTable columns={columns} data={data} />
```

### LunaDataTableToolbar
Search, filters, export
```tsx
<LunaDataTableToolbar
  searchValue={search}
  onSearchChange={setSearch}
  filters={filters}
  onExport={exportData}
/>
```

### LunaChart
Analytics charts (line, bar, area, pie)
```tsx
<LunaChart
  type="line"
  data={data}
  dataKey="month"
  series={[{key: 'value', name: 'Sales', color: '#1449E8'}]}
/>
```

### LunaKanbanBoard
Drag & drop workflow
```tsx
<LunaKanbanBoard columns={columns} onDragEnd={handleDrag} onCardClick={handleClick} />
```

### LunaFilePreview
Preview images/PDFs
```tsx
<LunaFilePreview file="/doc.pdf" fileName="Resume.pdf" showDownload showClose />
```

---

## Media Components

### LunaVideoPlayer
Custom video player
```tsx
<LunaVideoPlayer src="/video.mp4" poster="/thumb.jpg" title="Video" />
```

### LunaRichTextEditor
WYSIWYG editor for content
```tsx
<LunaRichTextEditor value={html} onChange={setHtml} placeholder="Type..." />
```

---

## Best Practices

✅ **Do:**
- Import from `@/components/luna`
- Use Luna design tokens (`luna-*` classes)
- Check `/design-system` for examples

❌ **Don't:**
- Modify `components/ui/*` files
- Hardcode colors (use tokens)
- Use shadcn components directly

