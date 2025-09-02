import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './pages/Login';
import Exams from './pages/Exams';
import ExamDetail from './pages/ExamDetail';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/exams"
            element={
              <ProtectedRoute>
                <Exams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:id"
            element={
              <ProtectedRoute>
                <ExamDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/exams" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

