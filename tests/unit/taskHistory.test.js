const { buildHistory } = require('../../src/utils/taskHistory');

describe('buildHistory (unit)', () => {
  test('returns empty array when nothing changes', () => {
    const oldTask = { titre: 'A', priorite: 1 };
    const newData = { titre: 'A', priorite: 1 };

    const history = buildHistory(oldTask, newData);
    expect(history).toEqual([]);
  });

  test('records changed fields only', () => {
    const oldTask = { titre: 'A', statut: 'à faire', priorite: 1 };
    const newData = { titre: 'B', statut: 'à faire', priorite: 2 };

    const history = buildHistory(oldTask, newData);
    expect(history).toHaveLength(2);

    const fields = history.map((h) => h.champModifie).sort();
    expect(fields).toEqual(['priorite', 'titre']);

    for (const entry of history) {
      expect(entry).toHaveProperty('ancienneValeur');
      expect(entry).toHaveProperty('nouvelleValeur');
      expect(entry).toHaveProperty('date');
      expect(entry.date).toBeInstanceOf(Date);
    }
  });

  test('ignores undefined fields', () => {
    const oldTask = { titre: 'A' };
    const newData = { titre: undefined, description: 'X' };

    const history = buildHistory(oldTask, newData);
    expect(history).toEqual([]);
  });
});
