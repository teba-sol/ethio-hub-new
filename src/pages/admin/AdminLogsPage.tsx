import React, { useState } from 'react';
import { 
  Search, Filter, FileText, Shield, AlertTriangle, CheckCircle2, 
  Clock, User, Globe, XCircle
} from 'lucide-react';
import { Button, Badge } from '../../components/UI';

// --- Types ---
interface Log {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
  status: 'Success' | 'Failed' | 'Warning';
}

// --- Mock Data ---
const MOCK_LOGS: Log[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `LOG-${10000 + i}`,
  timestamp: new Date(Date.now() - i * 300000).toLocaleString(),
  user: i % 5 === 0 ? 'Admin User' : `User ${i}`,
  action: i % 5 === 0 ? 'System Config Change' : i % 3 === 0 ? 'Failed Login Attempt' : 'Order Created',
  details: i % 5 === 0 ? 'Updated commission rate to 15%' : 'Invalid password entered',
  ip: `192.168.1.${10 + i}`,
  status: i % 3 === 0 ? 'Failed' : i % 5 === 0 ? 'Warning' : 'Success'
}));

export const AdminLogsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = MOCK_LOGS.filter(log => 
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">System Logs</h1>
          <p className="text-gray-500 text-sm">Audit trail of all system activities and security events.</p>
        </div>
        <Button variant="outline" leftIcon={FileText}>Export Logs</Button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search logs by user, action, or details..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors font-mono text-xs">
                  <td className="px-6 py-4 text-gray-500">{log.timestamp}</td>
                  <td className="px-6 py-4 font-bold text-gray-700">{log.user}</td>
                  <td className="px-6 py-4 text-gray-800">{log.action}</td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-xs" title={log.details}>{log.details}</td>
                  <td className="px-6 py-4 text-gray-500">{log.ip}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-bold ${
                      log.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 
                      log.status === 'Failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {log.status === 'Success' ? <CheckCircle2 className="w-3 h-3" /> : 
                       log.status === 'Failed' ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLogsPage;
