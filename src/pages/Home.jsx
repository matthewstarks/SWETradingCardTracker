{/* used Claude to help write and debug changes for image display and vault persistence */ }

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const CATEGORIES = [
    { id: 'pokemon', name: 'Pokémon', color: '#f59e0b' },
    { id: 'mtg', name: 'Magic: The Gathering', color: '#f97316' },
    { id: 'yugioh', name: 'Yu-Gi-Oh!', color: '#ef4444' },
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
                width: '300px',
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

export default function Home() {

    return (
        <div className="container animate-fade-in">
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 0, pointerEvents: 'none' }}>
                <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', transform: 'scaleY(-1)' }}>
                    <defs>
                        <linearGradient id="waveGradientTop" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="50%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>
                    <path
                        fill="url(#waveGradientTop)"
                        fillOpacity="0.15"
                        d="M0,160 C360,260 1080,60 1440,160 L1440,320 L0,320 Z"
                    />
                    <path
                        fill="url(#waveGradientTop)"
                        fillOpacity="0.25"
                        d="M0,200 C480,100 960,300 1440,200 L1440,320 L0,320 Z"
                    />
                </svg>
            </div>
            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

            <div className="flex-between mb-8" style={{ position: 'relative', zIndex: 1 }}>
                <div>
                    <h1 className="text-accent hover-glow animate-float" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
                        Discover Relics
                    </h1>
                    <p className="text-secondary" style={{ fontSize: '1.2rem', maxWidth: '900px', lineHeight: '1.6' }}>
                        Build and optimize your ultimate collection. Explore authenticated cards from across the multiverse.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', marginBottom: '2rem', marginTop: '6rem' }}>
                {CATEGORIES.map((cat) => (
                    <CategoryCard key={cat.id} cat={cat} />
                ))}
            </div>
            {/* Decorative SVG waves at the bottom, assisted by claude code */  }
            <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 0, pointerEvents: 'none' }}>
                <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="50%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>
                    <path
                        fill="url(#waveGradient)"
                        fillOpacity="0.15"
                        d="M0,160 C360,260 1080,60 1440,160 L1440,320 L0,320 Z"
                    />
                    <path
                        fill="url(#waveGradient)"
                        fillOpacity="0.25"
                        d="M0,200 C480,100 960,300 1440,200 L1440,320 L0,320 Z"
                    />
                </svg>
            </div>
        </div>
    );
}
