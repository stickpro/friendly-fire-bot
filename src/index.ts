import { Telegraf } from "telegraf";
import nconf from "nconf";
import { PrismaClient } from "@prisma/client";

nconf.file({ file: "config.json" });

const { bot_token: telegramApiKey } = nconf.get("telegram");

const prisma = new PrismaClient();

async function run() {
  const bot = new Telegraf(telegramApiKey);
  const httpsHost = "https://8d9b-37-78-231-149.ngrok.io";
  bot.telegram.setWebhook(`${httpsHost}/secret-path`);

  // @ts-expect-error fixme
  bot.startWebhook("/secret-path", null, 5000);

  bot.command("init", async (ctx) => {
    // const chats = await prisma.chat.findMany();
    // console.log(chats);
    try {
      const chat = await prisma.chat.create({
        data: {
          telegramChatId: ctx.message.chat.id,
        },
      });
      ctx.telegram.sendMessage(ctx.message.chat.id, "ИГРА НАЧАЛАСЬ");
    } catch (error) {
      ctx.telegram.sendMessage(ctx.message.chat.id, "ИГРА УЖЕ НАЧАЛАСЬ");
    }
  });

  bot.command("pidor", async (ctx) => {
    const chat = await prisma.chat.findFirst({
      where: { telegramChatId: ctx.message.chat.id },
    });
    if (chat !== null) {
      const pidorCount = await prisma.pidor.count({
        where: { chat: { id: chat.id } },
      });
      const skip = Math.floor(Math.random() * pidorCount);
      const pidors = await prisma.pidor.findMany({
        take: 1,
        skip: skip,
        where: { chat: { id: chat.id } },
        orderBy: {
          id: "desc",
        },
      });
      if (pidors.length === 0) {
        const pidor = await prisma.pidorOnChat.create({
          data: {
            chatId: chat.id,
            pidorId: pidors[0].id,
          },
        });
      }

      await ctx.telegram.sendMessage(
        ctx.message.chat.id,
        `Пидор у нас сегодня @${pidors[0].userName}`
      );
    } else {
      ctx.telegram.sendMessage(
        ctx.message.chat.id,
        "Ну ты тупой, сначала команда /init напиши...."
      );
    }
  });
  bot.command("pidoreg", async (ctx, next) => {
    try {
      const pidor = await prisma.pidor.create({
        data: {
          name: ctx.message.from.first_name,
          userName:
            ctx.message.from.username ||
            ctx.message.from.first_name + " " + ctx.message.from.last_name,
          telegramId: ctx.message.from.id,
          chat: {
            connect: { telegramChatId: ctx.message.chat.id },
          },
        },
      });

      ctx.telegram.sendMessage(ctx.message.chat.id, "Добавила тебя сладенький");
    } catch (error) {
      ctx.telegram.sendMessage(ctx.message.chat.id, "Ты уже зареган дебилыч");
    }
  });
  bot.command("pidorstat", async (ctx) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    try {
      const pidors = await prisma.pidor.findMany({
        include: {
          _count: {
            select: {
              pidor: true,
            },
          },
        },
      });
      console.log(pidors);
    } catch (err) {
      console.log("err", err);
    }
  });
}

run();
