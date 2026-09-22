import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  MoreVertical,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  Building,
  UserCheck,
  Lock,
  ArrowUpDown,
  Download,
  CheckSquare,
  Square,
  Activity,
  Globe,
  Calendar,
  X,
  User,
} from 'lucide-react';
import { Button } from '../../../shared/components/Button.jsx';
import { Card } from '../../../shared/components/Card.jsx';
import { Badge } from '../../../shared/components/Badge.jsx';
import { Modal } from '../../../shared/components/Modal.jsx';
import { Table, Pagination } from '../../../shared/components/Table.jsx';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader.jsx';
import { useAuth } from '../../../shared/hooks/useAuth.js';
import { apiService } from '../../../shared/services/api.js';
import { eventBus, MFE_EVENTS } from '../../../shared/services/eventBus.js';

const ROLES = [
  { value: 'All', label: 'All Roles' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Viewer', label: 'Viewer' },
];

const STATUSES = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Suspended', label: 'Suspended' },
];

export default function UsersListPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Viewer',
    department: 'Engineering',
    status: 'Active',
  });
  const [formErrors, setFormErrors] = useState({});

  // RBAC Helpers
  const userRole = currentUser?.role || 'Admin';
  const canCreate = userRole === 'Admin' || userRole === 'Manager';
  const canEdit = userRole === 'Admin' || userRole === 'Manager';
  const canDelete = userRole === 'Admin';

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getUsers({
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
      });
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch directory users.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sorting Handler
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // Pagination Slice
  const totalPages = Math.ceil(users.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, currentPage, pageSize]);

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required.';
    if (!formData.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please provide a valid email address.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Add User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const result = await apiService.createUser(formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', role: 'Viewer', department: 'Engineering', status: 'Active' });
      await fetchUsers();

      eventBus.publish(
        MFE_EVENTS.NOTIFICATION_EMIT,
        {
          title: 'User Created',
          message: `${result.data.name} was added to the organization as a ${result.data.role}.`,
          type: 'success',
        },
        'users'
      );
    } catch (err) {
      alert(err.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit User
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!validateForm() || !selectedUser) return;

    try {
      setIsSubmitting(true);
      const result = await apiService.updateUser(selectedUser.id, formData);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      await fetchUsers();

      eventBus.publish(
        MFE_EVENTS.NOTIFICATION_EMIT,
        {
          title: 'User Updated',
          message: `Record for ${result.data.name} was updated successfully.`,
          type: 'info',
        },
        'users'
      );
    } catch (err) {
      alert(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      await apiService.deleteUser(selectedUser.id);
      setIsDeleteModalOpen(false);
      setSelectedIds((prev) => prev.filter((id) => id !== selectedUser.id));
      await fetchUsers();

      eventBus.publish(
        MFE_EVENTS.NOTIFICATION_EMIT,
        {
          title: 'User Removed',
          message: `${selectedUser.name} was purged from the directory.`,
          type: 'warning',
        },
        'users'
      );
      setSelectedUser(null);
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Operations
  const handleBulkDelete = async () => {
    try {
      setIsSubmitting(true);
      await apiService.bulkDeleteUsers(selectedIds);
      setIsBulkDeleteModalOpen(false);
      const count = selectedIds.length;
      setSelectedIds([]);
      await fetchUsers();

      eventBus.publish(
        MFE_EVENTS.NOTIFICATION_EMIT,
        {
          title: 'Bulk Delete Executed',
          message: `Successfully purged ${count} user records.`,
          type: 'warning',
        },
        'users'
      );
    } catch (err) {
      alert(err.message || 'Bulk delete failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Export
  const handleExportSelected = () => {
    const exportData = selectedIds.length > 0 ? users.filter((u) => selectedIds.includes(u.id)) : users;
    const headers = ['ID', 'Name', 'Email', 'Role', 'Department', 'Status', 'JoinedDate'];
    const rows = exportData.map((u) => [
      u.id,
      `"${u.name}"`,
      `"${u.email}"`,
      u.role,
      `"${u.department}"`,
      u.status,
      u.joinedDate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `microdash-users-directory-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(paginatedUsers.map((u) => u.id));
            } else {
              setSelectedIds([]);
            }
          }}
          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      ),
      render: (user) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(user.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds((prev) => [...prev, user.id]);
            } else {
              setSelectedIds((prev) => prev.filter((id) => id !== user.id));
            }
          }}
          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      ),
      className: 'w-10 text-center',
    },
    {
      key: 'name',
      header: 'User Identity',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-xl ring-1 ring-indigo-500/20 object-cover bg-slate-100 dark:bg-slate-800"
          />
          <div>
            <div className="font-semibold text-slate-900 dark:text-white leading-tight">{user.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => <Badge variant={user.role}>{user.role}</Badge>,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (user) => <span className="text-xs text-slate-600 dark:text-slate-400">{user.department}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user) => (
        <Badge variant={user.status} size="sm" dot>
          {user.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (user) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailUser(user)}
            title="Inspect profile & audit log"
          >
            Inspect
          </Button>

          {canEdit ? (
            <button
              type="button"
              onClick={() => {
                setSelectedUser(user);
                setFormData({
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  department: user.department,
                  status: user.status,
                });
                setIsEditModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Edit user details"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          ) : (
            <span className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed" title="Requires Admin or Manager permissions">
              <Edit2 className="w-4 h-4 opacity-40" />
            </span>
          )}

          {canDelete ? (
            <button
              type="button"
              onClick={() => {
                setSelectedUser(user);
                setIsDeleteModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              title="Delete user record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <span className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed" title="Requires Admin permissions to delete">
              <Trash2 className="w-4 h-4 opacity-40" />
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-indigo-500" />
            User Directory & Access Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise identity directory with multi-role governance and full CRUD operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={Download} onClick={handleExportSelected}>
            Export Directory
          </Button>

          {canCreate ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={UserPlus}
              onClick={() => {
                setFormData({ name: '', email: '', role: 'Viewer', department: 'Engineering', status: 'Active' });
                setFormErrors({});
                setIsAddModalOpen(true);
              }}
            >
              Add User
            </Button>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 cursor-not-allowed opacity-75"
              title="Admin or Manager permissions required to create users"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Add User (Restricted)</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Sticky Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-20 p-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-mono">
              {selectedIds.length}
            </span>
            <span>records selected</span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-indigo-200 hover:text-white underline ml-2 cursor-pointer"
            >
              Clear Selection
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportSelected}>
              Export Selected
            </Button>
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={Trash2}
                onClick={() => setIsBulkDeleteModalOpen(true)}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <Card padding={false} className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, department..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{r.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{s.label}</option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('All');
                setStatusFilter('All');
                fetchUsers();
              }}
              title="Reset search and filters"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Users Table */}
      {loading ? (
        <SkeletonLoader type="table" />
      ) : (
        <Card padding={false} className="overflow-hidden">
          <Table
            columns={columns}
            data={paginatedUsers}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={users.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </Card>
      )}

      {/* Slide-over User Detail Drawer */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-300 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>User Intelligence Profile</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Identity Header */}
              <div className="flex items-center gap-4">
                <img
                  src={detailUser.avatar}
                  alt={detailUser.name}
                  className="w-16 h-16 rounded-2xl ring-2 ring-indigo-500/30 object-cover"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {detailUser.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{detailUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={detailUser.role}>{detailUser.role}</Badge>
                    <Badge variant={detailUser.status} size="sm" dot>
                      {detailUser.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono">Department</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{detailUser.department}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono">Joined Date</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{detailUser.joinedDate}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono">Last Active</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{detailUser.lastActive}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono">Last IP Address</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{detailUser.lastIp || '192.168.1.1'}</p>
                </div>
              </div>

              {/* Audit Log */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 font-mono">
                  Recent Security Activity Audit
                </h4>
                <div className="space-y-2">
                  {(detailUser.activityLog || [
                    { action: 'Session token refreshed', timestamp: '12m ago' },
                    { action: 'Accessed Analytics module', timestamp: '2h ago' },
                  ]).map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-700 dark:text-slate-300">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setDetailUser(null)}>
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Enterprise User"
        subtitle="Add a new member to the directory with role permissions"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Amara Okafor"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="amara@enterprise.io"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {formErrors.email && <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Admin (Full Control)</option>
                <option value="Manager" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Manager (Read & Edit)</option>
                <option value="Viewer" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Viewer (Read Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Engineering" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Engineering</option>
                <option value="Product" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Product</option>
                <option value="Marketing" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Marketing</option>
                <option value="Finance" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Finance</option>
                <option value="Operations" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Operations</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Provision Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update User Record"
        subtitle={`Modifying profile for ${selectedUser?.name}`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Admin</option>
                <option value="Manager" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Manager</option>
                <option value="Viewer" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Viewer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Active</option>
                <option value="Inactive" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Inactive</option>
                <option value="Suspended" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Updates
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm User Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold">Permanent Operation</p>
              <p className="mt-1">
                Are you sure you want to remove <strong>{selectedUser?.name}</strong>? This will revoke all session tokens and access permissions immediately.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteUser} isLoading={isSubmitting}>
              Yes, Purge User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Confirm Bulk Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold">Purge {selectedIds.length} User Records?</p>
              <p className="mt-1">
                This action will delete all selected accounts permanently from the database.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsBulkDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleBulkDelete} isLoading={isSubmitting}>
              Purge All {selectedIds.length} Selected
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
