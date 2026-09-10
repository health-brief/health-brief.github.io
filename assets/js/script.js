// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Dark mode toggle ----
// Reads preference from localStorage; falls back to system preference.
// Cycles: system → dark → light → system …
(function () {
  const root = document.documentElement;
  const STORAGE_KEY = 'hb-theme';

  function applyTheme(saved) {
    if (saved === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (saved === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  // Apply saved preference immediately (before paint)
  applyTheme(localStorage.getItem(STORAGE_KEY));

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const current = localStorage.getItem(STORAGE_KEY);
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      let next;
      if (!current) {
        // following system — force opposite
        next = systemDark ? 'light' : 'dark';
      } else if (current === 'dark') {
        next = 'light';
      } else {
        // current === 'light' — go back to system
        next = null;
      }
      if (next) {
        localStorage.setItem(STORAGE_KEY, next);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      applyTheme(next);
    });
  });
})();

// One deliberate reveal moment: pipeline nodes light up in sequence
// the first time the diagram scrolls into view. No per-card fade elsewhere.
const pipeline = document.querySelector('.pipeline-diagram');
if (pipeline && 'IntersectionObserver' in window) {
  const nodes = pipeline.querySelectorAll('.pipe-node');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    nodes.forEach(node => { node.style.opacity = '0'; node.style.transform = 'translateY(10px)'; });

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          nodes.forEach((node, i) => {
            setTimeout(() => {
              node.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
              node.style.opacity = '1';
              node.style.transform = 'none';
            }, i * 180);
          });
          obs.disconnect();
        }
      });
    }, { threshold: 0.4 });

    observer.observe(pipeline);
  }
}

// Pilot request form.
// GitHub Pages is static-only, so this creates a prefilled email draft.
const requestForm = document.getElementById('pilot-request-form');
const formStatus = document.getElementById('form-status');
const formStartedAt = document.getElementById('form-started-at');

if (requestForm && formStatus && formStartedAt) {
  const submitButton = requestForm.querySelector('button[type="submit"]');
  const defaultButtonText = submitButton.textContent;

  const resetStartTime = () => {
    formStartedAt.value = String(Date.now());
  };

  const setStatus = (message, type) => {
    formStatus.textContent = message;
    formStatus.className = `form-status${type ? ` is-${type}` : ''}`;
  };

  resetStartTime();

  requestForm.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => field.removeAttribute('aria-invalid'));
    field.addEventListener('change', () => field.removeAttribute('aria-invalid'));
  });

  requestForm.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('', '');

    if (!requestForm.checkValidity()) {
      requestForm.querySelectorAll(':invalid').forEach(field => field.setAttribute('aria-invalid', 'true'));
      requestForm.reportValidity();
      return;
    }

    const payload = Object.fromEntries(new FormData(requestForm).entries());
    if (payload.website) {
      setStatus('Thanks for your request. We will review it shortly.', 'success');
      requestForm.reset();
      resetStartTime();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Opening email draft...';

    try {
      const destination = 'healthbriefai@gmail.com';
      const subject = encodeURIComponent(`HealthBrief pilot request - ${payload.name}`);
      const body = encodeURIComponent([
        'New HealthBrief pilot request',
        '',
        `Name: ${payload.name || ''}`,
        `Work email: ${payload.email || ''}`,
        `Industry: ${payload.industry || ''}`,
        `Organisation: ${payload.organisation || 'Not provided'}`,
        '',
        'Pilot objective or workflow bottleneck:',
        payload.message || 'Not provided'
      ].join('\n'));

      window.location.href = `mailto:${destination}?subject=${subject}&body=${body}`;

      requestForm.reset();
      resetStartTime();
      setStatus('Your email app should open with a prefilled draft. Send it to complete the request.', 'success');
    } catch (error) {
      setStatus(`Could not open your email app. Please email healthbriefai@gmail.com directly.`, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonText;
    }
  });
}
