import { Telegraf } from "telegraf";
import nconf from "nconf";
import { PrismaClient } from "@prisma/client";
import { marked } from 'marked';

nconf.file({ file: "config.json" });

const { bot_token: telegramApiKey } = nconf.get("telegram");

const prisma = new PrismaClient();

async function run() {
  const bot = new Telegraf(telegramApiKey);
  const { url: httpsHost, port: serverPort } = nconf.get("server");
  bot.telegram.setWebhook(`${httpsHost}/secret-path`);

  // @ts-expect-error fixme
  bot.startWebhook("/secret-path", null, serverPort);

  bot.command("init", async (ctx) => {
    // const chats = await prisma.chat.findMany();
    try {
      const chat = await prisma.chat.create({
        data: {
          telegramChatId: ctx.message.chat.id,
        },
      });
      ctx.telegram.sendMessage(ctx.message.chat.id, "ВЕЧЕР В ХАТУ");
    } catch (error) {
      ctx.telegram.sendMessage(ctx.message.chat.id, "ИГРА УЖЕ НАЧАЛАСЬ");
    }
  });

  bot.command("cock", async (ctx) => {
    const chat = await prisma.chat.findFirst({
      where: { telegramChatId: ctx.message.chat.id },
    });

    if (chat !== null) {
      const date = Date.now() / 1000 - 86400;
      const lastChatPidor = await prisma.chatPidors.findMany({
        where: {
          chatId: chat.id,
          assignedAt: {
            gte: new Date(getDate()),
          },
        },
        include: {
          pidor: true,
        },
      });

      const pidorCount = await prisma.pidor.count({
        where: { chat: { id: chat.id } },
      });

      console.log(pidorCount);

      const skip = Math.floor(Math.random() * pidorCount);
      const pidors = await prisma.pidor.findMany({
        skip: skip,
        where: { chatId: chat.id },
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
          const resultPhrase =
            resultPhrases[Math.floor(Math.random() * resultPhrases.length)];

          const awaitTimeout = (delay: number | undefined) =>
            new Promise((resolve) => setTimeout(resolve, delay));

          const f = async () => {
            await awaitTimeout(300);
            console.log("Hi"); // Logs 'Hi' after 300ms
          };


          ctx.telegram.sendMessage(ctx.message.chat.id, teasePhrase[0]);
          setTimeout(() => ctx.telegram.sendMessage(ctx.message.chat.id, teasePhrase[1]), 2000);
          setTimeout(() => ctx.telegram.sendMessage(ctx.message.chat.id, teasePhrase[2]), 4000);

          setTimeout(() => {
            ctx.telegram.sendMessage(
              ctx.message.chat.id,
              `${resultPhrase} <a href="tg://user?id=${pidors[0].telegramId}">${pidors[0].userName ?? pidors[0].name}</a>
                `,
              { parse_mode: "HTML" });
          }, 6000)

        } else {
          ctx.telegram.sendMessage(
            ctx.message.chat.id,
            "Никто не зарегистрировался для петуха дня /cockreg"
          );
        }
      } else {
        ctx.telegram.sendMessage(
          ctx.message.chat.id,
          `У нас уже есть петух дня <a href="tg://user?id=${lastChatPidor[0].pidor?.telegramId}">${lastChatPidor[0].pidor?.userName ?? lastChatPidor[0].pidor?.name}</a>`,
          { parse_mode: "HTML" }
        );
      }
    } else {
      ctx.telegram.sendMessage(
        ctx.message.chat.id,
        "Ну ты тупой, сначала команду /init напиши...."
      );
    }
  });
  bot.command("cockreg", async (ctx, next) => {
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
  bot.command("cockstat", async (ctx) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);

    try {
      const pidors = await prisma.pidor.findMany({
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

      let message = "Топ *петухов* этого чатика: \n\n";
      pidors.map((item, index) => {
        message += ` ${index + 1}. ${item.name} ([${item.userName ?? item.name}](tg://user?id=${item.telegramId})) - ${item._count.pidor
          } ${declOfNum(item._count.pidor, ["раз", "раза", "раз"])}\n`;
      });
      ctx.telegram
        .sendMessage(ctx.message.chat.id, marked.parseInline(message), { parse_mode: "HTML" })
        .then(() => {
          const sticker = stickers[Math.floor(Math.random() * stickers.length)];
          ctx.telegram.sendSticker(ctx.message.chat.id, sticker);
          const prov = proverd[Math.floor(Math.random() * proverd.length)];
          ctx.telegram.sendMessage(ctx.message.chat.id, prov);

        });
    } catch (err) {
      console.log("err", err);
    }
  });

  bot.command("cockpos", async (ctx) => {
    const prov = proverd[Math.floor(Math.random() * proverd.length)];
    ctx.telegram.sendMessage(ctx.message.chat.id,  marked.parseInline(prov), { parse_mode: "HTML" });
  })
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
    "Инициирую поиск петуха дня...",
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
  "А вот и петух - ",
  "Вот ты и петух, ",
  "Ну ты и петух, ",
  "Сегодня ты петух, ",
  "Анализ завершен, сегодня ты петух, ",
  "ВЖУХ И ТЫ ПЕТУХ, ",
  "Петух дня обыкновенный, 1шт. - ",
  "Стоять! Не двигаться! Вы объявлены петухом дня, ",
  "И прекрасный человек дня сегодня... а нет, ошибка, всего-лишь петух - ",
];

const proverd = [
  "Петуху ячменное зернышко жемчужины дороже.", 
  "Петушьим гребнем голову не расчешешь.", 
  "У кого счастье поведётся, у того и петух несется.", 
  "Наш петушок не нажил гребешок, а туда же кукарекает.", 
  "Молодой петух поёт так, как от старого слышал.", 
  "Петух прокукарекал – а там, хоть не рассветай.", 
  "С курами ложится, с петухами встаёт.", 
  "Петух скажет курице, а она всей улице.", 
  "Петух рад лету, пчела – цвету.",
  "Чужие петухи поют, а на наш типун напал.",
  "Петуха на зарез несут, а он кричит кукареку.",
  "Петух пробуждается рано; но злодей ещё раньше.", 
  "Всяк петух на своём пепелище хозяин.", 
  "И петух знает, кто на него лает.", 
  "Курице не петь петухом.", 
  "Силёнка, что у цыплёнка.", 
  "Цыплят по осени считают"
];

const getDate = (givenDate = new Date()): string => {
  const offset = givenDate.getTimezoneOffset();
  givenDate = new Date(givenDate.getTime() - offset * 60 * 1000);
  return givenDate.toISOString().split('T')[0];
};

run();
