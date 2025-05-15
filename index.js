const {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  getVoiceConnection,
  AudioPlayerStatus,
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
require('dotenv').config();

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// Create the slash command
const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play audio from a YouTube URL')
    .addStringOption((option) =>
      option.setName('url').setDescription('The YouTube URL to play').setRequired(true)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playing and leave the voice channel')
    .toJSON(),
];

// Register slash commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
})();

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'play') {
    try {
      // Check if the user is in a voice channel
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        return interaction.reply('You need to be in a voice channel to use this command!');
      }

      // Get the URL from the command
      const url = interaction.options.getString('url');
      console.log('Attempting to play URL:', url);

      // Validate the URL
      if (!ytdl.validateURL(url)) {
        return interaction.reply('Please provide a valid YouTube URL!');
      }

      await interaction.reply(`Now playing: ${url}`);

      try {
        // Join the voice channel
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false,
        });

        // Create an audio player
        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play,
          },
        });

        // Add error handling for the player
        player.on('error', (error) => {
          console.error('Error in audio player:', error);
          interaction.followUp('There was an error playing the audio!').catch(console.error);
        });

        // Add state change logging
        player.on('stateChange', (oldState, newState) => {
          console.log(`Audio player state changed from ${oldState.status} to ${newState.status}`);
          if (newState.status === AudioPlayerStatus.Idle) {
            console.log('Playback finished, destroying connection');
            connection.destroy();
          }
        });

        // Subscribe the connection to the audio player
        connection.subscribe(player);

        // Get the audio stream
        const stream = ytdl(url, {
          filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1 << 25, // 32MB buffer
          requestOptions: {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          },
        });

        // Create audio resource from the stream
        const resource = createAudioResource(stream, {
          inputType: 'webm/opus',
          inlineVolume: true,
        });

        // Set a reasonable volume
        if (resource.volume) {
          resource.volume.setVolume(0.5);
        }

        // Play the audio
        player.play(resource);
      } catch (error) {
        console.error('Error in stream setup:', error);
        let errorMessage = 'There was an error playing the audio!';

        if (error.message?.includes('Could not extract')) {
          errorMessage =
            'Could not extract audio from this video. It might be restricted or unavailable.';
        }

        await interaction.followUp(errorMessage);
        const connection = getVoiceConnection(interaction.guildId);
        if (connection) {
          connection.destroy();
        }
      }
    } catch (error) {
      console.error('Error in play command:', error);
    }
  }

  if (interaction.commandName === 'stop') {
    try {
      // Get the voice connection for this guild
      const connection = getVoiceConnection(interaction.guildId);

      if (!connection) {
        return interaction.reply("I'm not playing anything right now!");
      }

      // Destroy the connection (this will also stop any playing audio)
      connection.destroy();
      await interaction.reply('Stopped playing and left the voice channel!');
    } catch (error) {
      console.error('Error stopping playback:', error);
      await interaction.reply('There was an error stopping the playback!');
    }
  }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
