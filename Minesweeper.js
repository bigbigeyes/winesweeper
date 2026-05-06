import { useState, useEffect, useCallback, useRef } from "react";

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10, label: "简单" },
  medium: { rows: 16, cols: 16, mines: 40, label: "中等" },
  hard: { rows: 16, cols: 30, mines: 99, label: "困难" },
};

function createBoard(rows, cols, mines, firstR, firstC) {
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      r, c, mine: false, revealed: false, flagged: false, count: 0,
    }))
  );
  const forbidden = new Set();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = firstR + dr, nc = firstC + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols)
        forbidden.add(`${nr},${nc}`);
    }
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!cells[r][c].mine && !forbidden.has(`${r},${c}`)) {
      cells[r][c].mine = true;
      placed++;
    }
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (!cells[r][c].mine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && cells[nr][nc].mine)
              count++;
          }
        cells[r][c].count = count;
      }
  return cells;
}

function flood(board, r, c, rows, cols) {
  const queue = [[r, c]];
  const visited = new Set([`${r},${c}`]);
  while (queue.length) {
    const [cr, cc] = queue.shift();
    board[cr][cc].revealed = true;
    if (board[cr][cc].count === 0) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = cr + dr, nc = cc + dc;
          const key = `${nr},${nc}`;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
            !visited.has(key) && !board[nr][nc].flagged && !board[nr][nc].mine) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
    }
  }
}

const COLORS = ["", "#5af", "#4f8", "#f85", "#a6f", "#f64", "#4ff", "#fa0", "#aaa"];

export default function Minesweeper() {
  const [diff, setDiff] = useState("easy");
  const [board, setBoard] = useState(null);
  const [status, setStatus] = useState("idle");
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);
  const [revealedMines, setRevealedMines] = useState([]);
  const [flagMode, setFlagMode] = useState(false); // mobile flag toggle
  const longPressTimer = useRef(null);
  const touchMoved = useRef(false);

  const { rows, cols, mines } = DIFFICULTIES[diff];

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const reset = useCallback(() => {
    setBoard(null);
    setStatus("idle");
    setFlagCount(0);
    setTime(0);
    setRevealedMines([]);
    setFlagMode(false);
  }, []);

  useEffect(() => { reset(); }, [diff]);

  const doReveal = useCallback((r, c) => {
    if (status === "won" || status === "lost") return;
    setBoard(prev => {
      let b = prev;
      if (!b) {
        b = createBoard(rows, cols, mines, r, c);
        setStatus("playing");
      }
      if (b[r][c].revealed || b[r][c].flagged) return b;
      const newBoard = b.map(row => row.map(cell => ({ ...cell })));
      if (newBoard[r][c].mine) {
        newBoard[r][c].revealed = true;
        setRevealedMines([[r, c]]);
        setStatus("lost");
        setTimeout(() => {
          setBoard(bb => {
            const nb = bb.map(row => row.map(cell => ({ ...cell })));
            const rm = [];
            for (let i = 0; i < rows; i++)
              for (let j = 0; j < cols; j++)
                if (nb[i][j].mine && !nb[i][j].flagged) {
                  nb[i][j].revealed = true;
                  rm.push([i, j]);
                }
            setRevealedMines(rm);
            return nb;
          });
        }, 300);
        return newBoard;
      }
      flood(newBoard, r, c, rows, cols);
      let unrevealed = 0;
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++)
          if (!newBoard[i][j].revealed && !newBoard[i][j].mine) unrevealed++;
      if (unrevealed === 0) setStatus("won");
      return newBoard;
    });
  }, [status, rows, cols, mines]);

  const doFlag = useCallback((r, c) => {
    if (status === "won" || status === "lost" || !board) return;
    if (board[r][c].revealed) return;
    setBoard(prev => {
      const newBoard = prev.map(row => row.map(cell => ({ ...cell })));
      newBoard[r][c].flagged = !newBoard[r][c].flagged;
      setFlagCount(fc => newBoard[r][c].flagged ? fc + 1 : fc - 1);
      return newBoard;
    });
  }, [status, board]);

  const handleClick = useCallback((r, c) => {
    if (flagMode) doFlag(r, c);
    else doReveal(r, c);
  }, [flagMode, doFlag, doReveal]);

  const handleRightClick = useCallback((e, r, c) => {
    e.preventDefault();
    doFlag(r, c);
  }, [doFlag]);

  // Long press for mobile flagging
  const handleTouchStart = useCallback((r, c) => {
    touchMoved.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!touchMoved.current) {
        doFlag(r, c);
      }
    }, 500);
  }, [doFlag]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleTouchMove = useCallback(() => {
    touchMoved.current = true;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const statusLine =
    status === "idle" ? ">>> 点击格子开始游戏" :
    status === "playing" ? `>>> 剩余: ${mines - flagCount}  |  ${fmt(time)}` :
    status === "won" ? `>>> ✓ 胜利！用时 ${fmt(time)}` :
    `>>> ✗ 触雷！游戏结束`;

  // Responsive cell size
  const cellSize = diff === "hard" ? 22 : 28;

  return (
    <div style={{
      minHeight: "100vh",
      minHeight: "100dvh",
      background: "#0d0d0d",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "'Courier New', 'Consolas', monospace",
      color: "#e0e0e0",
      padding: "16px 10px",
      userSelect: "none",
      touchAction: "pan-x pan-y",
    }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 860, marginBottom: 14, borderBottom: "1px solid #2a2a2a", paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>PYTHON</span>
          <span style={{ fontSize: 20, fontWeight: "bold", color: "#f7c948", letterSpacing: 3 }}>扫雷.py</span>
          <span style={{ fontSize: 10, color: "#3a3", marginLeft: "auto" }}>v2.6.0</span>
        </div>
        <div style={{ fontSize: 10, color: "#444", marginTop: 4, letterSpacing: 1 }}>
          <span style={{ color: "#5af" }}>import</span> minesweeper <span style={{ color: "#5af" }}>as</span> ms
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, width: "100%", maxWidth: 860, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#555", alignSelf: "center" }}>难度=</span>
        {Object.entries(DIFFICULTIES).map(([key, val]) => (
          <button key={key} onClick={() => setDiff(key)} style={{
            background: diff === key ? "#f7c948" : "transparent",
            color: diff === key ? "#0d0d0d" : "#777",
            border: `1px solid ${diff === key ? "#f7c948" : "#333"}`,
            padding: "5px 12px", borderRadius: 3, cursor: "pointer",
            fontSize: 12, fontFamily: "inherit", fontWeight: diff === key ? "bold" : "normal",
            letterSpacing: 1,
          }}>
            {val.label}
          </button>
        ))}
        {/* Flag mode toggle for mobile */}
        <button onClick={() => setFlagMode(f => !f)} style={{
          background: flagMode ? "#f7c948" : "transparent",
          color: flagMode ? "#0d0d0d" : "#f7c948",
          border: `1px solid ${flagMode ? "#f7c948" : "#444"}`,
          padding: "5px 12px", borderRadius: 3, cursor: "pointer",
          fontSize: 14, fontFamily: "inherit",
        }}>⚑</button>
        <button onClick={reset} style={{
          marginLeft: "auto", background: "transparent", color: "#f64",
          border: "1px solid #333", padding: "5px 12px", borderRadius: 3,
          cursor: "pointer", fontSize: 12, fontFamily: "inherit", letterSpacing: 1,
        }}>
          reset()
        </button>
      </div>

      {/* Status */}
      <div style={{
        width: "100%", maxWidth: 860, background: "#111", border: "1px solid #222",
        borderRadius: "4px 4px 0 0", padding: "7px 12px", fontSize: 12,
        color: status === "won" ? "#4f8" : status === "lost" ? "#f64" : "#aaa",
        letterSpacing: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{statusLine}</span>
        <span style={{ color: "#333", fontSize: 10 }}>{rows}×{cols}|{mines}💣</span>
      </div>

      {/* Board */}
      <div style={{
        background: "#111", border: "1px solid #222", borderTop: "none",
        borderRadius: "0 0 4px 4px", padding: 8, width: "100%", maxWidth: 860,
        overflowX: "auto", WebkitOverflowScrolling: "touch",
      }}>
        <div style={{
          display: "inline-grid",
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap: 2,
        }}>
          {(board ? board.flat() : Array.from({ length: rows * cols }, (_, i) => ({
            r: Math.floor(i / cols), c: i % cols,
            mine: false, revealed: false, flagged: false, count: 0,
          }))).map(cell => {
            const { r, c, revealed, flagged, mine, count } = cell;
            const isMineReveal = revealedMines.some(([mr, mc]) => mr === r && mc === c);
            let bg = "#1a1a1a";
            if (revealed && mine) bg = "#3a0808";
            else if (revealed) bg = "#141414";
            else if (status === "won" && mine) bg = "#0a2a0a";

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                onContextMenu={e => handleRightClick(e, r, c)}
                onTouchStart={() => handleTouchStart(r, c)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                style={{
                  width: cellSize, height: cellSize, background: bg,
                  border: "1px solid #2a2a2a", borderRadius: 2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: cellSize === 22 ? 9 : 11,
                  color: revealed
                    ? mine ? "#f64" : count > 0 ? COLORS[count] : "transparent"
                    : flagged ? "#f7c948" : "#333",
                  cursor: "pointer", fontWeight: "bold",
                  transition: "background 0.1s",
                  boxShadow: isMineReveal ? "0 0 6px #f6440088" :
                    status === "won" && mine ? "0 0 4px #4f8" : "none",
                  animation: isMineReveal ? "pulse 0.4s" : "none",
                }}
              >
                {revealed ? (mine ? "✸" : count > 0 ? count : "·") : flagged ? "⚑" : !board ? "·" : ""}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <div style={{
        marginTop: 12, width: "100%", maxWidth: 860,
        fontSize: 10, color: "#333", letterSpacing: 1,
        display: "flex", justifyContent: "space-between",
      }}>
        <span>
          <span style={{ color: "#5af" }}>点击</span>=揭开 &nbsp;
          <span style={{ color: "#f7c948" }}>⚑按钮或长按</span>=插旗
        </span>
        <span style={{ color: "#222" }}># PWA</span>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        * { -webkit-tap-highlight-color: transparent; }
        div::-webkit-scrollbar { height: 3px; background: #111; }
        div::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
}
