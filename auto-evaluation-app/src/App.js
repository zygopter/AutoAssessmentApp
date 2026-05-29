import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import LoginPage         from './components/LoginPage';
import RegisterPage      from './components/RegisterPage';
import TeacherPage       from './pages/TeacherPage';
import ClassesTab        from './pages/ClassesPage';
import ClassDetail       from './components/ClassDetail';
import CompetencesTab    from './pages/CompetencesPage';
import FormsTab          from './pages/FormsPage';
import FormCreate        from './components/FormCreate';
import FormPreview       from './components/FormPreview';
import StudentPage       from './components/StudentPage';
import StudentFormFill   from './components/StudentFormFill';
import ConfirmationPage  from './components/ConfirmationPage';
import AppShell          from './components/AppShell';
import ErrorBoundary     from './components/ErrorBoundary';

import { AuthConsumer } from './contexts/AuthContext';
import { CompetencesProvider } from './contexts/CompetencesContext';


function App() {
  return (
    <Router>
      <AuthConsumer>
        {({ isLoggedIn, user, loading }) => (
          <CompetencesProvider>
            <Toaster position="bottom-center" />
            <ErrorBoundary>
              <AppShell>
                {loading ? (
                  <div
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      minHeight: '60vh',
                      color: 'var(--muted)',
                      fontFamily: 'var(--sans)',
                    }}
                  >
                    Chargement…
                  </div>
                ) : (
                <Routes>
                  <Route path="/login" element={isLoggedIn ? <Navigate to={`/${user.role}`} /> : <LoginPage />} />
                  <Route path="/register" element={isLoggedIn ? <Navigate to={`/${user.role}`} /> : <RegisterPage />} />
                  <Route path="formulaires/preview/:formId" element={<FormPreview />} />

                  {isLoggedIn ? (
                    <>
                      <Route path="/teacher" element={<TeacherPage />}>
                        <Route index element={<ClassesTab />} />
                        <Route path="classes" element={<ClassesTab />} />
                        <Route path="classes/:classId" element={<ClassDetail />} />
                        <Route path="competences" element={<CompetencesTab />} />
                        <Route path="formulaires" element={<FormsTab />} />
                        <Route path="formulaires/new" element={<FormCreate />} />
                      </Route>
                      <Route
                        path="/student"
                        element={user.role === 'student' ? <StudentPage /> : <Navigate to="/login" />}
                      />
                      <Route
                        path="/student/form/:formId"
                        element={user.role === 'student' ? <StudentFormFill /> : <Navigate to="/login" />}
                      />
                      <Route path="/confirmation" element={<ConfirmationPage />} />
                      <Route path="/" element={<Navigate to={`/${user.role}`} replace />} />
                    </>
                  ) : (
                    <Route path="*" element={<Navigate to="/login" />} />
                  )}
                </Routes>
                )}
              </AppShell>
            </ErrorBoundary>
          </CompetencesProvider>
        )}
      </AuthConsumer>
    </Router>
  );
}

export default App;
