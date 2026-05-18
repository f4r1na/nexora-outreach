import { render, screen } from "@testing-library/react"
import DataCard from "@/app/dashboard/_components/data-card"
import DraftCard from "@/app/dashboard/_components/draft-card"
import ThinkingIndicator from "@/app/dashboard/_components/thinking-indicator"
import { AgentProvider } from "@/contexts/agent-context"

const ITEMS = [
  { id: "1", title: "James Chen", subtitle: "DataFlow", meta: "9.2", status: "orange" as const },
  { id: "2", title: "Sarah Kim",  subtitle: "CloudSync", meta: "8.7", status: "yellow" as const },
]

test("DataCard renders header and rows", () => {
  render(<DataCard header="Top signals" items={ITEMS} actions={[]} />)
  expect(screen.getByText("Top signals")).toBeInTheDocument()
  expect(screen.getByText("James Chen")).toBeInTheDocument()
  expect(screen.getByText("Sarah Kim")).toBeInTheDocument()
})

test("DraftCard renders subject and body", () => {
  render(<DraftCard subject="Hello James" body="Quick intro..." actions={[]} />)
  expect(screen.getByText(/Hello James/)).toBeInTheDocument()
  expect(screen.getByText("Quick intro...")).toBeInTheDocument()
})

test("ThinkingIndicator renders task text", () => {
  render(
    <AgentProvider>
      <ThinkingIndicator taskText="Scanning signals..." />
    </AgentProvider>
  )
  expect(screen.getByText("Scanning signals...")).toBeInTheDocument()
})
