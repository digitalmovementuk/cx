#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const outputPath = path.join(root, 'qa', 'static-site-final.json');
const baseUrl = new URL(process.env.CEX_STATIC_QA_BASE_URL || 'http://127.0.0.1:9410/');
const cdpUrl = process.env.CEX_QA_CDP_URL || 'http://127.0.0.1:9222';
const dependencyRoot = process.env.CEX_QA_NODE_ROOT || '/Users/raoulito/digital-movement-uk/Sales/roofing-seo-os/package.json';
const axePath = process.env.CEX_QA_AXE_PATH || '/Users/raoulito/digital-movement-uk/Sales/roofing-seo-os/node_modules/axe-core/axe.min.js';
const requireFromQaRoot = createRequire(dependencyRoot);
const { chromium } = requireFromQaRoot('playwright');

const imageManifest = JSON.parse(fs.readFileSync(path.join(root, 'image-manifest.json'), 'utf8'));
const publicRoutes = [
  ...imageManifest.images.map(image => new URL(image.page).pathname),
  '/impressum.html',
  '/datenschutz.html',
  '/sitemap/',
];
const routes = [...new Set(publicRoutes)];
const mainRoutes = new Set(imageManifest.images.map(image => new URL(image.page).pathname));
const viewports = [
  { name: 'desktop', width: 1366, height: 768, isMobile: false },
  { name: 'mobile', width: 360, height: 740, isMobile: true },
];
const axeAvailable = fs.existsSync(axePath);
const axeSource = axeAvailable ? fs.readFileSync(axePath, 'utf8') : '';
const canonicalHosts = new Set(['cex.koeln', 'www.cex.koeln', baseUrl.hostname]);
const assetExtension = /\.(?:avif|bmp|css|eot|gif|ico|jpe?g|js|json|map|mp3|mp4|ogg|otf|pdf|png|svg|ttf|webm|webp|woff2?)(?:$|\/)/i;

if (routes.length !== 36) {
  throw new Error(`Expected 36 public routes, found ${routes.length}`);
}

function routeUrl(route) {
  return new URL(route.replace(/^\//, ''), baseUrl).href;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function smallError(error) {
  return String(error?.message || error || 'unknown error').replace(/\s+/g, ' ').trim().slice(0, 600);
}

function decodeHtml(value) {
  const named = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: '\u00a0', quot: '"' };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1]?.toLowerCase() === 'x';
      const codePoint = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      try { return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match; }
      catch { return match; }
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function fragmentNamesIn(html) {
  const names = new Set();
  for (const match of html.matchAll(/\b(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    names.add(decodeHtml(match[1] ?? match[2] ?? ''));
  }
  return names;
}

function localTarget(rawHref, sourceUrl) {
  if (!rawHref || /^(?:mailto|tel|javascript|data):/i.test(rawHref)) return null;
  let resolved;
  try { resolved = new URL(rawHref, sourceUrl); }
  catch { return null; }
  if (!/^https?:$/.test(resolved.protocol) || !canonicalHosts.has(resolved.hostname)) return null;
  if (assetExtension.test(resolved.pathname)) return null;
  const localUrl = new URL(`${resolved.pathname}${resolved.search}`, baseUrl);
  localUrl.hash = '';
  return {
    rawHref,
    requestUrl: localUrl.href,
    destination: `${resolved.pathname}${resolved.search}${resolved.hash}`,
    fragment: resolved.hash ? decodeURIComponent(resolved.hash.slice(1)) : '',
  };
}

function localAsset(rawUrl, sourceUrl) {
  if (!rawUrl) return null;
  let resolved;
  try { resolved = new URL(rawUrl, sourceUrl); }
  catch { return null; }
  if (!/^https?:$/.test(resolved.protocol) || !canonicalHosts.has(resolved.hostname)) return null;
  return new URL(`${resolved.pathname}${resolved.search}`, baseUrl).href;
}

const browser = await chromium.connectOverCDP(cdpUrl);
const results = [];
const renderedLinks = [];
const renderedAssets = [];

async function auditRoute(route, routeIndex) {
    await Promise.all(viewports.map(async viewport => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      });
      await context.addInitScript(() => {
        try {
          localStorage.setItem('cxPrivacyConsent.v1', JSON.stringify({ version: 1, categories: { necessary: true, preferences: false, statistics: false, marketing: false } }));
          localStorage.setItem('cex_consent_v1', JSON.stringify({ statistics: false, marketing: false, v: 1 }));
        } catch (_) {}
      });
      const page = await context.newPage();
      const consoleErrors = [];
      const requestFailures = [];
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', error => consoleErrors.push(`pageerror: ${smallError(error)}`));
      page.on('requestfailed', request => {
        const reason = request.failure()?.errorText || 'failed';
        if (!(/\.mp4(?:\?|$)/i.test(request.url()) && /ERR_ABORTED/i.test(reason))) {
          requestFailures.push(`${request.url()} :: ${reason}`);
        }
      });

      const failures = [];
      let status = 0;
      let dom = null;
      let axe = { status: axeAvailable ? 'not-run' : 'unavailable', violations: [] };
      try {
        const response = await page.goto(routeUrl(route), { waitUntil: 'domcontentloaded', timeout: 60_000 });
        status = response?.status() || 0;
        await page.addStyleTag({ content: `
          html{scroll-behavior:auto!important}
          *,*::before,*::after{animation:none!important;transition:none!important}
          .reveal,[class*="reveal"],.motion-pending{opacity:1!important;transform:none!important;visibility:visible!important}
        ` });
        await page.evaluate(async () => {
          const step = Math.max(520, Math.round(innerHeight * 0.78));
          for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            scrollTo(0, y);
            await new Promise(resolve => setTimeout(resolve, 18));
          }
          scrollTo(0, 0);
          if (document.fonts?.ready) await document.fonts.ready;
        });
        await page.waitForTimeout(180);

        dom = await page.evaluate(({ viewportName, requiresFounderSchema }) => {
          const visible = element => {
            if (!element) return false;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
          };
          const identify = element => {
            if (!element) return '';
            if (element.id) return `#${element.id}`;
            const classes = [...element.classList].slice(0, 3).join('.');
            return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`;
          };
          const rectInfo = element => {
            const rect = element.getBoundingClientRect();
            return { selector: identify(element), left: Math.round(rect.left), right: Math.round(rect.right), top: Math.round(rect.top), bottom: Math.round(rect.bottom), width: Math.round(rect.width), height: Math.round(rect.height) };
          };
          const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
          const allH1 = [...document.querySelectorAll('h1')];
          const visibleH1 = allH1.filter(visible);
          const hero = document.querySelector('.hero,.legal-hero,.sm-hero,[data-bench-role="hero"]');
          const heroRect = hero && visible(hero) ? hero.getBoundingClientRect() : null;
          const heroTextCandidates = hero ? [...hero.querySelectorAll('h1,.hero__eyebrow,.legal-hero__eyebrow,.sm-hero__eyebrow,.hero__lead,.legal-hero__lead,.sm-hero__lead,.hero__cta-group,.hero__cta-row')] : [];
          const heroCenterFailures = viewportName === 'mobile' ? heroTextCandidates.filter(visible).filter(element => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            const centerDelta = Math.abs(rect.left + rect.width / 2 - innerWidth / 2);
            const isText = /^(H1|P)$/.test(element.tagName) || /eyebrow|lead/.test(element.className || '');
            return centerDelta > 18 || (isText && style.textAlign !== 'center');
          }).map(element => ({ ...rectInfo(element), textAlign: getComputedStyle(element).textAlign })) : [];

          const mobileControls = viewportName === 'mobile' ? [...document.querySelectorAll('button,input:not([type="hidden"]),select,textarea,[role="button"],.btn,.hero__cta')].filter(visible) : [];
          const effectiveTargets = [...new Set(mobileControls.map(element => {
            if (element.matches('input[type="checkbox"],input[type="radio"]')) {
              const label = element.closest('label') || (element.id ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`) : null);
              if (label && visible(label)) return label;
            }
            return element;
          }))];
          const shortControls = effectiveTargets.filter(element => {
            const rect = element.getBoundingClientRect();
            return rect.height < 44 || rect.width < 44;
          }).map(rectInfo);
          const desktopNav = document.querySelector('header .nav__links') || document.querySelector('header nav');
          const footer = document.querySelector('footer');
          const footerAfter = footer ? [...document.body.children].filter(element => {
            if (element === footer || !visible(element)) return false;
            if (!(footer.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)) return false;
            const style = getComputedStyle(element);
            return !['fixed', 'absolute'].includes(style.position) && !['SCRIPT', 'STYLE', 'TEMPLATE', 'DIALOG'].includes(element.tagName);
          }).map(identify) : [];

          const overflowElements = [...document.body.querySelectorAll('*')].filter(visible).filter(element => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            if (style.position === 'fixed' && rect.width >= innerWidth - 2) return false;
            return rect.left < -2 || rect.right > innerWidth + 2;
          }).slice(0, 20).map(rectInfo);
          const brokenImages = [...document.images].filter(image => image.getAttribute('src') && (!image.complete || image.naturalWidth === 0)).map(image => image.currentSrc || image.src);
          const tables = [...document.querySelectorAll('table')].filter(visible).filter(table => {
            const rect = table.getBoundingClientRect();
            return rect.left < -2 || rect.right > innerWidth + 2 || table.scrollWidth > table.clientWidth + 2;
          }).map(rectInfo);
          const cards = [...document.querySelectorAll('.service-card,.problem-card,.use-card,.industry-card,.diff-item,.method-step,.benefit,.faq-item,.proof-item,.cap-card__body,[class$="-card"]')].filter(visible);
          const crampedCards = viewportName === 'desktop' ? cards.filter(card => {
            const rect = card.getBoundingClientRect();
            return rect.width < 250 && (card.innerText || '').replace(/\s+/g, ' ').trim().length > 120;
          }).slice(0, 20).map(rectInfo) : [];
          const bylines = [...document.querySelectorAll('body *')].filter(element => element.children.length === 0 && visible(element)).filter(element => /^(written by|reviewed on|geschrieben von|autor(?:in)?\b)/i.test((element.textContent || '').trim())).map(element => (element.textContent || '').trim()).slice(0, 10);

          const internalTerms = [
            /\bHUMAN INSERT\b/i,
            /\bcommercially relevant\b/i,
            /\btarget region\b/i,
            /\baddressed here\b/i,
            /\bSEO page\b/i,
            /\bsearch term page\b/i,
            /\blanding page\b/i,
            /\bpresentation marker\b/i,
            /\branking relevance\b/i,
            /\bsearch intent\b/i,
            /\bkeyword(?:s)?\b/i,
            /\bSEO-Seite\b/i,
            /\bSuchbegriff-Seite\b/i,
            /\bPräsentationsmarker\b/i,
            /\bRanking-Relevanz\b/i,
            /\bSuchintention\b/i,
            /\bZielregion\b/i,
          ];
          const internalWording = internalTerms.filter(pattern => pattern.test(bodyText)).map(pattern => pattern.source);
          const scriptAndStyleRefs = [...document.querySelectorAll('script[src],link[href]')].map(element => element.src || element.href || '');
          const overviewRefs = scriptAndStyleRefs.filter(value => /overview-widget|overview-data/i.test(value));
          const cookieAssetRefs = scriptAndStyleRefs.filter(value => /cookie-consent\.js/i.test(value));
          const polishLinks = [...document.querySelectorAll('link[rel="stylesheet"]')].map(link => link.href).filter(value => /polish\.css/i.test(value));
          const selfHostedPreloads = [...document.querySelectorAll('link[rel="preload"][as="font"]')].map(link => link.href).filter(value => /\/fonts\/.*\.woff2(?:\?|$)/i.test(value));
          const externalFontLinks = scriptAndStyleRefs.filter(value => /fonts\.(?:googleapis|gstatic)\.com/i.test(value));
          const faviconLinks = [...document.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"]')].map(link => link.href).filter(Boolean);
          const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
          const ogWidth = document.querySelector('meta[property="og:image:width"]')?.content || '';
          const ogHeight = document.querySelector('meta[property="og:image:height"]')?.content || '';
          const ogAlt = document.querySelector('meta[property="og:image:alt"]')?.content || '';
          const twitterImage = document.querySelector('meta[name="twitter:image"]')?.content || '';
          const twitterImageAlt = document.querySelector('meta[name="twitter:image:alt"]')?.content || '';
          const jsonLdErrors = [];
          const personSchemas = [];
          const walkSchema = value => {
            if (Array.isArray(value)) {
              value.forEach(walkSchema);
              return;
            }
            if (!value || typeof value !== 'object') return;
            const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
            if (types.includes('Person')) {
              personSchemas.push({
                name: value.name || '',
                jobTitle: value.jobTitle || '',
                worksForType: value.worksFor?.['@type'] || '',
                worksForName: value.worksFor?.name || '',
              });
            }
            Object.values(value).forEach(walkSchema);
          };
          [...document.querySelectorAll('script[type="application/ld+json"]')].forEach((script, index) => {
            try { walkSchema(JSON.parse(script.textContent || '')); }
            catch (error) { jsonLdErrors.push({ index, error: String(error.message || error).slice(0, 240) }); }
          });
          const invalidFounderSchemas = personSchemas.filter(person => (
            person.jobTitle !== 'Gründer'
            || person.worksForType !== 'Organization'
            || person.worksForName !== 'CEx'
          ));

          return {
            title: document.title,
            h1Count: allH1.length,
            visibleH1Count: visibleH1.length,
            hasMain: Boolean(document.querySelector('main#main')),
            horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            overflowElements,
            brokenImages,
            heroExists: Boolean(heroRect),
            heroFitsViewport: !heroRect || heroRect.bottom <= innerHeight + 12,
            heroCoreFitsViewport: !visibleH1[0] || visibleH1[0].getBoundingClientRect().bottom <= innerHeight,
            heroCenterFailures,
            shortControls,
            desktopNavVisible: viewportName !== 'desktop' || visible(desktopNav),
            footerExists: Boolean(footer && visible(footer)),
            footerAfter,
            tables,
            crampedCards,
            bylines,
            bodyFont: getComputedStyle(document.body).fontFamily,
            polishLinks,
            selfHostedPreloads,
            externalFontLinks,
            fontStatus: document.fonts?.status || 'unsupported',
            ogImage,
            ogWidth,
            ogHeight,
            ogAlt,
            twitterImage,
            twitterImageAlt,
            faviconLinks,
            jsonLdErrors,
            personSchemas,
            invalidFounderSchemas,
            requiresFounderSchema,
            overviewRefs,
            cookieAssetRefs,
            internalWording,
            anchors: [...document.querySelectorAll('a[href],area[href]')].map(anchor => anchor.getAttribute('href')).filter(Boolean),
          };
        }, { viewportName: viewport.name, requiresFounderSchema: mainRoutes.has(route) });

        if (viewport.name === 'desktop') {
          for (const href of dom.anchors) renderedLinks.push({ route, sourceUrl: routeUrl(route), href });
          for (const value of [dom.ogImage, dom.twitterImage, ...dom.faviconLinks]) {
            renderedAssets.push({ route, sourceUrl: routeUrl(route), value });
          }
        }

        if (axeAvailable) {
          try {
            await page.addScriptTag({ content: axeSource });
            const violations = await page.evaluate(async () => {
              const report = await window.axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
                resultTypes: ['violations'],
              });
              return report.violations.map(violation => ({
                id: violation.id,
                impact: violation.impact,
                help: violation.help,
                nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })),
              }));
            });
            axe = { status: 'ran', violations };
          } catch (error) {
            axe = { status: 'error', error: smallError(error), violations: [] };
          }
        }
      } catch (error) {
        failures.push({ check: 'navigation-or-evaluation', detail: smallError(error) });
      }

      if (status !== 200) failures.push({ check: 'http', detail: `HTTP ${status}` });
      if (dom) {
        if (dom.horizontalOverflow > 1) failures.push({ check: 'horizontal-overflow', detail: { pixels: dom.horizontalOverflow, elements: dom.overflowElements } });
        if (dom.h1Count !== 1 || dom.visibleH1Count !== 1) failures.push({ check: 'h1', detail: { total: dom.h1Count, visible: dom.visibleH1Count } });
        if (dom.brokenImages.length) failures.push({ check: 'broken-images', detail: dom.brokenImages });
        if (!dom.hasMain) failures.push({ check: 'main#main', detail: 'missing' });
        if (!dom.heroFitsViewport || !dom.heroCoreFitsViewport) failures.push({ check: 'hero-fit', detail: { hero: dom.heroFitsViewport, core: dom.heroCoreFitsViewport } });
        if (dom.heroCenterFailures.length) failures.push({ check: 'hero-centering', detail: dom.heroCenterFailures });
        if (dom.shortControls.length) failures.push({ check: 'mobile-control-44px', detail: dom.shortControls });
        if (!dom.desktopNavVisible) failures.push({ check: 'desktop-nav', detail: 'not visible' });
        if (!dom.footerExists || dom.footerAfter.length) failures.push({ check: 'footer-last', detail: { exists: dom.footerExists, visibleFlowAfter: dom.footerAfter } });
        if (dom.tables.length) failures.push({ check: 'table-overflow', detail: dom.tables });
        if (dom.crampedCards.length) failures.push({ check: 'cramped-cards', detail: dom.crampedCards });
        if (dom.bylines.length) failures.push({ check: 'byline', detail: dom.bylines });
        if (!/\bInter\b/i.test(dom.bodyFont) || !dom.polishLinks.length || !dom.selfHostedPreloads.length || dom.externalFontLinks.length || dom.fontStatus !== 'loaded') {
          failures.push({ check: 'polish-self-hosted-font', detail: { bodyFont: dom.bodyFont, polishLinks: dom.polishLinks, selfHostedPreloads: dom.selfHostedPreloads, externalFontLinks: dom.externalFontLinks, fontStatus: dom.fontStatus } });
        }
        if (!dom.ogImage || !dom.ogWidth || !dom.ogHeight || !dom.ogAlt || !dom.twitterImage || !dom.twitterImageAlt || dom.twitterImageAlt !== dom.ogAlt || !dom.faviconLinks.length) {
          failures.push({ check: 'share-meta-favicon', detail: { ogImage: dom.ogImage, ogWidth: dom.ogWidth, ogHeight: dom.ogHeight, ogAlt: dom.ogAlt, twitterImage: dom.twitterImage, twitterImageAlt: dom.twitterImageAlt, faviconLinks: dom.faviconLinks } });
        }
        if (dom.jsonLdErrors.length || (dom.requiresFounderSchema && !dom.personSchemas.length) || dom.invalidFounderSchemas.length) {
          failures.push({ check: 'founder-schema', detail: { jsonLdErrors: dom.jsonLdErrors, requiresFounderSchema: dom.requiresFounderSchema, personSchemas: dom.personSchemas, invalidFounderSchemas: dom.invalidFounderSchemas } });
        }
        if (dom.overviewRefs.length || dom.cookieAssetRefs.length || dom.internalWording.length) {
          failures.push({ check: 'public-copy-assets', detail: { overviewRefs: dom.overviewRefs, cookieAssetRefs: dom.cookieAssetRefs, internalWording: dom.internalWording } });
        }
      }
      if (consoleErrors.length) failures.push({ check: 'console-errors', detail: uniq(consoleErrors) });
      if (requestFailures.length) failures.push({ check: 'failed-requests', detail: uniq(requestFailures) });
      if (axe.status !== 'ran') failures.push({ check: 'axe-run', detail: axe.error || axe.status });
      if (axe.violations.length) failures.push({ check: 'axe-violations', detail: axe.violations });

      results.push({
        route,
        viewport: viewport.name,
        size: `${viewport.width}x${viewport.height}`,
        status,
        passed: failures.length === 0,
        failures,
        axeViolationRules: axe.violations.map(violation => violation.id),
      });
      await context.close();
    }));
    if ((routeIndex + 1) % 6 === 0 || routeIndex === routes.length - 1) {
      console.log(`browser+axe ${routeIndex + 1}/${routes.length}`);
    }
}

try {
  const concurrency = Math.max(1, Math.min(Number(process.env.CEX_QA_CONCURRENCY || 3), routes.length));
  let cursor = 0;
  async function worker() {
    while (cursor < routes.length) {
      const routeIndex = cursor;
      cursor += 1;
      await auditRoute(routes[routeIndex], routeIndex);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
} finally {
  await browser.close();
}

const responseCache = new Map();
async function fetchPage(url) {
  if (!responseCache.has(url)) {
    responseCache.set(url, (async () => {
      try {
        const response = await fetch(url, {
          redirect: 'follow',
          headers: { 'user-agent': 'CEx-static-final-QA/1.0' },
          signal: AbortSignal.timeout(20_000),
        });
        return { status: response.status, ok: response.status === 200, url: response.url, body: await response.text(), error: null };
      } catch (error) {
        return { status: 0, ok: false, url, body: '', error: smallError(error) };
      }
    })());
  }
  return responseCache.get(url);
}

const linkOccurrences = renderedLinks.map(link => ({ ...link, target: localTarget(link.href, link.sourceUrl) })).filter(link => link.target);
await Promise.all([...new Set(linkOccurrences.map(link => link.target.requestUrl))].map(fetchPage));
const fragmentCache = new Map();
const linkFailures = [];
for (const link of linkOccurrences) {
  const response = await fetchPage(link.target.requestUrl);
  if (!response.ok) {
    linkFailures.push({ type: 'http', sourceRoute: link.route, href: link.href, destination: link.target.destination, status: response.status, error: response.error });
    continue;
  }
  if (link.target.fragment) {
    if (!fragmentCache.has(link.target.requestUrl)) fragmentCache.set(link.target.requestUrl, fragmentNamesIn(response.body));
    if (!fragmentCache.get(link.target.requestUrl).has(link.target.fragment)) {
      linkFailures.push({ type: 'fragment', sourceRoute: link.route, href: link.href, destination: link.target.destination, fragment: link.target.fragment, status: response.status });
    }
  }
}
const dedupedLinkFailures = [...new Map(linkFailures.map(failure => [[failure.type, failure.sourceRoute, failure.destination, failure.fragment || ''].join('|'), failure])).values()];

const assetOccurrences = renderedAssets.map(asset => ({ ...asset, requestUrl: localAsset(asset.value, asset.sourceUrl) })).filter(asset => asset.requestUrl);
await Promise.all([...new Set(assetOccurrences.map(asset => asset.requestUrl))].map(fetchPage));
const assetFailures = [];
for (const asset of assetOccurrences) {
  const response = await fetchPage(asset.requestUrl);
  if (!response.ok) assetFailures.push({ route: asset.route, asset: asset.value, requestUrl: asset.requestUrl, status: response.status, error: response.error });
}
const dedupedAssetFailures = [...new Map(assetFailures.map(failure => [[failure.route, failure.requestUrl].join('|'), failure])).values()];
for (const failure of dedupedAssetFailures) {
  const result = results.find(item => item.route === failure.route && item.viewport === 'desktop');
  if (!result) continue;
  result.failures.push({ check: 'share-asset-http', detail: failure });
  result.passed = false;
}

const failedRenders = results.filter(result => !result.passed);
const checkFailureCounts = {};
for (const result of failedRenders) {
  for (const failure of result.failures) checkFailureCounts[failure.check] = (checkFailureCounts[failure.check] || 0) + 1;
}
const axeRendersRan = results.filter(result => !result.failures.some(failure => failure.check === 'axe-run')).length;
const axeFailingRenders = results.filter(result => result.axeViolationRules.length).length;
const linkSummary = {
  sourceRoutes: routes.length,
  internalLinkOccurrences: linkOccurrences.length,
  uniqueTargets: new Set(linkOccurrences.map(link => `${link.target.requestUrl}#${link.target.fragment}`)).size,
  fragmentTargetsChecked: new Set(linkOccurrences.filter(link => link.target.fragment).map(link => `${link.target.requestUrl}#${link.target.fragment}`)).size,
  passed: dedupedLinkFailures.length === 0,
  failureCount: dedupedLinkFailures.length,
};
const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl: baseUrl.href,
  routeCount: routes.length,
  viewportCount: viewports.length,
  expectedRenders: routes.length * viewports.length,
  completedRenders: results.length,
  passedRenders: results.length - failedRenders.length,
  failedRenders: failedRenders.length,
  checkFailureCounts,
  axe: {
    available: axeAvailable,
    expectedRenders: routes.length * viewports.length,
    rendersRan: axeRendersRan,
    skippedOrErroredRenders: results.length - axeRendersRan,
    failingRenders: axeFailingRenders,
    violationRules: uniq(results.flatMap(result => result.axeViolationRules)).sort(),
  },
  internalLinks: linkSummary,
  shareAssets: {
    occurrences: assetOccurrences.length,
    uniqueRequests: new Set(assetOccurrences.map(asset => asset.requestUrl)).size,
    failures: dedupedAssetFailures.length,
    passed: dedupedAssetFailures.length === 0,
  },
};
summary.passed = summary.completedRenders === summary.expectedRenders
  && summary.failedRenders === 0
  && summary.axe.rendersRan === summary.axe.expectedRenders
  && summary.axe.failingRenders === 0
  && linkSummary.passed
  && summary.shareAssets.passed;

const report = {
  summary,
  routes,
  failures: failedRenders.map(result => ({ route: result.route, viewport: result.viewport, size: result.size, status: result.status, failures: result.failures })),
  internalLinkFailures: dedupedLinkFailures,
  shareAssetFailures: dedupedAssetFailures,
};
const browserFailures = results.map(result => ({
  route: result.route,
  viewport: result.viewport,
  size: result.size,
  status: result.status,
  failures: result.failures.filter(failure => !['axe-run', 'axe-violations'].includes(failure.check)),
})).filter(result => result.failures.length);
const accessibilityFailures = results.map(result => ({
  route: result.route,
  viewport: result.viewport,
  size: result.size,
  failures: result.failures.filter(failure => ['axe-run', 'axe-violations'].includes(failure.check)),
})).filter(result => result.failures.length);
const browserReport = {
  summary: {
    generatedAt: summary.generatedAt,
    baseUrl: summary.baseUrl,
    routeCount: summary.routeCount,
    expectedRenders: summary.expectedRenders,
    completedRenders: summary.completedRenders,
    failedRenders: browserFailures.length,
    checkFailureCounts: Object.fromEntries(Object.entries(checkFailureCounts).filter(([check]) => !['axe-run', 'axe-violations'].includes(check))),
    shareAssets: summary.shareAssets,
    passed: summary.completedRenders === summary.expectedRenders && browserFailures.length === 0 && summary.shareAssets.passed,
  },
  failures: browserFailures,
};
const accessibilityReport = {
  summary: { ...summary.axe, passed: summary.axe.rendersRan === summary.axe.expectedRenders && summary.axe.failingRenders === 0 },
  failures: accessibilityFailures,
};
const internalLinkReport = { summary: linkSummary, failures: dedupedLinkFailures };
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'qa', 'static-browser-qa.json'), `${JSON.stringify(browserReport, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'qa', 'static-accessibility.json'), `${JSON.stringify(accessibilityReport, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'qa', 'static-internal-links.json'), `${JSON.stringify(internalLinkReport, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (!summary.passed) process.exitCode = 1;
