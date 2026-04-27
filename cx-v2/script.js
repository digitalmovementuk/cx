const nav = document.getElementById('nav');
const navMenu = document.querySelector('.nav__menu');
const mobileNav = document.getElementById('mobile-nav');
const stickyCta = document.getElementById('stickyCta');
const hero = document.getElementById('top');
const contactForm = document.getElementById('contact');
const formStatus = document.getElementById('form-status');
const navLinks = Array.from(document.querySelectorAll('.nav__links a'));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const consentStorageKey = 'cxPrivacyConsent.v1';
const consentDefaults = {
  necessary: true,
  preferences: false,
  statistics: false,
  marketing: false,
};

function readConsent() {
  try {
    const stored = window.localStorage.getItem(consentStorageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function writeConsent(categories, source) {
  const consent = {
    version: 1,
    source,
    updatedAt: new Date().toISOString(),
    categories: {
      ...consentDefaults,
      ...categories,
      necessary: true,
    },
  };

  try {
    window.localStorage.setItem(consentStorageKey, JSON.stringify(consent));
  } catch {
    return consent;
  }

  return consent;
}

function getConsentChoices() {
  return {
    necessary: true,
    preferences: Boolean(document.getElementById('privacy-preferences')?.checked),
    statistics: Boolean(document.getElementById('privacy-statistics')?.checked),
    marketing: Boolean(document.getElementById('privacy-marketing')?.checked),
  };
}

function setConsentChoices(categories = consentDefaults) {
  ['preferences', 'statistics', 'marketing'].forEach((key) => {
    const input = document.getElementById(`privacy-${key}`);
    if (input) {
      input.checked = Boolean(categories[key]);
    }
  });
}

function closeConsentDialog() {
  const dialog = document.getElementById('privacy-consent');
  if (!dialog) {
    return;
  }

  dialog.hidden = true;
  document.body.classList.remove('has-privacy-dialog');
}

function openConsentDialog() {
  const dialog = document.getElementById('privacy-consent');
  if (!dialog) {
    return;
  }

  const stored = readConsent();
  setConsentChoices(stored?.categories || consentDefaults);
  dialog.hidden = false;
  document.body.classList.add('has-privacy-dialog');
  requestAnimationFrame(() => dialog.querySelector('.privacy-consent__primary')?.focus());
}

function injectConsentDialog() {
  if (document.getElementById('privacy-consent')) {
    return;
  }

  document.body.insertAdjacentHTML(
    'beforeend',
    `
      <section class="privacy-consent" id="privacy-consent" role="dialog" aria-modal="true" aria-labelledby="privacy-consent-title" aria-describedby="privacy-consent-copy" hidden>
        <div class="privacy-consent__panel">
          <button class="privacy-consent__close" type="button" aria-label="Datenschutz-Dialog schließen" data-consent-action="close">&times;</button>
          <div class="privacy-consent__content">
            <div class="privacy-consent__eyebrow">Privatsphäre</div>
            <h2 id="privacy-consent-title">Datenschutz-Einstellungen</h2>
            <p id="privacy-consent-copy">
              Wir nutzen keine Werbe- oder Analyse-Cookies. Diese Einstellungen zeigen trotzdem klar,
              welche Kategorien möglich wären. Optionale Kategorien bleiben aus, bis Sie zustimmen.
            </p>
            <div class="privacy-consent__links" aria-label="Rechtliche Links">
              <a href="./datenschutz.html">Datenschutz</a>
              <a href="./impressum.html">Impressum</a>
            </div>
          </div>

          <div class="privacy-consent__options" aria-label="Consent-Kategorien">
            <label class="privacy-option privacy-option--locked">
              <span>
                <strong>Notwendig</strong>
                <small>Technisch nötig, zum Beispiel diese Einwilligungsverwaltung.</small>
              </span>
              <input type="checkbox" checked disabled />
            </label>
            <label class="privacy-option">
              <span>
                <strong>Präferenzen</strong>
                <small>Merkt optionale Komfort-Einstellungen, falls später genutzt.</small>
              </span>
              <input id="privacy-preferences" type="checkbox" />
            </label>
            <label class="privacy-option">
              <span>
                <strong>Statistik</strong>
                <small>Derzeit nicht aktiv. Würde nur nach Zustimmung geladen.</small>
              </span>
              <input id="privacy-statistics" type="checkbox" />
            </label>
            <label class="privacy-option">
              <span>
                <strong>Marketing</strong>
                <small>Derzeit nicht aktiv. Keine Werbe-Pixel oder Retargeting-Skripte.</small>
              </span>
              <input id="privacy-marketing" type="checkbox" />
            </label>
          </div>

          <div class="privacy-consent__actions">
            <button class="privacy-consent__secondary" type="button" data-consent-action="necessary">Nur notwendige</button>
            <button class="privacy-consent__secondary" type="button" data-consent-action="save">Auswahl speichern</button>
            <button class="privacy-consent__primary" type="button" data-consent-action="all">Alle akzeptieren</button>
          </div>
        </div>
      </section>
    `
  );

  const dialog = document.getElementById('privacy-consent');

  dialog?.addEventListener('click', (event) => {
    const action = event.target.closest('[data-consent-action]')?.dataset.consentAction;
    if (!action) {
      return;
    }

    if (action === 'necessary' || action === 'close') {
      writeConsent(consentDefaults, action);
    }

    if (action === 'save') {
      writeConsent(getConsentChoices(), 'selection');
    }

    if (action === 'all') {
      writeConsent({ preferences: true, statistics: true, marketing: true }, 'all');
    }

    closeConsentDialog();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog?.hidden) {
      writeConsent(consentDefaults, 'necessary');
      closeConsentDialog();
    }
  });
}

function toggleNavState() {
  if (!nav) {
    return;
  }

  nav.classList.toggle('is-scrolled', window.scrollY > 40);
}

function updateHeroMotion() {
  if (!hero) {
    return;
  }

  const rect = hero.getBoundingClientRect();
  const travel = Math.max(hero.offsetHeight - window.innerHeight * 0.45, 1);
  const progress = Math.min(Math.max(-rect.top / travel, 0), 1);

  hero.style.setProperty('--hero-progress', progress.toFixed(3));
}

function updateScrollProgress() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
  document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
}

function onScroll() {
  toggleNavState();
  updateHeroMotion();
  updateScrollProgress();
}

function setDrawerState(isOpen) {
  if (!navMenu || !mobileNav) {
    return;
  }

  navMenu.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  mobileNav.hidden = !isOpen;
  document.body.classList.toggle('has-drawer', isOpen);

  if (isOpen) {
    const firstLink = mobileNav.querySelector('a');
    firstLink?.focus();
  }
}

onScroll();
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', updateHeroMotion);

injectConsentDialog();

if (!readConsent()) {
  openConsentDialog();
}

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-privacy-settings]')) {
    event.preventDefault();
    openConsentDialog();
  }
});

if (hero && !prefersReducedMotion.matches) {
  hero.addEventListener(
    'pointermove',
    (event) => {
      if (window.innerWidth < 980) {
        return;
      }

      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      hero.style.setProperty('--hero-pointer-x', x.toFixed(3));
      hero.style.setProperty('--hero-pointer-y', y.toFixed(3));
    },
    { passive: true }
  );

  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--hero-pointer-x', '0');
    hero.style.setProperty('--hero-pointer-y', '0');
  });
}

if (navMenu && mobileNav) {
  navMenu.addEventListener('click', () => {
    const isOpen = navMenu.getAttribute('aria-expanded') === 'true';
    setDrawerState(!isOpen);
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setDrawerState(false));
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setDrawerState(false);
    }
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
);

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element);
});

if (hero && stickyCta) {
  const stickyObserver = new IntersectionObserver(
    ([entry]) => {
      const shouldShow = !entry.isIntersecting;
      stickyCta.classList.toggle('is-visible', shouldShow);
      stickyCta.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      stickyCta.toggleAttribute('inert', !shouldShow);
    },
    { threshold: 0.2 }
  );

  stickyObserver.observe(hero);
}

if (navLinks.length) {
  const sectionMap = new Map(
    navLinks
      .map((link) => {
        const href = link.getAttribute('href') || '';
        const hash = href.startsWith('#') ? href : '';
        return [link, hash ? document.querySelector(hash) : null];
      })
      .filter(([, section]) => section)
  );

  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        navLinks.forEach((link) => {
          const isActive = sectionMap.get(link) === entry.target;
          link.classList.toggle('is-active', isActive);
          if (isActive) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    },
    { rootMargin: '-42% 0px -50% 0px', threshold: 0.01 }
  );

  sectionMap.forEach((section) => activeObserver.observe(section));
}

const caseStudies = [
  {
    title: 'Abläufe stocken.',
    challenge:
      'Übergaben dauern zu lang und niemand sieht, wo es wirklich klemmt.',
    focus:
      'CX macht den Ist-Zustand sichtbar und sortiert die größten Bremsen.',
    change:
      'Das Team weiß, wo Verbesserung zuerst Wirkung bringt.',
    stats: [
      ['01', 'Lagebild'],
      ['02', 'Reibung'],
      ['03', 'Priorität'],
    ],
    principleTitle: 'Erst verstehen.',
    principleCopy: 'Keine Tool-Empfehlung, bevor der echte Arbeitsweg klar ist.',
  },
  {
    title: 'Digitalisierung wird zu groß.',
    challenge:
      'Neue Systeme werden geplant, aber Zielbild und Anforderungen sind noch unscharf.',
    focus:
      'CX ordnet Prozess, Zielbild und nächste Maßnahmen vor der Umsetzung.',
    change:
      'Die Veränderung wird kleiner, greifbarer und besser planbar.',
    stats: [
      ['01', 'Zielbild'],
      ['02', 'Anforderungen'],
      ['03', 'Maßnahmen'],
    ],
    principleTitle: 'Erst ordnen.',
    principleCopy: 'Digitalisierung soll Abläufe verbessern, nicht Chaos kopieren.',
  },
  {
    title: 'Delivery verliert Richtung.',
    challenge:
      'Backlogs wachsen, Meetings nehmen zu und Fortschritt bleibt schwer lesbar.',
    focus:
      'CX schärft Scope, Prioritäten, Rollen und den Delivery-Takt.',
    change:
      'Umsetzung bekommt wieder Richtung und bessere Entscheidungen.',
    stats: [
      ['01', 'Scope'],
      ['02', 'Rollen'],
      ['03', 'Takt'],
    ],
    principleTitle: 'Erst führen.',
    principleCopy: 'Methoden helfen nur, wenn das Projekt wieder lesbar wird.',
  },
];

function renderPanel(index) {
  const panel = document.getElementById(`outcomes-panel-${index}`);
  const data = caseStudies[index];

  if (!panel || !data) {
    return;
  }

  panel.innerHTML = `
    <div class="outcomes__panel-inner outcomes__panel-inner--simple">
      <div class="outcomes__story">
        <h3 class="outcomes__story-title">${data.title}</h3>
        <p class="outcomes__summary">${data.challenge}</p>
        <p class="outcomes__summary outcomes__summary--emphasis">${data.focus}</p>
      </div>
      <div class="outcomes__aside">
        <div class="outcomes__stats">
          ${data.stats
            .map(
              ([value, copy]) => `
            <div class="outcomes__stat">
              <div class="outcomes__stat-value">${value}</div>
              <div class="outcomes__stat-copy">${copy}</div>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="outcomes__principle">
          <div class="outcomes__principle-label">Prinzip</div>
          <div class="outcomes__principle-title">${data.principleTitle}</div>
          <p class="outcomes__principle-copy">${data.principleCopy}</p>
        </div>
      </div>
    </div>
  `;
}

caseStudies.forEach((_, index) => renderPanel(index));

document.querySelectorAll('.outcomes__tab').forEach((button) => {
  button.addEventListener('click', () => {
    const selectedIndex = Number(button.dataset.panel);

    document.querySelectorAll('.outcomes__tab').forEach((tab) => {
      const isActive = tab === button;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.outcomes__panel').forEach((panel, index) => {
      panel.classList.toggle('is-active', index === selectedIndex);
    });
  });

  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }

    const tabs = Array.from(document.querySelectorAll('.outcomes__tab'));
    const currentIndex = tabs.indexOf(button);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    }

    if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    if (event.key === 'Home') {
      nextIndex = 0;
    }

    if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    event.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  });
});

if (contactForm && formStatus) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    formStatus.textContent =
      'Danke. In dieser lokalen Vorschau wurden keine Daten versendet oder gespeichert.';
  });
}
