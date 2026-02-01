import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    icon,
    iconPosition = 'left',
    children, 
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-semibold rounded-xl
      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-primary-600 to-primary-500 text-white
        shadow-lg shadow-primary-500/25
        hover:shadow-xl hover:shadow-primary-500/30
        active:scale-95
      `,
      secondary: `
        bg-surface-100 dark:bg-surface-800 
        text-surface-700 dark:text-surface-200
        border border-surface-200 dark:border-surface-700
        hover:bg-surface-200 dark:hover:bg-surface-700
        active:scale-95
      `,
      ghost: `
        text-surface-600 dark:text-surface-400
        hover:bg-surface-100 dark:hover:bg-surface-800
        hover:text-surface-900 dark:hover:text-surface-100
      `,
      danger: `
        bg-gradient-to-r from-red-600 to-red-500 text-white
        shadow-lg shadow-red-500/25
        hover:shadow-xl hover:shadow-red-500/30
        active:scale-95
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
