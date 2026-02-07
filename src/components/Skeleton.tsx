import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    animation = 'pulse'
}) => {
    const baseClasses = 'bg-slate-200';
    
    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-xl'
    };
    
    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-[wave_1.5s_ease-in-out_infinite]',
        none: ''
    };

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
    lines = 3, 
    className = '' 
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    width={i === lines - 1 ? '60%' : '100%'}
                    height={16}
                />
            ))}
        </div>
    );
};

export const SkeletonCard: React.FC = () => {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                    <Skeleton variant="rounded" width={80} height={32} />
                    <Skeleton variant="text" width={60} height={12} />
                </div>
                <Skeleton variant="rounded" width={80} height={24} />
            </div>
            
            <div className="space-y-3 mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <Skeleton variant="text" width={`${60 + i * 10}%`} height={16} />
                    </div>
                ))}
            </div>
            
            <div className="pt-4 border-t border-slate-100 space-y-3">
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="rounded" width="100%" height={48} />
            </div>
        </div>
    );
};

export const SkeletonGrid: React.FC<{ count?: number; className?: string }> = ({ 
    count = 8,
    className = '' 
}) => {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({ 
    rows = 5,
    cols = 4,
    className = '' 
}) => {
    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="text"
                        width={`${100 / cols}%`}
                        height={20}
                    />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4">
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            variant="text"
                            width={`${100 / cols}%`}
                            height={40}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
    items = 5,
    className = '' 
}) => {
    return (
        <div className={`space-y-4 ${className}`}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="40%" height={16} />
                        <Skeleton variant="text" width="60%" height={12} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <Skeleton 
            variant="rounded" 
            width={120} 
            height={40} 
            className={className}
        />
    );
};

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => {
    return <Skeleton variant="circular" width={size} height={size} />;
};

export default Skeleton;
