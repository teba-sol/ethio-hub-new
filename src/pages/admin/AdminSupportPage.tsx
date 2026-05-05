"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, MessageSquare, Mail, Phone, Clock, 
  CheckCircle2, AlertCircle, User, ChevronRight, Send,
  FileText, HelpCircle, MessageCircle, Headphones,
  X, MoreVertical, Paperclip, Bold, Italic, Code,
  ChevronDown, Filter, AlertTriangle, ArrowLeft, Trash2,
  Monitor, Globe, HardDrive, MapPin, History, Ticket
} from 'lucide-react';
import { Button, Badge, Input } from '../../components/UI';

// --- Types ---
interface Message {
  id: string;
  sender: 'user' | 'admin';
  content: string;
  timestamp: string;
  attachments?: { name: string; size: string }[];
}

interface Ticket {
  id: string;
  subject: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  userType: 'Premium' | 'Free';
  category: string;
  status: 'Unread' | 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  lastUpdated: string;
  messages: Message[];
  os?: string;
  browser?: string;
  ip?: string;
}

interface UserHistory {
  id: string;
  subject: string;
  status: string;
  date: string;
}

// --- Mock Data ---
const MOCK_TICKETS: Ticket[] = [
  { 
    id: 'TKT-001', 
    subject: 'Cannot verify my account', 
    userId: 'USR-1234',
    userName: 'John Doe', 
    userEmail: 'john.doe@email.com',
    userAvatar: 'JD',
    userType: 'Premium',
    category: 'Account Verification',
    status: 'Unread', 
    priority: 'High', 
    createdAt: '2m ago', 
    lastUpdated: '1m ago',
    os: 'Windows 11',
    browser: 'Chrome 120',
    ip: '192.168.1.101',
    messages: [
      { id: 'm1', sender: 'user', content: 'Hi, I have been trying to verify my account for the past 3 days but keep getting an error. The system says "Verification failed" but I have submitted all my documents. Can you help?', timestamp: '2m ago' },
    ]
  },
  { 
    id: 'TKT-002', 
    subject: 'Payment failed but money deducted', 
    userId: 'USR-5678',
    userName: 'Sarah M.', 
    userEmail: 'sarah.m@email.com',
    userAvatar: 'SM',
    userType: 'Free',
    category: 'Payment Issue',
    status: 'Open', 
    priority: 'High', 
    createdAt: '5h ago', 
    lastUpdated: '2h ago',
    os: 'macOS Sonoma',
    browser: 'Safari 17',
    ip: '192.168.1.205',
    messages: [
      { id: 'm1', sender: 'user', content: 'I attempted to purchase tickets for the Timket Festival but the payment failed. However, ETB 5,000 was deducted from my account. This is very frustrating!', timestamp: '5h ago' },
      { id: 'm2', sender: 'admin', content: 'Hi Sarah, I apologize for the inconvenience. Let me check your transaction history. Could you provide your order ID?', timestamp: '4h ago' },
      { id: 'm3', sender: 'user', content: 'My order ID is ORD-8821. Please help me get this resolved as soon as possible.', timestamp: '3h ago' },
    ]
  },
  { 
    id: 'TKT-003', 
    subject: 'How to update my profile?', 
    userId: 'USR-9012',
    userName: 'Abebe K.', 
    userEmail: 'abebe.k@email.com',
    userAvatar: 'AK',
    userType: 'Free',
    category: 'General Inquiry',
    status: 'In Progress', 
    priority: 'Low', 
    createdAt: '1d ago', 
    lastUpdated: '3h ago',
    os: 'Android 14',
    browser: 'Chrome Mobile',
    ip: '197.156.45.23',
    messages: [
      { id: 'm1', sender: 'user', content: 'I want to update my profile picture and phone number but cannot find the settings option. Can you guide me?', timestamp: '1d ago' },
      { id: 'm2', sender: 'admin', content: 'Hi Abebe! To update your profile, go to Dashboard > Settings > Profile. You can edit all your details there. Let me know if you need help!', timestamp: '1d ago' },
    ]
  },
  { 
    id: 'TKT-004', 
    subject: 'Product listing not showing', 
    userId: 'USR-3456',
    userName: 'Ethio Crafts', 
    userEmail: 'ethiocrafts@business.com',
    userAvatar: 'EC',
    userType: 'Premium',
    category: 'Product Issue',
    status: 'Open', 
    priority: 'Medium', 
    createdAt: '1d ago', 
    lastUpdated: '1d ago',
    os: 'Windows 10',
    browser: 'Firefox 121',
    ip: '197.156.78.44',
    messages: [
      { id: 'm1', sender: 'user', content: 'I uploaded 5 new products yesterday but they are not showing on the marketplace. How long does it take for approval?', timestamp: '1d ago' },
    ]
  },
  { 
    id: 'TKT-005', 
    subject: 'Refund request ignored', 
    userId: 'USR-7890',
    userName: 'Tourist User', 
    userEmail: 'tourist@email.com',
    userAvatar: 'TU',
    userType: 'Free',
    category: 'Refund Request',
    status: 'Resolved', 
    priority: 'High', 
    createdAt: '2d ago', 
    lastUpdated: '1d ago',
    os: 'iOS 17',
    browser: 'Safari Mobile',
    ip: '197.156.90.12',
    messages: [
      { id: 'm1', sender: 'user', content: 'I submitted a refund request 5 days ago but has been ignored. Order #8821. Please process it immediately.', timestamp: '2d ago' },
      { id: 'm2', sender: 'admin', content: 'Your refund has been processed. The amount (ETB 2,500) will be credited to your account within 3-5 business days.', timestamp: '1d ago' },
    ]
  },
];

const MOCK_USER_HISTORIES: Record<string, UserHistory[]> = {
  'USR-1234': [
    { id: 'TKT-098', subject: 'Login issues', status: 'Resolved', date: 'Dec 2025' },
    { id: 'TKT-087', subject: 'Payment problem', status: 'Resolved', date: 'Nov 2025' },
    { id: 'TKT-076', subject: 'Profile update', status: 'Resolved', date: 'Oct 2025' },
  ],
  'USR-5678': [
    { id: 'TKT-065', subject: 'Password reset', status: 'Resolved', date: 'Jan 2026' },
  ],
};

const CANNED_RESPONSES = [
  { id: 1, title: 'Looking into this', content: 'Thank you for your patience. I am looking into this and will get back to you shortly.' },
  { id: 2, title: 'Need more info', content: 'Could you please provide more details about the issue you are facing?' },
  { id: 3, title: 'Issue resolved', content: 'This issue has been resolved. Please let me know if you need any further assistance.' },
  { id: 4, title: 'Ticket escalated', content: 'I have escalated this ticket to our technical team. You will receive an update within 24 hours.' },
  { id: 5, title: 'Profile guide', content: 'To update your profile: Go to Dashboard > Settings > Profile. You can edit all your details there.' },
];

export const AdminSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Open' | 'Resolved' | 'Closed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showCanned, setShowCanned] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
const fetchTickets = async () => {
    try {
      const response = await fetch('/api/admin/support');
      if (response.ok) {
        const data = await response.json();
        if (data.tickets && data.tickets.length > 0) {
          const formattedTickets: Ticket[] = data.tickets.map((t: any) => ({
            id: t._id || t.id,
            subject: t.subject,
            userId: t.user?._id || t.user || 'unknown',
            userName: t.user?.name || t.userName || 'Unknown User',
            userEmail: t.user?.email || t.userEmail || '',
            userAvatar: (t.user?.name || t.userName || 'U')[0]?.toUpperCase() || 'U',
            userType: 'Free',
            category: 'General Inquiry',
            status: t.status === 'New' ? 'Unread' : t.status === 'In Progress' ? 'In Progress' : t.status === 'Resolved' ? 'Resolved' : 'Open',
            priority: 'Medium',
            createdAt: new Date(t.createdAt).toLocaleDateString(),
            lastUpdated: new Date(t.updatedAt || t.createdAt).toLocaleDateString(),
            messages: t.messages || [{ id: 'm1', sender: 'user', content: t.message, timestamp: new Date(t.createdAt).toLocaleDateString() }]
          }));
          setTickets(formattedTickets);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'All' || ticket.status === filter || (filter === 'Unread' && ticket.status === 'Unread');
    const matchesSearch = !searchQuery || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getUnreadCount = () => tickets.filter(t => t.status === 'Unread').length;
  const getOpenCount = () => tickets.filter(t => t.status === 'Open' || t.status === 'Unread').length;

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-amber-500';
      case 'Low': return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'Unread': return <Badge variant="error" size="sm">Unread</Badge>;
      case 'Open': return <Badge variant="warning" size="sm">Open</Badge>;
      case 'In Progress': return <Badge variant="info" size="sm">In Progress</Badge>;
      case 'Resolved': return <Badge variant="success" size="sm">Resolved</Badge>;
      case 'Closed': return <Badge variant="secondary" size="sm">Closed</Badge>;
    }
  };

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (ticket.status === 'Unread') {
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'Open' as const } : t));
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const newMessage: Message = {
        id: `m${Date.now()}`,
        sender: 'admin',
        content: replyText,
        timestamp: 'Just now'
      };
      await fetch(`/api/admin/support/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reply: replyText,
        })
      });
      setTickets(prev => prev.map(t => {
        if (t.id === selectedTicket.id) {
          return { 
            ...t, 
            messages: [...t.messages, newMessage],
            lastUpdated: 'Just now',
            status: 'In Progress' as const
          };
        }
        return t;
      }));
      setSelectedTicket(prev => prev ? { 
        ...prev, 
        messages: [...prev.messages, newMessage], 
        status: 'In Progress' 
      } : null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Closed' })
      });
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'Closed' as const } : t));
      setSelectedTicket(prev => prev ? { ...prev, status: 'Closed' } : null);
    } catch (err) {
      console.error('Failed to close ticket:', err);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    try {
      await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' })
      });
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'Resolved' as const } : t));
      setSelectedTicket(prev => prev ? { ...prev, status: 'Resolved' } : null);
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
    }
  };

  const handleCannedResponse = (response: typeof CANNED_RESPONSES[0]) => {
    setReplyText(response.content);
    setShowCanned(false);
  };

  const userHistory = selectedTicket ? MOCK_USER_HISTORIES[selectedTicket.userId] || [] : [];

  return (
    <div className="h-[calc(100vh-100px)] flex bg-gray-100 animate-in fade-in duration-300">
      {/* Column 1: Ticket List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(['All', 'Unread', 'Open', 'Resolved', 'Closed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === f 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f === 'All' ? 'All' : f === 'Unread' ? `Unread (${getUnreadCount()})` : f === 'Open' ? `Open (${getOpenCount()})` : f}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleSelectTicket(ticket)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
                selectedTicket?.id === ticket.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    ticket.userType === 'Premium' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ticket.userAvatar}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getPriorityColor(ticket.priority)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{ticket.id}</span>
                    <span className="text-xs text-gray-400">{ticket.createdAt}</span>
                  </div>
                  <p className={`text-sm font-medium truncate ${ticket.status === 'Unread' ? 'text-gray-900' : 'text-gray-600'}`}>
                    {ticket.subject}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{ticket.userName}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredTickets.length === 0 && (
            <div className="p-8 text-center">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No tickets found</p>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Conversation Thread */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {selectedTicket ? (
          <>
            {/* Conversation Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">{selectedTicket.userName}</span>
                    <span className="text-gray-300">•</span>
                    <Badge variant="secondary" size="sm">{selectedTicket.category}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTicket.status)}
                <div className="relative">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedTicket.messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.sender === 'admin' 
                      ? 'bg-primary text-white rounded-br-md' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.sender === 'admin' ? 'text-white/70' : 'text-gray-400'}`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="border-t border-gray-100 p-4 shrink-0">
              {selectedTicket.status !== 'Closed' && selectedTicket.status !== 'Resolved' && (
                <div className="space-y-3">
                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1 pb-2 border-b border-gray-100">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Bold className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Italic className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Code className="w-4 h-4 text-gray-500" />
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-2" />
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setShowCanned(!showCanned)}
                        className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-500"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Templates</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {showCanned && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-10">
                          {CANNED_RESPONSES.map((response) => (
                            <button
                              key={response.id}
                              onClick={() => handleCannedResponse(response)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                            >
                              <p className="text-sm font-medium text-gray-800">{response.title}</p>
                              <p className="text-xs text-gray-500 truncate">{response.content}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Text Input */}
                  <div className="flex gap-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 min-h-[80px] p-3 text-sm rounded-xl border border-gray-200 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" leftIcon={Trash2} className="text-red-500">
                      Discard
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleResolveTicket}
                      >
                        Mark Resolved
                      </Button>
                      <Button 
                        size="sm"
                        leftIcon={Send}
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sending}
                      >
                        {sending ? 'Sending...' : 'Send Reply'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {(selectedTicket.status === 'Closed' || selectedTicket.status === 'Resolved') && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    This ticket is {selectedTicket.status.toLowerCase()}. 
                    {selectedTicket.status === 'Resolved' && <button className="text-primary ml-1 hover:underline">Reopen?</button>}
                  </p>
                  {selectedTicket.status === 'Closed' && (
                    <Button size="sm" onClick={handleResolveTicket}>Reopen Ticket</Button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Select a ticket to view the conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* Column 3: User Context */}
      {selectedTicket && (
        <div className="w-72 bg-white border-l border-gray-200 p-4 shrink-0 overflow-y-auto hidden lg:block">
          {/* User Profile */}
          <div className="text-center pb-4 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 mx-auto mb-3">
              {selectedTicket.userAvatar}
            </div>
            <h3 className="font-bold text-gray-800">{selectedTicket.userName}</h3>
            <p className="text-sm text-gray-500">{selectedTicket.userEmail}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant={selectedTicket.userType === 'Premium' ? 'warning' : 'secondary'} size="sm">
                {selectedTicket.userType}
              </Badge>
              <Badge variant="secondary" size="sm">{selectedTicket.id}</Badge>
            </div>
          </div>

          {/* Previous History */}
          <div className="py-4 border-b border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <History className="w-4 h-4" /> Previous Tickets
            </h4>
            <div className="space-y-2">
              {userHistory.length > 0 ? (
                userHistory.map((history) => (
                  <div key={history.id} className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 truncate">{history.subject}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{history.date}</span>
                      <Badge variant={history.status === 'Resolved' ? 'success' : 'secondary'} size="sm">
                        {history.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No previous tickets</p>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="py-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> System Info
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Browser</p>
                  <p className="text-sm text-gray-700">{selectedTicket.browser}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Operating System</p>
                  <p className="text-sm text-gray-700">{selectedTicket.os}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">IP Address</p>
                  <p className="text-sm text-gray-700">{selectedTicket.ip}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <Button variant="outline" className="w-full" size="sm" leftIcon={Mail}>
              Email User
            </Button>
            <Button variant="outline" className="w-full" size="sm" leftIcon={Phone}>
              Call User
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportPage;