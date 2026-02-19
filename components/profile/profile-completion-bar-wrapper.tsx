'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ProfileCompletionBar } from './profile-completion-bar';

interface ProfileData {
  avatar_url: string | null;
  intro_video_url: string | null;
  bio: string | null;
  experienceCount: number;
  educationCount: number;
  certificationCount: number;
  skillsCount: number;
  languagesCount: number;
}

export function ProfileCompletionBarWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Only show on dashboard and profile pages
  const allowedPaths = ['/u/dashboard', '/u/profile'];
  const shouldFetch = allowedPaths.some(path => pathname?.startsWith(path));

  useEffect(() => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/user/profile-completion');
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile completion data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [shouldFetch, pathname]);

  if (loading || !profileData || !shouldFetch) {
    return null;
  }

  const handleOpenModal = (modalType: string) => {
    if (pathname === '/u/profile') {
      // Dispatch custom event for profile page to handle
      window.dispatchEvent(new CustomEvent('openProfileModal', { detail: { modalType } }));
    } else {
      // Navigate to profile page with modal parameter
      router.push(`/u/profile?openModal=${modalType}`);
    }
  };

  return (
    <ProfileCompletionBar 
      profileData={profileData} 
      onOpenModal={handleOpenModal}
    />
  );
}
