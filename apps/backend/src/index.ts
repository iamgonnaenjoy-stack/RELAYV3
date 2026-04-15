import 'dotenv/config'
import { buildApp } from './app'

const PORT = Number(process.env.PORT) || 4000
const HOST = '0.0.0.0'

async function main() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    console.log(`🚀 Relay backend running on http://${HOST}:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
