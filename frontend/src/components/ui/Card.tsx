import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
  glow?: boolean;
}

export function Card({ 
  children, 
  hover = false, 
  glow = false,
  className = '', 
  ...props 
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={`
        glass-card p-6
        ${hover ? 'cursor-pointer transition-all duration-300 hover:shadow-glass-lg' : ''}
        ${glow ? 'shadow-glow' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <h3 className={`font-display text-xl font-bold text-surface-900 dark:text-surface-50 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <p className={`text-sm text-surface-600 dark:text-surface-400 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 ${className}`}>
      {children}
    </div>
  );
}
