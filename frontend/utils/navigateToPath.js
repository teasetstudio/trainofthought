function getHostApp() {
  if (window.parent === window) return null;

  try {
    if (window.parent?.AppHost?.navigate) {
      return window.parent.AppHost;
    }
  } catch {
    return null;
  }

  return null;
}

export function navigateToPath(path, { replace = false } = {}) {
  const hostApp = getHostApp();

  if (hostApp) {
    hostApp.navigate(path, { replace });
    return;
  }

  if (replace) {
    window.location.replace(path);
    return;
  }

  window.location.href = path;
}