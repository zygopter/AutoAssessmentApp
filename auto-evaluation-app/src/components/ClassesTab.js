// src/components/ClassesTab.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { Spinner } from "./ui/spinner";
import { useCompetences } from '../contexts/CompetencesContext';
import toast from 'react-hot-toast';


const ClassesTab = () => {
  const navigate = useNavigate();
  const { classes, addClass, deleteClassById, isLoading, error } = useCompetences();
  const [newClass, setNewClass] = useState({ name: '', year: '' });
  const [localClasses, setLocalClasses] = useState([]);

  useEffect(() => {
    console.log('[ClassesTab] classes from context:', classes);
    setLocalClasses(classes);
  }, [classes]);

  useEffect(() => {
    console.log('[ClassesTab] localClasses updated:', localClasses);
  }, [localClasses]);

  const handleAddClass = async () => {
    console.log('[ClassesTab] handleAddClass called with:', newClass);
    if (!newClass.name) {
      console.warn('[ClassesTab] newClass.name is empty, aborting');
      return;
    }
    // 1) calcul de l’année académique
    const now = new Date();
    const y = now.getFullYear();
    const month = now.getMonth() + 1;
    const academicYear = month >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;

    const payload = { name: newClass.name, year : academicYear };
    console.log('[ClassesTab] 📦 payload envoyé à addClass:', payload);

    try {
      const addedClass = await addClass(payload);
      console.log('[ClassesTab] ✅ addClass response:', addedClass);
      setLocalClasses(prev => [...prev, addedClass]);
      setNewClass({ name: '', year: '' });
      toast.success("Classe ajoutée avec succès");
    } catch (err) {
      console.error('[ClassesTab] ❌ error adding class:', err);
      toast.error(`Erreur lors de l'ajout de la classe : ${err.message}`);
    }
  };

  const handleDeleteClass = async (id) => {
    try {
      await deleteClassById(id);
      console.log('[ClassesTab] deleteClassById succeeded for id:', id);
      setLocalClasses(prev => prev.filter(cls => cls.id !== id));
      toast.success("Classe supprimée avec succès");
    } catch (err) {
      console.error('[ClassesTab] error deleting class:', err);
      toast.error(`Erreur lors de la suppression de la classe : ${err.message}`);
    }
  };

  if (isLoading) {
    console.log('[ClassesTab] isLoading = true');
    return <Spinner />;
  }
  if (error) {
    console.log('[ClassesTab] error:', error);
    return <div className="text-red-500">Erreur : {error}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Gestion des classes</h2>

      {/* Formulaire d'ajout de classe */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Ajouter une nouvelle classe</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            className="mb-2"
            placeholder="Nom de la classe"
            value={newClass.name}
            onChange={(e) => {
              console.log('[ClassesTab] newClass.name change:', e.target.value);
              setNewClass({ ...newClass, name: e.target.value });
            }}
          />
          <Button onClick={handleAddClass}>Ajouter la classe</Button>
        </CardContent>
      </Card>

      {/* Liste des classes */}
      {localClasses && localClasses.length > 0 ? (
        localClasses.map((cls) => (
          <Card key={cls.id} className="mb-2">
            <CardHeader>
              <CardTitle>{cls.name} - {cls.year}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Nombre d'élèves : {cls.students ? cls.students.length : 0}</p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => {
                  console.log('[ClassesTab] navigate to class detail:', cls.id);
                  navigate(`/teacher/classes/${cls.id}`);
                }}
                className="mr-2"
              >
                Voir les détails
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteClass(cls.id)}
              >
                Supprimer
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <p>Aucune classe n'a été créée pour le moment.</p>
      )}
    </div>
  );
};

export default ClassesTab;
