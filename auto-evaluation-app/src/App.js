import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import LoginPage         from './components/LoginPage'
import RegisterPage      from './components/RegisterPage'
import TeacherPage       from './pages/TeacherPage'
import ClassesTab        from './pages/ClassesPage'
import ClassDetail       from './components/ClassDetail'
import CompetencesTab    from './pages/CompetencesPage'
import FormsTab          from './pages/FormsPage'
import FormPreview       from './components/FormPreview'
import StudentPage       from './components/StudentPage'
import StudentFormFill   from './components/StudentFormFill'
import ConfirmationPage  from './components/ConfirmationPage'
import TopBar            from './components/TopBar'

import { useAuth } from './contexts/AuthContext';
import { AuthConsumer } from './contexts/AuthContext';
import { CompetencesProvider } from './contexts/CompetencesContext';


function App() {
  const { user, logout } = useAuth();

  return (
    <Router>
      <AuthConsumer>
        {({ isLoggedIn, user, logout }) => (
          <CompetencesProvider>
            <Toaster position="bottom-center" />
            <div className="App flex flex-col h-screen">
              {isLoggedIn && user && (
                <TopBar
                  user={user}
                  onLogout={logout}
                  title={user.role === 'teacher' ? "Tableau de bord du professeur" : "Page de l'élève"}
                />
              )}
              <div className="flex-grow overflow-auto">
                <Routes>
                  <Route path="/login" element={isLoggedIn ? <Navigate to={`/${user.role}`} /> : <LoginPage />} />
                  <Route path="/register" element={isLoggedIn ? <Navigate to={`/${user.role}`} /> : <RegisterPage />} />
                  <Route path="formulaires/preview/:formId" element={<FormPreview />} />

                  {isLoggedIn ? (
                    <>
                      <Route path="/teacher" element={<TeacherPage />}>
                        <Route index element={<Navigate to="classes" replace />} />
                        <Route path="classes" element={<ClassesTab />} />
                        <Route path="classes/:classId" element={<ClassDetail />} />
                        <Route path="competences" element={<CompetencesTab />} />
                        <Route path="formulaires" element={<FormsTab />} />
                        {/* <Route path="formulaires/preview/:formId" element={<FormPreview />} /> */}
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
              </div>
            </div>
          </CompetencesProvider>
        )}
      </AuthConsumer>
    </Router>
  );
}

export default App;