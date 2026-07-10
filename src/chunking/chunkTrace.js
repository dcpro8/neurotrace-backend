function chunkSteps(steps, windowSize = 4, overlap = 1) {
  const chunks = [];
  let i = 0;

  while (i < steps.length) {
    const windowSteps = steps.slice(i, i + windowSize);
    if (windowSteps.length === 0) break;

    const text = windowSteps
      .map(s => `[${s.type}] ${s.content}`)
      .join('\n');

    chunks.push({
      stepRange: { start: windowSteps[0].stepIndex, end: windowSteps[windowSteps.length - 1].stepIndex },
      text
    });

    i += windowSize - overlap;
  }

  return chunks;
}

module.exports = chunkSteps;