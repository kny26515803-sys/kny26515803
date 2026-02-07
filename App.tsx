
import React, { useState } from 'react';
import { StyleCard } from './components/StyleCard';
import { ResultDisplay } from './components/ResultDisplay';
import { generateStoryAssets } from './services/geminiService';
import { VISUAL_STYLES } from './constants';
import { GeneratedContent, VisualStyle, StoryLength, PassengerGender, DriverGender, DriverAge, PassengerAge } from './types';
import { SparklesIcon, XCircleIcon, ClockIcon, UserIcon, IdentificationIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>(VisualStyle.REALISTIC);
  const [selectedLength, setSelectedLength] = useState<StoryLength>('1min');
  const [selectedPassengerGender, setSelectedPassengerGender] = useState<PassengerGender>('female');
  const [selectedDriverGender, setSelectedDriverGender] = useState<DriverGender>('male');
  const [selectedDriverAge, setSelectedDriverAge] = useState<DriverAge>('60s');
  const [selectedPassengerAge, setSelectedPassengerAge] = useState<PassengerAge>('30s');
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateStoryAssets(
        inputText, 
        selectedStyle, 
        selectedLength, 
        selectedPassengerGender,
        selectedDriverGender,
        selectedDriverAge,
        selectedPassengerAge
      );
      setResult(data);
    } catch (err: any) {
      setError(err.message || "스토리 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-gray-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <header className="text-center mb-12 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-4 ring-1 ring-amber-500/30">
          <span className="text-2xl mr-2">🚕</span>
          <span className="text-amber-500 font-bold tracking-wide text-sm uppercase">유튜브 크리에이터 툴</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          택시 안의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">인생 이야기</span>
        </h1>
        <p className="text-lg text-gray-400">
          기사님과 승객의 나이대와 성별을 설정하여 더욱 몰입감 있는 감동 스토리를 만들어보세요.
        </p>
      </header>

      {/* Main Form */}
      <main className="w-full max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-8 bg-gray-900/50 p-6 md:p-10 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-md">
          
          {/* 1. Topic */}
          <div className="space-y-3">
            <label htmlFor="topic" className="block text-sm font-bold text-amber-500 uppercase tracking-widest">
              1. 이야기 주제 또는 키워드
            </label>
            <div className="relative">
                <input
                type="text"
                id="topic"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="예: 취업 준비에 지친 청년에게 건네는 기사님의 따뜻한 위로..."
                className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl py-5 px-6 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                />
                {inputText && (
                    <button type="button" onClick={() => setInputText('')} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        <XCircleIcon className="w-7 h-7" />
                    </button>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 2. Story Settings */}
            <div className="space-y-6">
               {/* Length */}
               <div className="space-y-3">
                  <label className="block text-sm font-bold text-amber-500 uppercase tracking-widest">
                    2. 이야기 길이
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1min', '3min', '5min'].map((len) => (
                      <button key={len} type="button" onClick={() => setSelectedLength(len as StoryLength)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium
                          ${selectedLength === len ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>
                        <ClockIcon className="w-4 h-4" /> {len === '1min' ? '1분' : len === '3min' ? '3분' : '5분'}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Style Selection */}
               <div className="space-y-3">
                  <label className="block text-sm font-bold text-amber-500 uppercase tracking-widest">
                    5. 시각적 스타일
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                    {VISUAL_STYLES.map((style) => (
                      <StyleCard key={style.value} styleOption={style} isSelected={selectedStyle === style.value} onSelect={setSelectedStyle} />
                    ))}
                  </div>
               </div>
            </div>

            {/* 3 & 4. Cast Settings */}
            <div className="space-y-6 bg-gray-950/30 p-6 rounded-2xl border border-gray-800">
               {/* Driver Cast */}
               <div className="space-y-3">
                  <label className="block text-sm font-bold text-amber-500 uppercase tracking-widest">
                    3. 기사님 설정 (Driver)
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {[{id:'male', l:'남성'}, {id:'female', l:'여성'}].map(g => (
                        <button key={g.id} type="button" onClick={() => setSelectedDriverGender(g.id as DriverGender)}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all text-xs font-bold
                            ${selectedDriverGender === g.id ? 'border-amber-600 bg-amber-600/10 text-amber-500' : 'border-gray-700 text-gray-500'}`}>
                            <UserIcon className="w-3 h-3" /> {g.l}
                        </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['40s', '50s', '60s', '70s'].map(age => (
                        <button key={age} type="button" onClick={() => setSelectedDriverAge(age as DriverAge)}
                            className={`py-2 rounded-lg border transition-all text-[10px] font-black
                            ${selectedDriverAge === age ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-600'}`}>
                            {age}
                        </button>
                    ))}
                  </div>
               </div>

               {/* Passenger Cast */}
               <div className="space-y-3">
                  <label className="block text-sm font-bold text-amber-500 uppercase tracking-widest">
                    4. 승객 설정 (Passenger)
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {[{id:'male', l:'남성'}, {id:'female', l:'여성'}].map(g => (
                        <button key={g.id} type="button" onClick={() => setSelectedPassengerGender(g.id as PassengerGender)}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg border transition-all text-xs font-bold
                            ${selectedPassengerGender === g.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 text-gray-500'}`}>
                            <UserIcon className="w-3 h-3" /> {g.l}
                        </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['20s', '30s', '40s', '50s', '60s', '70s'].map(age => (
                        <button key={age} type="button" onClick={() => setSelectedPassengerAge(age as PassengerAge)}
                            className={`py-2 rounded-lg border transition-all text-[10px] font-black
                            ${selectedPassengerAge === age ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-600'}`}>
                            {age}
                        </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !inputText}
            className={`w-full py-5 px-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-500
              ${isLoading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white shadow-2xl hover:shadow-amber-500/40 transform hover:-translate-y-1'}`}
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                감동적인 스토리 구성 중...
              </>
            ) : (
              <>
                <SparklesIcon className="w-7 h-7" />
                스토리 자산 패키지 생성하기
              </>
            )}
          </button>
        </form>

        {/* Results */}
        {result && (
          <ResultDisplay 
            data={result} 
            selectedPassengerGender={selectedPassengerGender} 
            selectedDriverGender={selectedDriverGender}
            selectedDriverAge={selectedDriverAge}
            selectedPassengerAge={selectedPassengerAge}
          />
        )}

      </main>

      <footer className="mt-16 text-gray-600 text-sm pb-10">
        Gemini 3 Flash & 2.5 TTS 기반 • Taxi Life Story Creator
      </footer>
    </div>
  );
};

export default App;
