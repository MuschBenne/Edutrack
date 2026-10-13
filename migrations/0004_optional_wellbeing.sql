-- Hälsobetygen räknas som hälsodata (GDPR art. 9) och får bara sparas frivilligt, så de blir valfria.
-- SQLite kan inte ändra NOT NULL på en kolumn; tabellen byggs om och raderna kopieras.
CREATE TABLE study_sessions_new (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL,
  course_id     INTEGER NOT NULL,
  studied_on    TEXT    NOT NULL,  -- 'YYYY-MM-DD'
  minutes       INTEGER NOT NULL CHECK (minutes > 0),
  type          TEXT    NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  health        INTEGER CHECK (health BETWEEN 1 AND 5),         -- NULL = inte angivet
  mental_health INTEGER CHECK (mental_health BETWEEN 1 AND 5),  -- NULL = inte angivet
  FOREIGN KEY (user_id, course_id)
    REFERENCES enrollments(user_id, course_id) ON DELETE CASCADE
);

INSERT INTO study_sessions_new SELECT id, user_id, course_id, studied_on, minutes, type, rating, health, mental_health FROM study_sessions;
DROP TABLE study_sessions;
ALTER TABLE study_sessions_new RENAME TO study_sessions;

CREATE INDEX idx_sessions_user_course ON study_sessions(user_id, course_id, studied_on);
CREATE INDEX idx_sessions_course ON study_sessions(course_id, studied_on);
