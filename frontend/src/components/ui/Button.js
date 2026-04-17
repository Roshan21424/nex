import React from 'react';

const VARIANTS = {
  primary:   'bg-gray-900 text-white hover:bg-gray-800 active:bg-black focus:ring-gray-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-300',
  ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300',
  outline:   'border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300',
  danger:    'text-red-600 hover:bg-red-50 focus:ring-red-300',
  blue:      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300',
};

const SIZES = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1',
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  icon: Icon,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 cursor-pointer select-none
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `.trim()}
      {...props}
    >
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : Icon && <Icon size={13} />
      }
      {children}
    </button>
  );
}

const ICON_SIZES   = { xs: 'w-6 h-6', sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-10 h-10' };
const ICON_STROKES = { xs: 13, sm: 14, md: 16, lg: 18 };

export function IconButton({ icon: Icon, size = 'md', variant = 'ghost', className = '', ...props }) {
  return (
    <button
      className={`
        ${ICON_SIZES[size]} rounded-full flex items-center justify-center
        transition-all duration-150 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${className}
      `.trim()}
      {...props}
    >
      <Icon size={ICON_STROKES[size]} />
    </button>
  );
}