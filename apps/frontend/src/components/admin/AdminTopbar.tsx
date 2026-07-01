import { Bell } from 'lucide-react';
import { useAppSelector } from '@/hooks/useStore';

interface AdminTopbarProps {
  title: string;
}

export function AdminTopbar({ title }: AdminTopbarProps) {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <header className="bg-admin-surface border-b border-admin-border h-14 px-6 flex items-center justify-between sticky top-0 z-30">
      <h1 className="text-admin-text font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <button type="button" aria-label="Notifications" className="text-admin-text-muted hover:text-admin-text">
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-admin-surface-2 border border-admin-border flex items-center justify-center text-xs font-mono text-admin-text">
          {user?.name?.charAt(0).toUpperCase() ?? 'A'}
        </div>
      </div>
    </header>
  );
}
