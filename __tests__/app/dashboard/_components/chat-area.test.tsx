import { render, screen } from "@testing-library/react"
import ChatArea from "@/app/dashboard/_components/chat-area"
import { AgentProvider } from "@/contexts/agent-context"

global.fetch = jest.fn().mockResolvedValue({ ok: false, body: null })
window.HTMLElement.prototype.scrollIntoView = jest.fn()

test("renders greeting with user name", () => {
  render(
    <AgentProvider>
      <ChatArea userName="Gustavo" />
    </AgentProvider>
  )
  expect(screen.getByText(/Gustavo/)).toBeInTheDocument()
})

test("renders context tags", () => {
  render(
    <AgentProvider>
      <ChatArea userName="Gustavo" />
    </AgentProvider>
  )
  expect(screen.getByText("Campaigns")).toBeInTheDocument()
  expect(screen.getByText("Inbox")).toBeInTheDocument()
})

test("renders input textarea", () => {
  render(
    <AgentProvider>
      <ChatArea userName="Gustavo" />
    </AgentProvider>
  )
  expect(screen.getByPlaceholderText(/Ask anything/i)).toBeInTheDocument()
})
