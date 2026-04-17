import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getComments, addComment, deleteComment } from '../api/api';
import Avatar from './ui/Avatar';
import Spinner from './ui/Spinner';
import EmptyState from './ui/EmptySlate';
import { FiX, FiSend, FiTrash2 } from 'react-icons/fi';

export default function CommentSidebar({ open, post, user, onClose, onCommentCountChange }) {
  const [comments,   setComments]   = useState([]);
  const [text,       setText]       = useState('');
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !post) return;
    setLoading(true);
    setComments([]);
    getComments(post.id)
      .then(r => setComments(r.data))
      .finally(() => setLoading(false));
  }, [open, post]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await addComment(post.id, text);
      setComments(prev => [...prev, res.data]);
      setText('');
      onCommentCountChange?.(post.id, 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    await deleteComment(post.id, commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
    onCommentCountChange?.(post.id, -1);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 z-50 h-full w-[26rem] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">Comments</h3>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Original post preview */}
        {post && (
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <Avatar user={post.user} size={22} />
              <span className="text-xs font-semibold text-gray-700">{post.user.fullName}</span>
            </div>
            {post.content && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pl-7">
                {post.content}
              </p>
            )}
          </div>
        )}

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="md" /></div>
          ) : comments.length === 0 ? (
            <EmptyState
              emoji="💬"
              title="No comments yet"
              description="Be the first to comment!"
              compact
            />
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex items-start gap-3 group">
                <Link to={`/profile/${c.user.id}`} className="shrink-0" onClick={onClose}>
                  <Avatar user={c.user} size={32} />
                </Link>

                <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/profile/${c.user.id}`}
                        className="text-xs font-semibold text-gray-900 hover:text-blue-600 transition"
                        onClick={onClose}
                      >
                        {c.user.username}
                      </Link>
                      {c.createdAt && (
                        <span className="text-xs text-gray-300 ml-2">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {user?.id === c.user.id && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition shrink-0 mt-0.5"
                      >
                        <FiTrash2 size={11} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={submit}
          className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0"
        >
          <Avatar user={user} size={30} className="flex-shrink-0" />
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-gray-700 transition disabled:opacity-40 shrink-0"
          >
            <FiSend size={14} />
          </button>
        </form>
      </div>
    </>
  );
}