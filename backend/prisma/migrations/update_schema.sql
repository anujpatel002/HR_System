-- Add password_resets table if not exists
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `isUsed` BOOLEAN NOT NULL DEFAULT false,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `password_resets_token_key`(`token`),
  INDEX `password_resets_userId_idx`(`userId`),
  INDEX `password_resets_token_idx`(`token`),
  CONSTRAINT `password_resets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Make company and companyId optional in users table (if not already)
ALTER TABLE `users` MODIFY COLUMN `company` VARCHAR(191) NULL;
ALTER TABLE `users` MODIFY COLUMN `companyId` VARCHAR(191) NULL;
