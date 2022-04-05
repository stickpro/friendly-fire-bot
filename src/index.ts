import { Telegraf } from "telegraf";
import nconf from "nconf";
import { PrismaClient } from "@prisma/client";

nconf.file({ file: "config.json" });

const { bot_token: telegramApiKey } = nconf.get("telegram");

const prisma = new PrismaClient();

async function run() {
  const bot = new Telegraf(telegramApiKey);
  const {url: httpsHost, port: serverPort} = nconf.get("server");
  bot.telegram.setWebhook(`${httpsHost}/secret-path`);

  // @ts-expect-error fixme
  bot.startWebhook("/secret-path", null, serverPort);

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
      const date = Date.now() / 1000 - 86400;
      const lastChatPidor = await prisma.chatPidors.findMany({
        where: {
          chatId: chat.id,
          assignedAt: {
            gte: new Date(date),
          },
        },
      });
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
      if (lastChatPidor.length <= 0) {
        if (pidors.length >= 1) {
          await prisma.chatPidors.create({
            data: {
              chatId: chat.id,
              pidorId: pidors[0].id,
            },
          });

          const teasePhrase =
            teasePhrases[Math.floor(Math.random() * teasePhrases.length)];

          await Promise.all(
            teasePhrase.map(async (item) => {
              await ctx.telegram.sendMessage(ctx.message.chat.id, item);
            })
          );

          const resultPhrase =
            resultPhrases[Math.floor(Math.random() * resultPhrases.length)];

          await ctx.telegram.sendMessage(
            ctx.message.chat.id,
            `${resultPhrase} @${pidors[0].userName}`
          );
        } else {
          ctx.telegram.sendMessage(
            ctx.message.chat.id,
            "Никто не зарегистрировался для пидор дня /pidoreg"
          );
        }
      } else {
        ctx.telegram.sendMessage(
          ctx.message.chat.id,
          `У нас уже есть пидор дня ${pidors[0].userName}`
        );

      }
    } else {
      ctx.telegram.sendMessage(
        ctx.message.chat.id,
        "Ну ты тупой, сначала команда /init напиши...."
      );
    }
  });
  bot.command("pidoreg", async (ctx, next) => {
    try {
      const chat = await prisma.chat.findFirst({
        where: { telegramChatId: ctx.message.chat.id },
      });
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
        take: 10,
        where: {
          chat: {
            telegramChatId: ctx.message.chat.id,
          },
        },
        include: {
          _count: {
            select: {
              pidor: true,
            },
          },
        },
        orderBy: {
          pidor: {
            _count: "desc",
          },
        },
      });

      let message = "Топ 10 *пидоров* этого чатика: \n\n";
      pidors.map((item, index) => {
        message += `${index + 1}\\. ${item.name} \\- ${
          item._count.pidor
        } ${declOfNum(item._count.pidor, ["раз", "раза", "раз"])}\n`;
      });
      ctx.telegram
        .sendMessage(ctx.message.chat.id, message, { parse_mode: "MarkdownV2" })
        .then(() => {
          const sticker = stickers[Math.floor(Math.random() * stickers.length)];
          ctx.telegram.sendSticker(ctx.message.chat.id, sticker);
        });
    } catch (err) {
      console.log("err", err);
    }
  });
}

function declOfNum(n: number, text_forms: any[]) {
  n = Math.abs(n) % 100;
  var n1 = n % 10;
  if (n > 10 && n < 20) {
    return text_forms[2];
  }
  if (n1 > 1 && n1 < 5) {
    return text_forms[1];
  }
  if (n1 == 1) {
    return text_forms[0];
  }
  return text_forms[2];
}
const stickers = [
  "CAACAgIAAxkBAAEEYcBiTINDDBaaEhL2ZH78Yk4utpGazwACpBIAAmp56Et4oYbs-i6-9yME",
  "CAACAgIAAxkBAAEEYcJiTIOcZZy_4LyYgDSQz00I0wzifAACbxIAAlgr6Ev28xY3MxA0oiME",
  "CAACAgIAAxkBAAEEYcRiTIOobiLROQ8dGN2Z8vrTqnnMcwACVQ8AAuje6UuAE3iNQSh8tCME",
  "CAACAgIAAxkBAAEEYcZiTIO127suFuIHd7aZIp2vKsZV9gACchYAAsVE6UvACbz_6MZJkiME",
  "CAACAgIAAxkBAAEEYcpiTIO_K_RZn8ee7u14t5OQU-nZdgACTREAAiBV6EtZ4a4udXI6TSME",
  "CAACAgIAAxkBAAEEYcxiTIPK3OjlOmYtSoVan8-bjKvviQAC8hMAArq66Uu9H1E1s5x_ZyME",
  "CAACAgIAAxkBAAEEYc5iTIPSr7OESiadjz_xJAKlcCu2wAACyxUAAvtp6Euv3uFMm1plCSME",
  "CAACAgIAAxkBAAEEYdBiTIPclkHaB-IIj_QsqGBEgRyoVwACCRMAApvk6EuEBr_UvUcE6SME",
  "CAACAgIAAxkBAAEEYdJiTIPn-VMEOlZVDNB6S8dDud4ubwACLxMAApwT6EvLXm8TDpol3iME",
  "CAACAgIAAxkBAAEEYdRiTIP1VsyV2ugAAXQwyUkoMDk9QtcAArkRAAIIr-lL7spj8lBi4yUjBA",
  "CAACAgIAAxkBAAEEYdZiTIQDe7aGhOnZIQ2QsSLSra2dXAACyhQAAo9h6Utp7lCZodn0FCME",
  "CAACAgIAAxkBAAEEYdhiTIQL0461WnehH25Omys0r4bc6gACmhIAAj846UscFXngEwrG7yME",
  "CAACAgIAAxkBAAEEYdpiTIQXNUIhuMsqdnb90qvOepMbzQAC1RcAAuxd4EtrgIx3dubHBiME",
  "CAACAgIAAxkBAAEEYdxiTIQg_cVtkvCLTfgixp79AAHYKo0AAkQSAAKdP-lLN0x-JiVuyN0jBA",
  "CAACAgIAAxkBAAEEYd5iTIQrAugT39VAwpFQpvyXCGrNtwACFRIAAmZf6Euw1kz78HiU3yME",
  "CAACAgIAAxkBAAEEYeBiTIQzR9SZeE3M1zZbLXeAorJzZQACpxkAAtTv6EuBGgVlNBy81SME",
  "CAACAgIAAxkBAAEEYeJiTIQ7I5JsyzOqxvlW_PozWb3xYwACCRUAAhIY6Euao_zwChkiGyME",
  "CAACAgIAAxkBAAEEYeRiTIRCFp-rWIFz5UmOhgeRwO1hbQACHBMAAveg6EvoxNxubjLW4SME",
  "CAACAgIAAxkBAAEEYeZiTIRO5KZso8qkCa7J_Ba304xzeQACtxEAAg4U6UuR_3bvwQ6XsyME",
  "CAACAgIAAxkBAAEEYehiTIRWa9b-IP3KmEUxRAcc50-5_AAC_hoAAkRH8EuwLdl5YZNPbiME",
];

const teasePhrases = [
  [
    "Woob-woob, that's da sound of da pidor-police!",
    "Выезжаю на место...",
    "Но кто же он?",
  ],
  [
    "Woob-woob, that's da sound of da pidor-police!",
    "Ведётся поиск в базе данных",
    "Ведётся захват подозреваемого...",
  ],
  [
    "Что тут у нас?",
    "А могли бы на работе делом заниматься...",
    "Проверяю данные...",
  ],
  [
    "Инициирую поиск пидора дня...",
    "Машины выехали",
    "Так-так, что же тут у нас...",
  ],
  [
    "Что тут у нас?",
    "Военный спутник запущен, коды доступа внутри...",
    "Не может быть!",
  ],
];

const resultPhrases = [
  "А вот и пидор - ",
  "Вот ты и пидор, ",
  "Ну ты и пидор, ",
  "Сегодня ты пидор, ",
  "Анализ завершен, сегодня ты пидор, ",
  "ВЖУХ И ТЫ ПИДОР, ",
  "Пидор дня обыкновенный, 1шт. - ",
  "Стоять! Не двигаться! Вы объявлены пидором дня, ",
  "И прекрасный человек дня сегодня... а нет, ошибка, всего-лишь пидор - ",
];


run();
