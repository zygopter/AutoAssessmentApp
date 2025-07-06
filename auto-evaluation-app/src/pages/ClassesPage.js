import React from 'react';
import { Spinner } from '../components/ui/spinner';
import { useCompetences } from '../contexts/CompetencesContext';
import { ErrorBanner } from '../components/ui/error-banner';
import ClassesTabContent from '../components/ClassesTab';

const ClassesPage = () => {
  const { isLoading, error } = useCompetences();

  if (isLoading) return <Spinner />;
  return (
    <>
      {error && <ErrorBanner message={error} />}
      <ClassesTabContent />
    </>
  );
};

export default ClassesPage;
