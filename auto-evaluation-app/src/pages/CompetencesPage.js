import React from 'react';
import { Spinner } from '../components/ui/spinner';
import { useCompetences } from '../contexts/CompetencesContext';
import { ErrorBanner } from '../components/ui/error-banner';
import CompetencesTabContent from '../components/CompetencesTab';

const CompetencesPage = () => {
  const { isLoading, error } = useCompetences();

  if (isLoading) return <Spinner />;
  return (
    <>
      {error && <ErrorBanner message={error} />}
      <CompetencesTabContent />
    </>
  );
};

export default CompetencesPage;
