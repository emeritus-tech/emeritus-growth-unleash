import { render } from 'utils/testRenderer';
import { Route, Routes } from 'react-router-dom';
import { ProjectFeatureToggles } from './ProjectFeatureToggles';
import { testServerRoute, testServerSetup } from 'utils/testServer';
import { screen, fireEvent } from '@testing-library/react';
import { BATCH_SELECTED_COUNT } from 'utils/testIds';

const server = testServerSetup();

const setupApi = () => {
    const features = [
        {
            name: 'featureA',
            tags: [{ type: 'backend', value: 'sdk' }],
            type: 'operational',
            createdBy: { id: 1, name: 'author' },
        },
        {
            name: 'featureB',
            type: 'release',
            createdBy: { id: 1, name: 'author' },
        },
    ];
    testServerRoute(server, '/api/admin/search/features', {
        features,
        total: features.length,
    });
    testServerRoute(server, '/api/admin/ui-config', {
        flags: {
            flagCreator: true,
        },
    });
    testServerRoute(server, '/api/admin/tags', {
        tags: [{ type: 'backend', value: 'sdk' }],
    });
    testServerRoute(server, '/api/admin/projects/default/flag-creators', [
        { id: 1, name: 'AuthorA' },
        { id: 2, name: 'AuthorB' },
    ]);
};

test('selects project features', async () => {
    setupApi();
    render(
        <Routes>
            <Route
                path={'/projects/:projectId'}
                element={
                    <ProjectFeatureToggles
                        environments={['development', 'production']}
                    />
                }
            />
        </Routes>,
        {
            route: '/projects/default',
        },
    );
    await screen.findByText('featureA');
    await screen.findByText('featureB');
    await screen.findByText('Feature flags (2)');

    const [selectAll, selectFeatureA, selectFeatureB] =
        screen.queryAllByRole('checkbox');

    // batch select
    selectAll.click();
    let selectedCount = screen.getByTestId(BATCH_SELECTED_COUNT);
    expect(selectedCount.textContent).toBe('2');

    // batch deselect
    selectAll.click();
    expect(screen.queryByTestId(BATCH_SELECTED_COUNT)).not.toBeInTheDocument();

    // select a single item
    selectFeatureA.click();
    selectedCount = screen.getByTestId(BATCH_SELECTED_COUNT);
    expect(selectedCount.textContent).toBe('1');

    // deselect a single item
    selectFeatureA.click();
    expect(screen.queryByTestId(BATCH_SELECTED_COUNT)).not.toBeInTheDocument();
});

test('filters by tag', async () => {
    setupApi();
    render(
        <Routes>
            <Route
                path={'/projects/:projectId'}
                element={
                    <ProjectFeatureToggles
                        environments={['development', 'production']}
                    />
                }
            />
        </Routes>,
        {
            route: '/projects/default',
        },
    );
    const tag = await screen.findByText('backend:sdk');

    tag.click();

    await screen.findByText('include');
    expect(screen.getAllByText('backend:sdk')).toHaveLength(2);
});

test('filters by flag type', async () => {
    setupApi();
    render(
        <Routes>
            <Route
                path={'/projects/:projectId'}
                element={
                    <ProjectFeatureToggles
                        environments={['development', 'production']}
                    />
                }
            />
        </Routes>,
        {
            route: '/projects/default',
        },
    );
    await screen.findByText('featureA');
    const [icon] = await screen.getAllByTestId('feature-type-icon');

    fireEvent.click(icon);

    await screen.findByText('Flag type');
    await screen.findByText('Operational');
});

test('filters by flag author', async () => {
    setupApi();
    render(
        <Routes>
            <Route
                path={'/projects/:projectId'}
                element={
                    <ProjectFeatureToggles
                        environments={['development', 'production']}
                    />
                }
            />
        </Routes>,
        {
            route: '/projects/default',
        },
    );
    const addFilter = await screen.findByText('Add Filter');
    fireEvent.click(addFilter);

    const createdBy = await screen.findByText('Created by');
    fireEvent.click(createdBy);

    const authorA = await screen.findByText('AuthorA');
    fireEvent.click(authorA);

    expect(window.location.href).toContain('createdBy=IS%3A1');
});
