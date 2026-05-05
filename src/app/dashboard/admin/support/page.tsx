"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Ticket {
  _id: string;
  subject: string;
  message: string;
  status: "New" | "In Progress" | "Resolved";
  isRead: boolean;
  createdAt: string;
  adminReply?: string;
  adminReplyAt?: string;
  internalNote?: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [sending, setSending] = useState(false);

  const [searchEmail, setSearchEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (searchEmail) params.set("email", searchEmail);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const res = await fetch(`/api/admin/support?${params.toString()}`);
    const data = await res.json();
    setTickets(data.tickets || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, searchEmail, statusFilter, startDate, endDate]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleSelectTicket = async (ticket: Ticket) => {
    try {
      const res = await fetch(`/api/admin/support/${ticket._id}`);
      const data = await res.json();
      
      if (data.ticket) {
        setSelectedTicket(data.ticket);
        setReply("");
        setInternalNote(data.ticket.internalNote || "");
      } else {
        console.error("Failed to fetch ticket details:", data.error);
        alert(data.error || "Failed to load ticket details");
      }
    } catch (error) {
      console.error("Error selecting ticket:", error);
      alert("An error occurred while loading the ticket");
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    setSending(true);
    const res = await fetch(`/api/admin/support/${selectedTicket._id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    if (res.ok) {
      setReply("");
      fetchTickets();
      handleSelectTicket(selectedTicket);
    }
    setSending(false);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    await fetch(`/api/admin/support/${selectedTicket._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTickets();
    handleSelectTicket(selectedTicket);
  };

  const handleSaveNote = async () => {
    if (!selectedTicket) return;
    await fetch(`/api/admin/support/${selectedTicket._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalNote }),
    });
    fetchTickets();
    handleSelectTicket(selectedTicket);
  };

  const statusColor: Record<string, string> = {
    New: "bg-red-500",
    "In Progress": "bg-blue-500",
    Resolved: "bg-green-500",
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 font-sans">
      {/* Left Panel - Ticket List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Support Tickets</h2>

          <input
            type="text"
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No tickets found</div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => handleSelectTicket(ticket)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedTicket?._id === ticket._id ? "bg-blue-50" : ""
                } ${!ticket.isRead ? "font-medium" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-900 truncate">
                    {ticket.user.name}
                  </span>
                  {!ticket.isRead && (
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 ml-2" />
                  )}
                </div>
                <div className="text-sm text-gray-600 truncate mb-1">
                  {ticket.subject}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${statusColor[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {Math.max(1, Math.ceil(total / 20))}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Right Panel - Ticket Detail */}
      <div className="flex-1 flex flex-col">
        {selectedTicket ? (
          <>
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedTicket.subject}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm text-white ${statusColor[selectedTicket.status]}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span><strong>From:</strong> {selectedTicket.user.name}</span>
                <span>{selectedTicket.user.email}</span>
                <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Original Message</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {selectedTicket.adminReply && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Reply Sent</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTicket.adminReply}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Sent: {new Date(selectedTicket.adminReplyAt!).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reply to {selectedTicket.user.email}
                </label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Internal Note (admin only)
                </label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add internal notes here..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none bg-gray-50"
                />
                <button
                  onClick={handleSaveNote}
                  className="mt-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Save Note
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-white flex items-center gap-3">
              {selectedTicket.status !== "In Progress" && (
                <button
                  onClick={() => handleUpdateStatus("In Progress")}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                >
                  Mark In Progress
                </button>
              )}
              {selectedTicket.status !== "Resolved" && (
                <button
                  onClick={() => handleUpdateStatus("Resolved")}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                >
                  Mark Resolved
                </button>
              )}
              <button
                onClick={handleSendReply}
                disabled={sending || !reply.trim()}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 ml-auto"
              >
                {sending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a ticket to view details
          </div>
        )}
      </div>
    </div>
  );
}
