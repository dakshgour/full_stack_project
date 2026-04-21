function getCatalog() {
  return {
    tree: {
      label: 'Tree',
      steps: [
        { title: 'Read index 0', line: 1, active: '1', values: [1, null, 2, null, null, 3, 4], focus: 0, note: 'Start at the root position of the array.' },
        { title: 'Create root', line: 3, active: '1', values: [1, null, 2, null, null, 3, 4], focus: 0, nodes: ['1'], note: 'A node with value 1 becomes the tree root.' },
      ],
    },
    graph: { label: 'Graph', steps: [{ title: 'Start at A', line: 2, current: 'A', seen: ['A'], queue: ['A'], order: [], note: 'A is marked so it will not be processed twice.' }] },
    linked: { label: 'Linked List', steps: [{ title: 'Find node 8', line: 1, nodes: [4, 8, 15, 23], focus: 1, note: 'The pointer stops at the node after which we insert.' }] },
    array: { label: 'Array', steps: [{ title: 'Seed best', line: 2, values: [7, 3, 12, 5, 18, 11], focus: 0, best: 7, note: 'The first item becomes the starting maximum.' }] },
    stack: { label: 'Stack', steps: [{ title: 'Empty stack', line: 1, items: [], note: 'A stack starts with no items.' }] },
    queue: { label: 'Queue', steps: [{ title: 'Empty queue', line: 1, items: [], note: 'A queue starts empty.' }] },
    slidingWindow: { label: 'Sliding Window', steps: [{ title: 'Start window', line: 2, values: [2, 1, 5, 1, 3, 2], left: 0, right: 0, sum: 2, best: 2, note: 'The window begins at the first value.' }] },
    twoPointers: { label: 'Two Pointers', steps: [{ title: 'Place pointers', line: 2, values: [1, 2, 4, 7, 11, 15], left: 0, right: 5, sum: 16, target: 15, note: 'Start from the smallest and largest values.' }] },
    binarySearch: { label: 'Binary Search', steps: [{ title: 'Set search range', line: 2, values: [2, 5, 8, 12, 16, 23, 38], left: 0, right: 6, mid: 3, target: 23, result: null, note: 'Binary search starts with the full sorted array.' }] },
    dfsBfs: { label: 'DFS / BFS', steps: [{ title: 'Choose start node', line: 1, current: 'A', seen: ['A'], queue: ['A'], order: [], note: 'Both traversals begin at A.' }] },
  };
}

const CATALOG = getCatalog();

function findLineNumber(code, patterns, fallback) {
  const lines = code.split('\n');
  const index = lines.findIndex((line) => patterns.some((pattern) => line.toLowerCase().includes(pattern)));
  return index >= 0 ? index + 1 : fallback;
}

function detectCodeTarget(code) {
  const normalized = code.toLowerCase();
  if ((normalized.includes('binarysearch') || normalized.includes('binary_search')) || (normalized.includes('mid') && normalized.includes('left') && normalized.includes('right') && normalized.includes('target'))) return 'binarySearch';
  if (normalized.includes('bfs') || normalized.includes('popleft') || normalized.includes('queue<') || normalized.includes('graph')) return 'graph';
  if (normalized.includes('dfs') || normalized.includes('root') || normalized.includes('treenode') || normalized.includes('tree')) return 'tree';
  if (normalized.includes('next') || normalized.includes('listnode') || normalized.includes('linked') || normalized.includes('->next')) return 'linked';
  if (normalized.includes('left') && normalized.includes('right')) return 'twoPointers';
  if (normalized.includes('window') || normalized.includes('right >= k') || normalized.includes('right - k') || normalized.includes('range(len')) return 'slidingWindow';
  if (normalized.includes('stack') || normalized.includes('.pop') || normalized.includes('st.pop')) return 'stack';
  if (normalized.includes('shift') || normalized.includes('enqueue') || normalized.includes('q.pop') || normalized.includes('front()')) return 'queue';
  return 'array';
}

function parseOverrideValues(input) {
  const arrayMatch = input.match(/(?:array|arr|nums|data|tree)\s*[:=]\s*\[?([^\]\n]+)\]?/i) || input.match(/\[([^\]]+)\]/);
  const targetMatch = input.match(/target\s*[:=]\s*(-?\d+)/i);
  const values = arrayMatch
    ? arrayMatch[1]
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .map((value) => (value === 'null' || value === 'none' ? -1 : Number(value)))
      .filter((value) => Number.isFinite(value))
    : null;
  return {
    values: values?.length ? values : null,
    target: targetMatch ? Number(targetMatch[1]) : null,
  };
}

function parseNumbersFromCode(code) {
  const vectorMatch = code.match(/(?:vector\s*<\s*int\s*>\s+\w+|std::vector\s*<\s*int\s*>\s+\w+|const\s+\w+\s*=\s*\[|\w+\s*=\s*\[)[^{=\[]*(?:=)?\s*[{[]([^}\]]+)[}\]]/i);
  if (!vectorMatch) return [2, 5, 8, 12, 16, 23, 38];
  const values = vectorMatch[1]
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
  return values.length ? values : [2, 5, 8, 12, 16, 23, 38];
}

function parseTargetFromCode(code, values) {
  const targetMatch = code.match(/(?:int|let|const|target)\s+target\s*=\s*(-?\d+)/i) || code.match(/target\s*=\s*(-?\d+)/i);
  if (!targetMatch) return values[Math.max(0, values.length - 2)] ?? 23;
  return Number(targetMatch[1]);
}

function parseTreeArrayFromCode(code, override = '') {
  const overrideValues = parseOverrideValues(override).values;
  if (overrideValues) return overrideValues;
  const arrMatch = code.match(/(?:vector\s*<\s*int\s*>\s+\w+|std::vector\s*<\s*int\s*>\s+\w+)[^{=]*(?:=)?\s*{([^}]+)}/i);
  if (!arrMatch) return [1, -1, 2, -1, -1, 3];
  const values = arrMatch[1]
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
  return values.length ? values : [1, -1, 2, -1, -1, 3];
}

function treeNodeLabelsFromArray(values) {
  return values.filter((value) => value !== -1 && value !== null).map((value) => String(value));
}

function inorderValuesFromArray(values, index = 0, result = []) {
  if (index >= values.length || values[index] === -1 || values[index] === null) return result;
  inorderValuesFromArray(values, 2 * index + 1, result);
  result.push(values[index]);
  inorderValuesFromArray(values, 2 * index + 2, result);
  return result;
}

function createTreeTraversalSteps(code, override = '') {
  const rawValues = parseTreeArrayFromCode(code, override);
  const values = rawValues.map((value) => (value === -1 ? null : value));
  const nodeLabels = treeNodeLabelsFromArray(rawValues);
  const inorderResult = inorderValuesFromArray(rawValues);
  return [
    {
      title: 'Enter main',
      line: findLineNumber(code, ['int main', 'main()'], 1),
      values,
      focus: null,
      nodes: [],
      result: [],
      active: 'main',
      stack: ['main'],
      vars: { entry: 'main()', arr: 'not created' },
      note: 'C++ execution starts in int main(), so the trace begins there.',
    },
    {
      title: 'Create input array',
      line: findLineNumber(code, ['vector<int> arr', 'std::vector<int> arr', 'arr = {'], 2),
      values,
      focus: 0,
      nodes: [],
      result: [],
      active: 'arr',
      stack: ['main'],
      vars: { arr: `[${rawValues.join(', ')}]`, tree: 'unbuilt', result: 'empty' },
      note: `main creates arr with ${rawValues.length} level-order slots. -1 means nullptr.`,
    },
    {
      title: 'Build root',
      line: findLineNumber(code, ['new treenode', 'new treenode<int>', 'buildtree'], 3),
      values,
      focus: 0,
      nodes: nodeLabels.slice(0, 1),
      result: [],
      active: String(rawValues[0]),
      stack: ['main', 'listToTree(arr, 0)'],
      vars: { index: 0, node: rawValues[0], left: 'pending', right: 'pending' },
      note: `Index 0 becomes the root node ${rawValues[0]}.`,
    },
    {
      title: 'Push traversal result',
      line: findLineNumber(code, ['push_back', 'append', 'result.push'], 6),
      values,
      focus: 0,
      nodes: nodeLabels,
      result: inorderResult,
      visit: String(inorderResult[0] ?? rawValues[0]),
      active: String(rawValues[0]),
      stack: ['main', 'inorderTraversal(tree)'],
      vars: { result: `[${inorderResult.join(', ')}]` },
      note: `The traversal finishes with result [${inorderResult.join(', ')}].`,
    },
  ];
}

function createBinarySearchSteps(code, override = '') {
  const overrideValues = parseOverrideValues(override);
  const values = overrideValues.values || parseNumbersFromCode(code);
  const target = overrideValues.target ?? parseTargetFromCode(code, values);
  const steps = [];
  let left = 0;
  let right = values.length - 1;

  steps.push({
    title: 'Set search range',
    line: findLineNumber(code, ['left = 0', 'right =', 'right='], 2),
    values,
    left,
    right,
    mid: Math.floor((left + right) / 2),
    target,
    result: null,
    stack: ['main', 'binarySearch(arr, target)'],
    vars: { left, right, target, result: 'pending' },
    note: `Searching ${values.length} sorted values for ${target}.`,
  });

  while (left <= right && steps.length < 12) {
    const mid = left + Math.floor((right - left) / 2);
    const midValue = values[mid];
    steps.push({
      title: 'Check middle',
      line: findLineNumber(code, [' mid ', ' mid=', ' mid =', '(right - left)', '// 2'], 5),
      values,
      left,
      right,
      mid,
      target,
      result: null,
      stack: ['main', 'binarySearch(arr, target)', 'while left <= right'],
      vars: { left, right, mid, 'arr[mid]': midValue, target },
      note: `mid is ${mid}, so arr[mid] is ${midValue}.`,
    });

    if (midValue === target) {
      steps.push({
        title: 'Found target',
        line: findLineNumber(code, ['return mid', 'arr[mid] == target', 'arr[mid] === target'], 6),
        values,
        left,
        right,
        mid,
        target,
        result: mid,
        stack: ['main', 'binarySearch(arr, target)'],
        vars: { left, right, mid, target, returnValue: mid },
        note: `${midValue} equals ${target}, so the function returns index ${mid}.`,
      });
      return steps;
    }

    if (midValue < target) {
      left = mid + 1;
      steps.push({
        title: 'Search right half',
        line: findLineNumber(code, ['left = mid + 1', 'left=mid+1'], 7),
        values,
        left,
        right,
        mid,
        target,
        result: null,
        stack: ['main', 'binarySearch(arr, target)', 'while left <= right'],
        vars: { left, right, target, decision: 'left = mid + 1' },
        note: `${midValue} is smaller than ${target}, so left moves to ${left}.`,
      });
    } else {
      right = mid - 1;
      steps.push({
        title: 'Search left half',
        line: findLineNumber(code, ['right = mid - 1', 'right=mid-1'], 8),
        values,
        left,
        right,
        mid,
        target,
        result: null,
        stack: ['main', 'binarySearch(arr, target)', 'while left <= right'],
        vars: { left, right, target, decision: 'right = mid - 1' },
        note: `${midValue} is larger than ${target}, so right moves to ${right}.`,
      });
    }
  }

  steps.push({
    title: 'Target not found',
    line: findLineNumber(code, ['return -1'], 10),
    values,
    left,
    right,
    mid: null,
    target,
    result: -1,
    stack: ['main', 'binarySearch(arr, target)'],
    vars: { left, right, target, returnValue: -1 },
    note: `The search range is empty, so ${target} is not in the array.`,
  });
  return steps;
}

export function executeVisualization({ code, language, inputOverride = '' }) {
  const patternDetected = detectCodeTarget(code);
  const steps = patternDetected === 'binarySearch'
    ? createBinarySearchSteps(code, inputOverride)
    : patternDetected === 'tree'
      ? createTreeTraversalSteps(code, inputOverride)
      : CATALOG[patternDetected]?.steps || CATALOG.array.steps;
  const firstStep = steps[0];

  return {
    language,
    patternDetected,
    steps,
    analysis: {
      pattern: CATALOG[patternDetected]?.label || patternDetected,
      language,
      confidence: patternDetected === 'binarySearch' || patternDetected === 'tree' ? 'High' : 'Medium',
      input: firstStep?.values ? JSON.stringify(firstStep.values) : inputOverride || 'Built-in sample',
      mode: patternDetected === 'binarySearch' || patternDetected === 'tree' ? 'Generated trace' : 'Pattern demo',
    },
  };
}
