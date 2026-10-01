'use client';
import { useEffect } from 'react';

export default function ThemeSetter() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);
  return null;
}