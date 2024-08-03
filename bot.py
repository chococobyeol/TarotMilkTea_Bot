import discord
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f'We have logged in as {client.user}')

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    if message.content.startswith('?'):
        user_input = message.content[1:].strip()
        
        if not user_input:
            await message.channel.send("Please provide a message after the ? command.")
            return

        try:
            response = model.generate_content(user_input)
            await message.channel.send(response.text)
        except Exception as e:
            error_message = f"An error occurred: {str(e)}"
            print(error_message)
            await message.channel.send(error_message)

# Use the bot token from environment variable
token = os.getenv('DISCORD_BOT_TOKEN')
if token:
    print("Token loaded successfully")
    client.run(token)
else:
    print("Failed to load Discord bot token")