import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Send, Mail, ArrowLeft } from 'lucide-react';

function timeAgo(date) {
  const diff = (new Date() - new Date(date)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendToEmail, setSendToEmail] = useState(false);
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchConversations = () => {
    api.get('/messages/conversations').then(res => setConversations(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchConversations();
    api.get('/users').then(res => setUsers(res.data.filter(u => u.id !== user?.id))).catch(() => {});
  }, [user]);

  // Poll for new messages when in a chat
  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = () => {
      api.get(`/messages/${activeChat.id}`).then(res => setMessages(res.data)).catch(() => {});
    };
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [activeChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat) return;
    setSending(true);
    try {
      await api.post('/messages', { receiverId: activeChat.id, content: newMsg, sendToEmail });
      setNewMsg('');
      setSendToEmail(false);
      // Refresh messages immediately
      const res = await api.get(`/messages/${activeChat.id}`);
      setMessages(res.data);
      fetchConversations();
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const startNewChat = (u) => {
    setActiveChat(u);
    setShowNewChat(false);
  };

  const unreadTotal = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Sidebar — conversation list */}
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-[#633806]">Messages</h2>
          <button onClick={() => setShowNewChat(!showNewChat)}
            className="text-xs bg-[#633806] text-white px-3 py-1.5 rounded-full font-semibold hover:bg-[#4a2800]">
            + New
          </button>
        </div>

        {/* New chat user picker */}
        {showNewChat && (
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Start a conversation with:</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {users.map(u => (
                <button key={u.id} onClick={() => startNewChat(u)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-[#1DB8A8]/10 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-[#1DB8A8]/20 flex items-center justify-center">
                    <span className="text-[#1DB8A8] text-xs font-bold">{u.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-[#633806] font-medium text-xs">{u.name}</p>
                    <p className="text-[10px] text-gray-400">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !showNewChat && (
            <p className="text-sm text-gray-400 p-4 text-center">No conversations yet</p>
          )}
          {conversations.map(c => (
            <button key={c.user.id} onClick={() => setActiveChat(c.user)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                activeChat?.id === c.user.id ? 'bg-[#1DB8A8]/5' : ''
              }`}>
              <div className="w-9 h-9 rounded-full bg-[#1DB8A8]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#1DB8A8] font-bold text-sm">{c.user.name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#633806] truncate">{c.user.name}</p>
                  <span className="text-[10px] text-gray-400">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        {activeChat ? (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <button onClick={() => setActiveChat(null)} className="md:hidden p-1">
                <ArrowLeft size={18} className="text-gray-400" />
              </button>
              <div className="w-8 h-8 rounded-full bg-[#1DB8A8]/20 flex items-center justify-center">
                <span className="text-[#1DB8A8] font-bold text-sm">{activeChat.name?.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#633806]">{activeChat.name}</p>
                <p className="text-[10px] text-gray-400">{activeChat.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {messages.map(m => {
                const isMine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-[#633806] text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-[#1A1A1A] rounded-bl-md'
                    }`}>
                      <p className="leading-relaxed">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-white/50' : 'text-gray-400'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={sendToEmail} onChange={e => setSendToEmail(e.target.checked)}
                    className="rounded border-gray-300" />
                  <Mail size={12} /> Also send to email
                </label>
              </div>
              <div className="flex gap-2">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  placeholder="Type a message..." autoFocus
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB8A8]" />
                <button type="submit" disabled={sending || !newMsg.trim()}
                  className="bg-[#633806] text-white px-4 py-2.5 rounded-xl hover:bg-[#4a2800] disabled:opacity-50">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation or start a new one
          </div>
        )}
      </div>
    </div>
  );
}
