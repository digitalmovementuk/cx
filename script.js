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
  const finalCta = document.querySelector('.final-cta');
  const footer = document.querySelector('.footer');
  const state = { pastHero: false, inFinalCta: false, inFooter: false };

  const sync = () => {
    const shouldShow = state.pastHero && !state.inFinalCta && !state.inFooter;
    stickyCta.classList.toggle('is-visible', shouldShow);
    stickyCta.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    stickyCta.toggleAttribute('inert', !shouldShow);
  };

  new IntersectionObserver(
    ([entry]) => { state.pastHero = !entry.isIntersecting; sync(); },
    { threshold: 0.2 }
  ).observe(hero);

  if (finalCta) {
    new IntersectionObserver(
      ([entry]) => { state.inFinalCta = entry.isIntersecting; sync(); },
      { threshold: 0.1 }
    ).observe(finalCta);
  }
  if (footer) {
    new IntersectionObserver(
      ([entry]) => { state.inFooter = entry.isIntersecting; sync(); },
      { threshold: 0.01 }
    ).observe(footer);
  }
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
    title: 'Wenn Anforderungen unscharf bleiben und der Backlog Fahrt verliert.',
    challenge:
      'Stakeholder ziehen in unterschiedliche Richtungen, User Stories sind dünn, Akzeptanzkriterien fehlen und der Product Owner ist überlastet oder unbesetzt.',
    focus:
      'Requirements Engineering und Interim Product Owner Unterstützung schärfen Anforderungen, ordnen Backlog und Priorität und führen die PO-Rolle, bis sie intern wieder tragfähig ist.',
    change:
      'Teams arbeiten an klaren, verhandelten Anforderungen — mit verlässlicher Priorisierung und einem Backlog, der Entscheidungen wirklich stützt.',
    stats: [
      ['Anforderungen', 'verhandelt &amp; klar'],
      ['Backlog', 'priorisiert geführt'],
      ['Product Owner', 'interim oder Coaching'],
    ],
    principleTitle: 'Erst Anforderungen, dann Lösung',
    principleCopy:
      'CX beginnt nicht mit Features, sondern mit dem realen Bedarf. So entstehen Backlogs, die Entscheidungen tragen statt sie zu verschleppen.',
  },
  {
    title: 'Wenn Digitalisierung oder Transformation startet, aber das Zielbild noch unscharf ist.',
    challenge:
      'Neue Systeme, Plattformen oder Operating-Model-Schritte werden diskutiert, während Prozesse, Rollen, Anforderungen und Reihenfolge im Hintergrund noch nicht sauber geordnet sind.',
    focus:
      'Digitalisierungs- und Transformationsberatung verbindet Prozesssicht, Zielbild, Anforderungsklarheit und Maßnahmenlogik, damit Veränderung kleiner und realistischer planbar wird.',
    change:
      'Transformation wird nicht größer und diffuser, sondern greifbarer, geordneter und besser an die reale Organisation anschließbar.',
    stats: [
      ['Prozesse', 'sauber betrachtet'],
      ['Zielbild', 'verhandelt'],
      ['Maßnahmen', 'realistisch geordnet'],
    ],
    principleTitle: 'Nicht schlechte Abläufe digital kopieren',
    principleCopy:
      'Das Ziel ist nicht mehr Technologie um ihrer selbst willen, sondern bessere Abläufe mit einer brauchbaren Umsetzungsreihenfolge.',
  },
  {
    title: 'Wenn Projekte laufen, aber Steuerung, Scope und Lieferpfad schwimmen.',
    challenge:
      'Meetings nehmen zu, Rollen sind unscharf, Risiken werden spät sichtbar und Fortschritt bleibt schwer lesbar, obwohl das Team dauernd beschäftigt ist.',
    focus:
      'Projektmanagement und Delivery-Beratung bringen Struktur in Scope, Steuerung, Entscheidungen und Lieferrhythmus — agil oder klassisch, je nach Vorhaben.',
    change:
      'Umsetzung bekommt wieder Richtung, ein klareres Steuerungsmodell und bessere Voraussetzungen für verlässliche Entscheidungen.',
    stats: [
      ['Scope', 'geschärft'],
      ['Steuerung', 'klarer geführt'],
      ['Delivery', 'wieder lesbar'],
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

document.querySelectorAll('form.form').forEach((f) => {
  if (f === contactForm) return;
  f.addEventListener('submit', (event) => {
    event.preventDefault();
    const st = f.querySelector('.form__status');
    if (st) st.textContent = 'Vorschau-Modus: Es wurden keine Daten übertragen.';
  });
});

if (contactForm && formStatus) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    formStatus.textContent =
      'Danke. In dieser lokalen Vorschau wurden keine Daten versendet oder gespeichert.';
  });
}

/* ============================================================
 * Trust band: duplicate items so the marquee loops seamlessly
 * ========================================================== */
(function setupMarquee() {
  const inner = document.querySelector('.trustband__inner');
  const items = document.querySelector('.trustband__items');
  if (!inner || !items) return;

  // Only marquee on screens where the items would otherwise wrap into a long row
  if (window.matchMedia('(min-width: 700px)').matches) {
    inner.classList.add('has-marquee');
    // Duplicate items for seamless loop
    const clone = items.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    items.parentNode.appendChild(clone);
  }
})();

/* ============================================================
 * Scroll-driven animation FALLBACK for browsers without
 * native CSS scroll-timeline (Safari today). Uses
 * IntersectionObserver + transform/opacity directly.
 * ========================================================== */
(function scrollMotionFallback() {
  if (CSS.supports && CSS.supports('animation-timeline: view()')) {
    return; // Native handles it
  }
  if (prefersReducedMotion.matches) return;

  // Hero parallax: subtle scale on video as user scrolls past hero
  const heroVideoShell = document.querySelector('.hero__video-shell');
  const heroCopy = document.querySelector('.hero__copy');
  const heroFormWrap = document.querySelector('.hero__form-wrap');

  function updateHeroParallax() {
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const heroH = hero.offsetHeight;
    const progress = Math.min(Math.max(-rect.top / heroH, 0), 1);
    if (heroVideoShell) {
      heroVideoShell.style.transform = `scale(${1 + progress * 0.12}) translateY(${-progress * 8}%)`;
    }
    if (heroCopy) {
      heroCopy.style.opacity = String(1 - progress * 0.95);
      heroCopy.style.transform = `translateY(${-progress * 60}px)`;
    }
    if (heroFormWrap) {
      heroFormWrap.style.opacity = String(1 - progress * 0.9);
      heroFormWrap.style.transform = `translateY(${-progress * 40}px) scale(${1 - progress * 0.04})`;
    }
  }
  window.addEventListener('scroll', updateHeroParallax, { passive: true });
  updateHeroParallax();

  // Capability cards: scrub scale-down on scroll past
  const capCards = Array.from(document.querySelectorAll('.cap-card'));
  function updateCapCards() {
    capCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const vh = window.innerHeight;
      // Once card top is near viewport top, start scaling down
      const exitProgress = Math.min(Math.max(-(rect.top - vh * 0.3) / (vh * 0.5), 0), 1);
      card.style.transformOrigin = '50% 100%';
      card.style.transform = `scale(${1 - exitProgress * 0.025}) translateY(${-exitProgress * 10}px)`;
      card.style.opacity = String(1 - exitProgress * 0.5);
      // Image scrub-in
      const video = card.querySelector('.cap-card__video');
      if (video) {
        const enterProgress = Math.min(Math.max(1 - rect.top / vh, 0), 1);
        video.style.transform = `scale(${1.18 - enterProgress * 0.18})`;
      }
    });
  }
  window.addEventListener('scroll', updateCapCards, { passive: true });
  updateCapCards();

  // Generic IntersectionObserver-based reveal for sections
  const revealClasses = ['.h-section', '.h-lead', '.journey-step', '.benefit', '.faq-item', '.final-cta__headline', '.outcomes__panel-inner', '.footer__brand-wrap', '.footer__col'];
  const fallbackObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-in');
          fallbackObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  revealClasses.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.classList.add('motion-pending');
      fallbackObserver.observe(el);
    });
  });

  // Final CTA glyph rotation on enter
  const finalGlyph = document.querySelector('.final-cta__headline-glyph');
  const finalSection = document.querySelector('.final-cta');
  if (finalGlyph && finalSection) {
    const glyphObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          finalGlyph.style.animation = 'acn-headline-V 900ms var(--acn-ease-hero-2) 200ms backwards';
          glyphObserver.unobserve(finalSection);
        }
      },
      { threshold: 0.25 }
    );
    glyphObserver.observe(finalSection);
  }
})();

/* ==========================================================================
   Wide hamburger services drawer (homepage)
   ========================================================================== */
(function () {
  const btn = document.getElementById('cxMenuToggle');
  const drawer = document.getElementById('cxServicesDrawer');
  const scrim = document.getElementById('cxDrawerScrim');
  if (!btn || !drawer || !scrim) return;
  function open() {
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Leistungen-Menü schließen');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    scrim.classList.add('is-open');
    scrim.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
  }
  function close() {
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Leistungen-Menü öffnen');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('is-open');
    scrim.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }
  btn.addEventListener('click', () => {
    if (btn.getAttribute('aria-expanded') === 'true') close(); else open();
  });
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  drawer.querySelectorAll('.cx-drawer__link, .cx-drawer__cta').forEach(a => {
    a.addEventListener('click', () => setTimeout(close, 0));
  });
})();
