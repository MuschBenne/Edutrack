-- Google-inloggningar som inte valt användarnamn och klass än (onboarding)
CREATE TABLE pending_signups (
  id         TEXT    PRIMARY KEY,  -- SHA-256 av token i cookien
  google_id  TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  expires_at INTEGER NOT NULL      -- unix-tid i sekunder
);
CREATE INDEX idx_pending_signups_expires ON pending_signups(expires_at);
