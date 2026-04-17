import Avatar from './ui/Avatar';
import Spinner from './ui/Spinner';
import EmptyState from './ui/EmptySlate';
import { FiArrowLeft, FiSend, FiExternalLink } from 'react-icons/fi';

export default function ChatPanel({
  sidebarView,
  selectedChatUser,
  setSelectedChatUser,
  inbox,
  openChatWithUser,
  chatLoading,
  messages,
  user,
  sendChatMessage,
  chatText,
  setChatText,
  messagesBottomRef,
  openProfileSidebar,
}) {
  if (sidebarView !== 'chat') return null;

  // ── Inbox list ──────────────────────────────────────────────────────
  if (!selectedChatUser) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-2.5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Recent conversations
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {inbox.length === 0 ? (
            <EmptyState
              emoji="💬"
              title="No conversations yet"
              description="Find people and start chatting."
              compact
            />
          ) : (
            inbox.map(u => (
              <button
                key={u.id}
                onClick={() => openChatWithUser(u)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition text-left group"
              >
                <div className="relative shrink-0">
                  <Avatar user={u} size={40} />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.fullName}</p>
                  <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                </div>
                <span className="text-gray-300 group-hover:text-gray-500 transition text-base">›</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // ── Active conversation ─────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <button
          onClick={() => setSelectedChatUser(null)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0"
        >
          <FiArrowLeft size={15} />
        </button>

        <Avatar user={selectedChatUser} size={34} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {selectedChatUser.fullName}
          </p>
          <p className="text-xs text-gray-400">@{selectedChatUser.username}</p>
        </div>

        {openProfileSidebar && (
          <button
            onClick={() => openProfileSidebar(selectedChatUser.id)}
            title="View profile"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition shrink-0"
          >
            <FiExternalLink size={14} />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 bg-gray-50">
        {chatLoading ? (
          <div className="flex justify-center py-12"><Spinner size="md" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Avatar user={selectedChatUser} size={52} />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">{selectedChatUser.fullName}</p>
              <p className="text-xs text-gray-400 mt-0.5">Say hello 👋</p>
            </div>
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && <Avatar user={selectedChatUser} size={22} className="mb-0.5 flex-shrink-0" />}
                <div className={`
                  px-4 py-2.5 rounded-2xl max-w-[75%] text-sm leading-relaxed
                  ${isMe
                    ? 'bg-gray-900 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                  }
                `}>
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesBottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendChatMessage}
        className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0"
      >
        <input
          value={chatText}
          onChange={e => setChatText(e.target.value)}
          placeholder="Message…"
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
        />
        <button
          type="submit"
          disabled={!chatText.trim()}
          className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <FiSend size={14} />
        </button>
      </form>
    </div>
  );
}