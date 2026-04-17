export default function EmptyState({ emoji, title, description, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10 px-4' : 'py-16 px-6'}`}>
      {emoji && (
        <div className={`${compact ? 'text-3xl mb-2' : 'text-4xl mb-3'}`}>{emoji}</div>
      )}
      <h3 className={`font-semibold text-gray-800 ${compact ? 'text-sm' : 'text-base'}`}>
        {title}
      </h3>
      {description && (
        <p className={`text-gray-400 mt-1 max-w-xs leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}