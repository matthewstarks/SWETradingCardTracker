{/* Used Claude to help replace hardcoded data with actual APIs for image display, as well as debug vault and filters updates */ }

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ShoppingCart } from 'lucide-react';
import { useVault } from '../context/VaultContext';

// ── API helpers ──────────────────────────────────────────────────────────────

async function fetchPokemon(query) {
    const q = query ? `name:${query}*` : 'supertype:Pokémon set.series:"Scarlet & Violet"';
    const res = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=100&orderBy=-cardmarket.prices.averageSellPrice`
    );
    const data = await res.json();
    return (data.data || []).map(c => {
        const tcg = c.tcgplayer?.prices;
        const price =
            c.cardmarket?.prices?.averageSellPrice ||
            tcg?.holofoil?.market ||
            tcg?.reverseHolofoil?.market ||
            tcg?.normal?.market ||
            tcg?.['1stEditionHolofoil']?.market ||
            tcg?.unlimitedHolofoil?.market ||
            null;

        return {
            id: `pokemon-${c.id}`,
            apiId: c.id,
            name: c.name,
            game: 'Pokémon',
            gameId: 'pokemon',
            type: c.supertype || 'Single Card',
            price,
            image: c.images?.small,
            set: c.set?.name,
        };
    });
}

async function fetchMTG(query) {
    const q = query ? `${query} game:paper` : 'is:mythic game:paper';
    const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=edhrec&page=1`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).slice(0, 100).map(c => ({
        id: `mtg-${c.id}`,
        apiId: c.id,
        name: c.name,
        game: 'Magic: The Gathering',
        gameId: 'mtg',
        type: c.type_line?.split('—')[0]?.trim() || 'Single Card',
        price: c.prices?.usd ? parseFloat(c.prices.usd) : 4.99,
        image: c.image_uris?.small || c.card_faces?.[0]?.image_uris?.small,
        set: c.set_name,
    }));
}

async function fetchYGO(query) {
    const url = query
        ? `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&num=100&offset=0`
        : `https://db.ygoprodeck.com/api/v7/cardinfo.php?staple=yes&sort=name&num=100&offset=0`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.data || []).map(c => ({
        id: `yugioh-${c.id}`,
        apiId: String(c.id),
        name: c.name,
        game: 'Yu-Gi-Oh!',
        gameId: 'yugioh',
        type: c.type || 'Single Card',
        price: c.card_prices?.[0]?.tcgplayer_price
            ? parseFloat(c.card_prices[0].tcgplayer_price)
            : null,
        image: c.card_images?.[0]?.image_url_small,
        set: c.card_sets?.[0]?.set_name,
    }));
}

const GAME_LABELS = {
    pokemon: 'Pokémon',
    mtg: 'Magic: The Gathering',
    yugioh: 'Yu-Gi-Oh!',
};

const ALL_GAMES = Object.keys(GAME_LABELS);

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const gameParam = searchParams.get('game') || '';

    const { addToVault } = useVault();

    // Track whether the user has manually interacted with filters
    const userInteracted = useRef(false);
    const [selectedGames, setSelectedGames] = useState(() => gameParam ? [gameParam] : []);
    const [allResults, setAllResults] = useState([]);
    const [loading, setLoading] = useState(false);
    // If no filters are selected, show all results. Otherwise, filter by selected games. We don't want to refetch every time.
    const results = selectedGames.length > 0
        ? allResults.filter(item => selectedGames.includes(item.gameId))
        : allResults;
    const [sortOrder, setSortOrder] = useState('relevance');
    const [addedIds, setAddedIds] = useState(new Set());

    // Sync filter when URL game param changes (e.g. clicking a category from Home),
    // but only if the user hasn't manually touched the filter
    useEffect(() => {
        if (!userInteracted.current && gameParam) {
            setSelectedGames([gameParam]);
        }
    }, [gameParam]);

    const toggleGame = (g) => {
        userInteracted.current = true;
        setSelectedGames(prev =>
            prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
        );
    };

    const resetFilters = () => {
        userInteracted.current = true;
        setSelectedGames([]);
    };

    const loadResults = useCallback(async () => {
    setLoading(true);
    try {
        const fetches = ALL_GAMES.map(g => {
            if (g === 'pokemon') return fetchPokemon(query);
            if (g === 'mtg') return fetchMTG(query);
            if (g === 'yugioh') return fetchYGO(query);
            return Promise.resolve([]);
        });
        const batches = await Promise.allSettled(fetches);
        const all = batches.flatMap(b => b.status === 'fulfilled' ? b.value : []);
        setAllResults(all);  // <-- store everything
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
}, [query]);

    useEffect(() => { loadResults(); }, [loadResults]);

    const sorted = [...results].sort((a, b) => {
        if (sortOrder === 'price-asc') return a.price - b.price;
        if (sortOrder === 'price-desc') return b.price - a.price;
        if (sortOrder === 'alpha-asc') return a.name.localeCompare(b.name);
        if (sortOrder === 'alpha-desc') return b.name.localeCompare(a.name);
        return 0;
    });

    const handleQuickAdd = (e, item) => {
        e.preventDefault();
        addToVault({
            apiId: item.apiId,
            gameId: item.gameId,
            name: item.name,
            game: item.game,
            set: item.set,
            condition: 'NM',
            price: item.price,
            quantity: 1,
            image: item.image,
        });
        setAddedIds(prev => new Set([...prev, item.id]));
        setTimeout(() => setAddedIds(prev => { const n = new Set(prev); n.delete(item.id); return n; }), 1500);
    };

    const activeFilterCount = selectedGames.length;
    const title = query
        ? `Search Results for "${query}"`
        : activeFilterCount === 1
            ? `Browsing ${GAME_LABELS[selectedGames[0]] || selectedGames[0]}`
            : 'All Products';

    return (
        <div className="container animate-fade-in" style={{ display: 'flex', gap: '40px' }}>
            {/* Sidebar */}
            <aside style={{ flex: '0 0 260px' }}>
                <div className="glass" style={{ padding: '32px', position: 'sticky', top: '100px' }}>
                    <div className="flex-between mb-8">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
                            <Filter size={20} className="text-accent" /> Filters
                        </h3>
                        {activeFilterCount > 0 && (
                            <button onClick={resetFilters} style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                Reset ({activeFilterCount})
                            </button>
                        )}
                    </div>

                    <div className="mb-8">
                        <h4 className="mb-4" style={{ fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                            Trading Game
                            <span style={{ marginLeft: '8px', fontSize: '0.85rem', fontWeight: '400', opacity: 0.6 }}>
                                {activeFilterCount === 0 ? '(all)' : ''}
                            </span>
                        </h4>
                        <div className="flex-col gap-3">
                            {ALL_GAMES.map(g => (
                                <label key={g} style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', fontSize: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedGames.includes(g)}
                                        onChange={() => toggleGame(g)}
                                    />
                                    {GAME_LABELS[g]}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div style={{ flex: '1' }}>
                <div className="flex-between mb-8" style={{ alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{title}</h2>
                        <span className="text-secondary" style={{ fontSize: '1.1rem' }}>
                            {loading ? 'Loading...' : `${sorted.length} Results`}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <span className="text-secondary" style={{ fontSize: '1rem', fontWeight: '500' }}>Sort by:</span>
                        <select
                            className="input-field"
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value)}
                            style={{ padding: '8px 12px', backgroundColor: 'transparent', border: '1px solid #000', cursor: 'pointer' }}
                        >
                            <option value="relevance">Relevance</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="alpha-asc">Name: A to Z</option>
                            <option value="alpha-desc">Name: Z to A</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="glass" style={{ height: '380px', opacity: 0.3, background: '#eee' }} />
                        ))}
                    </div>
                ) : (
                    <div className="grid-cards">
                        {sorted.map((item) => (
                            <Link
                                to={`/product/${item.gameId}/${item.apiId}`}
                                key={item.id}
                                className="glass glass-interactive"
                                style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textDecoration: 'none' }}
                            >
                                <div style={{ height: '280px', background: '#f5f5f5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1) rotate(2deg)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                        />
                                    ) : (
                                        <span className="text-secondary">No Image</span>
                                    )}
                                </div>
                                <div style={{ padding: '24px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--accent-2)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {item.game}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', background: '#eaeaea', padding: '2px 8px', borderRadius: '12px', color: '#000' }}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <h3 style={{ marginBottom: '8px', flex: '1', fontSize: '1.2rem', lineHeight: '1.3' }}>{item.name}</h3>
                                    {item.set && (
                                        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>{item.set}</p>
                                    )}

                                    <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="text-secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Market Price</span>
                                            <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                                                ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <button
                                            className="btn btn-primary btn-icon"
                                            onClick={e => handleQuickAdd(e, item)}
                                            title="Add to Vault"
                                            style={{
                                                background: addedIds.has(item.id) ? '#16a34a' : undefined,
                                                borderColor: addedIds.has(item.id) ? '#16a34a' : undefined,
                                                transition: 'background 0.3s',
                                            }}
                                        >
                                            {addedIds.has(item.id) ? '✓' : <ShoppingCart size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && sorted.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '1.4rem' }}>No results found. Try a different search or game filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
