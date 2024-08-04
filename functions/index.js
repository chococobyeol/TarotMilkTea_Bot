const functions = require('firebase-functions');
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

const genAI = new GoogleGenerativeAI(functions.config().gemini.key);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const tarotCards = [
  '바보', '마법사', '여사제', '여제', '황제', '교황', '연인', '전차',
  '힘', '은둔자', '운명의 수레바퀴', '정의', '매달린 사람', '죽음', '절제',
  '악마', '탑', '별', '달', '태양', '심판', '세계'
];

const tarotCardFiles = {
  '바보': 'tarot_fool.png',
  '마법사': 'tarot_magician.png',
  '여사제': 'tarot_high_priestess.png',
  '여제': 'tarot_empress.png',
  '황제': 'tarot_emperor.png',
  '교황': 'tarot_hierophant.png',
  '연인': 'tarot_lovers.png',
  '전차': 'tarot_chariot.png',
  '힘': 'tarot_strength.png',
  '은둔자': 'tarot_hermit.png',
  '운명의 수레바퀴': 'tarot_wheel_of_fortune.png',
  '정의': 'tarot_justice.png',
  '매달린 사람': 'tarot_hanged_man.png',
  '죽음': 'tarot_death.png',
  '절제': 'tarot_temperance.png',
  '악마': 'tarot_devil.png',
  '탑': 'tarot_tower.png',
  '별': 'tarot_star.png',
  '달': 'tarot_moon.png',
  '태양': 'tarot_sun.png',
  '심판': 'tarot_judgement.png',
  '세계': 'tarot_world.png'
};

const greetings = [
  "안녕하세요. 타로 카드를 한 번 봐드릴까요?",
  "무슨 고민이 있으신 것 같네요. 타로로 한 번 살펴볼까요?",
  "오늘의 운세가 궁금하신가요? 카드 한 장 뽑아보시겠어요?",
  "반갑습니다. 오늘 운세가 궁금하신 것 같아요. 타로 한 번 볼까요?",
  "어서 오세요. 무슨 일이 있으신 것 같네요. 타로로 한 번 봐드릴게요."
];

// 서버별, 사용자별 사용된 카드를 추적하기 위한 맵
const usedCardsByGuildUser = new Map();

// 서버별, 사용자별 대화 컨텍스트를 유지하기 위한 맵
const userContexts = new Map();

// 최대 저장할 대화 기록 수
const MAX_CONTEXT_HISTORY = 10;

function getUniqueKey(guildId, userId) {
  return `${guildId}-${userId}`;
}

function getRandomCards(count, guildId, userId) {
  const key = getUniqueKey(guildId, userId);
  if (!usedCardsByGuildUser.has(key)) {
    usedCardsByGuildUser.set(key, new Set());
  }
  const usedCards = usedCardsByGuildUser.get(key);
  
  const availableCards = tarotCards.filter(card => !usedCards.has(card));
  
  if (availableCards.length < count) {
    usedCards.clear();
  }
  
  const shuffled = availableCards.sort(() => 0.5 - Math.random());
  const selectedCards = shuffled.slice(0, count);
  
  selectedCards.forEach(card => usedCards.add(card));
  
  return selectedCards;
}

function updateUserContext(guildId, userId, newContext) {
  const key = getUniqueKey(guildId, userId);
  let context = userContexts.get(key) || [];
  context.push(newContext);
  if (context.length > MAX_CONTEXT_HISTORY) {
    context = context.slice(-MAX_CONTEXT_HISTORY);
  }
  userContexts.set(key, context);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('?')) return;

  const userInput = message.content.slice(1).trim().toLowerCase();
  
  if (userInput === '넌 누구야' || userInput === '누구세요') {
    await message.reply("안녕하세요. 저는 타로리더이자 영적 가이드인 타로밀크티입니다. 어떻게 도와드릴 수 있을까요? 지금 삶에서 어떤 어려움이나 질문이 있나요? 타로 읽기는 현명하고 깊은 통찰력을 제공하여 삶의 길을 밝혀줄 수 있는 강력한 도구가 될 수 있습니다.");
    return;
  }

  if (/타로|운세|점|카드|fortune|tarot/.test(userInput) || userInput === '뭐해') {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('three_card_spread')
          .setLabel('3장 스프레드')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('single_card')
          .setLabel('단일 카드')
          .setStyle(ButtonStyle.Secondary),
      );

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    try {
      await message.reply({
        content: greeting,
        components: [row],
      });
    } catch (error) {
      console.error('Error sending message:', error);
      await message.reply('죄송합니다. 잠시 문제가 있었네요. 다시 한 번 말씀해 주시겠어요?');
    }
  } else {
    try {
      const chat = await model.startChat();
      const response = await chat.sendMessage(`다음 메시지에 대해 타로밀크티라는 이름의 타로리더로서 따뜻하고 공손한 말투로 대답해주세요. 가능하다면 자연스럽게 타로 점을 제안해보세요: ${userInput}`);
      await message.reply(response.response.text());
    } catch (error) {
      console.error('Error in chat:', error);
      await message.reply('죄송합니다. 잠시 생각이 흐려졌네요. 다시 한 번 말씀해 주시겠어요?');
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === 'end_session') {
        await interaction.update({
          content: interaction.message.content + "\n\n타로 상담이 종료되었습니다. 감사합니다!",
          components: [],
        });
        return;
      }

      const modal = new ModalBuilder()
        .setCustomId(interaction.customId === 'three_card_spread' ? 'tarot_question_three' : 'tarot_question_single')
        .setTitle('타로 카드 질문');

      const questionInput = new TextInputBuilder()
        .setCustomId('tarot_question')
        .setLabel('어떤 점을 보고 싶으신가요?')
        .setStyle(TextInputStyle.Paragraph);

      const actionRow = new ActionRowBuilder().addComponents(questionInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    } else if (interaction.isModalSubmit()) {
      await interaction.deferReply();

      const question = interaction.fields.getTextInputValue('tarot_question');
      let selectedCards;
      
      if (interaction.customId === 'tarot_question_three') {
        selectedCards = getRandomCards(3, interaction.guildId, interaction.user.id);
      } else {
        selectedCards = getRandomCards(1, interaction.guildId, interaction.user.id);
      }

      const embeds = [];
      const files = [];

      for (const card of selectedCards) {
        const fileName = tarotCardFiles[card];
        if (fileName) {
          const filePath = path.join(__dirname, 'tarot_images', fileName);
          if (fs.existsSync(filePath)) {
            const attachment = new AttachmentBuilder(filePath, { name: fileName });
            files.push(attachment);

            const embed = new EmbedBuilder()
              .setTitle(card)
              .setImage(`attachment://${fileName}`);
            
            // 3장 스프레드일 경우 이미지 크기 조정
            if (selectedCards.length === 3) {
              embed.setImage(`attachment://${fileName}?width=200&height=350`);
            }
            
            embeds.push(embed);
          } else {
            console.error(`Image file not found: ${filePath}`);
          }
        }
      }

      const key = getUniqueKey(interaction.guildId, interaction.user.id);
      const userContext = userContexts.get(key) || [];
      
      const chat = await model.startChat();
      for (const context of userContext) {
        await chat.sendMessage(context);
      }
      
      const interpretation = await chat.sendMessage(
        `다음은 타로 카드 점괘입니다. 질문: "${question}", 뽑은 카드: ${selectedCards.join(', ')}. ` +
        `이 카드들이 질문에 대해 어떤 의미를 가지는지 따뜻하고 공손한 말투로 해석해주세요. 각 카드의 의미와 전체적인 해석을 제공해주세요. ` +
        `해석 끝에 추가 질문 유도 문구는 넣지 마세요.`
      );

      updateUserContext(interaction.guildId, interaction.user.id, `질문: ${question}\n카드: ${selectedCards.join(', ')}\n해석: ${interpretation.response.text()}`);

      let responseText = `"${question}"이라고 물어보셨군요.\n\n**뽑은 카드:**\n${selectedCards.join('\n')}\n\n**해석:**\n${interpretation.response.text()}\n\n타로 상담이 도움이 되셨다면, 아래 링크를 통해 후원해 주시면 감사하겠습니다. 여러분의 후원은 더 나은 서비스를 제공하는 데 큰 힘이 됩니다.\n\n[☕ 타로밀크티에게 커피 한 잔 사주기](https://www.buymeacoffee.com/chococo)`;

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('follow_up_question')
            .setLabel('추가 질문하기')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('end_session')
            .setLabel('상담 종료하기')
            .setStyle(ButtonStyle.Secondary)
        );

      if (files.length > 0) {
        await interaction.editReply({
          content: responseText,
          embeds: embeds,
          files: files,
          components: [row],
        });
      } else {
        await interaction.editReply({
          content: responseText + "\n\n(이미지를 표시하는 데 문제가 발생했습니다.)",
          components: [row],
        });
      }
    } else if (interaction.isButton() && interaction.customId === 'follow_up_question') {
      const modal = new ModalBuilder()
        .setCustomId('follow_up_modal')
        .setTitle('추가 질문');

      const questionInput = new TextInputBuilder()
        .setCustomId('follow_up_question_input')
        .setLabel('추가로 어떤 점이 궁금하신가요?')
        .setStyle(TextInputStyle.Paragraph);

      const actionRow = new ActionRowBuilder().addComponents(questionInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'follow_up_modal') {
      await interaction.deferReply();

      const followUpQuestion = interaction.fields.getTextInputValue('follow_up_question_input');

      const key = getUniqueKey(interaction.guildId, interaction.user.id);
      const userContext = userContexts.get(key) || [];

      const chat = await model.startChat();
      for (const context of userContext) {
        await chat.sendMessage(context);
      }

      const spreadDecision = await chat.sendMessage(
        `다음 추가 질문에 대해 3장 스프레드와 단일 카드 중 어느 것이 더 적합한지 판단해주세요. 판단 이유도 함께 제시해주세요: "${followUpQuestion}"`
      );

      let selectedCards;
      if (spreadDecision.response.text().toLowerCase().includes('3장 스프레드')) {
        selectedCards = getRandomCards(3, interaction.guildId, interaction.user.id);
      } else {
        selectedCards = getRandomCards(1, interaction.guildId, interaction.user.id);
      }

      const embeds = [];
      const files = [];

      for (const card of selectedCards) {
        const fileName = tarotCardFiles[card];
        if (fileName) {
          const filePath = path.join(__dirname, 'tarot_images', fileName);
          if (fs.existsSync(filePath)) {
            const attachment = new AttachmentBuilder(filePath, { name: fileName });
            files.push(attachment);

            const embed = new EmbedBuilder()
              .setTitle(card)
              .setImage(`attachment://${fileName}`);
            
            // 3장 스프레드일 경우 이미지 크기 조정
            if (selectedCards.length === 3) {
              embed.setImage(`attachment://${fileName}?width=200&height=350`);
            }
            
            embeds.push(embed);
          } else {
            console.error(`Image file not found: ${filePath}`);
          }
        }
      }

      const interpretation = await chat.sendMessage(
        `다음은 추가 타로 카드 점괘입니다. 질문: "${followUpQuestion}", 뽑은 카드: ${selectedCards.join(', ')}. ` +
        `이 카드들이 질문에 대해 어떤 의미를 가지는지 따뜻하고 공손한 말투로 해석해주세요. 각 카드의 의미와 전체적인 해석을 제공해주세요.`
      );

      updateUserContext(interaction.guildId, interaction.user.id, `추가 질문: ${followUpQuestion}\n카드: ${selectedCards.join(', ')}\n해석: ${interpretation.response.text()}`);

      let responseText = `"${followUpQuestion}"이라고 추가로 물어보셨군요.\n\n**뽑은 카드:**\n${selectedCards.join('\n')}\n\n**해석:**\n${interpretation.response.text()}\n\n타로 상담이 도움이 되셨다면, 아래 링크를 통해 후원해 주시면 감사하겠습니다. 여러분의 후원은 더 나은 서비스를 제공하는 데 큰 힘이 됩니다.\n\n[☕ 타로밀크티에게 커피 한 잔 사주기](https://www.buymeacoffee.com/chococo)`;

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('follow_up_question')
            .setLabel('추가 질문하기')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('end_session')
            .setLabel('상담 종료하기')
            .setStyle(ButtonStyle.Secondary)
        );

      if (files.length > 0) {
        await interaction.editReply({
          content: responseText,
          embeds: embeds,
          files: files,
          components: [row],
        });
      } else {
        await interaction.editReply({
          content: responseText + "\n\n(이미지를 표시하는 데 문제가 발생했습니다.)",
          components: [row],
        });
      }
    }
  } catch (error) {
    console.error('Error in interaction:', error);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('죄송합니다. 일시적인 문제가 발생했네요. 잠시 후에 다시 시도해 주시겠어요?');
      } else {
        await interaction.reply({ content: '죄송합니다. 일시적인 문제가 발생했네요. 잠시 후에 다시 시도해 주시겠어요?', ephemeral: true });
      }
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
});

exports.discordBot = functions.runWith({
  timeoutSeconds: 540,
  memory: '2GB'
}).https.onRequest(async (request, response) => {
  if (!client.isReady()) {
    await client.login(functions.config().discord.token);
    console.log('Discord bot started and logged in');
    response.send('Discord bot is now running!');
  } else {
    console.log('Discord bot already running');
    response.send('Discord bot is already running!');
  }
});

exports.keepAlive = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  if (!client.isReady()) {
    await client.login(functions.config().discord.token);
    console.log('Discord bot initialized from scheduled function');
  }
  console.log('Keep alive triggered');
  return null;
});