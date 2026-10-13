CREATE TABLE universities (
  id   INTEGER PRIMARY KEY,
  name TEXT    NOT NULL UNIQUE
);

CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  google_id     TEXT    NOT NULL UNIQUE,  -- Googles 'sub', stabilt även om e-posten ändras
  username      TEXT    NOT NULL UNIQUE,
  email         TEXT    NOT NULL UNIQUE,
  university_id INTEGER NOT NULL REFERENCES universities(id),
  programme     TEXT    NOT NULL,         -- fritext, förslag från andra på samma lärosäte
  is_admin      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_users_university ON users(university_id);

-- Varje lärosäte har egna kurser; samma kod finns en gång per termin
CREATE TABLE courses (
  id            INTEGER PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  code          TEXT    NOT NULL,  -- normaliserad: versaler, utan mellanslag, t.ex. '1DL201'
  term          TEXT    NOT NULL,  -- 'VT26' eller 'HT26'
  name          TEXT    NOT NULL,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    INTEGER NOT NULL,  -- unix-tid i sekunder
  UNIQUE (university_id, code, term)
);

CREATE TABLE enrollments (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, course_id)
);
-- För "vilka elever går kursen" (primärnyckeln täcker bara uppslag på user_id först)
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

CREATE TABLE study_sessions (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL,
  course_id     INTEGER NOT NULL,
  studied_on    TEXT    NOT NULL,  -- 'YYYY-MM-DD'
  minutes       INTEGER NOT NULL CHECK (minutes > 0),
  type          TEXT    NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  health        INTEGER NOT NULL CHECK (health BETWEEN 1 AND 5),
  mental_health INTEGER NOT NULL CHECK (mental_health BETWEEN 1 AND 5),
  -- Sessioner försvinner när eleven avregistreras från kursen
  FOREIGN KEY (user_id, course_id)
    REFERENCES enrollments(user_id, course_id) ON DELETE CASCADE
);
CREATE INDEX idx_sessions_user_course ON study_sessions(user_id, course_id, studied_on);
-- För admin-vyn med alla elevers sessioner i en kurs
CREATE INDEX idx_sessions_course ON study_sessions(course_id, studied_on);

CREATE TABLE auth_sessions (
  id         TEXT    PRIMARY KEY,  -- SHA-256 av token i cookien
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL      -- unix-tid i sekunder
);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
-- Används av städningen av utgångna inloggningar
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at);

INSERT INTO universities (name) VALUES
  ('Blekinge tekniska högskola'),
  ('Chalmers tekniska högskola'),
  ('Försvarshögskolan'),
  ('Gymnastik- och idrottshögskolan'),
  ('Göteborgs universitet'),
  ('Handelshögskolan i Stockholm'),
  ('Högskolan Dalarna'),
  ('Högskolan i Borås'),
  ('Högskolan i Gävle'),
  ('Högskolan i Halmstad'),
  ('Högskolan i Skövde'),
  ('Högskolan Kristianstad'),
  ('Högskolan Väst'),
  ('Jönköping University'),
  ('Karlstads universitet'),
  ('Karolinska institutet'),
  ('Konstfack'),
  ('Kungl. Musikhögskolan'),
  ('Kungliga Tekniska högskolan (KTH)'),
  ('Linköpings universitet'),
  ('Linnéuniversitetet'),
  ('Luleå tekniska universitet'),
  ('Lunds universitet'),
  ('Malmö universitet'),
  ('Marie Cederschiöld högskola'),
  ('Mittuniversitetet'),
  ('Mälardalens universitet'),
  ('Röda Korsets Högskola'),
  ('Sophiahemmet Högskola'),
  ('Stockholms konstnärliga högskola'),
  ('Stockholms universitet'),
  ('Sveriges lantbruksuniversitet (SLU)'),
  ('Södertörns högskola'),
  ('Umeå universitet'),
  ('Uppsala universitet'),
  ('Örebro universitet');
