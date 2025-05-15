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

// Queue system - stores queues for each guild
const queues = new Map();

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// Create the slash commands
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
  new SlashCommandBuilder().setName('skip').setDescription('Skip the current song').toJSON(),
  new SlashCommandBuilder().setName('queue').setDescription('Show the current queue').toJSON(),
];

// Function to play next song in queue
async function playNext(guildId, interaction) {
  const queue = queues.get(guildId);
  if (!queue || queue.length === 0) {
    const connection = getVoiceConnection(guildId);
    if (connection) {
      connection.destroy();
    }
    return;
  }

  const url = queue[0]; // Get the first song in queue
  const connection = getVoiceConnection(guildId);

  if (!connection) {
    queues.delete(guildId);
    return;
  }

  try {
    // Create an audio player if it doesn't exist
    let player = connection.state.subscription?.player;
    if (!player) {
      player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play,
        },
      });

      // Add error handling for the player
      player.on('error', (error) => {
        console.error('Error in audio player:', error);
        interaction.channel.send('There was an error playing the audio!').catch(console.error);
      });

      // Add state change logging and handle next song
      player.on('stateChange', (oldState, newState) => {
        console.log(`Audio player state changed from ${oldState.status} to ${newState.status}`);
        if (
          newState.status === AudioPlayerStatus.Idle &&
          oldState.status !== AudioPlayerStatus.Idle
        ) {
          // Remove the song that just finished
          queue.shift();
          // Play next song if there is one
          playNext(guildId, interaction);
        }
      });

      connection.subscribe(player);
    }

    // Get the audio stream
    const stream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
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
      resource.volume.setVolume(0.4);
    }

    // Play the audio
    player.play(resource);
  } catch (error) {
    console.error('Error in playNext:', error);
    queue.shift(); // Remove the problematic song
    interaction.channel.send('Error playing the current song, skipping...').catch(console.error);
    playNext(guildId, interaction); // Try playing the next song
  }
}

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

      // Get or create queue for this guild
      if (!queues.has(interaction.guildId)) {
        queues.set(interaction.guildId, []);
      }
      const queue = queues.get(interaction.guildId);

      // Add the URL to the queue
      queue.push(url);

      // If this is the first song, start playing
      if (queue.length === 1) {
        await interaction.reply(`Now playing: ${url}`);

        // Join the voice channel
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false,
        });

        // Start playing
        playNext(interaction.guildId, interaction);
      } else {
        // If song was added to queue, show position
        await interaction.reply(`Added to queue at position ${queue.length}`);
      }
    } catch (error) {
      console.error('Error in play command:', error);
      await interaction.reply('There was an error executing the command!');
    }
  }

  if (interaction.commandName === 'stop') {
    try {
      // Get the voice connection for this guild
      const connection = getVoiceConnection(interaction.guildId);

      if (!connection) {
        return interaction.reply("I'm not playing anything right now!");
      }

      // Clear the queue
      queues.delete(interaction.guildId);

      // Destroy the connection (this will also stop any playing audio)
      connection.destroy();
      await interaction.reply('Stopped playing and left the voice channel!');
    } catch (error) {
      console.error('Error stopping playback:', error);
      await interaction.reply('There was an error stopping the playback!');
    }
  }

  if (interaction.commandName === 'skip') {
    try {
      const queue = queues.get(interaction.guildId);
      if (!queue || queue.length === 0) {
        return interaction.reply('No songs in the queue!');
      }

      const connection = getVoiceConnection(interaction.guildId);
      if (!connection) {
        return interaction.reply("I'm not playing anything right now!");
      }

      // Get the player
      const player = connection.state.subscription?.player;
      if (player) {
        // Stop the current song, which will trigger the 'idle' state
        // and automatically play the next song
        player.stop();
        await interaction.reply('Skipped to the next song!');
      } else {
        await interaction.reply('No audio player found!');
      }
    } catch (error) {
      console.error('Error skipping song:', error);
      await interaction.reply('There was an error skipping the song!');
    }
  }

  if (interaction.commandName === 'queue') {
    try {
      const queue = queues.get(interaction.guildId);
      if (!queue || queue.length === 0) {
        return interaction.reply('No songs in the queue!');
      }

      const queueList = queue.map((url, index) => `${index + 1}. ${url}`).join('\n');

      await interaction.reply(`Current queue:\n${queueList}`);
    } catch (error) {
      console.error('Error showing queue:', error);
      await interaction.reply('There was an error showing the queue!');
    }
  }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
