"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, ExternalLink, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "bot"
  content: string
  ticketNumber?: string
  ticketUrl?: string
}

interface WebhookResponse {
  message: string
  ticket_number?: string
  ticket_url?: string
  resolved?: string
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "¡Hola! 👋 ¿Cómo puedo ayudarte hoy?",
    },
  ])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(
        "https://primary-production-c1d08.up.railway.app/webhook/chatbot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
          }),
        }
      )

      const data: WebhookResponse = await response.json()

      console.log("========== RESPUESTA DEL BOT ==========")
      console.log(data.message)

      console.log("========== JSON COMPLETO ==========")
      console.log(data)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: data.message,
        ticketNumber: data.ticket_number,
        ticketUrl: data.ticket_url,
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("ERROR:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: "Lo siento, ocurrió un error. Intenta nuevamente.",
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>

          <div>
            <h1 className="font-semibold text-foreground">
              Support Assistant
            </h1>

            <p className="text-sm text-muted-foreground">
              Siempre aquí para ayudarte
            </p>
          </div>
        </div>
      </header>

      {/* MENSAJES */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user"
                  ? "flex-row-reverse"
                  : "flex-row"
              )}
            >
              {/* ICONO */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "user"
                    ? "bg-accent"
                    : "bg-primary"
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4 text-accent-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-primary-foreground" />
                )}
              </div>

              {/* BURBUJA */}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-card-foreground"
                )}
              >
                {/* TEXTO */}
                <div className="whitespace-pre-line break-words text-sm leading-relaxed">
                  {message.content}
                </div>

                {/* TICKET */}
                {(message.ticketNumber || message.ticketUrl) && (
                  <div className="mt-3 space-y-2 rounded-lg bg-muted p-3">
                    {message.ticketNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Ticket className="h-4 w-4 text-muted-foreground" />

                        <span className="text-muted-foreground">
                          Ticket:
                        </span>

                        <span className="font-mono font-medium text-foreground">
                          {message.ticketNumber}
                        </span>
                      </div>
                    )}

                    {message.ticketUrl && (
                      <a
                        href={message.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ver Ticket
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* LOADING */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />

                <span className="text-sm text-muted-foreground">
                  Pensando...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* INPUT */}
      <footer className="sticky bottom-0 border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-3 rounded-full border border-border bg-background px-4 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />

            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              <span className="sr-only">
                Enviar mensaje
              </span>
            </Button>
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            Presiona Enter para enviar tu mensaje
          </p>
        </div>
      </footer>
    </div>
  )
}