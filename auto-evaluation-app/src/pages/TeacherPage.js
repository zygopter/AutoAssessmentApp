import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const TeacherPage = () => {
  const { user } = useAuth();
  const path = useLocation().pathname;

  // Choix de l’onglet actif
  const current = path.includes('classes')
    ? 'classes'
    : path.includes('formulaires')
    ? 'formulaires'
    : 'competences';

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-6">
        <CardHeader className="flex items-center space-x-4">
          <UserCircle size={48} />
          <div>
            <CardTitle className="text-2xl">Bienvenue, {user.name}</CardTitle>
            <p className="text-blue-100">Espace Professeur</p>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={current}>
        <TabsList>
          <TabsTrigger value="classes" asChild>
            <NavLink to="/teacher/classes">Classes</NavLink>
          </TabsTrigger>
          <TabsTrigger value="competences" asChild>
            <NavLink to="/teacher/competences">Compétences</NavLink>
          </TabsTrigger>
          <TabsTrigger value="formulaires" asChild>
            <NavLink to="/teacher/formulaires">Formulaires</NavLink>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
};

export default TeacherPage;
