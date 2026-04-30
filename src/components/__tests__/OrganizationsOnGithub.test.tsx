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
    {id: 3, name: 'Statens vegvesen', url: 'https://github.com/nvdb-vegdata', owner: 'nvdb-vegdata'},
    {id: 4, name: 'Statens vegvesen', url: 'https://github.com/vegvesen', owner: 'vegvesen'},
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
        mockGetNumberOfPublicRepos.mockResolvedValue(0)

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

    it('groups organizations with the same name and sums their repo counts', async () => {
        mockGetNumberOfPublicRepos.mockImplementation((owner: string) => {
            if (owner === 'nvdb-vegdata') return Promise.resolve(50)
            if (owner === 'vegvesen') return Promise.resolve(30)
            return Promise.resolve(0)
        })

        render(<OrganizationsOnGithub/>)

        await waitFor(() => {
            // Group name shown as plain text (not a standalone link)
            expect(screen.getByText('Statens vegvesen')).toBeInTheDocument()
            // Individual GitHub org links shown under the group
            expect(screen.getByRole('link', {name: 'nvdb-vegdata'})).toHaveAttribute('href', 'https://github.com/nvdb-vegdata')
            expect(screen.getByRole('link', {name: 'vegvesen'})).toHaveAttribute('href', 'https://github.com/vegvesen')
            // Summed repo count: 50 + 30 = 80
            expect(screen.getByText('80')).toBeInTheDocument()
        })
    })

    it('ranks grouped organization by total repos across all its orgs', async () => {
        mockGetNumberOfPublicRepos.mockImplementation((owner: string) => {
            if (owner === 'navikt') return Promise.resolve(40)
            if (owner === 'nvdb-vegdata') return Promise.resolve(50)
            if (owner === 'vegvesen') return Promise.resolve(30)
            return Promise.resolve(0)
        })

        render(<OrganizationsOnGithub/>)

        await waitFor(() => {
            const rows = screen.getAllByRole('row')
            // Statens vegvesen total: 80 > navikt: 40, so grouped org ranks first
            expect(rows[1]).toHaveTextContent('Statens vegvesen')
        })
    })
})
