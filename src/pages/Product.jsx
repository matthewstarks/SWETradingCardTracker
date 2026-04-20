{/* Used Claude to debug inserting the correct URL pattern to get real card data and integrate working vault */ }

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Check } from 'lucide-react';
import { useVault } from '../context/VaultContext';

async function fetchProductData(gameId, apiId) {
    try {
        if (gameId === 'pokemon') {
            const res = await fetch(`https://api.pokemontcg.io/v2/cards/${apiId}`);
            const data = await res.json();
            const c = data.data;
            if (!c) return null;
            return {
                name: c.name,
                game: 'Pokémon',
                gameId: 'pokemon',
                apiId,
                basePrice: c.cardmarket?.prices?.averageSellPrice || c.tcgplayer?.prices?.holofoil?.market || 9.99,
                type: c.supertype,
                rarity: c.rarity || 'Unknown',
                set: c.set?.name,
                description: `${c.name} is a ${c.rarity || ''} ${c.supertype} from the ${c.set?.name} set. ${c.flavorText || ''}`.trim(),
                image: c.images?.large || c.images?.small,
                artist: c.artist,
            };
        }

        if (gameId === 'mtg') {
            const res = await fetch(`https://api.scryfall.com/cards/${apiId}`);
            const c = await res.json();
            return {
                name: c.name,
                game: 'Magic: The Gathering',
                gameId: 'mtg',
                apiId,
                basePrice: c.prices?.usd ? parseFloat(c.prices.usd) : 4.99,
                type: c.type_line,
                rarity: c.rarity ? c.rarity.charAt(0).toUpperCase() + c.rarity.slice(1) : 'Unknown',
                set: c.set_name,
                description: c.oracle_text || c.flavor_text || 'A powerful Magic: The Gathering card.',
                image: c.image_uris?.large || c.card_faces?.[0]?.image_uris?.large,
                artist: c.artist,
            };
        }

        if (gameId === 'yugioh') {
            const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${apiId}`);
            const data = await res.json();
            const c = data.data?.[0];
            if (!c) return null;
            return {
                name: c.name,
                game: 'Yu-Gi-Oh!',
                gameId: 'yugioh',
                apiId,
                basePrice: c.card_prices?.[0]?.tcgplayer_price ? parseFloat(c.card_prices[0].tcgplayer_price) : 1.99,
                type: c.type,
                rarity: c.card_sets?.[0]?.set_rarity || 'Unknown',
                set: c.card_sets?.[0]?.set_name || 'Unknown Set',
                description: c.desc,
                image: c.card_images?.[0]?.image_url,
                artist: null,
            };
        }
    } catch (e) {
        console.error('Product fetch failed:', e);
        return null;
    }

    return {
        name: `Card ${apiId}`,
        game: gameId,
        gameId,
        apiId,
        basePrice: 9.99,
        type: 'Single Card',
        rarity: 'Rare',
        set: 'Base Set',
        description: 'An authenticated trading card in excellent condition.',
        image: null,
    };
}

const CONDITION_LABELS = [
    ['NM', 'Near Mint'],
    ['LP', 'Lightly Played'],
    ['MP', 'Moderate'],
    ['HP', 'Heavy'],
];

const CONDITION_MULTIPLIERS = { NM: 1, LP: 0.8, MP: 0.6, HP: 0.4 };

export default function Product() {
    const { gameId, apiId, id } = useParams();
    const { addToVault } = useVault();

    // Support legacy /product/:id route
    const resolvedGame = gameId || 'pokemon';
    const resolvedId = apiId || id;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [condition, setCondition] = useState('NM');
    const [added, setAdded] = useState(false);

    useEffect(() => {
        if (!resolvedId) return;
        setLoading(true);
        fetchProductData(resolvedGame, resolvedId).then(p => {
            setProduct(p);
            setLoading(false);
        });
    }, [resolvedGame, resolvedId]);

    const getPrice = () => {
        if (!product) return 0;
        return product.basePrice * (CONDITION_MULTIPLIERS[condition] ?? 1);
    };

    const handleAddToVault = () => {
        if (!product) return;
        addToVault({
            apiId: product.apiId,
            gameId: product.gameId,
            name: product.name,
            game: product.game,
            set: product.set,
            condition,
            price: getPrice(),
            quantity,
            image: product.image,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) {
        return (
            <div className="container animate-fade-in flex-center" style={{ minHeight: '60vh' }}>
                <p className="text-secondary" style={{ fontSize: '1.4rem' }}>Loading card data...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container animate-fade-in flex-center flex-col" style={{ minHeight: '60vh', gap: '24px' }}>
                <p style={{ fontSize: '1.4rem' }}>Card not found.</p>
                <Link to="/search" className="btn btn-primary">Back to Search</Link>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '1400px' }}>
            <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '32px', textDecoration: 'none', color: 'var(--text-secondary)' }}>
                <ArrowLeft size={18} /> Back to Search
            </Link>

            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
                {/* Left: Image */}
                <div className="glass" style={{ flex: '1 1 450px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', background: 'rgba(0,0,0,0.03)' }}>
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}
                        />
                    ) : (
                        <div style={{ width: '300px', height: '420px', background: '#eee', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="text-secondary">No Image Available</span>
                        </div>
                    )}
                </div>

                {/* Middle: Info */}
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <span style={{ fontSize: '1rem', color: 'var(--accent-2)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            {product.game}
                        </span>
                        <h1 className="text-accent" style={{ fontSize: '3rem', lineHeight: '1.2', marginTop: '12px', marginBottom: '24px' }}>
                            {product.name}
                        </h1>
                    </div>

                    <p className="text-secondary" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                        {product.description}
                    </p>

                    <div className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', fontSize: '1.4rem' }}>Card Details</h3>
                        <div className="flex-between">
                            <span className="text-secondary" style={{ fontSize: '1.1rem' }}>Card Type</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{product.type}</span>
                        </div>
                        <div className="flex-between">
                            <span className="text-secondary" style={{ fontSize: '1.1rem' }}>Rarity</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{product.rarity}</span>
                        </div>
                        <div className="flex-between">
                            <span className="text-secondary" style={{ fontSize: '1.1rem' }}>Set</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{product.set}</span>
                        </div>
                        {product.artist && (
                            <div className="flex-between">
                                <span className="text-secondary" style={{ fontSize: '1.1rem' }}>Artist</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{product.artist}</span>
                            </div>
                        )}
                        <div className="flex-between mt-2">
                            <span className="text-secondary" style={{ fontSize: '1.1rem' }}>Status</span>
                            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Verified Authentic</span>
                        </div>
                    </div>
                </div>

                {/* Right: Purchase Panel */}
                <div style={{ flex: '0 0 380px' }}>
                    <div className="glass" style={{ padding: '40px', position: 'sticky', top: '100px', borderTop: '2px solid var(--accent-1)' }}>
                        <div className="mb-8">
                            <h4 className="text-secondary mb-4" style={{ fontSize: '1.2rem' }}>Physical Condition</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {CONDITION_LABELS.map(([val, label]) => (
                                    <button
                                        key={val}
                                        className={`btn ${condition === val ? 'btn-primary' : ''}`}
                                        onClick={() => setCondition(val)}
                                        style={condition !== val ? { background: 'rgba(0,0,0,0.05)' } : {}}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <h4 className="text-secondary mb-4" style={{ fontSize: '1.2rem' }}>Quantity</h4>
                            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '12px 24px', width: 'fit-content' }}>
                                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }} onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                                <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{quantity}</span>
                                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }} onClick={() => setQuantity(q => q + 1)}>+</button>
                            </div>
                        </div>

                        <div className="flex-between mb-8">
                            <span className="text-secondary" style={{ fontSize: '1.2rem' }}>Current Market Value</span>
                            <span className="text-accent" style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                                ${(getPrice() * quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddToVault}
                                style={{
                                    width: '100%', padding: '20px', fontSize: '1.2rem',
                                    display: 'flex', gap: '12px', justifyContent: 'center',
                                    background: added ? '#16a34a' : undefined,
                                    borderColor: added ? '#16a34a' : undefined,
                                    transition: 'background 0.3s, border-color 0.3s',
                                }}
                            >
                                {added ? <Check size={24} /> : <ShoppingCart size={24} />}
                                {added ? 'Added to Vault!' : 'Add to Vault'}
                            </button>
                            <Link to="/list" className="btn" style={{ width: '100%', padding: '20px', fontSize: '1.2rem', display: 'flex', gap: '12px', justifyContent: 'center', textAlign: 'center' }}>
                                View Vault
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
