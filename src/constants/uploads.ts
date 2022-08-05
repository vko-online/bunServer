import path from 'path'
import { getAppUrl } from './env'

export const UPLOADS_PATH = path.join(process.cwd(), process.env.UPLOADS_DIR as string)
export const UPLOADS_URL = (name: string): string => new URL(`${process.env.UPLOADS_DIR as string}/${name}`, getAppUrl()).toString()
export const UPLOADS_PATH_ABS = (name: string): string => path.join(UPLOADS_PATH, name)
