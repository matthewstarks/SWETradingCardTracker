{/* Used Claude to debug integration of working and maintained vault */}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, List, Clock } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { totalCount } = useVault();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue) {
      setIsSearchFocused(false);
      navigate(`/search?q=${searchValue}`);
    }
  };

  const recentSearches = ['Charizard Base Set', 'Black Lotus', 'Booster Boxes'];

  return (
    <nav className="navbar">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Link to="/" className="nav-logo text-accent" style={{ fontSize: '1.8rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 0', textDecoration: 'none' }}>
          <span style={{ fontWeight: '800' }}>CardIndex</span>
        </Link>

        <div style={{ position: 'relative', flex: '0 1 400px' }}>
          <form onSubmit={handleSearch} className="search-bar" style={{ width: '100%', display: 'flex', zIndex: 100, position: 'relative' }}>
            <Search size={18} className="text-secondary" />
            <input
              type="text"
              name="search"
              placeholder="Search cards, sets, or games..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
          </form>

          {isSearchFocused && (
            <div className="glass" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, padding: '16px 0', zIndex: 99, borderRadius: '12px' }}>
              <div style={{ padding: '0 16px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Recent Searches
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recentSearches.map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => { setSearchValue(s); navigate(`/search?q=${s}`); }}
                      style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <Clock size={16} className="text-secondary" />
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="nav-actions">
          <Link to="/profile" className="btn" style={{ padding: '10px 16px' }}>
            <User size={20} />
            <span style={{ fontSize: '1.1rem' }}>Profile</span>
          </Link>
          <Link to="/list" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '1.1rem' }}>
            <List size={20} />
            Vault
            {totalCount > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '20px', fontSize: '14px', marginLeft: '6px', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>
                {totalCount}
              </div>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
