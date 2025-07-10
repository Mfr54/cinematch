import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, Languages, GraduationCap, Briefcase, DollarSign, Heart, Baby, Save, X } from 'lucide-react';
import type { UserProfile } from '../types';

export interface ProfileFormData {
  demographics: {
    age?: number;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    country?: string;
    language?: string;
    education?: 'primary' | 'secondary' | 'university' | 'graduate' | 'other';
    occupation?: string;
    income?: 'low' | 'medium' | 'high' | 'prefer_not_to_say';
    relationshipStatus?: 'single' | 'in_relationship' | 'married' | 'divorced' | 'other';
    hasChildren?: boolean;
    childrenAge?: number[];
  };
}

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfileFormData) => void;
  currentProfile?: UserProfile | null;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  isOpen,
  onClose,
  onSave,
  currentProfile
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    demographics: {
      country: '',
      language: '',
      occupation: '',
      hasChildren: false,
      childrenAge: []
    }
  });

  useEffect(() => {
    if (currentProfile?.demographics) {
      setFormData({
        demographics: {
          ...currentProfile.demographics,
          childrenAge: currentProfile.demographics.childrenAge || []
        }
      });
    }
  }, [currentProfile]);

  const updateField = (field: keyof ProfileFormData['demographics'], value: any) => {
    setFormData(prev => ({
      demographics: {
        ...prev.demographics,
        [field]: value
      }
    }));
  };

  const updateChildrenAge = (index: number, value: number) => {
    const newChildrenAge = [...(formData.demographics.childrenAge || [])];
    newChildrenAge[index] = value;
    updateField('childrenAge', newChildrenAge);
  };

  const addChildAge = () => {
    const newChildrenAge = [...(formData.demographics.childrenAge || []), 0];
    updateField('childrenAge', newChildrenAge);
  };

  const removeChildAge = (index: number) => {
    const newChildrenAge = (formData.demographics.childrenAge || []).filter((_, i) => i !== index);
    updateField('childrenAge', newChildrenAge);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Profil Bilgileri</h2>
              <p className="text-slate-400 text-sm">Kişiselleştirilmiş öneriler için demografik bilgilerinizi girin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Yaş
              </label>
              <input
                type="number"
                min="13"
                max="120"
                value={formData.demographics.age || ''}
                onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yaşınızı girin"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Cinsiyet
              </label>
              <select
                value={formData.demographics.gender || ''}
                onChange={(e) => updateField('gender', e.target.value || undefined)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
                <option value="other">Diğer</option>
                <option value="prefer_not_to_say">Belirtmek İstemiyorum</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <MapPin className="h-4 w-4 inline mr-2" />
                Ülke
              </label>
              <select
                value={formData.demographics.country || ''}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Ülke seçiniz</option>
                <option value="TR">Türkiye</option>
                <option value="US">Amerika Birleşik Devletleri</option>
                <option value="GB">Birleşik Krallık</option>
                <option value="DE">Almanya</option>
                <option value="FR">Fransa</option>
                <option value="IT">İtalya</option>
                <option value="ES">İspanya</option>
                <option value="NL">Hollanda</option>
                <option value="SE">İsveç</option>
                <option value="NO">Norveç</option>
                <option value="DK">Danimarka</option>
                <option value="FI">Finlandiya</option>
                <option value="PL">Polonya</option>
                <option value="CZ">Çek Cumhuriyeti</option>
                <option value="RU">Rusya</option>
                <option value="JP">Japonya</option>
                <option value="KR">Güney Kore</option>
                <option value="CN">Çin</option>
                <option value="IN">Hindistan</option>
                <option value="BR">Brezilya</option>
                <option value="MX">Meksika</option>
                <option value="CA">Kanada</option>
                <option value="AU">Avustralya</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Languages className="h-4 w-4 inline mr-2" />
                Ana Dil
              </label>
              <select
                value={formData.demographics.language || ''}
                onChange={(e) => updateField('language', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Dil seçiniz</option>
                <option value="tr">Türkçe</option>
                <option value="en">İngilizce</option>
                <option value="de">Almanca</option>
                <option value="fr">Fransızca</option>
                <option value="es">İspanyolca</option>
                <option value="it">İtalyanca</option>
                <option value="pt">Portekizce</option>
                <option value="ru">Rusça</option>
                <option value="ja">Japonca</option>
                <option value="ko">Korece</option>
                <option value="zh">Çince</option>
                <option value="ar">Arapça</option>
                <option value="hi">Hintçe</option>
                <option value="fa">Farsça</option>
              </select>
            </div>

            {/* Education */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <GraduationCap className="h-4 w-4 inline mr-2" />
                Eğitim Seviyesi
              </label>
              <select
                value={formData.demographics.education || ''}
                onChange={(e) => updateField('education', e.target.value || undefined)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                <option value="primary">İlkokul</option>
                <option value="secondary">Ortaokul/Lise</option>
                <option value="university">Üniversite</option>
                <option value="graduate">Yüksek Lisans/Doktora</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            {/* Income */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <DollarSign className="h-4 w-4 inline mr-2" />
                Gelir Seviyesi
              </label>
              <select
                value={formData.demographics.income || ''}
                onChange={(e) => updateField('income', e.target.value || undefined)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="prefer_not_to_say">Belirtmek İstemiyorum</option>
              </select>
            </div>

            {/* Relationship Status */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Heart className="h-4 w-4 inline mr-2" />
                İlişki Durumu
              </label>
              <select
                value={formData.demographics.relationshipStatus || ''}
                onChange={(e) => updateField('relationshipStatus', e.target.value || undefined)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                <option value="single">Bekar</option>
                <option value="in_relationship">İlişkisi var</option>
                <option value="married">Evli</option>
                <option value="divorced">Boşanmış</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            {/* Occupation */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Briefcase className="h-4 w-4 inline mr-2" />
                Meslek
              </label>
              <input
                type="text"
                value={formData.demographics.occupation || ''}
                onChange={(e) => updateField('occupation', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mesleğinizi girin (isteğe bağlı)"
              />
            </div>
          </div>

          {/* Children Section */}
          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Baby className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Çocuk Bilgileri</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="hasChildren"
                  checked={formData.demographics.hasChildren || false}
                  onChange={(e) => updateField('hasChildren', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasChildren" className="text-slate-300">
                  Çocuğum var
                </label>
              </div>

              {formData.demographics.hasChildren && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">
                    Çocukların Yaşları
                  </label>
                  <div className="space-y-2">
                    {(formData.demographics.childrenAge || []).map((age, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="18"
                          value={age}
                          onChange={(e) => updateChildrenAge(index, parseInt(e.target.value) || 0)}
                          className="w-20 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Yaş"
                        />
                        <span className="text-slate-400">yaşında</span>
                        <button
                          type="button"
                          onClick={() => removeChildAge(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addChildAge}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      + Çocuk Ekle
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-300">
              <strong>Gizlilik:</strong> Bu bilgiler sadece size daha iyi film ve dizi önerileri sunmak için kullanılır. 
              Hiçbir zaman üçüncü taraflarla paylaşılmaz ve tamamen güvenli bir şekilde saklanır.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-xl transition-all duration-200 font-medium shadow-lg"
            >
              <Save className="h-4 w-4" />
              <span>Profili Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 