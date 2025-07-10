import React, { useState, useEffect, useCallback } from 'react';
import { MovieCard } from '../../content/components/MovieCard';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Brain, CheckCircle, SkipForward } from 'lucide-react';
import { CuratedMovieService } from '../../recommendation/services/curatedMovieService';
import type { Movie, TVShow, Genre } from '../../content/types';

interface OnboardingFlowProps {
  genres: Genre[];
  onComplete: (redirectToSettings?: boolean) => void;
  onRate: (itemId: number, rating: number | 'not_watched' | 'not_interested' | 'skip', mediaType: 'movie' | 'tv') => void;
  getUserRating: (itemId: number) => number | 'not_watched' | 'not_interested' | 'skip' | null;
  isInWatchlist: (itemId: number) => boolean;
  onAddToWatchlist: (content: Movie | TVShow) => void;
  onRemoveFromWatchlist: (itemId: number) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  genres,
  onComplete,
  onRate,
  getUserRating,
  isInWatchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist
}) => {
  const [onboardingMovies, setOnboardingMovies] = useState<(Movie | TVShow)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ratingCount, setRatingCount] = useState(0);
  const [ratedContentCount, setRatedContentCount] = useState(0);
  const [processedContentIds, setProcessedContentIds] = useState<Set<number>>(new Set());
  const [skippedContentIds, setSkippedContentIds] = useState<Set<number>>(new Set());

  // Onboarding durumunu localStorage'dan yükle
  useEffect(() => {
    const savedState = localStorage.getItem('onboardingState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setRatingCount(state.ratingCount || 0);
        setRatedContentCount(state.ratedContentCount || 0);
        setProcessedContentIds(new Set(state.processedContentIds || []));
        setSkippedContentIds(new Set(state.skippedContentIds || []));
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      }
    }
  }, []);

  // Helper to get all skipped/processed IDs as numbers from state and localStorage
  const getAllSkippedIds = () => {
    const savedState = localStorage.getItem('onboardingState');
    let allSkipped = new Set<number>([...Array.from(processedContentIds).map(Number), ...Array.from(skippedContentIds).map(Number)]);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        [...(state.processedContentIds || []), ...(state.skippedContentIds || [])].forEach((id: any) => allSkipped.add(Number(id)));
      } catch {}
    }
    return allSkipped;
  };

  // Farklı türlerden en yüksek puanlı içerikleri yükle
  useEffect(() => {
    const loadOnboardingContent = async () => {
      setLoading(true);
      try {
        const content = await CuratedMovieService.getInitialRatingContent();
        const allSkipped = getAllSkippedIds();
        const shuffled = content.sort(() => Math.random() - 0.5);
        const filtered = shuffled.filter(item => !allSkipped.has(Number(item.id)));
        setOnboardingMovies(filtered.slice(0, 20));
        setCurrentIndex(0);
      } catch (error) {
        console.error('Onboarding content loading failed:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOnboardingContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedContentIds, skippedContentIds]);

  const handleRate = (itemId: number, rating: number | 'not_watched' | 'not_interested' | 'skip', mediaType: 'movie' | 'tv') => {
    onRate(itemId, rating, mediaType);

    // Güncel setleri oluştur
    const newProcessed = new Set(processedContentIds);
    newProcessed.add(itemId);
    let newSkipped = skippedContentIds;
    if (rating === 'skip') {
      newSkipped = new Set(skippedContentIds);
      newSkipped.add(itemId);
      // SkippedContent localStorage'a da ekle
      const prev = localStorage.getItem('skippedContent');
      let arr = [];
      try { arr = prev ? JSON.parse(prev) : []; } catch { arr = []; }
      if (!arr.find((item: any) => item.id === itemId)) {
        arr.push({ id: itemId, mediaType, timestamp: Date.now() });
        localStorage.setItem('skippedContent', JSON.stringify(arr));
      }
    }

    setProcessedContentIds(newProcessed);
    if (rating === 'skip') setSkippedContentIds(newSkipped);

    // Atlanan içeriği onboardingMovies listesinden çıkar
    setOnboardingMovies(prev => prev.filter(movie => movie.id !== itemId));
    // currentIndex'i güncelle
    setCurrentIndex(prev => Math.max(0, Math.min(prev, onboardingMovies.length - 2)));

    const newRatedContentCount = ratedContentCount + 1;
    setRatedContentCount(newRatedContentCount);
    let shouldAdvance = true;
    if (typeof rating === 'number' && rating >= 1 && rating <= 10) {
      const newRatingCount = ratingCount + 1;
      setRatingCount(newRatingCount);
      if (newRatingCount >= 10) {
        localStorage.setItem('onboardingCompleted', 'true');
        localStorage.removeItem('onboardingState');
        // Mark that user needs to complete initial settings
        localStorage.setItem('needsInitialSetup', 'true');
        setTimeout(() => {
          onComplete(true); // true indicates redirect to settings
        }, 1000);
        shouldAdvance = false;
      }
    }
    // Her durumda sonraki içeriğe geç
    if (shouldAdvance) {
      if (currentIndex < onboardingMovies.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        if (ratingCount < 10) {
          loadMoreContent(newProcessed, newSkipped);
          setCurrentIndex(0);
        }
      }
    }
  };

  // Onboarding durumunu localStorage'a kaydet
  const saveOnboardingState = useCallback(() => {
    const state = {
      ratingCount,
      ratedContentCount,
      processedContentIds: Array.from(processedContentIds),
      skippedContentIds: Array.from(skippedContentIds)
    };
    localStorage.setItem('onboardingState', JSON.stringify(state));
  }, [ratingCount, ratedContentCount, processedContentIds, skippedContentIds]);

  // Onboarding durumunu kaydet
  useEffect(() => {
    saveOnboardingState();
  }, [saveOnboardingState]);

  // Yeni içerikler yükleme fonksiyonu
  const loadMoreContent = async (processed = processedContentIds, skipped = skippedContentIds) => {
    try {
      setLoading(true);
      const additionalContent = await CuratedMovieService.getInitialRatingContent();
      const savedState = localStorage.getItem('onboardingState');
      let allSkipped = new Set<number>([...Array.from(processed).map(Number), ...Array.from(skipped).map(Number)]);
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          [...(state.processedContentIds || []), ...(state.skippedContentIds || [])].forEach((id: any) => allSkipped.add(Number(id)));
        } catch {}
      }
      setOnboardingMovies(prev => {
        const filteredContent = additionalContent.filter(content => !allSkipped.has(Number(content.id)));
        const shuffled = filteredContent.sort(() => Math.random() - 0.5);
        const newContent = shuffled.slice(0, Math.max(10, 20 - prev.length));
        const updated = [...prev, ...newContent];
        // currentIndex'i sıfırla
        setCurrentIndex(0);
        return updated;
      });
    } catch (error) {
      console.error('Additional content loading failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentMovie = onboardingMovies[currentIndex];

  // Eğer yeni içerik yoksa otomatik olarak daha fazla içerik yüklemeyi dene
  const [noMoreContentTries, setNoMoreContentTries] = useState(0);
  React.useEffect(() => {
    if (!loading && (!currentMovie || onboardingMovies.length === 0) && ratingCount < 10 && noMoreContentTries < 3) {
      // Daha fazla içerik yüklemeyi dene
      loadMoreContent(processedContentIds, skippedContentIds);
      setNoMoreContentTries(tries => tries + 1);
    }
  }, [currentMovie, onboardingMovies.length, loading, ratingCount, processedContentIds, skippedContentIds, noMoreContentTries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner progress={{ current: 0, total: 10, message: 'AI öğrenme içerikleri hazırlanıyor...' }} />
        </div>
      </div>
    );
  }

  if (!currentMovie && !loading && noMoreContentTries >= 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-300 mt-10">
          Daha fazla yeni içerik bulunamadı. Lütfen mevcut içerikleri puanlayın veya sayfayı yenileyin.
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-b border-indigo-500/30 p-2 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1 rounded-lg">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white mb-0.5">
                  CineMatch'e Hoş Geldin!
                </h1>
                <p className="text-indigo-200 text-xs">
                  Seni tanımak için 10 farklı içeriği puanlamanı istiyoruz
                </p>
              </div>
            </div>
            
            {/* İlerleme */}
            <div className="text-right">
              <div className="text-base font-bold text-white mb-0.5">
                {ratingCount}/10
              </div>
              <div className="text-indigo-300 text-xs">Puanlandı</div>
            </div>
          </div>

          {/* İlerleme Çubuğu */}
          <div className="w-full bg-slate-700 rounded-full h-1 mb-1">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1 rounded-full transition-all duration-500"
              style={{ width: `${(ratingCount / 10) * 100}%` }}
            ></div>
          </div>

          {/* Adım Bilgisi */}
          <div className="flex items-center justify-between text-xs text-indigo-200">
            <span>İçerik {ratedContentCount + 1}/10</span>
            <span>{Math.round((ratingCount / 10) * 100)}% Tamamlandı</span>
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">

                {/* Mevcut İçerik */}
        {currentMovie && (
          <div className="w-full max-w-sm">
            <MovieCard
              key={currentMovie.id} // Her yeni kart için bileşeni yeniden oluştur
              movie={currentMovie}
              genres={genres}
              userRating={getUserRating(currentMovie.id)}
              onRate={(rating, mediaType) => handleRate(currentMovie.id, rating, mediaType || 'movie')}
              isInWatchlist={isInWatchlist(currentMovie.id)}
              onAddToWatchlist={() => onAddToWatchlist(currentMovie)}
              onRemoveFromWatchlist={() => onRemoveFromWatchlist(currentMovie.id)}
              matchScore={85}
              reasons={[]}
              hideActionButtons={true}
              compactHeight={true}
              hideInfoBadges={true}
            />
            
            {/* Atla Butonu */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => handleRate(currentMovie.id, 'skip', currentMovie.media_type || 'movie')}
                className="flex items-center space-x-2 bg-slate-700/80 hover:bg-slate-600/80 text-white px-6 py-3 rounded-xl transition-all duration-200 text-sm font-medium shadow-lg backdrop-blur-sm border border-slate-600/50"
              >
                <SkipForward className="h-4 w-4" />
                <span>Atla</span>
              </button>
            </div>
          </div>
        )}



        {/* Tamamlama Mesajı */}
        {ratingCount >= 10 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-sm mx-4 border border-green-500/30">
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Tebrikler!
                </h3>
                <p className="text-slate-300 mb-4 text-sm">
                  10 içeriği başarıyla puanladın. AI öğrenme sürecin başladı!
                </p>
                <div className="text-xs text-slate-400">
                  Ana ekrana yönlendiriliyorsun...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 