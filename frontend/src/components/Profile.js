import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getUser,
  getUserPosts,
  followUser,
  updateProfile,
  uploadProfilePic,
} from '../api/api';
import { AuthContext } from '../App';
import Avatar from './ui/Avatar';
import PostCard from './PostCard';
import Spinner from './ui/Spinner';
import EmptyState from './ui/EmptySlate';
import {
  FiArrowLeft,
  FiEdit2,
  FiMapPin,
  FiLink,
  FiPhone,
  FiMessageCircle,
  FiGrid,
  FiCheck,
  FiX,
  FiCamera,
  FiUserPlus,
  FiUserCheck,
} from 'react-icons/fi';
import CommentSidebar from './CommentSidebar';

export default function Profile() {
  const { id } = useParams();
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const numId = parseInt(id, 10);
  const isOwn = numId === user?.id;

  const [profile, setProfile]             = useState(null);
  const [posts, setPosts]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [editMode, setEditMode]           = useState(false);
  const [editForm, setEditForm]           = useState({});
  const [saving, setSaving]               = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [commentsOpen, setCommentsOpen]   = useState(false);
  const [commentsPost, setCommentsPost]   = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setEditMode(false);
    Promise.all([getUser(numId), getUserPosts(numId)])
      .then(([uRes, pRes]) => {
        setProfile(uRes.data);
        setPosts(pRes.data);
        setEditForm({
          fullName: uRes.data.fullName || '',
          bio:      uRes.data.bio      || '',
          location: uRes.data.location || '',
          website:  uRes.data.website  || '',
          phone:    uRes.data.phone    || '',
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const res = await followUser(profile.id);
      setProfile(prev => ({
        ...prev,
        isFollowing:    res.data.following,
        followersCount: res.data.following
          ? prev.followersCount + 1
          : prev.followersCount - 1,
      }));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile(user.id, editForm);
      const updated = { ...profile, ...res.data, ...editForm };
      setProfile(updated);
      login({ ...user, ...editForm, profileImageUrl: updated.profileImageUrl });
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const res = await uploadProfilePic(user.id, file);
      const newUrl = res.data.profileImageUrl;
      setProfile(prev => ({ ...prev, profileImageUrl: newUrl }));
      login({ ...user, profileImageUrl: newUrl });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCommentCountChange = (postId, delta) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, commentCount: (p.commentCount || 0) + delta }
          : p,
      ),
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">User not found.</p>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-500 hover:underline"
        >
          ← Back to feed
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          >
            <FiArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">
              {profile.fullName}
            </h1>
            <p className="text-xs text-gray-400">
              {posts.length} post{posts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 relative" />

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-14 mb-5">
              <div className="relative">
                <Avatar
                  user={profile}
                  size={88}
                  className="border-4 border-white shadow-md ring-1 ring-gray-100"
                />
                {isOwn && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition disabled:opacity-60"
                    >
                      {avatarUploading ? (
                        <Spinner size="sm" className="border-white border-t-transparent" />
                      ) : (
                        <FiCamera size={18} className="text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 pb-1">
                {isOwn ? (
                  editMode ? (
                    <>
                      <button
                        onClick={() => setEditMode(false)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                      >
                        <FiX size={13} /> Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition disabled:opacity-50"
                      >
                        {saving ? (
                          <Spinner size="sm" className="border-white border-t-transparent" />
                        ) : (
                          <FiCheck size={13} />
                        )}
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                    >
                      <FiEdit2 size={13} /> Edit profile
                    </button>
                  )
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition disabled:opacity-60 ${
                        profile.isFollowing
                          ? 'bg-gray-100 text-gray-900 hover:bg-red-50 hover:text-red-600'
                          : 'bg-gray-900 text-white hover:bg-gray-700'
                      }`}
                    >
                      {profile.isFollowing ? (
                        <FiUserCheck size={14} />
                      ) : (
                        <FiUserPlus size={14} />
                      )}
                      {profile.isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={() => navigate(`/?chat=${profile.id}`)}
                      className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition"
                      title="Send message"
                    >
                      <FiMessageCircle size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Full Name"
                    value={editForm.fullName}
                    onChange={v => setEditForm(f => ({ ...f, fullName: v }))}
                  />
                  <Field
                    label="Location"
                    value={editForm.location}
                    onChange={v => setEditForm(f => ({ ...f, location: v }))}
                    icon={FiMapPin}
                  />
                </div>
                <Field
                  label="Bio"
                  value={editForm.bio}
                  onChange={v => setEditForm(f => ({ ...f, bio: v }))}
                  multiline
                  placeholder="Tell the world about yourself…"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Website"
                    value={editForm.website}
                    onChange={v => setEditForm(f => ({ ...f, website: v }))}
                    icon={FiLink}
                    placeholder="https://…"
                  />
                  <Field
                    label="Phone"
                    value={editForm.phone}
                    onChange={v => setEditForm(f => ({ ...f, phone: v }))}
                    icon={FiPhone}
                  />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {profile.fullName}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm text-gray-700 mt-2.5 leading-relaxed">{profile.bio}</p>
                )}
                {(profile.location || profile.website || profile.phone) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                    {profile.location && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
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
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FiPhone size={11} /> {profile.phone}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100">
              <Stat label="Posts"     value={posts.length}           />
              <Stat label="Followers" value={profile.followersCount} />
              <Stat label="Following" value={profile.followingCount} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 px-0.5">
            <FiGrid size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Posts</span>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                emoji="📝"
                title={isOwn ? "You haven't posted yet" : 'No posts yet'}
                description={
                  isOwn
                    ? 'Share something with the world!'
                    : `${profile.fullName} hasn't shared anything yet.`
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {posts.map(p => (
                <PostCard
                  key={p.id}
                  post={p}
                  onDeleted={pid => setPosts(prev => prev.filter(x => x.id !== pid))}
                  onOpenComments={post => {
                    setCommentsPost(post);
                    setCommentsOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CommentSidebar
        open={commentsOpen}
        post={commentsPost}
        user={user}
        onClose={() => setCommentsOpen(false)}
        onCommentCountChange={handleCommentCountChange}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-gray-900 leading-tight">{value ?? 0}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function Field({ label, value, onChange, multiline = false, placeholder = '', icon: Icon }) {
  const base =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition bg-gray-50';
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
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