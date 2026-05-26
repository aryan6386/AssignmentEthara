const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} relative`}>
        <div className={`${sizeClasses[size]} rounded-full border-2 border-slate-700 border-t-primary animate-spin`}></div>
      </div>
      {text && <p className="text-slate-400 text-sm animate-pulse">{text}</p>}
    </div>
  );
};

export const FullPageSpinner = () => (
  <div className="min-h-screen bg-surface-dark flex items-center justify-center">
    <LoadingSpinner size="xl" text="Loading..." />
  </div>
);

export const InlineSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <LoadingSpinner size="lg" text="Loading data..." />
  </div>
);

export default LoadingSpinner;
