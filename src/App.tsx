import { useState, useMemo, useRef, useEffect } from 'react';
import { presetSurfaces } from './surfaces';
import { sampleAdSpec } from './spec';
import { resolveLayout } from './resolver';
import { RenderDom } from './render-dom';
import { RenderCanvas } from './render-canvas';
import { SurfaceProfile } from './types';
import {
  Smartphone,
  Sparkles,
  Layers,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Settings2,
  MonitorPlay,
  Maximize2
} from 'lucide-react';

export function App() {
  const [selectedSurfaceId, setSelectedSurfaceId] = useState<string>('mobilePortrait');
  const [rendererMode, setRendererMode] = useState<'dom' | 'canvas'>('dom');
  const [showDebugBounds, setShowDebugBounds] = useState<boolean>(true);
  
  // Mobile Tab Navigation ('surfaces' | 'stage' | 'inspector')
  const [activeMobileTab, setActiveMobileTab] = useState<'surfaces' | 'stage' | 'inspector'>('stage');

  // Auto & Manual Scaling State
  const [scaleMode, setScaleMode] = useState<'auto' | 'manual'>('auto');
  const [manualScale, setManualScale] = useState<number>(0.85);
  const [autoScale, setAutoScale] = useState<number>(0.85);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);

  // Custom Surface State for live 5th surface creation
  const [customSurface, setCustomSurface] = useState<SurfaceProfile>({
    id: 'customSurface',
    name: 'Live Custom Surface',
    description: 'Custom surface parameters adjusted on-the-fly during interview demo.',
    width: 800,
    height: 400,
    safeArea: { top: 20, right: 20, bottom: 20, left: 20 },
    minTapTarget: 48,
    minTextSize: 18,
    viewingDistance: 'medium',
    touchOnly: true,
    theme: 'dark',
  });

  const [isCustomActive, setIsCustomActive] = useState<boolean>(false);

  // Active Surface Profile
  const activeSurface: SurfaceProfile = useMemo(() => {
    if (isCustomActive) return customSurface;
    return presetSurfaces[selectedSurfaceId] || presetSurfaces.mobilePortrait;
  }, [isCustomActive, customSurface, selectedSurfaceId]);

  // Compute Layout via Engine Resolver
  const resolvedLayout = useMemo(() => {
    return resolveLayout(sampleAdSpec, activeSurface);
  }, [activeSurface]);

  // Dynamic Auto-Scaling Effect
  useEffect(() => {
    const calculateScale = () => {
      const container = stageContainerRef.current;
      if (!container) return;

      const padding = window.innerWidth < 640 ? 16 : 48;
      const availW = container.clientWidth - padding;
      const availH = container.clientHeight - padding;

      if (availW <= 0 || availH <= 0) return;

      const scaleX = availW / activeSurface.width;
      const scaleY = availH / activeSurface.height;

      // Fit to container, max scale 1.0
      const computedScale = Math.min(1.0, Math.min(scaleX, scaleY));
      setAutoScale(Math.max(0.15, Number(computedScale.toFixed(3))));
    };

    calculateScale();

    const observer = new ResizeObserver(calculateScale);
    if (stageContainerRef.current) {
      observer.observe(stageContainerRef.current);
    }

    window.addEventListener('resize', calculateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [activeSurface, scaleMode, activeMobileTab]);

  const currentScale = scaleMode === 'auto' ? autoScale : manualScale;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 lg:px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base md:text-lg tracking-tight text-white flex items-center gap-2">
              Flam Adaptive Layout Engine
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
                v1.0.0
              </span>
            </h1>
            <p className="text-[11px] md:text-xs text-slate-400">Multi-Surface Ad Spec Constraint Resolver</p>
          </div>
        </div>

        {/* Global Controls & Render Mode Toggle */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2 sm:gap-3 flex-wrap">
          {/* Renderer Backend Selector */}
          <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex items-center text-xs font-medium">
            <button
              onClick={() => setRendererMode('dom')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                rendererMode === 'dom' ? 'bg-cyan-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> DOM <span className="hidden sm:inline">Renderer</span>
            </button>
            <button
              onClick={() => setRendererMode('canvas')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                rendererMode === 'canvas' ? 'bg-cyan-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MonitorPlay className="w-3.5 h-3.5" /> Canvas <span className="hidden sm:inline">Backend</span>
            </button>
          </div>

          {/* Debug Overlay Toggle */}
          <button
            onClick={() => setShowDebugBounds(!showDebugBounds)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showDebugBounds
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Bounds {showDebugBounds ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      {/* Mobile Tab Navigation Bar (Visible only on screens < 1024px) */}
      <div className="flex lg:hidden bg-slate-900 border-b border-slate-800 p-1">
        <button
          onClick={() => setActiveMobileTab('surfaces')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === 'surfaces' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
          }`}
        >
          <Smartphone className="w-4 h-4" /> Surfaces
        </button>
        <button
          onClick={() => setActiveMobileTab('stage')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === 'stage' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
          }`}
        >
          <Activity className="w-4 h-4" /> Ad Stage
        </button>
        <button
          onClick={() => setActiveMobileTab('inspector')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === 'inspector' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
          }`}
        >
          <Sliders className="w-4 h-4" /> Inspector
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar: Surface Presets & Custom Surface Creator */}
        <aside
          className={`${
            activeMobileTab === 'surfaces' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-80 border-r border-slate-800 bg-slate-900/50 p-4 flex-col gap-6 overflow-y-auto shrink-0`}
        >
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" /> Target Surface Profiles
            </h2>
            <div className="space-y-2">
              {Object.values(presetSurfaces).map(surf => {
                const isActive = !isCustomActive && selectedSurfaceId === surf.id;
                return (
                  <button
                    key={surf.id}
                    onClick={() => {
                      setIsCustomActive(false);
                      setSelectedSurfaceId(surf.id);
                      setActiveMobileTab('stage'); // Auto-switch to stage preview on mobile selection
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{surf.name}</span>
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        {surf.width}x{surf.height}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{surf.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Surface Profile Live Tweaker */}
          <div className="border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-400" /> Live Custom Surface (5th Surface)
              </h2>
              <button
                onClick={() => {
                  setIsCustomActive(true);
                  setActiveMobileTab('stage');
                }}
                className={`text-xs px-2 py-0.5 rounded font-medium border ${
                  isCustomActive ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isCustomActive ? 'Active' : 'Enable'}
              </button>
            </div>

            <div className="space-y-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-slate-400 font-medium flex justify-between mb-1">
                  Width: <span className="text-amber-400 font-mono font-bold">{customSurface.width}px</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="1920"
                  value={customSurface.width}
                  onChange={e => {
                    setIsCustomActive(true);
                    setCustomSurface({ ...customSurface, width: Number(e.target.value) });
                  }}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium flex justify-between mb-1">
                  Height: <span className="text-amber-400 font-mono font-bold">{customSurface.height}px</span>
                </label>
                <input
                  type="range"
                  min="80"
                  max="1200"
                  value={customSurface.height}
                  onChange={e => {
                    setIsCustomActive(true);
                    setCustomSurface({ ...customSurface, height: Number(e.target.value) });
                  }}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium flex justify-between mb-1">
                  Min Tap Target: <span className="text-amber-400 font-mono font-bold">{customSurface.minTapTarget}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={customSurface.minTapTarget || 0}
                  onChange={e => {
                    setIsCustomActive(true);
                    setCustomSurface({ ...customSurface, minTapTarget: Number(e.target.value) });
                  }}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium flex justify-between mb-1">
                  Min Text Size: <span className="text-amber-400 font-mono font-bold">{customSurface.minTextSize}px</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={customSurface.minTextSize || 12}
                  onChange={e => {
                    setIsCustomActive(true);
                    setCustomSurface({ ...customSurface, minTextSize: Number(e.target.value) });
                  }}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Center Preview Stage */}
        <main
          className={`${
            activeMobileTab === 'stage' ? 'flex' : 'hidden'
          } lg:flex flex-1 bg-slate-950 p-3 sm:p-6 flex-col items-center justify-between overflow-auto relative`}
        >
          {/* Stage Metrics Control Bar */}
          <div className="w-full max-w-4xl flex flex-wrap items-center justify-between bg-slate-900/60 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 mb-3 sm:mb-4 gap-2 backdrop-blur-sm">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <Activity className="w-4 h-4 text-cyan-400" /> Stage:
              </span>
              <span className="font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded text-[11px]">
                {activeSurface.width} x {activeSurface.height} px
              </span>
              <span className="font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded uppercase text-[11px]">
                {resolvedLayout.orientation}
              </span>
            </div>

            {/* Auto & Manual Scale Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setScaleMode('auto')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  scaleMode === 'auto'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" /> Auto-Fit ({Math.round(autoScale * 100)}%)
              </button>

              <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

              {[0.5, 0.75, 1.0].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setScaleMode('manual');
                    setManualScale(s);
                  }}
                  className={`px-2 py-1 text-xs font-mono rounded transition-all hidden sm:inline-block ${
                    scaleMode === 'manual' && manualScale === s
                      ? 'bg-slate-700 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s * 100}%
                </button>
              ))}
            </div>
          </div>

          {/* Ad Renderer Display Stage (Ref for Auto-Scaling) */}
          <div ref={stageContainerRef} className="flex-1 w-full flex items-center justify-center relative p-2 sm:p-4 overflow-hidden min-h-[320px]">
            <div
              style={{
                transform: `scale(${currentScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {rendererMode === 'dom' ? (
                <RenderDom layout={resolvedLayout} showDebugBounds={showDebugBounds} />
              ) : (
                <RenderCanvas layout={resolvedLayout} showDebugBounds={showDebugBounds} />
              )}
            </div>
          </div>

          {/* Engine Performance Footer */}
          <div className="w-full max-w-4xl bg-slate-900/60 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 backdrop-blur-sm gap-2">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-[11px] sm:text-xs">
              <span>Time: <strong className="text-emerald-400 font-mono">{resolvedLayout.resolutionTimeMs} ms</strong></span>
              <span>Usable Bounds: <strong className="text-slate-200 font-mono">{Math.round(resolvedLayout.usableWidth)}x{Math.round(resolvedLayout.usableHeight)} px</strong></span>
            </div>
            <div className="text-[11px] sm:text-xs">
              <span>Scale: <strong className="text-cyan-400 font-mono">{Math.round(currentScale * 100)}% ({scaleMode})</strong></span>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Resolution Inspector & Degradation Logs */}
        <aside
          className={`${
            activeMobileTab === 'inspector' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-96 border-l border-slate-800 bg-slate-900/50 p-4 flex-col gap-5 overflow-y-auto shrink-0`}
        >
          {/* Surface Constraints Inspector */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" /> Active Surface Constraints
            </h2>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Safe Area Top/Bottom:</span>
                <span className="text-slate-200">{activeSurface.safeArea?.top || 0}px / {activeSurface.safeArea?.bottom || 0}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Safe Area Left/Right:</span>
                <span className="text-slate-200">{activeSurface.safeArea?.left || 0}px / {activeSurface.safeArea?.right || 0}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Min Tap Target:</span>
                <span className="text-cyan-400 font-bold">{activeSurface.minTapTarget || 0} px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Min Text Size:</span>
                <span className="text-cyan-400 font-bold">{activeSurface.minTextSize || 12} px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Viewing Distance:</span>
                <span className="text-purple-400 capitalize">{activeSurface.viewingDistance || 'near'}</span>
              </div>
            </div>
          </div>

          {/* Degradation Log */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Priority Degradation Log
            </h2>
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2 max-h-44 overflow-y-auto">
              {resolvedLayout.degradationLog.length === 0 ? (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No elements degraded or dropped. Full priority layout satisfied.</span>
                </div>
              ) : (
                resolvedLayout.degradationLog.map((log, i) => (
                  <div key={i} className="text-xs text-amber-300/90 flex items-start gap-1.5 leading-relaxed bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Resolved Element Geometry Inspector */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Resolved Elements ({resolvedLayout.elements.length})
            </h2>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {resolvedLayout.elements.map(el => (
                <div
                  key={el.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    !el.visible
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                      : el.degraded
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${!el.visible ? 'bg-rose-500' : el.degraded ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span className="font-bold font-mono">{el.id}</span>
                      <span className="text-[9px] font-mono px-1 py-0.5 bg-slate-800 rounded text-slate-400">P{el.priority}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {el.visible ? `${Math.round(el.width)}x${Math.round(el.height)} px` : 'DROPPED'}
                    </span>
                  </div>
                  {el.visible ? (
                    <div className="text-[10px] font-mono text-slate-400 flex justify-between mt-1">
                      <span>Pos: ({Math.round(el.x)}, {Math.round(el.y)})</span>
                      {el.fontSize && <span>Font: {el.fontSize}px</span>}
                    </div>
                  ) : (
                    <p className="text-[10px] text-rose-400 mt-1 italic">{el.degradationReason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
