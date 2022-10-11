import os from 'os'
import ip from 'ip'
import ms from 'ms'
import bytes from 'bytes'
import v8 from 'v8'

export const healthReportHandler = async (_request, reply) => {
  reply.send({
    ip: ip.address(),
    freemem: bytes(os.freemem()),
    totalmem: bytes(os.totalmem()),
    maxOldSpaceSize: v8.getHeapStatistics().total_available_size / 1024 / 1024,
    nodeVersion: process.version,
    heapUsed: process.memoryUsage().heapUsed / 1024 / 1024,
    processUptime: ms(process.uptime() * 1000),
    osUptime: ms(os.uptime() * 1000),
    osTime: new Date().toISOString()
  })
}
