const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// Helper to check if user is in the same VC as bot
function checkVC(interaction, queues) {
  const queue = queues.get(interaction.guildId);
  if (!queue) return { error: "❌ I'm not playing anything right now!" };
  const vc = interaction.member.voice.channel;
  if (!vc || vc.id !== queue.voiceChannel.id)
    return { error: "❌ You need to be in my voice channel!" };
  return { queue };
}

// ── /skip ──────────────────────────────────────────────────────────────────
const skip = {
  data: new SlashCommandBuilder().setName("skip").setDescription("Skip the current song"),
  async execute(interaction, queues) {
    const { queue, error } = checkVC(interaction, queues);
    if (error) return interaction.reply({ content: error, ephemeral: true });
    queue.skip();
    interaction.reply("⏭️ Skipped!");
  },
};

// ── /pause ─────────────────────────────────────────────────────────────────
const pause = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Pause playback"),
  async execute(interaction, queues) {
    const { queue, error } = checkVC(interaction, queues);
    if (error) return interaction.reply({ content: error, ephemeral: true });
    const paused = queue.pause();
    interaction.reply(paused ? "⏸️ Paused!" : "❌ Already paused.");
  },
};

// ── /resume ────────────────────────────────────────────────────────────────
const resume = {
  data: new SlashCommandBuilder().setName("resume").setDescription("Resume playback"),
  async execute(interaction, queues) {
    const { queue, error } = checkVC(interaction, queues);
    if (error) return interaction.reply({ content: error, ephemeral: true });
    const resumed = queue.resume();
    interaction.reply(resumed ? "▶️ Resumed!" : "❌ Not paused.");
  },
};

// ── /stop ──────────────────────────────────────────────────────────────────
const stop = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Stop and disconnect"),
  async execute(interaction, queues) {
    const { queue, error } = checkVC(interaction, queues);
    if (error) return interaction.reply({ content: error, ephemeral: true });
    queue.destroy();
    queues.delete(interaction.guildId);
    interaction.reply("⏹️ Stopped and disconnected!");
  },
};

// ── /queue ─────────────────────────────────────────────────────────────────
const queue = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current queue")
    .addIntegerOption((opt) =>
      opt.setName("page").setDescription("Page number").setMinValue(1)
    ),
  async execute(interaction, queues) {
    const q = queues.get(interaction.guildId);
    if (!q || !q.songs.length)
      return interaction.reply("❌ The queue is empty!");

    const page = interaction.options.getInteger("page") || 1;
    const pageSize = 10;
    const totalPages = Math.ceil(q.songs.length / pageSize);
    const start = (page - 1) * pageSize;
    const pageSongs = q.songs.slice(start, start + pageSize);

    const desc = pageSongs
      .map((s, i) => {
        const idx = start + i;
        return `${idx === 0 ? "🎵 **Now:**" : `\`${idx}.\``} [${s.title}](${s.url}) — \`${s.duration}\``;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📋 Queue")
      .setDescription(desc)
      .setFooter({
        text: `Page ${page}/${totalPages} • ${q.songs.length} songs • Loop: ${q.loop ? "On" : "Off"} • Loop Queue: ${q.loopQueue ? "On" : "Off"}`,
      });

    interaction.reply({ embeds: [embed] });
  },
};

// ── /nowplaying ────────────────────────────────────────────────────────────
const nowplaying = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show the currently playing song"),
  async execute(interaction, queues) {
    const q = queues.get(interaction.guildId);
    if (!q || !q.songs.length)
      return interaction.reply("❌ Nothing is playing!");

    const song = q.songs[0];
    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle("🎵 Now Playing")
      .setDescription(`**[${song.title}](${song.url})**`)
      .addFields(
        { name: "Duration", value: song.duration, inline: true },
        { name: "Requested by", value: song.requestedBy, inline: true },
        { name: "Up next", value: q.songs[1]?.title || "Nothing", inline: true }
      )
      .setThumbnail(song.thumbnail);

    interaction.reply({ embeds: [embed] });
  },
};

// ── /volume ────────────────────────────────────────────────────────────────
const volume = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set playback volume (1-100)")
    .addIntegerOption((opt) =>
      opt
        .setName("level")
        .setDescription("Volume level (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),
  async execute(interaction, queues) {
    const { queue, error } = checkVC(interaction, queues);
    if (error) return interaction.reply({ content: error, ephemeral: true });
    const level = interaction.options.getInteger("level");
    queue.setVolume(level);
    interaction.reply(`🔊 Volume set to **${level}%**`);
  },
};

// ── /loop ──────────────────────────────────────────────────────────────────
const loop = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Toggle loop mode")
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Loop mode")
        .setRequired(true)
        .addChoices(
          { name: "Off", value: "off" },
          { name: "Song", value: "song" },
          { name: "Queue", value: "queue" }
        )
    ),
  async execute(interaction, queues) {
    const { queue, error } = checkVC(interaction, queues);
    if (error) return interaction.reply({ content: error, ephemeral: true });
    const mode = interaction.options.getString("mode");
    queue.loop = mode === "song";
    queue.loopQueue = mode === "queue";
    const labels = { off: "🚫 Loop Off", song: "🔂 Looping Song", queue: "🔁 Looping Queue" };
    interaction.reply(labels[mode]);
  },
};

// ── /shuffle ───────────────────────────────────────────────────────────────
const shuffle = {
  data: new SlashCommandBuilder().setName("shuffle").setDescription("Shuffle the queue"),
  async execute(interaction, queues) {
    const { queue, error } = checkVC(interaction, queues);
    if (error) return interaction.reply({ content: error, ephemeral: true });
    const ok = queue.shuffle();
    interaction.reply(ok ? "🔀 Queue shuffled!" : "❌ Not enough songs to shuffle.");
  },
};

// ── /remove ────────────────────────────────────────────────────────────────
const remove = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a song from the queue by position")
    .addIntegerOption((opt) =>
      opt
        .setName("position")
        .setDescription("Queue position (1 = next song)")
        .setMinValue(1)
        .setRequired(true)
    ),
  async execute(interaction, queues) {
    const { queue, error } = checkVC(interaction, queues);
    if (error) return interaction.reply({ content: error, ephemeral: true });
    const pos = interaction.options.getInteger("position");
    if (pos >= queue.songs.length)
      return interaction.reply("❌ Invalid position!");
    const removed = queue.songs.splice(pos, 1)[0];
    interaction.reply(`🗑️ Removed **${removed.title}** from the queue.`);
  },
};

// ── /clear ─────────────────────────────────────────────────────────────────
const clear = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear the queue (keeps current song)"),
  async execute(interaction, queues) {
    const { queue, error } = checkVC(interaction, queues);
    if (error) return interaction.reply({ content: error, ephemeral: true });
    if (queue.songs.length <= 1)
      return interaction.reply("❌ Queue is already empty!");
    const removed = queue.songs.length - 1;
    queue.songs = [queue.songs[0]];
    interaction.reply(`🗑️ Cleared **${removed}** songs from the queue.`);
  },
};

module.exports = { skip, pause, resume, stop, queue, nowplaying, volume, loop, shuffle, remove, clear };
