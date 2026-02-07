
import React, { useState } from 'react';
import { GeneratedContent, ScriptLine, PassengerGender, DriverGender, DriverAge, PassengerAge } from '../types';
import { 
  ClipboardDocumentIcon, 
  FilmIcon, 
  ChatBubbleBottomCenterTextIcon, 
  CommandLineIcon, 
  PhotoIcon, 
  TagIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';
import { generateConversationAudio, generateAIImage } from '../services/geminiService';

interface ResultDisplayProps {
  data: GeneratedContent;
  selectedPassengerGender: PassengerGender;
  selectedDriverGender: DriverGender;
  selectedDriverAge: DriverAge;
  selectedPassengerAge: PassengerAge;
}

type Tab = 'analysis' | 'script' | 'metadata' | 'audio' | 'prompts' | 'raw-prompts';

/**
 * PCM 데이터를 표준 WAV 파일로 변환하는 유틸리티
 */
const pcmToWav = (base64Pcm: string, sampleRate: number = 24000) => {
  const binaryString = atob(base64Pcm);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false);
  // RIFF chunk size
  view.setUint32(4, 36 + bytes.length, true);
  // WAVE identifier
  view.setUint32(8, 0x57415645, false);
  // FMT chunk identifier
  view.setUint32(12, 0x666d7420, false);
  // FMT chunk size
  view.setUint32(16, 16, true);
  // Audio format (1 is PCM)
  view.setUint16(20, 1, true);
  // Number of channels
  view.setUint16(22, 1, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (sampleRate * numChannels * bitsPerSample/8)
  view.setUint32(28, sampleRate * 2, true);
  // Block align (numChannels * bitsPerSample/8)
  view.setUint16(32, 2, true);
  // Bits per sample
  view.setUint16(34, 16, true);
  // Data chunk identifier
  view.setUint32(36, 0x64617461, false);
  // Data chunk size
  view.setUint32(40, bytes.length, true);

  return new Blob([header, bytes], { type: 'audio/wav' });
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, selectedPassengerGender, selectedDriverGender, selectedDriverAge, selectedPassengerAge }) => {
  const [activeTab, setActiveTab] = useState<Tab>('script');
  const [copied, setCopied] = useState<string | null>(null);
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState<Record<number, boolean>>({});

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const base64Pcm = await generateConversationAudio(data.script, selectedDriverGender, selectedPassengerGender, selectedDriverAge, selectedPassengerAge);
      const wavBlob = pcmToWav(base64Pcm);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
    } catch (error) {
      console.error("Audio Generation Error:", error);
      alert("오디오 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerateImage = async (index: number, prompt: string) => {
    setIsGeneratingImage(prev => ({ ...prev, [index]: true }));
    try {
      const imageUrl = await generateAIImage(prompt, selectedDriverGender, selectedPassengerGender, selectedDriverAge, selectedPassengerAge);
      setGeneratedImages(prev => ({ ...prev, [index]: imageUrl }));
    } catch (error) {
      console.error(error);
      alert("이미지 생성 실패");
    } finally {
      setIsGeneratingImage(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleGenerateAllImages = async () => {
    for (let i = 0; i < data.imagePrompts.length; i++) {
        if (!generatedImages[i]) {
            await handleGenerateImage(i, data.imagePrompts[i].prompt);
        }
    }
  };

  const allPurePrompts = data.imagePrompts
    .map((item) => item.prompt)
    .join('\n\n');

  const allScriptText = data.script
    .map(l => `${l.speaker}: ${l.text}`)
    .join('\n');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'analysis', label: '기획/분석', icon: <FilmIcon className="w-4 h-4" /> },
    { id: 'script', label: '스크립트/음성', icon: <ChatBubbleBottomCenterTextIcon className="w-4 h-4" /> },
    { id: 'metadata', label: '메타데이터', icon: <TagIcon className="w-4 h-4" /> },
    { id: 'audio', label: '파이썬 코드', icon: <CommandLineIcon className="w-4 h-4" /> },
    { id: 'prompts', label: '이미지 갤러리', icon: <PhotoIcon className="w-4 h-4" /> },
    { id: 'raw-prompts', label: '프롬프트 추출', icon: <DocumentDuplicateIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full bg-gray-900/80 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl mt-12 animate-fade-in-up backdrop-blur-sm">
      <div className="flex border-b border-gray-800 overflow-x-auto scrollbar-hide bg-gray-900/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-8 py-5 text-sm font-bold whitespace-nowrap transition-all
              ${activeTab === tab.id 
                ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-8 min-h-[500px]">
        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-amber-500">스토리 분석 리포트</h3>
            <div className="bg-gray-800/30 p-8 rounded-3xl border border-gray-700/50 text-gray-200 leading-relaxed whitespace-pre-line shadow-inner">
              {data.analysis}
            </div>
          </div>
        )}

        {activeTab === 'script' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-bold text-amber-500">시네마틱 대본</h3>
                <p className="text-sm text-gray-500">기사님({selectedDriverAge} {selectedDriverGender === 'male' ? '남성' : '여성'})과 승객({selectedPassengerAge} {selectedPassengerGender === 'male' ? '남성' : '여성'})의 감동 스토리</p>
              </div>
              <div className="flex gap-2">
                {!audioUrl ? (
                  <button 
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 text-white px-5 py-3 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95"
                  >
                    {isGeneratingAudio ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                    {isGeneratingAudio ? 'AI 목소리 합성 중...' : '음성 미리보기 생성'}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 bg-gray-800 p-2 rounded-2xl border border-gray-700 shadow-inner">
                    <audio src={audioUrl} controls className="h-9 w-64" />
                    <button onClick={handleGenerateAudio} className="p-2 text-gray-400 hover:text-white transition" title="다시 생성"><ArrowPathIcon className="w-5 h-5" /></button>
                  </div>
                )}
                <button 
                  onClick={() => handleCopy(allScriptText, 'script-full')} 
                  className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 text-gray-300 transition shadow-lg active:scale-95"
                  title="자막 제작용 전체 복사"
                >
                    {copied === 'script-full' ? <CheckIcon className="w-5 h-5 text-green-500" /> : <QueueListIcon className="w-5 h-5" />}
                    <span className="text-xs font-bold">전체 대사 복사</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-6 max-h-[700px] overflow-y-auto pr-4 scrollbar-thin">
              {data.script.map((line, idx) => (
                <div key={idx} className={`flex ${line.speaker === 'Driver' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-6 shadow-xl transition-transform hover:scale-[1.01] ${
                    line.speaker === 'Driver' 
                      ? 'bg-gray-800 rounded-tl-none border-l-4 border-amber-600' 
                      : 'bg-blue-900/20 rounded-tr-none border-r-4 border-blue-600'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${line.speaker === 'Driver' ? 'bg-amber-600/20 text-amber-500' : 'bg-blue-600/20 text-blue-400'}`}>
                        {line.speaker === 'Driver' ? `🚕 기사님(${selectedDriverAge})` : `👤 승객(${selectedPassengerAge})`}
                      </span>
                      {line.direction && <span className="text-[10px] text-gray-500 italic font-medium">({line.direction})</span>}
                    </div>
                    <p className="text-gray-200 leading-relaxed font-medium text-lg">{line.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
            <div className="space-y-12 animate-fade-in">
                {/* Titles */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            <span className="text-amber-500">#</span> 추천 유튜브 제목 (Top 5)
                        </h3>
                        <button 
                          onClick={() => handleCopy(data.metadata.titles.join('\n'), 'all-titles')} 
                          className="text-xs font-bold text-amber-500 hover:text-amber-400 transition underline underline-offset-4"
                        >
                          {copied === 'all-titles' ? '전체 제목 복사됨' : '전체 후보군 복사'}
                        </button>
                    </div>
                    <div className="grid gap-4">
                        {data.metadata.titles.map((t, i) => (
                            <div key={i} onClick={() => handleCopy(t, 't'+i)} className="group p-5 bg-gray-800/50 rounded-2xl border border-gray-700 hover:border-amber-500 hover:bg-gray-800 cursor-pointer flex justify-between items-center transition shadow-lg">
                                <span className="text-gray-200 font-medium text-lg">{t}</span>
                                <div className="flex items-center gap-2">
                                  {copied === 't'+i ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardDocumentIcon className="w-5 h-5 text-gray-600 group-hover:text-amber-500 transition" />}
                                  <span className="text-[10px] font-black text-gray-600 group-hover:text-amber-500">COPY</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Summary */}
                <section className="bg-gray-800/30 p-8 rounded-3xl border border-gray-700 shadow-inner">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-black text-white flex items-center gap-3">📝 감성 시놉시스 (150자 요약)</h3>
                        <button onClick={() => handleCopy(data.metadata.summary, 'm-summary')} className="flex items-center gap-1.5 text-xs text-amber-500 font-black hover:underline tracking-tighter">
                            {copied === 'm-summary' ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                            요약문 복사
                        </button>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-lg bg-gray-950/50 p-6 rounded-2xl border border-gray-800/50 italic">
                        "{data.metadata.summary}"
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="bg-gray-800/30 p-8 rounded-3xl border border-gray-700">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">🏷️ 고노출 해시태그 (7개)</h3>
                            <button onClick={() => handleCopy(data.metadata.hashtags, 'm-hash')} className="text-xs text-amber-500 font-black hover:underline">
                                {copied === 'm-hash' ? 'COPY DONE' : 'COPY ALL'}
                            </button>
                        </div>
                        <div className="p-5 bg-gray-950/50 rounded-2xl text-amber-500 font-black text-sm border border-gray-800/50 tracking-wide">
                            {data.metadata.hashtags}
                        </div>
                    </section>

                    <section className="bg-gray-800/30 p-8 rounded-3xl border border-gray-700">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">🔑 SEO 핵심 키워드 (30개, 쉼표 포함)</h3>
                            <button onClick={() => handleCopy(data.metadata.keywords, 'm-key')} className="text-xs text-amber-500 font-black hover:underline">
                                {copied === 'm-key' ? 'COPY DONE' : 'COPY ALL'}
                            </button>
                        </div>
                        <div className="p-5 bg-gray-950/50 rounded-2xl text-gray-400 text-xs border border-gray-800/50 leading-relaxed font-medium overflow-y-auto max-h-32 scrollbar-thin">
                            {data.metadata.keywords}
                        </div>
                    </section>
                </div>

                {/* Thumbnail */}
                <section>
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">🎨 썸네일 카피 훅</h3>
                    <div className="relative group p-16 bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 rounded-[2.5rem] text-center shadow-[0_20px_50px_rgba(234,88,12,0.3)] overflow-hidden cursor-pointer active:scale-[0.98] transition-all" onClick={() => handleCopy(data.metadata.thumbnailText, 'm-thumb')}>
                        <span className="relative z-10 text-5xl md:text-7xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] italic tracking-tighter uppercase leading-tight block">
                          {data.metadata.thumbnailText}
                        </span>
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                            <span className="bg-white text-black px-8 py-3 rounded-full font-black text-sm shadow-2xl flex items-center gap-2 tracking-widest">
                                {copied === 'm-thumb' ? <CheckIcon className="w-5 h-5" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                                CLICK TO COPY
                            </span>
                        </div>
                    </div>
                </section>
            </div>
        )}

        {activeTab === 'prompts' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-amber-500">이미지 갤러리</h3>
                    <p className="text-sm text-gray-500">스토리 흐름에 따른 {data.imagePrompts.length}개의 주요 장면</p>
                </div>
                <button 
                    onClick={handleGenerateAllImages}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-3 rounded-xl text-sm font-bold border border-gray-700 transition shadow-md"
                >
                    <PhotoIcon className="w-5 h-5" />
                    미생성 이미지 일괄 생성
                </button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {data.imagePrompts.map((item, idx) => (
                 <div key={idx} className="bg-gray-800/40 border border-gray-700/50 rounded-3xl overflow-hidden flex flex-col group transition-all hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10">
                    <div className="aspect-video bg-gray-950 relative flex items-center justify-center">
                      {generatedImages[idx] ? (
                        <>
                          <img src={generatedImages[idx]} alt={item.scene} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                             <a href={generatedImages[idx]} download={`scene_${idx+1}.png`} className="p-4 bg-amber-500 rounded-full text-white hover:scale-110 transition shadow-lg"><ArrowDownTrayIcon className="w-6 h-6" /></a>
                             <button onClick={() => handleGenerateImage(idx, item.prompt)} className="p-4 bg-gray-700 rounded-full text-white hover:scale-110 transition shadow-lg"><ArrowPathIcon className="w-6 h-6" /></button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6">
                           {isGeneratingImage[idx] ? (
                             <div className="flex flex-col items-center gap-3">
                               <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                               <span className="text-xs text-amber-500 font-black tracking-widest uppercase">Drawing...</span>
                             </div>
                           ) : (
                             <button onClick={() => handleGenerateImage(idx, item.prompt)} className="flex flex-col items-center gap-3 text-gray-600 hover:text-amber-500 transition-all transform hover:scale-105">
                               <PhotoIcon className="w-14 h-14" />
                               <span className="text-sm font-black">장면 {idx+1} 렌더링</span>
                             </button>
                           )}
                        </div>
                      )}
                    </div>
                    <div className="p-5 bg-gray-900/50 border-t border-gray-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-amber-600 uppercase tracking-tighter">장면 {idx+1}: {item.scene}</span>
                        <button onClick={() => handleCopy(item.prompt, `p-${idx}`)} className="text-gray-600 hover:text-white transition">
                            {copied === `p-${idx}` ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 italic line-clamp-2 leading-relaxed font-medium">{item.prompt}</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* ... Rest of tabs remain same ... */}
        {activeTab === 'raw-prompts' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-amber-500">일괄 프롬프트 추출</h3>
                </div>
                <button 
                    onClick={() => handleCopy(allPurePrompts, 'all-raw')}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-4 rounded-2xl text-sm font-black transition-all shadow-xl active:scale-95"
                >
                    {copied === 'all-raw' ? <CheckIcon className="w-6 h-6" /> : <DocumentDuplicateIcon className="w-6 h-6" />}
                    일괄 복사
                </button>
            </div>
            <div className="bg-gray-950 p-10 rounded-3xl border border-gray-800 font-mono text-sm leading-relaxed text-gray-400 h-[600px] overflow-y-auto scrollbar-thin shadow-inner">
                {data.imagePrompts.map((item, idx) => (
                    <div key={idx} className="mb-10 last:mb-0">
                        <div className="text-[10px] text-gray-600 font-black mb-2 uppercase tracking-[0.2em]">Scene {idx + 1}</div>
                        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800/50 select-all hover:bg-gray-800/80 transition-colors text-gray-300">
                            {item.prompt}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-amber-500">파이썬 자동화 배포 코드</h3>
                    <button 
                      onClick={() => handleCopy(data.pythonCode, 'py')} 
                      className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-lg transition active:scale-95"
                    >
                      {copied === 'py' ? <CheckIcon className="w-4 h-4" /> : <CommandLineIcon className="w-4 h-4" />}
                      코드 복사
                    </button>
                </div>
                <div className="relative group">
                    <pre className="p-8 bg-black rounded-3xl overflow-x-auto border border-gray-800 text-green-400 font-mono text-xs leading-relaxed shadow-2xl">
                        {data.pythonCode}
                    </pre>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
