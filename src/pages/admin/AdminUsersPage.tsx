import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreVertical, CheckCircle2, XCircle, 
  AlertTriangle, Trash2, Shield, Eye, Ban, UserCheck,
  Calendar, DollarSign, Activity, Mail, Phone, MapPin,
  FileText, Clock, ArrowUpRight
} from 'lucide-react';
import { Button, Badge, Input } from '../../components/UI';

type VerificationStatus = 'Not Submitted' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Modification Requested';
type UserStatus = 'Active' | 'Suspended' | 'Deleted' | 'Banned';
type UserRole = 'admin' | 'tourist' | 'organizer' | 'artisan';

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  artisanStatus?: VerificationStatus;
  organizerStatus?: VerificationStatus;
  status: UserStatus;
  suspensionReason?: string | null;
  lastLogin?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  organizerProfile?: {
    isVerified?: boolean;
    companyName?: string;
    phone?: string;
    avatar?: string;
  };
}

interface Stats {
  total: number;
  admin: number;
  organizer: number;
  artisan: number;
  tourist: number;
  active: number;
  suspended: number;
  banned: number;
}

function getVerificationStatus(user: UserData): VerificationStatus {
  if (user.role === 'artisan') return user.artisanStatus || 'Not Submitted';
  if (user.role === 'organizer') return user.organizerStatus || 'Not Submitted';
  return 'Not Submitted';
}

function getRoleDisplay(role: UserRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

function formatLastLogin(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterVerification, setFilterVerification] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewUser, setViewUser] = useState<UserData | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filterRole, filterStatus, searchQuery, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '25',
      });
      if (filterRole !== 'All') params.set('role', filterRole);
      if (filterStatus !== 'All') params.set('status', filterStatus);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalUsers(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddUser = async (formData: { name: string; email: string; role: string }) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setIsAddUserModalOpen(false);
        fetchUsers();
        fetchStats();
      } else {
        alert(data.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('An error occurred while adding the user');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const reason = window.prompt('Enter suspension reason');
    if (reason === null) return;
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      alert('Suspension reason is required');
      return;
    }

    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: trimmedReason }),
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(prev =>
          prev.map(u =>
            u._id === userId
              ? { ...u, status: 'Suspended' as UserStatus, suspensionReason: trimmedReason }
              : u
          )
        );
        fetchStats();
      } else {
        alert(data.message || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('An error occurred while suspending the user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/users/${userId}/activate`, { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'Active' as UserStatus } : u));
        fetchStats();
      } else {
        alert(data.message || 'Failed to activate user');
      }
    } catch (error) {
      console.error('Error activating user:', error);
      alert('An error occurred while activating the user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to soft delete this user?')) return;
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        setUsers(prev => prev.filter(u => u._id !== userId));
        fetchStats();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An error occurred while deleting the user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Verification', 'Joined'];
    const csvContent = [
      headers.join(','),
      ...users.map(u => [u._id, u.name, u.email, getRoleDisplay(u.role), u.status, getVerificationStatus(u), formatDate(u.createdAt)].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(uid => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u._id));
    }
  };

  const counts = {
    Admin: stats?.admin || 0,
    Organizer: stats?.organizer || 0,
    Artisan: stats?.artisan || 0,
    Tourist: stats?.tourist || 0,
    Total: stats?.total || 0,
  };

  const AddUserModal = ({ onClose }: { onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      role: 'Tourist' as string
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      await handleAddUser(formData);
      setSubmitting(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <Input 
                placeholder="Enter full name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <Input 
                type="email" 
                placeholder="Enter email address" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
              <select 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="Tourist">Tourist</option>
                <option value="Artisan">Artisan</option>
                <option value="Organizer">Organizer</option>
              </select>
            </div>

            <p className="text-xs text-gray-400">A default password will be set and shared with the user.</p>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="w-full" isLoading={submitting}>Add User</Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const UserProfileModal = ({ user, onClose }: { user: UserData; onClose: () => void }) => {
    const handleAction = async (action: string) => {
      if (action === 'Suspend Account') {
        await handleSuspendUser(user._id);
      } else if (action === 'Activate Account') {
        await handleActivateUser(user._id);
      } else if (action === 'Soft Delete') {
        await handleDeleteUser(user._id);
      }
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full border-4 border-gray-50 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {user.organizerProfile?.avatar ? (
                    <img src={user.organizerProfile.avatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-3xl font-bold text-gray-400">{user.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-bold text-gray-800">{user.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary">{getRoleDisplay(user.role)}</Badge>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                      user.status === 'Suspended' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Personal Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="w-4 h-4" /> {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-4 h-4" /> {user.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-4 h-4" /> Joined {formatDate(user.createdAt)}
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Clock className="w-4 h-4" /> Last active {formatLastLogin(user.lastLogin)}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Verification
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`text-xs font-bold flex items-center gap-1 ${
                        getVerificationStatus(user) === 'Approved' ? 'text-emerald-600' : 
                        getVerificationStatus(user) === 'Rejected' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {getVerificationStatus(user) === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                        {getVerificationStatus(user)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Account Status</p>
                    <p className="text-lg font-bold text-gray-800">{user.status}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-600 uppercase mb-1">Role</p>
                    <p className="text-lg font-bold text-gray-800">{getRoleDisplay(user.role)}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Joined</p>
                    <p className="text-lg font-bold text-gray-800">{formatDate(user.createdAt)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4">Admin Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    {user.status === 'Active' ? (
                      <Button variant="outline" leftIcon={Ban} className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleAction('Suspend Account')} isLoading={actionLoading === user._id}>Suspend Account</Button>
                    ) : (
                      <Button variant="outline" leftIcon={CheckCircle2} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleAction('Activate Account')} isLoading={actionLoading === user._id}>Activate Account</Button>
                    )}
                    <Button variant="outline" leftIcon={Trash2} className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction('Soft Delete')} isLoading={actionLoading === user._id}>Soft Delete</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {viewUser && <UserProfileModal user={viewUser} onClose={() => setViewUser(null)} />}
      {isAddUserModalOpen && <AddUserModal onClose={() => setIsAddUserModalOpen(false)} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 text-sm">Manage accounts, roles, verification, and platform access.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={FileText} onClick={handleExport}>Export Users</Button>
          <Button leftIcon={Shield} onClick={() => setIsAddUserModalOpen(true)}>Add User</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats ? (
          <>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
              <p className="text-xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Admin</p>
              <p className="text-xl font-bold text-gray-800">{stats.admin}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Organizer</p>
              <p className="text-xl font-bold text-gray-800">{stats.organizer}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Artisan</p>
              <p className="text-xl font-bold text-gray-800">{stats.artisan}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tourist</p>
              <p className="text-xl font-bold text-gray-800">{stats.tourist}</p>
            </div>
          </>
        ) : (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-8"></div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <select 
              className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-600 focus:ring-2 focus:ring-primary/20 cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Banned">Banned</option>
            </select>
            <Button 
              variant={showMoreFilters ? "primary" : "outline"} 
              leftIcon={Filter}
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              More Filters
            </Button>
          </div>
        </div>

        {showMoreFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Verification Status</label>
              <select 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                value={filterVerification}
                onChange={(e) => setFilterVerification(e.target.value)}
              >
                <option value="All">All Verification</option>
                <option value="Not Submitted">Not Submitted</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Organizer', 'Artisan', 'Tourist', 'Admin'].map(role => (
            <button
              key={role}
              onClick={() => { setFilterRole(role); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterRole === role ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {role} ({counts[role as keyof typeof counts] || 0})
            </button>
          ))}
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-bold text-indigo-900 px-2">{selectedUsers.length} users selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50" onClick={async () => {
                for (const id of selectedUsers) await handleSuspendUser(id);
                setSelectedUsers([]);
              }}>Suspend Selected</Button>
              <Button size="sm" variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50" onClick={async () => {
                for (const id of selectedUsers) await handleDeleteUser(id);
                setSelectedUsers([]);
              }}>Delete Selected</Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" 
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user._id} className={`hover:bg-gray-50 transition-colors group ${selectedUsers.includes(user._id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" 
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleSelectUser(user._id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewUser(user)}>
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                        {user.organizerProfile?.avatar ? (
                          <img src={user.organizerProfile.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">{user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 hover:text-primary transition-colors">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" size="sm">{getRoleDisplay(user.role)}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    {getVerificationStatus(user) === 'Approved' && <Badge variant="success" size="sm">Approved</Badge>}
                    {getVerificationStatus(user) === 'Pending' && <Badge variant="warning" size="sm">Pending</Badge>}
                    {getVerificationStatus(user) === 'Under Review' && <Badge variant="info" size="sm">Under Review</Badge>}
                    {getVerificationStatus(user) === 'Not Submitted' && <Badge variant="secondary" size="sm">Not Submitted</Badge>}
                    {getVerificationStatus(user) === 'Rejected' && <Badge variant="error" size="sm">Rejected</Badge>}
                    {getVerificationStatus(user) === 'Modification Requested' && <Badge variant="warning" size="sm">Modification Requested</Badge>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                      user.status === 'Suspended' ? 'bg-amber-50 text-amber-600' : 
                      user.status === 'Banned' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'Active' ? 'bg-emerald-500' : 
                        user.status === 'Suspended' ? 'bg-amber-500' : 
                        user.status === 'Banned' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                    {formatLastLogin(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setViewUser(user)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" 
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.status === 'Active' ? (
                        <button 
                          className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" 
                          title="Suspend User"
                          onClick={() => handleSuspendUser(user._id)}
                          disabled={actionLoading === user._id}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" 
                          title="Activate User"
                          onClick={() => handleActivateUser(user._id)}
                          disabled={actionLoading === user._id}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Soft Delete User"
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={actionLoading === user._id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>Showing {users.length} of {totalUsers} users</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
