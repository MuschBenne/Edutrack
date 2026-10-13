CREATE TABLE users (
  id        INTEGER PRIMARY KEY,
  google_id TEXT    NOT NULL UNIQUE,  -- Googles 'sub', stabilt även om e-posten ändras
  username  TEXT    NOT NULL UNIQUE,
  email     TEXT    NOT NULL UNIQUE,
  class     TEXT    NOT NULL,
  is_admin  INTEGER NOT NULL DEFAULT 0
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
-- För "vilka elever går kursen" (primärnyckeln täcker bara uppslag på user_id först)
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

CREATE TABLE study_sessions (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL,
  course_id     TEXT    NOT NULL,
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
  id         TEXT    PRIMARY KEY,  -- slumpad token i cookien
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL      -- unix-tid i sekunder
);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
-- Används av den dagliga städningen av utgångna inloggningar
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at);
