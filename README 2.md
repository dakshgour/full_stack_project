# Data Structure Visualizer

An interactive React app for learning data structures and DSA patterns through step-by-step visual playback. The app uses a three-pane workspace: code on the left, a live visualization in the center, and controls with explanations on the right.

## Supported Structures

- Trees
- Graphs
- Linked lists
- Arrays
- Stacks
- Queues

## DSA Patterns

- Sliding window
- Two pointers
- Binary search
- DFS / BFS

## Personal Code Visualizer

Paste your own DSA code into the main left editor, choose a language, and click **Visualize my code**. The app keeps the pasted code in the browser session and maps it to the closest available animation, such as tree DFS, graph BFS, sliding window, two pointers, stack, queue, linked list, or array scanning.

For binary search code, the app can read a pasted LeetCode-style array and target, then generate the search steps from those values.

The optional test-input box lets you override inferred values, for example:

```text
array: [2,5,8,12,16,23,38] target: 23
```

Generated traces include an analysis panel, variable watch, and call stack so the app feels closer to a debugger for stuck LeetCode solutions.

## Language Support

- JavaScript
- Python
- C++

Each sample can be loaded as starter code for the selected language.

## Sample Codes

The sample library includes ready-to-load examples for:

- Tree DFS
- Graph BFS
- Linked list insertion
- Sliding window
- Two pointers
- Binary search

## Features

- Animated step-by-step execution
- Play, pause, previous, next, and reset controls
- Speed and zoom sliders
- Active code-line highlighting
- Live memory-style visualizations
- Step explanations for each operation
- Responsive layout for desktop and mobile

## Tech Stack

- React
- Vite
- CSS

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Vite will print the local URL in the terminal, usually:

```text
http://localhost:5173/
```

If that port is busy, Vite will automatically choose another one.

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```
