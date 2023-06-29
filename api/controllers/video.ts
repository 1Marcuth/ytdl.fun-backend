import { Request, Response } from "express"
import sanitize from "sanitize-filename"
import ffmpeg from "fluent-ffmpeg"
import ytdl from "ytdl-core"
import axios from "axios"

import {
    infoSchema,
    downloadVideoSchema,
    downloadAudioSchema
} from "../schemas"

import {
    IVideoInfoBody,
    IDownloadVideoBody,
    IDownloadAudioBody
} from "../interfaces"

const controller = {
    async info(req: Request, res: Response) {
        let body: IVideoInfoBody

        try {
            body = infoSchema.parse(req.query)
        } catch(error) {
            console.log(error)

            return res.status(500).send({
                message: "Erro ao validadar os dados enviados à API."
            })
        }

        const videoInfo = await ytdl.getInfo(body.url)

        const formats = (
                await Promise.all(videoInfo.formats
                    .filter(format => format.audioChannels)
                    .map(async (format) => {
                        const videoInfo = {
                            quality: format.qualityLabel,
                            mimeType: format.mimeType,
                            fps: format.fps,
                            size: undefined,
                            fileExtension: format.container,
                            videoDownloadUrl: `/video/download-video?format=${format.itag}&url=${body.url}`,
                            audioDownloadUrl: `/video/download-audio?url=${body.url}`
                        }

                        try {
                            const response = await axios.head(format.url)
                            const contentLength = response.headers["content-length"]
                            videoInfo.size = contentLength
                        } catch (error) {
                            console.log("> [app] Erro ao obter o tamanho do arquivo: ", error)
                        }

                        return videoInfo
                })
            )
        ).filter(format => format.quality)
            
        const thumbnails = videoInfo.videoDetails.thumbnails
        const thumbnailUrl = thumbnails[thumbnails.length - 1].url

        const data = {
            title: videoInfo.videoDetails.title,
            formats: formats,
            description: videoInfo.videoDetails.description,
            thumbnailUrl: thumbnailUrl,
        }
        
        return res.status(200).send(data)
    },
    async downloadVideo(req: Request, res: Response) {
        let body: IDownloadVideoBody

        try {
            body = downloadVideoSchema.parse(req.query)
        } catch(error) {
            console.log(error)

            return res.status(500).send({
                message: "Erro ao validadar os dados enviados à API."
            })
        }

        try {
            const videoInfo = await ytdl.getInfo(body.url)
            const format = videoInfo.formats.find((format) => format.itag === Number(body.format))

            if (!format) {
                return res.status(400).send({
                    message: "Formato do vídeo não encontrado.",
                })
            }

            const videoReadableStream = ytdl(body.url, { 
                filter: "videoandaudio",
                format: format
            })

            const isAudioAndVideo = format.hasVideo && format.hasAudio

            if (!isAudioAndVideo) {
                return res.status(400).send({
                    message: "Formato do vídeo não suporta áudio e vídeo juntos."
                })
            }

            const title = sanitize(videoInfo.videoDetails.title)
            const siteName = "Ytdl.fun"
            const filename = `${siteName}_${title}.${format.container}`
            const mimeType = format.mimeType ?? "video/mp4"

            res.header("Content-Type", mimeType)
            res.header("Content-Disposition", `attachment; filename=${filename}`)

            return videoReadableStream.pipe(res)
        } catch (error) {
            console.log(error)

            return res.status(500).send({
                message: "Erro durante o download do vídeo."
            })
        }
    },
    async downloadAudio(req: Request, res: Response) {
        let body: IDownloadAudioBody

        try {
            body = downloadAudioSchema.parse(req.query)
        } catch(error) {
            console.log(error)

            return res.status(500).send({
                message: "Erro ao validadar os dados enviados à API."
            })
        }

        const videoInfo = await ytdl.getInfo(body.url)

        const title = sanitize(videoInfo.videoDetails.title)
        const siteName = "Ytdl.fun"
        const filename = `${siteName} - ${title}.mp3`
        const mimeType = "audio/mpeg"

        try {
            const videoReadableStream = ytdl(body.url, { filter: "audioonly" })

            res.header("Content-Type", mimeType)
            res.header("Content-Disposition", `attachment; filename=${filename}`)

            ffmpeg(videoReadableStream)
                .format("mp3")
                .audioBitrate(128)
                .pipe(res, { end: true })

        } catch (error) {
            console.log(error)

            res.status(500).send({
                message: "Erro durante o download do vídeo."
            })
        }
    }
}

export default controller