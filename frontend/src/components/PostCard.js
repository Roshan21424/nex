import React, { useState, useContext, memo } from 'react';
import { Link } from 'react-router-dom';
import { likePost, deletePost } from '../api/api';
import { AuthContext } from '../App';
import Avatar from './ui/Avatar';
import { FiHeart, FiMessageCircle, FiShare2, FiTrash2 } from 'react-icons/fi';
import { AiFillHeart } from 'react-icons/ai';

const PostCard = memo(function PostCard({ post, onDeleted, onOpenComments }) {
  const { user } = useContext(AuthContext);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const [likeAnim, setLikeAnim]   = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 300);
    try {
      const res = await likePost(post.id);
      setLikeCount(res.data.likeCount);
      setLikedByMe(res.data.liked);
    } catch { /* ignore */ }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      onDeleted?.(post.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/profile/${post.user.id}`);
  };

  const isOwn = user?.id === post.user.id;
  const hasMedia = !!post.fileUrl;

  return (
    <article
      className={`
        bg-white rounded-2xl border border-gray-100 shadow-sm
        hover:shadow-md hover:border-gray-200
        transition-all duration-200 flex flex-col overflow-hidden group
        ${deleting ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* ── Media ──────────────────────────────────────────────────── */}
      {post.fileUrl && post.fileType === 'image' && (
        <div className="relative overflow-hidden">
          <img
            src={post.fileUrl}
            alt="post attachment"
            crossOrigin="anonymous"
            className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
          {/* overlay actions on image */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Actions
              isOwn={isOwn} post={post}
              likedByMe={likedByMe} likeCount={likeCount} likeAnim={likeAnim}
              onLike={handleLike} onComment={() => onOpenComments?.(post)}
              onShare={handleShare} onDelete={handleDelete}
              overlay
            />
          </div>
        </div>
      )}

      {post.fileUrl && post.fileType === 'video' && (
        <video
          src={post.fileUrl}
          controls
          className="w-full h-44 object-cover bg-gray-900"
        />
      )}

      {post.fileUrl && post.fileType === 'pdf' && (
        <a
          href={post.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 bg-red-50 border-b border-red-100 px-4 py-3 hover:bg-red-100 transition"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-xl">📄</span>
          <span className="text-sm font-medium text-red-700 flex-1 truncate">PDF Document</span>
          <span className="text-xs text-red-400 shrink-0">Open ↗</span>
        </a>
      )}

      {post.fileUrl && post.fileType === 'other' && (
        <a
          href={post.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 bg-gray-50 border-b border-gray-100 px-4 py-3 hover:bg-gray-100 transition"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-xl">📎</span>
          <span className="text-sm font-medium text-gray-700 flex-1 truncate">Attachment</span>
          <span className="text-xs text-gray-400 shrink-0">Download ↓</span>
        </a>
      )}

      {/* ── Card body ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Author row */}
        <div className="flex items-start gap-3">
          <Link to={`/profile/${post.user.id}`} className="shrink-0" onClick={e => e.stopPropagation()}>
            <Avatar user={post.user} size={38} />
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${post.user.id}`}
              onClick={e => e.stopPropagation()}
              className="block font-semibold text-gray-900 text-sm truncate hover:text-blue-600 transition leading-tight"
            >
              {post.user.fullName}
            </Link>
            <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">
              @{post.user.username}
              {post.createdAt && (
                <span className="opacity-60"> · {new Date(post.createdAt).toLocaleDateString()}</span>
              )}
            </p>
          </div>

          {/* Actions when no image overlay */}
          {(!hasMedia || (post.fileType !== 'image' && post.fileType !== 'video')) && (
            <Actions
              isOwn={isOwn} post={post}
              likedByMe={likedByMe} likeCount={likeCount} likeAnim={likeAnim}
              onLike={handleLike} onComment={() => onOpenComments?.(post)}
              onShare={handleShare} onDelete={handleDelete}
            />
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
            {post.content}
          </p>
        )}

        {/* Inline action bar for image/video posts (below content) */}
        {hasMedia && (post.fileType === 'image' || post.fileType === 'video') && (
          <Actions
            isOwn={isOwn} post={post}
            likedByMe={likedByMe} likeCount={likeCount} likeAnim={likeAnim}
            onLike={handleLike} onComment={() => onOpenComments?.(post)}
            onShare={handleShare} onDelete={handleDelete}
            inline
          />
        )}
      </div>
    </article>
  );
});

export default PostCard;

// ── Reusable action bar ───────────────────────────────────────────────────────
function Actions({
  isOwn, post, likedByMe, likeCount, likeAnim,
  onLike, onComment, onShare, onDelete,
  overlay = false, inline = false,
}) {
  if (overlay) {
    return (
      <div className="flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
        <ActionBtn onClick={onLike} label={likeCount} overlay active={likedByMe}>
          <span className={`transition-transform duration-150 inline-flex ${likeAnim ? 'scale-125' : 'scale-100'}`}>
            {likedByMe
              ? <AiFillHeart className="text-red-400" size={14} />
              : <FiHeart size={14} className="text-white" />
            }
          </span>
        </ActionBtn>
        <ActionBtn onClick={onComment} label={post.commentCount} overlay>
          <FiMessageCircle size={14} className="text-white" />
        </ActionBtn>
        <ActionBtn onClick={onShare} overlay>
          <FiShare2 size={14} className="text-white" />
        </ActionBtn>
        {isOwn && (
          <ActionBtn onClick={onDelete} overlay danger>
            <FiTrash2 size={12} className="text-white hover:text-red-400" />
          </ActionBtn>
        )}
      </div>
    );
  }

  if (inline) {
    return (
      <div className="flex items-center gap-3 pt-1 border-t border-gray-50">
        <button onClick={onLike}
          className={`flex items-center gap-1.5 text-xs font-medium transition ${likedByMe ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
          <span className={`transition-transform duration-150 ${likeAnim ? 'scale-125' : 'scale-100'}`}>
            {likedByMe ? <AiFillHeart size={14} /> : <FiHeart size={14} />}
          </span>
          {likeCount}
        </button>
        <button onClick={onComment}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-blue-500 transition">
          <FiMessageCircle size={14} /> {post.commentCount}
        </button>
        <button onClick={onShare}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition ml-auto">
          <FiShare2 size={14} />
        </button>
        {isOwn && (
          <button onClick={onDelete}
            className="flex items-center gap-1 text-xs text-gray-300 hover:text-red-500 transition">
            <FiTrash2 size={13} />
          </button>
        )}
      </div>
    );
  }

  // default compact (no media)
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button onClick={onLike}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition ${
          likedByMe ? 'text-red-500' : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
        }`}>
        <span className={`transition-transform duration-150 ${likeAnim ? 'scale-125' : 'scale-100'}`}>
          {likedByMe ? <AiFillHeart size={14} /> : <FiHeart size={14} />}
        </span>
        <span>{likeCount}</span>
      </button>
      <button onClick={onComment}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition">
        <FiMessageCircle size={14} /> <span>{post.commentCount}</span>
      </button>
      <button onClick={onShare}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
        <FiShare2 size={14} />
      </button>
      {isOwn && (
        <button onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
          <FiTrash2 size={13} />
        </button>
      )}
    </div>
  );
}

function ActionBtn({ onClick, label, overlay, danger, active, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-1.5 py-1 rounded-full text-xs transition
        ${overlay ? 'hover:bg-white/20 text-white' : ''}
        ${danger  ? 'hover:text-red-400' : ''}
      `}
    >
      {children}
      {label !== undefined && <span>{label}</span>}
    </button>
  );
}