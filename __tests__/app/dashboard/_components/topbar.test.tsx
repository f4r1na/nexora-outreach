import { render, screen } from "@testing-library/react"
import Topbar from "@/app/dashboard/_components/topbar"
import { AgentProvider } from "@/contexts/agent-context"

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: jest.fn() }),
}))

function wrap(ui: React.ReactElement) {
  return render(<AgentProvider>{ui}</AgentProvider>)
}

test("renders logo", () => {
  wrap(<Topbar userName="Gustavo" />)
  expect(screen.getByText("NEXORA")).toBeInTheDocument()
})

test("renders nav items", () => {
  wrap(<Topbar userName="Gustavo" />)
  expect(screen.getByText("Overview")).toBeInTheDocument()
  expect(screen.getByText("Campaigns")).toBeInTheDocument()
  expect(screen.getByText("Inbox")).toBeInTheDocument()
})

test("shows user initial in avatar", () => {
  wrap(<Topbar userName="Gustavo" />)
  expect(screen.getByText("G")).toBeInTheDocument()
})
