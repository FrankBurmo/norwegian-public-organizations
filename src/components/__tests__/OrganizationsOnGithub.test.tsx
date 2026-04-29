import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import {OrganizationsOnGithub} from '../OrganizationsOnGithub'
import getNumberOfPublicRepos from '../../app/api/github'

jest.mock('../../app/api/github', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('../data/organizations.json', () => [
    {id: 1, name: 'Nav Teknologiavdelingen', url: 'https://github.com/navikt', owner: 'navikt'},
    {id: 2, name: 'Skatteetaten', url: 'https://github.com/skatteetaten', owner: 'skatteetaten'},
])

const mockGetNumberOfPublicRepos = jest.mocked(getNumberOfPublicRepos)

describe('OrganizationsOnGithub', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the heading', () => {
        mockGetNumberOfPublicRepos.mockResolvedValue(0)

        render(<OrganizationsOnGithub/>)

        expect(screen.getByText('Norwegian public organizations on GitHub')).toBeInTheDocument()
    })

    it('renders table headers', () => {
        mockGetNumberOfPublicRepos.mockResolvedValue(0)

        render(<OrganizationsOnGithub/>)

        expect(screen.getByText('Rank')).toBeInTheDocument()
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Number of repos')).toBeInTheDocument()
    })

    it('renders organizations with repo counts after data loads', async () => {
        mockGetNumberOfPublicRepos
            .mockResolvedValueOnce(100)
            .mockResolvedValueOnce(50)

        render(<OrganizationsOnGithub/>)

        await waitFor(() => {
            expect(screen.getByText('Nav Teknologiavdelingen')).toBeInTheDocument()
            expect(screen.getByText('Skatteetaten')).toBeInTheDocument()
        })
    })

    it('renders organization links with correct href', async () => {
        mockGetNumberOfPublicRepos.mockResolvedValue(10)

        render(<OrganizationsOnGithub/>)

        await waitFor(() => {
            const naviktLink = screen.getByRole('link', {name: 'Nav Teknologiavdelingen'})
            expect(naviktLink).toHaveAttribute('href', 'https://github.com/navikt')
        })
    })

    it('sorts organizations by number of repos in descending order', async () => {
        mockGetNumberOfPublicRepos
            .mockImplementation((owner) => {
                if (owner === 'navikt') return Promise.resolve(200)
                if (owner === 'skatteetaten') return Promise.resolve(50)
                return Promise.resolve(0)
            })

        render(<OrganizationsOnGithub/>)

        await waitFor(() => {
            const rows = screen.getAllByRole('row')
            // rows[0] is the header row, rows[1] should be the org with most repos
            const firstDataRow = rows[1]
            expect(firstDataRow).toHaveTextContent('Nav Teknologiavdelingen')
        })
    })

    it('renders the GitHub icon link', () => {
        mockGetNumberOfPublicRepos.mockResolvedValue(0)

        render(<OrganizationsOnGithub/>)

        const githubLink = screen.getByRole('link', {name: /Norwegian public organizations repo on Github/i})
        expect(githubLink).toHaveAttribute('href', 'https://github.com/MikAoJk/norwegian-public-organizations')
    })
})
