import server from 'backend/server'
import { SERVER_PORT } from 'backend/config'

server.listen(SERVER_PORT, () => {
  console.log(`Listening on ${SERVER_PORT} in dir ${__dirname}\n@ ${new Date().toISOString()}`)
})
