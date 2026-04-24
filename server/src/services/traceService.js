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

export function detectCodeTarget(code) {
  const normalized = code.toLowerCase();
  if ((normalized.includes('binarysearch') || normalized.includes('binary_search')) || (normalized.includes('mid') && normalized.includes('left') && normalized.includes('right') && normalized.includes('target'))) return 'binarySearch';
  if (normalized.includes('bfs') || normalized.includes('popleft') || normalized.includes('queue<') || normalized.includes('graph') || normalized.includes('adjacency')) return 'graph';
  if (normalized.includes('dfs') || normalized.includes('root') || normalized.includes('treenode') || normalized.includes('tree') || normalized.includes('inorder') || normalized.includes('preorder') || normalized.includes('postorder')) return 'tree';
  if (normalized.includes('next') || normalized.includes('listnode') || normalized.includes('linked') || normalized.includes('->next') || normalized.includes('.next')) return 'linked';
  if (normalized.includes('left') && normalized.includes('right') && (normalized.includes('two') || normalized.includes('sorted') || normalized.includes('target'))) return 'twoPointers';
  if (normalized.includes('window') || normalized.includes('right >= k') || normalized.includes('right - k') || normalized.includes('range(len') || normalized.includes('sliding')) return 'slidingWindow';
  if (normalized.includes('stack') || normalized.includes('st.pop') || normalized.includes('st.push') || normalized.includes('stack<')) return 'stack';
  if (normalized.includes('shift') || normalized.includes('enqueue') || normalized.includes('q.pop') || normalized.includes('front()') || normalized.includes('deque') || normalized.includes('queue')) return 'queue';
  if (normalized.includes('arraylist') || normalized.includes('hashmap') || normalized.includes('public static void main') || normalized.includes('system.out')) return 'array';
  return 'array';
}

function parseOverrideValues(input) {
  const arrayMatch = input.match(/(?:array|arr|nums|data|tree|colors|items|houses)\s*[:=]\s*\[?([^\]\n]+)\]?/i) || input.match(/\[([^\]]+)\]/);
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

function parseArrayFromOverrideOrCode(code, override = '') {
  const overrideValues = parseOverrideValues(override);
  if (overrideValues.values) return { values: overrideValues.values, target: overrideValues.target };
  const values = parseNumbersFromCode(code);
  const target = parseTargetFromCode(code, values);
  return { values, target };
}

function parseKFromCode(code, override = '') {
  const overrideK = override.match(/k\s*[:=]\s*(\d+)/i);
  if (overrideK) return Number(overrideK[1]);
  const kMatch = code.match(/(?:int|let|const|var)\s+k\s*=\s*(\d+)/i) || code.match(/,\s*(\d+)\s*\)/);
  return kMatch ? Number(kMatch[1]) : 3;
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
      values, focus: null, nodes: [], result: [],
      active: 'main', stack: ['main'],
      vars: { entry: 'main()', arr: 'not created' },
      note: 'Execution starts in main(), so the trace begins there.',
    },
    {
      title: 'Create input array',
      line: findLineNumber(code, ['vector<int> arr', 'std::vector<int> arr', 'arr = {', 'arr ='], 2),
      values, focus: 0, nodes: [], result: [],
      active: 'arr', stack: ['main'],
      vars: { arr: `[${rawValues.join(', ')}]`, tree: 'unbuilt', result: 'empty' },
      note: `main creates arr with ${rawValues.length} level-order slots. -1 means null.`,
    },
    {
      title: 'Build root',
      line: findLineNumber(code, ['new treenode', 'new treenode<int>', 'buildtree'], 3),
      values, focus: 0,
      nodes: nodeLabels.slice(0, 1), result: [],
      active: String(rawValues[0]),
      stack: ['main', 'buildTree(arr, 0)'],
      vars: { index: 0, node: rawValues[0], left: 'pending', right: 'pending' },
      note: `Index 0 becomes the root node ${rawValues[0]}.`,
    },
    {
      title: 'Push traversal result',
      line: findLineNumber(code, ['push_back', 'append', 'result.push'], 6),
      values, focus: 0,
      nodes: nodeLabels, result: inorderResult,
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
    values, left, right,
    mid: Math.floor((left + right) / 2), target, result: null,
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
      values, left, right, mid, target, result: null,
      stack: ['main', 'binarySearch(arr, target)', 'while left <= right'],
      vars: { left, right, mid, 'arr[mid]': midValue, target },
      note: `mid is ${mid}, so arr[mid] is ${midValue}.`,
    });

    if (midValue === target) {
      steps.push({
        title: 'Found target',
        line: findLineNumber(code, ['return mid', 'arr[mid] == target', 'arr[mid] === target'], 6),
        values, left, right, mid, target, result: mid,
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
        values, left, right, mid, target, result: null,
        stack: ['main', 'binarySearch(arr, target)', 'while left <= right'],
        vars: { left, right, target, decision: 'left = mid + 1' },
        note: `${midValue} is smaller than ${target}, so left moves to ${left}.`,
      });
    } else {
      right = mid - 1;
      steps.push({
        title: 'Search left half',
        line: findLineNumber(code, ['right = mid - 1', 'right=mid-1'], 8),
        values, left, right, mid, target, result: null,
        stack: ['main', 'binarySearch(arr, target)', 'while left <= right'],
        vars: { left, right, target, decision: 'right = mid - 1' },
        note: `${midValue} is larger than ${target}, so right moves to ${right}.`,
      });
    }
  }

  steps.push({
    title: 'Target not found',
    line: findLineNumber(code, ['return -1'], 10),
    values, left, right, mid: null, target, result: -1,
    stack: ['main', 'binarySearch(arr, target)'],
    vars: { left, right, target, returnValue: -1 },
    note: `The search range is empty, so ${target} is not in the array.`,
  });
  return steps;
}

function createSlidingWindowSteps(code, override = '') {
  const { values } = parseArrayFromOverrideOrCode(code, override);
  const k = parseKFromCode(code, override);
  const steps = [];
  let sum = 0;
  let best = -Infinity;

  for (let right = 0; right < values.length && steps.length < 15; right++) {
    sum += values[right];
    const left = Math.max(0, right - k + 1);
    if (right >= k) sum -= values[right - k];
    if (right >= k - 1) best = Math.max(best, sum);

    steps.push({
      title: right < k ? `Expand window (add ${values[right]})` : `Slide window`,
      line: right + 2,
      values, left: right >= k - 1 ? left : 0, right, sum,
      best: best === -Infinity ? sum : best,
      note: right < k
        ? `Adding ${values[right]} to build the initial window. Current sum is ${sum}.`
        : `Window slides: drop ${values[right - k]}, add ${values[right]}. Sum = ${sum}, best = ${best}.`,
    });
  }

  steps.push({
    title: 'Scan complete',
    line: values.length + 2,
    values, left: Math.max(0, values.length - k), right: values.length - 1,
    sum, best: best === -Infinity ? sum : best,
    note: `Maximum window sum of size ${k} is ${best === -Infinity ? sum : best}.`,
  });

  return steps;
}

function createTwoPointersSteps(code, override = '') {
  const { values, target: parsedTarget } = parseArrayFromOverrideOrCode(code, override);
  const sorted = [...values].sort((a, b) => a - b);
  const target = parsedTarget ?? sorted[0] + sorted[sorted.length - 1];
  const steps = [];
  let left = 0;
  let right = sorted.length - 1;

  steps.push({
    title: 'Place pointers',
    line: 2, values: sorted, left, right,
    sum: sorted[left] + sorted[right], target,
    note: `Start with left at ${sorted[left]} and right at ${sorted[right]}. Target sum is ${target}.`,
  });

  while (left < right && steps.length < 15) {
    const currentSum = sorted[left] + sorted[right];
    if (currentSum === target) {
      steps.push({
        title: 'Found target pair', line: 6,
        values: sorted, left, right, sum: currentSum, target,
        note: `${sorted[left]} + ${sorted[right]} = ${currentSum} equals target. Pair found!`,
      });
      break;
    } else if (currentSum < target) {
      left++;
      steps.push({
        title: 'Sum too small — move left', line: 7,
        values: sorted, left, right, sum: sorted[left] + sorted[right], target,
        note: `${currentSum} < ${target}, so move left pointer right to ${sorted[left]}.`,
      });
    } else {
      right--;
      steps.push({
        title: 'Sum too large — move right', line: 8,
        values: sorted, left, right, sum: sorted[left] + sorted[right], target,
        note: `${currentSum} > ${target}, so move right pointer left to ${sorted[right]}.`,
      });
    }
  }

  return steps;
}

function createArraySteps(code, override = '') {
  const normalized = code.toLowerCase();
  const looksLikeMaxDistance =
    (normalized.includes('maxdistance') || normalized.includes('max_distance'))
    || (normalized.includes('colors[') && normalized.includes('abs(') && normalized.includes('!='));

  if (looksLikeMaxDistance) {
    const { values } = parseArrayFromOverrideOrCode(code, override);
    const initLine = findLineNumber(code, ['ans=', 'ans =', 'int ans', 'n =', 'size()'], 2);
    const outerLoopLine = findLineNumber(code, ['for(int i', 'for (int i', 'for i in range'], 4);
    const innerLoopLine = findLineNumber(code, ['for(int j', 'for (int j', 'for j in range'], 5);
    const compareLine = findLineNumber(code, ['colors[i]!=colors[j]', 'colors[i] != colors[j]', 'colors[i] != colors[j]'], 6);
    const updateLine = findLineNumber(code, ['ans=max(abs(i-j),ans)', 'ans = max(abs(i - j), ans)', 'ans = max(abs(i-j), ans)'], 7);
    const returnLine = findLineNumber(code, ['return ans'], 9);
    const steps = [];
    let best = Number.NEGATIVE_INFINITY;

    steps.push({
      title: 'Initialize ans and n',
      line: initLine,
      values,
      focus: 0,
      best: '-inf',
      vars: { ans: 'INT_MIN', n: values.length },
      note: `Set ans to INT_MIN and n to ${values.length} before scanning every pair.`,
    });

    for (let i = 0; i < values.length && steps.length < 14; i++) {
      steps.push({
        title: `Outer loop i = ${i}`,
        line: outerLoopLine,
        values,
        focus: i,
        best: best === Number.NEGATIVE_INFINITY ? '-inf' : best,
        vars: { i, ans: best === Number.NEGATIVE_INFINITY ? 'INT_MIN' : best },
        note: `Start checking all j positions against colors[${i}] = ${values[i]}.`,
      });

      for (let j = 0; j < values.length && steps.length < 14; j++) {
        const distance = Math.abs(i - j);
        const different = values[i] !== values[j];

        if (!different && i === 0 && j === 0) {
          steps.push({
            title: 'Skip equal colors',
            line: compareLine,
            values,
            focus: j,
            best: best === Number.NEGATIVE_INFINITY ? '-inf' : best,
            vars: { i, j, 'colors[i]': values[i], 'colors[j]': values[j], ans: best === Number.NEGATIVE_INFINITY ? 'INT_MIN' : best },
            note: `colors[${i}] and colors[${j}] are both ${values[i]}, so ans does not change.`,
          });
          continue;
        }

        if (!different) continue;

        const nextBest = Math.max(best, distance);
        steps.push({
          title: nextBest > best ? `Update ans with (${i}, ${j})` : `Check pair (${i}, ${j})`,
          line: nextBest > best ? updateLine : compareLine,
          values,
          focus: j,
          best: nextBest,
          vars: { i, j, 'colors[i]': values[i], 'colors[j]': values[j], distance, ans: nextBest },
          note: nextBest > best
            ? `colors[${i}] = ${values[i]} and colors[${j}] = ${values[j]} differ, so ans becomes max(${distance}, ${best === Number.NEGATIVE_INFINITY ? 'INT_MIN' : best}) = ${nextBest}.`
            : `The colors differ, but distance ${distance} does not beat the current ans ${best}.`,
        });
        best = nextBest;
      }
    }

    steps.push({
      title: 'Return result',
      line: returnLine,
      values,
      focus: null,
      best,
      vars: { ans: best },
      note: `The farthest pair of different colors is ${best}.`,
    });

    return steps;
  }

  const { values } = parseArrayFromOverrideOrCode(code, override);
  const steps = [];
  let best = values[0];

  steps.push({
    title: 'Seed best', line: 2,
    values, focus: 0, best,
    note: `The first item ${values[0]} becomes the starting best value.`,
  });

  for (let i = 1; i < values.length && steps.length < 15; i++) {
    const prev = best;
    best = Math.max(best, values[i]);
    steps.push({
      title: `Compare ${values[i]}`, line: 4,
      values, focus: i, best,
      note: values[i] > prev
        ? `${values[i]} beats ${prev} and becomes the new best.`
        : `${values[i]} does not change the best value of ${best}.`,
    });
  }

  steps.push({
    title: 'Return result', line: 6,
    values, focus: values.length - 1, best,
    note: `Scan complete. The maximum value is ${best}.`,
  });

  return steps;
}

function createStackSteps(code) {
  const ops = [];
  const pushMatches = code.matchAll(/\.push\s*\(\s*["']?(\w+)["']?\s*\)/gi);
  for (const m of pushMatches) ops.push({ type: 'push', value: m[1] });
  const popMatches = code.matchAll(/\.pop\s*\(\s*\)/gi);
  for (const m of popMatches) ops.push({ type: 'pop' });
  const appendMatches = code.matchAll(/\.append\s*\(\s*["']?(\w+)["']?\s*\)/gi);
  for (const m of appendMatches) ops.push({ type: 'push', value: m[1] });
  if (!ops.length) {
    ops.push({ type: 'push', value: 'A' }, { type: 'push', value: 'B' }, { type: 'push', value: 'C' }, { type: 'pop' });
  }

  const items = [];
  const steps = [{ title: 'Empty stack', line: 1, items: [], note: 'A stack starts with no items.' }];

  for (const op of ops) {
    if (op.type === 'push') {
      items.push(op.value);
      steps.push({ title: `Push ${op.value}`, line: 2, items: [...items], focus: items.length - 1, note: `${op.value} is now at the top of the stack.` });
    } else if (op.type === 'pop' && items.length) {
      const popped = items.pop();
      steps.push({ title: `Pop ${popped}`, line: 5, items: [...items], popped, note: `${popped} removed from the top. Last in, first out.` });
    }
  }

  return steps;
}

function createQueueSteps(code) {
  const ops = [];
  const pushMatches = code.matchAll(/\.push\s*\(\s*["']?(\w+)["']?\s*\)/gi);
  for (const m of pushMatches) ops.push({ type: 'enqueue', value: m[1] });
  const appendMatches = code.matchAll(/\.append\s*\(\s*["']?(\w+)["']?\s*\)/gi);
  for (const m of appendMatches) ops.push({ type: 'enqueue', value: m[1] });
  const shiftMatches = code.matchAll(/\.shift\s*\(\s*\)/gi);
  for (const m of shiftMatches) ops.push({ type: 'dequeue' });
  const popleftMatches = code.matchAll(/\.popleft\s*\(\s*\)/gi);
  for (const m of popleftMatches) ops.push({ type: 'dequeue' });
  if (!ops.length) {
    ops.push({ type: 'enqueue', value: 'A' }, { type: 'enqueue', value: 'B' }, { type: 'enqueue', value: 'C' }, { type: 'dequeue' });
  }

  const items = [];
  const steps = [{ title: 'Empty queue', line: 1, items: [], note: 'A queue starts empty.' }];

  for (const op of ops) {
    if (op.type === 'enqueue') {
      items.push(op.value);
      steps.push({ title: `Enqueue ${op.value}`, line: 2, items: [...items], focus: items.length - 1, note: `${op.value} joins the back of the queue.` });
    } else if (op.type === 'dequeue' && items.length) {
      const removed = items.shift();
      steps.push({ title: `Dequeue ${removed}`, line: 5, items: [...items], removed, note: `${removed} removed from the front. First in, first out.` });
    }
  }

  return steps;
}

function createLinkedListSteps(code, override = '') {
  let nodes = [4, 8, 15, 23];
  const arrMatch = code.match(/\[([^\]]+)\]/);
  if (arrMatch) {
    const vals = arrMatch[1].split(',').map((v) => Number(v.trim())).filter(Number.isFinite);
    if (vals.length) nodes = vals;
  }
  const overrideMatch = override.match(/nodes?\s*[:=]\s*\[([^\]]+)\]/i);
  if (overrideMatch) {
    const vals = overrideMatch[1].split(',').map((v) => v.trim()).filter(Boolean).map(Number).filter(Number.isFinite);
    if (vals.length) nodes = vals;
  }

  const insertValue = 16;
  const focusIdx = Math.min(1, nodes.length - 1);
  const newNodes = [...nodes];
  newNodes.splice(focusIdx + 1, 0, insertValue);

  return [
    { title: `Find node ${nodes[focusIdx]}`, line: 1, nodes: [...nodes], focus: focusIdx, note: `The pointer stops at node ${nodes[focusIdx]}.` },
    { title: `Create node ${insertValue}`, line: 2, nodes: [...nodes], fresh: insertValue, focus: focusIdx, note: `A new node with value ${insertValue} is created.` },
    { title: `Link new node`, line: 3, nodes: newNodes, focus: focusIdx + 1, note: `The new node borrows the old next pointer.` },
    { title: `Update previous`, line: 4, nodes: newNodes, focus: focusIdx + 1, note: `Node ${nodes[focusIdx]} now links to ${insertValue}.` },
    { title: 'Insertion complete', line: 5, nodes: newNodes, focus: focusIdx + 1, done: true, note: `List: [${newNodes.join(' → ')}].` },
  ];
}

function createGraphBfsSteps() {
  const graph = { A: ['B', 'C'], B: ['A', 'C', 'D'], C: ['A', 'B', 'E'], D: ['B', 'F'], E: ['C', 'F'], F: ['D', 'E'] };
  const start = 'A';
  const seen = new Set([start]);
  const queue = [start];
  const order = [];
  const edges = [];
  const steps = [];

  steps.push({ title: `Start at ${start}`, line: 2, current: start, seen: [start], queue: [start], order: [], edges: [], note: `${start} is marked visited.` });

  while (queue.length && steps.length < 12) {
    const node = queue.shift();
    order.push(node);
    const newNeighbors = [];
    for (const next of graph[node] || []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
        edges.push(`${node}-${next}`);
        newNeighbors.push(next);
      }
    }
    steps.push({
      title: newNeighbors.length ? `Process ${node}, discover ${newNeighbors.join(', ')}` : `Process ${node}`,
      line: 6, current: node, seen: [...seen], queue: [...queue], order: [...order], edges: [...edges],
      note: newNeighbors.length ? `${node} discovers: ${newNeighbors.join(', ')}.` : `${node} has no unvisited neighbors.`,
    });
  }

  steps.push({ title: 'Traversal complete', line: 10, current: order[order.length - 1], seen: [...seen], queue: [], order: [...order], edges: [...edges], note: `BFS order: ${order.join(' → ')}.` });
  return steps;
}

export function executeVisualization({ code, language, inputOverride = '' }) {
  const patternDetected = detectCodeTarget(code);

  const generators = {
    binarySearch: () => createBinarySearchSteps(code, inputOverride),
    tree: () => createTreeTraversalSteps(code, inputOverride),
    slidingWindow: () => createSlidingWindowSteps(code, inputOverride),
    twoPointers: () => createTwoPointersSteps(code, inputOverride),
    array: () => createArraySteps(code, inputOverride),
    stack: () => createStackSteps(code),
    queue: () => createQueueSteps(code),
    linked: () => createLinkedListSteps(code, inputOverride),
    graph: () => createGraphBfsSteps(),
    dfsBfs: () => createGraphBfsSteps(),
  };

  const generator = generators[patternDetected];
  const steps = generator ? generator() : CATALOG[patternDetected]?.steps || CATALOG.array.steps;
  const firstStep = steps[0];

  return {
    language,
    patternDetected,
    steps,
    analysis: {
      pattern: CATALOG[patternDetected]?.label || patternDetected,
      language,
      confidence: 'High',
      input: firstStep?.values ? JSON.stringify(firstStep.values) : inputOverride || 'Built-in sample',
      mode: 'Generated trace',
    },
  };
}
