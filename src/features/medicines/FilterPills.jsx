import { useState, useRef, useEffect } from "react";

// Defined at module scope so React sees a stable component reference on every render
function ArrowBtn({ direction, scrollRef, showLeft, showRight }) {
  const visible = direction > 0 ? showRight : showLeft;
  return (
    <div
      onClick={() => scrollRef.current?.scrollBy({ left: direction * 160, behavior: "smooth" })}
      style={{
        position: "absolute", top: 0,
        [direction > 0 ? "right" : "left"]: 0,
        height: "calc(100% - 12px)",
        width: 52,
        background: direction > 0
          ? "linear-gradient(to right, transparent 0%, var(--bg) 65%)"
          : "linear-gradient(to left,  transparent 0%, var(--bg) 65%)",
        display: "flex", alignItems: "center",
        justifyContent: direction > 0 ? "flex-end" : "flex-start",
        opacity: visible ? 1 : 0,
        transition: "opacity .2s",
        pointerEvents: visible ? "all" : "none",
        cursor: "pointer",
        zIndex: 2,
      }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "var(--sf)", border: "1.5px solid var(--bd)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,.1)",
        color: "var(--g)",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round">
          <polyline points={direction > 0 ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
        </svg>
      </div>
    </div>
  );
}

export function FilterPills({ cats, filter, setFilter, count }) {
  const scrollRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, scrollLeft: 0, moved: false });
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 6);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  };

  useEffect(() => {
    checkArrows();
    const t = setTimeout(checkArrows, 200);
    return () => clearTimeout(t);
  }, [cats]);

  // ── Mouse drag ───────────────────────────────────────────────────
  const onMouseDown = e => {
    dragRef.current = { dragging: true, startX: e.clientX, scrollLeft: scrollRef.current.scrollLeft, moved: false };
    scrollRef.current.style.cursor = "grabbing";
  };
  const onMouseMove = e => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    scrollRef.current.scrollLeft = d.scrollLeft - dx;
  };
  const onMouseUp = () => {
    dragRef.current.dragging = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  // ── Touch drag ───────────────────────────────────────────────────
  const onTouchStart = e => {
    dragRef.current = { dragging: true, startX: e.touches[0].clientX, scrollLeft: scrollRef.current.scrollLeft, moved: false };
  };
  const onTouchMove = e => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dx = e.touches[0].clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    scrollRef.current.scrollLeft = d.scrollLeft - dx;
  };
  const onTouchEnd = () => { dragRef.current.dragging = false; };

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, []);



  return (
    <div style={{ position: "relative", marginBottom: 4 }}>
      {/* Scrollable track */}
      <div
        ref={scrollRef}
        onScroll={checkArrows}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          display: "flex", gap: 8,
          overflowX: "auto", paddingBottom: 12,
          scrollbarWidth: "none", msOverflowStyle: "none",
          cursor: "grab", userSelect: "none",
          WebkitOverflowScrolling: "touch",
        }}>
        <style>{`.fp-pill:active{transform:scale(.94)}`}</style>

        {cats.map(cat => {
          const active = filter === cat.id;
          const n = count(cat.id);
          return (
            <button
              key={cat.id}
              className="fp-pill"
              onMouseUp={() => { if (!dragRef.current.moved) setFilter(cat.id); }}
              onTouchEnd={() => { if (!dragRef.current.moved) setFilter(cat.id); }}
              style={{
                display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                padding: "7px 14px", borderRadius: 20,
                border: active ? `2px solid ${cat.color}` : "1.5px solid var(--bd)",
                background: active ? cat.bg : "var(--sf)",
                color: active ? cat.color : "var(--t2)",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: "pointer",
                boxShadow: active ? `0 2px 8px ${cat.color}28` : "var(--sh)",
                transition: "border .15s, background .15s, color .15s, box-shadow .15s",
                outline: "none",
              }}>
              <span style={{ display: "flex", alignItems: "center", lineHeight: 1 }}>
                {cat.Icon ? <cat.Icon color={active ? cat.color : "var(--t2)"} /> : null}
              </span>
              {cat.label}
              {n > 0 && (
                <span style={{
                  background: active ? cat.color : "var(--bd)",
                  color: active ? "#fff" : "var(--t2)",
                  borderRadius: 20, padding: "1px 7px",
                  fontSize: 11, fontWeight: 700, marginLeft: 1,
                  transition: "background .15s, color .15s",
                }}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Left arrow */}
      <ArrowBtn direction={-1} scrollRef={scrollRef} showLeft={showLeft} showRight={showRight} />
      {/* Right arrow */}
      <ArrowBtn direction={1} scrollRef={scrollRef} showLeft={showLeft} showRight={showRight} />
    </div>
  );
}

