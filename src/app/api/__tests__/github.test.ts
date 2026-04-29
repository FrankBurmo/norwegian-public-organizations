import getNumberOfPublicRepos from '../github'

const mockRequest = jest.fn()

jest.mock('@octokit/core', () => ({
    Octokit: {
        plugin: jest.fn().mockReturnValue(
            Object.assign(
                jest.fn().mockImplementation(() => ({
                    request: mockRequest,
                })),
                {
                    defaults: jest.fn().mockReturnValue(
                        jest.fn().mockImplementation(() => ({
                            request: mockRequest,
                        }))
                    ),
                }
            )
        ),
    },
}))

jest.mock('@octokit/plugin-paginate-rest', () => ({
    paginateRest: jest.fn(),
}))

jest.mock('@octokit/plugin-retry', () => ({
    retry: jest.fn(),
}))

jest.mock('next/cache', () => ({
    // Simplified mock: returns the function directly, bypassing caching
    unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

describe('getNumberOfPublicRepos', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns the number of public repos for a valid org', async () => {
        mockRequest.mockResolvedValue({
            data: { public_repos: 42 },
        })

        const result = await getNumberOfPublicRepos('navikt')

        expect(result).toBe(42)
        expect(mockRequest).toHaveBeenCalledWith(
            'GET /orgs/navikt',
            expect.objectContaining({
                headers: { 'X-GitHub-Api-Version': '2022-11-28' },
            })
        )
    })

    it('returns 0 when the request throws an error', async () => {
        mockRequest.mockRejectedValue(new Error('Not Found'))

        const result = await getNumberOfPublicRepos('non-existent-org')

        expect(result).toBe(0)
    })
})
