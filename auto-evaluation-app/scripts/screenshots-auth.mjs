#!/usr/bin/env node
// Capture des screenshots des écrans authentifiés (prof + élève).
//
// Pré-requis :
//   npm install --no-save puppeteer-core
//
// Usage :
//   SCREENSHOT_EMAIL=prof@example.com \
//   SCREENSHOT_PASSWORD=motdepasse \
//   node scripts/screenshots-auth.mjs [base_url] [out_dir]
//
// Note: on navigue via les clics in-app (SPA) plutôt que page.goto pour éviter
// que l'auth doive ré-hydrater à chaque navigation.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

const BASE_URL = process.argv[2] || 'http://localhost:3939';
const OUT_DIR  = path.resolve(process.argv[3] || 'screenshots');
const EMAIL    = process.env.SCREENSHOT_EMAIL;
const PASSWORD = process.env.SCREENSHOT_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('❌ SCREENSHOT_EMAIL et SCREENSHOT_PASSWORD doivent être définis.');
  process.exit(1);
}

let puppeteer;
try {
  puppeteer = (await import('puppeteer-core')).default;
} catch {
  console.error('❌ puppeteer-core manquant. Installe-le avec :');
  console.error('   npm install --no-save puppeteer-core');
  process.exit(1);
}

function findChrome() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  for (const c of candidates) {
    try {
      if (spawnSync(c, ['--version'], { stdio: 'ignore' }).status === 0) return c;
    } catch {}
  }
  throw new Error('Aucun Chrome/Chromium trouvé.');
}

await fs.mkdir(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
  args: ['--no-sandbox', '--hide-scrollbars'],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shoot(page, name) {
  // Wait for the page content to be rendered (not the global Spinner shown
  // while CompetencesContext is still loading data).
  await page.waitForSelector('.page-head, .empty', { timeout: 15000 }).catch(() => {});
  await sleep(400);
  const out = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`📸 ${name} → ${out}`);
}

// Click a sidebar item by its visible label (Classes / Compétences / Formulaires).
async function clickSidebar(page, label) {
  const clicked = await page.evaluate((label) => {
    const items = Array.from(document.querySelectorAll('.sidebar .nav-item'));
    const target = items.find((el) => el.textContent && el.textContent.includes(label));
    if (!target) return false;
    target.click();
    return true;
  }, label);
  if (!clicked) throw new Error(`Sidebar item "${label}" introuvable`);
  await sleep(1500);
}

// Click any element matching a text predicate (button, link, card title etc).
async function clickByText(page, selector, text) {
  const clicked = await page.evaluate((sel, t) => {
    const items = Array.from(document.querySelectorAll(sel));
    const target = items.find((el) => (el.textContent || '').includes(t));
    if (!target) return false;
    target.click();
    return true;
  }, selector, text);
  if (!clicked) console.log(`ℹ "${text}" introuvable (${selector})`);
  return clicked;
}

try {
  const page = await browser.newPage();

  // --- Login --------------------------------------------------------------
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForFunction(
    () => /\/(teacher|student)/.test(location.pathname),
    { timeout: 12000 }
  );

  const role = await page.evaluate(() =>
    location.pathname.startsWith('/teacher') ? 'teacher' : 'student'
  );
  console.log(`✔ Connecté en tant que ${role}`);

  await page.waitForSelector(role === 'teacher' ? '.sidebar' : '.topnav', { timeout: 10000 });
  await sleep(2000); // laisse le temps aux data du contexte de charger

  if (role === 'teacher') {
    // After login, /teacher redirects to /teacher/classes via <Route index>.
    await shoot(page, 'teacher-classes-list');

    // --- Open first class detail if any (via fiber inspection on a card)
    const firstClassId = await page.evaluate(() => {
      function readFiber(el) {
        const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
        return key ? el[key] : null;
      }
      const cards = Array.from(document.querySelectorAll('.card'));
      for (const c of cards) {
        let fiber = readFiber(c);
        let hops = 12;
        while (fiber && hops-- > 0) {
          const onClick = fiber.memoizedProps?.onClick;
          if (typeof onClick === 'function') {
            const m = onClick.toString().match(/\/teacher\/classes\/([\w-]+)/);
            if (m) return m[1];
          }
          fiber = fiber.return;
        }
      }
      return null;
    });

    // Optionally create a sample class if none exists (set SEED=1)
    if (!firstClassId && process.env.SEED === '1') {
      console.log('🌱 Création d\'une classe de démonstration…');
      await clickByText(page, 'button', 'Nouvelle classe');
      await sleep(600);
      await page.type('.modal-card input.field', 'Terminale Démo');
      await clickByText(page, 'button', 'Créer la classe');
      await sleep(2500);
      // After creation, navigation lands on /teacher/classes/{id}. Re-derive id.
      const newId = await page.evaluate(() => {
        const m = location.pathname.match(/\/teacher\/classes\/([\w-]+)/);
        return m ? m[1] : null;
      });
      if (newId) {
        await shoot(page, 'teacher-class-detail');
        await clickByText(page, 'button', 'Toutes les classes');
        await sleep(1500);
      }
    }

    if (firstClassId) {
      const navigated = await page.evaluate((id) => {
        const cards = Array.from(document.querySelectorAll('.card'));
        const target = cards.find((c) => {
          const key = Object.keys(c).find((k) => k.startsWith('__reactFiber'));
          let fiber = key ? c[key] : null;
          let hops = 12;
          while (fiber && hops-- > 0) {
            const onClick = fiber.memoizedProps?.onClick;
            if (typeof onClick === 'function' && onClick.toString().includes(id)) return true;
            fiber = fiber.return;
          }
          return false;
        });
        if (target) { target.click(); return true; }
        return false;
      }, firstClassId);
      if (navigated) {
        await sleep(2500);
        await shoot(page, 'teacher-class-detail');
        // Switch to the "Tableau" view inside Évaluations tab
        const switched = await clickByText(page, 'button', 'Tableau');
        if (switched) {
          await sleep(1000);
          await shoot(page, 'teacher-class-detail-grid');
        }
        // Go back to classes list via the breadcrumb
        await clickByText(page, 'button', 'Toutes les classes');
        await sleep(1500);
      }
    } else {
      console.log('ℹ Pas de classe → skip class-detail');
    }

    // --- Compétences
    await clickSidebar(page, 'Compétences');
    await shoot(page, 'teacher-competences');

    // --- Formulaires liste
    await clickSidebar(page, 'Formulaires');
    await shoot(page, 'teacher-formulaires-list');

    // --- Form preview : clique sur le premier "Aperçu"
    const previewed = await clickByText(page, 'button', 'Aperçu');
    if (previewed) {
      await sleep(2000);
      await shoot(page, 'teacher-form-preview');
      // Revenir à la liste
      await clickByText(page, 'button', 'Retour');
      await sleep(1500);
    }

    // --- FormCreate (cliquer "Nouveau formulaire")
    await clickByText(page, 'button', 'Nouveau formulaire');
    await sleep(2000);
    await shoot(page, 'teacher-formulaires-new');
  } else {
    // --- Student dashboard (pas dans le scope Phase 1 mais on capture)
    await shoot(page, 'student-dashboard');
    // Tente d'ouvrir le premier formulaire en attente
    const filled = await clickByText(page, 'button', 'Remplir');
    if (filled) {
      await sleep(2500);
      await shoot(page, 'student-form-fill');
    }
  }
} catch (err) {
  console.error('❌', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}

console.log('\n✅ Captures terminées.');
console.log(`Voir ${OUT_DIR}/`);
