export const NODE_LINE_HEIGHT = 22;
export const NODE_PADDING = 12;

const CHAR_WIDTH_PX = 7;   // approximate px per character at 13px font
const NODE_MIN_WIDTH = 120;
const NODE_MAX_WIDTH = 400;

/** Characters that fit on one wrapped line given a card width. */
function charsPerLine(width) {
  return Math.floor((width - 2 * NODE_PADDING) / CHAR_WIDTH_PX);
}

/**
 * Returns how wide (px) the card needs to be to show the longest natural
 * line without wrapping, clamped to [NODE_MIN_WIDTH, NODE_MAX_WIDTH].
 */
export function computeNodeWidth(content) {
  if (!content) return NODE_MIN_WIDTH;
  const maxLen = Math.max(...content.split('\n').map(l => l.length));
  const raw = maxLen * CHAR_WIDTH_PX + 2 * NODE_PADDING;
  return Math.max(NODE_MIN_WIDTH, Math.min(NODE_MAX_WIDTH, raw));
}

/** Word-wraps a single line of text at `cpl` characters per line. */
function wrapLine(line, cpl) {
  if (!line) return [''];
  const words = line.split(' ');
  const result = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > cpl && current) {
      result.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) result.push(current);
  return result;
}

/**
 * Splits content into display lines, respecting newlines from the input
 * and word-wrapping any line that is still too long for the given card width.
 * Returns at most 8 lines.
 */
export function wrapContentIntoLines(content, width) {
  if (!content) return [''];
  const cpl = charsPerLine(width ?? NODE_MAX_WIDTH);
  const lines = [];
  for (const inputLine of content.split('\n')) {
    lines.push(...wrapLine(inputLine, cpl));
  }
  return lines.slice(0, 8);
}

/** Returns the height in px needed to fit the wrapped content inside a card of `width`. */
export function computeNodeHeight(content, width) {
  const lines = wrapContentIntoLines(content, width);
  return NODE_PADDING * 2 + lines.length * NODE_LINE_HEIGHT;
}

/**
 * Fills a D3 text selection with tspan elements — one per wrapped line,
 * vertically centered around the node's d.y position.
 * Uses global `d3`. Bound datum must have { x, y, w, content }.
 */
export function applyNodeTextWrap(textSelection) {
  textSelection.each(function(d) {
    const el = d3.select(this);
    el.text(null);
    const lines = wrapContentIntoLines(d.content, d.w);
    const totalTextHeight = lines.length * NODE_LINE_HEIGHT;
    const y0 = d.y - totalTextHeight / 2 + NODE_LINE_HEIGHT / 2;
    lines.forEach((line, i) => {
      el.append('tspan')
        .attr('x', d.x)
        .attr('y', y0 + i * NODE_LINE_HEIGHT)
        .text(line);
    });
  });
}
