import React, { useState, useEffect, useRef } from 'react';
import { createPost } from '../api/api';
import { FiX, FiPaperclip, FiImage, FiSend } from 'react-icons/fi';

export default function PostFormModal({ open, onClose, onCreated }) {
  const [content,  setContent]  = useState('');
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => textRef.current?.focus(), 100);
    } else {
      setContent('');
      setFile(null);
      setPreview(null);
    }
  }, [open]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      if (content) fd.append('content', content);
      if (file)    fd.append('file', file);
      const res = await createPost(fd);
      onCreated?.(res.data);
      onClose();
    } catch {
      alert('Failed to post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
          style={{ animation: 'modalIn 0.18s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Create Post</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <FiX size={17} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={submit} className="p-5 space-y-4">
            <textarea
              ref={textRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
            />

            {preview && (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={preview} alt="preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
                >
                  <FiX size={13} />
                </button>
              </div>
            )}

            {file && !preview && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-sm">
                <FiPaperclip size={14} className="shrink-0" />
                <span className="flex-1 truncate font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-blue-400 hover:text-blue-700 transition shrink-0"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition">
                <FiImage size={15} />
                <span>Attach</span>
                <input
                  type="file"
                  onChange={handleFile}
                  className="hidden"
                  accept="image/*,video/*,.pdf"
                />
              </label>

              <button
                type="submit"
                disabled={loading || (!content.trim() && !file)}
                className="flex items-center gap-2 bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Posting…</>
                  : <><FiSend size={14} />Post</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}