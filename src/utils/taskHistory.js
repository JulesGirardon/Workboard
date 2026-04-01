// Build a change history between an existing task and new data.
// Returns an array of history entries that can be appended to `histoireModifications`.
function buildHistory(oldTask, newData) {
  const history = [];

  for (const key of Object.keys(newData || {})) {
    const oldValue = oldTask?.[key];
    const newValue = newData?.[key];

    if (oldValue === undefined || newValue === undefined) continue;

    if (oldValue?.toString?.() !== newValue?.toString?.()) {
      history.push({
        champModifie: key,
        ancienneValeur: oldValue,
        nouvelleValeur: newValue,
        date: new Date(),
      });
    }
  }

  return history;
}

module.exports = { buildHistory };
