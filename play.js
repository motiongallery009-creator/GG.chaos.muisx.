const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const play = require("play-dl");
const MusicQueue = require("../MusicQueue");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from YouTube")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("Song name or YouTube URL").setRequired(true)
    ),

  async execute(interaction, queues) {
    await interaction.deferReply();

    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply("❌ You need to be in a voice channel!");
    }

    const botMember = interaction.guild.members.me;
    const perms = voiceChannel.permissionsFor(botMember);
    if (!perms.has("Connect") || !perms.has("Speak")) {
      return interaction.editReply("❌ I don't have permission to join/speak in your voice channel!");
    }

    const query = interaction.options.getString("query");

    let songInfo;
    try {
      if (play.yt_validate(query) === "video") {
        const results = await play.video_info(query);
        songInfo = results.video_details;
      } else if (play.yt_validate(query) === "playlist") {
        return interaction.editReply("📋 Use `/playlist` to play playlists!");
      } else {
        const results = await play.search(query, { limit: 1 });
        if (!results.length) return interaction.editReply("❌ No results found!");
        songInfo = results[0];
      }
    } catch (err) {
      console.error(err);
      return interaction.editReply("❌ Error searching for that song.");
    }

    const song = {
      title: songInfo.title,
      url: songInfo.url,
      duration: songInfo.durationRaw || "Live",
      thumbnail: songInfo.thumbnails?.[0]?.url || null,
      requestedBy: interaction.user.tag,
    };

    let queue = queues.get(interaction.guildId);

    if (!queue) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      queue = new MusicQueue(
        interaction.guildId,
        interaction.channel,
        voiceChannel,
        connection
      );
      queues.set(interaction.guildId, queue);

      queue.songs.push(song);
      await queue.play(song);

      const embed = new EmbedBuilder()
        .setColor(0x1db954)
        .setTitle("🎵 Now Playing")
        .setDescription(`**[${song.title}](${song.url})**`)
        .addFields(
          { name: "Duration", value: song.duration, inline: true },
          { name: "Requested by", value: song.requestedBy, inline: true }
        )
        .setThumbnail(song.thumbnail)
        .setFooter({ text: "Music Bot" });

      return interaction.editReply({ embeds: [embed] });
    }

    queue.songs.push(song);
    const position = queue.songs.length;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("➕ Added to Queue")
      .setDescription(`**[${song.title}](${song.url})**`)
      .addFields(
        { name: "Duration", value: song.duration, inline: true },
        { name: "Position", value: `#${position}`, inline: true },
        { name: "Requested by", value: song.requestedBy, inline: true }
      )
      .setThumbnail(song.thumbnail);

    return interaction.editReply({ embeds: [embed] });
  },
};
