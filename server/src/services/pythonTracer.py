import ast
import json
import math
import sys
from collections import Counter, defaultdict, deque
from typing import Deque, Dict, List, Optional, Set, Tuple

MAX_STEPS = 200
USER_FILENAME = "<user_code>"
ALLOWED_IMPORTS = {"typing", "collections", "math"}


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


def parse_input_override(raw, parameter_names):
    text = (raw or "").strip()
    if not text:
        return {}

    if len(parameter_names) == 1:
        try:
            return {parameter_names[0]: _parse_literal(text)}
        except Exception:
            pass

    named = {}
    pieces = [piece.strip() for piece in text.replace("\n", ",").split(",") if piece.strip()]
    buffer = []
    for piece in pieces:
        if ":" in piece and not buffer:
            key, value = piece.split(":", 1)
            named[key.strip()] = value.strip()
            continue
        if ":" in piece and buffer:
            last_key = next(reversed(named))
            named[last_key] = f"{named[last_key]}, {', '.join(buffer)}"
            buffer = []
            key, value = piece.split(":", 1)
            named[key.strip()] = value.strip()
            continue
        buffer.append(piece)

    if buffer and named:
        last_key = next(reversed(named))
        named[last_key] = f"{named[last_key]}, {', '.join(buffer)}"

    parsed = {}
    for name in parameter_names:
        if name in named:
            parsed[name] = _parse_literal(named[name])

    if parsed:
        return parsed

    try:
        payload = _parse_literal(text)
        if isinstance(payload, dict):
            return {key: value for key, value in payload.items() if key in parameter_names}
        if isinstance(payload, (list, tuple)) and len(payload) == len(parameter_names):
            return {parameter_names[index]: payload[index] for index in range(len(parameter_names))}
    except Exception:
        pass

    raise ValueError(
        "Unable to parse test input. Use Python-style literals like colors: [1,2,3] or {'colors': [1,2,3]}."
    )


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


def find_solution_method(tree):
    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == "Solution":
            for child in node.body:
                if isinstance(child, ast.FunctionDef) and child.name != "__init__":
                    params = [arg.arg for arg in child.args.args if arg.arg != "self"]
                    return child.name, params
    raise ValueError("Expected a LeetCode-style class Solution with at least one method.")


def build_exec_globals():
    safe_builtins = {
        "__build_class__": __build_class__,
        "Exception": Exception,
        "abs": abs,
        "all": all,
        "any": any,
        "bool": bool,
        "dict": dict,
        "enumerate": enumerate,
        "filter": filter,
        "float": float,
        "int": int,
        "isinstance": isinstance,
        "len": len,
        "list": list,
        "map": map,
        "max": max,
        "min": min,
        "object": object,
        "range": range,
        "reversed": reversed,
        "set": set,
        "sorted": sorted,
        "str": str,
        "sum": sum,
        "tuple": tuple,
        "zip": zip,
    }
    return {
        "__builtins__": safe_builtins,
        "__name__": "__main__",
        "List": List,
        "Optional": Optional,
        "Tuple": Tuple,
        "Dict": Dict,
        "Set": Set,
        "Deque": Deque,
        "deque": deque,
        "defaultdict": defaultdict,
        "Counter": Counter,
        "math": math,
    }


def derive_step_shape(locals_snapshot, stack, lineno, lines, result=None):
    step = {
        "title": f"Line {lineno}",
        "line": lineno,
        "vars": locals_snapshot,
        "stack": stack,
        "note": lines[lineno - 1].strip() if 0 < lineno <= len(lines) else "Executing user code.",
    }

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
    method_name, parameter_names = find_solution_method(tree)
    args_by_name = parse_input_override(input_override, parameter_names)

    exec_globals = build_exec_globals()
    compiled = compile(sanitized_code, USER_FILENAME, "exec")
    exec(compiled, exec_globals, exec_globals)

    solution_class = exec_globals.get("Solution")
    if solution_class is None:
        raise ValueError("Solution class did not load correctly.")
    solver = solution_class()
    method = getattr(solver, method_name, None)
    if method is None:
        raise ValueError(f"Could not find Solution.{method_name}.")

    missing = [name for name in parameter_names if name not in args_by_name]
    if missing:
        raise ValueError(f"Missing test input for parameters: {', '.join(missing)}")

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
        "input": {key: _safe_repr(value) for key, value in args_by_name.items()},
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
