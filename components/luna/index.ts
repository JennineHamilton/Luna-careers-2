/**
 * Luna Component Library
 *
 * A collection of Luna-branded components built on top of shadcn/ui.
 * All components use Luna design tokens (luna-* classes) exclusively.
 */

// Button
export { LunaButton, lunaButtonVariants } from './button';
export type { LunaButtonProps } from './button';

// Card
export {
  LunaCard,
  LunaCardHeader,
  LunaCardTitle,
  LunaCardSubtitle,
  LunaCardContent,
  LunaCardFooter,
  lunaCardVariants,
} from './card';
export type {
  LunaCardProps,
  LunaCardHeaderProps,
  LunaCardTitleProps,
  LunaCardSubtitleProps,
  LunaCardContentProps,
  LunaCardFooterProps,
} from './card';

// Input
export {
  LunaInput,
  LunaInputLabel,
  LunaInputError,
  LunaInputHelper,
} from './input';
export type {
  LunaInputProps,
  LunaInputLabelProps,
  LunaInputErrorProps,
  LunaInputHelperProps,
} from './input';

// Multi Text Input
export { LunaMultiTextInput } from './multi-text-input';
export type { LunaMultiTextInputProps } from './multi-text-input';

// Badge
export { LunaBadge, lunaBadgeVariants } from './badge';
export type { LunaBadgeProps } from './badge';

// Select
export {
  LunaSelect,
  LunaSelectItem,
  LunaSelectGroup,
  LunaSelectLabel,
} from './select';
export type {
  LunaSelectProps,
  LunaSelectItemProps,
  LunaSelectGroupProps,
  LunaSelectLabelProps,
} from './select';

// Searchable Select
export { LunaSearchableSelect } from './searchable-select';
export type {
  LunaSearchableSelectProps,
  SearchableSelectOption,
} from './searchable-select';

// Textarea
export { LunaTextarea } from './textarea';
export type { LunaTextareaProps } from './textarea';

// Checkbox
export { LunaCheckbox } from './checkbox';
export type { LunaCheckboxProps } from './checkbox';

// Switch
export { LunaSwitch } from './switch';
export type { LunaSwitchProps } from './switch';

// Radio
export { LunaRadioGroup, LunaRadio } from './radio';
export type { LunaRadioGroupProps, LunaRadioProps } from './radio';

// Dialog / Modal
export {
  LunaDialog,
  LunaDialogTrigger,
  LunaDialogClose,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDialogFooter,
} from './dialog';
export type {
  LunaDialogContentProps,
  LunaDialogHeaderProps,
  LunaDialogTitleProps,
  LunaDialogDescriptionProps,
  LunaDialogBodyProps,
  LunaDialogFooterProps,
} from './dialog';

// Modal (alias for Dialog)
export {
  LunaDialog as LunaModal,
  LunaDialogTrigger as LunaModalTrigger,
  LunaDialogClose as LunaModalClose,
  LunaDialogContent as LunaModalContent,
  LunaDialogHeader as LunaModalHeader,
  LunaDialogTitle as LunaModalTitle,
  LunaDialogDescription as LunaModalDescription,
  LunaDialogBody as LunaModalBody,
  LunaDialogFooter as LunaModalFooter,
} from './dialog';

// Dropdown Menu
export {
  LunaDropdownMenu,
  LunaDropdownMenuTrigger,
  LunaDropdownMenuContent,
  LunaDropdownMenuGroup,
  LunaDropdownMenuItem,
  LunaDropdownMenuLabel,
  LunaDropdownMenuSeparator,
  LunaDropdownMenuSub,
  LunaDropdownMenuSubTrigger,
  LunaDropdownMenuSubContent,
  LunaDropdownMenuCheckboxItem,
  LunaDropdownMenuRadioGroup,
  LunaDropdownMenuRadioItem,
} from './dropdown-menu';
export type {
  LunaDropdownMenuContentProps,
  LunaDropdownMenuItemProps,
  LunaDropdownMenuLabelProps,
  LunaDropdownMenuSeparatorProps,
  LunaDropdownMenuSubTriggerProps,
  LunaDropdownMenuSubContentProps,
  LunaDropdownMenuCheckboxItemProps,
  LunaDropdownMenuRadioGroupProps,
  LunaDropdownMenuRadioItemProps,
} from './dropdown-menu';

// Avatar
export { LunaAvatar, lunaAvatarVariants } from './avatar';
export type { LunaAvatarProps } from './avatar';

// Tooltip
export {
  LunaTooltip,
  LunaTooltipTrigger,
  LunaTooltipContent,
  LunaTooltipProvider,
} from './tooltip';
export type { LunaTooltipContentProps } from './tooltip';

// Image Card
export { LunaImageCard } from './image-card';
export type { LunaImageCardProps } from './image-card';

// Data Table
export { LunaDataTable } from './data-table';
export type { LunaDataTableProps, DataTableColumn } from './data-table';

// Data Table Toolbar
export { LunaDataTableToolbar } from './data-table-toolbar';
export type { LunaDataTableToolbarProps, DataTableFilter } from './data-table-toolbar';

// File Upload
export { LunaFileUpload } from './file-upload';
export type { LunaFileUploadProps } from './file-upload';

// Avatar Upload
export { LunaAvatarUpload } from './avatar-upload';
export type { LunaAvatarUploadProps } from './avatar-upload';

// Empty State
export { LunaEmptyState } from './empty-state';
export type { LunaEmptyStateProps } from './empty-state';

// Section Label
export { LunaSectionLabel } from './section-label';
export type { LunaSectionLabelProps } from './section-label';

// Accordion
export {
  LunaAccordion,
  LunaAccordionItem,
  LunaAccordionTrigger,
  LunaAccordionContent,
} from './accordion';
export type {
  LunaAccordionItemProps,
  LunaAccordionTriggerProps,
  LunaAccordionContentProps,
} from './accordion';

// Video Player
export { LunaVideoPlayer } from './video-player';
export type { LunaVideoPlayerProps } from './video-player';

// Video Recorder
export { LunaVideoRecorder } from './video-recorder';
export type { LunaVideoRecorderProps } from './video-recorder';

// Progress
export { LunaProgress } from './progress';
export type { LunaProgressProps } from './progress';

// Stepper
export { LunaStepper } from './stepper';
export type { LunaStepperProps, Step } from './stepper';

// Tabs
export { LunaTabs, LunaTabsList, LunaTabsTrigger, LunaTabsContent } from './tabs';
export type {
  LunaTabsProps,
  LunaTabsListProps,
  LunaTabsTriggerProps,
  LunaTabsContentProps,
} from './tabs';

// Breadcrumbs
export { LunaBreadcrumbs } from './breadcrumbs';
export type { LunaBreadcrumbsProps, BreadcrumbItem } from './breadcrumbs';

// Pagination
export { LunaPagination } from './pagination';
export type { LunaPaginationProps } from './pagination';

// Toast
export { LunaToast, LunaToastProvider, LunaToastViewport } from './toast';
export type { LunaToastProps, LunaToastProviderProps, LunaToastViewportProps } from './toast';

// Skeleton
export {
  LunaSkeleton,
  LunaSkeletonCard,
  LunaSkeletonAvatar,
  LunaSkeletonTable,
} from './skeleton';
export type { LunaSkeletonProps } from './skeleton';

// Separator
export { LunaSeparator } from './separator';
export type { LunaSeparatorProps } from './separator';

// Calendar
export { LunaCalendar } from './calendar';
export type { LunaCalendarProps } from './calendar';

// Date Picker
export { LunaDatePicker } from './date-picker';
export type { LunaDatePickerProps } from './date-picker';

// Date Range Picker
export { LunaDateRangePicker } from './date-range-picker';
export type { LunaDateRangePickerProps, DateRange } from './date-range-picker';

// Rating
export { LunaRating } from './rating';
export type { LunaRatingProps } from './rating';

// Timeline
export { LunaTimeline } from './timeline';
export type { LunaTimelineProps, TimelineItem } from './timeline';

// Stats Card
export { LunaStatsCard } from './stats-card';
export type { LunaStatsCardProps } from './stats-card';

// Tag Input
export { LunaTagInput } from './tag-input';
export type { LunaTagInputProps } from './tag-input';

// Phone Input
export { LunaPhoneInput } from './phone-input';

// Slider
export { LunaSlider } from './slider';
export type { LunaSliderProps } from './slider';

// Combobox
export { LunaCombobox } from './combobox';
export type { LunaComboboxProps, ComboboxOption } from './combobox';

// Command Palette
export { LunaCommandPalette } from './command-palette';
export type { LunaCommandPaletteProps, CommandItem, CommandGroup } from './command-palette';

// Chart
export { LunaChart } from './chart';
export type { LunaChartProps } from './chart';

// Rich Text Editor
export { LunaRichTextEditor } from './rich-text-editor';
export type { LunaRichTextEditorProps } from './rich-text-editor';

// File Preview
export { LunaFilePreview } from './file-preview';
export type { LunaFilePreviewProps } from './file-preview';

// Kanban Board
export { LunaKanbanBoard } from './kanban-board';
export type { LunaKanbanBoardProps, KanbanCard, KanbanColumn } from './kanban-board';

// Profile Card
export { LunaProfileCard } from './profile-card';
export type { LunaProfileCardProps } from './profile-card';

// Context Switcher (hybrid users)
export { ContextSwitcher } from './context-switcher';

// Layout Components
export { default as MainLayout } from '@/components/layout/MainLayout';
export { default as Sidebar } from '@/components/layout/Sidebar/Sidebar';
export { default as Header } from '@/components/layout/Header/Header';
export { default as Navigation } from '@/components/layout/Sidebar/Navigation';
export { default as SidebarFooter } from '@/components/layout/Sidebar/SidebarFooter';
export { default as ContextSwitcherLayout } from '@/components/layout/Sidebar/ContextSwitcher';
export { default as ThemeToggle } from '@/components/layout/Header/ThemeToggle';
export { default as PointsTracker } from '@/components/layout/Header/PointsTracker';
export { default as NotificationsMenu } from '@/components/layout/Header/NotificationsMenu';
export { default as UserMenu } from '@/components/layout/Header/UserMenu';

// Providers
export { LayoutProvider, useLayoutContext } from '@/components/providers/LayoutProvider';

// Hooks
export { useLayout } from '@/components/hooks/useLayout';

// Utils
export { getContextGradient, gradientToStyle } from '@/lib/utils/gradients';

// Types
export type {
  NavItem,
  NavSection,
  Context,
  Gradient,
  User,
  PointsData,
  Notification,
  LayoutState,
} from '@/types/layout';

