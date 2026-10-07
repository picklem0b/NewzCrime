import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getItem, setItem, removeItem } = vi.hoisted(() => ({
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn()
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
	default: { getItem, setItem, removeItem }
}));

const { useRecentSearchesStore } = await import('.././search.store');

const STORAGE_KEY = 'newzcrime.recent-searches.v1';

beforeEach(() => {
	getItem.mockReset();
	setItem.mockReset();
	removeItem.mockReset();
	useRecentSearchesStore.setState({ terms: [], isHydrated: false });
});

describe('recent searches', () => {
	it('puts the newest term first and persists the list', () => {
		const { add } = useRecentSearchesStore.getState();

		add('Pistorius');
		add('Zondo');

		expect(useRecentSearchesStore.getState().terms).toEqual([
			'Zondo',
			'Pistorius'
		]);
		expect(setItem).toHaveBeenLastCalledWith(
			STORAGE_KEY,
			JSON.stringify(['Zondo', 'Pistorius'])
		);
	});

	it('moves a repeated term to the front without duplicating it', () => {
		const { add } = useRecentSearchesStore.getState();

		add('Zondo');
		add('Pistorius');
		add('zondo');

		expect(useRecentSearchesStore.getState().terms).toEqual([
			'zondo',
			'Pistorius'
		]);
	});

	it('ignores terms shorter than two characters', () => {
		useRecentSearchesStore.getState().add(' a ');

		expect(useRecentSearchesStore.getState().terms).toEqual([]);
		expect(setItem).not.toHaveBeenCalled();
	});

	it('keeps at most eight terms', () => {
		const { add } = useRecentSearchesStore.getState();

		for (let index = 0; index < 12; index += 1) add(`term ${index}`);

		expect(useRecentSearchesStore.getState().terms).toHaveLength(8);
		expect(useRecentSearchesStore.getState().terms[0]).toBe('term 11');
	});

	it('removes one term and clears them all', () => {
		const store = useRecentSearchesStore.getState();

		store.add('alpha');
		store.add('bravo');
		store.remove('alpha');
		expect(useRecentSearchesStore.getState().terms).toEqual(['bravo']);

		store.clear();
		expect(useRecentSearchesStore.getState().terms).toEqual([]);
		expect(removeItem).toHaveBeenCalledWith(STORAGE_KEY);
	});

	it('restores stored terms and ignores corrupt data', async () => {
		getItem.mockResolvedValueOnce(JSON.stringify(['alpha', 7, 'bravo']));
		await useRecentSearchesStore.getState().hydrate();
		expect(useRecentSearchesStore.getState().terms).toEqual([
			'alpha',
			'bravo'
		]);

		getItem.mockResolvedValueOnce('{not json');
		await useRecentSearchesStore.getState().hydrate();
		expect(useRecentSearchesStore.getState().isHydrated).toBe(true);
	});
});
