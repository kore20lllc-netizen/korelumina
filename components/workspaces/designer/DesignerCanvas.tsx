import { useCallback, useEffect, useRef, useState } from "react";
import { Type, MousePointer2, Image as ImageIcon, Square as SquareIcon, Sparkles } from "lucide-react";
import { useCanvas, type CanvasElement } from "./canvasStore";
import { cn } from "@/lib/utils";

const SNAP = 6; // px snap threshold
const SPACING_SNAP = 8; // px threshold for equal-spacing snap

type DragState = {
  ids: string[];
  startX: number;
  startY: number;
  origin: Record<string, { x: number; y: number }>;
};

type Marquee = { x: number; y: number; w: number; h: number };

interface Guide { axis: "x" | "y"; pos: number; from: number; to: number }

/** Ghost preview rectangle for pending distribution targets. */
interface Ghost { id: string; x: number; y: number; w: number; h: number; label: string }

/** Distribution marker: drawn between two elements showing equal gap. */
interface SpacingMarker {
  axis: "x" | "y";  // "x" = horizontal gap (elements side-by-side), "y" = vertical gap (stacked)
  start: number;    // along the gap axis
  end: number;      // along the gap axis
  cross: number;    // perpendicular position (the shared baseline / midline)
  size: number;     // gap value in px (label)
}

export function DesignerCanvas() {
  const { elements, selected, setSelected, toggleSelected, setPosition } = useCanvas();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [markers, setMarkers] = useState<SpacingMarker[]>([]);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const ghostsRef = useRef<Ghost[]>([]);
  useEffect(() => { ghostsRef.current = ghosts; }, [ghosts]);

  // Track Space key globally for preview-mode toggle during drag.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setPreviewMode(true);
      }
    };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") setPreviewMode(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Keyboard delete + arrow-key nudge
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected.length) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const step = e.shiftKey ? 10 : 1;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        elements.forEach((el) => selected.includes(el.id) && setPosition(el.id, el.x + dx, el.y + dy));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, elements, setPosition]);

  const startDrag = (e: React.PointerEvent, el: CanvasElement) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const additive = e.shiftKey || e.metaKey;
    let ids = selected;
    if (!selected.includes(el.id)) {
      if (additive) { ids = [...selected, el.id]; setSelected(ids); }
      else { ids = [el.id]; setSelected(ids); }
    } else if (additive) {
      ids = selected.filter((s) => s !== el.id);
      setSelected(ids);
      return;
    }
    const origin: DragState["origin"] = {};
    elements.forEach((x) => { if (ids.includes(x.id)) origin[x.id] = { x: x.x, y: x.y }; });
    setDrag({ ids, startX: e.clientX, startY: e.clientY, origin });
  };

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (drag) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const others = elements.filter((el) => !drag.ids.includes(el.id));
      const surface = surfaceRef.current?.getBoundingClientRect();
      const W = surface?.width ?? 0;
      const H = surface?.height ?? 0;
      const newGuides: Guide[] = [];

      // For each dragged element compute a snap delta against others
      let snapDX = 0, snapDY = 0;
      let bestDX = SNAP + 1, bestDY = SNAP + 1;
      drag.ids.forEach((id) => {
        const el = elements.find((x) => x.id === id)!;
        const baseX = drag.origin[id].x + dx;
        const baseY = drag.origin[id].y + dy;
        const verts = [baseX, baseX + el.w / 2, baseX + el.w];
        const horiz = [baseY, baseY + el.h / 2, baseY + el.h];

        // canvas center
        const cx = W / 2;
        const cy = H / 2;
        verts.forEach((v) => {
          const d = cx - v;
          if (Math.abs(d) < bestDX) { bestDX = Math.abs(d); snapDX = d; }
        });
        horiz.forEach((v) => {
          const d = cy - v;
          if (Math.abs(d) < bestDY) { bestDY = Math.abs(d); snapDY = d; }
        });

        others.forEach((o) => {
          const oVerts = [o.x, o.x + o.w / 2, o.x + o.w];
          const oHoriz = [o.y, o.y + o.h / 2, o.y + o.h];
          verts.forEach((v) => oVerts.forEach((ov) => {
            const d = ov - v;
            if (Math.abs(d) < bestDX) { bestDX = Math.abs(d); snapDX = d; }
          }));
          horiz.forEach((v) => oHoriz.forEach((ov) => {
            const d = ov - v;
            if (Math.abs(d) < bestDY) { bestDY = Math.abs(d); snapDY = d; }
          }));
        });
      });

      if (bestDX > SNAP) snapDX = 0;
      if (bestDY > SNAP) snapDY = 0;

      // -------- Equal-spacing snap (distribution) --------
      // For each dragged element, look for an `other` on each side along X or Y
      // whose cross-axis range overlaps. If gaps differ by < SPACING_SNAP, snap to equalize.
      let spacingDX = 0;
      let spacingDY = 0;
      let bestSpacingDX = SPACING_SNAP + 1;
      let bestSpacingDY = SPACING_SNAP + 1;

      const overlap1D = (a1: number, a2: number, b1: number, b2: number) =>
        Math.min(a2, b2) - Math.max(a1, b1) > 0;

      drag.ids.forEach((id) => {
        const el = elements.find((x) => x.id === id)!;
        const baseX = drag.origin[id].x + dx + snapDX;
        const baseY = drag.origin[id].y + dy + snapDY;
        const elRight = baseX + el.w;
        const elBottom = baseY + el.h;

        // Horizontal distribution: others sharing a vertical band with el
        const horizPeers = others.filter((o) => overlap1D(baseY, elBottom, o.y, o.y + o.h));
        const lefts = horizPeers.filter((o) => o.x + o.w <= baseX + 1);
        const rights = horizPeers.filter((o) => o.x >= elRight - 1);
        lefts.forEach((L) => {
          rights.forEach((R) => {
            const gapL = baseX - (L.x + L.w);
            const gapR = R.x - elRight;
            const diff = gapR - gapL;
            if (Math.abs(diff) < bestSpacingDX) {
              bestSpacingDX = Math.abs(diff);
              spacingDX = diff / 2; // move el right by diff/2 to equalize
            }
          });
        });

        // Vertical distribution
        const vertPeers = others.filter((o) => overlap1D(baseX, elRight, o.x, o.x + o.w));
        const tops = vertPeers.filter((o) => o.y + o.h <= baseY + 1);
        const bottoms = vertPeers.filter((o) => o.y >= elBottom - 1);
        tops.forEach((T) => {
          bottoms.forEach((B) => {
            const gapT = baseY - (T.y + T.h);
            const gapB = B.y - elBottom;
            const diff = gapB - gapT;
            if (Math.abs(diff) < bestSpacingDY) {
              bestSpacingDY = Math.abs(diff);
              spacingDY = diff / 2;
            }
          });
        });
      });

      // Only apply spacing snap on an axis if no edge-snap won that axis
      if (snapDX === 0 && bestSpacingDX <= SPACING_SNAP) snapDX = spacingDX;
      if (snapDY === 0 && bestSpacingDY <= SPACING_SNAP) snapDY = spacingDY;

      drag.ids.forEach((id) => {
        const o = drag.origin[id];
        setPosition(id, o.x + dx + snapDX, o.y + dy + snapDY);
      });

      // -------- Group distribution (3+ selected) --------
      // After the rigid translate, equalize gaps between consecutive selected items
      // along the axis they're more arranged on. Anchors: first & last in that axis.
      let groupMarkers: SpacingMarker[] | null = null;
      let perItemDelta: Record<string, { x: number; y: number }> = {};

      if (drag.ids.length >= 3) {
        const moved = elements
          .filter((el) => drag.ids.includes(el.id))
          .map((el) => ({
            id: el.id, w: el.w, h: el.h,
            x: drag.origin[el.id].x + dx + snapDX,
            y: drag.origin[el.id].y + dy + snapDY,
          }));

        const minX = Math.min(...moved.map((m) => m.x));
        const maxX = Math.max(...moved.map((m) => m.x + m.w));
        const minY = Math.min(...moved.map((m) => m.y));
        const maxY = Math.max(...moved.map((m) => m.y + m.h));
        // Modifier-forced axis: Alt/Option = horizontal, Ctrl/Meta = vertical.
        // Otherwise auto-detect from bbox aspect.
        const forceHoriz = e.altKey;
        const forceVert = e.ctrlKey || e.metaKey;
        const horizontal = forceHoriz ? true : forceVert ? false : (maxX - minX) >= (maxY - minY);

        if (horizontal) {
          const sorted = [...moved].sort((a, b) => a.x - b.x);
          const totalW = sorted.reduce((s, m) => s + m.w, 0);
          const span = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w - sorted[0].x;
          const gap = (span - totalW) / (sorted.length - 1);
          // Reposition interior items
          let cursor = sorted[0].x + sorted[0].w + gap;
          for (let i = 1; i < sorted.length - 1; i++) {
            const m = sorted[i];
            perItemDelta[m.id] = { x: cursor - m.x, y: 0 };
            cursor += m.w + gap;
          }
          // Build markers — shared baseline at vertical center of group bbox
          const cross = (minY + maxY) / 2;
          groupMarkers = [];
          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i];
            const b = sorted[i + 1];
            const aRight = a.x + a.w + (perItemDelta[a.id]?.x ?? 0);
            const bLeft = b.x + (perItemDelta[b.id]?.x ?? 0);
            groupMarkers.push({
              axis: "x", start: aRight, end: bLeft, cross,
              size: Math.max(0, Math.round(bLeft - aRight)),
            });
          }
        } else {
          const sorted = [...moved].sort((a, b) => a.y - b.y);
          const totalH = sorted.reduce((s, m) => s + m.h, 0);
          const span = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h - sorted[0].y;
          const gap = (span - totalH) / (sorted.length - 1);
          let cursor = sorted[0].y + sorted[0].h + gap;
          for (let i = 1; i < sorted.length - 1; i++) {
            const m = sorted[i];
            perItemDelta[m.id] = { x: 0, y: cursor - m.y };
            cursor += m.h + gap;
          }
          const cross = (minX + maxX) / 2;
          groupMarkers = [];
          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i];
            const b = sorted[i + 1];
            const aBottom = a.y + a.h + (perItemDelta[a.id]?.y ?? 0);
            const bTop = b.y + (perItemDelta[b.id]?.y ?? 0);
            groupMarkers.push({
              axis: "y", start: aBottom, end: bTop, cross,
              size: Math.max(0, Math.round(bTop - aBottom)),
            });
          }
        }

        // Apply per-item redistribution deltas. In preview mode we keep the
        // real elements at their rigid-translate positions and only render
        // ghosts at the target positions until pointer-up.
        if (previewMode) {
          const nextGhosts: Ghost[] = [];
          Object.entries(perItemDelta).forEach(([id, d]) => {
            if (d.x === 0 && d.y === 0) return;
            const el = elements.find((x) => x.id === id)!;
            nextGhosts.push({
              id,
              x: drag.origin[id].x + dx + snapDX + d.x,
              y: drag.origin[id].y + dy + snapDY + d.y,
              w: el.w, h: el.h, label: el.label,
            });
          });
          setGhosts(nextGhosts);
        } else {
          if (ghostsRef.current.length) setGhosts([]);
          Object.entries(perItemDelta).forEach(([id, d]) => {
            if (d.x === 0 && d.y === 0) return;
            setPosition(id, drag.origin[id].x + dx + snapDX + d.x, drag.origin[id].y + dy + snapDY + d.y);
          });
        }
      }

      // Build guides after snap
      const newMarkers: SpacingMarker[] = [];
      const movedEls = elements.filter((el) => drag.ids.includes(el.id))
        .map((el) => ({
          ...el,
          // For guide/marker geometry we always use the *target* (post-distribution)
          // positions even in preview mode, so the markers describe the future state.
          x: drag.origin[el.id].x + dx + snapDX + (perItemDelta[el.id]?.x ?? 0),
          y: drag.origin[el.id].y + dy + snapDY + (perItemDelta[el.id]?.y ?? 0),
        }));
      movedEls.forEach((el) => {
        const verts = [el.x, el.x + el.w / 2, el.x + el.w];
        const horiz = [el.y, el.y + el.h / 2, el.y + el.h];
        if (Math.abs(W / 2 - (el.x + el.w / 2)) < 1) newGuides.push({ axis: "x", pos: W / 2, from: 0, to: H });
        if (Math.abs(H / 2 - (el.y + el.h / 2)) < 1) newGuides.push({ axis: "y", pos: H / 2, from: 0, to: W });
        others.forEach((o) => {
          const oVerts = [o.x, o.x + o.w / 2, o.x + o.w];
          const oHoriz = [o.y, o.y + o.h / 2, o.y + o.h];
          verts.forEach((v) => oVerts.forEach((ov) => {
            if (Math.abs(v - ov) < 1) newGuides.push({
              axis: "x", pos: v,
              from: Math.min(el.y, o.y) - 4,
              to: Math.max(el.y + el.h, o.y + o.h) + 4,
            });
          }));
          horiz.forEach((v) => oHoriz.forEach((ov) => {
            if (Math.abs(v - ov) < 1) newGuides.push({
              axis: "y", pos: v,
              from: Math.min(el.x, o.x) - 4,
              to: Math.max(el.x + el.w, o.x + o.w) + 4,
            });
          }));
        });

        // Per-element pair markers (skip when group distribution is active —
        // those would be redundant with the group's set).
        if (groupMarkers) return;
        const elRight = el.x + el.w;
        const elBottom = el.y + el.h;

        const horizPeers = others.filter((o) => overlap1D(el.y, elBottom, o.y, o.y + o.h));
        const leftN = horizPeers.filter((o) => o.x + o.w <= el.x + 1)
          .sort((a, b) => (b.x + b.w) - (a.x + a.w))[0];
        const rightN = horizPeers.filter((o) => o.x >= elRight - 1)
          .sort((a, b) => a.x - b.x)[0];
        if (leftN && rightN) {
          const gapL = el.x - (leftN.x + leftN.w);
          const gapR = rightN.x - elRight;
          if (gapL >= 0 && gapR >= 0 && Math.abs(gapR - gapL) < 1) {
            const cross = Math.max(el.y, leftN.y, rightN.y) +
              (Math.min(elBottom, leftN.y + leftN.h, rightN.y + rightN.h) -
                Math.max(el.y, leftN.y, rightN.y)) / 2;
            newMarkers.push({ axis: "x", start: leftN.x + leftN.w, end: el.x, cross, size: Math.round(gapL) });
            newMarkers.push({ axis: "x", start: elRight, end: rightN.x, cross, size: Math.round(gapR) });
          }
        }

        const vertPeers = others.filter((o) => overlap1D(el.x, elRight, o.x, o.x + o.w));
        const topN = vertPeers.filter((o) => o.y + o.h <= el.y + 1)
          .sort((a, b) => (b.y + b.h) - (a.y + a.h))[0];
        const botN = vertPeers.filter((o) => o.y >= elBottom - 1)
          .sort((a, b) => a.y - b.y)[0];
        if (topN && botN) {
          const gapT = el.y - (topN.y + topN.h);
          const gapB = botN.y - elBottom;
          if (gapT >= 0 && gapB >= 0 && Math.abs(gapB - gapT) < 1) {
            const cross = Math.max(el.x, topN.x, botN.x) +
              (Math.min(elRight, topN.x + topN.w, botN.x + botN.w) -
                Math.max(el.x, topN.x, botN.x)) / 2;
            newMarkers.push({ axis: "y", start: topN.y + topN.h, end: el.y, cross, size: Math.round(gapT) });
            newMarkers.push({ axis: "y", start: elBottom, end: botN.y, cross, size: Math.round(gapB) });
          }
        }
      });
      setGuides(newGuides);
      setMarkers(groupMarkers ?? newMarkers);
      return;
    }

    if (marquee) {
      const surface = surfaceRef.current?.getBoundingClientRect();
      if (!surface) return;
      const x2 = e.clientX - surface.left;
      const y2 = e.clientY - surface.top;
      const x = Math.min(marquee.x, x2);
      const y = Math.min(marquee.y, y2);
      const w = Math.abs(x2 - marquee.x);
      const h = Math.abs(y2 - marquee.y);
      setMarquee({ x, y, w, h });
      const hits = elements.filter((el) =>
        el.x < x + w && el.x + el.w > x && el.y < y + h && el.y + el.h > y
      ).map((e) => e.id);
      setSelected(hits);
    }
  }, [drag, marquee, elements, setPosition, setSelected, previewMode]);

  const endInteraction = () => {
    // Commit any pending ghost positions from preview mode.
    if (ghostsRef.current.length) {
      ghostsRef.current.forEach((g) => setPosition(g.id, g.x, g.y));
      setGhosts([]);
    }
    setDrag(null);
    setMarquee(null);
    setGuides([]);
    setMarkers([]);
  };

  const onSurfacePointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    const surface = surfaceRef.current?.getBoundingClientRect();
    if (!surface) return;
    setSelected([]);
    setMarquee({ x: e.clientX - surface.left, y: e.clientY - surface.top, w: 0, h: 0 });
  };

  return (
    <div
      className="h-full w-full relative overflow-hidden select-none"
      onPointerMove={onPointerMove}
      onPointerUp={endInteraction}
      onPointerLeave={endInteraction}
    >
      {/* Canvas surface */}
      <div className="absolute inset-0 bg-aurora opacity-50" />
      <div
        ref={surfaceRef}
        onPointerDown={onSurfacePointerDown}
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.06) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        {elements.map((el) => {
          const isSelected = selected.includes(el.id);
          const isHover = hoverId === el.id && !isSelected;
          return (
            <div
              key={el.id}
              onPointerDown={(e) => startDrag(e, el)}
              onPointerEnter={() => setHoverId(el.id)}
              onPointerLeave={() => setHoverId((h) => (h === el.id ? null : h))}
              style={{ left: el.x, top: el.y, width: el.w, height: el.h }}
              className={cn(
                "absolute cursor-move group touch-none",
                "transition-shadow duration-150",
                isSelected && "z-10"
              )}
            >
              <ElementVisual el={el} />
              {(isSelected || isHover) && (
                <div
                  className={cn(
                    "pointer-events-none absolute -inset-1 rounded-md",
                    isSelected
                      ? "outline outline-2 outline-cyan shadow-[0_0_24px_-2px_hsl(var(--cyan)/0.7)]"
                      : "outline outline-1 outline-cyan/50"
                  )}
                />
              )}
              {isSelected && (
                <>
                  {/* corner handles */}
                  {[
                    "left-[-5px] top-[-5px]",
                    "right-[-5px] top-[-5px]",
                    "left-[-5px] bottom-[-5px]",
                    "right-[-5px] bottom-[-5px]",
                  ].map((pos) => (
                    <span key={pos} className={cn("pointer-events-none absolute h-2.5 w-2.5 rounded-sm bg-background border-2 border-cyan", pos)} />
                  ))}
                  <span className="absolute -top-6 left-0 px-1.5 py-0.5 rounded-md text-[10px] uppercase tracking-widest bg-cyan text-background font-semibold whitespace-nowrap">
                    {el.label}
                  </span>
                </>
              )}
            </div>
          );
        })}

        {/* Alignment guides */}
        {/* Ghost target positions (preview mode) */}
        {ghosts.map((g) => (
          <div
            key={`ghost-${g.id}`}
            className="absolute pointer-events-none rounded-md border-2 border-dashed border-cyan/80 bg-cyan/10 shadow-[0_0_24px_-6px_hsl(var(--cyan)/0.7)]"
            style={{ left: g.x, top: g.y, width: g.w, height: g.h }}
          >
            <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-widest bg-cyan/90 text-background font-semibold whitespace-nowrap">
              → {g.label}
            </span>
          </div>
        ))}

        {guides.map((g, i) => (
          <div
            key={i}
            className="absolute pointer-events-none bg-magenta shadow-[0_0_8px_hsl(var(--magenta))]"
            style={
              g.axis === "x"
                ? { left: g.pos, top: g.from, width: 1, height: g.to - g.from }
                : { top: g.pos, left: g.from, height: 1, width: g.to - g.from }
            }
          />
        ))}

        {/* Equal-spacing distribution markers */}
        {markers.map((m, i) => {
          const length = Math.max(0, m.end - m.start);
          if (length < 2) return null;
          const tickSize = 8;
          if (m.axis === "x") {
            return (
              <div key={`m-${i}`} className="absolute pointer-events-none" style={{ left: m.start, top: m.cross - tickSize / 2, width: length, height: tickSize }}>
                <div className="absolute left-0 top-0 h-full w-px bg-rose shadow-[0_0_6px_hsl(var(--rose))]" />
                <div className="absolute right-0 top-0 h-full w-px bg-rose shadow-[0_0_6px_hsl(var(--rose))]" />
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-rose/80" />
                <div className="absolute left-1/2 -translate-x-1/2 -top-5 px-1.5 h-4 grid place-items-center rounded-md bg-rose text-background text-[9px] font-semibold tracking-wider tabular-nums">
                  {m.size}
                </div>
              </div>
            );
          }
          return (
            <div key={`m-${i}`} className="absolute pointer-events-none" style={{ top: m.start, left: m.cross - tickSize / 2, height: length, width: tickSize }}>
              <div className="absolute top-0 left-0 w-full h-px bg-rose shadow-[0_0_6px_hsl(var(--rose))]" />
              <div className="absolute bottom-0 left-0 w-full h-px bg-rose shadow-[0_0_6px_hsl(var(--rose))]" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-rose/80" />
              <div className="absolute top-1/2 -translate-y-1/2 left-3 px-1.5 h-4 grid place-items-center rounded-md bg-rose text-background text-[9px] font-semibold tracking-wider tabular-nums">
                {m.size}
              </div>
            </div>
          );
        })}

        {/* Marquee */}
        {marquee && marquee.w > 2 && marquee.h > 2 && (
          <div
            className="absolute pointer-events-none border border-cyan/70 bg-cyan/10"
            style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
          />
        )}
      </div>

      {/* HUD */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-white/80 pointer-events-none">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
          <MousePointer2 className="h-3 w-3 text-cyan" />
          {selected.length === 0 ? "Drag to select" : `${selected.length} selected`}
          {previewMode && drag && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-cyan text-background font-semibold tracking-widest">
              Preview · release to apply
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
          <Sparkles className="h-3 w-3 text-magenta" />
          Shift · multi  ·  Alt · → · Ctrl · ↓  ·  Space · preview
        </div>
      </div>
    </div>
  );
}

function ElementVisual({ el }: { el: CanvasElement }) {
  switch (el.kind) {
    case "badge":
      return (
        <div className="h-full w-full flex items-center gap-1.5 px-3 rounded-full bg-white/10 border border-white/15 text-[10px] tracking-widest uppercase text-white/85">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_hsl(var(--cyan))]" />
          {el.text}
        </div>
      );
    case "headline":
      return (
        <h1 className="font-display font-semibold tracking-tight text-white leading-[1.0] m-0" style={{ fontSize: el.h * 0.75 }}>
          {el.text?.split(" ").map((w, i, arr) =>
            i === arr.length - 1 ? <span key={i} className="text-gradient-lumina">{w}</span> : <span key={i}>{w} </span>
          )}
        </h1>
      );
    case "subhead":
      return <p className="text-white/75 text-[15px] leading-relaxed m-0">{el.text}</p>;
    case "button":
      return (
        <button className={cn(
          "h-full w-full rounded-2xl text-white text-sm font-medium",
          el.accent === "magenta"
            ? "bg-button-lumina shadow-[0_0_24px_-4px_hsl(var(--magenta)/0.6)]"
            : "bg-white/10 border border-white/20"
        )}>
          {el.text}
        </button>
      );
    case "card":
      return (
        <div className="h-full w-full rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md p-4 flex flex-col justify-between">
          <div className={cn(
            "h-7 w-7 rounded-lg grid place-items-center",
            el.accent === "cyan" && "bg-cyan/20 text-cyan",
            el.accent === "magenta" && "bg-magenta/20 text-magenta",
            el.accent === "gold" && "bg-gold/20 text-gold",
            el.accent === "violet" && "bg-violet/20 text-violet",
          )}>
            <SquareIcon className="h-3.5 w-3.5" />
          </div>
          <div className="text-white text-sm font-medium">{el.text}</div>
        </div>
      );
    case "image":
      return (
        <div className="h-full w-full rounded-xl bg-gradient-to-br from-violet to-cyan grid place-items-center">
          <ImageIcon className="h-6 w-6 text-white/80" />
        </div>
      );
    default:
      return <div className="h-full w-full bg-white/10 rounded-md" />;
  }
}