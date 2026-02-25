/**
 * portraits.js — Original character portrait art for Mario Kart characters.
 * All artwork drawn programmatically using Canvas 2D API.
 * Each character is drawn in a 64×80 coordinate space.
 */

// ── Shared color palette ──
const SK  = '#f5c89a'; // skin light
const SKD = '#d4956a'; // skin dark (tan/shadow)
const BRN = '#5a3310'; // brown (hair/mustache)
const WHT = '#ffffff';
const BLK = '#1a1a1a';

// ── Drawing helpers ──
const f = (cx, col) => { cx.fillStyle = col; };
const r = (cx, x, y, w, h, col)   => { f(cx, col); cx.fillRect(x, y, w, h); };
const c = (cx, x, y, rad, col)    => { f(cx, col); cx.beginPath(); cx.arc(x, y, rad, 0, Math.PI * 2); cx.fill(); };
const e = (cx, x, y, rx, ry, col, rot = 0) => {
  f(cx, col); cx.beginPath();
  cx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); cx.fill();
};
const arc = (cx, x, y, rx, ry, s, en, col) => {
  f(cx, col); cx.beginPath();
  cx.ellipse(x, y, rx, ry, 0, s, en); cx.fill();
};
const txt = (cx, x, y, str, col, sz = 10, bold = true) => {
  cx.fillStyle = col;
  cx.font = `${bold ? 'bold ' : ''}${sz}px sans-serif`;
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText(str, x, y);
};
const bg = (cx, col) => { f(cx, col); cx.fillRect(0, 0, 64, 80); };

// ─────────────────────────────────────────
//  MARIO
// ─────────────────────────────────────────
function drawMario(cx) {
  bg(cx, '#3b82c4');
  // Overalls + shirt
  r(cx,  6, 44, 52, 36, '#1a3a8c');
  r(cx,  0, 42, 64, 14, '#cc2200');
  r(cx,  6, 44, 52,  8, '#cc2200');
  r(cx, 22, 44,  8, 36, '#1a3a8c'); // suspenders
  r(cx, 34, 44,  8, 36, '#1a3a8c');
  c(cx, 26, 62, 3, WHT); c(cx, 38, 62, 3, WHT); // buttons
  c(cx,  5, 53, 7, WHT); c(cx, 59, 53, 7, WHT); // gloves
  // Face
  e(cx, 32, 28, 19, 17, SK);
  c(cx, 13, 28, 5, SK); c(cx, 51, 28, 5, SK); // ears
  // Cap
  r(cx,  7,  5, 50, 16, '#cc2200');
  arc(cx, 32, 6, 22, 12, Math.PI, Math.PI * 2, '#cc2200');
  r(cx,  4, 19, 56,  7, '#aa1a00');
  c(cx, 32, 12, 8, WHT); txt(cx, 32, 12, 'M', '#cc2200', 10);
  // Eyes
  c(cx, 24, 27, 4, BRN); c(cx, 40, 27, 4, BRN);
  c(cx, 24, 27, 2, BLK); c(cx, 40, 27, 2, BLK);
  c(cx, 25, 26, 1, WHT); c(cx, 41, 26, 1, WHT);
  // Nose + mustache
  c(cx, 32, 32, 5, SKD);
  e(cx, 24, 37, 9, 4, BRN); e(cx, 40, 37, 9, 4, BRN);
  e(cx, 32, 41, 7, 3, '#cc9966');
}

// ─────────────────────────────────────────
//  LUIGI
// ─────────────────────────────────────────
function drawLuigi(cx) {
  bg(cx, '#2d6e2d');
  r(cx,  6, 44, 52, 36, '#1a3a8c');
  r(cx,  0, 42, 64, 14, '#228822');
  r(cx,  6, 44, 52,  8, '#228822');
  r(cx, 22, 44,  8, 36, '#1a3a8c');
  r(cx, 34, 44,  8, 36, '#1a3a8c');
  c(cx, 26, 62, 3, WHT); c(cx, 38, 62, 3, WHT);
  c(cx,  5, 53, 7, WHT); c(cx, 59, 53, 7, WHT);
  // Face (taller)
  e(cx, 32, 29, 18, 19, SK);
  c(cx, 14, 29, 5, SK); c(cx, 50, 29, 5, SK);
  // Cap (green)
  r(cx,  7,  4, 50, 17, '#228822');
  arc(cx, 32, 5, 22, 12, Math.PI, Math.PI * 2, '#228822');
  r(cx,  4, 19, 56,  7, '#1a6e1a');
  c(cx, 32, 12, 8, WHT); txt(cx, 32, 12, 'L', '#228822', 10);
  // Eyes
  c(cx, 24, 28, 4, BRN); c(cx, 40, 28, 4, BRN);
  c(cx, 24, 28, 2, BLK); c(cx, 40, 28, 2, BLK);
  c(cx, 25, 27, 1, WHT); c(cx, 41, 27, 1, WHT);
  // Bigger mustache (Luigi trait)
  c(cx, 32, 33, 5, SKD);
  e(cx, 23, 39, 10, 4.5, BRN); e(cx, 41, 39, 10, 4.5, BRN);
  e(cx, 32, 43,  7,   3, '#cc9966');
}

// ─────────────────────────────────────────
//  PEACH
// ─────────────────────────────────────────
function drawPeach(cx) {
  bg(cx, '#ffb8d8');
  r(cx,  0, 44, 64, 36, '#ff66a8');
  e(cx, 32, 70, 30, 20, '#ff44aa');
  c(cx,  5, 54, 7, WHT); c(cx, 59, 54, 7, WHT);
  r(cx,  0, 44, 12, 18, WHT); r(cx, 52, 44, 12, 18, WHT);
  e(cx, 32, 43, 28, 8, '#ffccee');
  r(cx, 26, 37, 12, 10, SK);
  c(cx, 32, 43, 5, '#ffdd00'); c(cx, 32, 43, 3, WHT);
  // Face
  e(cx, 32, 26, 18, 18, SK);
  c(cx, 14, 26, 5, SK); c(cx, 50, 26, 5, SK);
  c(cx, 10, 28, 3, '#ffaacc'); c(cx, 54, 28, 3, '#ffaacc'); // earrings
  // Blonde hair sides
  e(cx, 10, 20,  8, 18, '#ffe066');
  e(cx, 54, 20,  8, 18, '#ffe066');
  // Crown
  r(cx, 18, 5, 28, 10, '#ffd700');
  c(cx, 24, 5, 5, '#ffd700'); c(cx, 32, 3, 5, '#ffd700'); c(cx, 40, 5, 5, '#ffd700');
  c(cx, 24, 2, 3, '#ff4488'); c(cx, 32, 0, 3, '#44aaff'); c(cx, 40, 2, 3, '#ff4488');
  e(cx, 32, 12, 20, 10, '#ffe066');
  // Eyes (blue with lashes)
  e(cx, 23, 25, 5, 5.5, '#1155cc'); e(cx, 41, 25, 5, 5.5, '#1155cc');
  c(cx, 23, 25, 3, '#112299');       c(cx, 41, 25, 3, '#112299');
  c(cx, 24, 24, 1.5, WHT);           c(cx, 42, 24, 1.5, WHT);
  r(cx, 17, 19, 14, 2, BLK); r(cx, 35, 19, 14, 2, BLK);
  // Nose + lips
  c(cx, 32, 30, 3, SKD);
  e(cx, 32, 35, 7, 3, '#ff6688'); e(cx, 32, 33, 7, 2, SK);
}

// ─────────────────────────────────────────
//  TOAD
// ─────────────────────────────────────────
function drawToad(cx) {
  bg(cx, '#5577cc');
  // Vest
  r(cx,  6, 44, 52, 36, '#3355aa');
  r(cx,  0, 44, 14, 36, WHT); r(cx, 50, 44, 14, 36, WHT);
  r(cx, 20, 44, 24, 36, WHT);
  r(cx, 24, 38, 16, 10, SK);
  // Mushroom cap (dominant feature)
  e(cx, 32, 18, 28, 22, WHT);
  arc(cx, 32, 18, 28, 22, Math.PI, Math.PI * 2, '#cc0000');
  // Red spots
  c(cx, 20, 12, 5, '#cc0000'); c(cx, 44, 12, 5, '#cc0000');
  c(cx, 32,  7, 4, '#cc0000');
  c(cx, 15, 22, 3.5, '#cc0000'); c(cx, 49, 22, 3.5, '#cc0000');
  // Cap rim / face
  e(cx, 32, 35, 20, 7, WHT);
  e(cx, 32, 35, 17, 10, SK);
  r(cx, 22, 44, 20, 14, WHT);
  // Big round eyes
  c(cx, 24, 34, 6, WHT); c(cx, 40, 34, 6, WHT);
  e(cx, 24, 34, 4, 5, '#1155cc'); e(cx, 40, 34, 4, 5, '#1155cc');
  c(cx, 24, 34, 2.5, BLK);        c(cx, 40, 34, 2.5, BLK);
  c(cx, 25, 33, 1, WHT);           c(cx, 41, 33, 1, WHT);
  // Cheek dots + mouth
  c(cx, 19, 38, 2.5, '#ffaaaa'); c(cx, 45, 38, 2.5, '#ffaaaa');
  e(cx, 32, 41, 6, 3, '#cc9966');
}

// ─────────────────────────────────────────
//  YOSHI
// ─────────────────────────────────────────
function drawYoshi(cx) {
  bg(cx, '#44cc44');
  // Body
  e(cx, 32, 62, 26, 20, '#33bb33');
  e(cx, 32, 64, 18, 14, WHT);
  c(cx,  8, 52, 8, '#33bb33'); c(cx, 56, 52, 8, '#33bb33');
  // Saddle on shell
  r(cx, 14, 46, 36, 18, '#ff4444');
  e(cx, 32, 56, 16, 9, '#ff4444');
  // Head
  e(cx, 32, 26, 22, 22, '#44cc44');
  // White cheeks
  e(cx, 22, 32, 11, 9, WHT); e(cx, 42, 32, 11, 9, WHT);
  // Snout
  e(cx, 32, 33, 14, 9, '#33bb33');
  e(cx, 32, 34, 12, 7, WHT);
  c(cx, 28, 31, 2, '#1a661a'); c(cx, 36, 31, 2, '#1a661a');
  // Big eyes
  c(cx, 21, 22, 7, WHT); c(cx, 43, 22, 7, WHT);
  e(cx, 21, 22, 5, 6, '#1155cc'); e(cx, 43, 22, 5, 6, '#1155cc');
  c(cx, 21, 22, 3, BLK);          c(cx, 43, 22, 3, BLK);
  c(cx, 22, 21, 1.5, WHT);         c(cx, 44, 21, 1.5, WHT);
  // Head crest
  c(cx, 32, 7, 6, '#ff4444');
  c(cx, 38, 5, 5, '#ff4444');
  c(cx, 44, 6, 4, '#ff6666');
  // Smile
  arc(cx, 32, 38, 8, 5, 0, Math.PI, '#228822');
}

// ─────────────────────────────────────────
//  WARIO
// ─────────────────────────────────────────
function drawWario(cx) {
  bg(cx, '#ccaa00');
  // Overalls purple
  r(cx,  6, 44, 52, 36, '#661188');
  r(cx,  0, 42, 64, 14, '#ddaa00');
  r(cx,  6, 44, 52,  8, '#ddaa00');
  r(cx, 22, 44,  8, 36, '#661188');
  r(cx, 34, 44,  8, 36, '#661188');
  c(cx, 26, 62, 3, WHT); c(cx, 38, 62, 3, WHT);
  c(cx,  5, 53, 7, '#ffff88'); c(cx, 59, 53, 7, '#ffff88');
  // Face (wider)
  e(cx, 32, 29, 21, 18, SK);
  c(cx, 12, 29, 5, SK); c(cx, 52, 29, 5, SK);
  // Yellow cap + W
  r(cx,  7,  5, 50, 17, '#ddaa00');
  arc(cx, 32, 6, 22, 12, Math.PI, Math.PI * 2, '#ddaa00');
  r(cx,  4, 20, 56,  7, '#bb8800');
  c(cx, 32, 13, 8, '#661188'); txt(cx, 32, 13, 'W', '#ffff00', 10);
  // Angry brows
  r(cx, 15, 22, 14, 3, BRN); r(cx, 35, 22, 14, 3, BRN);
  // Eyes (small)
  c(cx, 23, 28, 4, BLK); c(cx, 41, 28, 4, BLK);
  c(cx, 24, 27, 1.5, WHT); c(cx, 42, 27, 1.5, WHT);
  // Big nose
  e(cx, 32, 33, 8, 7, SKD);
  // Thick scruffy mustache
  e(cx, 22, 39, 11, 5, BRN); e(cx, 42, 39, 11, 5, BRN);
  e(cx, 32, 38,  8, 5, BRN);
  // Mouth + tooth
  r(cx, 26, 42, 16, 5, '#884422');
  r(cx, 29, 41,  6, 4, WHT);
}

// ─────────────────────────────────────────
//  BOWSER
// ─────────────────────────────────────────
function drawBowser(cx) {
  bg(cx, '#cc6600');
  // Shell spikes
  for (const sx of [10, 22, 34, 46, 58])
    c(cx, sx, 48, 6, '#ffcc44');
  e(cx, 32, 62, 30, 18, '#aa5500');
  e(cx, 32, 56, 24, 16, '#44aa00');
  r(cx, 20, 48, 24, 16, '#44aa00');
  c(cx,  6, 52, 9, '#44aa00'); c(cx, 58, 52, 9, '#44aa00');
  // Green face
  e(cx, 32, 27, 22, 20, '#44aa00');
  c(cx, 11, 27, 6, '#44aa00'); c(cx, 53, 27, 6, '#44aa00');
  // Crown
  r(cx, 16, 5, 32, 10, '#ffd700');
  c(cx, 22, 5, 5, '#ffd700'); c(cx, 32, 3, 5, '#ffd700'); c(cx, 42, 5, 5, '#ffd700');
  c(cx, 22, 2, 3, '#ff4444'); c(cx, 32, 0, 3, '#ff4444'); c(cx, 42, 2, 3, '#ff4444');
  // Horns
  e(cx, 14, 16, 5, 9, '#ffcc44'); e(cx, 50, 16, 5, 9, '#ffcc44');
  // Red angry eyes
  c(cx, 22, 25, 6, '#ffcc00'); c(cx, 42, 25, 6, '#ffcc00');
  c(cx, 22, 25, 4, '#cc0000'); c(cx, 42, 25, 4, '#cc0000');
  c(cx, 22, 25, 2, BLK);       c(cx, 42, 25, 2, BLK);
  r(cx, 14, 17, 16, 4, BRN);   r(cx, 34, 17, 16, 4, BRN);
  // Snout
  e(cx, 32, 35, 15, 10, '#66cc22');
  // Fangs
  r(cx, 25, 38, 5, 7, WHT); r(cx, 34, 38, 5, 7, WHT);
}

// ─────────────────────────────────────────
//  ROSALINA
// ─────────────────────────────────────────
function drawRosalina(cx) {
  bg(cx, '#4488cc');
  r(cx,  0, 44, 64, 36, '#2255aa');
  e(cx, 32, 70, 30, 20, '#1a44aa');
  r(cx,  0, 44, 12, 36, '#3366bb');
  r(cx, 52, 44, 12, 36, '#3366bb');
  c(cx,  5, 54, 7, '#ccddff'); c(cx, 59, 54, 7, '#ccddff');
  txt(cx, 32, 54, '★', '#ffdd44', 16);
  r(cx, 26, 37, 12, 10, SK);
  // Face
  e(cx, 32, 26, 18, 19, SK);
  c(cx, 14, 27, 5, SK); c(cx, 50, 27, 5, SK);
  // Long hair
  e(cx, 10, 24,  9, 28, '#ffe066');
  e(cx, 54, 24,  9, 28, '#ffe066');
  e(cx, 22, 17, 14, 14, '#ffe066');
  r(cx,  8, 17, 30, 14, '#ffe066');
  e(cx, 32, 10, 20, 13, '#ffe066');
  // Star on head
  c(cx, 32, 4, 5, '#88ccff');
  txt(cx, 32, 4, '✦', WHT, 8);
  // Only right eye visible (hair covers left)
  e(cx, 40, 27, 5, 5.5, '#1155cc');
  c(cx, 40, 27, 3, '#112299');
  c(cx, 41, 26, 1.5, WHT);
  r(cx, 34, 21, 13, 2, BLK);
  c(cx, 22, 27, 2, '#aabbdd');
  c(cx, 38, 31, 3, SKD);
  e(cx, 38, 36, 6, 3, '#ff88aa');
  e(cx, 38, 34, 6, 2, SK);
}

// ─────────────────────────────────────────
//  DONKEY KONG
// ─────────────────────────────────────────
function drawDK(cx) {
  bg(cx, '#331100');
  e(cx, 32, 60, 28, 22, '#44220a');
  // Tie
  r(cx, 28, 44,  8, 30, '#cc0000');
  e(cx, 32, 72,  5,  7, '#cc0000');
  e(cx, 32, 44, 14,  4, '#aa0000');
  // DK badge
  c(cx, 32, 54, 12, '#cc0000');
  txt(cx, 32, 54, 'DK', WHT, 8);
  // Head
  e(cx, 32, 28, 24, 24, '#44220a');
  c(cx,  7, 30, 7, '#44220a'); c(cx, 57, 30, 7, '#44220a');
  // Knuckles on head
  for (const hx of [16, 28, 40, 52])
    c(cx, hx, 10, 6, '#44220a');
  // Light muzzle
  e(cx, 32, 36, 16, 13, '#c8955a');
  c(cx, 27, 32, 3, '#1a0800'); c(cx, 37, 32, 3, '#1a0800'); // nostrils
  // Eyes
  c(cx, 21, 23, 6, WHT); c(cx, 43, 23, 6, WHT);
  e(cx, 21, 23, 4, 5, '#331100'); e(cx, 43, 23, 4, 5, '#331100');
  c(cx, 21, 23, 2, BLK);          c(cx, 43, 23, 2, BLK);
  c(cx, 22, 22, 1.5, WHT);         c(cx, 44, 22, 1.5, WHT);
  // Mouth with teeth
  arc(cx, 32, 42, 10, 6, 0, Math.PI, '#c8955a');
  r(cx, 24, 40, 16, 5, '#c8955a');
  r(cx, 26, 40,  4, 5, WHT); r(cx, 34, 40, 4, 5, WHT);
}

// ─────────────────────────────────────────
//  WALUIGI
// ─────────────────────────────────────────
function drawWaluigi(cx) {
  bg(cx, '#550055');
  r(cx, 14, 44, 36, 36, '#440044');
  r(cx,  0, 44, 16, 36, '#660066');
  r(cx, 48, 44, 16, 36, '#660066');
  r(cx, 22, 44, 20,  4, '#ffcc00');
  r(cx, 22, 56, 20,  4, '#ffcc00');
  c(cx,  5, 52, 7, WHT); c(cx, 59, 52, 7, WHT);
  // Narrow face
  e(cx, 32, 30, 16, 21, SK);
  c(cx, 16, 30, 4, SK); c(cx, 48, 30, 4, SK);
  // Purple cap
  r(cx,  9,  5, 46, 16, '#660066');
  arc(cx, 32, 5, 22, 11, Math.PI, Math.PI * 2, '#660066');
  r(cx,  5, 19, 54,  7, '#440044');
  c(cx, 32, 12, 8, '#ffcc00');
  txt(cx, 32, 12, 'Γ', '#660066', 12);
  // Angry brows
  r(cx, 14, 22, 14, 3, '#332200'); r(cx, 36, 22, 14, 3, '#332200');
  c(cx, 23, 28, 3.5, BLK); c(cx, 41, 28, 3.5, BLK);
  c(cx, 24, 27,   1, WHT); c(cx, 42, 27,   1, WHT);
  // Long pointed nose
  e(cx, 32, 35, 6, 9, SKD);
  c(cx, 32, 42, 3, SKD);
  // Curled mustache
  e(cx, 22, 41, 8, 4, BRN); e(cx, 42, 41, 8, 4, BRN);
  arc(cx, 18, 41, 5, 3, -Math.PI / 2, Math.PI / 2, BRN);
  arc(cx, 46, 41, 5, 3, Math.PI / 2, 3 * Math.PI / 2, BRN);
}

// ─────────────────────────────────────────
//  KOOPA TROOPA
// ─────────────────────────────────────────
function drawKoopa(cx) {
  bg(cx, '#448800');
  // Shell
  e(cx, 32, 62, 28, 20, '#cc6600');
  e(cx, 32, 62, 22, 15, '#44aa00');
  r(cx, 20, 56, 24, 2, '#336600'); r(cx, 20, 64, 24, 2, '#336600');
  r(cx, 32, 52,  2, 24, '#336600');
  r(cx, 16, 44, 32, 20, '#44aa00');
  c(cx,  8, 52, 7, '#44aa00'); c(cx, 56, 52, 7, '#44aa00');
  // Goggles on forehead
  c(cx, 23, 18, 7, '#88ddff'); c(cx, 41, 18, 7, '#88ddff');
  r(cx, 23, 13, 18,  8, '#88ddff');
  c(cx, 23, 18, 5, '#44aacc'); c(cx, 41, 18, 5, '#44aacc');
  r(cx,  8, 16, 13, 3, '#884400'); r(cx, 43, 16, 13, 3, '#884400');
  // Head
  e(cx, 32, 28, 18, 16, '#44aa00');
  c(cx, 14, 28, 5, '#44aa00'); c(cx, 50, 28, 5, '#44aa00');
  // Headband
  r(cx, 14, 20, 36, 5, '#ff4444');
  // Yellow beak
  e(cx, 32, 34, 12, 8, '#ffcc22');
  r(cx, 22, 33, 20, 2, '#cc9900');
  // Eyes
  c(cx, 22, 26, 5, WHT); c(cx, 42, 26, 5, WHT);
  c(cx, 22, 26, 3, '#1155cc'); c(cx, 42, 26, 3, '#1155cc');
  c(cx, 22, 26, 1.5, BLK);    c(cx, 42, 26, 1.5, BLK);
  c(cx, 23, 25, 1, WHT);       c(cx, 43, 25, 1, WHT);
}

// ─────────────────────────────────────────
//  DAISY
// ─────────────────────────────────────────
function drawDaisy(cx) {
  bg(cx, '#ff8800');
  r(cx,  0, 44, 64, 36, '#ee6600');
  e(cx, 32, 70, 30, 20, '#cc5500');
  r(cx,  4, 44, 56,  8, WHT);
  c(cx,  5, 54, 7, WHT); c(cx, 59, 54, 7, WHT);
  c(cx, 32, 44, 5, '#ffd700');
  r(cx, 26, 37, 12, 10, SKD);
  // Tan face
  e(cx, 32, 26, 18, 18, SKD);
  c(cx, 14, 26, 5, SKD); c(cx, 50, 26, 5, SKD);
  // Brown hair
  e(cx, 10, 22, 9, 18, '#884400');
  e(cx, 54, 22, 9, 18, '#884400');
  // Crown
  r(cx, 18, 6, 28, 10, '#ffd700');
  c(cx, 24, 6, 5, '#ffd700'); c(cx, 32, 4, 5, '#ffd700'); c(cx, 40, 6, 5, '#ffd700');
  c(cx, 32, 4, 4, '#ff8800'); c(cx, 32, 4, 2.5, '#ffcc00');
  c(cx, 26, 1, 3, '#ffdd44'); c(cx, 32, 0, 3, '#ffdd44'); c(cx, 38, 1, 3, '#ffdd44');
  e(cx, 32, 13, 20, 10, '#884400');
  // Side flower
  c(cx, 48, 10, 5, '#ffdd44'); c(cx, 48, 10, 3, '#ff8800');
  // Green eyes
  e(cx, 23, 25, 5, 5.5, '#228833'); e(cx, 41, 25, 5, 5.5, '#228833');
  c(cx, 23, 25, 3, '#114422');       c(cx, 41, 25, 3, '#114422');
  c(cx, 24, 24, 1.5, WHT);           c(cx, 42, 24, 1.5, WHT);
  r(cx, 17, 19, 13, 2, BLK); r(cx, 34, 19, 13, 2, BLK);
  // Nose + smile
  c(cx, 32, 30, 3, '#bb8055');
  arc(cx, 32, 36, 7, 4, 0, Math.PI, '#cc6633');
  r(cx, 26, 33, 12, 4, SKD);
}

// ─────────────────────────────────────────
//  Registry
// ─────────────────────────────────────────
const PORTRAITS = {
  mario: drawMario,
  luigi: drawLuigi,
  peach: drawPeach,
  toad: drawToad,
  yoshi: drawYoshi,
  wario: drawWario,
  bowser: drawBowser,
  rosalina: drawRosalina,
  donkeykong: drawDK,
  waluigi: drawWaluigi,
  koopa: drawKoopa,
  daisy: drawDaisy,
};

/**
 * Draw a character portrait into ctx (already scaled to 64×80).
 */
export function drawCharacterPortrait(ctx, characterId) {
  const draw = PORTRAITS[characterId] || PORTRAITS.mario;
  draw(ctx);
}

/**
 * Returns a base-64 PNG data URL for the given character portrait.
 * Uses an offscreen canvas so it works without any external assets.
 */
export function getPortraitDataURL(characterId, w = 128, h = 160) {
  const off = document.createElement('canvas');
  off.width  = w;
  off.height = h;
  const ctx  = off.getContext('2d');
  ctx.scale(w / 64, h / 80);
  drawCharacterPortrait(ctx, characterId);
  return off.toDataURL();
}
