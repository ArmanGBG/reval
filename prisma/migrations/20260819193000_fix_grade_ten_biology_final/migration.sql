UPDATE "GradeSubject" AS gs
SET "isFinal" = false
FROM "Subject" AS s
WHERE gs."subjectId" = s.id
  AND s.name = 'زیست‌شناسی 1'
  AND gs.grade = 'دهم'
  AND gs.major = 'تجربی';
