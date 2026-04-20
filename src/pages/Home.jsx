{/* used Claude to help write and debug changes for image display and vault persistence */ }

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const CATEGORIES = [
    { id: 'pokemon', name: 'Pokémon', color: '#f59e0b' },
    { id: 'mtg', name: 'Magic: The Gathering', color: '#f97316' },
    { id: 'yugioh', name: 'Yu-Gi-Oh!', color: '#ef4444' },
    { id: 'onepiece', name: 'One Piece', color: '#3b82f6' },
    { id: 'lorcana', name: 'Lorcana', color: '#a855f7' },
    { id: 'digimon', name: 'Digimon', color: '#10b981' },
    { id: 'flesh-and-blood', name: 'Flesh and Blood', color: '#f43f5e' },
    { id: 'starwars', name: 'Star Wars', color: '#94a3b8' },
];

// Each fetcher calls the correct game's own API and returns an image URL string.
// Returns null if unavailable so a styled placeholder is shown instead.
const CATEGORY_FETCHERS = {
    pokemon: async () => {
        const r = await fetch('https://api.pokemontcg.io/v2/cards?q=name:charizard&pageSize=1&orderBy=-set.releaseDate');
        const d = await r.json();
        return d.data?.[0]?.images?.large ?? null;
    },
    mtg: async () => {
        const r = await fetch('https://api.scryfall.com/cards/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd');
        const d = await r.json();
        return d.image_uris?.normal ?? null;
    },
    yugioh: async () => {
        const r = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Blue-Eyes%20White%20Dragon');
        const d = await r.json();
        return d.data?.[0]?.card_images?.[0]?.image_url ?? null;
    },
    onepiece: async () => {
        // Unofficial One Piece TCG API
        const r = await fetch('https://apitcg.com/api/one-piece/cards?limit=1&page=1');
        const d = await r.json();
        const card = Array.isArray(d) ? d[0] : d.data?.[0];
        return card?.images?.[0] ?? card?.image ?? null;
    },
    lorcana: async () => {
        // Community Lorcana API
        const r = await fetch('https://api.lorcana-api.com/bulk/cards');
        const d = await r.json();
        const card = Array.isArray(d) ? d[0] : null;
        return card?.Image ?? card?.image ?? null;
    },
    digimon: async () => {
        // Digimon TCG community API
        const r = await fetch('https://digimoncard.io/api-public/search.php?series=Digimon%20Card%20Game&sortBy=cardNumber&sort=ASC&limit=1');
        const d = await r.json();
        const card = Array.isArray(d) ? d[0] : null;
        return card?.image_url ?? card?.image ?? null;
    },
    'flesh-and-blood': async () => {
        // FAB DB API
        const r = await fetch('https://api.fabdb.net/cards?per_page=1&page=1');
        const d = await r.json();
        const card = d.data?.[0] ?? (Array.isArray(d) ? d[0] : null);
        return card?.image ?? card?.thumbnail ?? null;
    },
    starwars: async () => {
        // Star Wars Unlimited DB API
        const r = await fetch('https://api.swu-db.com/cards/search?q=Luke+Skywalker');
        const d = await r.json();
        const card = d.data?.[0] ?? (Array.isArray(d) ? d[0] : null);
        return card?.FrontArt ?? card?.image ?? card?.imageUrl ?? null;
    },
};

function CategoryCard({ cat }) {
    const [imgSrc, setImgSrc] = useState(null);   // null = loading, '' = failed
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetcher = CATEGORY_FETCHERS[cat.id];
        if (!fetcher) { setLoading(false); return; }

        fetcher()
            .then(url => { if (!cancelled) { setImgSrc(url || ''); setLoading(false); } })
            .catch(() => { if (!cancelled) { setImgSrc(''); setLoading(false); } });

        return () => { cancelled = true; };
    }, [cat.id]);

    return (
        <Link
            to={`/search?game=${cat.id}`}
            className="glass glass-interactive"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0',
                textDecoration: 'none',
                borderTop: `4px solid ${cat.color}`,
                borderTopRightRadius: '20px',
                borderTopLeftRadius: '20px',
                overflow: 'hidden',
            }}
        >
            <div style={{
                width: '100%',
                height: '180px',
                background: loading ? '#f0f0f0' : (imgSrc ? '#f7f7f7' : `linear-gradient(135deg, ${cat.color}22, ${cat.color}44)`),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: imgSrc ? '12px' : '0',
                transition: 'background 0.3s',
            }}>
                {loading && (
                    <div style={{ width: '60px', height: '84px', borderRadius: '6px', background: '#ddd', animation: 'pulse 1.5s ease-in-out infinite' }} />
                )}
                {!loading && imgSrc && (
                    <img
                        src={imgSrc}
                        alt={cat.name}
                        onError={() => setImgSrc('')}
                        style={{
                            maxHeight: '100%',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            transition: 'transform 0.3s ease',
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.07)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                )}
                {!loading && !imgSrc && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '48px', height: '68px', borderRadius: '6px', border: `2px solid ${cat.color}`, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.6rem' }}>🃏</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: cat.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {cat.name}
                        </span>
                    </div>
                )}
            </div>
            <div style={{ padding: '16px 20px', width: '100%', textAlign: 'center' }}>
                <h3 style={{ color: 'black', fontWeight: '600', fontSize: '1rem', letterSpacing: '0.02em' }}>
                    {cat.name}
                </h3>
            </div>
        </Link>
    );
}

function useFeaturedCards() {
    const [recentProduct, setRecentProduct] = useState(null);
    const [topSingle, setTopSingle] = useState(null);

    useEffect(() => {
        fetch('https://api.pokemontcg.io/v2/cards?q=name:charizard&pageSize=1&orderBy=-set.releaseDate')
            .then(r => r.json())
            .then(d => { if (d.data?.[0]) setRecentProduct(d.data[0]); })
            .catch(() => { });

        fetch('https://api.scryfall.com/cards/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd')
            .then(r => r.json())
            .then(d => { if (d.image_uris) setTopSingle(d); })
            .catch(() => { });
    }, []);

    return { recentProduct, topSingle };
}

export default function Home() {
    const { recentProduct, topSingle } = useFeaturedCards();

    return (
        <div className="container animate-fade-in">
            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

            <div className="flex-between mb-8">
                <div>
                    <h1 className="text-accent hover-glow animate-float" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
                        Discover Relics
                    </h1>
                    <p className="text-secondary" style={{ fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.6' }}>
                        Build and optimize your ultimate collection. Explore millions of authenticated cards from across the multiverse.
                    </p>
                </div>
            </div>

            <div className="grid-categories mb-8">
                {CATEGORIES.map((cat) => (
                    <CategoryCard key={cat.id} cat={cat} />
                ))}
            </div>

            <div className="flex-between mt-8 mb-6">
                <h2 style={{ fontSize: '2.5rem' }}>Market Activity</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                <Link to="/search?game=pokemon" className="glass glass-interactive" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Recent Product</h3>
                    <p className="text-secondary mb-6 text-center">Browse the newest hits and sealed drops</p>
                    <div style={{ padding: '24px', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '240px', border: '1px solid var(--border-color)' }}>
                        {recentProduct ? (
                            <img src={recentProduct.images?.large || recentProduct.images?.small} alt={recentProduct.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        ) : (
                            <span className="text-secondary">Loading...</span>
                        )}
                    </div>
                    {recentProduct && (
                        <p className="text-secondary" style={{ marginTop: '12px', fontSize: '0.95rem' }}>
                            {recentProduct.name} — {recentProduct.set?.name}
                        </p>
                    )}
                </Link>

                <Link to="/search?game=mtg" className="glass glass-interactive" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Singles</h3>
                    <p className="text-secondary mb-6 text-center">Top graded slabs and verified raw singles</p>
                    <div style={{ padding: '24px', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '240px', border: '1px solid var(--border-color)' }}>
                        {topSingle ? (
                            <img src={topSingle.image_uris?.normal} alt={topSingle.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        ) : (
                            <span className="text-secondary">Loading...</span>
                        )}
                    </div>
                    {topSingle && (
                        <p className="text-secondary" style={{ marginTop: '12px', fontSize: '0.95rem' }}>
                            {topSingle.name} — {topSingle.set_name}
                        </p>
                    )}
                </Link>
            </div>
        </div>
    );
}
