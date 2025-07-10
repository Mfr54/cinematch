import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Palette, 
  Brain, 
  Eye, 
  Save, 
  RotateCcw, 
  Monitor, 
  Sun, 
  Moon, 
  Zap,
  Target,
  Info,
  AlertTriangle
} from 'lucide-react';

export interface AppSettings {
  // Görünüm Ayarları
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  animationsEnabled: boolean;
  
  // İçerik Ayarları
  recommendationCount: number;
  discoveryContentCount: number;
  showAdultContent: boolean;
  minContentRating: number;
  minTmdbScore: number;
  minTmdbVoteCount: number;
  showKidsContent: boolean;
  showAnimationContent: boolean;
  showAnimeContent: boolean;
  
  // Öneri Sistemi Ayarları
  recommendationAlgorithm: {
    profileWeight: number;        // Profil ağırlığı (0-100)
    surpriseWeight: number;       // Sürpriz faktörü (0-100)
    diversityWeight: number;      // Çeşitlilik faktörü (0-100)
    qualityWeight: number;        // Kalite faktörü (0-100)
    recencyWeight: number;        // Güncellik faktörü (0-100)
  };
  
  // Filtre Ayarları
  defaultFilters: {
    minYear: number;
    maxYear: number;
    minRating: number;
    maxRating: number;
    minMatchScore: number;
  };
  
  // Performans Ayarları
  cacheEnabled: boolean;
  preloadImages: boolean;
  autoRefreshRecommendations: boolean;
  refreshInterval: number; // dakika
  
  // Gizlilik Ayarları
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  
  // Deneysel Özellikler
  experimentalFeatures: {
    advancedFiltering: boolean;
    aiInsights: boolean;
    personalizedHomepage: boolean;
    smartNotifications: boolean;
  };
}

interface SettingsPageProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  isInitialSetup?: boolean;
  onInitialSetupComplete?: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  compactMode: false,
  animationsEnabled: true,
  recommendationCount: 25,
  discoveryContentCount: 20,
  showAdultContent: false,
  minContentRating: 6.0,
  minTmdbScore: 6.0,
  minTmdbVoteCount: 100,
  showKidsContent: false,
  showAnimationContent: true,
  showAnimeContent: true,
  recommendationAlgorithm: {
    profileWeight: 70,
    surpriseWeight: 15,
    diversityWeight: 10,
    qualityWeight: 80,
    recencyWeight: 20
  },
  defaultFilters: {
    minYear: 1950,
    maxYear: new Date().getFullYear(),
    minRating: 0,
    maxRating: 10,
    minMatchScore: 0
  },
  cacheEnabled: true,
  preloadImages: true,
  autoRefreshRecommendations: false,
  refreshInterval: 30,
  analyticsEnabled: true,
  crashReportingEnabled: true,
  experimentalFeatures: {
    advancedFiltering: true,
    aiInsights: true,
    personalizedHomepage: false,
    smartNotifications: false
  }
};

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSettingsChange,
  isInitialSetup = false,
  onInitialSetupComplete
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'content' | 'algorithm' | 'performance' | 'privacy' | 'experimental'>('appearance');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const updateNestedSetting = <T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T],
    value: any
  ) => {
    const newSettings = {
      ...localSettings,
      [category]: {
        ...(localSettings[category] as object),
        [key]: value
      }
    };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
    setHasChanges(true);
  };

  const handleNextStep = () => {
    if (setupStep === 1) {
      setCompletedSteps((prev: Set<number>) => new Set([...prev, 1]));
      setActiveTab('content');
      setSetupStep(2);
    } else if (setupStep === 2) {
      setCompletedSteps((prev: Set<number>) => new Set([...prev, 2]));
      setActiveTab('algorithm');
      setSetupStep(3);
    } else if (setupStep === 3) {
      setCompletedSteps((prev: Set<number>) => new Set([...prev, 3]));
      if (onInitialSetupComplete) {
        onInitialSetupComplete();
      }
    }
  };

  const canProceedToNext = () => {
    if (setupStep === 1) {
      // At least theme selection is required
      return true;
    } else if (setupStep === 2) {
      // At least recommendation count is set
      return localSettings.recommendationCount > 0;
    } else if (setupStep === 3) {
      return true;
    }
    return false;
  };

  const tabs = [
    { id: 'appearance', label: 'Görünüm', icon: Palette },
    { id: 'content', label: 'İçerik', icon: Eye },
    { id: 'algorithm', label: 'AI Algoritması', icon: Brain },
    { id: 'performance', label: 'Performans', icon: Zap },
    { id: 'privacy', label: 'Gizlilik', icon: Settings },
    { id: 'experimental', label: 'Deneysel', icon: Target }
  ];

  return (
    <div className="w-full min-h-screen bg-slate-900 flex flex-col">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-auto flex flex-col min-h-[60vh]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-2 rounded-lg shadow">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isInitialSetup ? 'İlk Kurulum' : 'Ayarlar'}
              </h2>
              <p className="text-slate-300 text-sm mt-1">
                {isInitialSetup ? 'CineMatch\'i kişiselleştirmek için temel ayarları yapalım' : 'Uygulamayı ihtiyaçlarınıza göre özelleştirin'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {!isInitialSetup && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 border border-slate-600/50 transition-all text-sm font-medium"
              >
                <RotateCcw className="h-4 w-4" /> Varsayılanlar
              </button>
            )}
            {isInitialSetup ? (
              <button
                onClick={handleNextStep}
                disabled={!canProceedToNext()}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg transition-all text-sm ${!canProceedToNext() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {setupStep === 3 ? 'Kurulumu Tamamla' : 'Sonraki Adım'}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="h-4 w-4" /> Kaydet
              </button>
            )}
          </div>
        </div>

        {/* Initial Setup Progress */}
        {isInitialSetup && (
          <div className="mb-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">Kurulum İlerlemesi</span>
              <span className="text-indigo-300 text-sm">Adım {setupStep}/3</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2 mb-3">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(setupStep / 3) * 100}%` }}
              ></div>
            </div>
            <div className="text-sm text-slate-300">
              {setupStep === 1 && "İlk olarak görünüm tercihlerinizi ayarlayalım"}
              {setupStep === 2 && "Şimdi içerik tercihlerinizi belirleyelim"}
              {setupStep === 3 && "Son olarak AI algoritması ayarlarını yapalım"}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-slate-700 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 justify-center
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-600'}
              `}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="space-y-8 flex-1 flex flex-col">
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="bg-slate-700/40 rounded-xl p-6 shadow-lg border border-slate-600 space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-amber-400" />
                  <span>Görünüm Ayarları</span>
                </h3>

                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Tema
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Açık', icon: Sun },
                      { value: 'dark', label: 'Koyu', icon: Moon },
                      { value: 'auto', label: 'Otomatik', icon: Monitor }
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => updateSetting('theme', theme.value as any)}
                        className={`flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-all ${
                          localSettings.theme === theme.value
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <theme.icon className="h-6 w-6 text-slate-300" />
                        <span className="text-sm text-slate-300">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Options */}
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-white">Görüntüleme Seçenekleri</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Kompakt Mod</span>
                      <p className="text-xs text-slate-400">Daha az boşluk, daha fazla içerik</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.compactMode}
                        onChange={(e) => updateSetting('compactMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Animasyonlar</span>
                      <p className="text-xs text-slate-400">Geçiş efektleri ve animasyonlar</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.animationsEnabled}
                        onChange={(e) => updateSetting('animationsEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="bg-slate-700/40 rounded-xl p-6 shadow-lg border border-slate-600 space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  <span>İçerik Ayarları</span>
                </h3>

                {/* Content Counts */}
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-white">İçerik Sayıları</h4>
                  
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Öneri Sayısı: {localSettings.recommendationCount}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={localSettings.recommendationCount}
                      onChange={(e) => updateSetting('recommendationCount', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>10</span>
                      <span>50</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Keşif İçerik Sayısı: {localSettings.discoveryContentCount}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      step="5"
                      value={localSettings.discoveryContentCount}
                      onChange={(e) => updateSetting('discoveryContentCount', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>10</span>
                      <span>40</span>
                    </div>
                  </div>
                </div>

                {/* Content Filtering */}
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-white">İçerik Filtreleme</h4>
                  
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Minimum İçerik Puanı: {localSettings.minContentRating.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={localSettings.minContentRating}
                      onChange={(e) => updateSetting('minContentRating', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0.0</span>
                      <span>10.0</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Minimum TMDB Puanı: {localSettings.minTmdbScore.toFixed(1)}
                    </label>
                    <p className="text-xs text-slate-400 mb-2">TMDB üzerindeki minimum film/dizi puanı</p>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={localSettings.minTmdbScore}
                      onChange={(e) => updateSetting('minTmdbScore', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0.0</span>
                      <span>10.0</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Minimum Oy Sayısı: {localSettings.minTmdbVoteCount}
                    </label>
                    <p className="text-xs text-slate-400 mb-2">TMDB'de minimum kaç kişi puanlamış olması gerekir</p>
                    <input
                      type="range"
                      min="10"
                      max="5000"
                      step="50"
                      value={localSettings.minTmdbVoteCount}
                      onChange={(e) => updateSetting('minTmdbVoteCount', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>10</span>
                      <span>5000</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Yetişkin İçeriği Göster</span>
                      <p className="text-xs text-slate-400">18+ içerikleri dahil et</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.showAdultContent}
                        onChange={(e) => updateSetting('showAdultContent', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Çocuk İçeriği Göster (13 yaşa kadar)</span>
                      <p className="text-xs text-slate-400">Sadece çocuklara uygun içerikleri dahil et</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.showKidsContent}
                        onChange={(e) => updateSetting('showKidsContent', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Çizgi Film Göster</span>
                      <p className="text-xs text-slate-400">Animasyon (çizgi film) içerikleri dahil et</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.showAnimationContent}
                        onChange={(e) => updateSetting('showAnimationContent', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Anime Göster</span>
                      <p className="text-xs text-slate-400">Anime içerikleri dahil et</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.showAnimeContent}
                        onChange={(e) => updateSetting('showAnimeContent', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Algorithm Tab */}
            {activeTab === 'algorithm' && (
              <div className="bg-slate-700/40 rounded-xl p-6 shadow-lg border border-slate-600 space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <span>AI Algoritması İnce Ayarları</span>
                </h3>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-purple-200 text-sm">
                      Bu ayarlar öneri algoritmasının nasıl çalıştığını etkiler. Değişiklikler yeni öneriler oluşturulduğunda geçerli olur.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4 space-y-6">
                  <h4 className="font-medium text-white">Algoritma Ağırlıkları</h4>
                  
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Profil Uyumu: %{localSettings.recommendationAlgorithm.profileWeight}
                    </label>
                    <p className="text-xs text-slate-400 mb-2">Geçmiş puanlarınıza ne kadar uygun olacağı</p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={localSettings.recommendationAlgorithm.profileWeight}
                      onChange={(e) => updateNestedSetting('recommendationAlgorithm', 'profileWeight', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Sürpriz Faktörü: %{localSettings.recommendationAlgorithm.surpriseWeight}
                    </label>
                    <p className="text-xs text-slate-400 mb-2">Beklenmedik ama ilginç önerilerin oranı</p>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={localSettings.recommendationAlgorithm.surpriseWeight}
                      onChange={(e) => updateNestedSetting('recommendationAlgorithm', 'surpriseWeight', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Çeşitlilik: %{localSettings.recommendationAlgorithm.diversityWeight}
                    </label>
                    <p className="text-xs text-slate-400 mb-2">Farklı türlerden önerilerin oranı</p>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={localSettings.recommendationAlgorithm.diversityWeight}
                      onChange={(e) => updateNestedSetting('recommendationAlgorithm', 'diversityWeight', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Kalite Önceliği: %{localSettings.recommendationAlgorithm.qualityWeight}
                    </label>
                    <p className="text-xs text-slate-400 mb-2">Yüksek puanlı içeriklerin önceliği</p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={localSettings.recommendationAlgorithm.qualityWeight}
                      onChange={(e) => updateNestedSetting('recommendationAlgorithm', 'qualityWeight', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Güncellik: %{localSettings.recommendationAlgorithm.recencyWeight}
                    </label>
                    <p className="text-xs text-slate-400 mb-2">Yeni çıkan içeriklerin önceliği</p>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={localSettings.recommendationAlgorithm.recencyWeight}
                      onChange={(e) => updateNestedSetting('recommendationAlgorithm', 'recencyWeight', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Preset Buttons */}
                  <div className="border-t border-slate-600 pt-4">
                    <p className="text-sm text-slate-300 mb-3">Hazır Ayarlar:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => updateSetting('recommendationAlgorithm', {
                          profileWeight: 80,
                          surpriseWeight: 10,
                          diversityWeight: 5,
                          qualityWeight: 90,
                          recencyWeight: 15
                        })}
                        className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-colors"
                      >
                        Güvenli
                      </button>
                      <button
                        onClick={() => updateSetting('recommendationAlgorithm', {
                          profileWeight: 60,
                          surpriseWeight: 25,
                          diversityWeight: 20,
                          qualityWeight: 70,
                          recencyWeight: 30
                        })}
                        className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-colors"
                      >
                        Dengeli
                      </button>
                      <button
                        onClick={() => updateSetting('recommendationAlgorithm', {
                          profileWeight: 40,
                          surpriseWeight: 35,
                          diversityWeight: 30,
                          qualityWeight: 60,
                          recencyWeight: 40
                        })}
                        className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-colors"
                      >
                        Maceracı
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="bg-slate-700/40 rounded-xl p-6 shadow-lg border border-slate-600 space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-400" />
                  <span>Performans Ayarları</span>
                </h3>

                <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-white">Önbellekleme</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Önbellek Etkin</span>
                      <p className="text-xs text-slate-400">Daha hızlı yükleme için verileri sakla</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.cacheEnabled}
                        onChange={(e) => updateSetting('cacheEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Görselleri Önceden Yükle</span>
                      <p className="text-xs text-slate-400">Posterleri arka planda yükle</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.preloadImages}
                        onChange={(e) => updateSetting('preloadImages', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-white">Otomatik Yenileme</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Önerileri Otomatik Yenile</span>
                      <p className="text-xs text-slate-400">Belirli aralıklarla yeni öneriler getir</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.autoRefreshRecommendations}
                        onChange={(e) => updateSetting('autoRefreshRecommendations', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {localSettings.autoRefreshRecommendations && (
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">
                        Yenileme Aralığı: {localSettings.refreshInterval} dakika
                      </label>
                      <input
                        type="range"
                        min="15"
                        max="120"
                        step="15"
                        value={localSettings.refreshInterval}
                        onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>15 dk</span>
                        <span>120 dk</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-slate-700/40 rounded-xl p-6 shadow-lg border border-slate-600 space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-red-400" />
                  <span>Gizlilik Ayarları</span>
                </h3>

                <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-white">Veri Toplama</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Analitik Veriler</span>
                      <p className="text-xs text-slate-400">Uygulamayı geliştirmek için kullanım verilerini topla</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.analyticsEnabled}
                        onChange={(e) => updateSetting('analyticsEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Hata Raporlama</span>
                      <p className="text-xs text-slate-400">Hataları otomatik olarak rapor et</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.crashReportingEnabled}
                        onChange={(e) => updateSetting('crashReportingEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Experimental Tab */}
            {activeTab === 'experimental' && (
              <div className="bg-slate-700/40 rounded-xl p-6 shadow-lg border border-slate-600 space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-400" />
                  <span>Deneysel Özellikler</span>
                </h3>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <p className="text-orange-200 text-sm">
                      Bu özellikler deneysel aşamadadır ve beklenmedik davranışlara neden olabilir.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-white">Beta Özellikler</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Gelişmiş Filtreleme</span>
                      <p className="text-xs text-slate-400">Daha detaylı filtre seçenekleri</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.experimentalFeatures.advancedFiltering}
                        onChange={(e) => updateNestedSetting('experimentalFeatures', 'advancedFiltering', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">AI İçgörüleri</span>
                      <p className="text-xs text-slate-400">Detaylı profil analizi ve öneriler</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.experimentalFeatures.aiInsights}
                        onChange={(e) => updateNestedSetting('experimentalFeatures', 'aiInsights', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Kişiselleştirilmiş Ana Sayfa</span>
                      <p className="text-xs text-slate-400">Dinamik ana sayfa düzeni</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.experimentalFeatures.personalizedHomepage}
                        onChange={(e) => updateNestedSetting('experimentalFeatures', 'personalizedHomepage', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-300">Akıllı Bildirimler</span>
                      <p className="text-xs text-slate-400">Yeni öneriler için bildirimler</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.experimentalFeatures.smartNotifications}
                        onChange={(e) => updateNestedSetting('experimentalFeatures', 'smartNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};