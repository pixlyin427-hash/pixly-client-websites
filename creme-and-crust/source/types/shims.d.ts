declare module 'react' {
  export function useState<T = any>(v?: T | (() => T)): [T, (v: T | ((p: T) => T)) => void];
  export function useEffect(f: () => any, d?: any[]): void;
  export function useMemo<T>(f: () => T, d: any[]): T;
  export function useRef<T = any>(v?: T | null): { current: T };
  export function useSyncExternalStore<T>(s: any, g: () => T, gs?: () => T): T;
  export const Fragment: any; export type ReactNode = any;
}
declare module 'react-dom/client' { export function createRoot(el: any): any; }
declare module 'react/jsx-runtime' { export const jsx: any; export const jsxs: any; export const Fragment: any; }
declare module 'react-icons/lu';
declare module '*.css';
declare namespace JSX { interface IntrinsicElements { [k: string]: any } interface Element {} interface ElementChildrenAttribute { children: {} } interface IntrinsicAttributes { key?: any } }
