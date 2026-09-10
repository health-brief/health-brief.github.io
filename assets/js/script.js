// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Dark mode toggle ----
// Reads preference from localStorage; falls back to system preference.
// Toggle flips between dark and light, persisting the choice.
(function () {
  const root = document.documentElement;
  const STORAGE_KEY = 'hb-theme';

  // Ensure system preference is reflected when no saved choice exists
  if (!localStorage.getItem(STORAGE_KEY)) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  // Keep in sync if the system preference changes and no override is saved
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!localStorage.getItem(STORAGE_KEY)) {
      if (e.matches) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const isDark = root.getAttribute('data-theme') === 'dark';
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const next = isDark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      // If the target state matches the system preference, remove the override
      // so the system listener can re-activate in the future.
      if ((next === 'dark' && systemDark) || (next === 'light' && !systemDark)) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
      }
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
