{/* Used Claude to help replace hardcoded values */ }

import { Link } from 'react-router-dom';
import { Trash2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export default function ListPage() {
    const { items, removeFromVault, updateQuantity } = useVault();

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const groupedItems = items.reduce((groups, item) => {
        const key = item.game || item.gameId || 'Other';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
    }, {});

    if (items.length === 0) {
        return (
            <div className="container animate-fade-in flex-center flex-col" style={{ minHeight: '60vh', textAlign: 'center' }}>
                <div className="glass p-6" style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '500px' }}>
                    <AlertCircle size={80} className="text-secondary mb-6" />
                    <h2 className="mb-4" style={{ fontSize: '2rem' }}>Your Vault is Empty</h2>
                    <p className="text-secondary mb-8" style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
                        Looks like you haven't secured any relics yet. Browse the marketplace and click "Add to Vault" on any card.
                    </p>
                    <Link to="/search" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                        <ShoppingCart size={20} />
                        Browse Relics
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '1400px' }}>
            <h1 className="mb-8 text-accent" style={{ fontSize: '3rem' }}>My Vault</h1>

            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
                {/* Card list, grouped by game */}
                <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {Object.entries(groupedItems).map(([game, gameItems]) => (
                        <div key={game}>
                            <h2 className="mb-4" style={{ fontSize: '1.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                {game}
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {gameItems.map(item => (
                                    <div key={item.id} className="glass glass-interactive" style={{ display: 'flex', padding: '24px', gap: '24px', alignItems: 'center' }}>
                                        {/* Card image */}
                                        <div style={{ width: '80px', height: '112px', borderRadius: '8px', overflow: 'hidden', background: '#f5f5f5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', color: '#999', textAlign: 'center', padding: '4px' }}>No Image</span>
                                            )}
                                        </div>

                                        {/* Card info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                <span className="text-secondary" style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.06)', padding: '3px 10px', borderRadius: '20px' }}>
                                                    {item.condition}
                                                </span>
                                                {item.set && (
                                                    <span className="text-secondary" style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.06)', padding: '3px 10px', borderRadius: '20px' }}>
                                                        {item.set}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 style={{ fontSize: '1.3rem', marginBottom: '12px', lineHeight: '1.3' }}>{item.name}</h3>
                                            <div className="text-accent" style={{ fontWeight: '700', fontSize: '1.4rem' }}>
                                                ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                <span className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: '400', marginLeft: '6px' }}>each</span>
                                            </div>
                                        </div>

                                        {/* Quantity + remove */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                                            <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: '16px', background: 'rgba(0,0,0,0.03)' }}>
                                                <button
                                                    style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                >-</button>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                <button
                                                    style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                >+</button>
                                            </div>
                                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                                                ${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <button
                                                onClick={() => removeFromVault(item.id)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', transition: 'color 0.2s' }}
                                                onMouseOver={e => e.currentTarget.style.color = '#dc2626'}
                                                onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                            >
                                                <Trash2 size={16} /> Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary panel */}
                <div style={{ flex: '0 0 360px' }}>
                    <div className="glass" style={{ padding: '40px', position: 'sticky', top: '100px', borderTop: '2px solid var(--accent-1)' }}>
                        <h3 className="mb-6" style={{ fontSize: '1.6rem' }}>Summary</h3>
                        <div className="flex-between mb-4">
                            <span className="text-secondary" style={{ fontSize: '1.1rem' }}>Subtotal</span>
                            <span style={{ fontSize: '1.2rem' }}>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex-between mb-4">
                            <span className="text-secondary" style={{ fontSize: '1.1rem' }}>Estimated Tax (8%)</span>
                            <span style={{ fontSize: '1.2rem' }}>${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex-between mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <span className="text-secondary" style={{ fontSize: '1.1rem' }}>Shipping</span>
                            <span className="text-accent" style={{ fontSize: '1.1rem' }}>Calculated at checkout</span>
                        </div>
                        <div className="flex-between mb-8">
                            <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Total</span>
                            <span className="text-accent" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                                ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', padding: '20px', fontSize: '1.2rem', letterSpacing: '1px' }}>
                            Checkout
                        </button>
                        <Link to="/search" className="btn" style={{ width: '100%', padding: '16px', fontSize: '1rem', display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                            Continue Browsing
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
