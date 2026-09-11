import React, { useEffect, useRef } from 'react';
import { ResolvedLayout } from './types';

interface RenderCanvasProps {
  layout: ResolvedLayout;
  showDebugBounds?: boolean;
}

export const RenderCanvas: React.FC<RenderCanvasProps> = ({ layout, showDebugBounds = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { surface, elements } = layout;
  const safeArea = surface.safeArea || { top: 0, right: 0, bottom: 0, left: 0 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = surface.width * dpr;
    canvas.height = surface.height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Draw Background
    ctx.fillStyle = surface.theme === 'light' ? '#f1f5f9' : '#0f172a';
    ctx.fillRect(0, 0, surface.width, surface.height);

    // 2. Draw Safe Area Guide when Debug Mode ON
    if (showDebugBounds) {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(
        safeArea.left,
        safeArea.top,
        surface.width - safeArea.left - safeArea.right,
        surface.height - safeArea.top - safeArea.bottom
      );
      ctx.setLineDash([]);
    }

    // 3. Render Visible Elements
    const visibleEls = elements.filter(e => e.visible);

    for (const el of visibleEls) {
      ctx.save();

      if (el.type === 'button') {
        // Draw Button Background
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, 8);
        ctx.fill();

        // Button Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${el.fontSize || 16}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content, el.x + el.width / 2, el.y + el.height / 2);

      } else if (el.type === 'badge') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#22d3ee';
        ctx.font = `bold 11px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content, el.x + el.width / 2, el.y + el.height / 2);

      } else if (el.type === 'image') {
        // Draw Image Placeholder / Card Frame
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = `bold ${Math.max(12, Math.round(el.fontSize || 14))}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`[Image: ${el.content}]`, el.x + el.width / 2, el.y + el.height / 2);

      } else {
        // Text
        const isPrimary = el.role === 'primary';
        ctx.fillStyle = isPrimary ? '#f8fafc' : el.role === 'secondary' && el.subText ? '#38bdf8' : '#cbd5e1';
        ctx.font = `${isPrimary ? 'bold' : '500'} ${el.fontSize || 16}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content, el.x + el.width / 2, el.y + el.height / 2);
      }

      // Draw Debug Bounding Box Overlay
      if (showDebugBounds) {
        ctx.strokeStyle = el.priority === 1 ? '#10b981' : el.priority === 2 ? '#f59e0b' : '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(el.x, el.y, el.width, el.height);

        ctx.fillStyle = '#020617';
        ctx.fillRect(el.x, el.y, 70, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = `9px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`${el.id} (P${el.priority})`, el.x + 2, el.y + 2);
      }

      ctx.restore();
    }
  }, [layout, surface, elements, showDebugBounds, safeArea]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl shadow-2xl border border-slate-800 transition-all duration-300"
      style={{
        width: `${surface.width}px`,
        height: `${surface.height}px`,
      }}
    />
  );
};
