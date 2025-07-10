import { useState, useCallback, useEffect } from 'react';
import { MovieCard } from './features/content/components/MovieCard';
import { ProfileSection } from './features/profile/components/ProfileSection';
import { RecommendationCard } from './features/recommendation/components/RecommendationCard';
import { RecommendationFilters } from './features/recommendation/components/RecommendationFilters';
import { WatchlistModal } from './features/profile/components/WatchlistModal';
import { RatedContentModal } from './features/profile/components/RatedContentModal';
import { SettingsPage } from './features/profile/components/SettingsModal';
import { ProfileForm } from './features/profile/components/ProfileForm';
import { LoadingSpinner, SearchResultsSummary, Sidebar } from './shared/components';
import { useMovieData } from './features/recommendation/hooks/useMovieData';
import { useSettings } from './features/profile/hooks/useSettings';
import { LearningService } from './features/learning/services/learningService';
import { RealTimeLearningService } from './features/learning/services/realTimeLearningService';
import { OnboardingFlow } from './features/onboarding';
import { Sparkles, Star, Target, Brain, TestTube, TrendingUp, RefreshCw, Zap, Search, Menu, Download, Upload, Trash2 } from 'lucide-react';
import { BfiTopFilms } from './features/content/components/BfiTopFilms';
import { BfiDirectorsTopFilms } from './features/content/components/BfiDirectorsTopFilms';
import { Best300Movies } from './features/content/components/Best300Movies';
import { SkippedContentModal } from './features/profile/components/SkippedContentModal';

function App() {
  const { settings, updateSettings } = useSettings();

  // Dummy state to force re-render/useMovieData refresh
  const [_ratingsRefresh, setRatingsRefresh] = useState(0);

  // useMovieData hook call
  const movieData = useMovieData(settings);

  const {
    user: _user,
    profile,
    ratings,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    rateMovie,
    movies,
    allMovies: _allMovies,
    genres,
    recommendations,
    filteredRecommendations,
    loading,

    recommendationsLoading,
    recommendationsLoadingProgress,
    curatedContentLoading,
    curatedContentLoadingProgress,
    searchQuery,
    showingCuratedMovies,
    recommendationFilters,
    curatedContentFilters: _curatedContentFilters,
    showCuratedFilters: _showCuratedFilters,
    error: _error,
    setSearchQuery,
    setRecommendationFilters,
    setCuratedContentFilters: _setCuratedContentFilters,
    setShowCuratedFilters: _setShowCuratedFilters,
    searchMovies,
    getUserRating,
    isInWatchlist,
    exportData,
    importData,
    clearData,
    refreshRecommendations,
    refreshCuratedContent: _refreshCuratedContent,
    loadAILearningContent
  } = movieData;

  // Move these variable declarations before useCallback to avoid temporal dead zone
  const learningPhase = profile?.learningPhase || LearningService.determineLearningPhase(ratings || []);
  const validRatings = (ratings || []).filter(r => r.rating !== 'not_watched');
  const validRatingCount = validRatings.filter(r => typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 10).length;
  const hasEnoughRatingsForAI = validRatingCount >= 10;

  const [showRecommendationFilters, setShowRecommendationFilters] = useState(false);

  const [showProfileForm, setShowProfileForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('discovery');
  const [clearLoading, setClearLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    totalResults: number;
    searchType: 'content' | 'person' | 'mixed';
  }>({ totalResults: 0, searchType: 'content' });
  const [searchSort, setSearchSort] = useState('relevance');
  const [searchFilters, setSearchFilters] = useState({ mediaType: 'all' });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const getPhaseInfo = useCallback(() => {
    // Hiç veri yoksa özel mesaj göster
    if (validRatings.length === 0 && !profile) {
      return {
        icon: Sparkles,
        title: 'Hoş Geldin! İlk Adımlar',
        description: 'Cinematch\'e hoş geldin! Seni tanımak için önce 10 popüler ve kaliteli içeriği puanlamanı istiyoruz. Bu sayede sana özel öneriler sunmaya başlayabilirim.',
        color: 'from-indigo-500/20 to-purple-500/20',
        borderColor: 'border-indigo-500/30',
        iconColor: 'text-indigo-400',
        progress: 0,
        progressText: '0/10 içerik puanlandı - Başlayalım!'
      };
    }

    switch (learningPhase) {
      case 'initial':
        return {
          icon: Target,
          title: 'Zevkini Keşfedelim!',
          description: 'Sana özel öneriler sunabilmek için farklı türlerden seçilmiş kaliteli film ve dizileri puanlamanı istiyoruz.',
          color: 'from-blue-500/20 to-purple-500/20',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-400',
          progress: Math.min(100, (validRatings.length / 10) * 100),
          progressText: `${validRatings.length}/10 içerik puanlandı`
        };
      case 'profiling':
        return {
          icon: Brain,
          title: 'Profil Geliştirme Aşaması',
          description: 'Harika! Temel profilin oluştu. Şimdi 50 içeriğe kadar farklı türlerden film ve diziler puanlayarak profilini detaylandıralım.',
          color: 'from-purple-500/20 to-pink-500/20',
          borderColor: 'border-purple-500/30',
          iconColor: 'text-purple-400',
          progress: Math.min(100, (validRatings.length / 50) * 100),
          progressText: `${validRatings.length}/50 içerik puanlandı`
        };
      case 'testing':
        return {
          icon: TestTube,
          title: 'Test ve Doğrulama Aşaması',
          description: 'Artık test aşamasındayım! Önerilerimin doğruluğunu test ediyorum. Bu aşamada verdiğin puanlar benim doğruluk oranımı belirliyor.',
          color: 'from-green-500/20 to-blue-500/20',
          borderColor: 'border-green-500/30',
          iconColor: 'text-green-400',
          progress: Math.min(100, Math.max(0, ((validRatings.length - 50) / 20) * 100)),
          progressText: `${Math.max(0, validRatings.length - 50)}/20 test içeriği puanlandı`
        };
      case 'optimizing':
        return {
          icon: TrendingUp,
          title: 'Sürekli Optimizasyon Modu',
          description: 'Tebrikler! Artık sürekli öğrenme modundayım. Her yeni puanlama ile daha da akıllı oluyorum ve önerilerimi sürekli geliştiriyorum.',
          color: 'from-amber-500/20 to-orange-500/20',
          borderColor: 'border-amber-500/30',
          iconColor: 'text-amber-400',
          progress: 100,
          progressText: `${validRatings.length} içerik puanlandı - Sürekli öğreniyor`
        };
      default:
        return {
          icon: Target,
          title: 'Başlangıç',
          description: 'Başlayalım!',
          color: 'from-blue-500/20 to-purple-500/20',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-400',
          progress: 0,
          progressText: '0 içerik puanlandı'
        };
    }
  }, [learningPhase, validRatings.length]);

  const clearDataWithLoading = useCallback(async () => {
    setClearLoading(true);
    try {
      await clearData();
      // Force a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setClearLoading(false);
    }
  }, [clearData]);

  const handleOnboardingComplete = useCallback(() => {
    // Onboarding tamamlandığını localStorage'a kaydet
    localStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
    // Onboarding tamamlandıktan sonra AI önerileri ekranına git
    setActiveTab('recommendations');
  }, []);

  // Başka bir sekmede veya BFI gibi farklı bir bileşende puan verildiğinde ratings'i anında güncelle
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cinematch_ratings') {
        setRatingsRefresh(r => r + 1);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    RealTimeLearningService.initialize();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // AI önerileri ekranında AI öğrenme içeriklerini yükle
  useEffect(() => {
    if (activeTab === 'recommendations' && !hasEnoughRatingsForAI && curatedContentLoading && movies.length === 0) {
      loadAILearningContent();
    }
  }, [activeTab, hasEnoughRatingsForAI, curatedContentLoading, movies.length, loadAILearningContent]);

  // Onboarding kontrolü - hiç puanlama yoksa ve onboarding tamamlanmamışsa onboarding'i başlat
  useEffect(() => {
    const validRatings = (ratings || []).filter(r => 
      r.rating !== 'not_watched' && 
      r.rating !== 'not_interested' && 
      r.rating !== 'skip' &&
      typeof r.rating === 'number' && 
      r.rating >= 1 && 
      r.rating <= 10
    );
    
    // Onboarding tamamlanma durumunu kontrol et
    const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
    
    // Eğer hiç geçerli puanlama yoksa ve onboarding tamamlanmamışsa onboarding'i başlat
    if (validRatings.length === 0 && !onboardingCompleted && !showOnboarding) {
      setShowOnboarding(true);
    }
    
    // Eğer onboarding tamamlanmışsa ama hiç puanlama yoksa, onboarding'i tekrar başlat
    if (validRatings.length === 0 && onboardingCompleted && !showOnboarding) {
      localStorage.removeItem('onboardingCompleted');
      setShowOnboarding(true);
    }
  }, [ratings, showOnboarding]);

  const phaseInfo = getPhaseInfo();

  const safeRecommendationCount = Math.max(1, Math.min(100, settings?.recommendationCount || 25));
  const safeDiscoveryCount = Math.max(1, Math.min(100, settings?.discoveryContentCount || 20));
  const displayedMovies = (movies || []).slice(0, safeDiscoveryCount);
  const ratedIds = new Set(ratings.map(r => r.movieId));
  const filteredDiscoveryMovies = displayedMovies.filter(movie => !ratedIds.has(movie.id) && !isInWatchlist(movie.id));
  const displayedRecommendations = (filteredRecommendations || [])
    .filter(rec => !isInWatchlist(rec.movie.id))
    .slice(0, safeRecommendationCount);

  const totalRecommendations = recommendations?.length || 0;
  const totalFilteredRecommendations = filteredRecommendations?.length || 0;


  // Onboarding gösteriliyorsa sadece onboarding'i göster
  if (showOnboarding) {
    return (
      <OnboardingFlow
        genres={genres || []}
        onComplete={handleOnboardingComplete}
        onRate={rateMovie}
        getUserRating={getUserRating}
        isInWatchlist={isInWatchlist}
        onAddToWatchlist={addToWatchlist}
        onRemoveFromWatchlist={removeFromWatchlist}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}

        onExport={exportData}
        onImport={importData}
        onClear={clearDataWithLoading}
        onRefreshRecommendations={refreshRecommendations}
        clearLoading={clearLoading}
        recommendationsLoading={recommendationsLoading}
        ratingsCount={ratings.length}
        watchlistCount={watchlist?.length || 0}
        
        learningPhase={learningPhase}
        hasEnoughRatingsForAI={hasEnoughRatingsForAI}
        showingCuratedMovies={showingCuratedMovies}
        isMobile={isMobile}
        isOpen={isMobileSidebarOpen}
        onToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        {isMobile && (
          <div className="lg:hidden bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
              >
                <Menu className="h-6 w-6 text-slate-300" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
                  CineMatch
                </h1>
              </div>
              
              {/* Mobile Quick Actions */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    try {
                      const data = exportData();
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `cinematch-backup-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Export error:', error);
                      alert('Veri dışa aktarma sırasında hata oluştu!');
                    }
                  }}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                  title="Verileri Dışa Aktar"
                >
                  <Download className="h-4 w-4 text-slate-300" />
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const content = e.target?.result as string;
                          if (content) {
                            importData(content);
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                  title="Verileri İçe Aktar"
                >
                  <Upload className="h-4 w-4 text-slate-300" />
                </button>
                <button
                  onClick={clearDataWithLoading}
                  disabled={clearLoading}
                  className={`p-2 rounded-lg transition-colors ${
                    clearLoading 
                      ? 'bg-slate-800/30 opacity-60 cursor-not-allowed' 
                      : 'bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400'
                  }`}
                  title="Tüm Verileri Temizle"
                >
                  <Trash2 className={`h-4 w-4 ${clearLoading ? 'animate-spin' : 'text-slate-300'}`} />
                </button>
              </div>
            </div>
            
            {/* Mobile Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Film, dizi veya kişi ara..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchMovies(searchQuery, (results) => setSearchResults(results));
                  }
                }}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
              />
              <button
                onClick={() => searchMovies(searchQuery, (results) => setSearchResults(results))}
                disabled={loading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg bg-brand-primary hover:bg-brand-primary/80 disabled:bg-brand-primary/50 transition-colors"
              >
                <Search className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {clearLoading && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <LoadingSpinner />
            <span className="ml-4 text-white text-lg">Veriler siliniyor...</span>
          </div>
        )}

        {activeTab === 'settings' ? (
          <SettingsPage
            settings={settings}
            onSettingsChange={updateSettings}
          />
        ) : (
          <main className="flex-1 p-0">
            {showingCuratedMovies && learningPhase !== 'optimizing' && activeTab === 'recommendations' && (
              <div className={`bg-gradient-to-r ${phaseInfo.color} border ${phaseInfo.borderColor} rounded-2xl p-8 mb-8 backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${phaseInfo.color} border ${phaseInfo.borderColor}`}>
                      <phaseInfo.icon className={`h-7 w-7 ${phaseInfo.iconColor}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{phaseInfo.title}</h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span className="text-slate-300 text-sm">AI Destekli Öğrenme Sistemi</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-slate-200 mb-6 leading-relaxed text-lg">
                  {phaseInfo.description}
                </p>
                
                <div className="w-full bg-slate-700/50 rounded-full h-4 mb-3 border border-slate-600/50">
                  <div 
                    className={`bg-gradient-to-r ${
                      learningPhase === 'initial' ? 'from-blue-500 to-purple-500' :
                      learningPhase === 'profiling' ? 'from-purple-500 to-pink-500' :
                      learningPhase === 'testing' ? 'from-green-500 to-blue-500' :
                      'from-amber-500 to-orange-500'
                    } h-4 rounded-full transition-all duration-500 relative overflow-hidden`}
                    style={{ width: `${Math.min(100, Math.max(0, phaseInfo.progress))}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-300 text-sm font-medium">
                    {phaseInfo.progressText}
                    {profile?.accuracyScore && learningPhase === 'testing' && 
                      ` • Doğruluk: %${profile.accuracyScore.toFixed(1)}`
                    }
                  </p>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-400 font-bold text-sm">
                      %{Math.round(Math.max(0, phaseInfo.progress))} Tamamlandı
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-200 mt-6">
                  {learningPhase === 'initial' && (
                    <>
                      <div className="flex items-center space-x-2 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/30">
                        <span>• Farklı türleri dene</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/30">
                        <span>• Dürüst puanla</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/30">
                        <span>• İzlemedim seçeneğini kullan</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/30">
                        <span>• 5 içerik hedefi</span>
                      </div>
                    </>
                  )}
                  {learningPhase === 'profiling' && (
                    <>
                      <div className="flex items-center space-x-2 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/30">
                        <span>• Çeşitli dönemlerden içerikler</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/30">
                        <span>• Farklı kalite seviyeleri</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/30">
                        <span>• Tür kombinasyonları</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/30">
                        <span>• 50 içerik hedefi</span>
                      </div>
                    </>
                  )}
                  {learningPhase === 'testing' && (
                    <>
                      <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/30">
                        <span>• Test içeriklerini puanla</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/30">
                        <span>• Doğruluk oranını artır</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/30">
                        <span>• Önerileri değerlendir</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/30">
                        <span>• Model performansı test ediliyor</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab !== 'settings' && (
              <section className="mb-12 pt-0">
                {/* Sadece discovery, recommendations, profile, watchlist, rated sekmelerinde başlık kutusu göster */}
                {['discovery', 'recommendations', 'profile', 'watchlist', 'rated'].includes(activeTab) ? null : null}

                {activeTab === 'discovery' && (
                  <div>
                    {/* Arama Arayüzü */}
                    <div className="mb-8">
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
                        <div className="flex items-center space-x-4 mb-4">
                          <Search className="h-6 w-6 text-blue-400" />
                          <h3 className="text-xl font-semibold text-white">İçerik Arama</h3>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Film, dizi, oyuncu veya yönetmen ara..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                            />
                          </div>
                          <button
                            onClick={() => searchMovies(searchQuery, (results) => setSearchResults(results))}
                            disabled={!searchQuery.trim()}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                          >
                            <Search className="h-4 w-4" />
                            <span>Ara</span>
                          </button>
                        </div>
                        
                      </div>
                    </div>

                    {/* Arama Sonuçları */}
                    {searchQuery && (
                      <SearchResultsSummary
                        query={searchQuery}
                        resultCount={filteredDiscoveryMovies.length}
                        totalResults={searchResults.totalResults}
                        searchType={searchResults.searchType}
                        onClearSearch={() => {
                          setSearchQuery('');
                          searchMovies('', (results) => setSearchResults(results));
                          setSearchResults({ totalResults: 0, searchType: 'content' });
                        }}
                        onSortChange={(sortBy) => {
                          setSearchSort(sortBy);
                          // TODO: Implement search result sorting
                        }}
                        onFilterChange={(filters) => {
                          setSearchFilters(filters);
                          // TODO: Implement search result filtering
                        }}
                        currentSort={searchSort}
                        currentFilters={searchFilters}
                      />
                    )}

                    {/* İçerik Listesi - Sadece Arama Yapıldığında */}
                    {searchQuery && (
                      <>
                        {curatedContentLoading ? (
                          <LoadingSpinner progress={curatedContentLoading ? curatedContentLoadingProgress : { current: 0, total: 0, message: '' }} />
                        ) : filteredDiscoveryMovies.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-12 max-w-md mx-auto border border-slate-700/50">
                              <Star className="h-16 w-16 text-slate-500 mx-auto mb-6" />
                              <h3 className="text-2xl font-semibold text-white mb-4">
                                Arama Sonucu Bulunamadı
                              </h3>
                              <p className="text-slate-400 leading-relaxed">
                                Farklı bir arama terimi deneyin
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {filteredDiscoveryMovies.map((movie) => {
                              const matchScore = showingCuratedMovies ? Math.floor(Math.random() * 30) + 70 : 80;
                              const reasons = showingCuratedMovies ? [
                                'Bu türdeki diğer içerikleri beğendiğin için',
                                'Yüksek puanlı ve popüler bir içerik',
                                'Profilindeki tercihlerle uyumlu'
                              ] : [];

                              return (
                                <MovieCard
                                  key={movie.id}
                                  movie={movie}
                                  genres={genres || []}
                                  userRating={getUserRating(movie.id)}
                                  onRate={(rating, mediaType) => rateMovie(movie.id, rating, mediaType)}
                                  isInWatchlist={isInWatchlist(movie.id)}
                                  onAddToWatchlist={() => addToWatchlist(movie)}
                                  onRemoveFromWatchlist={() => removeFromWatchlist(movie.id)}
                                  matchScore={matchScore}
                                  reasons={reasons}
                                />
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {/* Arama Yapılmadığında Boş Durum */}
                    {!searchQuery && (
                      <div className="text-center py-16">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-12 max-w-md mx-auto border border-slate-700/50">
                          <Search className="h-16 w-16 text-slate-500 mx-auto mb-6" />
                          <h3 className="text-2xl font-semibold text-white mb-4">
                            Arama Yapın
                          </h3>
                          <p className="text-slate-400 leading-relaxed">
                            Film, dizi, oyuncu veya yönetmen aramak için yukarıdaki arama kutusunu kullanın
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div>
                    <ProfileSection
                      profile={profile}
                      genres={genres}
                      ratings={ratings}
                      getUserRating={getUserRating}
                      onRateContent={rateMovie}
                      isInWatchlist={isInWatchlist}
                      onRemoveFromWatchlist={removeFromWatchlist}
                    />
                  </div>
                )}

                {activeTab === 'watchlist' && (
                  <div>
                    <WatchlistModal
                      isOpen={true}
                      onClose={() => setActiveTab('discovery')}
                      watchlist={watchlist || []}
                      onRemoveFromWatchlist={removeFromWatchlist}
                      onRateContent={rateMovie}
                      getUserRating={getUserRating}
                      genres={genres || []}
                    />
                  </div>
                )}

                {activeTab === 'rated' && (
                  <div>
                    <RatedContentModal
                      isOpen={true}
                      onClose={() => setActiveTab('discovery')}
                      ratings={ratings || []}
                      genres={genres || []}
                    />
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div>
                    <div className="mb-3">
                          <h3 className="text-purple-300 font-semibold text-sm mb-1">AI Önerileri Hakkında</h3>
                          <p className="text-purple-200 text-xs leading-relaxed">
                            Bu öneriler, puanladığın içeriklerin analizi, tür kombinasyonları, favori oyuncuların ve TMDb'nin öneri algoritması kullanılarak oluşturuluyor. 
                            Her öneri için eşleşme oranı ve detaylı açıklama sunuluyor.
                            Filtreleri kullanarak yeni öneriler oluşturabilirsin.
                          </p>
                    </div>

                    <div className="mb-8">
                      <RecommendationFilters
                        filters={recommendationFilters}
                        genres={genres || []}
                        onFiltersChange={setRecommendationFilters}
                        isOpen={showRecommendationFilters}
                        onToggle={() => setShowRecommendationFilters(!showRecommendationFilters)}
                        onRefresh={refreshRecommendations}
                        isRefreshing={recommendationsLoading}
                        totalRecommendations={totalRecommendations}
                        filteredCount={totalFilteredRecommendations}
                      />
                    </div>
                    
                    {!hasEnoughRatingsForAI ? (
                      <div>
                        {/* AI Öğrenme Başlığı */}
                        <div className="mb-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <Brain className="h-6 w-6 text-purple-400" />
                            <h3 className="text-xl font-semibold text-white">AI Öğrenme Süreci</h3>
                          </div>
                          <p className="text-slate-300 text-sm mb-4">
                            AI önerileri alabilmek için önce 10 farklı içerik puanlaman gerekiyor. 
                            Aşağıdaki içerikleri puanlayarak AI öğrenme sürecini başlatın.
                          </p>
                          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-purple-300 text-sm font-medium">İlerleme</span>
                              <span className="text-purple-200 text-sm">{validRatingCount}/10</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(validRatingCount / 10) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* AI Öğrenme İçerikleri */}
                        {curatedContentLoading ? (
                          <LoadingSpinner progress={curatedContentLoading ? curatedContentLoadingProgress : { current: 0, total: 0, message: '' }} />
                        ) : filteredDiscoveryMovies.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-12 max-w-md mx-auto border border-slate-700/50">
                              <Brain className="h-16 w-16 text-slate-500 mx-auto mb-6" />
                              <h3 className="text-2xl font-semibold text-white mb-4">
                                AI Öğrenme İçerikleri Yükleniyor
                              </h3>
                              <p className="text-slate-400 leading-relaxed">
                                AI öğrenme sürecinizi başlatmak için içerikler hazırlanıyor...
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {filteredDiscoveryMovies.map((movie) => {
                              const matchScore = Math.floor(Math.random() * 30) + 70;
                              const reasons = [
                                'AI öğrenme sürecinizi başlatmak için seçildi',
                                'TMDB\'nin en popüler içeriklerinden',
                                'Farklı türlerden kaliteli içerikler'
                              ];

                              return (
                                <MovieCard
                                  key={movie.id}
                                  movie={movie}
                                  genres={genres || []}
                                  userRating={getUserRating(movie.id)}
                                  onRate={(rating, mediaType) => rateMovie(movie.id, rating, mediaType)}
                                  isInWatchlist={isInWatchlist(movie.id)}
                                  onAddToWatchlist={() => addToWatchlist(movie)}
                                  onRemoveFromWatchlist={() => removeFromWatchlist(movie.id)}
                                  matchScore={matchScore}
                                  reasons={reasons}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : recommendationsLoading ? (
                      <LoadingSpinner progress={recommendationsLoading ? recommendationsLoadingProgress : { current: 0, total: 0, message: '' }} />
                    ) : totalRecommendations === 0 ? (
                      <div className="text-center py-16">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-12 max-w-md mx-auto border border-slate-700/50">
                          <Sparkles className="h-16 w-16 text-slate-500 mx-auto mb-6" />
                          <h3 className="text-2xl font-semibold text-white mb-4">
                            {learningPhase === 'initial' ? 'AI Önerileri İçin Hazırlanıyor' :
                             learningPhase === 'profiling' ? 'Profil Geliştiriliyor' :
                             'AI Önerileri Henüz Hazır Değil'}
                          </h3>
                          <p className="text-slate-400 leading-relaxed mb-6">
                            {learningPhase === 'initial' 
                              ? 'AI önerileri alabilmek için önce 5 farklı içerik puanlaman gerekiyor. Keşif İçerikleri sekmesinden başlayabilirsin.'
                              : learningPhase === 'profiling'
                                ? 'Profilini geliştirmek için daha fazla içerik puanla. 50 içeriğe ulaştığında AI önerileri aktif olacak.'
                                : 'AI önerileri henüz oluşturulmadı. "Yeni Öneriler Oluştur" butonunu kullanarak başlayabilirsin.'
                            }
                          </p>
                          <button
                            onClick={refreshRecommendations}
                            disabled={recommendationsLoading}
                            className="flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-600/50 disabled:to-pink-600/50 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg mx-auto"
                          >
                            <RefreshCw className={`h-5 w-5 ${recommendationsLoading ? 'animate-spin' : ''}`} />
                            <span>Yeni Öneriler Oluştur</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {displayedRecommendations.map((recommendation) => (
                          <RecommendationCard
                            key={recommendation.movie.id}
                            recommendation={recommendation}
                            genres={genres || []}
                            onRate={(rating, mediaType) => {
                              const type = mediaType || recommendation.movie.media_type || ('name' in recommendation.movie ? 'tv' : 'movie');
                              rateMovie(recommendation.movie.id, rating, type);
                            }}
                            userRating={getUserRating(recommendation.movie.id)}
                            isInWatchlist={isInWatchlist(recommendation.movie.id)}
                            onAddToWatchlist={() => addToWatchlist(recommendation.movie)}
                            onRemoveFromWatchlist={() => removeFromWatchlist(recommendation.movie.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'bfi' && (
                  <BfiTopFilms />
                )}

                {activeTab === 'bfi-directors' && (
                  <BfiDirectorsTopFilms />
                )}

                {activeTab === 'best300' && (
                  <Best300Movies />
                )}

                {activeTab === 'skipped' && (
                  <div>
                    <SkippedContentModal
                      isOpen={true}
                      onClose={() => setActiveTab('discovery')}
                      genres={genres || []}
                      onRate={(itemId, rating, mediaType) => rateMovie(itemId, rating, mediaType)}
                    />
                  </div>
                )}
              </section>
            )}
          </main>
        )}

        <ProfileForm
          isOpen={showProfileForm}
          onClose={() => setShowProfileForm(false)}
          onSave={(data) => {
            console.log('Profile data:', data);
            setShowProfileForm(false);
          }}
          currentProfile={profile}
        />
      </div>
    </div>
  );
}

export default App;