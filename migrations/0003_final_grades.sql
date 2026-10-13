-- Betygsskala per kurs; värdena måste matcha GRADING_SCALES i src/lib/grades.ts.
-- DEFAULT behövs för att lägga till en NOT NULL-kolumn på en tabell som redan har rader.
ALTER TABLE courses ADD COLUMN grading_scale TEXT NOT NULL DEFAULT 'U345'
  CHECK (grading_scale IN ('UG', 'UGVG', 'U345', 'AF'));

-- Slutbetyg per elev och kurs; NULL tills eleven fyllt i det
ALTER TABLE enrollments ADD COLUMN final_grade TEXT;
