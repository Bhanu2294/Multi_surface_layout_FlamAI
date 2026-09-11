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

    // 1. Draw Theme Background Gradient
    if (surface.theme === 'light') {
      const grad = ctx.createLinearGradient(0, 0, surface.width, surface.height);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = grad;
    } else if (surface.theme === 'vibrant') {
      const grad = ctx.createLinearGradient(0, 0, surface.width, surface.height);
      grad.addColorStop(0, '#3b0764');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createLinearGradient(0, 0, surface.width, surface.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
    }
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

    const isLight = surface.theme === 'light';

    // 3. Render Visible Elements
    const visibleEls = elements.filter(e => e.visible);

    for (const el of visibleEls) {
      ctx.save();

      if (el.type === 'button') {
        // Draw Button Gradient Background
        const btnGrad = ctx.createLinearGradient(el.x, el.y, el.x + el.width, el.y);
        btnGrad.addColorStop(0, '#06b6d4');
        btnGrad.addColorStop(0.5, '#2563eb');
        btnGrad.addColorStop(1, '#4f46e5');
        ctx.fillStyle = btnGrad;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, 8);
        ctx.fill();

        // Button Border Accent
        ctx.strokeStyle = 'rgba(165, 243, 252, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const btnFontSize = Math.min(el.fontSize || 15, Math.max(11, el.height * 0.35));

        // Button Main Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${btnFontSize}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = el.subText && el.height >= 42 ? 'top' : 'middle';
        const mainY = el.subText && el.height >= 42 ? el.y + 7 : el.y + el.height / 2;
        ctx.fillText(el.content, el.x + el.width / 2, mainY);

        // Button Subtext
        if (el.subText && el.height >= 42 && el.width >= 110) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = `normal 9.5px 'Plus Jakarta Sans', sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(el.subText, el.x + el.width / 2, mainY + btnFontSize + 3);
        }

      } else if (el.type === 'badge') {
        ctx.fillStyle = isLight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.2)';
        ctx.strokeStyle = isLight ? '#06b6d4' : 'rgba(34, 211, 238, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isLight ? '#0891b2' : '#22d3ee';
        ctx.font = `bold 10.5px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content, el.x + el.width / 2, el.y + el.height / 2);

      } else if (el.type === 'image') {
        // Draw Image Frame
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, 8);
        ctx.clip();

        if (el.url) {
          const img = new Image();
          img.src = el.url;
          if (img.complete) {
            ctx.drawImage(img, el.x, el.y, el.width, el.height);
          } else {
            // Placeholder while loading
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(el.x, el.y, el.width, el.height);
            img.onload = () => {
              // Trigger re-render once image finishes loading
              const canvas = canvasRef.current;
              if (canvas) {
                const cCtx = canvas.getContext('2d');
                if (cCtx) {
                  cCtx.save();
                  cCtx.scale(dpr, dpr);
                  cCtx.beginPath();
                  cCtx.roundRect(el.x, el.y, el.width, el.height, 8);
                  cCtx.clip();
                  cCtx.drawImage(img, el.x, el.y, el.width, el.height);
                  cCtx.restore();
                }
              }
            };
          }
        }
        ctx.restore();

        // Image Card Border
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, 8);
        ctx.stroke();

      } else {
        // Text (Headline, Price with Subtext, Tagline)
        if (el.role === 'secondary' && el.subText) {
          // Price + Subtext
          const priceFontSize = (el.fontSize || 16) * 1.1;
          ctx.fillStyle = isLight ? '#0e7490' : '#38bdf8';
          ctx.font = `900 ${priceFontSize}px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(el.content, el.x + el.width / 2, el.y + 2);

          ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
          ctx.font = `600 10px 'Plus Jakarta Sans', sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(el.subText, el.x + el.width / 2, el.y + priceFontSize + 4);

        } else {
          // Headline or Tagline (with Canvas Word-Wrapping)
          const isPrimary = el.role === 'primary';
          const fontSize = el.fontSize || 16;
          const lineHeight = fontSize * 1.3;

          ctx.fillStyle = isPrimary
            ? isLight ? '#020617' : '#f8fafc'
            : isLight ? '#1e293b' : '#cbd5e1';
          ctx.font = `${isPrimary ? 'bold' : '500'} ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Measure and wrap text to fit within el.width
          const words = el.content.split(' ');
          const lines: string[] = [];
          let currentLine = '';

          for (let i = 0; i < words.length; i++) {
            const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > el.width && currentLine) {
              lines.push(currentLine);
              currentLine = words[i];
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
          }

          const totalTextHeight = lines.length * lineHeight;
          let drawY = (el.y + el.height / 2) - (totalTextHeight / 2) + (lineHeight / 2);

          for (const line of lines) {
            ctx.fillText(line, el.x + el.width / 2, drawY);
            drawY += lineHeight;
          }
        }
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
