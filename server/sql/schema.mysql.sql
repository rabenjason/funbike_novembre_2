-- =====================================================================
--  Funbike — schéma MySQL (importable dans phpMyAdmin)
--  Base : funbike   (créée par : CREATE DATABASE funbike CHARACTER SET utf8mb4;)
--
--  Les tables sont créées automatiquement au premier démarrage de l'API ;
--  cet import manuel est utile pour inspecter la base dans phpMyAdmin.
-- =====================================================================

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Identité et coordonnées du site (une seule ligne, id = 1)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` TINYINT NOT NULL,
  `site_name` VARCHAR(190) NOT NULL,
  `site_full_name` VARCHAR(190) NOT NULL,
  `logo_url` TEXT NOT NULL,
  `logo_alt` VARCHAR(190) NOT NULL,
  `country` VARCHAR(120) NOT NULL,
  `city` VARCHAR(120) NOT NULL,
  `address` TEXT NOT NULL,
  `address_full` TEXT NOT NULL,
  `phone_display` VARCHAR(60) NOT NULL,
  `phone_link` VARCHAR(60) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `hours` VARCHAR(190) NOT NULL,
  `hours_short` VARCHAR(190) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Textes de l'accueil (une seule ligne, id = 1) — modifiables dans /admin
CREATE TABLE IF NOT EXISTS `home_content` (
  `id` TINYINT NOT NULL,
  `hero_localisation` TEXT,
  `hero_titre1` TEXT,
  `hero_titre2` TEXT,
  `hero_description` TEXT,
  `hero_slogan_prefix` TEXT,
  `hero_usages` JSON,
  `hero_bouton_catalogue` TEXT,
  `hero_a_la_une` TEXT,
  `hero_annee` VARCHAR(20),
  `univers_surtitre` TEXT,
  `univers_titre` TEXT,
  `sherco_surtitre` TEXT,
  `sherco_titre1` TEXT,
  `sherco_titre2` TEXT,
  `sherco_description` TEXT,
  `sherco_bouton` TEXT,
  `sherco_image` TEXT,
  `sherco_image_alt` TEXT,
  `distributeur_surtitre` TEXT,
  `distributeur_titre` TEXT,
  `distributeur_bouton_voir` TEXT,
  `distributeur_bouton_motos` TEXT,
  `nouveautes_surtitre` TEXT,
  `nouveautes_titre` TEXT,
  `nouveautes_description` TEXT,
  `nouveautes_tarif` TEXT,
  `nouveautes_bouton` TEXT,
  `nouveautes_decouvrir` TEXT,
  `motos_numero` TEXT,
  `motos_titre` TEXT,
  `motos_description` TEXT,
  `motos_bouton` TEXT,
  `atelier_surtitre` TEXT,
  `atelier_titre` TEXT,
  `atelier_description` TEXT,
  `atelier_bouton` TEXT,
  `partenaires_titre` TEXT,
  `partenaires_description` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Produits mis en avant (carrousel + grille « Motos » de l'accueil)
CREATE TABLE IF NOT EXISTS `hero_slides` (
  `id` VARCHAR(64) NOT NULL,
  `short_name` VARCHAR(190) NOT NULL,
  `brand` VARCHAR(120) NOT NULL,
  `tag` VARCHAR(120) NOT NULL,
  `image_url` TEXT NOT NULL,
  `alt_text` TEXT NOT NULL,
  `bike_id` VARCHAR(190) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cartes « Nouveautés / Arrivages »
CREATE TABLE IF NOT EXISTS `new_arrivals` (
  `id` VARCHAR(64) NOT NULL,
  `badge` VARCHAR(120) NOT NULL,
  `sur_titre` VARCHAR(190) NOT NULL,
  `titre` VARCHAR(190) NOT NULL,
  `description` TEXT,
  `alt_text` TEXT,
  `points` JSON,
  `prix` VARCHAR(120) NOT NULL,
  `product_id` VARCHAR(190) NULL,
  `image_url` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Marques exclusives (section « Distributeur exclusif »)
CREATE TABLE IF NOT EXISTS `exclusive_brands` (
  `id` VARCHAR(64) NOT NULL,
  `brand_key` VARCHAR(120) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `tagline` VARCHAR(190) NOT NULL,
  `image_url` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Produits de la bande « Atelier / Essentiels » (dans l'ordre)
CREATE TABLE IF NOT EXISTS `atelier_products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` VARCHAR(190) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catalogue : motos
CREATE TABLE IF NOT EXISTS `bikes` (
  `id` VARCHAR(190) NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `brand` VARCHAR(120) NOT NULL,
  `family` VARCHAR(60) NOT NULL,
  `price` VARCHAR(120) NOT NULL,
  `tag` VARCHAR(120) NULL,
  `alt_text` TEXT,
  `image_url` TEXT NOT NULL,
  `gallery` JSON,
  `specs` JSON,
  `description` TEXT,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catalogue : pièces détachées & équipements pilote
CREATE TABLE IF NOT EXISTS `parts` (
  `id` VARCHAR(190) NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `price` VARCHAR(120) NOT NULL,
  `image_url` TEXT NOT NULL,
  `kind` VARCHAR(30) NOT NULL,
  `category` VARCHAR(60) NULL,
  `compatible_brand` VARCHAR(60) NULL,
  `part_type` VARCHAR(60) NULL,
  `source_url` TEXT NULL,
  `gallery` JSON,
  `description` TEXT NULL,
  `specs` JSON,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Marques partenaires (logos du défilement)
CREATE TABLE IF NOT EXISTS `brands` (
  `id` VARCHAR(190) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `src` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catégories « univers » (liens de l'accueil)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(190) NOT NULL,
  `title` VARCHAR(190) NOT NULL,
  `description` TEXT,
  `image_url` TEXT NOT NULL,
  `target` VARCHAR(60) NOT NULL,
  `brand` VARCHAR(60) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Revendeurs (page Revendeurs, carte)
CREATE TABLE IF NOT EXISTS `dealers` (
  `id` VARCHAR(190) NOT NULL,
  `dealer_key` VARCHAR(120) NOT NULL,
  `city` VARCHAR(120) NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `kind` VARCHAR(120) NOT NULL,
  `address` TEXT NOT NULL,
  `hours` VARCHAR(190) NOT NULL,
  `phone` VARCHAR(60) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `description` TEXT,
  `lat` DOUBLE NOT NULL,
  `lon` DOUBLE NOT NULL,
  `services` JSON,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
