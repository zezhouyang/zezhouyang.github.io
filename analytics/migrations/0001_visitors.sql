-- HMACs are rotated daily and removed after three days; raw IPs are never stored.
CREATE TABLE IF NOT EXISTS daily_visits (
  visitor_hash TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  location_key TEXT NOT NULL,
  latitude REAL,
  longitude REAL
);
CREATE INDEX IF NOT EXISTS daily_visits_day ON daily_visits(day);

-- Persistent lifetime counters survive deduplication cleanup and redeployment.
CREATE TABLE IF NOT EXISTS locations (
  location_key TEXT PRIMARY KEY,
  latitude REAL,
  longitude REAL,
  visits INTEGER NOT NULL DEFAULT 0,
  last_seen TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS count_new_visit
AFTER INSERT ON daily_visits
BEGIN
  INSERT INTO locations (location_key, latitude, longitude, visits, last_seen)
  VALUES (NEW.location_key, NEW.latitude, NEW.longitude, 1, NEW.day)
  ON CONFLICT(location_key) DO UPDATE SET visits = visits + 1, last_seen = NEW.day;
END;
