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

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('?')) {
    const userInput = message.content.slice(1).trim();
    
    if (!userInput) {
      await message.channel.send("Please provide a message after the ? command.");
      return;
    }

    try {
      const result = await model.generateContent(userInput);
      const response = await result.response;
      await message.channel.send(response.text());
    } catch (error) {
      console.error('Error:', error);
      await message.channel.send(`An error occurred: ${error.message}`);
    }
  }
});

let isInitialized = false;

exports.discordBot = functions.runWith({
  timeoutSeconds: 540,
  memory: '1GB'
}).https.onRequest(async (request, response) => {
  if (!isInitialized) {
    await client.login(functions.config().discord.token);
    isInitialized = true;
    response.send('Discord bot is now running!');
  } else {
    response.send('Discord bot is already running!');
  }
});

exports.keepAlive = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  if (!isInitialized) {
    await client.login(functions.config().discord.token);
    isInitialized = true;
    console.log('Discord bot initialized from scheduled function');
  }
  console.log('Keep alive triggered');
  return null;
});