import path from 'path'
import { getAppUrl } from './env'

export const UPLOADS_PATH = path.join(process.cwd(), process.env.UPLOADS_DIR as string)
export const UPLOADS_URL = (name: string): string => new URL(`uploads/${name}`, getAppUrl()).toString()
