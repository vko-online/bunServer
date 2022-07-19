import { r } from 'rethinkdb-ts'

interface SearchQuery {
  lat: number
  lon: number
  distance?: number
}
interface FindQuery {
  id: string
}
export interface UserLocation {
  id: string
  online: boolean
  lat: number
  lon: number
}
interface Geometry {
  coordinates: [number, number]
  type: 'Point'
}
export interface UserLocationResponse {
  id: string
  online: boolean
  location: Geometry
}
interface UserLocationArrayResponse {
  dist: number
  doc: UserLocationResponse
}

const DB_NAME = 'bun_geolocation'
const DB_TABLE = 'bun_positions'

export async function initRethinkDB (): Promise<void> {
  await r.connectPool()
  await initDatabase()
  await initTable()
  await initIndex()
}

async function initDatabase (): Promise<void> {
  await r.dbList().contains(DB_NAME)
    .do(function (databaseExists: any) {
      return r.branch(
        databaseExists,
        { dbs_created: 0 },
        r.dbCreate(DB_NAME)
      )
    }).run()
}

async function initTable (): Promise<void> {
  await r.db(DB_NAME)
    .tableList()
    .contains(DB_TABLE)
    .do(function (tableExists: any) {
      return r.branch(
        tableExists,
        { tbl_created: 0 },
        r.db(DB_NAME).tableCreate(DB_TABLE)
      )
    }).run()
}

async function initIndex (): Promise<void> {
  await r.db(DB_NAME)
    .table(DB_TABLE)
    .indexList()
    .contains('location')
    .do(function (indexExist: any) {
      return r.branch(
        indexExist,
        { idx_created: 0 },
        r.db(DB_NAME).table(DB_TABLE).indexCreate('location', { geo: true })
      )
    }).run()
}

export async function findById ({ id }: FindQuery): Promise<UserLocationResponse | null> {
  const $r = r.db(DB_NAME).table(DB_TABLE)
  return await $r.get(id).run()
}

export async function findNearest ({ lat, lon, distance = 10 }: SearchQuery): Promise<UserLocationArrayResponse[]> {
  await r.db(DB_NAME).table(DB_TABLE).indexWait().run()
  const $r = r.db(DB_NAME).table(DB_TABLE)
  return await $r.getNearest(r.point(lat, lon), { index: 'location', unit: 'km', maxDist: distance }).run()
}

export async function addPosition (input: UserLocation): Promise<void> {
  const $r = r.db(DB_NAME).table(DB_TABLE)
  const existing = await $r.get(input.id).run()
  if (existing != null) {
    await $r.get(input.id).update({ online: input.online, location: r.point(input.lat, input.lon) }).run()
  } else {
    await $r.insert({
      id: input.id,
      online: input.online,
      location: r.point(input.lat, input.lon)
    }).run()
  }
}
