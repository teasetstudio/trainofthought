function getHost() {
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

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="/"]');
  if (!link) return;

  const host = getHost();
  if (!host) return;

  event.preventDefault();
  host.navigate(link.getAttribute('href'));
});
