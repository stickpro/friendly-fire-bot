-- CreateTable
CREATE TABLE `Chat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `telegramChatId` BIGINT NOT NULL,

    UNIQUE INDEX `Chat_telegramChatId_key`(`telegramChatId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pidor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `userName` VARCHAR(255) NOT NULL,
    `telegramId` BIGINT NOT NULL,
    `chatId` INTEGER NOT NULL,

    UNIQUE INDEX `Pidor_telegramId_chatId_key`(`telegramId`, `chatId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatPidors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chatId` INTEGER NULL,
    `pidorId` INTEGER NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pidor` ADD CONSTRAINT `Pidor_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatPidors` ADD CONSTRAINT `ChatPidors_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatPidors` ADD CONSTRAINT `ChatPidors_pidorId_fkey` FOREIGN KEY (`pidorId`) REFERENCES `Pidor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
