import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '@shared/context/ThemeContext';
import { cn } from '@shared/utils/helpers';

export default function UserForm({ user, onSubmit, onClose, loading }) {
  const { isDark } = useTheme();
  const isEdit = !!user;
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'Viewer',
    department: user?.department || '',
    status: user?.status || 'active',
  });

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const inputClass = cn('input-field', isDark ? 'input-dark' : 'input-light');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full max-w-lg rounded-2xl p-6 animate-scale-in',
        isDark ? 'glass border border-surface-700/50' : 'bg-white border border-surface-200 shadow-2xl'
      )}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn('text-lg font-semibold', isDark ? 'text-surface-100' : 'text-surface-900')}>
            {isEdit ? 'Edit User' : 'Add New User'}
          </h3>
          <button onClick={onClose} className={cn('p-2 rounded-lg', isDark ? 'hover:bg-surface-700 text-surface-400' : 'hover:bg-surface-100 text-surface-500')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-surface-300' : 'text-surface-600')}>Name</label>
            <input type="text" placeholder="e.g. John Doe" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-surface-300' : 'text-surface-600')}>Email</label>
            <input type="email" placeholder="e.g. john@example.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={inputClass} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-surface-300' : 'text-surface-600')}>Role</label>
              <select value={formData.role} onChange={(e) => handleChange('role', e.target.value)} className={inputClass}>
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-surface-300' : 'text-surface-600')}>Status</label>
              <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-surface-300' : 'text-surface-600')}>Department</label>
            <input type="text" placeholder="e.g. Engineering" value={formData.department} onChange={(e) => handleChange('department', e.target.value)} className={inputClass} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
