# React error 310 cheat sheet

When the production build throws the message `Minified React error #310`, React
has detected that a Hook received an invalid dependency list. Hooks such as
`useMemo`, `useCallback`, and `useEffect` require their second argument to be an
array of dependency values. Passing anything else (for example `null`, a plain
object, or a number) will crash in production with this code.

## Debug checklist

1. Look for recent changes where a Hook's dependency list might have been
   replaced with a value that is not an array literal.
2. Ensure helper variables that end up in `useMemo(..., deps)` are always arrays
   (`const deps = [foo, bar]`) and never `undefined`.
3. Use the new runtime error boundary fallback to surface the human-friendly
   explanation while debugging locally.

The new `ErrorBoundary` component mounted in `src/main.tsx` already recognises
this code and provides a suggestion in the UI when it fires.
