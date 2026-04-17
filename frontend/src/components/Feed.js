import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../App';
import {
  getFeed, getFollowingFeed, getAllUsers, searchUsers,
  followUser, getInbox, getConversation, sendMessage,
  getUser, getUserPosts, updateProfile, uploadProfilePic,
} from '../api/api';
import PostCard from './PostCard';
import PostFormModal from './PostFormModel';
import PeoplePanel from './PeoplePanel';
import ChatPanel from './ChatPanel';
import CommentsSidebar from './CommentSidebar';
import Avatar from './ui/Avatar';
import Spinner from './ui/Spinner';
import EmptyState from './ui/EmptySlate';
import {
  FiPlus, FiRefreshCw, FiX, FiCamera, FiEdit2, FiCheck,
  FiMapPin, FiLink, FiPhone, FiMessageCircle,
} from 'react-icons/fi';

export default function Feed() {
  const { user, login } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts]     = useState([]);
  const [tab, setTab]         = useState('all');
  const [loading, setLoading] = useState(true);
  const [postModalOpen, setPostModalOpen] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState(null);

  const [showPeople, setShowPeople]       = useState(false);
  const [people, setPeople]               = useState([]);
  const [peopleSearch, setPeopleSearch]   = useState('');
  const [peopleLoading, setPeopleLoading] = useState(false);
  const searchDebounce = useRef(null);

  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarView, setSidebarView]           = useState(null);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [inbox, setInbox]                       = useState([]);
  const [messages, setMessages]                 = useState([]);
  const [chatText, setChatText]                 = useState('');
  const [chatLoading, setChatLoading]           = useState(false);
  const [selectedProfile, setSelectedProfile]   = useState(null);
  const [profileLoading, setProfileLoading]     = useState(false);
  const messagesBottomRef = useRef(null);

  useEffect(() => {
    const chatParam    = searchParams.get('chat');
    const peopleParam  = searchParams.get('people');
    const profileParam = searchParams.get('profile');

    if (peopleParam === 'open') {
      setSidebarOpen(false);
      setCommentsOpen(false);
      setShowPeople(true);
      clearParam('people');
    } else if (chatParam === 'open') {
      openChatSidebar();
      clearParam('chat');
    } else if (chatParam && !isNaN(chatParam)) {
      getUser(parseInt(chatParam)).then(res => openChatWithUser(res.data));
      clearParam('chat');
    } else if (profileParam && !isNaN(profileParam)) {
      openProfileSidebar(parseInt(profileParam));
      clearParam('profile');
    }
  }, [searchParams]);

  const clearParam = (key) => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete(key);
      return n;
    });
  };

  const loadPeople = async () => {
    setPeopleLoading(true);
    try {
      const res = await getAllUsers();
      setPeople(res.data.filter(u => u.id !== user?.id));
    } finally {
      setPeopleLoading(false);
    }
  };

  useEffect(() => {
    if (showPeople && people.length === 0) loadPeople();
  }, [showPeople]);

  const closePeople = () => setShowPeople(false);

  const handlePeopleSearch = q => {
    setPeopleSearch(q);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      if (!q.trim()) { loadPeople(); return; }
      setPeopleLoading(true);
      try {
        const res = await searchUsers(q);
        setPeople(res.data.filter(u => u.id !== user?.id));
      } finally {
        setPeopleLoading(false);
      }
    }, 350);
  };

  const handleFollowPerson = async (targetId) => {
    const res = await followUser(targetId);
    setPeople(prev =>
      prev.map(u => u.id === targetId
        ? {
            ...u,
            isFollowing:    res.data.following,
            followersCount: res.data.following ? u.followersCount + 1 : u.followersCount - 1,
          }
        : u
      )
    );
    if (selectedProfile?.id === targetId) {
      setSelectedProfile(prev => prev ? {
        ...prev,
        isFollowing:    res.data.following,
        followersCount: res.data.following ? prev.followersCount + 1 : prev.followersCount - 1,
      } : prev);
    }
  };

  const openComments = post => {
    setShowPeople(false);
    setSidebarOpen(false);
    setCommentsPost(post);
    setCommentsOpen(true);
  };

  const handleCommentCountChange = (postId, delta) => {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + delta } : p)
    );
  };

  useEffect(() => {
    if (sidebarView === 'chat' && sidebarOpen)
      getInbox().then(r => setInbox(r.data));
  }, [sidebarView, sidebarOpen]);

  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChatSidebar = async () => {
    setShowPeople(false);
    setCommentsOpen(false);
    setSidebarView('chat');
    setSidebarOpen(true);
    setChatText('');
    setSelectedChatUser(null);
    getInbox().then(r => setInbox(r.data));
  };

  const openChatWithUser = async chatUser => {
    setShowPeople(false);
    setCommentsOpen(false);
    setSelectedChatUser(chatUser);
    setSidebarView('chat');
    setSidebarOpen(true);
    setChatText('');
    setChatLoading(true);
    try {
      const res = await getConversation(user.id, chatUser.id);
      setMessages(res.data);
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async e => {
    e.preventDefault();
    if (!chatText.trim() || !selectedChatUser) return;
    const res = await sendMessage(user.id, selectedChatUser.id, chatText);
    setMessages(prev => [...prev, res.data]);
    setChatText('');
    if (!inbox.find(u => u.id === selectedChatUser.id))
      setInbox(prev => [selectedChatUser, ...prev]);
  };

  const openProfileSidebar = async userId => {
    setShowPeople(false);
    setCommentsOpen(false);
    setProfileLoading(true);
    setSidebarView('profile');
    setSidebarOpen(true);
    setSelectedProfile(null);
    try {
      const [uRes, pRes] = await Promise.all([getUser(userId), getUserPosts(userId)]);
      setSelectedProfile({ ...uRes.data, posts: pRes.data });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileFollow = async profileId => {
    const res = await followUser(profileId);
    setSelectedProfile(prev => prev ? {
      ...prev,
      isFollowing:    res.data.following,
      followersCount: res.data.following ? prev.followersCount + 1 : prev.followersCount - 1,
    } : prev);
    setPeople(prev =>
      prev.map(u => u.id === profileId
        ? {
            ...u,
            isFollowing:    res.data.following,
            followersCount: res.data.following ? u.followersCount + 1 : u.followersCount - 1,
          }
        : u
      )
    );
  };

  const handleSaveProfile = async (editData) => {
    const res = await updateProfile(user.id, editData);
    const newUrl = res.data.profileImageUrl || selectedProfile?.profileImageUrl;
    setSelectedProfile(prev => prev ? { ...prev, ...editData, profileImageUrl: newUrl } : prev);
    login({ ...user, ...editData, profileImageUrl: newUrl });
  };

  const handleProfileAvatarChange = async (file) => {
    const res = await uploadProfilePic(user.id, file);
    const newUrl = res.data.profileImageUrl;
    setSelectedProfile(prev => prev ? { ...prev, profileImageUrl: newUrl } : prev);
    login({ ...user, profileImageUrl: newUrl });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedChatUser(null);
    setMessages([]);
    setSelectedProfile(null);
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = tab === 'all' ? await getFeed() : await getFollowingFeed();
      setPosts(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [tab]);

  const onCreated = post => setPosts(prev => [post, ...prev]);
  const onDeleted = id   => setPosts(prev => prev.filter(p => p.id !== id));

  const tabMeta = {
    all:       { description: 'All posts from everyone on Nexus — photos, videos, and more.' },
    following: { description: 'The latest from people you follow. Follow more people to fill this up.' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-14 z-10">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-center justify-between pt-4 pb-0">
            <h2 className="text-lg font-bold text-gray-900">Feed</h2>
            <button
              onClick={loadPosts}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <FiRefreshCw size={14} />
            </button>
          </div>

          <div className="flex gap-1 mt-2">
            {[
              { key: 'all',       label: 'All Posts' },
              { key: 'following', label: 'Following' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                  tab === t.key
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!loading && (
        <div className="max-w-5xl mx-auto px-5 pt-4 pb-0">
          <p className="text-xs text-gray-400">{tabMeta[tab].description}</p>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-5 py-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            emoji={tab === 'following' ? '👥' : '📋'}
            title={tab === 'following' ? 'Nothing from people you follow yet' : 'No posts yet'}
            description={
              tab === 'following'
                ? 'Follow some people to see their posts here.'
                : 'Be the first to share something!'
            }
            action={
              <button
                onClick={() => setPostModalOpen(true)}
                className="text-sm font-medium text-blue-500 hover:underline"
              >
                Create a post →
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                onDeleted={onDeleted}
                onOpenComments={openComments}
              />
            ))}
          </div>
        )}
      </div>

      <PeoplePanel
        showPeople={showPeople}
        closePeople={closePeople}
        people={people}
        peopleLoading={peopleLoading}
        peopleSearch={peopleSearch}
        handlePeopleSearch={handlePeopleSearch}
        handleFollowPerson={handleFollowPerson}
        openProfileSidebar={openProfileSidebar}
        openChatWithUser={u => { openChatWithUser(u); closePeople(); }}
      />

      <CommentsSidebar
        open={commentsOpen}
        post={commentsPost}
        user={user}
        onClose={() => setCommentsOpen(false)}
        onCommentCountChange={handleCommentCountChange}
      />

      <div
        onClick={closeSidebar}
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div className={`fixed top-0 right-0 z-50 h-full w-96 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-bold text-gray-900">
            {sidebarView === 'chat' ? 'Messages' : 'Profile'}
          </h3>
          <button
            onClick={closeSidebar}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <FiX size={16} />
          </button>
        </div>

        <ChatPanel
          sidebarView={sidebarView}
          selectedChatUser={selectedChatUser}
          setSelectedChatUser={setSelectedChatUser}
          inbox={inbox}
          openChatWithUser={openChatWithUser}
          chatLoading={chatLoading}
          messages={messages}
          user={user}
          sendChatMessage={sendChatMessage}
          chatText={chatText}
          setChatText={setChatText}
          messagesBottomRef={messagesBottomRef}
          openProfileSidebar={id => {
            closeSidebar();
            setTimeout(() => openProfileSidebar(id), 350);
          }}
        />

        {sidebarView === 'profile' && (
          <div className="flex-1 overflow-y-auto">
            {profileLoading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : selectedProfile ? (
              <ProfileSidebarContent
                profile={selectedProfile}
                currentUser={user}
                onFollow={() => handleProfileFollow(selectedProfile.id)}
                onChat={() => {
                  closeSidebar();
                  setTimeout(() => openChatWithUser(selectedProfile), 350);
                }}
                onOpenComments={openComments}
                onPostDeleted={pid =>
                  setSelectedProfile(prev => prev ? ({
                    ...prev,
                    posts: prev.posts.filter(p => p.id !== pid),
                  }) : prev)
                }
                onSave={handleSaveProfile}
                onAvatarChange={handleProfileAvatarChange}
              />
            ) : null}
          </div>
        )}
      </div>

      <PostFormModal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onCreated={onCreated}
      />

      <button
        onClick={() => setPostModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-xl hover:bg-gray-700 transition hover:scale-105 active:scale-95 z-30"
        title="New post"
      >
        <FiPlus size={22} />
      </button>
    </div>
  );
}

function ProfileSidebarContent({
  profile, currentUser, onFollow, onChat, onOpenComments, onPostDeleted,
  onSave, onAvatarChange,
}) {
  const isOwn = profile.id === currentUser?.id;
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: profile.fullName || '',
    bio:      profile.bio      || '',
    location: profile.location || '',
    website:  profile.website  || '',
    phone:    profile.phone    || '',
  });
  const [saving, setSaving]                   = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setEditForm({
      fullName: profile.fullName || '',
      bio:      profile.bio      || '',
      location: profile.location || '',
      website:  profile.website  || '',
      phone:    profile.phone    || '',
    });
  }, [profile.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editForm);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      await onAvatarChange(file);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="bg-white min-h-full">
      <div className="relative">
        <div className="h-24 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800" />

        {isOwn && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-medium rounded-lg hover:bg-black/50 transition"
          >
            <FiEdit2 size={11} /> Edit profile
          </button>
        )}

        <div className="absolute bottom-0 translate-y-1/2 left-5">
          <div className="relative">
            <Avatar user={profile} size={72} className="border-4 border-white shadow" />
            {isOwn && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition disabled:opacity-60"
                  title="Change photo"
                >
                  {avatarUploading
                    ? <Spinner size="sm" className="border-white border-t-transparent" />
                    : <FiCamera size={16} className="text-white" />
                  }
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pt-12 px-5 pb-4">
        {editMode ? (
          <div className="space-y-3">
            <SidebarField
              label="Full Name"
              value={editForm.fullName}
              onChange={v => setEditForm(f => ({ ...f, fullName: v }))}
            />
            <SidebarField
              label="Bio"
              value={editForm.bio}
              onChange={v => setEditForm(f => ({ ...f, bio: v }))}
              multiline
              placeholder="Tell the world about yourself…"
            />
            <SidebarField
              label="Location"
              value={editForm.location}
              onChange={v => setEditForm(f => ({ ...f, location: v }))}
              icon={FiMapPin}
              placeholder="City, Country"
            />
            <SidebarField
              label="Website"
              value={editForm.website}
              onChange={v => setEditForm(f => ({ ...f, website: v }))}
              icon={FiLink}
              placeholder="https://…"
            />
            <SidebarField
              label="Phone"
              value={editForm.phone}
              onChange={v => setEditForm(f => ({ ...f, phone: v }))}
              icon={FiPhone}
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditMode(false)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                <FiX size={13} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition disabled:opacity-50"
              >
                {saving
                  ? <Spinner size="sm" className="border-white border-t-transparent" />
                  : <FiCheck size={13} />
                }
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900">{profile.fullName}</h2>
            <p className="text-sm text-gray-400">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>
            )}
            <div className="flex flex-col gap-1 mt-2">
              {profile.location && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <FiMapPin size={11} /> {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
                >
                  <FiLink size={11} /> {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <FiPhone size={11} /> {profile.phone}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-around text-center py-4 border-y border-gray-100 mx-5 mb-4">
        {[
          ['Followers', profile.followersCount],
          ['Following', profile.followingCount],
          ['Posts',     profile.posts?.length ?? 0],
        ].map(([label, val]) => (
          <div key={label}>
            <p className="font-bold text-gray-900">{val}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {!isOwn && !editMode && (
        <div className="flex gap-2 px-5 mb-5">
          <button
            onClick={onFollow}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${
              profile.isFollowing
                ? 'bg-gray-100 text-gray-900 hover:bg-red-50 hover:text-red-600'
                : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}
          >
            {profile.isFollowing ? 'Following' : 'Follow'}
          </button>
          <button
            onClick={onChat}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5"
            title="Send message"
          >
            <FiMessageCircle size={14} />
            Message
          </button>
        </div>
      )}

      <div className="border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Posts</p>
        {!profile.posts || profile.posts.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No posts yet</p>
        ) : (
          <div className="px-3 pb-6 space-y-3">
            {profile.posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDeleted={onPostDeleted}
                onOpenComments={onOpenComments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarField({ label, value, onChange, multiline = false, placeholder = '', icon: Icon }) {
  const base = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition';
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className={`${base} resize-none`}
          />
        ) : (
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${base} ${Icon ? 'pl-8' : ''}`}
          />
        )}
      </div>
    </div>
  );
}