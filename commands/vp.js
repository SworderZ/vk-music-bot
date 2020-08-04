import { audioGetOne } from '../vkapi'
import { Duration } from 'luxon'
import play from '../tools/play'

export default {
  name: "vp",
  description: "Включить музыку по названию или по ID",
  cooldown: 4,
  execute: async function(message, args, options) {
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы включить музыку.')
  
    const permissions = voiceChannel.permissionsFor(message.client.user)
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return message.reply('мне нужны права чтобы играть музыку!')
    }
  
    const query = args.join(" ").trim()
    if (query.length < 3) return message.reply("слишком короткий запрос.")

    const res = await audioGetOne(query, options.captcha, options.http)
    
    if (res.status == "error") {
      if (res.type == "empty") return message.reply("не могу найти трек.")
  
      if (res.type == "captcha") {
        options.captchas.set(message.member.id, {
          type: "vp",
          args: args,
          url: res.data.captcha_img,
          sid: res.data.captcha_sid
        })
        const captcha = options.captchas.get(message.member.id)
        return message.reply(`прежде чем выполнить данный запрос, вы должны ввести капчу! Введите \`-vcaptcha <текст_с_картинки>\`. ${captcha.url}`)
      }

      return message.reply("ошибка.")
    }
  
    const song = res.songInfo
  
    const songEmbed = {
      color: 0x5181b8,
      title: song.title,
      author: {
        name: "Трек добавлен!"
      },
      description: song.artist,
      fields: [
        {
          name: 'Длительность',
          value: Duration.fromObject({seconds: song.duration}).toFormat("mm:ss")
        },
      ]
    }
  
    if (!options.serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
      }
  
      options.queue.set(message.guild.id, queueContruct)
  
      queueContruct.songs.push(song)
      message.channel.send({embed: songEmbed})
  
      try {
        let connection = await voiceChannel.join()

        connection.on("disconnect", () => {
          options.queue.delete(message.guild.id)
        })

        queueContruct.connection = connection
        play(message.guild, queueContruct.songs[0], options)
      } catch (err) {
        console.log(err)
        options.queue.delete(message.guild.id)
        return message.channel.send(err)
      }
    } else {
      options.serverQueue.songs.push(song)
      return message.channel.send({embed: songEmbed})
    }
  
  }
}