const functions = require('firebase-functions');
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const genAI = new GoogleGenerativeAI(functions.config().gemini.key);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const conversationHistory = new Map();
const MAX_HISTORY_LENGTH = 10;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('?')) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const userInput = message.content.slice(1).trim();
    
    console.log(`Received command: ${userInput} from user: ${userId} in guild: ${guildId}`);
    
    if (!userInput) {
      await message.channel.send("Please provide a message after the ? command.");
      return;
    }

    const historyKey = `${guildId}_${userId}`;
    let userHistory = conversationHistory.get(historyKey) || [];
    userHistory.push({ role: 'user', parts: userInput });

    if (userHistory.length > MAX_HISTORY_LENGTH) {
      userHistory = userHistory.slice(-MAX_HISTORY_LENGTH);
    }

    try {
      console.log(`Processing request for user: ${userId}`);
      const chat = model.startChat({ history: userHistory });
      const result = await chat.sendMessage(userInput);
      const responseText = result.response.text();

      userHistory.push({ role: 'model', parts: responseText });
      conversationHistory.set(historyKey, userHistory);

      console.log(`Sending response to user: ${userId}`);
      await message.channel.send(responseText);
    } catch (error) {
      console.error('Error:', error);
      await message.channel.send(`An error occurred: ${error.message}`);
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