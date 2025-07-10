import React, { ReactNode } from 'react';
import { Sparkles, Menu } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  showMobileHeader?: boolean;
  onMobileMenuToggle?: () => void;
}

export const AppLayout = ({ 
  children, 
  showMobileHeader = false, 
  onMobileMenuToggle 
}: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-textLight">
      {/* Header */}
      <Header showMobileHeader={showMobileHeader} onMobileMenuToggle={onMobileMenuToggle} />
      
      {/* Main Content */}
      <main className="px-4 py-6">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

// Header Component
const Header = ({ 
  showMobileHeader, 
  onMobileMenuToggle 
}: { 
  showMobileHeader: boolean; 
  onMobileMenuToggle?: () => void; 
}) => {
  if (!showMobileHeader) return null;

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 p-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          >
            <Menu className="h-6 w-6 text-slate-300" />
          </button>
        )}
        
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-2 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
            CineMatch
          </h1>
        </div>
        
        {/* User Actions Placeholder */}
        <div className="w-10 h-10"></div>
      </div>
    </header>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-brand-cardBg border-t border-slate-700/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-2 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
                CineMatch AI
              </h2>
            </div>
            <p className="text-brand-textSubtle text-sm leading-relaxed">
              Yapay zeka destekli film ve dizi öneri sistemi. Zevklerinizi öğrenir, 
              kişisel öneriler sunar ve sinema deneyiminizi kişiselleştirir.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-brand-textLight font-semibold mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-brand-textSubtle hover:text-brand-secondary transition-colors">Hakkında</a></li>
              <li><a href="#" className="text-brand-textSubtle hover:text-brand-secondary transition-colors">Gizlilik</a></li>
              <li><a href="#" className="text-brand-textSubtle hover:text-brand-secondary transition-colors">SSS</a></li>
              <li><a href="#" className="text-brand-textSubtle hover:text-brand-secondary transition-colors">İletişim</a></li>
            </ul>
          </div>
          
          {/* Social Media */}
          <div>
            <h3 className="text-brand-textLight font-semibold mb-4">Sosyal Medya</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-brand-textSubtle hover:text-brand-secondary transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-brand-textSubtle hover:text-brand-secondary transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-700/50 mt-8 pt-8">
          <p className="text-center text-brand-textSubtle text-sm">
            © 2024 CineMatch AI. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
};