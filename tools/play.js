export default async function play(guild, song, options) {
  const player = options.shoukaku.getPlayer(guild.id)
  const serverQueue = options.queue.get(guild.id)

  if (serverQueue.loopType == 2) {
    song = serverQueue.loopSongs[0]
    serverQueue.songs.unshift(song)
  }

  if (!song) {
    if (serverQueue.loopType == 1) {
      serverQueue.songs = [...serverQueue.loopSongs]
      song = serverQueue.songs[0]
      //console.log(serverQueue, song)
    } else {
      if (!options.enable247List.has(guild.id) && player)
      player.disconnect()
    
      options.queue.delete(guild.id)
      return console.log(`${guild.shardID}/${guild.id} закончил воспроизводить треки`)
    }
  }

  const node = options.shoukaku.getNode()
  const rest = node.rest

  rest.resolve(song.url)
    .then(songResolved => {
      if (songResolved) {
        player.playTrack(songResolved.tracks[0].track)
      } else {
        serverQueue.loopType = 0
        serverQueue.loopSongs = []
        console.log(`${guild.id} resolve empty`)
        serverQueue.songs.shift()
        const newSong = serverQueue.songs[0]
        play(guild, newSong, options)
        if (serverQueue.textChannel)
          serverQueue.textChannel.send(`Ошибка воспроизведения трека. Возможно, с момента добавления трека прошло больше суток. \`${song.artist} — ${song.title}\` пропущен.`)
      }
    })
    .catch(() => {
      console.log(`${guild.id} resolve err`)
      serverQueue.loopType = 0
      serverQueue.loopSongs = []
      serverQueue.songs.shift()
      const newSong = serverQueue.songs[0]
      play(guild, newSong, options)
      if (serverQueue.textChannel)
        serverQueue.textChannel.send(`Ошибка воспроизведения трека. Возможно, трек всё ещё не релизнулся. \`${song.artist} — ${song.title}\` пропущен.`)
    })
}