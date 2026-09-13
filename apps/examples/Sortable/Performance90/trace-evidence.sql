SELECT
  name,
  COUNT(*) AS occurrences,
  ROUND(SUM(dur) / 1000000.0, 2) AS total_ms,
  ROUND(MAX(dur) / 1000000.0, 2) AS max_ms
FROM slice
WHERE name GLOB 'Sortable90::*'
  OR name GLOB 'ReactLynx::*'
  OR name IN ('Layout', 'UIOperation', 'ScrollByInternal')
GROUP BY name
ORDER BY total_ms DESC, occurrences DESC;
