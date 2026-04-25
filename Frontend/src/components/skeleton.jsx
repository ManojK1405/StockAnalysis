import React from 'react';

const Skeleton = ({ className }) => {
    return (
        <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`} />
    );
};

export const PortfolioSkeleton = () => {
    return (
        <div className="space-y-12">
            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-[40px]" />
                ))}
            </div>

            {/* Main Table Skeleton */}
            <div className="bg-white rounded-[48px] border border-slate-100 p-10 h-96">
                <div className="flex justify-between mb-8">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Skeleton;
