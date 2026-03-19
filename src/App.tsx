import React, { useState, useEffect, useRef } from 'react';
import { Metronome } from './lib/metronome';
import { Save, Trash2, Play, Maximize, Minimize } from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  bpm: number;
  beatsPerMeasure: number;
  soundType: 'beep' | 'click' | 'woodblock';
}

export default function App() {
  const [bpm, setBpm] = useState<number | ''>(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [soundType, setSoundType] = useState<'beep' | 'click' | 'woodblock'>('beep');
  const [currentBeat, setCurrentBeat] = useState(0);

  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('metronome-presets');
    return saved ? JSON.parse(saved) : [];
  });
  const [presetName, setPresetName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const metronomeRef = useRef<Metronome | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    metronomeRef.current = new Metronome((beat) => {
      setCurrentBeat(beat);
    });
    return () => {
      metronomeRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (metronomeRef.current) {
      const safeBpm = typeof bpm === 'number' ? Math.max(10, Math.min(300, bpm)) : 120;
      metronomeRef.current.setTempo(safeBpm);
      metronomeRef.current.setBeatsPerMeasure(beatsPerMeasure);
      metronomeRef.current.setSoundType(soundType);
    }
  }, [bpm, beatsPerMeasure, soundType]);

  useEffect(() => {
    localStorage.setItem('metronome-presets', JSON.stringify(presets));
  }, [presets]);

  const togglePlay = () => {
    if (isPlaying) {
      metronomeRef.current?.stop();
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      metronomeRef.current?.start();
      setIsPlaying(true);
    }
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setBpm('');
      return;
    }
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setBpm(val);
    }
  };

  const handleBpmBlur = () => {
    if (bpm === '' || bpm < 10) {
      setBpm(10);
    } else if (bpm > 300) {
      setBpm(300);
    }
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    const safeBpm = typeof bpm === 'number' ? Math.max(10, Math.min(300, bpm)) : 120;
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      bpm: safeBpm,
      beatsPerMeasure,
      soundType,
    };
    setPresets([...presets, newPreset]);
    setPresetName('');
  };

  const loadPreset = (preset: Preset, shouldPlay: boolean = false) => {
    setBpm(preset.bpm);
    setBeatsPerMeasure(preset.beatsPerMeasure);
    setSoundType(preset.soundType);

    if (metronomeRef.current) {
      metronomeRef.current.setTempo(preset.bpm);
      metronomeRef.current.setBeatsPerMeasure(preset.beatsPerMeasure);
      metronomeRef.current.setSoundType(preset.soundType);
      
      if (shouldPlay && !isPlaying) {
        metronomeRef.current.start();
        setIsPlaying(true);
      }
    }
  };

  const deletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#F2EFE9] text-[#1A1A1A] font-sans p-4 sm:p-8 flex flex-col items-center justify-center selection:bg-[#E32636] selection:text-white">
      <div className="w-full max-w-md border-8 border-[#1A1A1A] bg-white p-6 sm:p-10 shadow-[16px_16px_0px_0px_#1A1A1A] relative my-8">
        
        {/* Decorative Bauhaus elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FFD700] rounded-full border-8 border-[#1A1A1A] pointer-events-none hidden sm:block"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#005A9C] border-8 border-[#1A1A1A] rotate-12 pointer-events-none hidden sm:block"></div>

        <div className="relative z-10 flex flex-col gap-8">
          
          {/* Header */}
          <div className="border-b-8 border-[#1A1A1A] pb-4 flex justify-between items-end">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase">
              Tempo
            </h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleFullscreen}
                className="p-2 border-4 border-[#1A1A1A] bg-white active:translate-y-1 transition-transform"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
              <div className="w-8 h-8 bg-[#E32636] rounded-full border-4 border-[#1A1A1A]"></div>
            </div>
          </div>

          {/* BPM Display & Input */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-baseline">
              <input
                type="number"
                value={bpm}
                onChange={handleBpmChange}
                onBlur={handleBpmBlur}
                className="text-7xl sm:text-8xl font-black text-center w-48 bg-transparent outline-none"
                min="10"
                max="300"
              />
              <span className="text-2xl font-bold uppercase tracking-widest absolute -right-12 bottom-4">BPM</span>
            </div>
          </div>

          {/* Slider */}
          <div className="py-4">
            <input
              type="range"
              min="10"
              max="300"
              value={bpm === '' ? 10 : bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
          </div>

          {/* Beat Indicators */}
          <div className="flex justify-center flex-wrap gap-3 sm:gap-4 py-4 min-h-[80px]">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <div
                key={i}
                className={`w-10 h-10 sm:w-12 sm:h-12 border-4 border-[#1A1A1A] transition-colors duration-75 ${
                  currentBeat === i && isPlaying
                    ? i === 0
                      ? 'bg-[#E32636]'
                      : 'bg-[#FFD700]'
                    : 'bg-white'
                } ${i === 0 ? 'rounded-full' : ''}`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase text-sm tracking-wider">Beats</label>
              <div className="relative">
                <select
                  value={beatsPerMeasure}
                  onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
                  className="w-full border-4 border-[#1A1A1A] p-3 font-bold bg-white appearance-none cursor-pointer rounded-none outline-none focus:bg-[#F2EFE9]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1A1A1A]"></div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase text-sm tracking-wider">Sound</label>
              <div className="relative">
                <select
                  value={soundType}
                  onChange={(e) => setSoundType(e.target.value as any)}
                  className="w-full border-4 border-[#1A1A1A] p-3 font-bold bg-white appearance-none cursor-pointer rounded-none outline-none focus:bg-[#F2EFE9]"
                >
                  <option value="beep">Beep</option>
                  <option value="click">Click</option>
                  <option value="woodblock">Woodblock</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1A1A1A]"></div>
              </div>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={togglePlay}
            className={`mt-2 py-5 border-8 border-[#1A1A1A] text-3xl sm:text-4xl font-black uppercase tracking-widest transition-all active:translate-y-2 active:shadow-none ${
              isPlaying
                ? 'bg-[#1A1A1A] text-white shadow-[8px_8px_0px_0px_#E32636]'
                : 'bg-[#E32636] text-white shadow-[8px_8px_0px_0px_#1A1A1A]'
            }`}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>

          {/* Presets Section */}
          <div className="mt-4 border-t-8 border-[#1A1A1A] pt-6 flex flex-col gap-4">
            <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-2">
              Presets
              <div className="w-4 h-4 bg-[#005A9C] border-4 border-[#1A1A1A] rotate-45"></div>
            </h2>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                placeholder="PRESET NAME"
                className="flex-1 border-4 border-[#1A1A1A] p-3 font-bold uppercase outline-none focus:bg-[#F2EFE9] placeholder:text-gray-400"
              />
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="bg-[#005A9C] text-white p-3 border-4 border-[#1A1A1A] disabled:opacity-50 active:translate-y-1 transition-transform"
                title="Save Preset"
              >
                <Save size={24} />
              </button>
            </div>

            {presets.length > 0 && (
              <div className="flex flex-col gap-3 mt-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {presets.map(preset => (
                  <div 
                    key={preset.id} 
                    onClick={() => loadPreset(preset, false)}
                    className="flex items-center justify-between border-4 border-[#1A1A1A] p-3 bg-white hover:bg-[#F2EFE9] transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-black uppercase text-lg truncate">{preset.name}</span>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        {preset.bpm} BPM • {preset.beatsPerMeasure}/4 • {preset.soundType}
                      </span>
                    </div>
                    <div className="flex gap-2 ml-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadPreset(preset, true);
                        }}
                        className="bg-[#FFD700] p-2 border-4 border-[#1A1A1A] active:translate-y-1 transition-transform"
                        title="Load and Play Preset"
                      >
                        <Play size={20} className="fill-current" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePreset(preset.id);
                        }}
                        className="bg-[#E32636] text-white p-2 border-4 border-[#1A1A1A] active:translate-y-1 transition-transform"
                        title="Delete Preset"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
