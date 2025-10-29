# React error 310 cheat sheet

When the production build throws the message `Minified React error #310`, React
has detected that a Hook received an invalid dependency list. Hooks such as
`useMemo`, `useCallback`, and `useEffect` now require their second argument to be
an **inline array literal** of dependency values. Passing anything else (for
example `null`, a plain object, a spread/conditional array expression, or a
number) will crash in production with this code.

## Debug checklist

1. Look for recent changes where a Hook's dependency list might have been
   replaced with anything other than an inline array literal such as
   `[foo, bar]`.
2. Remove helper variables and keep the dependency array inline; React now
   treats `useEffect(callback, deps)` as invalid even if `deps` is an array.
3. Avoid dynamic dependency expressions like spreads (`[...deps]`) or
   conditionals (`condition ? [a] : [a, b]`). Split the Hook or guard its logic
   inside instead.
4. Use the new runtime error boundary fallback to surface the human-friendly
   explanation while debugging locally.

The new `ErrorBoundary` component mounted in `src/main.tsx` already recognises
this code and provides a suggestion in the UI when it fires.
