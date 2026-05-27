const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const play = require("play-dl");

class MusicQueue {
  constructor(guildId, textChannel, voiceChannel, connection) {
    this.guildId = guildId;
    this.textChannel = textChannel;
    this.voiceChannel = voiceChannel;
    this.connection = connection;
    this.songs = [];
    this.volume = 0.5;
    this.loop = false;
    this.loopQueue = false;
    this.playing = false;

    this.player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });

    this.connection.subscribe(this.player);

    this.player.on(AudioPlayerStatus.Idle, () => {
      if (this.loop && this.songs.length > 0) {
        this.play(this.songs[0]);
        return;
      }

      if (this.loopQueue && this.songs.length > 0) {
        const finished = this.songs.shift();
        this.songs.push(finished);
        if (this.songs.length > 0) this.play(this.songs[0]);
        return;
      }

      this.songs.shift();
      if (this.songs.length > 0) {
        this.play(this.songs[0]);
      } else {
        this.playing = false;
        this.textChannel.send("✅ Queue finished! Add more songs with `/play`.");
      }
    });

    this.player.on("error", (error) => {
      console.error("Player error:", error);
      this.textChannel.send(`❌ Error playing audio: ${error.message}`);
      this.songs.shift();
      if (this.songs.length > 0) this.play(this.songs[0]);
    });

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
      }
    });
  }

  async play(song) {
    try {
      this.playing = true;
      const stream = await play.stream(song.url, { quality: 2 });
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });
      resource.volume.setVolume(this.volume);
      this.currentResource = resource;
      this.player.play(resource);
    } catch (error) {
      console.error("Stream error:", error);
      this.textChannel.send(`❌ Could not stream: **${song.title}**. Skipping...`);
      this.songs.shift();
      if (this.songs.length > 0) this.play(this.songs[0]);
      else this.playing = false;
    }
  }

  setVolume(vol) {
    this.volume = vol / 100;
    if (this.currentResource?.volume) {
      this.currentResource.volume.setVolume(this.volume);
    }
  }

  skip() {
    this.player.stop(true);
  }

  pause() {
    return this.player.pause();
  }

  resume() {
    return this.player.unpause();
  }

  destroy() {
    this.songs = [];
    this.playing = false;
    if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
      this.connection.destroy();
    }
  }

  shuffle() {
    if (this.songs.length <= 1) return false;
    const current = this.songs.shift();
    for (let i = this.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
    }
    this.songs.unshift(current);
    return true;
  }
}

module.exports = MusicQueue;
