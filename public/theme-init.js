(() => {
  let theme;
  try {
    theme = JSON.parse(localStorage.getItem('chat-store') || 'null')?.settings?.theme;
  } catch {
    // Storage may be unavailable; follow the system preference.
  }
  const dark =
    theme === 'dark' ||
    (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.add(dark ? 'theme-default-dark' : 'theme-default');
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();
