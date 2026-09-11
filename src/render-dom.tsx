import React from 'react';
import { ResolvedLayout, ResolvedElement } from './types';

interface RenderDomProps {
  layout: ResolvedLayout;
  showDebugBounds?: boolean;
}

export const RenderDom: React.FC<RenderDomProps> = ({ layout, showDebugBounds = false }) => {
  const { surface, elements } = layout;
  const safeArea = surface.safeArea || { top: 0, right: 0, bottom: 0, left: 0 };
  const visibleElements = elements.filter(e => e.visible);

  const getThemeClasses = () => {
    switch (surface.theme) {
      case 'light':
        return 'bg-slate-50 text-slate-900 border-slate-300 shadow-slate-200';
      case 'vibrant':
        return 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white border-purple-500/40';
      case 'dark':
      default:
        return 'bg-slate-900 text-white border-slate-800';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border shadow-2xl transition-all duration-300 ${getThemeClasses()}`}
      style={{
        width: `${surface.width}px`,
        height: `${surface.height}px`,
      }}
    >
      {/* Safe Area Guide Overlay when Debug Mode is ON */}
      {showDebugBounds && (
        <div
          className="absolute border-2 border-dashed border-cyan-400/40 pointer-events-none z-40"
          style={{
            top: `${safeArea.top}px`,
            right: `${safeArea.right}px`,
            bottom: `${safeArea.bottom}px`,
            left: `${safeArea.left}px`,
          }}
        >
          <span className="absolute top-1 left-2 text-[10px] font-mono text-cyan-500 bg-cyan-950/90 px-1 rounded border border-cyan-400/50">
            Safe Area ({safeArea.top}px t, {safeArea.bottom}px b, {safeArea.left}px l, {safeArea.right}px r)
          </span>
        </div>
      )}

      {/* Rendered Ad Elements */}
      {visibleElements.map(el => (
        <DomElementItem key={el.id} element={el} theme={surface.theme} showDebugBounds={showDebugBounds} />
      ))}
    </div>
  );
};

interface DomElementItemProps {
  element: ResolvedElement;
  theme?: 'dark' | 'light' | 'vibrant';
  showDebugBounds: boolean;
}

const DomElementItem: React.FC<DomElementItemProps> = ({ element, theme, showDebugBounds }) => {
  const isLight = theme === 'light';

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    fontSize: element.fontSize ? `${element.fontSize}px` : undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    overflow: 'hidden',
  };

  const getDebugColor = () => {
    switch (element.priority) {
      case 1: return 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
      case 2: return 'border-amber-500 bg-amber-500/10 text-amber-300';
      case 3: return 'border-purple-500 bg-purple-500/10 text-purple-300';
    }
  };

  const renderContent = () => {
    switch (element.type) {
      case 'image':
        return (
          <div className="w-full h-full relative group overflow-hidden rounded-lg flex items-center justify-center">
            <img
              src={element.url}
              alt={element.content}
              className="w-full h-full object-cover rounded-lg shadow-md transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none rounded-lg" />
          </div>
        );

      case 'button':
        return (
          <button
            className="w-full h-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center px-2 py-1 border border-cyan-300/30 cursor-pointer overflow-hidden leading-tight"
            style={{ fontSize: `${Math.min(element.fontSize || 15, Math.max(11, element.height * 0.35))}px` }}
          >
            <span className="truncate w-full text-center leading-tight font-bold">{element.content}</span>
            {element.subText && element.height >= 42 && element.width >= 120 && (
              <span className="text-[10px] opacity-90 font-normal tracking-wide truncate w-full text-center leading-tight">
                {element.subText}
              </span>
            )}
          </button>
        );

      case 'badge':
        return (
          <div className={`px-2.5 py-0.5 ${isLight ? 'bg-cyan-100 text-cyan-900 border-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'} border rounded-full font-bold text-[10.5px] tracking-wide uppercase shadow-sm truncate max-w-full text-center leading-none`}>
            {element.content}
          </div>
        );

      case 'text':
      default:
        if (element.role === 'primary') {
          return (
            <h1
              className={`font-extrabold tracking-tight leading-tight text-center ${isLight ? 'text-slate-950 font-black' : 'text-slate-100'} drop-shadow-sm w-full max-h-full overflow-hidden px-1`}
              style={{ fontSize: `${element.fontSize}px` }}
            >
              {element.content}
            </h1>
          );
        }
        if (element.role === 'secondary' && element.subText) {
          // Price with subtext
          return (
            <div className="flex flex-col items-center justify-center text-center w-full h-full py-0 leading-none">
              <span className={`font-black tracking-tight leading-none ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} style={{ fontSize: `${(element.fontSize || 16) * 1.1}px` }}>
                {element.content}
              </span>
              <span className={`${isLight ? 'text-slate-700 font-bold' : 'text-slate-300 font-semibold'} text-[10px] tracking-tight truncate w-full leading-tight mt-0.5`}>
                {element.subText}
              </span>
            </div>
          );
        }
        return (
          <p
            className={`${isLight ? 'text-slate-800 font-semibold' : 'text-slate-300 font-medium'} text-center leading-snug w-full max-h-full overflow-hidden px-1`}
            style={{ fontSize: `${element.fontSize}px` }}
          >
            {element.content}
          </p>
        );
    }
  };

  return (
    <div style={style}>
      {renderContent()}

      {/* Debug Box Overlay */}
      {showDebugBounds && (
        <div className={`absolute inset-0 border-2 border-dashed pointer-events-none rounded ${getDebugColor()} z-50 flex items-start justify-between p-0.5`}>
          <span className="text-[9px] font-mono font-bold bg-slate-950/90 text-white px-1 rounded shadow">
            {element.id} (P{element.priority})
          </span>
          <span className="text-[9px] font-mono bg-slate-950/90 text-white px-1 rounded shadow">
            {Math.round(element.width)}x{Math.round(element.height)}
          </span>
        </div>
      )}
    </div>
  );
};
