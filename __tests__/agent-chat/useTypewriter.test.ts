import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from '@/app/dashboard/agent/_hooks/useTypewriter';

describe('useTypewriter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns full text immediately when active is false', () => {
    const { result } = renderHook(() => useTypewriter('hello world', false));
    expect(result.current).toBe('hello world');
  });

  it('starts empty when active is true', () => {
    const { result } = renderHook(() => useTypewriter('abc', true));
    expect(result.current).toBe('');
  });

  it('reveals one character per 18ms when active', () => {
    const { result } = renderHook(() => useTypewriter('abc', true));
    act(() => { jest.advanceTimersByTime(18); });
    expect(result.current).toBe('a');
    act(() => { jest.advanceTimersByTime(18); });
    expect(result.current).toBe('ab');
    act(() => { jest.advanceTimersByTime(18); });
    expect(result.current).toBe('abc');
  });

  it('completes at full text length and stops advancing', () => {
    const { result } = renderHook(() => useTypewriter('hi', true));
    act(() => { jest.advanceTimersByTime(18 * 20); });
    expect(result.current).toBe('hi');
  });

  it('returns full text immediately when active is false from the start', () => {
    const { result } = renderHook(() => useTypewriter('test content', false));
    expect(result.current).toBe('test content');
  });
});
