'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Camera, 
  Video, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Lightbulb,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCompletionData {
  avatar_url: string | null;
  intro_video_url: string | null;
  bio: string | null;
  experienceCount: number;
  educationCount: number;
  certificationCount: number;
  skillsCount: number;
  languagesCount: number;
}

interface ProfileCompletionBarProps {
  profileData: ProfileCompletionData;
  onOpenModal?: (modalType: string) => void;
}

const PROFILE_ITEMS = [
  { id: 'avatar', label: 'Profile Image', icon: Camera, modalKey: 'avatar' },
  { id: 'video', label: 'Intro Video', icon: Video, modalKey: 'video' },
  { id: 'bio', label: 'About Me', icon: User, modalKey: 'editProfile' },
  { id: 'experience', label: 'Experience', icon: Briefcase, modalKey: 'experience' },
  { id: 'education', label: 'Education', icon: GraduationCap, modalKey: 'education' },
  { id: 'certification', label: 'Certifications', icon: Award, modalKey: 'certification' },
  { id: 'skills', label: 'Skills', icon: Lightbulb, modalKey: 'skills' },
  { id: 'languages', label: 'Languages', icon: Globe, modalKey: 'language' },
];

export function ProfileCompletionBar({ profileData, onOpenModal }: ProfileCompletionBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check which items are completed
  const getCompletionStatus = () => {
    return {
      avatar: !!profileData.avatar_url,
      video: !!profileData.intro_video_url,
      bio: !!profileData.bio,
      experience: profileData.experienceCount > 0,
      education: profileData.educationCount > 0,
      certification: profileData.certificationCount > 0,
      skills: profileData.skillsCount > 0,
      languages: profileData.languagesCount > 0,
    };
  };

  const completionStatus = getCompletionStatus();
  const completedCount = Object.values(completionStatus).filter(Boolean).length;
  const totalCount = PROFILE_ITEMS.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = completionPercentage === 100;

  // Only show on dashboard and profile pages
  const allowedPaths = ['/u/dashboard', '/u/profile'];
  const shouldShow = allowedPaths.some(path => pathname?.startsWith(path));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-completion-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!shouldShow || isComplete) {
    return null;
  }

  const incompleteItems = PROFILE_ITEMS.filter(item => !completionStatus[item.id as keyof typeof completionStatus]);

  const handleItemClick = (item: typeof PROFILE_ITEMS[0]) => {
    setIsDropdownOpen(false);
    
    // If we're on the profile page and have a modal handler, open the modal
    if (pathname === '/u/profile' && onOpenModal) {
      onOpenModal(item.modalKey);
    } else {
      // Navigate to profile page with modal parameter
      router.push(`/u/profile?openModal=${item.modalKey}`);
    }
  };

  return (
    <div className="w-full bg-rose-50 border-b border-rose-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 gap-6">
          {/* Left: Title and Description */}
          <div className="flex-shrink-0">
            <h3 className="text-base font-semibold text-luna-gray-900">
              Complete your profile
            </h3>
            <p className="text-sm text-luna-gray-600">
              By completing all the details you have a higher chance of being seen by recruiters.
            </p>
          </div>

          {/* Center: Progress Bar */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-luna-gray-900 whitespace-nowrap">
                {completionPercentage}%
              </span>
              <div className="flex-1 h-2.5 bg-luna-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-luna-blue rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Dropdown */}
          <div className="relative flex-shrink-0" data-profile-completion-dropdown>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-luna-gray-700 hover:text-luna-gray-900 transition-colors"
            >
              View Steps
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-200",
                isDropdownOpen && "rotate-180"
              )} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-luna-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="py-2">
                  {incompleteItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-luna-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-luna-blue/10 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-4 h-4 text-luna-blue" />
                        </div>
                        <span className="text-sm text-luna-gray-700">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
