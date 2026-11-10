import { WORD_BANK } from './data.js';

const DIRECTIONS = {
  across: { dx: 1, dy: 0 },
  down: { dx: 0, dy: 1 }
};

const rand = (max) => Math.floor(Math.random() * max);
const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

function toEntry(raw, language) {
  const answer = language === 'fa' ? raw.fa : raw.en;
  return {
    id: `${language}-${raw.en.toLowerCase()}`,
    answer: Array.from(answer),
    clue: language === 'fa' ? raw.clueFa : raw.clueEn,
    topic: raw.topic,
    source: raw
  };
}

function buildOccupancy(placements) {
  const cells = new Map();
  for (const placement of placements) {
    const { dx, dy } = DIRECTIONS[placement.dir];
    placement.word.forEach((letter, index) => {
      const x = placement.x + dx * index;
      const y = placement.y + dy * index;
      const key = `${x},${y}`;
      if (!cells.has(key)) cells.set(key, { x, y, letter, owners: [] });
      cells.get(key).owners.push(placement);
    });
  }
  return cells;
}

function canPlace(entry, x, y, dir, occupied) {
  const { dx, dy } = DIRECTIONS[dir];
  const endX = x + dx * (entry.answer.length - 1);
  const endY = y + dy * (entry.answer.length - 1);

  if (occupied.has(`${x - dx},${y - dy}`) || occupied.has(`${endX + dx},${endY + dy}`)) return false;

  let overlaps = 0;
  for (let i = 0; i < entry.answer.length; i += 1) {
    const cx = x + dx * i;
    const cy = y + dy * i;
    const key = `${cx},${cy}`;
    const existing = occupied.get(key);
    if (existing) {
      if (existing.letter !== entry.answer[i]) return false;
      overlaps += 1;
      if (overlaps > 1) return false;
    } else {
      const sideA = dir === 'across' ? `${cx},${cy - 1}` : `${cx - 1},${cy}`;
      const sideB = dir === 'across' ? `${cx},${cy + 1}` : `${cx + 1},${cy}`;
      if (occupied.has(sideA) || occupied.has(sideB)) return false;
    }
  }
  return overlaps === 1;
}

function getBounds(placements) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of placements) {
    const { dx, dy } = DIRECTIONS[p.dir];
    const x2 = p.x + dx * (p.word.length - 1);
    const y2 = p.y + dy * (p.word.length - 1);
    minX = Math.min(minX, p.x, x2);
    minY = Math.min(minY, p.y, y2);
    maxX = Math.max(maxX, p.x, x2);
    maxY = Math.max(maxY, p.y, y2);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function candidatePlacements(entry, placements, occupied, maxSpan) {
  const candidates = new Map();
  for (const [key, cell] of occupied.entries()) {
    for (const owner of cell.owners) {
      const dir = owner.dir === 'across' ? 'down' : 'across';
      if (cell.owners.some((existingOwner) => existingOwner.dir === dir)) continue;
      const { dx, dy } = DIRECTIONS[dir];
      for (let i = 0; i < entry.answer.length; i += 1) {
        if (entry.answer[i] !== cell.letter) continue;
        const x = cell.x - dx * i;
        const y = cell.y - dy * i;
        if (!canPlace(entry, x, y, dir, occupied)) continue;
        const placement = { entryId: entry.id, word: entry.answer, clue: entry.clue, topic: entry.topic, x, y, dir };
        const bounds = getBounds([...placements, placement]);
        if (bounds.width > maxSpan || bounds.height > maxSpan) continue;
        const candidateKey = `${x},${y},${dir}`;
        if (!candidates.has(candidateKey)) candidates.set(candidateKey, { placement, bounds });
      }
    }
  }
  return [...candidates.values()];
}

function scoreCandidate(candidate, currentBounds) {
  const { bounds } = candidate;
  const growth = (bounds.width * bounds.height) - (currentBounds.width * currentBounds.height);
  const balance = Math.abs(bounds.width - bounds.height);
  return growth * 1.4 + balance * 0.12 + Math.random() * 4;
}

function attemptLayout(entries, targetWords, maxSpan) {
  const usable = entries.filter((entry) => entry.answer.length >= 3 && entry.answer.length <= 13);
  const starts = shuffle(usable).sort((a, b) => {
    const aFit = Math.abs(a.answer.length - 6);
    const bFit = Math.abs(b.answer.length - 6);
    return aFit - bFit;
  });
  const seedPool = shuffle(starts.slice(0, Math.min(24, starts.length)));
  let best = null;

  for (const seed of seedPool) {
    const placements = [{ entryId: seed.id, word: seed.answer, clue: seed.clue, topic: seed.topic, x: 0, y: 0, dir: 'across' }];
    const used = new Set([seed.id]);

    while (placements.length < targetWords) {
      const occupied = buildOccupancy(placements);
      const currentBounds = getBounds(placements);
      const remaining = shuffle(usable.filter((entry) => !used.has(entry.id)));
      const allCandidates = [];
      for (const entry of remaining) {
        const candidates = candidatePlacements(entry, placements, occupied, maxSpan);
        for (const candidate of candidates) {
          allCandidates.push({ ...candidate, entryId: entry.id });
        }
      }
      if (!allCandidates.length) break;
      allCandidates.sort((a, b) => scoreCandidate(a, currentBounds) - scoreCandidate(b, currentBounds));
      const shortlist = allCandidates.slice(0, Math.min(12, allCandidates.length));
      const chosen = shortlist[rand(shortlist.length)];
      placements.push(chosen.placement);
      used.add(chosen.entryId);
    }

    if (!best || placements.length > best.length) best = placements;
    if (placements.length >= targetWords) return placements;
  }
  return best || [];
}

function materializePuzzle(placements, language, difficulty, serial) {
  const bounds = getBounds(placements);
  const padding = 1;
  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;
  const offsetX = padding - bounds.minX;
  const offsetY = padding - bounds.minY;
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => null));
  const normalized = placements.map((p) => {
    const originalX = p.x + offsetX;
    return { ...p, x: language === 'fa' ? width - 1 - originalX : originalX, y: p.y + offsetY };
  });
  const layoutDirections = language === 'fa'
    ? { across: { dx: -1, dy: 0 }, down: { dx: 0, dy: 1 } }
    : DIRECTIONS;

  for (const p of normalized) {
    const { dx, dy } = layoutDirections[p.dir];
    p.word.forEach((letter, index) => {
      const x = p.x + dx * index;
      const y = p.y + dy * index;
      if (!grid[y][x]) grid[y][x] = { solution: letter, across: null, down: null, number: null };
      grid[y][x][p.dir] = p.entryId;
    });
  }

  const starts = new Map();
  for (const p of normalized) {
    const key = `${p.x},${p.y}`;
    if (!starts.has(key)) starts.set(key, { x: p.x, y: p.y, across: false, down: false });
    starts.get(key)[p.dir] = true;
  }
  const orderedStarts = [...starts.values()].sort((a, b) => a.y - b.y || (language === 'fa' ? b.x - a.x : a.x - b.x));
  const numbering = new Map();
  orderedStarts.forEach((start, index) => {
    const number = index + 1;
    numbering.set(`${start.x},${start.y}`, number);
    grid[start.y][start.x].number = number;
  });

  const words = normalized.map((p) => ({
    id: p.entryId,
    clue: p.clue,
    topic: p.topic,
    answer: p.word,
    direction: p.dir,
    number: numbering.get(`${p.x},${p.y}`),
    cells: p.word.map((_, index) => ({ x: p.x + layoutDirections[p.dir].dx * index, y: p.y + layoutDirections[p.dir].dy * index }))
  })).sort((a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1));

  const fingerprint = words.map((word) => word.id).sort().join('|');
  return {
    id: `${language}-${serial}-${Math.random().toString(36).slice(2, 8)}`,
    fingerprint,
    language,
    difficulty,
    width,
    height,
    grid,
    words,
    totalCells: grid.flat().filter(Boolean).length
  };
}

export function generatePuzzle(language = 'fa', difficulty = 'small', serial = 1, excluded = new Set(), topic = 'all') {
  const targets = { small: { words: 5, span: 12 }, medium: { words: 7, span: 16 }, large: { words: 9, span: 20 } };
  const target = targets[difficulty] || targets.small;
  const base = WORD_BANK.filter((item) => topic === 'all' || item.topic === topic);
  const entries = shuffle(base).map((item) => toEntry(item, language));
  let best = null;

  for (let attempt = 0; attempt < 90; attempt += 1) {
    const available = shuffle(entries.filter((entry) => !excluded.has(entry.id)));
    const layout = attemptLayout(available, target.words, target.span);
    if (layout.length < Math.min(4, target.words)) continue;
    const puzzle = materializePuzzle(layout, language, difficulty, serial);
    if (excluded.has(puzzle.fingerprint)) continue;
    if (!best || puzzle.words.length > best.words.length || (puzzle.words.length === best.words.length && puzzle.totalCells > best.totalCells)) best = puzzle;
    if (puzzle.words.length >= target.words) return puzzle;
  }

  if (best) return best;
  // Last-resort fallback uses a broader topic pool while still keeping the same language.
  if (topic !== 'all') return generatePuzzle(language, difficulty, serial, excluded, 'all');
  throw new Error('Unable to generate a crossword with the current word bank.');
}

export function generatePuzzleSet(language = 'fa', count = 100, previousFingerprints = []) {
  // Keep the three sizes balanced for any requested round length.
  // This keeps the difficulty distribution balanced: 34/33/33 for a 100-puzzle round.
  const smallCount = Math.ceil(count / 3);
  const mediumCount = Math.floor((count + 1) / 3);
  const largeCount = count - smallCount - mediumCount;
  const difficulties = [
    ...Array(smallCount).fill('small'),
    ...Array(mediumCount).fill('medium'),
    ...Array(largeCount).fill('large')
  ];
  const excluded = new Set(previousFingerprints);
  const puzzles = [];
  let serial = 1;

  while (puzzles.length < count && serial <= count * 12) {
    const difficulty = difficulties[puzzles.length] || 'medium';
    try {
      const puzzle = generatePuzzle(language, difficulty, serial, excluded);
      if (!excluded.has(puzzle.fingerprint)) {
        puzzles.push(puzzle);
        excluded.add(puzzle.fingerprint);
      }
    } catch (error) {
      // A later pass may succeed with another seed after this attempt.
    }
    serial += 1;
  }

  if (puzzles.length < count) {
    // Final pass: try every size before returning, without relabelling a small grid as medium.
    const fallbackSizes = ['small', 'medium', 'large'];
    let stalled = 0;
    while (puzzles.length < count && stalled < count * 12) {
      const difficulty = fallbackSizes[(serial - 1) % fallbackSizes.length];
      try {
        const puzzle = generatePuzzle(language, difficulty, serial, excluded);
        if (!excluded.has(puzzle.fingerprint)) {
          puzzles.push(puzzle);
          excluded.add(puzzle.fingerprint);
          stalled = 0;
        } else {
          stalled += 1;
        }
      } catch (error) {
        stalled += 1;
      }
      serial += 1;
    }
  }

  return shuffle(puzzles);
}
