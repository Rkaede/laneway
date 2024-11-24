import { type ClassValue, clsx } from 'clsx';
import { createEffect } from 'solid-js';
import { twMerge } from 'tailwind-merge';

import type { SessionProps } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function download(data: string, filename: string) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();
  document.body.removeChild(element);
}

export function filenameDate(date: Date = new Date()) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  const formattedDate = localDate.toISOString().split('T')[0];
  const formattedTime = localDate.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${formattedDate}_${formattedTime}`;
}

export function downloadFile(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.style.display = 'none';
  link.click();
}

export function groupByDate(sessions: SessionProps[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groupedObjects: Record<string, SessionProps[]> = {
    today: [],
    yesterday: [],
    last7Days: [],
    older: [],
  };

  for (const session of sessions) {
    const objDate = new Date(session.created);
    if (objDate.toDateString() === today.toDateString()) {
      groupedObjects.today.push(session);
    } else if (objDate.toDateString() === yesterday.toDateString()) {
      groupedObjects.yesterday.push(session);
    } else if (objDate > lastWeek) {
      groupedObjects.last7Days.push(session);
    } else {
      groupedObjects.older.push(session);
    }
  }

  return groupedObjects;
}

export function createLog(obj: unknown) {
  return createEffect(() => {
    console.log(JSON.stringify(obj, null, 2));
  });
}

export async function base64EncodeFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to encode file'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

export function sanitizeMessage(message: string) {
  return message
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
