export const getAppUrl = (): string => {
  if (process.env.PORT === '80') {
    return `http://${process.env.HOST as string}`
  }
  if (process.env.PORT === '443') {
    // attach cert file
    return `https://${process.env.HOST as string}`
  }
  return `http://${process.env.HOST as string}:${process.env.PORT as string}`
}

export const getAppWsUrl = (): string => {
  if (process.env.PORT === '80') {
    return `ws://${process.env.HOST as string}`
  }
  if (process.env.PORT === '443') {
    // attach cert file
    return `wss://${process.env.HOST as string}`
  }
  return `ws://${process.env.HOST as string}:${process.env.WS_PORT as string}`
}
