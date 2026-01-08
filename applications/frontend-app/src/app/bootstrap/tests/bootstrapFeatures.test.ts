import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bootstrapFeatures } from '../bootstrapFeatures';
import type { RouteRecordRaw } from 'vue-router';

// Mock bootstrapNotes
vi.mock('@/domains/notes', () => {
  return {
    bootstrapNotes: vi.fn(),
  };
});

describe('bootstrapFeatures', () => {
  let mockRouter: {
    addRoute: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRouter = {
      addRoute: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it('should add routes from bootstrapNotes to router', async () => {
    // Arrange
    const { bootstrapNotes } = await import('@/domains/notes');
    const mockRoutes: RouteRecordRaw[] = [
      {
        path: '/notes',
        name: 'notes-list',
        component: () => Promise.resolve({}),
      },
    ];
    
    vi.mocked(bootstrapNotes).mockReturnValue({
      routes: mockRoutes,
      useStore: {} as any,
      createSearchDebouncer: () => () => {},
      getCurrentTimeProvider: () => ({
        getCurrentTime: () => new Date(),
        getTimezone: () => 'UTC'
      }),
    });

    // Act
    bootstrapFeatures(mockRouter as any);

    // Assert
    expect(bootstrapNotes).toHaveBeenCalledTimes(1);
    expect(mockRouter.addRoute).toHaveBeenCalledTimes(1);
    expect(mockRouter.addRoute).toHaveBeenCalledWith(mockRoutes[0]);
  });
});