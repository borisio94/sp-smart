"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Point d'un tracé, en coordonnées CSS (indépendantes du zoom écran). */
interface Point {
  x: number;
  y: number;
}

interface Props {
  /**
   * Remonte le PNG du tracé (data URL) à la fin de chaque trait, ou `null`
   * quand la zone est vide. Le parent n'a ainsi aucune ref à manipuler.
   */
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
  /** Libellé du bouton d'effacement (fourni par l'appelant, jamais en dur ici). */
  clearLabel: string;
  /** Texte d'aide affiché en filigrane tant que rien n'est tracé. */
  placeholder: string;
}

// Épaisseur du trait et couleur de l'encre (rendu « stylo »).
const STROKE_WIDTH = 2.2;
const INK = "#111827";

/**
 * Zone de signature manuscrite : le signataire trace au doigt (mobile) ou à la
 * souris. Les tracés sont conservés sous forme de points puis redessinés à
 * chaque redimensionnement, ce qui évite de perdre la signature quand la
 * largeur du conteneur change (rotation de l'écran par exemple).
 */
export function SignaturePad({
  onChange,
  disabled = false,
  clearLabel,
  placeholder,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>([]);
  const drawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  /** Redessine l'intégralité des tracés (après resize ou effacement). */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Le buffer suit la densité de pixels de l'écran (tracé net sur mobile).
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = INK;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes.current) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      // Un point isolé (simple tap) se rend par un petit disque.
      if (stroke.length === 1) {
        ctx.arc(stroke[0].x, stroke[0].y, STROKE_WIDTH / 2, 0, Math.PI * 2);
        ctx.fillStyle = INK;
        ctx.fill();
        continue;
      }
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  }, []);

  // Adapte le buffer à la taille réelle du conteneur, au montage et au resize.
  useEffect(() => {
    redraw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => redraw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redraw]);

  /** Publie l'état courant du tracé auprès du parent. */
  const publish = useCallback(() => {
    const empty = strokes.current.length === 0;
    setIsEmpty(empty);
    onChange(empty ? null : (canvasRef.current?.toDataURL("image/png") ?? null));
  }, [onChange]);

  const pointFrom = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    strokes.current.push([pointFrom(event)]);
    redraw();
    if (isEmpty) setIsEmpty(false);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    const stroke = strokes.current[strokes.current.length - 1];
    stroke.push(pointFrom(event));
    redraw();
  };

  // Le PNG n'est produit qu'à la fin d'un trait (jamais à chaque déplacement).
  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    publish();
  };

  const clear = useCallback(() => {
    strokes.current = [];
    redraw();
    publish();
  }, [redraw, publish]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg border border-dashed border-foreground/25 bg-white">
        <canvas
          ref={canvasRef}
          // `touch-none` : le doigt trace au lieu de faire défiler la page.
          className="block h-40 w-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {isEmpty ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
            {placeholder}
          </p>
        ) : null}
        {/* Ligne de base, repère visuel comme sur un document papier. */}
        <div className="pointer-events-none absolute inset-x-6 bottom-6 border-b border-neutral-300" />
      </div>
      <div className="mt-1 flex justify-end">
        <button
          type="button"
          onClick={clear}
          disabled={disabled || isEmpty}
          className="text-xs text-muted-foreground underline underline-offset-2 disabled:opacity-40"
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}
