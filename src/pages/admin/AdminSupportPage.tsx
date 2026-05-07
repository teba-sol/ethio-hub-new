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
      case 'High': return 'bg-rose-500';
      case 'Medium': return 'bg-amber-500';
      case 'Low': return 'bg-slate-400';
    }
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'Unread': return <Badge variant="error" className="bg-rose-50 text-rose-600 border-rose-100">Unread</Badge>;
      case 'Open': return <Badge variant="warning" className="bg-amber-50 text-amber-600 border-amber-100">Open</Badge>;
      case 'In Progress': return <Badge variant="info" className="bg-blue-50 text-blue-600 border-blue-100">In Progress</Badge>;
      case 'Resolved': return <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100">Resolved</Badge>;
      case 'Closed': return <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100">Closed</Badge>;
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
    <div className="h-[calc(100vh-100px)] flex bg-[#f8fafc] animate-in fade-in duration-500 overflow-hidden rounded-[32px] border border-slate-200/60 shadow-xl m-4">
      {/* Column 1: Ticket List */}
      <div className="w-80 bg-white border-r border-slate-100 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-slate-50">
          <h1 className="text-xl font-serif font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Support Center
          </h1>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-1 bg-slate-100/50 p-1 rounded-xl">
            {(['All', 'Unread', 'Open', 'Resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 px-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  filter === f 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f === 'Unread' ? `New (${getUnreadCount()})` : f}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleSelectTicket(ticket)}
              className={`p-5 border-b border-slate-50 cursor-pointer transition-all relative ${
                selectedTicket?.id === ticket.id 
                  ? 'bg-primary/5' 
                  : 'hover:bg-slate-50/80'
              }`}
            >
              {selectedTicket?.id === ticket.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-transform group-hover:scale-105 ${
                    ticket.userType === 'Premium' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ticket.userAvatar}
                  </div>
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getPriorityColor(ticket.priority)}`} />
                  {ticket.status === 'Unread' && (
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full border-2 border-white animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{ticket.id}</span>
                    <span className="text-[10px] font-medium text-slate-400">{ticket.createdAt}</span>
                  </div>
                  <p className={`text-sm font-bold truncate mb-0.5 ${ticket.status === 'Unread' ? 'text-slate-900' : 'text-slate-700'}`}>
                    {ticket.subject}
                  </p>
                  <p className="text-xs font-medium text-slate-400 truncate">{ticket.userName}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredTickets.length === 0 && (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400">No tickets found</p>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Conversation Thread */}
      <div className="flex-1 flex flex-col bg-white min-w-0 shadow-inner">
        {selectedTicket ? (
          <>
            {/* Conversation Header */}
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="lg:hidden p-2.5 hover:bg-slate-100 rounded-2xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-medium text-slate-500">{selectedTicket.userName}</span>
                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{selectedTicket.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedTicket.status)}
                <button className="p-2.5 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 custom-scrollbar">
              {selectedTicket.messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`flex gap-4 max-w-[80%] ${message.sender === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${
                      message.sender === 'admin' 
                        ? 'bg-primary text-white' 
                        : 'bg-white text-slate-600'
                    }`}>
                      {message.sender === 'admin' ? 'AD' : selectedTicket.userAvatar}
                    </div>
                    <div className={`space-y-1 ${message.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-3xl px-6 py-4 shadow-sm ${
                        message.sender === 'admin' 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
                      </div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest px-1 ${message.sender === 'admin' ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-8 border-t border-slate-100 bg-white shrink-0">
              {selectedTicket.status !== 'Closed' && selectedTicket.status !== 'Resolved' ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-[32px] border border-slate-100 p-4 transition-all focus-within:ring-2 focus-within:ring-primary/10 focus-within:bg-white focus-within:border-primary/20">
                    <div className="flex items-center gap-1 mb-3 pb-3 border-b border-slate-200/50">
                      <button className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 hover:text-primary"><Bold className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 hover:text-primary"><Italic className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 hover:text-primary"><Code className="w-4 h-4" /></button>
                      <div className="w-px h-4 bg-slate-300 mx-2" />
                      <button className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 hover:text-primary"><Paperclip className="w-4 h-4" /></button>
                      <div className="relative">
                        <button 
                          onClick={() => setShowCanned(!showCanned)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-white rounded-xl transition-all text-xs font-bold text-slate-600"
                        >
                          <FileText className="w-4 h-4 text-primary" />
                          <span>TEMPLATES</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {showCanned && (
                          <div className="absolute bottom-full left-0 mb-4 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                            <div className="p-4 bg-slate-50 border-b border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canned Responses</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                              {CANNED_RESPONSES.map((response) => (
                                <button
                                  key={response.id}
                                  onClick={() => handleCannedResponse(response)}
                                  className="w-full px-5 py-4 text-left hover:bg-primary/5 transition-colors border-b border-slate-50 last:border-0"
                                >
                                  <p className="text-sm font-bold text-slate-800 mb-1">{response.title}</p>
                                  <p className="text-xs text-slate-500 line-clamp-1">{response.content}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your professional response here..."
                      className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 resize-none text-sm font-medium text-slate-700 placeholder:text-slate-400 custom-scrollbar"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <Button variant="ghost" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50" leftIcon={Trash2}>Discard</Button>
                    <div className="flex gap-3">
                      <Button variant="outline" className="rounded-2xl border-slate-200" onClick={handleResolveTicket}>Mark Resolved</Button>
                      <Button 
                        className="rounded-2xl px-8 shadow-lg shadow-primary/20" 
                        leftIcon={Send}
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sending}
                        isLoading={sending}
                      >
                        Send Message
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                      This ticket is marked as <span className="text-emerald-600 uppercase">{selectedTicket.status}</span>.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={handleResolveTicket}>Reopen Ticket</Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-20">
            <div className="max-w-md text-center">
              <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center mx-auto mb-8 animate-bounce duration-[3000ms]">
                <Headphones className="w-16 h-16 text-slate-200" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 mb-4">Select a Conversation</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Choose a ticket from the list to start assisting our users. Professional support leads to happy users!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Column 3: User Context */}
      {selectedTicket && (
        <div className="w-80 bg-[#fdfdfd] border-l border-slate-100 p-8 shrink-0 overflow-y-auto hidden xl:block custom-scrollbar">
          {/* User Profile */}
          <div className="text-center pb-8 border-b border-slate-50">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-[32px] bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-600 shadow-sm">
                {selectedTicket.userAvatar}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{selectedTicket.userName}</h3>
            <p className="text-sm font-medium text-slate-400 mb-4">{selectedTicket.userEmail}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant={selectedTicket.userType === 'Premium' ? 'warning' : 'secondary'} className="rounded-lg py-1 px-3">
                {selectedTicket.userType} Plan
              </Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 rounded-lg py-1 px-3">
                #{selectedTicket.id}
              </Badge>
            </div>
          </div>

          {/* History */}
          <div className="py-8 border-b border-slate-50">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4" /> RECENT ACTIVITY
              </h4>
            </div>
            <div className="space-y-3">
              {userHistory.length > 0 ? (
                userHistory.map((history) => (
                  <div key={history.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary/20 transition-all cursor-pointer group">
                    <p className="text-xs font-bold text-slate-700 truncate mb-2 group-hover:text-primary transition-colors">{history.subject}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">{history.date}</span>
                      <div className={`w-2 h-2 rounded-full ${history.status === 'Resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-300">NO HISTORY FOUND</p>
                </div>
              )}
            </div>
          </div>

          {/* System Details */}
          <div className="py-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> SESSION DETAILS
            </h4>
            <div className="space-y-5">
              {[
                { icon: Monitor, label: 'Browser', value: selectedTicket.browser },
                { icon: Globe, label: 'Operating System', value: selectedTicket.os },
                { icon: HardDrive, label: 'IP Address', value: selectedTicket.ip }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                    <p className="text-sm font-bold text-slate-700">{item.value || 'Unknown'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="pt-8 space-y-3">
            <Button variant="primary" className="w-full rounded-2xl shadow-md" size="sm" leftIcon={Mail}>Send Direct Email</Button>
            <Button variant="outline" className="w-full rounded-2xl border-slate-200" size="sm" leftIcon={Phone}>Initiate Call</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportPage;