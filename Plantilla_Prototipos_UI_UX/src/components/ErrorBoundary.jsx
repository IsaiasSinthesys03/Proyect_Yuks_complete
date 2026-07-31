import React from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Error de render no recuperable:', error, info);
    }

    render() {
        if (!this.state.hasError) return this.props.children;
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-10 max-w-lg text-center shadow-2xl">
                    <AlertTriangle className="w-12 h-12 text-[#ffce07] mx-auto mb-5" />
                    <h1 className="text-2xl font-black text-white">No pudimos mostrar esta pantalla</h1>
                    {this.state.error && (
                        <div className="mt-4 p-4 bg-slate-900 border border-red-500/30 rounded-xl text-left max-w-full overflow-auto">
                            <p className="text-red-400 font-mono text-sm font-bold">
                                {this.state.error?.message || String(this.state.error)}
                            </p>
                            <pre className="text-slate-400 font-mono text-[10px] mt-2 whitespace-pre-wrap">
                                {this.state.error?.stack || JSON.stringify(this.state.error, null, 2)}
                            </pre>
                        </div>
                    )}
                    <button 
                        onClick={() => window.location.reload()} className="mt-8 bg-[#03bbd3] hover:bg-[#02a8be] text-white px-8 py-3 rounded-xl font-bold">Recargar</button>
                </div>
            </div>
        );
    }
}
