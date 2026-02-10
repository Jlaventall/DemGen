import React from 'react';

interface LayoutProps {
    sidebar: React.ReactNode;
    children: React.ReactNode;
}

export const MainLayout: React.FC<LayoutProps> = ({ sidebar, children }) => {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-800">DemGen</h1>
                    <p className="text-xs text-gray-500">Synthetic Demand Generator</p>
                </div>
                <div className="p-4">
                    {sidebar}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {children}
                    </div>
                </div>

                {/* Footer/Status Bar */}
                <footer className="bg-white border-t border-gray-200 px-6 py-2 text-xs text-gray-500">
                    DemGen v0.0.1 • Client-side generation
                </footer>
            </main>
        </div>
    );
};
