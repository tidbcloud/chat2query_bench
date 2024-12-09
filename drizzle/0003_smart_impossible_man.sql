ALTER TABLE `tidb_serverless_cluster` MODIFY COLUMN `project_id` varchar(255) NOT NULL;
ALTER TABLE `tidb_serverless_cluster` MODIFY COLUMN `cluster_id` varchar(255) NOT NULL;
ALTER TABLE `tidb_serverless_cluster` MODIFY COLUMN `chat2query_app_id` varchar(255) NOT NULL;
ALTER TABLE `tidb_serverless_cluster` MODIFY COLUMN `data_app_id` varchar(255) NOT NULL;
ALTER TABLE `tidb_serverless_cluster` MODIFY COLUMN `chat2query_key` varchar(500) NOT NULL;
ALTER TABLE `tidb_serverless_cluster` MODIFY COLUMN `data_app_key` varchar(500) NOT NULL;
ALTER TABLE `user_sessions` MODIFY COLUMN `tidbcloud_access_token` varchar(500);
ALTER TABLE `user_sessions` MODIFY COLUMN `tidbcloud_refresh_token` varchar(500);
