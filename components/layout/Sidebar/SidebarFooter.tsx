'use client';

export default function SidebarFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="border-t border-luna-border-default p-3">
      <div className="rounded-md p-2 bg-luna-gray-50">
        <div className="font-semibold text-[13px] text-luna-navy mb-1">
          Luna 1.4
        </div>
        <div className="text-[11px] text-luna-gray-600 leading-tight">
          © {currentYear} Black Amber Holdings.
        </div>
        <div className="text-[11px] text-luna-gray-600 leading-tight">
          All rights reserved.
        </div>
      </div>
    </div>
  );
}

