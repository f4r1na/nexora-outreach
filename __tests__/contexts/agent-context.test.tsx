import { render, screen, act } from "@testing-library/react"
import { AgentProvider, useAgent } from "@/contexts/agent-context"

function Probe() {
  const { isWorking, taskText, startWork, stopWork } = useAgent()
  return (
    <div>
      <span data-testid="working">{String(isWorking)}</span>
      <span data-testid="task">{taskText}</span>
      <button onClick={() => startWork("Scanning...")}>start</button>
      <button onClick={stopWork}>stop</button>
    </div>
  )
}

test("starts idle", () => {
  render(<AgentProvider><Probe /></AgentProvider>)
  expect(screen.getByTestId("working").textContent).toBe("false")
  expect(screen.getByTestId("task").textContent).toBe("")
})

test("startWork sets isWorking and taskText", () => {
  render(<AgentProvider><Probe /></AgentProvider>)
  act(() => { screen.getByText("start").click() })
  expect(screen.getByTestId("working").textContent).toBe("true")
  expect(screen.getByTestId("task").textContent).toBe("Scanning...")
})

test("stopWork resets state", () => {
  render(<AgentProvider><Probe /></AgentProvider>)
  act(() => { screen.getByText("start").click() })
  act(() => { screen.getByText("stop").click() })
  expect(screen.getByTestId("working").textContent).toBe("false")
  expect(screen.getByTestId("task").textContent).toBe("")
})

test("useAgent throws outside provider", () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {})
  expect(() => render(<Probe />)).toThrow("useAgent must be used within AgentProvider")
  spy.mockRestore()
})
