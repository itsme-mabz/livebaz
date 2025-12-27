-- Run this in your MySQL to check what's stored
SELECT 
    id,
    item_name,
    JSON_EXTRACT(item_data, '$.logo') as logo_field,
    JSON_EXTRACT(item_data, '$.league_logo') as league_logo_field,
    item_data
FROM PopularItems 
WHERE type = 'league';
