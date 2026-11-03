/**
 * Current time for Server Components. They render once per request, so reading
 * the clock here is safe (the React Compiler purity rule targets client re-renders).
 */
export const now = () => new Date();
export const nowMs = () => now().getTime();
