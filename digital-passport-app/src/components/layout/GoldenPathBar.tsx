import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  RotateCcw,
  CheckCircle2,
  Compass,
  Zap
} from 'lucide-react';
import { STORYBOARD_SCENES, STORYBOARD_CHAPTERS } from '../../data/storyboardScenes';

interface GoldenPathBarProps {
  activeScenario: 'steel' | 'cocoa';
  onScenarioChange: (scenario: 'steel' | 'cocoa') => void;
}

export const GoldenPathBar: React.FC<GoldenPathBarProps> = ({
  activeScenario,
  onScenarioChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [autoNav, setAutoNav] = useState<boolean>(true);

  const scene = STORYBOARD_SCENES[currentSceneIdx] || STORYBOARD_SCENES[0];
  const totalScenes = STORYBOARD_SCENES.length;

  // Synchronize current scene indicator when route changes externally via sidebar/navigation
  useEffect(() => {
    if (activeScenario === 'steel') {
      const fullUrl = location.pathname + location.search;
      const matchIdx = STORYBOARD_SCENES.findIndex((s) => {
        if (s.route === fullUrl) return true;
        // Fallback matching for base paths without query strings
        if (location.pathname === '/organisation' && location.search === '' && s.route === '/organisation?tab=profile') return true;
        if (location.pathname === '/data' && location.search === '' && s.route === '/data?tab=telemetry') return true;
        if (location.pathname === '/emissions' && location.search === '' && s.route === '/emissions?tab=factors') return true;
        if (location.pathname === '/pcf' && location.search === '' && s.route === '/pcf?tab=projects') return true;
        if (location.pathname === '/government' && location.search === '' && s.route === '/government?tab=overview') return true;
        if (location.pathname === '/cbam' && location.search === '' && s.route === '/cbam?tab=overview') return true;
        if (location.pathname === '/admin' && location.search === '' && s.route === '/admin?tab=architecture') return true;
        if (!s.route.includes('?') && s.route === location.pathname) return true;
        return false;
      });
      if (matchIdx !== -1 && matchIdx !== currentSceneIdx) {
        setCurrentSceneIdx(matchIdx);
      }
    }
  }, [location.pathname, location.search, activeScenario]);

  // Handle auto-play timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSceneIdx((prev) => {
          if (prev < totalScenes - 1) {
            const nextIdx = prev + 1;
            if (autoNav && activeScenario === 'steel') {
              navigate(STORYBOARD_SCENES[nextIdx].route);
            }
            return nextIdx;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 7000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, totalScenes, autoNav, activeScenario, navigate]);

  const handleNext = () => {
    if (currentSceneIdx < totalScenes - 1) {
      const nextIdx = currentSceneIdx + 1;
      setCurrentSceneIdx(nextIdx);
      if (autoNav && activeScenario === 'steel') {
        navigate(STORYBOARD_SCENES[nextIdx].route);
      }
    }
  };

  const handlePrev = () => {
    if (currentSceneIdx > 0) {
      const prevIdx = currentSceneIdx - 1;
      setCurrentSceneIdx(prevIdx);
      if (autoNav && activeScenario === 'steel') {
        navigate(STORYBOARD_SCENES[prevIdx].route);
      }
    }
  };

  const handleSelectScene = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx) && idx >= 0 && idx < totalScenes) {
      setCurrentSceneIdx(idx);
      if (autoNav && activeScenario === 'steel') {
        navigate(STORYBOARD_SCENES[idx].route);
      }
    }
  };

  const handlePrimaryAction = () => {
    handleNext();
  };

  return (
    <div className="bg-[#0A111F] text-white border-b border-emerald-500/30 shadow-xl relative z-30 transition-all duration-300">
      {/* Top Controller Strip */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs border-b border-slate-800">
        {/* Left: Brand & Storyboard Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>GOLDEN PATH DEMO</span>
          </div>

          {/* Scenario Selector Switcher */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700/80">
            <button
              onClick={() => {
                onScenarioChange('steel');
                if (autoNav) navigate(scene.route);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeScenario === 'steel'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Steel Coil (ST-2026-00981)
            </button>
            <button
              onClick={() => onScenarioChange('cocoa')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeScenario === 'cocoa'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cocoa Butter (CB-2026-001)
            </button>
          </div>
        </div>

        {/* Center: Scene Jump & Chapter Progress */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-slate-400 text-[11px] font-mono hidden sm:inline">
            Scene {scene.id} of {totalScenes}
          </span>

          <select
            value={currentSceneIdx}
            onChange={handleSelectScene}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none max-w-[220px] sm:max-w-[280px]"
          >
            {STORYBOARD_CHAPTERS.map((ch) => (
              <optgroup key={ch.id} label={`${ch.name} (${ch.range})`}>
                {STORYBOARD_SCENES.filter((s) => s.chapter === ch.name).map((s) => (
                  <option key={s.id} value={s.id - 1}>
                    {s.code}: {s.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={handlePrev}
              disabled={currentSceneIdx === 0}
              className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 transition-colors"
              title="Previous Scene"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                isPlaying ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'hover:bg-slate-800 text-slate-200'
              }`}
              title={isPlaying ? 'Pause Auto-Play' : 'Play Presentation Mode'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span className="hidden md:inline">{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentSceneIdx === totalScenes - 1}
              className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 transition-colors"
              title="Next Scene"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Auto-Nav & Expand Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAutoNav(!autoNav)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 ${
              autoNav 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Auto-Navigate screen routes on scene change"
          >
            <Compass className="w-3 h-3" />
            <span className="hidden lg:inline">{autoNav ? 'Auto-Route On' : 'Auto-Route Off'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isExpanded ? 'Collapse Presenter Notes' : 'Expand Presenter Notes'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-slate-800 h-1">
        <div
          className="bg-emerald-500 h-1 transition-all duration-300"
          style={{ width: `${((currentSceneIdx + 1) / totalScenes) * 100}%` }}
        />
      </div>

      {/* Expandable Narration & Presenter Script Panel */}
      {isExpanded && activeScenario === 'steel' && (
        <div className="px-5 py-3 bg-[#080D18] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80">
          {/* Presenter Narration Text */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400">
              <span className="px-1.5 py-0.5 bg-emerald-500/20 rounded font-mono uppercase tracking-wider">
                {scene.code}
              </span>
              <span className="text-white font-bold">{scene.title}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{scene.chapter}</span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-normal flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>"{scene.narration}"</span>
            </p>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span className="font-semibold text-slate-300">Key Metric / Focus:</span>
              <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {scene.metric}
              </span>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={handlePrimaryAction}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <span>{scene.primaryAction}</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
