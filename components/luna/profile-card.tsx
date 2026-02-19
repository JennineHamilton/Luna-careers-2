'use client';

import * as React from 'react';
import { MapPin, Mail, Phone, Briefcase, Calendar, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaCard, LunaCardContent } from './card';
import { LunaAvatar } from './avatar';
import { LunaBadge } from './badge';
import { LunaButton } from './button';

export interface LunaProfileCardProps {
  /** Profile type */
  type?: 'user' | 'organization';
  /** Avatar URL */
  avatar?: string;
  /** Cover image URL */
  coverImage?: string;
  /** Name */
  name: string;
  /** Title/Role (for users) or Industry (for organizations) */
  subtitle?: string;
  /** Location */
  location?: string;
  /** Email */
  email?: string;
  /** Phone */
  phone?: string;
  /** Bio/Description */
  bio?: string;
  /** Tags/Skills */
  tags?: string[];
  /** Stats */
  stats?: Array<{ label: string; value: string | number }>;
  /** Action buttons */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: React.ReactNode;
  }>;
  /** Additional metadata */
  metadata?: Array<{ icon: React.ReactNode; label: string; value: string }>;
  /** Show verified badge */
  verified?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * LunaProfileCard - Profile card for user and organization profiles.
 *
 * @example
 * ```tsx
 * <LunaProfileCard
 *   type="user"
 *   avatar="/avatars/john.jpg"
 *   name="John Doe"
 *   subtitle="Senior Software Engineer"
 *   location="San Francisco, CA"
 *   bio="Passionate about building great products..."
 *   tags={['React', 'TypeScript', 'Node.js']}
 *   stats={[
 *     { label: 'Applications', value: 12 },
 *     { label: 'Courses', value: 5 }
 *   ]}
 * />
 * ```
 */
export function LunaProfileCard({
  type = 'user',
  avatar,
  coverImage,
  name,
  subtitle,
  location,
  email,
  phone,
  bio,
  tags = [],
  stats = [],
  actions = [],
  metadata = [],
  verified = false,
  className,
}: LunaProfileCardProps) {
  return (
    <LunaCard className={cn('overflow-hidden', className)} data-slot="luna-profile-card">
      {/* Cover Image */}
      {coverImage && (
        <div className="h-32 bg-gradient-to-r from-luna-navy to-luna-blue relative">
          <img src={coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <LunaCardContent className="p-6">
        {/* Avatar & Name Section */}
        <div className={cn('flex items-start gap-4', coverImage && '-mt-16 mb-4')}>
          <LunaAvatar
            src={avatar}
            alt={name}
            size="xl"
            className={cn(coverImage && 'ring-4 ring-white')}
          />
          <div className="flex-1 min-w-0 mt-auto">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-luna-gray-900 truncate">{name}</h3>
              {verified && (
                <LunaBadge variant="success" className="shrink-0">
                  Verified
                </LunaBadge>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-luna-gray-600 mb-2">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Contact Info */}
        {(location || email || phone) && (
          <div className="space-y-2 mb-4">
            {location && (
              <div className="flex items-center gap-2 text-sm text-luna-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-2 text-sm text-luna-gray-600">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${email}`} className="hover:text-luna-blue">
                  {email}
                </a>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-2 text-sm text-luna-gray-600">
                <Phone className="w-4 h-4" />
                <a href={`tel:${phone}`} className="hover:text-luna-blue">
                  {phone}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="text-sm text-luna-gray-700 mb-4 leading-relaxed">{bio}</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <LunaBadge key={index} variant="default">
                {tag}
              </LunaBadge>
            ))}
          </div>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-luna-gray-200 mb-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-luna-gray-900">{stat.value}</div>
                <div className="text-xs text-luna-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        {metadata.length > 0 && (
          <div className="space-y-2 mb-4">
            {metadata.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-luna-gray-600">
                {item.icon}
                <span className="text-luna-gray-900 font-medium">{item.label}:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <LunaButton
                key={index}
                variant={action.variant || 'primary'}
                onClick={action.onClick}
                icon={action.icon}
              >
                {action.label}
              </LunaButton>
            ))}
          </div>
        )}
      </LunaCardContent>
    </LunaCard>
  );
}

