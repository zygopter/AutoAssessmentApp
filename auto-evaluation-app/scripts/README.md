# Scripts de capture

## Pré-requis

Le dev server doit tourner. Par défaut les scripts ciblent
`http://localhost:3939` (laisse libre le `3000` de ton dev). Lance-le en
parallèle :

```bash
cd auto-evaluation-app
BROWSER=none PORT=3939 npm start
```

## Écrans publics — `../../scripts/screenshots.sh`

Chrome headless via `/Applications/Google Chrome.app`. Capture `/login`
et `/register`.

```bash
./scripts/screenshots.sh                       # → ./screenshots/
./scripts/screenshots.sh http://localhost:3000  # autre port
```

## Écrans authentifiés — `screenshots-auth.mjs`

Puppeteer + Chrome système. Fait le login Supabase puis screenshote les
écrans prof (`/teacher/classes`, `/competences`, `/formulaires`,
`/formulaires/new`) ou élève (`/student`).

Installation ponctuelle (ne touche pas `package.json`) :

```bash
cd auto-evaluation-app
npm install --no-save puppeteer-core
```

Lancement (sur un compte prof) :

```bash
SCREENSHOT_EMAIL=prof@example.com \
SCREENSHOT_PASSWORD=motdepasse \
node scripts/screenshots-auth.mjs \
  http://localhost:3939 \
  ../screenshots
```

Variantes utiles :

- `SEED=1 …` : si le compte n'a pas de classe, le script en crée une
  via le modal "Nouvelle classe" pour capturer la vue détail.
- Relance avec un compte élève pour obtenir `student-dashboard.png` et
  (s'il y a un formulaire en attente) `student-form-fill.png`.
