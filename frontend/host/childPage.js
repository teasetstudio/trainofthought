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

function getClosestInternalLink(target) {
  if (target instanceof Element) {
    return target.closest('a[href^="/"]');
  }

  if (target instanceof Node && target.parentElement) {
    return target.parentElement.closest('a[href^="/"]');
  }

  return null;
}

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = getClosestInternalLink(event.target);
  if (!link) return;
  if (link.target && link.target !== '_self') return;
  if (link.hasAttribute('download')) return;

  const host = getHost();
  if (!host) return;

  event.preventDefault();
  host.navigate(link.getAttribute('href'));
});
