import React from 'react';
import Avatar from './ui/Avatar';
import Spinner from './ui/Spinner';
import EmptyState from './ui/EmptySlate';
import { FiX, FiSearch, FiMessageCircle, FiUserCheck, FiUserPlus, FiExternalLink } from 'react-icons/fi';

export default function PeoplePanel({
  showPeople,
  closePeople,
  people,
  peopleLoading,
  peopleSearch,
  handlePeopleSearch,
  handleFollowPerson,
  openProfileSidebar,
  openChatWithUser,
}) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={closePeople}
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity duration-200 ${
          showPeople ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
        showPeople ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">Find People</h3>
            {!peopleLoading && (
              <p className="text-xs text-gray-400 mt-0.5">{people.length} member{people.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          <button
            onClick={closePeople}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent transition">
            <FiSearch size={13} className="text-gray-400 shrink-0" />
            <input
              value={peopleSearch}
              onChange={e => handlePeopleSearch(e.target.value)}
              placeholder="Search by name or username…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {peopleLoading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Spinner size="md" />
              <span className="text-sm text-gray-400">Finding people…</span>
            </div>
          ) : people.length === 0 ? (
            <EmptyState
              emoji="🔍"
              title="No users found"
              description="Try a different search term."
              compact
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {people.map(u => (
                <PersonRow
                  key={u.id}
                  u={u}
                  onViewProfile={() => openProfileSidebar(u.id)}
                  onFollow={() => handleFollowPerson(u.id)}
                  onMessage={() => openChatWithUser(u)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PersonRow({ u, onViewProfile, onFollow, onMessage }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition group">
      <button onClick={onViewProfile} className="shrink-0">
        <Avatar user={u} size={44} />
      </button>

      <div className="flex-1 min-w-0">
        <button onClick={onViewProfile} className="text-left w-full">
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight hover:text-blue-600 transition">
            {u.fullName}
          </p>
          <p className="text-xs text-gray-400 truncate">@{u.username}</p>
        </button>
        {u.bio && (
          <p className="text-xs text-gray-500 truncate mt-0.5 leading-tight">{u.bio}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          <span className="font-semibold text-gray-600">{u.followersCount ?? 0}</span> followers
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onMessage}
          title="Send message"
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
        >
          <FiMessageCircle size={15} />
        </button>

        <button
          onClick={onViewProfile}
          title="View profile"
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          <FiExternalLink size={13} />
        </button>

        <button
          onClick={onFollow}
          title={u.isFollowing ? 'Unfollow' : 'Follow'}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
            u.isFollowing
              ? 'text-emerald-600 bg-emerald-50 hover:bg-red-50 hover:text-red-500'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {u.isFollowing ? <FiUserCheck size={14} /> : <FiUserPlus size={14} />}
        </button>
      </div>
    </div>
  );
}