import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ReactNode | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Error caught by ErrorBoundary:', error);
        console.error('Component stack:', errorInfo.componentStack);
        
        this.setState({
            errorInfo: errorInfo.componentStack
        });
    }

    private handleReload = (): void => {
        window.location.reload();
    };

    private handleGoHome = (): void => {
        window.location.href = '/';
    };

    public render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-red-500 p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="bg-white/20 p-4 rounded-full">
                                    <AlertTriangle className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h1 className="text-xl font-bold text-white">Terjadi Kesalahan</h1>
                            <p className="text-red-100 text-sm mt-2">
                                Maaf, terjadi kesalahan yang tidak terduga
                            </p>
                        </div>
                        
                        <div className="p-6">
                            <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-slate-600 font-medium mb-2">Detail Error:</p>
                                <p className="text-xs text-slate-500 font-mono break-all">
                                    {this.state.error?.message || 'Unknown error'}
                                </p>
                            </div>

                            {this.state.errorInfo && (
                                <details className="mb-6">
                                    <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                                        Lihat detail teknis
                                    </summary>
                                    <pre className="mt-2 text-xs text-slate-400 bg-slate-100 p-3 rounded-lg overflow-auto max-h-40">
                                        {this.state.errorInfo}
                                    </pre>
                                </details>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={this.handleReload}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Muat Ulang
                                </button>
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-medium transition-colors"
                                >
                                    <Home className="w-4 h-4" />
                                    Beranda
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

export const withErrorBoundary = <P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) => {
    const displayName = Component.displayName || Component.name || 'Component';
    
    const WrappedComponent = (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
    
    return WrappedComponent;
};
