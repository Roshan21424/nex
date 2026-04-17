const SIZES = {
  sm: 'w-4 h-4 border',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-10 h-10 border-[3px]',
};

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`${SIZES[size]} border-gray-200 border-t-gray-600 rounded-full animate-spin flex-shrink-0 ${className}`}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  );
}

export function InlineSpinner({ text = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12">
      <Spinner size="md" />
      <span className="text-sm text-gray-400">{text}</span>
    </div>
  );
}