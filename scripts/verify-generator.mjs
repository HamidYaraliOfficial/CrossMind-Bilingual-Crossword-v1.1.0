import assert from 'node:assert/strict';
import { generatePuzzleSet } from '../src/crossword.js';

for (const language of ['fa', 'en']) {
  const firstRound = generatePuzzleSet(language, 100);
  assert.equal(firstRound.length, 100, `${language}: exactly 100 puzzles should be generated`);
  assert.equal(new Set(firstRound.map((puzzle) => puzzle.fingerprint)).size, 100, `${language}: puzzle fingerprints must be unique within a round`);

  const difficultyCounts = firstRound.reduce((counts, puzzle) => {
    counts[puzzle.difficulty] = (counts[puzzle.difficulty] || 0) + 1;
    return counts;
  }, {});
  assert.equal(difficultyCounts.small, 34, `${language}: expected 34 small puzzles`);
  assert.equal(difficultyCounts.medium, 33, `${language}: expected 33 medium puzzles`);
  assert.equal(difficultyCounts.large, 33, `${language}: expected 33 large puzzles`);

  for (const puzzle of firstRound) {
    assert.ok(puzzle.width >= 1 && puzzle.height >= 1, 'grid dimensions must be positive');
    const wordCells = puzzle.words.map((word) => new Set(word.cells.map((cell) => `${cell.x},${cell.y}`)));

    for (const [wordIndex, word] of puzzle.words.entries()) {
      assert.ok(word.cells.length >= 3, 'every answer must contain at least 3 letters');
      assert.ok(word.topic, 'every clue must retain its topic');
      word.cells.forEach((cell, index) => {
        assert.equal(puzzle.grid[cell.y][cell.x].solution, word.answer[index], `${language}: ${word.id} must map to its solution letters`);
        const ownerId = puzzle.grid[cell.y][cell.x][word.direction];
        assert.equal(ownerId, word.id, `${language}: grid cell must link back to its across/down clue`);
      });
      const intersectsAnother = wordCells.some((otherCells, otherIndex) => otherIndex !== wordIndex && word.cells.some((cell) => otherCells.has(`${cell.x},${cell.y}`)));
      assert.ok(intersectsAnother, `${language}: every answer must be connected through at least one crossing`);
      if (language === 'fa' && word.direction === 'across' && word.cells.length > 1) {
        assert.ok(word.cells[0].x > word.cells[1].x, 'Persian across answers must run from right to left');
      }
    }
  }

  const secondRound = generatePuzzleSet(language, 100, firstRound.map((puzzle) => puzzle.fingerprint));
  const firstFingerprints = new Set(firstRound.map((puzzle) => puzzle.fingerprint));
  assert.equal(secondRound.length, 100, `${language}: a second full round should also be generated`);
  assert.equal(secondRound.filter((puzzle) => firstFingerprints.has(puzzle.fingerprint)).length, 0, `${language}: second round must not repeat first-round puzzles`);

  console.log(`✓ ${language.toUpperCase()}: 200 unique puzzles across two rounds; ${difficultyCounts.small}/${difficultyCounts.medium}/${difficultyCounts.large} difficulty split per round.`);
}
