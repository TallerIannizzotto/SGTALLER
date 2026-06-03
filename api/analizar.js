export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada en Vercel' })

  try {
    const { messages, model } = req.body

    // Convertir formato Anthropic → Gemini
    const geminiParts = []

    for (const msg of messages) {
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text') {
            geminiParts.push({ text: part.text })
          } else if (part.type === 'image' && part.source?.data) {
            geminiParts.push({
              inlineData: {
                mimeType: part.source.media_type || 'image/jpeg',
                data: part.source.data
              }
            })
          }
        }
      } else if (typeof msg.content === 'string') {
        geminiParts.push({ text: msg.content })
      }
    }

    const geminiBody = {
      contents: [{ role: 'user', parts: geminiParts }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
      }
    }

    const geminiModel = 'gemini-1.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Error de Gemini' })
    }

    // Convertir respuesta Gemini → formato Anthropic (para compatibilidad)
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return res.status(200).json({
      content: [{ type: 'text', text }]
    })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
