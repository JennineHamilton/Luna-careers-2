'use client';

import { useState } from 'react';
import { Mail, Search, User, Settings, LogOut, ChevronDown, Plus, Trash2, Inbox, FileText, HelpCircle, Briefcase, GraduationCap } from 'lucide-react';
import {
  LunaButton,
  LunaCard,
  LunaCardHeader,
  LunaCardTitle,
  LunaCardSubtitle,
  LunaCardContent,
  LunaCardFooter,
  LunaInput,
  LunaBadge,
  LunaSelect,
  LunaSelectItem,
  LunaTextarea,
  LunaCheckbox,
  LunaRadioGroup,
  LunaRadio,
  LunaDialog,
  LunaDialogTrigger,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogFooter,
  LunaDialogClose,
  LunaDropdownMenu,
  LunaDropdownMenuTrigger,
  LunaDropdownMenuContent,
  LunaDropdownMenuItem,
  LunaDropdownMenuSeparator,
  LunaDropdownMenuLabel,
  LunaAvatar,
  LunaSearchableSelect,
  LunaImageCard,
  LunaDataTable,
  LunaDataTableToolbar,
  LunaFileUpload,
  LunaAvatarUpload,
  LunaEmptyState,
  LunaAccordion,
  LunaAccordionItem,
  LunaAccordionTrigger,
  LunaAccordionContent,
  LunaVideoPlayer,
  LunaProgress,
  LunaStepper,
  LunaTabs,
  LunaTabsList,
  LunaTabsTrigger,
  LunaTabsContent,
  LunaBreadcrumbs,
  LunaPagination,
  LunaSkeleton,
  LunaSkeletonCard,
  LunaCalendar,
  LunaDatePicker,
  LunaRating,
  LunaTimeline,
  LunaStatsCard,
  LunaTagInput,
  LunaSlider,
  LunaCombobox,
  LunaChart,
  LunaRichTextEditor,
  LunaFilePreview,
  LunaKanbanBoard,
  LunaProfileCard,
} from '@/components/luna';
import type { KanbanColumn } from '@/components/luna';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-luna-navy mb-6 pb-2 border-b border-luna-border-default">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Showcase({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-sm text-luna-gray-600 mb-3">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [date, setDate] = useState<Date>();
  const [rating, setRating] = useState(4);
  const [tags, setTags] = useState(['React', 'TypeScript', 'Next.js']);
  const [sliderValue, setSliderValue] = useState([50]);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [richText, setRichText] = useState('<p>Start typing your job description here...</p>');
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([
    {
      id: 'applied',
      title: 'Applied',
      color: '#1449E8',
      cards: [
        {
          id: '1',
          title: 'Software Engineer at Tech Co',
          description: 'Full-stack position with React and Node.js',
          badge: { label: 'Remote', variant: 'success' },
          metadata: [
            { label: 'Salary', value: '$120k - $150k' },
            { label: 'Applied', value: '2 days ago' },
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview',
      color: '#FFDF2B',
      cards: [
        {
          id: '2',
          title: 'Frontend Developer at StartupXYZ',
          description: 'React specialist needed',
          badge: { label: 'Hybrid', variant: 'warning' },
          metadata: [{ label: 'Interview', value: 'Tomorrow 2pm' }],
        },
      ],
    },
    {
      id: 'offer',
      title: 'Offer',
      color: '#10B981',
      cards: [],
    },
  ]);

  const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'cn', label: 'China' },
  ];

  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Manager', status: 'Active' },
  ];

  return (
    <div className="min-h-screen bg-luna-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-luna-navy mb-8">Luna Design System</h1>
        {/* Buttons */}
        <Section title="LunaButton">
          <Showcase label="Variants">
            <LunaButton variant="primary">Primary</LunaButton>
            <LunaButton variant="secondary">Secondary</LunaButton>
            <LunaButton variant="outline">Outline</LunaButton>
            <LunaButton variant="ghost">Ghost</LunaButton>
            <LunaButton variant="danger">Danger</LunaButton>
            <LunaButton variant="success">Success</LunaButton>
          </Showcase>
          <Showcase label="Sizes">
            <LunaButton size="sm">Small</LunaButton>
            <LunaButton size="md">Medium</LunaButton>
            <LunaButton size="lg">Large</LunaButton>
          </Showcase>
          <Showcase label="States">
            <LunaButton disabled>Disabled</LunaButton>
            <LunaButton loading>Loading</LunaButton>
            <LunaButton icon={<Plus className="h-4 w-4" />}>With Icon</LunaButton>
            <LunaButton fullWidth>Full Width</LunaButton>
          </Showcase>
        </Section>

        {/* Badges */}
        <Section title="LunaBadge">
          <Showcase label="Variants">
            <LunaBadge variant="default">Default</LunaBadge>
            <LunaBadge variant="primary">Primary</LunaBadge>
            <LunaBadge variant="success">Success</LunaBadge>
            <LunaBadge variant="warning">Warning</LunaBadge>
            <LunaBadge variant="error">Error</LunaBadge>
            <LunaBadge variant="yellow">Yellow</LunaBadge>
          </Showcase>
          <Showcase label="With Dot">
            <LunaBadge variant="success" dot>Active</LunaBadge>
            <LunaBadge variant="warning" dot>Pending</LunaBadge>
            <LunaBadge variant="error" dot>Failed</LunaBadge>
          </Showcase>
          <Showcase label="Dismissible">
            <LunaBadge variant="primary" onDismiss={() => {}}>Dismissible</LunaBadge>
          </Showcase>
          <Showcase label="Sizes">
            <LunaBadge size="sm">Small</LunaBadge>
            <LunaBadge size="md">Medium</LunaBadge>
            <LunaBadge size="lg">Large</LunaBadge>
          </Showcase>
        </Section>

        {/* Avatar */}
        <Section title="LunaAvatar">
          <Showcase label="Sizes">
            <LunaAvatar size="xs" fallback="XS" />
            <LunaAvatar size="sm" fallback="SM" />
            <LunaAvatar size="md" fallback="MD" />
            <LunaAvatar size="lg" fallback="LG" />
            <LunaAvatar size="xl" fallback="XL" />
          </Showcase>
          <Showcase label="Status">
            <LunaAvatar fallback="ON" status="online" />
            <LunaAvatar fallback="OF" status="offline" />
            <LunaAvatar fallback="BY" status="busy" />
          </Showcase>
          <Showcase label="With Ring (for stacked)">
            <div className="flex -space-x-2">
              <LunaAvatar fallback="A" ring />
              <LunaAvatar fallback="B" ring />
              <LunaAvatar fallback="C" ring />
            </div>
          </Showcase>
        </Section>

        {/* Cards */}
        <Section title="LunaCard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <LunaCard variant="default">
              <LunaCardHeader>
                <LunaCardTitle>Default Card</LunaCardTitle>
                <LunaCardSubtitle>Subtle border, no shadow</LunaCardSubtitle>
              </LunaCardHeader>
              <LunaCardContent>
                <p className="text-luna-gray-600 text-sm">Card content goes here.</p>
              </LunaCardContent>
            </LunaCard>
            <LunaCard variant="elevated">
              <LunaCardHeader>
                <LunaCardTitle>Elevated Card</LunaCardTitle>
              </LunaCardHeader>
              <LunaCardContent>Shadow, no border</LunaCardContent>
            </LunaCard>
            <LunaCard variant="bordered">
              <LunaCardHeader>
                <LunaCardTitle>Bordered Card</LunaCardTitle>
              </LunaCardHeader>
              <LunaCardContent>Stronger border</LunaCardContent>
            </LunaCard>
            <LunaCard variant="interactive">
              <LunaCardHeader>
                <LunaCardTitle>Interactive Card</LunaCardTitle>
              </LunaCardHeader>
              <LunaCardContent>Hover for shadow</LunaCardContent>
              <LunaCardFooter>
                <LunaBadge variant="primary">New</LunaBadge>
              </LunaCardFooter>
            </LunaCard>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="LunaInput">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <LunaInput label="Email" placeholder="Enter your email" required />
            <LunaInput label="Password" type="password" placeholder="Enter password" helperText="Password reveal toggle included automatically" />
            <LunaInput label="With Helper" placeholder="Username" helperText="Letters and numbers only" />
            <LunaInput label="With Error" placeholder="Password" error="Password is required" />
            <LunaInput label="Disabled" placeholder="Disabled input" disabled />
            <LunaInput label="Left Icon" placeholder="Search..." leftIcon={<Search className="h-4 w-4" />} />
            <LunaInput label="Right Icon" placeholder="Email" rightIcon={<Mail className="h-4 w-4" />} />
          </div>
        </Section>

        {/* Select */}
        <Section title="LunaSelect">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <LunaSelect label="Country" placeholder="Select a country" required>
              <LunaSelectItem value="us">United States</LunaSelectItem>
              <LunaSelectItem value="uk">United Kingdom</LunaSelectItem>
              <LunaSelectItem value="ca">Canada</LunaSelectItem>
            </LunaSelect>
            <LunaSelect label="With Error" placeholder="Choose..." error="Selection required">
              <LunaSelectItem value="1">Option 1</LunaSelectItem>
              <LunaSelectItem value="2">Option 2</LunaSelectItem>
            </LunaSelect>
          </div>
        </Section>

        {/* Textarea */}
        <Section title="LunaTextarea">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <LunaTextarea label="Description" placeholder="Enter description..." rows={4} />
            <LunaTextarea label="With Count" placeholder="Bio..." maxLength={200} showCount />
            <LunaTextarea label="With Error" error="This field is required" />
            <LunaTextarea label="Auto Resize" placeholder="Type to see auto resize..." autoResize />
          </div>
        </Section>

        {/* Checkbox */}
        <Section title="LunaCheckbox">
          <div className="space-y-4">
            <LunaCheckbox label="Accept terms and conditions" />
            <LunaCheckbox label="Subscribe to newsletter" description="Get weekly updates" />
            <LunaCheckbox label="Disabled checkbox" disabled />
            <LunaCheckbox label="With error" error="You must accept the terms" />
          </div>
        </Section>

        {/* Radio */}
        <Section title="LunaRadio">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <LunaRadioGroup label="Plan" defaultValue="basic">
              <LunaRadio value="basic" label="Basic" description="Free forever" />
              <LunaRadio value="pro" label="Pro" description="$19/month" />
              <LunaRadio value="enterprise" label="Enterprise" description="Custom pricing" />
            </LunaRadioGroup>
            <LunaRadioGroup label="With Error" error="Please select an option">
              <LunaRadio value="yes" label="Yes" />
              <LunaRadio value="no" label="No" />
            </LunaRadioGroup>
          </div>
        </Section>

        {/* Dialog */}
        <Section title="LunaDialog">
          <LunaDialog>
            <LunaDialogTrigger asChild>
              <LunaButton>Open Dialog</LunaButton>
            </LunaDialogTrigger>
            <LunaDialogContent>
              <LunaDialogHeader>
                <LunaDialogTitle>Confirm Action</LunaDialogTitle>
                <LunaDialogDescription>
                  This action cannot be undone. Are you sure you want to proceed?
                </LunaDialogDescription>
              </LunaDialogHeader>
              <div className="py-4">
                <LunaInput label="Confirmation" placeholder="Type 'confirm' to proceed" />
              </div>
              <LunaDialogFooter>
                <LunaDialogClose asChild>
                  <LunaButton variant="secondary">Cancel</LunaButton>
                </LunaDialogClose>
                <LunaButton variant="danger">Delete</LunaButton>
              </LunaDialogFooter>
            </LunaDialogContent>
          </LunaDialog>
        </Section>

        {/* Dropdown Menu */}
        <Section title="LunaDropdownMenu">
          <LunaDropdownMenu>
            <LunaDropdownMenuTrigger asChild>
              <LunaButton variant="outline">
                Options <ChevronDown className="h-4 w-4" />
              </LunaButton>
            </LunaDropdownMenuTrigger>
            <LunaDropdownMenuContent>
              <LunaDropdownMenuLabel>My Account</LunaDropdownMenuLabel>
              <LunaDropdownMenuItem>
                <User className="h-4 w-4" /> Profile
              </LunaDropdownMenuItem>
              <LunaDropdownMenuItem>
                <Settings className="h-4 w-4" /> Settings
              </LunaDropdownMenuItem>
              <LunaDropdownMenuSeparator />
              <LunaDropdownMenuItem destructive>
                <Trash2 className="h-4 w-4" /> Delete Account
              </LunaDropdownMenuItem>
              <LunaDropdownMenuItem>
                <LogOut className="h-4 w-4" /> Logout
              </LunaDropdownMenuItem>
            </LunaDropdownMenuContent>
          </LunaDropdownMenu>
        </Section>

        {/* Searchable Select */}
        <Section title="LunaSearchableSelect">
          <div className="max-w-md">
            <LunaSearchableSelect
              label="Country"
              placeholder="Select a country"
              searchPlaceholder="Search countries..."
              options={countryOptions}
              value={selectedCountry}
              onValueChange={setSelectedCountry}
              helperText="Select your country from the list"
            />
          </div>
        </Section>

        {/* Image Card */}
        <Section title="LunaImageCard">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LunaImageCard
              imageSrc="/img/Luna_logo_dark.PNG"
              imageAlt="Course thumbnail"
              title="Introduction to React"
              description="Learn the fundamentals of React and build modern web applications"
              badge={<LunaBadge variant="success">New</LunaBadge>}
              footer={<LunaButton fullWidth>Enroll Now</LunaButton>}
              aspectRatio="video"
            />
            <LunaImageCard
              imageSrc="/img/Luna_logo_dark.PNG"
              imageAlt="Course thumbnail"
              title="Advanced TypeScript"
              description="Master TypeScript with advanced patterns and best practices"
              badge={<LunaBadge variant="primary">Popular</LunaBadge>}
              footer={<LunaButton fullWidth variant="outline">Learn More</LunaButton>}
              aspectRatio="video"
            />
            <LunaImageCard
              imageSrc="/img/Luna_logo_dark.PNG"
              imageAlt="Course thumbnail"
              title="UI/UX Design Principles"
              description="Create beautiful and user-friendly interfaces"
              footer={<LunaButton fullWidth variant="secondary">View Details</LunaButton>}
              aspectRatio="video"
            />
          </div>
        </Section>

        {/* Data Table */}
        <Section title="LunaDataTable">
          <LunaDataTableToolbar
            searchPlaceholder="Search users..."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={[
              {
                column: 'status',
                label: 'Status',
                options: [
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ],
              },
            ]}
            activeFilters={{ status: statusFilter }}
            onFilterChange={(column, values) => setStatusFilter(values)}
            onExportCSV={() => console.log('Exporting data...')}
          />
          <LunaDataTable
            columns={[
              { header: 'ID', accessorKey: 'id', sortable: true },
              { header: 'Name', accessorKey: 'name', sortable: true },
              { header: 'Email', accessorKey: 'email', sortable: true },
              { header: 'Role', accessorKey: 'role', sortable: true },
              {
                header: 'Status',
                accessorKey: 'status',
                cell: (row) => (
                  <LunaBadge variant={row.status === 'Active' ? 'success' : 'default'}>
                    {row.status}
                  </LunaBadge>
                ),
              },
            ]}
            data={tableData}
            striped
            hoverable
            onRowClick={(row) => console.log('Clicked row:', row)}
          />
        </Section>

        {/* File Upload */}
        <Section title="LunaFileUpload">
          <div className="max-w-2xl">
            <LunaFileUpload
              label="Upload Documents"
              helperText="PDF, DOC, DOCX up to 10MB"
              accept=".pdf,.doc,.docx"
              multiple
              onFilesChange={setUploadedFiles}
            />
          </div>
        </Section>

        {/* Avatar Upload */}
        <Section title="LunaAvatarUpload">
          <div className="max-w-md">
            <LunaAvatarUpload
              label="Profile Picture"
              size="lg"
              helperText="JPG, PNG or GIF (max. 5MB)"
              onChange={setAvatarFile}
            />
          </div>
        </Section>

        {/* Empty State */}
        <Section title="LunaEmptyState">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LunaCard>
              <LunaEmptyState
                icon={Inbox}
                title="No messages"
                description="You don't have any messages yet"
                size="sm"
              />
            </LunaCard>
            <LunaCard>
              <LunaEmptyState
                icon={FileText}
                title="No documents"
                description="Upload your first document to get started"
                action={<LunaButton size="sm">Upload Document</LunaButton>}
                size="md"
              />
            </LunaCard>
            <LunaCard>
              <LunaEmptyState
                icon={HelpCircle}
                title="No results found"
                description="Try adjusting your search or filter to find what you're looking for"
                size="sm"
              />
            </LunaCard>
          </div>
        </Section>

        {/* Accordion */}
        <Section title="LunaAccordion">
          <div className="max-w-2xl">
            <LunaAccordion type="single" collapsible>
              <LunaAccordionItem value="item-1">
                <LunaAccordionTrigger>What is Luna Careers?</LunaAccordionTrigger>
                <LunaAccordionContent>
                  Luna Careers is a comprehensive platform for career development, offering courses,
                  assessments, and job opportunities to help you advance your professional journey.
                </LunaAccordionContent>
              </LunaAccordionItem>
              <LunaAccordionItem value="item-2">
                <LunaAccordionTrigger>How do I enroll in a course?</LunaAccordionTrigger>
                <LunaAccordionContent>
                  Browse our course catalog, select a course that interests you, and click the "Enroll Now"
                  button. You'll be guided through the enrollment process step by step.
                </LunaAccordionContent>
              </LunaAccordionItem>
              <LunaAccordionItem value="item-3">
                <LunaAccordionTrigger>Can I get a certificate?</LunaAccordionTrigger>
                <LunaAccordionContent>
                  Yes! Upon successful completion of a course, you'll receive a certificate that you can
                  share on your professional profiles and resume.
                </LunaAccordionContent>
              </LunaAccordionItem>
            </LunaAccordion>
          </div>
        </Section>

        {/* Video Player */}
        <Section title="LunaVideoPlayer">
          <div className="max-w-3xl">
            <LunaVideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              poster="/img/Luna_logo_dark.PNG"
              title="Course Introduction Video"
            />
          </div>
        </Section>

        {/* Progress */}
        <Section title="LunaProgress">
          <div className="space-y-4 max-w-2xl">
            <LunaProgress value={25} size="sm" />
            <LunaProgress value={50} size="md" showLabel />
            <LunaProgress value={75} size="lg" variant="success" showLabel />
            <LunaProgress value={90} variant="warning" showLabel />
          </div>
        </Section>

        {/* Stepper */}
        <Section title="LunaStepper">
          <div className="max-w-3xl">
            <LunaStepper
              steps={[
                { label: 'Personal Info', description: 'Basic details' },
                { label: 'Experience', description: 'Work history' },
                { label: 'Education', description: 'Academic background' },
                { label: 'Review', description: 'Confirm details' },
              ]}
              currentStep={1}
            />
          </div>
        </Section>

        {/* Tabs */}
        <Section title="LunaTabs">
          <div className="max-w-2xl">
            <LunaTabs defaultValue="profile">
              <LunaTabsList>
                <LunaTabsTrigger value="profile">Profile</LunaTabsTrigger>
                <LunaTabsTrigger value="courses">Courses</LunaTabsTrigger>
                <LunaTabsTrigger value="settings">Settings</LunaTabsTrigger>
              </LunaTabsList>
              <LunaTabsContent value="profile">
                <LunaCard>
                  <LunaCardContent className="p-6">
                    <p className="text-sm text-luna-gray-600">
                      Manage your profile information and preferences.
                    </p>
                  </LunaCardContent>
                </LunaCard>
              </LunaTabsContent>
              <LunaTabsContent value="courses">
                <LunaCard>
                  <LunaCardContent className="p-6">
                    <p className="text-sm text-luna-gray-600">
                      View and manage your enrolled courses.
                    </p>
                  </LunaCardContent>
                </LunaCard>
              </LunaTabsContent>
              <LunaTabsContent value="settings">
                <LunaCard>
                  <LunaCardContent className="p-6">
                    <p className="text-sm text-luna-gray-600">
                      Configure your account settings and notifications.
                    </p>
                  </LunaCardContent>
                </LunaCard>
              </LunaTabsContent>
            </LunaTabs>
          </div>
        </Section>

        {/* Breadcrumbs */}
        <Section title="LunaBreadcrumbs">
          <div className="space-y-4">
            <LunaBreadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Courses', href: '/courses' },
                { label: 'Web Development' },
              ]}
              showHomeIcon
            />
            <LunaBreadcrumbs
              items={[
                { label: 'Dashboard', href: '/u/dashboard' },
                { label: 'Applications', href: '/u/applications' },
                { label: 'Software Engineer at Tech Co' },
              ]}
            />
          </div>
        </Section>

        {/* Pagination */}
        <Section title="LunaPagination">
          <LunaPagination
            currentPage={currentPage}
            totalPages={10}
            onPageChange={setCurrentPage}
            showFirstLast
          />
        </Section>

        {/* Skeleton Loaders */}
        <Section title="LunaSkeleton">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LunaCard>
              <LunaCardContent className="p-6">
                <LunaSkeletonCard />
              </LunaCardContent>
            </LunaCard>
            <LunaCard>
              <LunaCardContent className="p-6 space-y-4">
                <LunaSkeleton variant="text" width="100%" />
                <LunaSkeleton variant="text" width="80%" />
                <LunaSkeleton variant="circular" width={60} height={60} />
              </LunaCardContent>
            </LunaCard>
            <LunaCard>
              <LunaCardContent className="p-6">
                <div className="space-y-3">
                  <LunaSkeleton variant="rectangular" width="100%" height={120} />
                  <LunaSkeleton variant="text" width="70%" />
                </div>
              </LunaCardContent>
            </LunaCard>
          </div>
        </Section>

        {/* Calendar & Date Picker */}
        <Section title="LunaCalendar & LunaDatePicker">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LunaCard>
              <LunaCardHeader>
                <LunaCardTitle>Calendar</LunaCardTitle>
              </LunaCardHeader>
              <LunaCardContent>
                <LunaCalendar mode="single" selected={date} onSelect={setDate} />
              </LunaCardContent>
            </LunaCard>
            <LunaCard>
              <LunaCardHeader>
                <LunaCardTitle>Date Picker</LunaCardTitle>
              </LunaCardHeader>
              <LunaCardContent>
                <LunaDatePicker value={date} onChange={setDate} placeholder="Select a date" />
              </LunaCardContent>
            </LunaCard>
          </div>
        </Section>

        {/* Rating */}
        <Section title="LunaRating">
          <div className="space-y-4">
            <LunaRating value={rating} onChange={setRating} showValue />
            <LunaRating value={4.5} readOnly showValue size="lg" />
            <LunaRating value={3} size="sm" />
          </div>
        </Section>

        {/* Timeline */}
        <Section title="LunaTimeline">
          <div className="max-w-2xl">
            <LunaTimeline
              items={[
                {
                  title: 'Started Position',
                  description: 'Software Engineer at Tech Co',
                  date: 'Jan 2023',
                  status: 'success',
                },
                {
                  title: 'Promoted',
                  description: 'Senior Software Engineer',
                  date: 'Jun 2024',
                  status: 'success',
                },
                {
                  title: 'Completed Certification',
                  description: 'AWS Solutions Architect',
                  date: 'Dec 2024',
                  status: 'success',
                },
                {
                  title: 'Upcoming Review',
                  description: 'Annual performance review',
                  date: 'Mar 2025',
                  status: 'default',
                },
              ]}
            />
          </div>
        </Section>

        {/* Stats Cards */}
        <Section title="LunaStatsCard">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LunaStatsCard
              title="Total Applications"
              value={1234}
              description="This month"
              trend="up"
              trendValue="+12%"
              icon={<Briefcase className="w-5 h-5" />}
            />
            <LunaStatsCard
              title="Courses Completed"
              value={42}
              description="All time"
              trend="up"
              trendValue="+5"
              icon={<GraduationCap className="w-5 h-5" />}
            />
            <LunaStatsCard
              title="Profile Views"
              value={856}
              description="Last 7 days"
              trend="down"
              trendValue="-3%"
              icon={<User className="w-5 h-5" />}
            />
          </div>
        </Section>

        {/* Tag Input */}
        <Section title="LunaTagInput">
          <div className="max-w-2xl">
            <LunaTagInput
              value={tags}
              onChange={setTags}
              label="Skills"
              placeholder="Add a skill..."
              helperText="Press Enter or comma to add a tag"
            />
          </div>
        </Section>

        {/* Slider */}
        <Section title="LunaSlider">
          <div className="max-w-2xl space-y-6">
            <LunaSlider
              value={sliderValue}
              onValueChange={setSliderValue}
              min={0}
              max={100}
              step={1}
              label="Experience Level"
              showValue
            />
            <LunaSlider
              defaultValue={[75000]}
              min={30000}
              max={150000}
              step={5000}
              label="Salary Range"
              showValue
              formatValue={(value) => `$${value.toLocaleString()}`}
            />
          </div>
        </Section>

        {/* Combobox */}
        <Section title="LunaCombobox">
          <div className="max-w-2xl">
            <LunaCombobox
              options={[
                { value: 'react', label: 'React' },
                { value: 'vue', label: 'Vue' },
                { value: 'angular', label: 'Angular' },
                { value: 'svelte', label: 'Svelte' },
                { value: 'nextjs', label: 'Next.js' },
                { value: 'nuxt', label: 'Nuxt' },
              ]}
              value={selectedTechs}
              onChange={setSelectedTechs}
              label="Technologies"
              placeholder="Select technologies..."
              helperText="Select multiple technologies"
            />
          </div>
        </Section>

        {/* Charts */}
        <Section title="LunaChart">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LunaCard>
              <LunaCardHeader>
                <LunaCardTitle>Application Trends</LunaCardTitle>
              </LunaCardHeader>
              <LunaCardContent>
                <LunaChart
                  type="line"
                  data={[
                    { month: 'Jan', applications: 65, interviews: 28 },
                    { month: 'Feb', applications: 59, interviews: 48 },
                    { month: 'Mar', applications: 80, interviews: 40 },
                    { month: 'Apr', applications: 81, interviews: 56 },
                    { month: 'May', applications: 56, interviews: 42 },
                    { month: 'Jun', applications: 55, interviews: 38 },
                  ]}
                  dataKey="month"
                  series={[
                    { key: 'applications', name: 'Applications', color: '#1449E8' },
                    { key: 'interviews', name: 'Interviews', color: '#00185F' },
                  ]}
                  height={250}
                />
              </LunaCardContent>
            </LunaCard>

            <LunaCard>
              <LunaCardHeader>
                <LunaCardTitle>Application Status</LunaCardTitle>
              </LunaCardHeader>
              <LunaCardContent>
                <LunaChart
                  type="pie"
                  data={[
                    { name: 'Applied', value: 45 },
                    { name: 'Interview', value: 25 },
                    { name: 'Offer', value: 15 },
                    { name: 'Rejected', value: 15 },
                  ]}
                  height={250}
                />
              </LunaCardContent>
            </LunaCard>
          </div>
        </Section>

        {/* Rich Text Editor */}
        <Section title="LunaRichTextEditor">
          <div className="max-w-3xl">
            <LunaRichTextEditor
              value={richText}
              onChange={setRichText}
              label="Job Description"
              placeholder="Enter job description..."
              helperText="Use the toolbar to format your text"
              minHeight={300}
            />
          </div>
        </Section>

        {/* File Preview */}
        <Section title="LunaFilePreview">
          <div className="max-w-2xl">
            <LunaFilePreview
              file="/img/Luna_logo_dark.PNG"
              fileName="Luna_Logo.png"
              showDownload
              showClose
              onClose={() => console.log('Close preview')}
              maxHeight={400}
            />
          </div>
        </Section>

        {/* Kanban Board */}
        <Section title="LunaKanbanBoard">
          <LunaKanbanBoard
            columns={kanbanColumns}
            onDragEnd={(result) => {
              if (!result.destination) return;

              const { source, destination } = result;
              const newColumns = [...kanbanColumns];

              // Find source and destination columns
              const sourceCol = newColumns.find((col) => col.id === source.droppableId);
              const destCol = newColumns.find((col) => col.id === destination.droppableId);

              if (!sourceCol || !destCol) return;

              // Remove from source
              const [movedCard] = sourceCol.cards.splice(source.index, 1);

              // Add to destination
              destCol.cards.splice(destination.index, 0, movedCard);

              setKanbanColumns(newColumns);
            }}
            onCardClick={(card) => console.log('Card clicked:', card)}
          />
        </Section>

        {/* Profile Card */}
        <Section title="LunaProfileCard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LunaProfileCard
              type="user"
              avatar="/img/Luna_logo_dark.PNG"
              coverImage="/img/Luna_logo_dark.PNG"
              name="John Doe"
              subtitle="Senior Software Engineer"
              location="San Francisco, CA"
              email="john.doe@example.com"
              phone="+1 (555) 123-4567"
              bio="Passionate software engineer with 8+ years of experience building scalable web applications. Specialized in React, TypeScript, and Node.js."
              tags={['React', 'TypeScript', 'Node.js', 'AWS']}
              stats={[
                { label: 'Applications', value: 12 },
                { label: 'Courses', value: 5 },
                { label: 'Certificates', value: 8 },
              ]}
              verified
              actions={[
                { label: 'View Profile', onClick: () => {}, variant: 'primary' },
                { label: 'Message', onClick: () => {}, variant: 'outline' },
              ]}
            />

            <LunaProfileCard
              type="organization"
              avatar="/img/Luna_logo_dark.PNG"
              name="Tech Innovations Inc."
              subtitle="Technology & Software"
              location="New York, NY"
              email="careers@techinnovations.com"
              bio="Leading technology company focused on building innovative solutions for the modern workplace."
              tags={['SaaS', 'Enterprise', 'AI/ML']}
              stats={[
                { label: 'Employees', value: '500+' },
                { label: 'Open Positions', value: 24 },
                { label: 'Locations', value: 12 },
              ]}
              verified
              actions={[
                { label: 'View Jobs', onClick: () => {}, variant: 'primary' },
                { label: 'Follow', onClick: () => {}, variant: 'outline' },
              ]}
            />
          </div>
        </Section>

      </div>
    </div>
  );
}

