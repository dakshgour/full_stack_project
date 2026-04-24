import { useEffect, useMemo, useState } from 'react';

const STRUCTURES = {
  tree: {
    label: 'Tree',
    accent: '#29d765',
    description: 'Build a binary tree from an array, then visit the left branch, root, and right branch in order.',
    code: [
      'function buildTree(arr, index = 0) {',
      '  if (index >= arr.length || arr[index] === null) return null;',
      '  const root = new Node(arr[index]);',
      '  root.left = buildTree(arr, 2 * index + 1);',
      '  root.right = buildTree(arr, 2 * index + 2);',
      '  return root;',
      '}',
      '',
      'function inorder(root, result = []) {',
      '  if (!root) return result;',
      '  inorder(root.left, result);',
      '  result.push(root.value);',
      '  inorder(root.right, result);',
      '  return result;',
      '}',
    ],
    steps: [
      { title: 'Read index 0', line: 1, active: '1', values: [1, null, 2, null, null, 3, 4], focus: 0, note: 'Start at the root position of the array.' },
      { title: 'Create root', line: 3, active: '1', values: [1, null, 2, null, null, 3, 4], focus: 0, nodes: ['1'], note: 'A node with value 1 becomes the tree root.' },
      { title: 'Check left child', line: 4, active: 'null', values: [1, null, 2, null, null, 3, 4], focus: 1, nodes: ['1'], note: 'Index 1 is empty, so the root has no left child.' },
      { title: 'Build right child', line: 5, active: '2', values: [1, null, 2, null, null, 3, 4], focus: 2, nodes: ['1', '2'], note: 'Index 2 becomes the right child.' },
      { title: 'Attach descendants', line: 5, active: '3', values: [1, null, 2, null, null, 3, 4], focus: 5, nodes: ['1', '2', '3', '4'], note: 'The subtree fills in from the remaining array positions.' },
      { title: 'Visit left', line: 11, active: 'left', values: [1, null, 2, null, null, 3, 4], focus: 0, nodes: ['1', '2', '3', '4'], visit: 'left', result: [], note: 'Inorder traversal first tries the left branch.' },
      { title: 'Visit root', line: 12, active: '1', values: [1, null, 2, null, null, 3, 4], focus: 0, nodes: ['1', '2', '3', '4'], visit: '1', result: [1], note: 'With no left child, the root is recorded.' },
      { title: 'Walk right subtree', line: 13, active: '2', values: [1, null, 2, null, null, 3, 4], focus: 2, nodes: ['1', '2', '3', '4'], visit: '2', result: [1, 3, 2, 4], note: 'The right subtree contributes 3, then 2, then 4.' },
    ],
  },
  graph: {
    label: 'Graph',
    accent: '#58a6ff',
    description: 'Run breadth-first search from A, using a queue to discover nearby vertices before distant ones.',
    code: [
      'function bfs(graph, start) {',
      '  const seen = new Set([start]);',
      '  const queue = [start];',
      '  const order = [];',
      '  while (queue.length) {',
      '    const node = queue.shift();',
      '    order.push(node);',
      '    for (const next of graph[node]) {',
      '      if (!seen.has(next)) {',
      '        seen.add(next);',
      '        queue.push(next);',
      '      }',
      '    }',
      '  }',
      '}',
    ],
    steps: [
      { title: 'Start at A', line: 2, current: 'A', seen: ['A'], queue: ['A'], order: [], note: 'A is marked so it will not be processed twice.' },
      { title: 'Dequeue A', line: 6, current: 'A', seen: ['A'], queue: [], order: ['A'], note: 'A is removed from the queue and added to the visit order.' },
      { title: 'Discover B and C', line: 10, current: 'A', seen: ['A', 'B', 'C'], queue: ['B', 'C'], order: ['A'], edges: ['A-B', 'A-C'], note: 'Unvisited neighbors join the queue.' },
      { title: 'Process B', line: 7, current: 'B', seen: ['A', 'B', 'C', 'D'], queue: ['C', 'D'], order: ['A', 'B'], edges: ['A-B', 'A-C', 'B-D'], note: 'B discovers D.' },
      { title: 'Process C', line: 7, current: 'C', seen: ['A', 'B', 'C', 'D', 'E'], queue: ['D', 'E'], order: ['A', 'B', 'C'], edges: ['A-B', 'A-C', 'B-D', 'C-E'], note: 'C discovers E.' },
      { title: 'Finish queue', line: 5, current: 'E', seen: ['A', 'B', 'C', 'D', 'E', 'F'], queue: [], order: ['A', 'B', 'C', 'D', 'E', 'F'], edges: ['A-B', 'A-C', 'B-D', 'C-E', 'D-F', 'E-F'], note: 'Every reachable vertex has been visited.' },
    ],
  },
  linked: {
    label: 'Linked List',
    accent: '#f2cc60',
    description: 'Insert a node in the middle by changing only two next pointers.',
    code: [
      'function insertAfter(node, value) {',
      '  const fresh = new ListNode(value);',
      '  fresh.next = node.next;',
      '  node.next = fresh;',
      '  return fresh;',
      '}',
    ],
    steps: [
      { title: 'Find node 8', line: 1, nodes: [4, 8, 15, 23], focus: 1, note: 'The pointer stops at the node after which we insert.' },
      { title: 'Create node 16', line: 2, nodes: [4, 8, 15, 23], fresh: 16, focus: 1, note: 'The new node exists but is not linked yet.' },
      { title: 'Point fresh to 15', line: 3, nodes: [4, 8, 16, 15, 23], focus: 2, softEdge: '16-15', note: 'The new node borrows the old next pointer.' },
      { title: 'Point 8 to fresh', line: 4, nodes: [4, 8, 16, 15, 23], focus: 2, note: 'The previous node now links into the new node.' },
      { title: 'Insertion complete', line: 5, nodes: [4, 8, 16, 15, 23], focus: 2, done: true, note: 'The list stays connected from head to tail.' },
    ],
  },
  array: {
    label: 'Array',
    accent: '#ff7b72',
    description: 'Scan an array and keep the largest value seen so far.',
    code: [
      'function maxValue(items) {',
      '  let best = items[0];',
      '  for (let i = 1; i < items.length; i++) {',
      '    if (items[i] > best) best = items[i];',
      '  }',
      '  return best;',
      '}',
    ],
    steps: [
      { title: 'Seed best', line: 2, values: [7, 3, 12, 5, 18, 11], focus: 0, best: 7, note: 'The first item becomes the starting maximum.' },
      { title: 'Compare 3', line: 4, values: [7, 3, 12, 5, 18, 11], focus: 1, best: 7, note: '3 is smaller, so best stays 7.' },
      { title: 'Compare 12', line: 4, values: [7, 3, 12, 5, 18, 11], focus: 2, best: 12, note: '12 beats 7 and becomes the new best.' },
      { title: 'Compare 5', line: 4, values: [7, 3, 12, 5, 18, 11], focus: 3, best: 12, note: '5 does not change the best value.' },
      { title: 'Compare 18', line: 4, values: [7, 3, 12, 5, 18, 11], focus: 4, best: 18, note: '18 is now the largest value seen.' },
      { title: 'Return result', line: 6, values: [7, 3, 12, 5, 18, 11], focus: 5, best: 18, note: 'The scan is complete.' },
    ],
  },
  stack: {
    label: 'Stack',
    accent: '#d2a8ff',
    description: 'Push values onto the top, then pop the most recent value first.',
    code: [
      'const stack = [];',
      'stack.push("A");',
      'stack.push("B");',
      'stack.push("C");',
      'const top = stack.pop();',
    ],
    steps: [
      { title: 'Empty stack', line: 1, items: [], note: 'A stack starts with no items.' },
      { title: 'Push A', line: 2, items: ['A'], focus: 0, note: 'A lands at the bottom.' },
      { title: 'Push B', line: 3, items: ['A', 'B'], focus: 1, note: 'B becomes the new top.' },
      { title: 'Push C', line: 4, items: ['A', 'B', 'C'], focus: 2, note: 'C is now the next value to leave.' },
      { title: 'Pop C', line: 5, items: ['A', 'B'], popped: 'C', note: 'Last in, first out.' },
    ],
  },
  queue: {
    label: 'Queue',
    accent: '#39c5cf',
    description: 'Enqueue at the back and dequeue from the front to preserve arrival order.',
    code: [
      'const queue = [];',
      'queue.push("A");',
      'queue.push("B");',
      'queue.push("C");',
      'const first = queue.shift();',
    ],
    steps: [
      { title: 'Empty queue', line: 1, items: [], note: 'A queue starts empty.' },
      { title: 'Enqueue A', line: 2, items: ['A'], focus: 0, note: 'A is both front and back.' },
      { title: 'Enqueue B', line: 3, items: ['A', 'B'], focus: 1, note: 'B waits behind A.' },
      { title: 'Enqueue C', line: 4, items: ['A', 'B', 'C'], focus: 2, note: 'C joins the back.' },
      { title: 'Dequeue A', line: 5, items: ['B', 'C'], removed: 'A', note: 'First in, first out.' },
    ],
  },
};

const graphNodes = [
  { id: 'A', x: 110, y: 95 },
  { id: 'B', x: 235, y: 55 },
  { id: 'C', x: 235, y: 145 },
  { id: 'D', x: 370, y: 70 },
  { id: 'E', x: 370, y: 165 },
  { id: 'F', x: 500, y: 115 },
];

const graphEdges = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'E'], ['D', 'F'], ['E', 'F'], ['B', 'C']];

const PATTERNS = {
  slidingWindow: {
    label: 'Sliding Window',
    accent: '#9be564',
    description: 'Move a fixed-size window across an array while updating the running sum in constant time.',
    code: [
      'function maxWindowSum(nums, k) {',
      '  let sum = 0;',
      '  for (let right = 0; right < nums.length; right++) {',
      '    sum += nums[right];',
      '    if (right >= k) sum -= nums[right - k];',
      '    best = Math.max(best, sum);',
      '  }',
      '  return best;',
      '}',
    ],
    steps: [
      { title: 'Start window', line: 2, values: [2, 1, 5, 1, 3, 2], left: 0, right: 0, sum: 2, best: 2, note: 'The window begins at the first value.' },
      { title: 'Expand to size k', line: 4, values: [2, 1, 5, 1, 3, 2], left: 0, right: 2, sum: 8, best: 8, note: 'Values enter from the right until the window reaches size 3.' },
      { title: 'Slide right', line: 5, values: [2, 1, 5, 1, 3, 2], left: 1, right: 3, sum: 7, best: 8, note: 'Drop the left value and add the new right value.' },
      { title: 'Update best', line: 6, values: [2, 1, 5, 1, 3, 2], left: 2, right: 4, sum: 9, best: 9, note: 'The window [5, 1, 3] becomes the strongest sum.' },
      { title: 'Finish scan', line: 8, values: [2, 1, 5, 1, 3, 2], left: 3, right: 5, sum: 6, best: 9, note: 'Every size-3 window has been checked.' },
    ],
  },
  twoPointers: {
    label: 'Two Pointers',
    accent: '#ffb86b',
    description: 'Move one pointer from the left and one from the right until the target pair is found.',
    code: [
      'function twoSumSorted(nums, target) {',
      '  let left = 0;',
      '  let right = nums.length - 1;',
      '  while (left < right) {',
      '    const sum = nums[left] + nums[right];',
      '    if (sum === target) return [left, right];',
      '    if (sum < target) left++;',
      '    else right--;',
      '  }',
      '}',
    ],
    steps: [
      { title: 'Place pointers', line: 2, values: [1, 2, 4, 7, 11, 15], left: 0, right: 5, sum: 16, target: 15, note: 'Start from the smallest and largest values.' },
      { title: 'Sum too high', line: 8, values: [1, 2, 4, 7, 11, 15], left: 0, right: 4, sum: 12, target: 15, note: 'The sum was too large, so the right pointer moves left.' },
      { title: 'Sum too low', line: 7, values: [1, 2, 4, 7, 11, 15], left: 1, right: 4, sum: 13, target: 15, note: 'The sum is too small, so the left pointer moves right.' },
      { title: 'Move left again', line: 7, values: [1, 2, 4, 7, 11, 15], left: 2, right: 4, sum: 15, target: 15, note: 'The pointers now land on 4 and 11.' },
      { title: 'Return pair', line: 6, values: [1, 2, 4, 7, 11, 15], left: 2, right: 4, sum: 15, target: 15, note: 'The target pair has been found.' },
    ],
  },
  binarySearch: {
    label: 'Binary Search',
    accent: '#7dd3fc',
    description: 'Search a sorted array by checking the middle value, then discarding half of the remaining range.',
    code: [
      'function binarySearch(arr, target) {',
      '  let left = 0;',
      '  let right = arr.length - 1;',
      '  while (left <= right) {',
      '    const mid = left + Math.floor((right - left) / 2);',
      '    if (arr[mid] === target) return mid;',
      '    if (arr[mid] < target) left = mid + 1;',
      '    else right = mid - 1;',
      '  }',
      '  return -1;',
      '}',
    ],
    steps: [
      { title: 'Set search range', line: 2, values: [2, 5, 8, 12, 16, 23, 38], left: 0, right: 6, mid: 3, target: 23, result: null, note: 'Binary search starts with the full sorted array.' },
      { title: 'Check middle', line: 5, values: [2, 5, 8, 12, 16, 23, 38], left: 0, right: 6, mid: 3, target: 23, result: null, note: 'The middle value is 12.' },
      { title: 'Discard left half', line: 7, values: [2, 5, 8, 12, 16, 23, 38], left: 4, right: 6, mid: 5, target: 23, result: null, note: '12 is smaller than 23, so the left boundary moves after mid.' },
      { title: 'Found target', line: 6, values: [2, 5, 8, 12, 16, 23, 38], left: 4, right: 6, mid: 5, target: 23, result: 5, note: 'The middle value is 23, so the function returns index 5.' },
    ],
  },
  dfsBfs: {
    label: 'DFS / BFS',
    accent: '#58a6ff',
    description: 'Compare stack-style DFS and queue-style BFS on the same graph.',
    code: [
      'function traverse(graph, start) {',
      '  const bfsQueue = [start];',
      '  const dfsStack = [start];',
      '  while (bfsQueue.length || dfsStack.length) {',
      '    visitBfs(bfsQueue.shift());',
      '    visitDfs(dfsStack.pop());',
      '  }',
      '}',
    ],
    steps: [
      { title: 'Choose start node', line: 1, current: 'A', seen: ['A'], queue: ['A'], order: [], note: 'Both traversals begin at A.' },
      { title: 'BFS expands level', line: 5, current: 'A', seen: ['A', 'B', 'C'], queue: ['B', 'C'], order: ['A'], edges: ['A-B', 'A-C'], note: 'BFS uses a queue and discovers the nearest neighbors first.' },
      { title: 'DFS dives branch', line: 6, current: 'C', seen: ['A', 'B', 'C', 'E'], queue: ['B'], order: ['A', 'C'], edges: ['A-C', 'C-E'], note: 'DFS uses a stack and follows one branch deeper before coming back.' },
      { title: 'BFS frontier grows', line: 5, current: 'B', seen: ['A', 'B', 'C', 'D', 'E'], queue: ['C', 'D'], order: ['A', 'B'], edges: ['A-B', 'A-C', 'B-D', 'C-E'], note: 'BFS keeps a frontier of next nodes to process.' },
      { title: 'Traversal complete', line: 7, current: 'F', seen: ['A', 'B', 'C', 'D', 'E', 'F'], queue: [], order: ['A', 'B', 'C', 'D', 'E', 'F'], edges: ['A-B', 'A-C', 'B-D', 'C-E', 'D-F', 'E-F'], note: 'The same graph can be explored in different orders.' },
    ],
  },
};

const CATALOG = { ...STRUCTURES, ...PATTERNS };

const LANGUAGE_OPTIONS = [
  { key: 'javascript', label: 'JavaScript' },
  { key: 'python', label: 'Python' },
  { key: 'cpp', label: 'C++' },
  { key: 'java', label: 'Java' },
];

function labelForLanguage(value) {
  return LANGUAGE_OPTIONS.find((item) => item.key === value)?.label || value;
}

const LANGUAGE_STARTERS = {
  tree: {
    python: `def inorder(root, result=None):
    if result is None:
        result = []
    if not root:
        return result
    inorder(root.left, result)
    result.append(root.val)
    inorder(root.right, result)
    return result`,
    cpp: `void inorder(TreeNode* root, vector<int>& result) {
    if (!root) return;
    inorder(root->left, result);
    result.push_back(root->val);
    inorder(root->right, result);
}`,
    java: `void inorder(TreeNode root, List<Integer> result) {
    if (root == null) return;
    inorder(root.left, result);
    result.add(root.val);
    inorder(root.right, result);
}`,
  },
  graph: {
    python: `from collections import deque

def bfs(graph, start):
    seen = {start}
    queue = deque([start])
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for next_node in graph[node]:
            if next_node not in seen:
                seen.add(next_node)
                queue.append(next_node)
    return order`,
    cpp: `vector<char> bfs(unordered_map<char, vector<char>>& graph, char start) {
    unordered_set<char> seen;
    queue<char> q;
    vector<char> order;
    seen.insert(start);
    q.push(start);
    while (!q.empty()) {
        char node = q.front();
        q.pop();
        order.push_back(node);
        for (char next : graph[node]) {
            if (!seen.count(next)) {
                seen.insert(next);
                q.push(next);
            }
        }
    }
    return order;
}`,
    java: `List<Character> bfs(Map<Character, List<Character>> graph, char start) {
    Set<Character> seen = new HashSet<>();
    Queue<Character> queue = new LinkedList<>();
    List<Character> order = new ArrayList<>();
    seen.add(start);
    queue.add(start);
    while (!queue.isEmpty()) {
        char node = queue.poll();
        order.add(node);
        for (char next : graph.get(node)) {
            if (!seen.contains(next)) {
                seen.add(next);
                queue.add(next);
            }
        }
    }
    return order;
}`,
  },
  linked: {
    python: `def insert_after(node, value):
    fresh = ListNode(value)
    fresh.next = node.next
    node.next = fresh
    return fresh`,
    cpp: `ListNode* insertAfter(ListNode* node, int value) {
    ListNode* fresh = new ListNode(value);
    fresh->next = node->next;
    node->next = fresh;
    return fresh;
}`,
    java: `ListNode insertAfter(ListNode node, int value) {
    ListNode fresh = new ListNode(value);
    fresh.next = node.next;
    node.next = fresh;
    return fresh;
}`,
  },
  array: {
    python: `def max_value(items):
    best = items[0]
    for value in items[1:]:
        if value > best:
            best = value
    return best`,
    cpp: `int maxValue(vector<int>& items) {
    int best = items[0];
    for (int value : items) {
        if (value > best) best = value;
    }
    return best;
}`,
    java: `int maxValue(int[] items) {
    int best = items[0];
    for (int i = 1; i < items.length; i++) {
        if (items[i] > best) best = items[i];
    }
    return best;
}`,
  },
  stack: {
    python: `stack = []
stack.append("A")
stack.append("B")
stack.append("C")
top = stack.pop()`,
    cpp: `stack<string> st;
st.push("A");
st.push("B");
st.push("C");
string top = st.top();
st.pop();`,
    java: `Stack<String> stack = new Stack<>();
stack.push("A");
stack.push("B");
stack.push("C");
String top = stack.pop();`,
  },
  queue: {
    python: `from collections import deque

queue = deque()
queue.append("A")
queue.append("B")
queue.append("C")
first = queue.popleft()`,
    cpp: `queue<string> q;
q.push("A");
q.push("B");
q.push("C");
string first = q.front();
q.pop();`,
    java: `Queue<String> queue = new LinkedList<>();
queue.add("A");
queue.add("B");
queue.add("C");
String first = queue.poll();`,
  },
  slidingWindow: {
    python: `def max_window_sum(nums, k):
    window_sum = 0
    best = float("-inf")
    for right in range(len(nums)):
        window_sum += nums[right]
        if right >= k:
            window_sum -= nums[right - k]
        if right >= k - 1:
            best = max(best, window_sum)
    return best`,
    cpp: `int maxWindowSum(vector<int>& nums, int k) {
    int windowSum = 0;
    int best = INT_MIN;
    for (int right = 0; right < nums.size(); right++) {
        windowSum += nums[right];
        if (right >= k) windowSum -= nums[right - k];
        if (right >= k - 1) best = max(best, windowSum);
    }
    return best;
}`,
    java: `int maxWindowSum(int[] nums, int k) {
    int windowSum = 0;
    int best = Integer.MIN_VALUE;
    for (int right = 0; right < nums.length; right++) {
        windowSum += nums[right];
        if (right >= k) windowSum -= nums[right - k];
        if (right >= k - 1) best = Math.max(best, windowSum);
    }
    return best;
}`,
  },
  twoPointers: {
    python: `def two_sum_sorted(nums, target):
    left = 0
    right = len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        if total < target:
            left += 1
        else:
            right -= 1`,
    cpp: `vector<int> twoSumSorted(vector<int>& nums, int target) {
    int left = 0;
    int right = nums.size() - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return {left, right};
        if (sum < target) left++;
        else right--;
    }
    return {};
}`,
    java: `int[] twoSumSorted(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return new int[]{left, right};
        if (sum < target) left++;
        else right--;
    }
    return new int[]{};
}`,
  },
  binarySearch: {
    python: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    cpp: `int binarySearch(const vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
    java: `int binarySearch(int[] arr, int target) {
    int left = 0;
    int right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
  },
  dfsBfs: {
    python: `def dfs(graph, start):
    stack = [start]
    seen = {start}
    order = []
    while stack:
        node = stack.pop()
        order.append(node)
        for next_node in graph[node]:
            if next_node not in seen:
                seen.add(next_node)
                stack.append(next_node)
    return order`,
    cpp: `vector<char> dfs(unordered_map<char, vector<char>>& graph, char start) {
    unordered_set<char> seen;
    stack<char> st;
    vector<char> order;
    seen.insert(start);
    st.push(start);
    while (!st.empty()) {
        char node = st.top();
        st.pop();
        order.push_back(node);
        for (char next : graph[node]) {
            if (!seen.count(next)) {
                seen.insert(next);
                st.push(next);
            }
        }
    }
    return order;
}`,
    java: `List<Character> dfs(Map<Character, List<Character>> graph, char start) {
    Set<Character> seen = new HashSet<>();
    Stack<Character> stack = new Stack<>();
    List<Character> order = new ArrayList<>();
    seen.add(start);
    stack.push(start);
    while (!stack.isEmpty()) {
        char node = stack.pop();
        order.add(node);
        for (char next : graph.get(node)) {
            if (!seen.contains(next)) {
                seen.add(next);
                stack.push(next);
            }
        }
    }
    return order;
}`,
  },
};

const SAMPLE_CODES = {
  treeSample: {
    label: 'Tree DFS sample',
    target: 'tree',
  },
  graphSample: {
    label: 'Graph BFS sample',
    target: 'graph',
  },
  linkedSample: {
    label: 'Linked list sample',
    target: 'linked',
  },
  slidingSample: {
    label: 'Sliding window sample',
    target: 'slidingWindow',
  },
  twoPointerSample: {
    label: 'Two pointers sample',
    target: 'twoPointers',
  },
  binarySearchSample: {
    label: 'Binary search sample',
    target: 'binarySearch',
  },
  dfsBfsSample: {
    label: 'DFS / BFS sample',
    target: 'dfsBfs',
  },
};

function getStarterCode(target, language) {
  if (language === 'javascript') return CATALOG[target].code.join('\n');
  return LANGUAGE_STARTERS[target]?.[language] || CATALOG[target].code.join('\n');
}

function findLineNumber(code, patterns, fallback) {
  const lines = code.split('\n');
  const index = lines.findIndex((line) => patterns.some((pattern) => line.toLowerCase().includes(pattern)));
  return index >= 0 ? index + 1 : fallback;
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
  return values
    .filter((value) => value !== -1 && value !== null)
    .map((value) => String(value));
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
  const mainLine = findLineNumber(code, ['int main', 'main()'], 1);
  const arrLine = findLineNumber(code, ['vector<int> arr', 'std::vector<int> arr', 'arr = {'], mainLine + 1);
  const listToTreeCallLine = findLineNumber(code, ['tree = listtotree', 'listtotree(arr'], arrLine + 1);
  const listToTreeLine = findLineNumber(code, ['listtotree'], 1);
  const newNodeLine = findLineNumber(code, ['new treenode', 'new treenode<int>'], listToTreeLine + 4);
  const leftBuildLine = findLineNumber(code, ['root->left', 'root.left'], newNodeLine + 1);
  const rightBuildLine = findLineNumber(code, ['root->right', 'root.right'], newNodeLine + 2);
  const traversalCallLine = findLineNumber(code, ['result = inordertraversal', 'inordertraversal(tree'], listToTreeCallLine + 1);
  const inorderTraversalLine = findLineNumber(code, ['inordertraversal'], 1);
  const inorderDfsLine = findLineNumber(code, ['inorderdfs(root', 'inorder(root'], 1);
  const pushLine = findLineNumber(code, ['push_back', 'append'], inorderDfsLine + 3);
  const inorderRightLine = findLineNumber(code, ['inorderdfs(root->right', 'inorder(root.right'], pushLine + 1);
  const returnResultLine = findLineNumber(code, ['return result'], pushLine + 1);
  const steps = [
    {
      title: 'Enter main',
      line: mainLine,
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
      line: arrLine,
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
      title: 'Call listToTree',
      line: listToTreeCallLine,
      values,
      focus: 0,
      nodes: [],
      result: [],
      active: 'listToTree(arr)',
      stack: ['main', 'listToTree(arr, 0)'],
      vars: { index: 0, arrIndex: rawValues[0], returnValue: 'pending' },
      note: 'main calls listToTree(arr), so execution jumps into the tree builder.',
    },
    {
      title: 'Build root',
      line: newNodeLine,
      values,
      focus: 0,
      nodes: nodeLabels.slice(0, 1),
      result: [],
      active: String(rawValues[0]),
      stack: ['main', 'listToTree(arr, 0)'],
      vars: { index: 0, node: rawValues[0], left: 'pending', right: 'pending' },
      note: `listToTree reads index 0 and creates the root node ${rawValues[0]}.`,
    },
    {
      title: 'Check left child',
      line: leftBuildLine,
      values,
      focus: 1,
      nodes: nodeLabels.slice(0, 1),
      result: [],
      active: rawValues[1] === -1 ? 'nullptr' : String(rawValues[1]),
      stack: ['main', 'listToTree(arr, 0)', 'listToTree(arr, 1)'],
      vars: { index: 1, arrIndex: rawValues[1], returnValue: 'nullptr' },
      note: 'Index 1 is -1, so the left child returns nullptr.',
    },
    {
      title: 'Build right child',
      line: rightBuildLine,
      values,
      focus: 2,
      nodes: nodeLabels.slice(0, Math.min(2, nodeLabels.length)),
      result: [],
      active: String(rawValues[2] ?? ''),
      stack: ['main', 'listToTree(arr, 0)', 'listToTree(arr, 2)'],
      vars: { index: 2, node: rawValues[2], parent: rawValues[0] },
      note: `Index 2 becomes the right child node ${rawValues[2]}.`,
    },
    {
      title: 'Build right subtree',
      line: leftBuildLine,
      values,
      focus: 5,
      nodes: nodeLabels,
      result: [],
      active: String(rawValues[5] ?? ''),
      stack: ['main', 'listToTree(arr, 0)', 'listToTree(arr, 2)', 'listToTree(arr, 5)'],
      vars: { index: 5, node: rawValues[5], parent: rawValues[2] },
      note: 'The right subtree adds node 3 from index 5.',
    },
    {
      title: 'Return to main',
      line: traversalCallLine,
      values,
      focus: null,
      nodes: nodeLabels,
      result: [],
      active: 'inorderTraversal(tree)',
      stack: ['main'],
      vars: { tree: 'built', nextCall: 'inorderTraversal(tree)' },
      note: 'The tree is built, then main calls inorderTraversal(tree).',
    },
    {
      title: 'Create result vector',
      line: inorderTraversalLine,
      values,
      focus: null,
      nodes: nodeLabels,
      result: [],
      active: 'result',
      stack: ['main', 'inorderTraversal(tree)'],
      vars: { result: '[]', root: rawValues[0] },
      note: 'inorderTraversal creates an empty result vector before calling inorderDFS.',
    },
    {
      title: 'Call inorderDFS on root',
      line: inorderDfsLine,
      values,
      focus: 0,
      nodes: nodeLabels,
      result: [],
      visit: String(rawValues[0]),
      active: String(rawValues[0]),
      stack: ['main', 'inorderTraversal(tree)', `inorderDFS(${rawValues[0]})`],
      vars: { root: rawValues[0], result: '[]', action: 'check left subtree' },
      note: 'inorderDFS starts at the root, then checks the left subtree first.',
    },
    {
      title: 'Push root value',
      line: pushLine,
      values,
      focus: 0,
      nodes: nodeLabels,
      result: inorderResult.slice(0, 1),
      visit: String(inorderResult[0]),
      active: String(inorderResult[0]),
      stack: ['main', 'inorderTraversal(tree)', `inorderDFS(${rawValues[0]})`],
      vars: { root: rawValues[0], pushed: inorderResult[0], result: `[${inorderResult.slice(0, 1).join(', ')}]` },
      note: `The left subtree is empty, so ${inorderResult[0]} is pushed into result.`,
    },
    {
      title: 'Visit right subtree',
      line: inorderRightLine,
      values,
      focus: 2,
      nodes: nodeLabels,
      result: inorderResult.slice(0, 1),
      visit: String(rawValues[2]),
      active: String(rawValues[2]),
      stack: ['main', 'inorderTraversal(tree)', `inorderDFS(${rawValues[0]})`, `inorderDFS(${rawValues[2]})`],
      vars: { root: rawValues[2], result: `[${inorderResult.slice(0, 1).join(', ')}]`, action: 'visit right subtree' },
      note: 'After the root value, inorder traversal moves into the right subtree.',
    },
    {
      title: 'Push right subtree values',
      line: pushLine,
      values,
      focus: 5,
      nodes: nodeLabels,
      result: inorderResult,
      visit: String(rawValues[2]),
      active: String(rawValues[2]),
      stack: ['main', 'inorderTraversal(tree)', `inorderDFS(${rawValues[2]})`],
      vars: { root: rawValues[2], result: `[${inorderResult.join(', ')}]`, action: 'right subtree done' },
      note: `The traversal finishes with result [${inorderResult.join(', ')}].`,
    },
    {
      title: 'Return result to main',
      line: returnResultLine,
      values,
      focus: null,
      nodes: nodeLabels,
      result: inorderResult,
      active: 'return result',
      stack: ['main', 'inorderTraversal(tree)'],
      vars: { returnValue: `[${inorderResult.join(', ')}]`, caller: 'main' },
      note: 'inorderTraversal returns the final vector back to main.',
    },
  ];

  return steps.filter((item) => item.values.length);
}

function createBinarySearchSteps(code, override = '') {
  const overrideValues = parseOverrideValues(override);
  const values = overrideValues.values || parseNumbersFromCode(code);
  const target = overrideValues.target ?? parseTargetFromCode(code, values);
  const midLine = findLineNumber(code, [' mid ', ' mid=', ' mid =', '(right - left)', '// 2'], 5);
  const foundLine = findLineNumber(code, ['arr[mid] == target', 'arr[mid] === target', 'nums[mid] == target', 'return mid'], 6);
  const moveRightLine = findLineNumber(code, ['left = mid + 1', 'left=mid+1'], 7);
  const moveLeftLine = findLineNumber(code, ['right = mid - 1', 'right=mid-1'], 8);
  const missingLine = findLineNumber(code, ['return -1'], 10);
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
    vars: { left, right, mid: Math.floor((left + right) / 2), target, result: 'pending' },
    note: `Searching ${values.length} sorted values for ${target}.`,
  });

  while (left <= right && steps.length < 12) {
    const mid = left + Math.floor((right - left) / 2);
    const midValue = values[mid];
    steps.push({
      title: 'Check middle',
      line: midLine,
      values,
      left,
      right,
      mid,
      target,
      result: null,
      stack: ['main', 'binarySearch(arr, target)', `while left <= right`],
      vars: { left, right, mid, 'arr[mid]': midValue, target },
      note: `mid is ${mid}, so arr[mid] is ${midValue}.`,
    });

    if (midValue === target) {
      steps.push({
        title: 'Found target',
        line: foundLine,
        values,
        left,
        right,
        mid,
        target,
        result: mid,
        stack: ['main', 'binarySearch(arr, target)'],
        vars: { left, right, mid, 'arr[mid]': midValue, target, returnValue: mid },
        note: `${midValue} equals ${target}, so the function returns index ${mid}.`,
      });
      return steps;
    }

    if (midValue < target) {
      left = mid + 1;
      steps.push({
        title: 'Search right half',
        line: moveRightLine,
        values,
        left,
        right,
        mid,
        target,
        result: null,
        stack: ['main', 'binarySearch(arr, target)', `while left <= right`],
        vars: { left, right, mid, 'arr[mid]': midValue, target, decision: 'left = mid + 1' },
        note: `${midValue} is smaller than ${target}, so left moves to ${left}.`,
      });
    } else {
      right = mid - 1;
      steps.push({
        title: 'Search left half',
        line: moveLeftLine,
        values,
        left,
        right,
        mid,
        target,
        result: null,
        stack: ['main', 'binarySearch(arr, target)', `while left <= right`],
        vars: { left, right, mid, 'arr[mid]': midValue, target, decision: 'right = mid - 1' },
        note: `${midValue} is larger than ${target}, so right moves to ${right}.`,
      });
    }
  }

  steps.push({
    title: 'Target not found',
    line: missingLine,
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

function parseKFromCode(code, override = '') {
  const overrideK = override.match(/k\s*[:=]\s*(\d+)/i);
  if (overrideK) return Number(overrideK[1]);
  const kMatch = code.match(/(?:int|let|const|var)\s+k\s*=\s*(\d+)/i) || code.match(/,\s*(\d+)\s*\)/);
  return kMatch ? Number(kMatch[1]) : 3;
}

function parseArrayFromOverrideOrCode(code, override = '') {
  const overrideValues = parseOverrideValues(override);
  if (overrideValues.values) return { values: overrideValues.values, target: overrideValues.target };
  const values = parseNumbersFromCode(code);
  const target = parseTargetFromCode(code, values);
  return { values, target };
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
      title: right < k ? `Expand window (add ${values[right]})` : `Slide window (add ${values[right]}, drop ${values[right - k]})`,
      line: findLineNumber(code, right < k ? ['sum +=', 'window_sum +=', 'windowsum +='] : ['sum -=', 'window_sum -=', 'windowsum -='], right + 2),
      values,
      left: right >= k - 1 ? left : 0,
      right,
      sum,
      best: best === -Infinity ? sum : best,
      note: right < k
        ? `Adding ${values[right]} to build the initial window. Current sum is ${sum}.`
        : `Window slides: drop ${values[right - k]}, add ${values[right]}. Sum = ${sum}, best = ${best}.`,
    });
  }

  steps.push({
    title: 'Scan complete',
    line: findLineNumber(code, ['return best', 'return max', 'return result'], values.length + 2),
    values,
    left: Math.max(0, values.length - k),
    right: values.length - 1,
    sum,
    best: best === -Infinity ? sum : best,
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
    line: findLineNumber(code, ['left = 0', 'left=0'], 2),
    values: sorted, left, right,
    sum: sorted[left] + sorted[right], target,
    note: `Start with left at ${sorted[left]} and right at ${sorted[right]}. Target sum is ${target}.`,
  });

  while (left < right && steps.length < 15) {
    const currentSum = sorted[left] + sorted[right];
    if (currentSum === target) {
      steps.push({
        title: 'Found target pair',
        line: findLineNumber(code, ['return', '== target', '=== target'], 6),
        values: sorted, left, right, sum: currentSum, target,
        note: `${sorted[left]} + ${sorted[right]} = ${currentSum} equals target ${target}. Pair found!`,
      });
      break;
    } else if (currentSum < target) {
      left++;
      steps.push({
        title: 'Sum too small — move left',
        line: findLineNumber(code, ['left++', 'left +=', 'left += 1'], 7),
        values: sorted, left, right, sum: sorted[left] + sorted[right], target,
        note: `${currentSum} < ${target}, so move left pointer right to ${sorted[left]}.`,
      });
    } else {
      right--;
      steps.push({
        title: 'Sum too large — move right',
        line: findLineNumber(code, ['right--', 'right -=', 'right -= 1'], 8),
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
    title: 'Seed best',
    line: findLineNumber(code, ['best =', 'max =', 'result ='], 2),
    values, focus: 0, best,
    note: `The first item ${values[0]} becomes the starting best value.`,
  });

  for (let i = 1; i < values.length && steps.length < 15; i++) {
    const prev = best;
    best = Math.max(best, values[i]);
    steps.push({
      title: `Compare ${values[i]}`,
      line: findLineNumber(code, ['if (', 'if(', '> best', '> max'], 4),
      values, focus: i, best,
      note: values[i] > prev
        ? `${values[i]} beats ${prev} and becomes the new best.`
        : `${values[i]} does not change the best value of ${best}.`,
    });
  }

  steps.push({
    title: 'Return result',
    line: findLineNumber(code, ['return best', 'return max', 'return result'], 6),
    values, focus: values.length - 1, best,
    note: `Scan complete. The maximum value is ${best}.`,
  });

  return steps;
}

function parseStackOps(code) {
  const ops = [];
  const pushMatches = code.matchAll(/\.push\s*\(\s*["']?(\w+)["']?\s*\)/gi);
  for (const m of pushMatches) ops.push({ type: 'push', value: m[1] });
  const popMatches = code.matchAll(/\.pop\s*\(\s*\)/gi);
  for (const m of popMatches) ops.push({ type: 'pop' });
  const appendMatches = code.matchAll(/\.append\s*\(\s*["']?(\w+)["']?\s*\)/gi);
  for (const m of appendMatches) ops.push({ type: 'push', value: m[1] });
  if (!ops.length) return [
    { type: 'push', value: 'A' }, { type: 'push', value: 'B' },
    { type: 'push', value: 'C' }, { type: 'pop' },
  ];
  return ops;
}

function createStackSteps(code, override = '') {
  const ops = parseStackOps(code);
  const items = [];
  const steps = [];

  steps.push({
    title: 'Empty stack',
    line: findLineNumber(code, ['stack', '= []', 'stack<'], 1),
    items: [], note: 'A stack starts with no items.',
  });

  for (const op of ops) {
    if (op.type === 'push') {
      items.push(op.value);
      steps.push({
        title: `Push ${op.value}`,
        line: findLineNumber(code, [`.push(${op.value}`, `.push("${op.value}"`, `.push('${op.value}'`, `.append("${op.value}"`], 2),
        items: [...items], focus: items.length - 1,
        note: `${op.value} is now at the top of the stack.`,
      });
    } else if (op.type === 'pop' && items.length) {
      const popped = items.pop();
      steps.push({
        title: `Pop ${popped}`,
        line: findLineNumber(code, ['.pop()'], 5),
        items: [...items], popped,
        note: `${popped} removed from the top. Last in, first out.`,
      });
    }
  }

  return steps;
}

function parseQueueOps(code) {
  const ops = [];
  const pushMatches = code.matchAll(/\.push\s*\(\s*["']?(\w+)["']?\s*\)/gi);
  for (const m of pushMatches) ops.push({ type: 'enqueue', value: m[1] });
  const appendMatches = code.matchAll(/\.append\s*\(\s*["']?(\w+)["']?\s*\)/gi);
  for (const m of appendMatches) ops.push({ type: 'enqueue', value: m[1] });
  const shiftMatches = code.matchAll(/\.shift\s*\(\s*\)/gi);
  for (const m of shiftMatches) ops.push({ type: 'dequeue' });
  const popleftMatches = code.matchAll(/\.popleft\s*\(\s*\)/gi);
  for (const m of popleftMatches) ops.push({ type: 'dequeue' });
  if (!ops.length) return [
    { type: 'enqueue', value: 'A' }, { type: 'enqueue', value: 'B' },
    { type: 'enqueue', value: 'C' }, { type: 'dequeue' },
  ];
  return ops;
}

function createQueueSteps(code, override = '') {
  const ops = parseQueueOps(code);
  const items = [];
  const steps = [];

  steps.push({
    title: 'Empty queue',
    line: findLineNumber(code, ['queue', '= []', 'deque', 'queue<'], 1),
    items: [], note: 'A queue starts empty.',
  });

  for (const op of ops) {
    if (op.type === 'enqueue') {
      items.push(op.value);
      steps.push({
        title: `Enqueue ${op.value}`,
        line: findLineNumber(code, [`.push(${op.value}`, `.append(${op.value}`, `.push("${op.value}"`], 2),
        items: [...items], focus: items.length - 1,
        note: `${op.value} joins the back of the queue.`,
      });
    } else if (op.type === 'dequeue' && items.length) {
      const removed = items.shift();
      steps.push({
        title: `Dequeue ${removed}`,
        line: findLineNumber(code, ['.shift()', '.popleft()', 'q.pop()', '.front()'], 5),
        items: [...items], removed,
        note: `${removed} removed from the front. First in, first out.`,
      });
    }
  }

  return steps;
}

function parseLinkedListValues(code, override = '') {
  const overrideMatch = override.match(/nodes?\s*[:=]\s*\[([^\]]+)\]/i);
  if (overrideMatch) {
    return overrideMatch[1].split(',').map((v) => v.trim()).filter(Boolean).map(Number).filter(Number.isFinite);
  }
  const arrMatch = code.match(/\[([^\]]+)\]/);
  if (arrMatch) {
    const vals = arrMatch[1].split(',').map((v) => Number(v.trim())).filter(Number.isFinite);
    if (vals.length) return vals;
  }
  return [4, 8, 15, 23];
}

function createLinkedListSteps(code, override = '') {
  const nodes = parseLinkedListValues(code, override);
  const insertMatch = override.match(/insert\s*[:=]\s*(\d+)/i);
  const afterMatch = override.match(/after\s*[:=]\s*(\d+)/i);
  const insertValue = insertMatch ? Number(insertMatch[1]) : 16;
  const afterValue = afterMatch ? Number(afterMatch[1]) : nodes[1] ?? nodes[0];
  const insertIndex = nodes.indexOf(afterValue);
  const focusIdx = insertIndex >= 0 ? insertIndex : 1;

  const steps = [];

  steps.push({
    title: `Find node ${nodes[focusIdx]}`,
    line: findLineNumber(code, ['node', 'current', 'find'], 1),
    nodes: [...nodes], focus: focusIdx,
    note: `The pointer stops at node ${nodes[focusIdx]}, after which we insert.`,
  });

  steps.push({
    title: `Create node ${insertValue}`,
    line: findLineNumber(code, ['new', 'listnode', 'node('], 2),
    nodes: [...nodes], fresh: insertValue, focus: focusIdx,
    note: `A new node with value ${insertValue} is created but not linked yet.`,
  });

  const newNodes = [...nodes];
  newNodes.splice(focusIdx + 1, 0, insertValue);

  steps.push({
    title: `Point new node to ${nodes[focusIdx + 1] ?? 'null'}`,
    line: findLineNumber(code, ['fresh.next', 'new_node.next', '->next ='], 3),
    nodes: newNodes, focus: focusIdx + 1, softEdge: `${insertValue}-${nodes[focusIdx + 1] ?? 'null'}`,
    note: `The new node borrows the old next pointer.`,
  });

  steps.push({
    title: `Point ${nodes[focusIdx]} to new node`,
    line: findLineNumber(code, ['node.next', 'node->next'], 4),
    nodes: newNodes, focus: focusIdx + 1,
    note: `Node ${nodes[focusIdx]} now links to ${insertValue}.`,
  });

  steps.push({
    title: 'Insertion complete',
    line: findLineNumber(code, ['return', 'fresh'], 5),
    nodes: newNodes, focus: focusIdx + 1, done: true,
    note: `The list stays connected from head to tail: [${newNodes.join(' → ')}].`,
  });

  return steps;
}

function createGraphBfsSteps(code, override = '') {
  const graph = { A: ['B', 'C'], B: ['A', 'C', 'D'], C: ['A', 'B', 'E'], D: ['B', 'F'], E: ['C', 'F'], F: ['D', 'E'] };
  const start = 'A';
  const seen = new Set([start]);
  const queue = [start];
  const order = [];
  const edges = [];
  const steps = [];

  steps.push({
    title: `Start at ${start}`,
    line: findLineNumber(code, ['seen', 'visited', 'queue'], 2),
    current: start, seen: [start], queue: [start], order: [], edges: [],
    note: `${start} is marked so it will not be processed twice.`,
  });

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
      line: findLineNumber(code, ['queue.shift', 'queue.popleft', 'q.front', 'q.pop'], 6),
      current: node, seen: [...seen], queue: [...queue], order: [...order], edges: [...edges],
      note: newNeighbors.length
        ? `${node} discovers unvisited neighbors: ${newNeighbors.join(', ')}.`
        : `${node} has no unvisited neighbors.`,
    });
  }

  steps.push({
    title: 'Traversal complete',
    line: findLineNumber(code, ['return order', 'return result'], 10),
    current: order[order.length - 1], seen: [...seen], queue: [], order: [...order], edges: [...edges],
    note: `BFS visit order: ${order.join(' → ')}. Every reachable vertex has been visited.`,
  });

  return steps;
}

function createDfsBfsSteps(code, override = '') {
  return createGraphBfsSteps(code, override);
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
  // Java-specific detection
  if (normalized.includes('arraylist') || normalized.includes('hashmap') || normalized.includes('public static void main') || normalized.includes('system.out')) return 'array';
  return 'array';
}

function buildAnalysisInfo(nextTarget, nextSteps, inputOverride, language) {
  const firstStep = nextSteps?.[0];
  return {
    pattern: CATALOG[nextTarget].label,
    language: labelForLanguage(language),
    confidence: nextSteps ? 'High' : 'Medium',
    input: summarizeInput(nextTarget, firstStep, inputOverride),
    mode: nextSteps ? 'Generated trace' : 'Pattern demo',
  };
}

function applyRemoteResult({
  result,
  language,
  inputOverride,
  setActiveKey,
  setAnalysisSteps,
  setAnalysisInfo,
  setCustomMessage,
  setStep,
}) {
  const nextTarget = result.patternDetected || detectCodeTarget(result.code || '');
  const nextSteps = result.steps || null;
  setAnalysisSteps(nextSteps);
  setAnalysisInfo(result.analysis || buildAnalysisInfo(nextTarget, nextSteps, inputOverride, language));
  setStep(0);
  setActiveKey(nextTarget);
  setCustomMessage(`Server execution finished for ${CATALOG[nextTarget].label}.`);
}

function normalizeWorkspace(workspace) {
  if (!workspace) return null;
  return {
    id: workspace.id ?? null,
    title: workspace.title || '',
    code: workspace.code || '',
    language: workspace.language || 'javascript',
    dsaPattern: workspace.dsaPattern || detectCodeTarget(workspace.code || ''),
    tags: workspace.tags || [],
    inputOverride: workspace.inputOverride || workspace.testCases?.[0]?.input?.raw || '',
  };
}

function VisualizerWorkspace({
  initialWorkspace = null,
  canPersist = false,
  onSaveCode,
  onRemoteExecute,
  onAuthRequest,
}) {
  const [activeKey, setActiveKey] = useState('tree');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [language, setLanguage] = useState('javascript');
  const [customCode, setCustomCode] = useState(() => getStarterCode('slidingWindow', 'javascript'));
  const [inputOverride, setInputOverride] = useState('');
  const [title, setTitle] = useState('Sliding Window Demo');
  const [tagsText, setTagsText] = useState('window, demo');
  const [testCaseLabel, setTestCaseLabel] = useState('Primary input');
  const [customMessage, setCustomMessage] = useState('Enter code, choose a language, then visualize the closest DSA pattern.');
  const [analysisSteps, setAnalysisSteps] = useState(null);
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [pendingAction, setPendingAction] = useState('');
  const active = CATALOG[activeKey];
  const activeSteps = analysisSteps || active.steps;
  const current = activeSteps[Math.min(step, activeSteps.length - 1)];
  const maxStep = activeSteps.length - 1;

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [activeKey]);

  useEffect(() => {
    if (!playing) return undefined;
    const delay = Math.max(450, 1500 / speed);
    const timer = window.setInterval(() => {
      setStep((value) => {
        if (value >= maxStep) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, delay);
    return () => window.clearInterval(timer);
  }, [playing, speed, maxStep]);

  useEffect(() => {
    const workspace = normalizeWorkspace(initialWorkspace);
    if (!workspace?.code) return;
    setAnalysisSteps(null);
    setAnalysisInfo(null);
    setPlaying(false);
    setStep(0);
    setTitle(workspace.title || 'Saved code');
    setTagsText(Array.isArray(workspace.tags) ? workspace.tags.join(', ') : '');
    setLanguage(workspace.language);
    setCustomCode(workspace.code);
    setInputOverride(workspace.inputOverride || '');
    setActiveKey(workspace.dsaPattern);
    setCustomMessage(`Loaded ${workspace.title || 'saved code'} into the workspace.`);
  }, [initialWorkspace]);

  const progress = `${Math.min(step + 1, activeSteps.length)} / ${activeSteps.length}`;
  const loadSample = (sample) => {
    setAnalysisSteps(null);
    setAnalysisInfo(null);
    setStep(0);
    setCustomCode(getStarterCode(sample.target, language));
    setActiveKey(sample.target);
    setCustomMessage(`${sample.label} loaded in ${LANGUAGE_OPTIONS.find((item) => item.key === language)?.label}.`);
  };

  const visualizeUserCode = () => {
    const nextTarget = detectCodeTarget(customCode);
    const generators = {
      binarySearch: createBinarySearchSteps,
      tree: createTreeTraversalSteps,
      slidingWindow: createSlidingWindowSteps,
      twoPointers: createTwoPointersSteps,
      array: createArraySteps,
      stack: createStackSteps,
      queue: createQueueSteps,
      linked: createLinkedListSteps,
      graph: createGraphBfsSteps,
      dfsBfs: createDfsBfsSteps,
    };
    const generator = generators[nextTarget];
    const nextSteps = generator ? generator(customCode, inputOverride) : null;
    const firstStep = nextSteps?.[0];
    setAnalysisSteps(nextSteps);
    setAnalysisInfo(buildAnalysisInfo(nextTarget, nextSteps, inputOverride, language));
    setStep(0);
    setActiveKey(nextTarget);
    setCustomMessage(`Detected ${CATALOG[nextTarget].label}. ${nextSteps ? 'Generated steps from your pasted code.' : 'Loaded the closest visual pattern.'}`);
  };

  const changeLanguage = (nextLanguage) => {
    setAnalysisSteps(null);
    setAnalysisInfo(null);
    setStep(0);
    setLanguage(nextLanguage);
    setCustomCode(getStarterCode(activeKey, nextLanguage));
    setCustomMessage(`${labelForLanguage(nextLanguage)} starter loaded for ${active.label}.`);
  };

  const handleSaveCode = async () => {
    if (!canPersist) {
      onAuthRequest?.();
      return;
    }
    if (!onSaveCode) return;
    setPendingAction('save');
    try {
      const saved = await onSaveCode({
        title,
        code: customCode,
        language,
        dsaPattern: activeKey,
        tags: tagsText.split(',').map((item) => item.trim()).filter(Boolean),
        testCases: inputOverride ? [{ label: testCaseLabel || 'Primary input', input: { raw: inputOverride } }] : [],
      });
      setCustomMessage(`Saved "${saved.title}" to your dashboard.`);
    } catch (error) {
      setCustomMessage(error.message || 'Unable to save code right now.');
    } finally {
      setPendingAction('');
    }
  };

  const handleRemoteExecute = async () => {
    if (!canPersist) {
      onAuthRequest?.();
      return;
    }
    if (!onRemoteExecute) return;
    setPendingAction('execute');
    try {
      const response = await onRemoteExecute({
        title,
        code: customCode,
        language,
        inputOverride,
        dsaPattern: activeKey,
      });
      applyRemoteResult({
        result: response,
        language,
        inputOverride,
        setActiveKey,
        setAnalysisSteps,
        setAnalysisInfo,
        setCustomMessage,
        setStep,
      });
    } catch (error) {
      setCustomMessage(error.message || 'Server execution failed.');
    } finally {
      setPendingAction('');
    }
  };

  return (
    <main className="app-shell" style={{ '--accent': active.accent }}>
      <header className="topbar">
        <div className="brand">
          <span className="mark">DS</span>
          <span>Structure Visualizer</span>
          <small>BETA</small>
        </div>
        <nav className="structure-tabs" aria-label="Data structures">
          {Object.entries(CATALOG).map(([key, item]) => (
            <button
              className={key === activeKey ? 'active' : ''}
              key={key}
              onClick={() => {
                setAnalysisSteps(null);
                setAnalysisInfo(null);
                setStep(0);
                setActiveKey(key);
                setCustomCode(getStarterCode(key, language));
                setCustomMessage(`${item.label} starter loaded. Edit it or paste your own code.`);
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="workbench">
        <CodePane
          title={title}
          tagsText={tagsText}
          testCaseLabel={testCaseLabel}
          code={customCode}
          line={current.line}
          language={language}
          message={customMessage}
          inputOverride={inputOverride}
          canPersist={canPersist}
          pendingAction={pendingAction}
          onTitleChange={setTitle}
          onTagsChange={setTagsText}
          onTestCaseLabelChange={setTestCaseLabel}
          onCodeChange={setCustomCode}
          onInputOverrideChange={setInputOverride}
          onLanguageChange={changeLanguage}
          onVisualize={visualizeUserCode}
          onSaveCode={handleSaveCode}
          onRemoteExecute={handleRemoteExecute}
          onSample={loadSample}
        />
        <Visualizer type={activeKey} step={current} zoom={zoom} accent={active.accent} />
        <ControlPane
          active={active}
          current={current}
          progress={progress}
          step={step}
          maxStep={maxStep}
          speed={speed}
          zoom={zoom}
          playing={playing}
          onSpeed={setSpeed}
          onZoom={setZoom}
          onStep={setStep}
          onPlay={() => setPlaying((value) => !value)}
          onPrev={() => setStep((value) => Math.max(0, value - 1))}
          onNext={() => setStep((value) => Math.min(maxStep, value + 1))}
          onReset={() => setStep(0)}
          analysisInfo={analysisInfo}
        />
      </section>
    </main>
  );
}

function summarizeInput(target, step, override) {
  if (!step) return override ? 'Manual override provided' : 'No concrete input inferred';
  if (target === 'binarySearch') return `array [${step.values.join(', ')}], target ${step.target}`;
  if (target === 'tree') return `tree [${step.values.map((value) => value ?? 'null').join(', ')}]`;
  return override || 'Using built-in sample input';
}

function CodePane({
  title,
  tagsText,
  testCaseLabel,
  code,
  line,
  language,
  message,
  inputOverride,
  canPersist,
  pendingAction,
  onTitleChange,
  onTagsChange,
  onTestCaseLabelChange,
  onCodeChange,
  onInputOverrideChange,
  onLanguageChange,
  onVisualize,
  onSaveCode,
  onRemoteExecute,
  onSample,
}) {
  const codeLines = code.split('\n');
  const languageLabel = labelForLanguage(language);

  return (
    <section className="code-pane personal-editor" aria-label="Personal code editor">
      <div className="pane-heading">
        <span>Your Personal Code</span>
        <select value={language} onChange={(event) => onLanguageChange(event.target.value)} aria-label="Language">
          {LANGUAGE_OPTIONS.map((item) => (
            <option key={item.key} value={item.key}>{item.label}</option>
          ))}
        </select>
      </div>
      <textarea
        spellCheck="false"
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        aria-label={`Paste ${languageLabel} code`}
      />
      <div className="meta-grid">
        <input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Save title" aria-label="Save title" />
        <input value={tagsText} onChange={(event) => onTagsChange(event.target.value)} placeholder="Tags, comma separated" aria-label="Tags" />
      </div>
      <textarea
        className="input-override"
        spellCheck="false"
        value={inputOverride}
        onChange={(event) => onInputOverrideChange(event.target.value)}
        placeholder="Optional test input, e.g. array: [2,5,8,12,16,23,38] target: 23"
        aria-label="Optional test input"
      />
      <div className="meta-grid compact">
        <input value={testCaseLabel} onChange={(event) => onTestCaseLabelChange(event.target.value)} placeholder="Test case label" aria-label="Test case label" />
        <span className="auth-chip">{canPersist ? 'Signed in: save + execute enabled' : 'Demo mode: sign in to save + execute'}</span>
      </div>
      <div className="editor-actions">
        <button className="primary" type="button" onClick={onVisualize}>Visualize my code</button>
        <button type="button" onClick={onRemoteExecute} disabled={pendingAction === 'execute'}>
          {pendingAction === 'execute' ? 'Executing...' : 'Execute on server'}
        </button>
        <button type="button" onClick={onSaveCode} disabled={pendingAction === 'save'}>
          {pendingAction === 'save' ? 'Saving...' : 'Save code'}
        </button>
        <span>{message}</span>
      </div>
      <div className="sample-rail" aria-label="Sample codes">
        {Object.values(SAMPLE_CODES).map((sample) => (
          <button key={sample.label} type="button" onClick={() => onSample(sample)}>
            {sample.label}
          </button>
        ))}
      </div>
      <pre className="code-preview" aria-label="Highlighted preview">
        {codeLines.map((codeLine, index) => (
          <span className={line === index + 1 ? 'code-line active' : 'code-line'} key={`${codeLine}-${index}`}>
            <span className="line-number">{String(index + 1).padStart(2, '0')}</span>
            <SyntaxLine text={codeLine} />
          </span>
        ))}
      </pre>
    </section>
  );
}

function SyntaxLine({ text }) {
  const tokens = text.split(/(\bfunction\b|\bconst\b|\blet\b|\breturn\b|\bif\b|\bfor\b|\bwhile\b|\bnew\b|\bof\b|\bdef\b|\bclass\b|\bfrom\b|\bimport\b|\bin\b|\bpublic\b|\bprivate\b|\bstatic\b|\bvoid\b|\bint\b|\bboolean\b|\bchar\b|\bNone\b|\bnullptr\b|\bnull\b|\bSet\b|\bNode\b|\bTreeNode\b|\bListNode\b|\bvector\b|\bqueue\b|\bstack\b|\bunordered_map\b|\bunordered_set\b|\bString\b|\bArrayList\b|\bHashMap\b|\bHashSet\b|\bLinkedList\b|\bInteger\b|\bMath\b|\bQueue\b|\bStack\b|\bMap\b|\bList\b)/g);
  return tokens.map((token, index) => {
    const cls = /function|const|let|return|if|for|while|new|of|def|class|from|import|in|public|private|static|void|int|boolean|char/.test(token) ? 'kw' : /None|nullptr|null|Set|Node|TreeNode|ListNode|vector|queue|stack|unordered_map|unordered_set|String|ArrayList|HashMap|HashSet|LinkedList|Integer|Math|Queue|Stack|Map|List/.test(token) ? 'type' : '';
    return <span className={cls} key={`${token}-${index}`}>{token}</span>;
  });
}

function Visualizer({ type, step, zoom, accent }) {
  const content = useMemo(() => {
    if (type === 'tree') return <TreeView step={step} />;
    if (type === 'graph') return <GraphView step={step} />;
    if (type === 'linked') return <LinkedListView step={step} />;
    if (type === 'slidingWindow') return <SlidingWindowView step={step} />;
    if (type === 'twoPointers') return <TwoPointersView step={step} />;
    if (type === 'binarySearch') return <BinarySearchView step={step} />;
    if (type === 'dfsBfs') return <GraphView step={step} />;
    if (type === 'array') return <ArrayView step={step} />;
    if (type === 'stack') return <StackView step={step} />;
    return <QueueView step={step} />;
  }, [type, step]);

  return (
    <section className="stage" aria-label="Visualization">
      <div className="stage-title">
        <div>
          <span className="eyebrow">Live Memory</span>
          <h1>{step.title}</h1>
        </div>
        <div className="pulse-dot" aria-hidden="true" />
      </div>
      <div className="stage-canvas" style={{ transform: `scale(${zoom})`, borderColor: `${accent}88` }}>
        {content}
      </div>
      <p className="stage-note">{step.note}</p>
    </section>
  );
}

function ArrayStrip({ values = [], focus }) {
  return (
    <div className="array-strip">
      {values.map((value, index) => (
        <div className={focus === index ? 'cell focus' : 'cell'} key={`${value}-${index}`}>
          <strong>{String(value)}</strong>
          <small>{index}</small>
        </div>
      ))}
    </div>
  );
}

function TreeView({ step }) {
  const show = new Set(step.nodes || []);
  return (
    <div className="tree-view">
      <ArrayStrip values={step.values} focus={step.focus} />
      <div className="pointer-card">
        <span>{step.active || 'root'}</span>
        <small>current</small>
      </div>
      <svg viewBox="0 0 620 320" role="img" aria-label="Binary tree visualization">
        {show.has('2') && <line x1="300" y1="75" x2="420" y2="155" />}
        {show.has('3') && <line x1="420" y1="175" x2="340" y2="255" />}
        {show.has('4') && <line x1="420" y1="175" x2="500" y2="255" />}
        <TreeNode x={300} y={55} label="1" visible={show.has('1')} active={step.visit === '1'} />
        <TreeNode x={420} y={155} label="2" visible={show.has('2')} active={step.visit === '2'} />
        <TreeNode x={340} y={255} label="3" visible={show.has('3')} active={step.visit === '3'} />
        <TreeNode x={500} y={255} label="4" visible={show.has('4')} active={step.visit === '4'} />
      </svg>
      <div className="result-row">
        <span>result</span>
        {(step.result || []).map((value) => <b key={value}>{value}</b>)}
      </div>
    </div>
  );
}

function TreeNode({ x, y, label, visible, active }) {
  if (!visible) return null;
  return (
    <g className={active ? 'svg-node active' : 'svg-node'}>
      <circle cx={x} cy={y} r="32" />
      <text x={x} y={y + 7}>{label}</text>
    </g>
  );
}

function GraphView({ step }) {
  const seen = new Set(step.seen || []);
  const activeEdges = new Set(step.edges || []);
  const byId = Object.fromEntries(graphNodes.map((node) => [node.id, node]));
  return (
    <div className="graph-view">
      <svg viewBox="0 0 620 300" role="img" aria-label="Graph BFS visualization">
        {graphEdges.map(([from, to]) => {
          const a = byId[from];
          const b = byId[to];
          const edgeKey = `${from}-${to}`;
          return <line className={activeEdges.has(edgeKey) ? 'edge active' : 'edge'} key={edgeKey} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
        {graphNodes.map((node) => (
          <g className={node.id === step.current ? 'svg-node active' : seen.has(node.id) ? 'svg-node seen' : 'svg-node'} key={node.id}>
            <circle cx={node.x} cy={node.y} r="30" />
            <text x={node.x} y={node.y + 7}>{node.id}</text>
          </g>
        ))}
      </svg>
      <MiniQueue label="queue" items={step.queue || []} />
      <MiniQueue label="order" items={step.order || []} />
    </div>
  );
}

function LinkedListView({ step }) {
  return (
    <div className="linked-view">
      <div className="node-chain">
        {(step.nodes || []).map((value, index) => (
          <div className="node-unit" key={`${value}-${index}`}>
            <div className={step.focus === index ? 'list-node focus' : 'list-node'}>
              <strong>{value}</strong>
              <small>next</small>
            </div>
            {index < step.nodes.length - 1 && <span className="arrow">→</span>}
          </div>
        ))}
      </div>
      {step.fresh && <div className="fresh-node">new node: {step.fresh}</div>}
      <MiniQueue label="head to tail" items={step.nodes || []} />
    </div>
  );
}

function ArrayView({ step }) {
  return (
    <div className="array-view">
      <ArrayStrip values={step.values} focus={step.focus} />
      <div className="metric">
        <span>best</span>
        <strong>{step.best}</strong>
      </div>
      <div className="scan-line">
        {step.values.map((value, index) => (
          <span className={index <= step.focus ? 'visited' : ''} key={`${value}-${index}`} />
        ))}
      </div>
    </div>
  );
}

function SlidingWindowView({ step }) {
  return (
    <div className="array-view">
      <ArrayStrip values={step.values} focus={step.right} />
      <div className="window-track">
        {step.values.map((value, index) => (
          <span className={index >= step.left && index <= step.right ? 'inside' : ''} key={`${value}-${index}`} />
        ))}
      </div>
      <div className="metric-row">
        <div className="metric">
          <span>sum</span>
          <strong>{step.sum}</strong>
        </div>
        <div className="metric">
          <span>best</span>
          <strong>{step.best}</strong>
        </div>
      </div>
      <MiniQueue label="window" items={step.values.slice(step.left, step.right + 1)} />
    </div>
  );
}

function TwoPointersView({ step }) {
  return (
    <div className="array-view">
      <ArrayStrip values={step.values} focus={step.left} />
      <div className="pointer-line">
        {step.values.map((value, index) => (
          <span className={index === step.left || index === step.right ? 'pointer-hit' : ''} key={`${value}-${index}`}>
            {index === step.left ? 'L' : index === step.right ? 'R' : ''}
          </span>
        ))}
      </div>
      <div className="metric-row">
        <div className="metric">
          <span>sum</span>
          <strong>{step.sum}</strong>
        </div>
        <div className="metric">
          <span>target</span>
          <strong>{step.target}</strong>
        </div>
      </div>
    </div>
  );
}

function BinarySearchView({ step }) {
  return (
    <div className="binary-search-view">
      <ArrayStrip values={step.values} focus={step.mid} />
      <div className="range-line">
        {step.values.map((value, index) => {
          const inRange = index >= step.left && index <= step.right;
          const marker = index === step.left ? 'L' : index === step.right ? 'R' : index === step.mid ? 'M' : '';
          return (
            <span className={inRange ? 'inside' : ''} key={`${value}-${index}`}>
              {marker}
            </span>
          );
        })}
      </div>
      <div className="metric-row">
        <div className="metric">
          <span>target</span>
          <strong>{step.target}</strong>
        </div>
        <div className="metric">
          <span>mid</span>
          <strong>{step.mid ?? '-'}</strong>
        </div>
        <div className="metric">
          <span>return</span>
          <strong>{step.result ?? '?'}</strong>
        </div>
      </div>
      <MiniQueue label="active range" items={step.values.slice(Math.max(0, step.left), Math.max(step.left, step.right + 1))} />
    </div>
  );
}

function StackView({ step }) {
  return (
    <div className="stack-view">
      <div className="stack-box">
        {[...step.items].reverse().map((item, index) => (
          <div className={index === 0 ? 'stack-item top' : 'stack-item'} key={`${item}-${index}`}>{item}</div>
        ))}
      </div>
      <div className="metric">
        <span>top</span>
        <strong>{step.items.at(-1) || step.popped || 'empty'}</strong>
      </div>
      {step.popped && <p className="removed">popped {step.popped}</p>}
    </div>
  );
}

function QueueView({ step }) {
  return (
    <div className="queue-view">
      <div className="queue-line">
        <span className="lane-label">front</span>
        {step.items.map((item, index) => (
          <div className={step.focus === index ? 'queue-item focus' : 'queue-item'} key={`${item}-${index}`}>{item}</div>
        ))}
        <span className="lane-label">back</span>
      </div>
      {step.removed && <p className="removed">dequeued {step.removed}</p>}
      <MiniQueue label="queue contents" items={step.items} />
    </div>
  );
}

function MiniQueue({ label, items }) {
  return (
    <div className="mini-row">
      <span>{label}</span>
      <div>
        {items.length ? items.map((item) => <b key={item}>{item}</b>) : <em>empty</em>}
      </div>
    </div>
  );
}

function ControlPane({
  active,
  current,
  analysisInfo,
  progress,
  step,
  maxStep,
  speed,
  zoom,
  playing,
  onSpeed,
  onZoom,
  onStep,
  onPlay,
  onPrev,
  onNext,
  onReset,
}) {
  return (
    <aside className="control-pane" aria-label="Controls">
      <div className="control-block">
        <span className="control-label">Speed</span>
        <input type="range" min="0.5" max="3" step="0.5" value={speed} onChange={(event) => onSpeed(Number(event.target.value))} />
        <b>{speed}x</b>
      </div>
      <div className="control-block">
        <span className="control-label">Zoom</span>
        <input type="range" min="0.8" max="1.2" step="0.05" value={zoom} onChange={(event) => onZoom(Number(event.target.value))} />
        <b>{zoom.toFixed(2)}</b>
      </div>
      <div className="control-block">
        <span className="control-label">Step</span>
        <input type="range" min="0" max={maxStep} value={step} onChange={(event) => onStep(Number(event.target.value))} />
        <b>{progress}</b>
      </div>
      <div className="transport">
        <button type="button" onClick={onPrev}>Prev</button>
        <button className="primary" type="button" onClick={onPlay}>{playing ? 'Pause' : 'Play'}</button>
        <button type="button" onClick={onNext}>Next</button>
        <button type="button" onClick={onReset}>Reset</button>
      </div>
      <AnalysisPanel analysisInfo={analysisInfo} active={active} />
      <VariableWatch step={current} />
      <CallStack stack={current.stack} />
      <div className="explain">
        <span className="eyebrow">Concept</span>
        <h2>{active.label}</h2>
        <p>{active.description}</p>
      </div>
      <div className="explain">
        <span className="eyebrow">Current Step</span>
        <h2>{current.title}</h2>
        <p>{current.note}</p>
      </div>
    </aside>
  );
}

function AnalysisPanel({ analysisInfo, active }) {
  const info = analysisInfo || {
    pattern: active.label,
    language: 'Not analyzed',
    confidence: 'Demo',
    input: 'Load code and click Visualize my code',
    mode: 'Starter pattern',
  };

  return (
    <div className="debug-card">
      <span className="eyebrow">Analysis</span>
      <dl>
        <div>
          <dt>Pattern</dt>
          <dd>{info.pattern}</dd>
        </div>
        <div>
          <dt>Language</dt>
          <dd>{info.language}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{info.confidence}</dd>
        </div>
        <div>
          <dt>Input</dt>
          <dd>{info.input}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{info.mode}</dd>
        </div>
      </dl>
    </div>
  );
}

function VariableWatch({ step }) {
  const entries = Object.entries(step.vars || {}).filter(([, value]) => value !== undefined && value !== null);
  return (
    <div className="debug-card">
      <span className="eyebrow">Variable Watch</span>
      {entries.length ? (
        <dl>
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>No generated variable state for this demo step yet.</p>
      )}
    </div>
  );
}

function CallStack({ stack = [] }) {
  return (
    <div className="debug-card">
      <span className="eyebrow">Call Stack</span>
      {stack.length ? (
        <ol className="call-stack">
          {stack.map((frame) => <li key={frame}>{frame}</li>)}
        </ol>
      ) : (
        <p>No active function stack for this step.</p>
      )}
    </div>
  );
}

export default VisualizerWorkspace;
