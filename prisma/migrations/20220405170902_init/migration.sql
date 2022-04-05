-- CreateTable
CREATE TABLE "Chat" (
    "id" SERIAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "telegramChatId" BIGINT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pidor" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "userName" VARCHAR(255) NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "chatId" INTEGER NOT NULL,

    CONSTRAINT "Pidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatPidors" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER,
    "pidorId" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatPidors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_telegramChatId_key" ON "Chat"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "Pidor_telegramId_chatId_key" ON "Pidor"("telegramId", "chatId");

-- AddForeignKey
ALTER TABLE "Pidor" ADD CONSTRAINT "Pidor_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatPidors" ADD CONSTRAINT "ChatPidors_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatPidors" ADD CONSTRAINT "ChatPidors_pidorId_fkey" FOREIGN KEY ("pidorId") REFERENCES "Pidor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
