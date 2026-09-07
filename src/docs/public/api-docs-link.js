(() => {
  const hostname = window.location.hostname;
  const preview = hostname.match(/^(\d+)-docs\.preview\.nextjudge\.net$/);
  const link = document.querySelector('[data-api-docs-link]');
  if (!link) return;

  const configuredTarget = link.getAttribute('href');
  let target = configuredTarget || 'https://api.nextjudge.net/docs';
  if (preview) {
    target = `https://${preview[1]}-api.preview.nextjudge.net/docs`;
  } else if (
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    (!configuredTarget || !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(configuredTarget))
  ) {
    target = `http://${hostname}:5000/docs`;
  }

  link.setAttribute('href', target);
})();
