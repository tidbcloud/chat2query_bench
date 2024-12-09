CREATE TABLE `public_links` (
	`id` varchar(255) NOT NULL,
	`messages` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `public_links_id` PRIMARY KEY(`id`)
);
