-- CreateTable
CREATE TABLE `jackson_index` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(250) NOT NULL,
    `storeKey` VARCHAR(250) NOT NULL,

    INDEX `jackson_index_storeKey_idx`(`storeKey`),
    INDEX `jackson_index_key_idx`(`key`),
    INDEX `jackson_index_key_storeKey_idx`(`key`, `storeKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jackson_store` (
    `key` VARCHAR(250) NOT NULL,
    `value` TEXT NOT NULL,
    `iv` VARCHAR(64) NULL,
    `tag` VARCHAR(64) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `modifiedAt` TIMESTAMP(0) NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jackson_ttl` (
    `key` VARCHAR(250) NOT NULL,
    `expiresAt` BIGINT NOT NULL,

    INDEX `jackson_ttl_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
