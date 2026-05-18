import { render } from "@testing-library/react"
import GalaxyPanel from "@/app/dashboard/_components/galaxy-panel"
import { AgentProvider } from "@/contexts/agent-context"

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    clearRect: jest.fn(), beginPath: jest.fn(), arc: jest.fn(),
    fill: jest.fn(), stroke: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(),
  })
})

test("renders without crashing", () => {
  const { container } = render(
    <AgentProvider><GalaxyPanel /></AgentProvider>
  )
  expect(container.firstChild).toBeTruthy()
})
