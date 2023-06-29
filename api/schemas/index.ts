import { z } from "zod"

const infoSchema = z.object({
    url: z.string().url()
})
const downloadVideoSchema = z.object({
    url: z.string().url(),
    format: z.string()
})

const downloadAudioSchema = z.object({
    url: z.string().url()
})

export {
    infoSchema,
    downloadVideoSchema,
    downloadAudioSchema
}