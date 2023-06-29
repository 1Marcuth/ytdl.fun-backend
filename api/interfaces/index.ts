interface IVideoInfoBody {
    url: string
}

interface IDownloadVideoBody {
    url: string
    format: string
}

interface IDownloadAudioBody {
    url: string
}

export {
    IVideoInfoBody,
    IDownloadVideoBody,
    IDownloadAudioBody
}