import React, { useState } from 'react';
import { 
  Search, Filter, MoreVertical, CheckCircle2, XCircle, 
  AlertTriangle, Trash2, Shield, Eye, Ban, UserCheck,
  Calendar, DollarSign, Activity, Mail, Phone, MapPin,
  FileText, Clock, ArrowUpRight
} from 'lucide-react';
import { Button, Badge, Input } from '../../components/UI';

// --- Types ---
type VerificationStatus = 'Not Submitted' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Organizer' | 'Artisan' | 'Tourist' | 'Admin';
  verificationStatus: VerificationStatus;
  status: 'Active' | 'Suspended' | 'Deleted' | 'Banned';
  joinedDate: string;
  lastLogin: string;
  avatar?: string;
  revenue?: number; // For Artisans/Organizers
  orders?: number; // For Tourists
  reportCount: number;
  suspiciousFlag: boolean;
}

// --- Mock Data ---
const MOCK_USERS: User[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `USR-${1000 + i}`,
  name: i % 3 === 0 ? 'Abebe Kebede' : i % 2 === 0 ? 'Sara Mohammed' : 'John Doe',
  email: `user${i}@example.com`,
  phone: '+251 911 234 567',
  role: i % 4 === 0 ? 'Organizer' : i % 3 === 0 ? 'Artisan' : i === 0 ? 'Admin' : 'Tourist',
  verificationStatus: i % 5 === 0 ? 'Submitted' : i % 4 === 0 ? 'Approved' : i % 3 === 0 ? 'Under Review' : i === 7 ? 'Rejected' : 'Not Submitted',
  status: i === 7 ? 'Suspended' : i === 12 ? 'Banned' : 'Active',
  joinedDate: new Date(Date.now() - i * 86400000 * 5).toLocaleDateString(),
  lastLogin: i % 3 === 0 ? '2 hours ago' : '3 days ago',
  avatar: i % 5 === 0 ? undefined : `https://ui-avatars.com/api/?name=User+${i}&background=random`,
  revenue: (i % 4 === 0 || i % 3 === 0) ? Math.floor(Math.random() * 50000) : undefined,
  orders: !(i % 4 === 0 || i % 3 === 0) ? Math.floor(Math.random() * 20) : undefined,
  reportCount: i === 7 ? 3 : 0,
  suspiciousFlag: i === 12
}));

export const AdminUsersPage: React.FC = () => {
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterVerification, setFilterVerification] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
    const matchesVerification = filterVerification === 'All' || user.verificationStatus === filterVerification;
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch && matchesVerification;
  });

  const counts = {
    Admin: MOCK_USERS.filter(u => u.role === 'Admin').length,
    Organizer: MOCK_USERS.filter(u => u.role === 'Organizer').length,
    Artisan: MOCK_USERS.filter(u => u.role === 'Artisan').length,
    Tourist: MOCK_USERS.filter(u => u.role === 'Tourist').length,
    Total: MOCK_USERS.length
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Verification', 'Joined'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(u => [u.id, u.name, u.email, u.role, u.status, u.verificationStatus, u.joinedDate].join(','))
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
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  // --- Add User Modal ---
  const AddUserModal = ({ onClose }: { onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      role: 'Tourist' as User['role']
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Adding user:', formData);
      // Here you would typically call an API to add the user
      onClose();
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
                onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
              >
                <option value="Tourist">Tourist</option>
                <option value="Artisan">Artisan</option>
                <option value="Organizer">Organizer</option>
              </select>
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="w-full">Add User</Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- User Profile Modal ---
  const UserProfileModal = ({ user, onClose }: { user: User; onClose: () => void }) => {
    const handleAction = (action: string) => {
      console.log(`User Action: ${action} for user ${user.id}`);
      alert(`${action} successful for ${user.name}`);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full border-4 border-gray-50 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-3xl font-bold text-gray-400">{user.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-bold text-gray-800">{user.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary">{user.role}</Badge>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                      user.status === 'Suspended' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {user.status}
                    </span>
                    {user.suspiciousFlag && (
                      <span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> High Risk
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Personal Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="w-4 h-4" /> {user.email}
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone className="w-4 h-4" /> {user.phone}
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin className="w-4 h-4" /> Addis Ababa, ET
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-4 h-4" /> Joined {user.joinedDate}
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Clock className="w-4 h-4" /> Last active {user.lastLogin}
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
                        user.verificationStatus === 'Approved' ? 'text-emerald-600' : 
                        user.verificationStatus === 'Rejected' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {user.verificationStatus === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                        {user.verificationStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ID Document</span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200 flex gap-2">
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction('Approve')}>Approve</Button>
                      <Button size="sm" variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction('Reject')}>Reject</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle & Right: Activity & Actions */}
              <div className="md:col-span-2 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-800">ETB {user.revenue?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-600 uppercase mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-800">{user.orders || 12}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-xs font-bold text-red-600 uppercase mb-1">Reports</p>
                    <p className="text-2xl font-bold text-gray-800">{user.reportCount}</p>
                  </div>
                </div>

                {/* Activity Log */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><FileText className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800">Order #882{i} Placed</p>
                          <p className="text-xs text-gray-500">2 hours ago • ETB 4,500</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleAction('View Activity')}>View</Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4">Admin Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" leftIcon={Ban} className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleAction('Suspend Account')}>Suspend Account</Button>
                    <Button variant="outline" leftIcon={Trash2} className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction('Soft Delete')}>Soft Delete</Button>
                    <Button variant="outline" leftIcon={Mail} onClick={() => handleAction('Send Email')}>Send Email</Button>
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

      {/* Header */}
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

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(counts).map(([label, count]) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-800">{count}</p>
          </div>
        ))}
      </div>

      {/* Advanced Filters */}
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
                <option value="Submitted">Submitted</option>
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
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterRole === role ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {role} ({counts[role as keyof typeof counts] || 0})
            </button>
          ))}
        </div>

        {/* Bulk Actions Bar (Visible when items selected) */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-bold text-indigo-900 px-2">{selectedUsers.length} users selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50">Verify Selected</Button>
              <Button size="sm" variant="outline" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50">Suspend Selected</Button>
              <Button size="sm" variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50">Delete Selected</Button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" 
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 transition-colors group ${selectedUsers.includes(user.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" 
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewUser(user)}>
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">{user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 hover:text-primary transition-colors">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      {user.reportCount > 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" size="sm">{user.role}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    {user.verificationStatus === 'Approved' && <Badge variant="success" size="sm">Approved</Badge>}
                    {user.verificationStatus === 'Submitted' && <Badge variant="warning" size="sm">Submitted</Badge>}
                    {user.verificationStatus === 'Under Review' && <Badge variant="info" size="sm">Under Review</Badge>}
                    {user.verificationStatus === 'Not Submitted' && <Badge variant="secondary" size="sm">Not Submitted</Badge>}
                    {user.verificationStatus === 'Rejected' && <Badge variant="error" size="sm">Rejected</Badge>}
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
                  <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700">
                    {user.revenue ? `ETB ${user.revenue.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                    {user.joinedDate}
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
                        <button className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Suspend User">
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Activate User">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Soft Delete User">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Mock) */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>Showing {filteredUsers.length} of {MOCK_USERS.length} users</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
