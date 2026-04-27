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
    title: 'Wenn Arbeit ständig stockt, obwohl alle beschäftigt sind.',
    challenge:
      'Übergaben verlieren Qualität, Rückfragen häufen sich, Wartezeiten ziehen sich und niemand sieht klar, an welcher Stelle die größte Reibung wirklich sitzt.',
    focus:
      'Prozessoptimierung Beratung macht reale Abläufe sichtbar, priorisiert die größten Bremsen und übersetzt diffuse Alltagsprobleme in ein klares Ist-/Soll-Bild.',
    change:
      'Teams verstehen, wo Verbesserung zuerst Wirkung bringt und auf welchem Fundament spätere Digitalisierung überhaupt sinnvoll wird.',
    stats: [
      ['Abläufe', 'Ist-/Soll-Bild'],
      ['Reibung', 'sichtbar priorisiert'],
      ['Grundlage', 'für weitere Veränderung'],
    ],
    principleTitle: 'Erst verstehen, dann verbessern',
    principleCopy:
      'CX beginnt nicht mit Tool-Empfehlungen, sondern mit dem echten Arbeitsweg. So wird nicht am Symptom gearbeitet.',
  },
  {
    title: 'Wenn Digitalisierung startet, aber Prozess und Zielbild noch unscharf sind.',
    challenge:
      'Neue Systeme oder Funktionen werden diskutiert, während Rollen, Übergaben, Anforderungen und Prioritäten im Hintergrund noch nicht sauber geordnet sind.',
    focus:
      'Digitalisierungsberatung verbindet Prozesssicht, Zielbild, Anforderungsklarheit und Maßnahmenlogik, damit Veränderung kleiner und realistischer planbar wird.',
    change:
      'Digitalisierung wird nicht größer und diffuser, sondern greifbarer, geordneter und besser an die reale Organisation anschließbar.',
    stats: [
      ['Prozesse', 'sauber betrachtet'],
      ['Anforderungen', 'geordnet'],
      ['Maßnahmen', 'realistisch priorisiert'],
    ],
    principleTitle: 'Nicht schlechte Abläufe digital kopieren',
    principleCopy:
      'Das Ziel ist nicht mehr Technologie um ihrer selbst willen, sondern bessere Abläufe mit einer brauchbaren Umsetzungsreihenfolge.',
  },
  {
    title: 'Wenn Delivery läuft, aber Prioritäten, Scope und Steuerung schwimmen.',
    challenge:
      'Backlogs wachsen, Meetings nehmen zu, Rollen sind unscharf und Fortschritt bleibt schwer lesbar, obwohl das Team dauernd beschäftigt ist.',
    focus:
      'Projektmanagement Beratung, Requirements Engineering und Interim Product Owner Unterstützung bringen Struktur in Scope, Priorisierung, Entscheidungen und Delivery-Takt.',
    change:
      'Umsetzung bekommt wieder Richtung, ein klareres Steuerungsmodell und bessere Voraussetzungen für verlässliche Entscheidungen.',
    stats: [
      ['Scope', 'geschärft'],
      ['Priorität', 'klarer geführt'],
      ['Delivery', 'wieder steuerbarer'],
    ],
    principleTitle: 'Weniger Methodenlärm, mehr Führungslogik',
    principleCopy:
      'CX nutzt agile oder klassische Elemente nur dann, wenn sie helfen. Entscheidend ist, dass das Projekt wieder lesbar und steuerbar wird.',
  },
];

function renderPanel(index) {
  const panel = document.getElementById(`outcomes-panel-${index}`);
  const data = caseStudies[index];

  if (!panel || !data) {
    return;
  }

  panel.innerHTML = `
    <div class="outcomes__panel-inner">
      <div class="outcomes__story">
        <h3 class="outcomes__story-title">${data.title}</h3>
        <div class="outcomes__blocks">
          <div class="outcomes__block">
            <div class="outcomes__block-label">Ausgangslage</div>
            <p class="outcomes__block-copy">${data.challenge}</p>
          </div>
          <div class="outcomes__block">
            <div class="outcomes__block-label">Arbeitsfokus</div>
            <p class="outcomes__block-copy">${data.focus}</p>
          </div>
          <div class="outcomes__block">
            <div class="outcomes__block-label">Was besser wird</div>
            <p class="outcomes__block-copy outcomes__block-copy--emphasis">${data.change}</p>
          </div>
        </div>
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
