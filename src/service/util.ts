import { useState } from 'react';
import { message } from './message';

const pwd = [
  'abcdefghijklmnopqrstuvwxyz', // lower chars
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ', // upper chars
  '0123456789', // number
  '@$%',
  // "`!?$?%^&*()_-+={[}]:;@'~#|\\<>.?/];", //special chars
];
export function generateStrongPassword() {
  return new Array(20)
    .fill(0)
    .map(() => {
      const c = pwd[Math.floor(Math.random() * pwd.length)];
      return c[Math.floor(Math.random() * c.length)];
    })
    .join('');
}
export const copyToClipboard = (textToCopy: string) => {
  // navigator clipboard needs a secure context (HTTPS)
  if (!IS_IN_MOBILE && navigator.clipboard && window.isSecureContext) {
    // navigator clipboard api method'
    return navigator.clipboard.writeText(textToCopy);
  }
  const textArea = document.createElement('textarea');
  textArea.value = textToCopy;
  // set textArea invisible
  textArea.style.position = 'absolute';
  textArea.style.opacity = '0';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  return new Promise<void>((res, rej) => {
    // exec copy command and remove text area
    document.execCommand('copy') ? res() : rej();
    textArea.remove();
  });
};
export function uid() {
  return Date.now().toString(32) + Math.floor(Math.random() * 0xffffff).toString(32);
}
export function isNumber(v: unknown): v is number {
  return typeof v === 'number';
}
export function isString(v: unknown): v is string {
  return typeof v === 'string';
}
export function isObject<T extends object>(v: unknown): v is T {
  return typeof v === 'object' && v !== null;
}
export function isUndefined(v: unknown): v is undefined {
  return typeof v === 'undefined';
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction<T extends (...args: any[]) => any>(v: unknown): v is T {
  return typeof v === 'function';
}

export function cs(...args: (string | Record<string, boolean> | boolean | null | undefined)[]) {
  const segs: string[] = [];
  args.forEach((arg) => {
    if (isObject(arg)) {
      Object.keys(arg).forEach((k) => {
        if (arg[k]) {
          segs.push(k.trim());
        }
      });
    } else if (isString(arg) && arg.trim()) {
      segs.push(arg);
    }
  });
  return segs.join(' ');
}

export function useQuery<T = string>(key: string, defaultValue: T) {
  const getQ = () => {
    const q = new URLSearchParams(location.search);
    return q.get(key);
  };
  const [v, setV] = useState(() => getQ() ?? defaultValue);
  return [
    v,
    (newValue: T) => {
      const q = new URLSearchParams(location.search);
      q.set(key, newValue as string);
      const url = location.pathname;
      window.history.replaceState(null, '', `${url}?${q.toString()}`);
      setV(newValue);
    },
  ] as [T, (newValue: T) => void];
}

export function renderTpl(tpl: string, ctx: Record<string, unknown>) {
  Object.entries(ctx).forEach(([k, v]) => {
    const r = new RegExp(`\\$${k}\\$`, 'g');
    tpl = tpl.replace(r, v as string);
  });
  return tpl;
}

export interface LoadingMessage {
  update: (title: string) => void;
  end: (title: string, type?: 'success' | 'error') => void;
  close: () => void;
}
export function loadingMessage(title: string): LoadingMessage {
  const key = uid();
  void message.open({
    key,
    duration: 0,
    content: title,
    type: 'loading',
  });
  return {
    update(title: string) {
      void message.open({
        key,
        duration: 0,
        content: title,
        type: 'loading',
      });
    },
    end(title: string, type = 'success') {
      void message.open({
        key,
        duration: 4,
        content: title,
        type,
      });
    },
    close() {
      void message.destroy(key);
    },
  };
}

export const IS_IN_MOBILE = window.__TAURI_PLATFORM__ === 'android';
