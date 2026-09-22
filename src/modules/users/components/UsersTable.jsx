import { MoreVertical, Mail, Shield, Edit2, Trash2, Eye } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@shared/context/ThemeContext';
import { cn, getInitials } from '@shared/utils/helpers';

const statusColors = {
  active: 'badge-success',
  inactive: 'badge-danger',
  pending: 'badge-warning',
};

export default function UsersTable({ users, onEdit, onDelete }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className={cn(
            'text-xs font-bold uppercase tracking-wider border-b',
            isDark ? 'text-slate-400 bg-slate-900/60 border-slate-800' : 'text-slate-500 bg-slate-50/90 border-slate-200'
          )}>
            <th className="px-5 py-3.5">User</th>
            <th className="px-4 py-3.5 hidden md:table-cell">Role</th>
            <th className="px-4 py-3.5 hidden lg:table-cell">Department</th>
            <th className="px-4 py-3.5 hidden sm:table-cell">Status</th>
            <th className="px-4 py-3.5 hidden xl:table-cell">Last Active</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className={cn('divide-y', isDark ? 'divide-slate-800/70' : 'divide-slate-100')}>
          {users?.map((user, i) => (
            <tr
              key={user.id}
              className={cn(
                'transition-colors duration-150',
                isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/90'
              )}
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border shadow-2xs',
                    isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200'
                  )}>
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-900')}>
                      {user.name}
                    </p>
                    <p className={cn('text-xs truncate', isDark ? 'text-slate-400' : 'text-slate-500')}>
                      {user.email}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5 hidden md:table-cell">
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-md border',
                  user.role === 'Admin'
                    ? isDark ? 'bg-blue-600/15 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200'
                    : user.role === 'Editor'
                      ? isDark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200'
                      : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                )}>
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3.5 hidden lg:table-cell">
                <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                  {user.department || '—'}
                </span>
              </td>
              <td className="px-4 py-3.5 hidden sm:table-cell">
                <span className={cn('badge uppercase text-[10px] tracking-wider', statusColors[user.status])}>
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3.5 hidden xl:table-cell">
                <span className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {user.lastActive}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="relative inline-block" ref={openMenu === user.id ? menuRef : null}>
                  <button
                    onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                    className={cn(
                      'p-1.5 rounded-lg border transition-colors cursor-pointer',
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    )}
                    aria-label="Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenu === user.id && (
                    <div className={cn(
                      'absolute right-0 top-full mt-1.5 w-40 rounded-xl p-1.5 z-50 shadow-xl border animate-scale-in',
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    )}>
                      <button
                        onClick={() => { navigate(`/users/${user.id}`); setOpenMenu(null); }}
                        className={cn('w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer', isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" /> View Profile
                      </button>
                      <button
                        onClick={() => { onEdit?.(user); setOpenMenu(null); }}
                        className={cn('w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer', isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-sky-500" /> Edit
                      </button>
                      <div className={cn('my-1 border-t', isDark ? 'border-slate-800' : 'border-slate-100')} />
                      <button
                        onClick={() => { onDelete?.(user.id); setOpenMenu(null); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
