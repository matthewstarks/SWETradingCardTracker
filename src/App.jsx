{/* Used Claude to help debug change to two parameter route for image display from database and integrate vault with actual added items */ }

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { VaultProvider } from './context/VaultContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ListPage from './pages/List';
import Search from './pages/Search';
import Product from './pages/Product';

function PrivateRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <VaultProvider>
            <Router>
                <Navbar />
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/product/:gameId/:apiId" element={<Product />} />
                        <Route path="/product/:id" element={<Product />} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/list" element={<PrivateRoute><ListPage /></PrivateRoute>} />
                    </Routes>
                </div>
            </Router>
        </VaultProvider>
    );
}

export default App;
