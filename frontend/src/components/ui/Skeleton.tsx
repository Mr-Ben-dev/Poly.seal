interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height 
}: SkeletonProps) {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div 
      className={`skeleton ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <Skeleton height={24} width="60%" />
      <Skeleton height={16} width="40%" />
      <div className="space-y-2 pt-4">
        <Skeleton height={14} />
        <Skeleton height={14} />
        <Skeleton height={14} width="80%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-4">
        <Skeleton height={16} width="20%" />
        <Skeleton height={16} width="30%" />
        <Skeleton height={16} width="20%" />
        <Skeleton height={16} width="20%" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-t border-surface-200 dark:border-surface-700">
          <Skeleton height={14} width="20%" />
          <Skeleton height={14} width="30%" />
          <Skeleton height={14} width="20%" />
          <Skeleton height={14} width="20%" />
        </div>
      ))}
    </div>
  );
}
