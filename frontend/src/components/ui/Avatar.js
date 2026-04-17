import React, { useState } from 'react';

const GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-violet-400 to-violet-600',
  'from-emerald-400 to-emerald-600',
  'from-orange-400 to-orange-500',
  'from-pink-400 to-pink-600',
  'from-teal-400 to-teal-600',
  'from-indigo-400 to-indigo-600',
  'from-rose-400 to-rose-500',
];

function gradientFor(user) {
  return GRADIENTS[(user?.id || 0) % GRADIENTS.length];
}

function initials(user) {
  if (!user?.fullName) return '?';
  return user.fullName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function textSizeFor(size) {
  if (size <= 24) return 'text-[9px]';
  if (size <= 32) return 'text-xs';
  if (size <= 48) return 'text-sm';
  if (size <= 64) return 'text-base';
  return 'text-xl';
}

export default function Avatar({ user, size = 40, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = user?.profileImageUrl && !imgError;
  const style = { width: size, height: size, minWidth: size, minHeight: size };

  if (hasImage) {
    return (
      <img
        src={user.profileImageUrl}
        alt={user?.fullName || 'avatar'}
        style={style}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-gradient-to-br ${gradientFor(user)} flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <span className={`font-bold text-white select-none ${textSizeFor(size)}`}>
        {initials(user)}
      </span>
    </div>
  );
}