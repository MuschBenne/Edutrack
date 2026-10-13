# EduTrack: flytt till Cloudflare Workers och D1

Senast uppdaterad 2026-10-13

## Sammanfattning

Vi bygger om EduTrack i **Astro** på Cloudflare Workers, med **D1** (SQLite) som databas. Det ersätter Express, EJS, Mongoose och express-session.

- **Varför byta ramverk:** EJS kan inte köras i Workers, eftersom mallarna kompileras med `new Function`. Alla sidor måste skrivas om ändå, och då är det bättre att landa i ett ramverk byggt för Cloudflare.
- **Vad som behålls:** designen (`master.css`), klientkoden för graferna (`graph_logic.js`, `static_functions.js`) och appens funktioner.
- **Data:** vi börjar med en tom databas. Inget flyttas från MongoDB.
- **Vad som blir bättre:** data i riktiga tabeller med datum, inga nästlade dokument, och fem kända buggar försvinner (se sista avsnittet).
- **Kostnad:** både Workers och D1 har gratisnivåer som räcker gott för ett skolprojekt.
- **Inloggning:** endast via Google-konto. Inga lösenord lagras, så varken bcrypt-migrering, lösenordsåterställning eller CPU-tung hashning behövs. Andra inloggningssätt kan läggas till senare.

## Val av ramverk

Beslut: **Astro**. Det passar en app som mest består av serverrenderade sidor och formulär, med lite JavaScript i webbläsaren för graferna. Astro-teamet gick över till Cloudflare i januari 2026, så stödet för Workers och D1 är förstahandsprioriterat.

| Ramverk | Typ | Hur nära dagens kod | Passar EduTrack |
| --- | --- | --- | --- |
| **Astro** | Fullstack, sidor i `.astro` (HTML med frontmatter) | Mallsyntaxen ligger nära EJS, och sidorna kan kopieras över nästan rakt av | Bäst: filbaserad routing, layouter, middleware för inloggning, API-endpoints |
| Hono | Lätt server-ramverk, sidor i JSX | Routes ser ut som Express, men vyerna måste skrivas om till JSX | Bra om ni vill behålla modulstrukturen; ni bygger layout och struktur själva |
| React Router v7 | Fullstack med React | Långt från: allt blir React-komponenter | Överdrivet för en app med nästan ingen interaktivitet |
| SvelteKit | Fullstack med Svelte | Långt från, nytt språk att lära sig | Fungerar fint, men ger inget extra här |
| Next.js | Fullstack med React | Långt från | Körs på Cloudflare via OpenNext-adaptern, med fler begränsningar än de andra |

**Vad Astro ger konkret:**

- **Sidor:** varje sida blir en fil i `src/pages/` (`index.astro`, `login.astro`, `onboarding.astro`, `app/index.astro`, `app/course/[id].astro`, `admin.astro`).
- **Gemensam layout:** `Head`, `Nav` och `Footer` blir en `Layout.astro` som alla sidor använder.
- **Inloggning:** en `middleware.ts` läser sessionscookien en gång och lägger användaren på `Astro.locals`. Sidor som kräver inloggning kollar bara `Astro.locals.user`.
- **API:** POST-anropen blir endpoints i `src/pages/api/`, t.ex. `api/sessions.ts` för att spara en studiesession.
- **Statiska filer:** `master.css` och graf-skripten läggs i `public/` och serveras som de är.

## Databasschema

Dagens nästlade användardokument (`activeCourses` → `sessions` → datum → lista) delas upp i fyra tabeller, plus en tabell för inloggningar. Schemat läggs i `migrations/0001_init.sql` och körs med `wrangler d1 migrations apply`.

```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  google_id     TEXT NOT NULL UNIQUE,  -- Googles 'sub', stabilt även om e-posten ändras
  class         TEXT NOT NULL,
  is_admin      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE courses (
  course_id TEXT PRIMARY KEY,
  name      TEXT NOT NULL
);

CREATE TABLE enrollments (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT    NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, course_id)
);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

CREATE TABLE study_sessions (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL,
  course_id     TEXT    NOT NULL,
  studied_on    TEXT    NOT NULL,  -- '2026-10-08'
  minutes       INTEGER NOT NULL CHECK (minutes > 0),
  type          TEXT    NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  health        INTEGER NOT NULL CHECK (health BETWEEN 1 AND 5),
  mental_health INTEGER NOT NULL CHECK (mental_health BETWEEN 1 AND 5),
  FOREIGN KEY (user_id, course_id)
    REFERENCES enrollments(user_id, course_id) ON DELETE CASCADE
);
CREATE INDEX idx_sessions_user_course
  ON study_sessions(user_id, course_id, studied_on);
CREATE INDEX idx_sessions_course ON study_sessions(course_id, studied_on);

CREATE TABLE auth_sessions (
  id         TEXT PRIMARY KEY,  -- SHA-256 av token i cookien
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at);

-- migrations/0002_pending_signups.sql: Google-inloggningar som inte valt namn och klass än
CREATE TABLE pending_signups (
  id         TEXT    PRIMARY KEY,  -- SHA-256 av token i cookien
  google_id  TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  expires_at INTEGER NOT NULL      -- 15 minuter
);
CREATE INDEX idx_pending_signups_expires ON pending_signups(expires_at);
```

- **Admin:** `is_admin` ersätter den hårdkodade listan `['Benji', 'Benke']` i `Login.ts`. Den sätts när kontot skapas, om e-posten finns i secreten `ADMIN_EMAILS` (se steg 4).
- **Borttagning:** tar man bort en kurs eller användare försvinner deras registreringar och sessioner automatiskt (`ON DELETE CASCADE`). `removeCourse` och `deleteUser` blir en enda `DELETE` var.
- **Dubbletter:** `UNIQUE` på användarnamn och e-post ersätter de manuella kontrollerna i `registerUser`.
- **Google-koppling:** `google_id` identifierar användaren vid inloggning. E-posten sparas för visning och admin-kontrollen.
- **Tokens:** cookien innehåller en slumpad token, databasen bara dess SHA-256. En läckt databas ger alltså inga giltiga inloggningar.
- **Datum:** sparas som `2026-10-08` i stället för `Wed_Oct_08_2026`, så statistik blir vanliga `SUM` och `GROUP BY`.

## Kostnad och prestanda

Allt ska rymmas i Cloudflares gratisnivå. Gränserna nedan gäller i skrivande stund och bör stämmas av mot Cloudflares prissida.

| Resurs | Gratis | Vad EduTrack behöver |
| --- | --- | --- |
| Workers-anrop | 100 000 per dag | Långt under |
| CPU-tid per anrop | cirka 10 ms | Räcker, eftersom inga lösenord hashas |
| D1 läsning / skrivning | 5 miljoner / 100 000 rader per dag | Räcker gott om frågorna använder index |
| D1 lagring | 5 GB | Några MB |
| Statiska filer | Ingår, anropar inte Workern | CSS, graf-skript, bilder |
| Domän | `*.workers.dev` gratis | Egen domän kostar en årsavgift hos en registrar |

**Optimeringar:**

1. **Ingen databasfråga för anonyma besök.** Alla sidor renderas per anrop (`output: 'server'`), eftersom navigeringen beror på om man är inloggad. Middleware frågar bara D1 när det finns en sessionscookie.
2. **En databasfråga per sidvisning.** Middleware slår upp session och användare i en enda `JOIN`. Sidor som behöver flera frågor kör dem i `db.batch()`, som blir en resa till D1.
3. **Räkna i SQL.** Statistiken (senaste 7 dagarna, totalt, snittbetyg) räknas med `SUM`/`AVG ... GROUP BY studied_on`. Färre rader läses tack vare `idx_sessions_user_course`, och mindre data skickas till webbläsaren.
4. **Databasens placering.** `--location weur` när databasen skapas.
5. **Cachning.** Filerna i `public/` får en `Cache-Control`-header. Astros byggda filer har hashade namn och kan cachas för alltid.
6. **Städa gamla inloggningar.** Utgångna sessioner och påbörjade registreringar tas bort vid varje ny inloggning. Det kräver inget cron-jobb.
7. **Ingen KV för sessioner.** KV:s gratisnivå tillåter bara 1 000 skrivningar per dag. D1 räcker.

## Steg för steg

Sidor och funktioner är desamma som i dag. Tabellen visar vart varje del av dagens kod tar vägen.

| I dag | Blir i Astro |
| --- | --- |
| `src/App.ts` (Express, routes, session) | `astro.config.mjs` med Cloudflare-adaptern, `src/middleware.ts` |
| `views/CommonModules/Head, Nav, Footer` | `src/layouts/Layout.astro` |
| `views/Landing.ejs` | `src/pages/index.astro` |
| `views/Login.ejs`, `Register.ejs` | `src/pages/login.astro` (Google-knapp), `onboarding.astro` (val av klass för nya användare) |
| `views/Application/Main.ejs` | `src/pages/app/index.astro` |
| `views/Application/CoursePage.ejs` + `Session.ejs` | `src/pages/app/course/[id].astro` + `src/components/SessionForm.astro` |
| `views/Application/CourseRegister.ejs` | `src/pages/app/register-course.astro` |
| `views/Admin.ejs` | `src/pages/admin.astro` |
| `modules/Login.ts`, `Register.ts`, `Logout.ts` | `src/pages/api/auth/google.ts`, `google/callback.ts`, `src/pages/logout.ts` + `src/lib/auth.ts`, `google.ts`, `cookies.ts`. Formuläret i `onboarding.astro` hanterar sin egen POST. |
| `modules/Application.ts` (POST-actions) | `src/pages/api/sessions.ts`, `api/enrollments.ts` |
| `modules/CourseManager.ts` | `src/pages/api/admin/*.ts` |
| `db_models/User.ts`, `Course.ts` | `src/db/*.ts` med SQL-frågor |
| `public/` | `public/` (oförändrat) |

1. **Uppsättning**
   - Projektet skapades med `npm create astro@latest -- --template minimal` och `npx astro add cloudflare` (Astro 7, `@astrojs/cloudflare` 14). `npm create cloudflare` fastnar på en interaktiv fråga.
   - Bindningar nås med `import { env } from 'cloudflare:workers'`. `Astro.locals.runtime.env` finns inte längre.
   - D1-bindningen `DB` finns i `wrangler.jsonc` med ett platshållar-id. Det riktiga id:t fås när databasen skapas med `wrangler d1 create edutrack --location weur` (Västeuropa, nära användarna).
   - Flytta in `public/` (CSS och graf-skript) direkt.
   - Utveckling sker med `npm run dev`, som kör en lokal D1. Ingen databas behöver installeras.
2. **Databaslager (`src/db/`)**
   - Små funktioner som tar emot databasen: `users.ts`, `courses.ts`, `enrollments.ts`, `studySessions.ts`.
   - `courses.availableFor(userId)` blir en SQL-fråga med `NOT IN`, i stället för filtrering i JavaScript.
   - `toSessionMap(rows)` bygger om sessionsraderna till dagens format (`{ "Wed_Oct_08_2026": [ … ] }`). Då fungerar `graph_logic.js` och `static_functions.js` utan ändringar.
3. **Sessioner och inloggning**
   - När Google-inloggningen lyckats skapas en slumpad token (256 bitar). Hashen sparas i `auth_sessions` och token sätts som en `HttpOnly`-cookie med `SameSite=Lax`, giltig i 30 dagar.
   - `middleware.ts` slår upp cookien vid varje anrop och lägger `user` och `isAdmin` på `Astro.locals`.
   - `/app` och `/admin` skickar vidare till `/login` om ingen är inloggad. Den hårdkodade `secret: 'BJB-AB-Forever'` försvinner.
4. **Google-inloggning**
   - Skapa en OAuth-klient i Google Cloud Console (gratis). Tillåtna redirect-adresser: `http://localhost:4321/api/auth/google/callback` och produktionsadressen.
   - Klient-id och hemlighet läggs i `.dev.vars` lokalt och med `wrangler secret put GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` i produktion.
   - Biblioteket **Arctic** sköter OAuth-flödet och fungerar i Workers. `state` och PKCE-verifieraren sparas i kortlivade `HttpOnly`-cookies.
   - `api/auth/google.ts` skickar användaren till Google. `google/callback.ts` tar emot svaret och slår upp användaren:
     1. Finns `google_id`: logga in.
     2. Annars: ny användare. Google-id och e-post sparas i `pending_signups` och användaren skickas till `/onboarding`, där användarnamn (5–20 tecken) och programme (DV, IT, ES) väljs innan kontot skapas. Kräver att Google anger `email_verified`.
   - **Admin:** secreten `ADMIN_EMAILS` (kommaseparerad lista, i `.dev.vars` lokalt och via `wrangler secret put ADMIN_EMAILS` i produktion) avgör vilka konton som får `is_admin = 1` när de skapas. Adresserna hamnar aldrig i repot.
   - Skolkonton i Google Workspace kan ha tredjepartsappar blockerade. Testa med ett skolkonto tidigt i fas 2.
5. **Sidor**
   - HTML-strukturen och CSS-klasserna från den nya designen kopieras över. `<%= x %>` blir `{x}` och `<% if %>`-block blir `{cond && ( … )}`.
   - Uträkningarna som i dag ligger i `Main.ejs` och `CoursePage.ejs` (senaste 7 dagarna, totalt, snittbetyg) flyttas till SQL eller till `src/lib/stats.ts`.
   - Kursdatan till graferna skickas som `<script type="application/json">` i stället för `JSON.parse('<%- … %>')`.
6. **API-endpoints**
   - POST-anropen flyttas från `?action=`-parametrar till egna endpoints, t.ex. `POST /api/sessions` och `POST /api/admin/courses`.
   - Admin-anropen skickar data som JSON i bodyn i stället för i URL:en.
   - `fetch`-anropen i sidornas skript och i `graph_logic.js` uppdateras till de nya adresserna.
7. **Tester**
   - Jest mot lokal MongoDB ersätts av Vitest med `@cloudflare/vitest-plugin` (tidigare `vitest-pool-workers`, som bytt namn), som kör mot en lokal D1 som töms före varje test.
   - De gamla Jest-testerna byggde på Mongoose och har skrivits om för databaslagret. De täcker samma funktioner plus buggarna i nästa avsnitt. I fas 2 tillkommer tester för callbackens två fall (känt `google_id`, ny användare) och admin-flaggan via `ADMIN_EMAILS`, med Googles svar mockat.
8. **Driftsättning**
   - `wrangler d1 migrations apply edutrack --remote`, sedan `npm run deploy`. Databasen startar tom.
   - Lägg in secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` och `ADMIN_EMAILS`.
   - Egen domän läggs till i Cloudflares panel. Inga databaslösenord behövs, eftersom D1 nås via bindningen.

## Buggar som rättas på vägen

De här finns i dagens kod och försvinner med omskrivningen. Den första påverkar riktig data redan nu.

| Var | Problem | Följd |
| --- | --- | --- |
| `removeStudentFromCourse` i `CourseManager.ts` | `filter((e) => {e != username})` returnerar ingenting | Hela kursens elevlista töms när en elev tas bort, och det händer också när en användare raderas |
| `removeCourse` i `CourseManager.ts` | `forEach(async …)` väntas inte in | Kursen kan raderas innan eleverna är uppdaterade |
| `HandleApp` i `Application.ts` | Saknar `return` efter `redirect` | Koden fortsätter köras för utloggade anrop |
| `CoursePage.ejs` | `JSON.parse('<%- … %>')` | Går sönder med apostrofer i data och är en risk för injektion |
| Admin-anropen | Data skickas i URL:en med POST | Specialtecken i namn kan gå fel, och värdena hamnar i loggar |

Om Express-versionen ska användas en tid till kan den första buggen rättas där direkt: `filter((e) => e != username)`.

## Ordning och öppna beslut

Arbetet görs på en egen gren. Express-versionen ligger kvar på `main` tills sista fasen är klar, och på grenen i `legacy/` som referens vid porteringen, och varje fas går att testa för sig med `npm run dev`.

1. **Grund (klar 2026-10-13):** projektuppsättning, schema, databaslager och tester för det. Statistiken i SQL skrivs i fas 3, tillsammans med sidorna som visar den.
2. **Konton (klar 2026-10-13):** sessioner, Google-inloggning, onboarding, layout och landningssidan. `/app` är en tillfällig sida tills fas 3.
3. **Kärnan:** Mina kurser, kurssidan med grafer, statistiken i SQL och formuläret för ny session.
4. **Resten:** kursregistrering och admin.
5. **Lansering:** ta bort `legacy/`, driftsätt, peka om domänen, slå ihop med `main` och stäng ner MongoDB.

**Beslut att ta innan fas 1:**

- [x] Ramverk: Astro.
- [x] Inloggning: endast Google-konto. Andra sätt kan läggas till senare.
- [x] Data: börja om med en tom databas.
- [x] Admin: projektägarens Google-konto, via secreten `ADMIN_EMAILS`.
