'use client';

import Image from 'next/image';
import { DM_Serif_Text } from 'next/font/google';

const dmSerifText = DM_Serif_Text({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — Branding ────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[560px] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: '#00185F' }}
      >
        {/* ── Top: Logo ── */}
        <div className="relative z-10">
          <Image
            src="/img/Luna_logo_light.png"
            alt="Luna Careers"
            width={200}
            height={53}
            priority
          />
        </div>

        {/* ── Middle: Tagline + Features ── */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2
              className={`text-4xl text-white leading-[1.15] mb-4 ${dmSerifText.className}`}
            >
              Empowering your
              <br />
              career journey
            </h2>
            <p className="text-blue-200/80 text-[15px] leading-relaxed max-w-xs">
              Connect with top employers, develop in-demand skills,
              and unlock your full career potential.
            </p>
          </div>


        </div>

        {/* ── Bottom: Copyright ── */}
        <div className="relative z-10">
          <p className="text-white text-xs">
            © {new Date().getFullYear()} Black Amber Holdings. All rights
            reserved.
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        {/* Mobile logo header */}
        <div className="lg:hidden flex justify-center pt-10 pb-2">
          <Image
            src="/img/Luna_logo_dark.png"
            alt="Luna Careers"
            width={140}
            height={37}
            priority
          />
        </div>

        {/* Centered form area */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-8 py-8">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden pb-6">
          <p className="text-center text-xs text-luna-gray-400">
            © {new Date().getFullYear()} Black Amber Holdings. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

