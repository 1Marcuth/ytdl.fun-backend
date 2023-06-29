import { Router } from "express"

import controller from "../controllers/video"

const router = Router()

router.get("/info", controller.info)
router.get("/download-video", controller.downloadVideo)
router.get("/download-audio", controller.downloadAudio)

export default router