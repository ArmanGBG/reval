UPDATE "Task"
SET
  "actualTimeMinutes" = COALESCE("actualTimeMinutes", "targetTimeMinutes", 0),
  "actualTestCount" = COALESCE("actualTestCount", "targetTestCount", 0)
WHERE "status" = 'COMPLETED';
