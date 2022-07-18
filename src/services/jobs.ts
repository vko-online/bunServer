// https://github.com/node-cron/node-cron
import cron from 'node-cron'
// import { receiptCheck } from './expo-push'
import { currentlyOnlineRunner } from './job-runner'

export function startJobs (): void {
  // cron.schedule('*/30 * * * *', (): void => {
  //   receiptCheck()
  //     .then(() => console.log('receiptCheck completed'))
  //     .catch(console.warn)
  // })

  // every friday 18:00
  cron.schedule('* 0 18 * * Friday', (): void => {
    currentlyOnlineRunner()
      .then(() => console.log('currentlyOnlineRunner completed'))
      .catch(console.warn)
  }).start()
}
