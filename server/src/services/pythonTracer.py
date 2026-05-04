import ast
import bisect
import functools
import heapq
import itertools
import json
import math
import sys
from collections import Counter, OrderedDict, defaultdict, deque
from typing import Any, Deque, Dict, List, Optional, Set, Tuple

MAX_STEPS = 500
USER_FILENAME = "<user_code>"
ALLOWED_IMPORTS = {"typing", "collections", "math", "heapq", "bisect", "functools", "itertools", "string"}


def _safe_repr(value):
    if isinstance(value, (int, float, str, bool)) or value is None:
        return value
    if isinstance(value, list):
        return [_safe_repr(item) for item in value[:30]]
    if isinstance(value, tuple):
        return [_safe_repr(item) for item in value[:30]]
    if isinstance(value, dict):
        items = list(value.items())[:20]
        return {str(key): _safe_repr(item) for key, item in items}
    if isinstance(value, set):
        return [_safe_repr(item) for item in list(value)[:20]]
    if hasattr(value, "__dict__"):
        payload = {"type": type(value).__name__}
        for key, item in list(vars(value).items())[:10]:
            payload[key] = _safe_repr(item)
        return payload
    return repr(value)



def _normalize_literal_text(text):
    return (
        text.replace("null", "None")
        .replace("true", "True")
        .replace("false", "False")
    )


def _parse_literal(value):
    return ast.literal_eval(_normalize_literal_text(value))


# Sensible defaults keyed by common parameter names.
# Used as a last resort so simple code (factorial, fib, etc.) always runs.
PARAM_DEFAULTS = {
    # integers
    "n": 6, "num": 6, "number": 6, "x": 5, "val": 5, "k": 3,
    "target": 9, "t": 5, "limit": 10, "m": 3, "p": 2, "q": 3,
    # arrays
    "nums": [2, 7, 11, 15], "arr": [2, 7, 11, 15], "array": [1, 2, 3, 4, 5],
    "prices": [7, 1, 5, 3, 6, 4], "heights": [2, 1, 5, 6, 2, 3],
    "coins": [1, 5, 10, 25], "weights": [1, 2, 3, 4, 5],
    # strings
    "s": "hello", "string": "abcba", "t": "world", "word": "level",
    "str": "racecar", "pattern": "abc", "text": "hello world",
    # lists of strings
    "strs": ["eat", "tea", "tan", "ate", "nat", "bat"],
    "words": ["hello", "world"],
    # 2-D
    "matrix": [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
    "grid": [[1, 0], [0, 1]],
    # linked-list / tree (None → caller handles separately)
    "head": None, "root": None,
}


def _infer_default(name):
    """Return a sensible default for an unknown parameter name."""
    low = name.lower()
    if low in PARAM_DEFAULTS:
        return PARAM_DEFAULTS[low]
    # heuristics
    if any(low.endswith(s) for s in ("nums", "arr", "list", "array", "values", "items")):
        return [1, 2, 3, 4, 5]
    if any(low.endswith(s) for s in ("str", "string", "word", "text", "s")):
        return "hello"
    if any(low.endswith(s) for s in ("map", "dict", "graph", "adj")):
        return {}
    # default: small integer
    return 5


def parse_input_override(raw, parameter_names):
    """Parse user-supplied input with 5 progressive fallback tiers."""
    text = (raw or "").strip()

    # ── Tier 0: no input at all → smart defaults ──────────────────────────
    if not text:
        return {name: _infer_default(name) for name in parameter_names}

    # ── Tier 1: single param, try the whole text as a literal ─────────────
    if len(parameter_names) == 1:
        try:
            return {parameter_names[0]: _parse_literal(text)}
        except Exception:
            pass

    # ── Tier 2: exact named matching  (key = value  or  key: value) ───────
    named_raw = {}            # name → raw string fragment
    current_key = None
    current_frags = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        for delim in ("=", ":"):
            if delim in line:
                key, _, val_part = line.partition(delim)
                key = key.strip()
                # only accept if this key matches a parameter exactly
                if key in parameter_names:
                    if current_key is not None:
                        named_raw[current_key] = " ".join(current_frags).strip()
                    current_key = key
                    current_frags = [val_part.strip()]
                    break
        else:
            if current_key is not None:
                current_frags.append(line)
    if current_key is not None:
        named_raw[current_key] = " ".join(current_frags).strip()

    parsed = {}
    for name in parameter_names:
        if name in named_raw:
            try:
                parsed[name] = _parse_literal(named_raw[name])
            except Exception:
                pass
    if len(parsed) == len(parameter_names):
        return parsed

    # ── Tier 3: fuzzy / prefix matching (type-aware) ────────────────────
    # Only matches param↔key when their pluralisation differs by one "s"
    # AND the parsed value is type-compatible with the parameter name.
    all_kvs = {}   # raw key → raw value from the input text
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        for delim in ("=", ":"):
            if delim in line:
                k, _, v = line.partition(delim)
                all_kvs[k.strip()] = v.strip()
                break

    _SCALAR_PARAMS = {"num", "n", "k", "target", "t", "x", "val", "limit",
                      "m", "p", "q", "count", "size", "index", "start", "end"}
    _LIST_PARAMS   = {"nums", "arr", "array", "items", "values", "prices",
                      "heights", "coins", "weights", "strs", "words"}

    def _type_ok(pname, value):
        low = pname.lower()
        if low in _SCALAR_PARAMS and isinstance(value, list):
            return False
        if low in _LIST_PARAMS and isinstance(value, (int, float)):
            return False
        return True

    fuzzy = dict(parsed)  # start from what tier-2 found
    for pname in parameter_names:
        if pname in fuzzy:
            continue
        for raw_key, raw_val in all_kvs.items():
            lk, lp = raw_key.lower(), pname.lower()
            # Only match if they differ by exactly one trailing "s"
            name_match = (
                (lk == lp)
                or (lk == lp + "s")
                or (lp == lk + "s")
            )
            if not name_match:
                continue
            try:
                candidate = _parse_literal(raw_val)
                if _type_ok(pname, candidate):
                    fuzzy[pname] = candidate
                    break
            except Exception:
                pass
    if len(fuzzy) == len(parameter_names):
        return fuzzy

    # ── Tier 4: whole-text positional literal  e.g. "[1,2,3], 9" ─────────
    try:
        payload = _parse_literal(text)
        if isinstance(payload, dict):
            mapped = {k: v for k, v in payload.items() if k in parameter_names}
            if mapped:
                return {**{n: _infer_default(n) for n in parameter_names}, **mapped}
        if isinstance(payload, (list, tuple)) and len(payload) == len(parameter_names):
            return {parameter_names[i]: payload[i] for i in range(len(parameter_names))}
        if len(parameter_names) == 1:
            return {parameter_names[0]: payload}
    except Exception:
        pass

    # ── Tier 5: smart defaults for whatever is still missing ──────────────
    result = {**fuzzy}
    for name in parameter_names:
        if name not in result:
            result[name] = _infer_default(name)
    # Always succeed — worst case every param gets a sane default
    return result


def sanitize_code(code):
    tree = ast.parse(code, filename=USER_FILENAME)
    sanitized_lines = []
    for node in tree.body:
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            module = getattr(node, "module", None)
            names = [alias.name.split(".")[0] for alias in node.names]
            if isinstance(node, ast.Import):
                allowed = all(name.split(".")[0] in ALLOWED_IMPORTS for name in names)
            else:
                allowed = (module or "").split(".")[0] in ALLOWED_IMPORTS
            if not allowed:
                raise ValueError("Only typing, collections, and math imports are allowed in Python tracing.")
    for line in code.splitlines():
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("from "):
            root = stripped.split()[1].split(".")[0]
            if root in ALLOWED_IMPORTS:
                continue
        sanitized_lines.append(line)
    return "\n".join(sanitized_lines), tree


def find_entrypoint(tree):
    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == "Solution":
            for child in node.body:
                if isinstance(child, ast.FunctionDef) and child.name != "__init__":
                    params = [arg.arg for arg in child.args.args if arg.arg != "self"]
                    return {"mode": "class", "callable_name": child.name, "parameter_names": params}
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and not node.name.startswith("_"):
            params = [arg.arg for arg in node.args.args]
            return {"mode": "function", "callable_name": node.name, "parameter_names": params}
    raise ValueError("Expected either a LeetCode-style class Solution method or a top-level Python function.")


def _safe_print(*args, **kwargs):
    # redirect print to stderr so it doesn't pollute stdout JSON
    print(*args, file=sys.stderr, **kwargs)


def build_exec_globals():
    safe_builtins = {
        "__build_class__": __build_class__,
        "ArithmeticError": ArithmeticError,
        "Exception": Exception,
        "IndexError": IndexError,
        "KeyError": KeyError,
        "StopIteration": StopIteration,
        "TypeError": TypeError,
        "ValueError": ValueError,
        "ZeroDivisionError": ZeroDivisionError,
        "abs": abs,
        "all": all,
        "any": any,
        "bin": bin,
        "bool": bool,
        "callable": callable,
        "chr": chr,
        "dict": dict,
        "divmod": divmod,
        "enumerate": enumerate,
        "filter": filter,
        "float": float,
        "format": format,
        "frozenset": frozenset,
        "getattr": getattr,
        "hasattr": hasattr,
        "hash": hash,
        "hex": hex,
        "id": id,
        "int": int,
        "isinstance": isinstance,
        "issubclass": issubclass,
        "iter": iter,
        "len": len,
        "list": list,
        "map": map,
        "max": max,
        "min": min,
        "next": next,
        "object": object,
        "oct": oct,
        "ord": ord,
        "pow": pow,
        "print": _safe_print,
        "range": range,
        "repr": repr,
        "reversed": reversed,
        "round": round,
        "set": set,
        "setattr": setattr,
        "slice": slice,
        "sorted": sorted,
        "str": str,
        "sum": sum,
        "tuple": tuple,
        "type": type,
        "vars": vars,
        "zip": zip,
    }
    return {
        "__builtins__": safe_builtins,
        "__name__": "__main__",
        # typing
        "Any": Any,
        "List": List,
        "Optional": Optional,
        "Tuple": Tuple,
        "Dict": Dict,
        "Set": Set,
        "Deque": Deque,
        # collections
        "deque": deque,
        "defaultdict": defaultdict,
        "Counter": Counter,
        "OrderedDict": OrderedDict,
        # stdlib modules
        "math": math,
        "heapq": heapq,
        "bisect": bisect,
        "functools": functools,
        "itertools": itertools,
    }


def derive_step_shape(locals_snapshot, stack, lineno, lines, result=None):
    step = {
        "title": f"Line {lineno}",
        "line": lineno,
        "vars": locals_snapshot,
        "stack": stack,
        "note": lines[lineno - 1].strip() if 0 < lineno <= len(lines) else "Executing user code.",
    }

    list_views = [
        {"name": key, "values": value}
        for key, value in locals_snapshot.items()
        if isinstance(value, list) and all(isinstance(item, (int, float, bool, type(None), str)) for item in value)
    ]
    dict_views = [
        {"name": key, "entries": value}
        for key, value in locals_snapshot.items()
        if isinstance(value, dict)
    ]
    scalar_entries = [
        {"name": key, "value": value}
        for key, value in locals_snapshot.items()
        if isinstance(value, (int, float, str, bool)) or value is None
    ]

    if list_views:
        step["listViews"] = list_views
    if dict_views:
        step["dictViews"] = dict_views
    if scalar_entries:
        step["scalarEntries"] = scalar_entries

    list_candidates = [
        (key, value)
        for key, value in locals_snapshot.items()
        if isinstance(value, list) and value and all(isinstance(item, (int, float, bool, type(None), str)) for item in value)
    ]
    if list_candidates:
        primary_name, primary_values = max(list_candidates, key=lambda item: len(item[1]))
        step["values"] = primary_values
        step["active"] = primary_name
        for index_name in ("j", "right", "mid", "i", "left"):
            index_value = locals_snapshot.get(index_name)
            if isinstance(index_value, int) and 0 <= index_value < len(primary_values):
                step["focus"] = index_value
                break
        for marker in ("left", "right", "mid", "target"):
            marker_value = locals_snapshot.get(marker)
            if isinstance(marker_value, int):
                step[marker] = marker_value
        for best_name in ("ans", "best", "result", "max_sum", "window_sum"):
            if best_name in locals_snapshot and isinstance(locals_snapshot[best_name], (int, float, str)):
                step["best"] = locals_snapshot[best_name]
                step["bestLabel"] = best_name
                break

    if result is not None:
        step["result"] = _safe_repr(result)

    return step


def main():
    raw = sys.stdin.read()
    payload = json.loads(raw or "{}")
    code = payload.get("code", "")
    input_override = payload.get("inputOverride", "")

    sanitized_code, tree = sanitize_code(code)
    entrypoint = find_entrypoint(tree)
    method_name = entrypoint["callable_name"]
    parameter_names = entrypoint["parameter_names"]
    args_by_name = parse_input_override(input_override, parameter_names)

    exec_globals = build_exec_globals()
    compiled = compile(sanitized_code, USER_FILENAME, "exec")
    exec(compiled, exec_globals, exec_globals)

    if entrypoint["mode"] == "class":
        solution_class = exec_globals.get("Solution")
        if solution_class is None:
            raise ValueError("Solution class did not load correctly.")
        solver = solution_class()
        method = getattr(solver, method_name, None)
        if method is None:
            raise ValueError(f"Could not find Solution.{method_name}.")
        mode_label = f"Solution.{method_name}"
    else:
        method = exec_globals.get(method_name)
        if method is None:
            raise ValueError(f"Could not find function {method_name}.")
        mode_label = method_name

    # Track which params were inferred (not explicitly supplied by user)
    supplied_keys = set()
    for raw_line in (input_override or "").splitlines():
        line = raw_line.strip()
        for delim in ("=", ":"):
            if delim in line:
                k = line.partition(delim)[0].strip()
                supplied_keys.add(k)
                break
    used_defaults = {name: _safe_repr(args_by_name[name])
                    for name in parameter_names if name not in supplied_keys}

    ordered_args = [args_by_name[name] for name in parameter_names]
    lines = sanitized_code.splitlines()
    steps = []

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != USER_FILENAME:
            return tracer
        if len(steps) >= MAX_STEPS:
            raise RuntimeError(f"Execution produced more than {MAX_STEPS} trace steps.")

        if event not in {"call", "line", "return"}:
            return tracer

        stack = []
        current = frame
        while current:
            if current.f_code.co_filename == USER_FILENAME:
                stack.append(f"{current.f_code.co_name}()")
            current = current.f_back
        stack.reverse()

        locals_snapshot = {
            key: _safe_repr(value)
            for key, value in frame.f_locals.items()
            if key != "self"
        }

        if event == "return":
            steps.append(
                derive_step_shape(locals_snapshot, stack, frame.f_lineno, lines, result=arg)
            )
        elif event == "line":
            steps.append(derive_step_shape(locals_snapshot, stack, frame.f_lineno, lines))

        return tracer

    sys.settrace(tracer)
    try:
        result = method(*ordered_args)
    finally:
        sys.settrace(None)

    response = {
        "methodName": method_name,
        "parameterNames": parameter_names,
        "entryLabel": mode_label,
        "input": {key: _safe_repr(value) for key, value in args_by_name.items()},
        "usedDefaults": used_defaults,
        "result": _safe_repr(result),
        "steps": steps,
    }
    json.dump(response, sys.stdout)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        json.dump({"error": str(error)}, sys.stdout)
        sys.exit(1)
