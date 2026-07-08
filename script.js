// ---------- Footer year ----------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Navbar scroll state + progress bar ----------
const navbar = document.getElementById('navbar');
const progressBar = document.getElementById('progressBar');

function onScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
  navbar.classList.toggle('scrolled', scrollTop > 40);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Mobile menu ----------
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('mobile-open');
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('mobile-open');
  });
});

// ---------- Active nav link on scroll ----------
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinkEls.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach(sec => navObserver.observe(sec));

// ---------- Reveal on scroll ----------
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach(el => revealObserver.observe(el));

// ---------- Animated counters ----------
const statNumbers = document.querySelectorAll('.stat-number');
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
statNumbers.forEach(el => countObserver.observe(el));

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const isYear = target > 100;
  const duration = 1400;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(eased * target);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

// ---------- Cursor glow (desktop only) ----------
const cursorGlow = document.getElementById('cursorGlow');
const isTouch = matchMedia('(hover: none)').matches;
if (!isTouch) {
  window.addEventListener('mousemove', (e) => {
    cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  }, { passive: true });
}

// ---------- Particle network background (hero) ----------
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId;

function resizeCanvas() {
  const hero = canvas.closest('.hero');
  canvas.width = hero.offsetWidth;
  canvas.height = hero.offsetHeight;
}

function initParticles() {
  const count = Math.min(70, Math.floor((canvas.width * canvas.height) / 18000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 1.8 + 0.6
  }));
}

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const maxDist = 130;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.55)';
    ctx.fill();

    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = `rgba(10, 31, 68, ${0.12 * (1 - dist / maxDist)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
  animationId = requestAnimationFrame(drawParticles);
}

function startParticles() {
  resizeCanvas();
  initParticles();
  if (animationId) cancelAnimationFrame(animationId);
  if (!reduceMotion) drawParticles();
}

if (canvas) {
  startParticles();
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(startParticles, 200);
  });
}

// ---------- Click-to-edit mode ----------
// Lets you click any heading/paragraph on the live page and edit it directly.
// Nothing is written to disk from here (this is a static site) — "Save Changes"
// produces a copyable list of [id] old -> new text that you paste back into
// the chat with Claude, who applies it to index.html and pushes it.
(function setupEditMode() {
  const EDITABLE_SELECTOR = 'h1, h2, h3, p, li';
  const originalText = new Map(); // element -> original text at edit-mode start
  let editModeOn = false;

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'editModeToggle';
  toggleBtn.className = 'edit-fab';
  toggleBtn.type = 'button';
  toggleBtn.title = 'Toggle edit mode';
  toggleBtn.textContent = '✏️';
  document.body.appendChild(toggleBtn);

  const banner = document.createElement('div');
  banner.className = 'edit-banner';
  banner.innerHTML = `
    <span>Edit Mode — click any heading or paragraph to change it.</span>
    <div class="edit-banner-actions">
      <button type="button" class="edit-banner-btn edit-save">Save Changes</button>
      <button type="button" class="edit-banner-btn edit-exit">Exit</button>
    </div>
  `;
  document.body.appendChild(banner);

  const modal = document.createElement('div');
  modal.className = 'edit-modal';
  modal.innerHTML = `
    <div class="edit-modal-card">
      <h3>Your changes</h3>
      <p class="edit-modal-hint">Copy this and paste it into the chat with Claude — it'll apply the changes to the site and push them.</p>
      <textarea class="edit-modal-textarea" readonly></textarea>
      <div class="edit-modal-actions">
        <button type="button" class="edit-banner-btn edit-copy">Copy to clipboard</button>
        <button type="button" class="edit-banner-btn edit-close">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  function getEditableElements() {
    const main = document.querySelector('main');
    if (!main) return [];
    return Array.from(main.querySelectorAll(EDITABLE_SELECTOR)).filter(
      el => !el.closest('.hero-role') && !el.closest('#typewriter')
    );
  }

  function assignIds() {
    const counters = {};
    getEditableElements().forEach(el => {
      if (!el.dataset.editId) {
        const tag = el.tagName.toLowerCase();
        counters[tag] = (counters[tag] || 0) + 1;
        el.dataset.editId = `${tag}-${counters[tag] - 1}`;
      }
      originalText.set(el, el.textContent.trim());
    });
  }

  function enterEditMode() {
    editModeOn = true;
    document.body.classList.add('edit-mode-active');
    assignIds();
    getEditableElements().forEach(el => {
      el.setAttribute('contenteditable', 'true');
    });
    banner.classList.add('visible');
    toggleBtn.classList.add('active');
  }

  function exitEditMode() {
    editModeOn = false;
    document.body.classList.remove('edit-mode-active');
    getEditableElements().forEach(el => el.removeAttribute('contenteditable'));
    banner.classList.remove('visible');
    toggleBtn.classList.remove('active');
  }

  function collectChanges() {
    const changes = [];
    originalText.forEach((before, el) => {
      const after = el.textContent.trim();
      if (after !== before) {
        changes.push({ id: el.dataset.editId, before, after });
      }
    });
    return changes;
  }

  toggleBtn.addEventListener('click', () => {
    editModeOn ? exitEditMode() : enterEditMode();
  });

  banner.querySelector('.edit-exit').addEventListener('click', exitEditMode);

  banner.querySelector('.edit-save').addEventListener('click', () => {
    const changes = collectChanges();
    const textarea = modal.querySelector('.edit-modal-textarea');
    if (changes.length === 0) {
      textarea.value = 'No changes detected. Edit some text first, then Save.';
    } else {
      textarea.value = changes
        .map(c => `[${c.id}]\n- before: "${c.before}"\n- after:  "${c.after}"`)
        .join('\n\n');
    }
    modal.classList.add('visible');
  });

  modal.querySelector('.edit-close').addEventListener('click', () => {
    modal.classList.remove('visible');
  });

  modal.querySelector('.edit-copy').addEventListener('click', async () => {
    const textarea = modal.querySelector('.edit-modal-textarea');
    try {
      await navigator.clipboard.writeText(textarea.value);
      const btn = modal.querySelector('.edit-copy');
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    } catch {
      textarea.select();
      document.execCommand('copy');
    }
  });
})();
