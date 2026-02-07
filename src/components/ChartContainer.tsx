import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ChartContainerProps {
    children: ReactNode;
    width?: string | number;
    height?: string | number;
    minWidth?: number;
    minHeight?: number;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
    children,
    width = '100%',
    height = '100%',
    minWidth = 0,
    minHeight = 0
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const suppressRechartsWarning = () => {
            const originalWarn = console.warn;
            console.warn = (...args: unknown[]) => {
                if (
                    typeof args[0] === 'string' &&
                    args[0].includes('width(-1) and height(-1) of chart')
                ) {
                    return;
                }
                originalWarn.apply(console, args);
            };
            return () => {
                console.warn = originalWarn;
            };
        };

        const cleanup = suppressRechartsWarning();
        return cleanup;
    }, []);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                setDimensions({ width: offsetWidth, height: offsetHeight });
                if (offsetWidth > minWidth && offsetHeight > minHeight) {
                    setIsReady(true);
                }
            }
        };

        updateDimensions();

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { offsetWidth, offsetHeight } = entry.target as HTMLDivElement;
                setDimensions({ width: offsetWidth, height: offsetHeight });
                if (offsetWidth > minWidth && offsetHeight > minHeight) {
                    setIsReady(true);
                }
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        const timeoutId = setTimeout(() => {
            setIsReady(true);
        }, 500);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timeoutId);
        };
    }, [minWidth, minHeight]);

    return (
        <div ref={containerRef} style={{ width, height, minWidth, minHeight }}>
            {isReady && dimensions.width > minWidth && dimensions.height > minHeight ? (
                children
            ) : (
                <div className="flex items-center justify-center h-full w-full">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-xs font-medium">Memuat grafik...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartContainer;
