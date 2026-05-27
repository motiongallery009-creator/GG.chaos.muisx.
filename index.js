require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");

const playCmd = require("./commands/play");
const controls = require("./commands/controls");

// Map of guildId → MusicQueue
const queues = new Map();

// Build command collection
const commands = new Collection();
const allCommands = [
  playCmd,
  controls.skip,
  controls.pause,
  controls.resume,
  controls.stop,
  controls.queue,
  controls.nowplaying,
  controls.volume,
  controls.loop,
  controls.shuffle,
  controls.remove,
  controls.clear,
];
for (const cmd of allCommands) {
  commands.set(cmd.data.name, cmd);
}

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setActivity("🎵 /play to start music!");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, queues);
  } catch (err) {
    console.error(`Error in /${interaction.commandName}:`, err);
    const msg = { content: "❌ An error occurred!", ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

// Clean up queue when bot is kicked from VC
client.on("voiceStateUpdate", (oldState, newState) => {
  const botId = client.user.id;
  if (oldState.id === botId && !newState.channelId) {
    const queue = queues.get(oldState.guildId);
    if (queue) {
      queue.songs = [];
      queue.playing = false;
      queues.delete(oldState.guildId);
    }
  }

  // Auto-disconnect if bot is alone in VC
  if (oldState.channelId) {
    const channel = oldState.channel;
    if (!channel) return;
    const botInChannel = channel.members.has(botId);
    if (botInChannel && channel.members.size === 1) {
      const queue = queues.get(oldState.guildId);
      if (queue) {
        setTimeout(() => {
          const ch = oldState.guild.channels.cache.get(channel.id);
          if (ch && ch.members.size === 1 && ch.members.has(botId)) {
            queue.textChannel.send("👋 Left the voice channel — everyone left!");
            queue.destroy();
            queues.delete(oldState.guildId);
          }
        }, 30_000); // Wait 30s before disconnecting
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
