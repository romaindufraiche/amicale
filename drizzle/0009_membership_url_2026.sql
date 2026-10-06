-- Lien HelloAsso d'adhésion 2026 fourni par l'Amicale. Valeur initiale uniquement :
-- le bureau le modifie ensuite dans Espace bureau → Réglages (un lien déjà saisi est conservé).
INSERT INTO "site_settings" ("id", "membership_url")
VALUES (1, 'https://www.helloasso.com/associations/amicale-des-policiers-du-val-d-oise/adhesions/adhesion-2026')
ON CONFLICT ("id") DO UPDATE
  SET "membership_url" = EXCLUDED."membership_url"
  WHERE "site_settings"."membership_url" IS NULL;
