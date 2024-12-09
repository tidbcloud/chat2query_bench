CREATE TABLE `tidb_serverless_cluster` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`project_id` varchar(255),
	`cluster_id` varchar(255),
	`chat2query_app_id` varchar(255),
	`data_app_id` varchar(255),
	`chat2query_key` varchar(255),
	`data_app_key` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tidb_serverless_cluster_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tidb_serverless_cluster` ADD CONSTRAINT `tidb_serverless_cluster_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;